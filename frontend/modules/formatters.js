import { API_BASE } from '../api-client.js';
import { CURRENCIES, state, triggerSignOut } from './state.js';

export const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[char]));

export const plural = (count, singular, pluralWord = `${singular}s`) =>
  `${count} ${Number(count) === 1 ? singular : pluralWord}`;

export const statusLabel = (value) => String(value || '').replaceAll('_', ' ');

export const initials = (name) =>
  String(name || 'SF')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'SF';

export function getCurrencyCode() {
  const code = String(state.settings?.currency || 'USD').trim().toUpperCase();
  return CURRENCIES[code] ? code : 'USD';
}

export function getCurrencyConfig() {
  return CURRENCIES[getCurrencyCode()] || CURRENCIES.USD;
}

export function money(value) {
  const cfg = getCurrencyConfig();
  const num = Number(value || 0);
  try {
    return new Intl.NumberFormat(cfg.locale, {
      style: 'currency',
      currency: cfg.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number.isFinite(num) ? num : 0);
  } catch {
    return `${cfg.symbol}${(Number.isFinite(num) ? num : 0).toFixed(2)}`;
  }
}

export function formatDate(value) {
  if (!value) return '—';
  const parsed = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatShortDate(value) {
  if (!value) return '—';
  const parsed = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
}

export function getItemsPerPage() {
  const n = parseInt(state.settings?.items_per_page, 10);
  if (!Number.isFinite(n) || n < 5) return 15;
  return Math.min(n, 100);
}

export function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function triggerBlobDownload(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\r\n');
  triggerBlobDownload(filename, new Blob([csv], { type: 'text/csv;charset=utf-8' }));
}

export async function downloadAuthedCsv(path, fallbackFilename) {
  const headers = new Headers({ Accept: 'text/csv, application/json' });
  const token = localStorage.getItem('stockflow_token');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_BASE}${path}`, { headers });
  if (response.status === 401) {
    await triggerSignOut(false);
    throw new Error('Your session expired. Please sign in again.');
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Export failed (${response.status})`);
  }
  const cd = response.headers.get('Content-Disposition') || '';
  const match = cd.match(/filename="?([^";\n]+)"?/i);
  const filename = match ? match[1] : fallbackFilename;
  const blob = await response.blob();
  triggerBlobDownload(filename, blob);
}
