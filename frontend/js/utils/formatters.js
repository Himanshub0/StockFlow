/**
 * Formatting Utilities
 */

export function formatCurrency(amount, currencyCode = 'USD') {
  const num = Number(amount) || 0;
  const currencySymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹'
  };
  const symbol = currencySymbols[currencyCode] || '$';

  return `${symbol}${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function formatNumber(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('en-US');
}

export function formatDate(dateString, includeTime = true) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return date.toLocaleDateString('en-US', options);
}

export function formatStatusLabel(status) {
  switch (status) {
    case 'IN_STOCK':
      return 'In Stock';
    case 'LOW_STOCK':
      return 'Low Stock';
    case 'OUT_OF_STOCK':
      return 'Out of Stock';
    default:
      return status;
  }
}
