import { api } from '../api-client.js';
import {
  BACKUP_SCHEDULES,
  CURRENCIES,
  DEFAULT_SETTINGS,
  canImportReplace,
  canManageSettings,
  dom,
  goToView,
  isAdmin,
  state,
  syncRouteHash
} from './state.js';
import {
  csvEscape,
  downloadCsv,
  escapeHtml,
  formatDate,
  getCurrencyCode,
  initials,
  plural
} from './formatters.js';
import {
  attachFieldClearHandlers,
  button,
  clearFormErrors,
  closeModal,
  empty,
  openConfirmModal,
  openModal,
  searchIconSvg,
  setFieldError,
  setFormBanner,
  showMessage
} from './ui.js';
import { exportProductsCsv, refreshAlertBadge } from './views-inventory.js';

const csvHints = {
  products: 'Required: sku, name. Optional: category, unit_price, current_stock, min_stock, max_stock, supplier_code, supplier_name.',
  suppliers: 'Required: code, name. Optional: tier (Tier A/B/C), contact_name, email, phone, lead_time_days, rating, status.',
  movements: 'Required: sku, type (INBOUND/OUTBOUND/ADJUSTMENT/TRANSFER), quantity. Optional: target_sku, reference_no, performed_by, notes, created_at.'
};

const templateCsvFields = ['sku', 'name', 'category', 'unit_price', 'current_stock', 'min_stock', 'max_stock', 'supplier_code', 'supplier_name'];
const demoProducts = [
  { sku: 'DEMO-COFFEE-001', name: 'House Blend Coffee (500g)', category: 'Beverages', unit_price: 14.50, current_stock: 42, min_stock: 10, max_stock: 120 },
  { sku: 'DEMO-MUG-001', name: 'Stoneware Mug', category: 'Homeware', unit_price: 12.00, current_stock: 68, min_stock: 12, max_stock: 160 },
  { sku: 'DEMO-NOTE-001', name: 'Daily Notes Journal', category: 'Stationery', unit_price: 8.50, current_stock: 24, min_stock: 8, max_stock: 80 }
];

export function applyUserToDom(user) {
  state.user = user;
  const name = user.full_name || user.username;
  document.querySelector('#topbar-user').textContent = `${name} · ${user.role}`;
  document.querySelector('#sidebar-user').textContent = user.username;
  document.querySelector('#sidebar-role').textContent = user.role;
  document.querySelector('#sidebar-avatar').textContent = initials(name);
  const adminNav = document.querySelector('#nav-admin-link');
  if (adminNav) adminNav.hidden = !isAdmin();
}

export async function loadSettings() {
  try {
    const data = await api.get('/api/inventory/settings');
    state.settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
  } catch {
    state.settings = { ...DEFAULT_SETTINGS };
  }
}

/* ---------- Settings & Currency Conversion ---------- */
export async function renderSettings() {
  await loadSettings();
  const s = state.settings;
  const editable = canManageSettings();
  const adminUser = isAdmin();
  const disabledAttr = editable ? '' : 'disabled';

  const currencyOptions = Object.values(CURRENCIES).map((c) =>
    `<option value="${c.code}" ${String(s.currency).toUpperCase() === c.code ? 'selected' : ''}>${escapeHtml(c.label)}</option>`
  ).join('');

  const backupOptions = BACKUP_SCHEDULES.map((b) =>
    `<option value="${b.value}" ${s.backup_schedule === b.value ? 'selected' : ''}>${escapeHtml(b.label)}</option>`
  ).join('');

  dom.appView.innerHTML = `
    <div class="settings-stack">
      ${editable ? '' : '<div class="info-banner">Store settings are read-only for your role. Contact a store manager or administrator to change currency or thresholds.</div>'}

      <form class="settings-card" data-form="settings" novalidate>
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Store configuration</p>
            <h2>Store Preferences</h2>
          </div>
        </div>
        <div id="settings-message" class="form-message" role="alert" hidden></div>
        <div class="settings-grid">
          <label class="field" for="setting-company-name">
            <span>Store name</span>
            <input id="setting-company-name" name="company_name" value="${escapeHtml(s.company_name)}" required ${disabledAttr}>
            <span class="field-hint">Shown in store exports, invoices, and workspace identity.</span>
            <span class="field-error" hidden></span>
          </label>

          <label class="field" for="setting-currency">
            <span>Store currency</span>
            <select id="setting-currency" name="currency" ${disabledAttr}>${currencyOptions}</select>
            <span class="field-hint">Display currency for Dashboard, Reports, and exports. Stored prices are not converted unless you run the converter below.</span>
            <span class="field-error" hidden></span>
          </label>

          <label class="field" for="setting-low-stock">
            <span>Default low-stock threshold</span>
            <input id="setting-low-stock" name="default_low_stock_threshold" type="number" min="0" step="1" value="${escapeHtml(s.default_low_stock_threshold)}" required ${disabledAttr}>
            <span class="field-hint">Suggested minimum stock when creating a new product.</span>
            <span class="field-error" hidden></span>
          </label>

          <label class="field" for="setting-per-page">
            <span>Products per page</span>
            <input id="setting-per-page" name="items_per_page" type="number" min="5" max="100" step="1" value="${escapeHtml(s.items_per_page)}" required ${disabledAttr}>
            <span class="field-hint">Controls pagination page size (5–100 rows per page).</span>
            <span class="field-error" hidden></span>
          </label>

          <div class="field field-wide">
            <label class="checkbox-field" for="setting-realtime-alerts">
              <input id="setting-realtime-alerts" name="enable_realtime_alerts" type="checkbox" ${String(s.enable_realtime_alerts) !== 'false' ? 'checked' : ''} ${disabledAttr}>
              <span>
                Enable real-time low-stock alert badges
                <span class="field-hint" style="display:block;margin-top:3px;">Displays active stock alert counts in the navigation sidebar.</span>
              </span>
            </label>
          </div>
        </div>

        ${adminUser ? `
          <div style="margin-top:24px;padding-top:20px;border-top:1px solid var(--line);">
            <div class="panel-heading">
              <div>
                <p class="eyebrow">Administrator only</p>
                <h3>Technical &amp; System Settings</h3>
              </div>
            </div>
            <div class="settings-grid">
              <label class="field" for="setting-cluster-region">
                <span>Cluster / deployment region</span>
                <input id="setting-cluster-region" name="cluster_region" value="${escapeHtml(s.cluster_region)}" required>
                <span class="field-hint">Infrastructure identifier for this StockFlow node.</span>
                <span class="field-error" hidden></span>
              </label>

              <label class="field" for="setting-backup-schedule">
                <span>Database backup schedule</span>
                <select id="setting-backup-schedule" name="backup_schedule">${backupOptions}</select>
                <span class="field-hint">Automated SQLite backup cadence (system configuration).</span>
                <span class="field-error" hidden></span>
              </label>
            </div>
          </div>
        ` : ''}

        ${editable ? '<div class="modal-actions" style="margin-top:20px;"><button class="action-button primary" type="submit">Save settings</button></div>' : ''}
      </form>

      ${editable ? `
        <section class="settings-card" aria-labelledby="currency-convert-heading">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">Catalog Valuation Tool</p>
              <h2 id="currency-convert-heading">Convert Stored Product Prices</h2>
            </div>
          </div>
          <p class="field-hint" style="margin:0 0 12px;">If your catalog unit prices were imported in another currency (for example INR prices displayed under USD), apply an explicit exchange rate to recalculate stored prices across all SKUs and update the store currency atomically.</p>
          <div class="tools-actions">
            ${button('Convert catalog prices…', 'open-currency-converter', 'ghost')}
          </div>
        </section>
      ` : ''}

      <section class="panel" aria-labelledby="data-mgmt-heading">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Data management</p>
            <h2 id="data-mgmt-heading">Imports, Exports &amp; Sample Data</h2>
          </div>
        </div>
        <div class="data-section-grid">
          <div class="data-box">
            <div>
              <h4>Exports &amp; Templates</h4>
              <p>Download your current catalog with active currency (${escapeHtml(getCurrencyCode())}) or grab a blank CSV template.</p>
            </div>
            <div class="tools-actions">
              ${button('Export products CSV', 'export-products')}
              ${button('Download template', 'download-template')}
            </div>
          </div>

          <div class="data-box">
            <div>
              <h4>Bulk CSV Import</h4>
              <p>Add or update products, suppliers, or movements from CSV. Replace mode requires manager clearance.</p>
            </div>
            <div class="tools-actions">
              ${button('Import products', 'import-products')}
              ${button('Import suppliers', 'import-suppliers')}
              ${button('Import movements', 'import-movements')}
            </div>
          </div>

          <div class="data-box danger-zone">
            <div>
              <h4>Demo Data (Mutates Catalog)</h4>
              <p>Upsert 3 sample products into your active catalog. Prompts for confirmation before making changes.</p>
            </div>
            <div class="tools-actions">
              ${button('Load demo data…', 'load-demo-data', 'danger', editable ? '' : 'disabled title="Store manager, shopkeeper, or administrator role required"')}
            </div>
          </div>
        </div>
        <p class="tools-note">Product CSV columns: sku, name, category, unit_price, current_stock, min_stock, max_stock, supplier_code, supplier_name</p>
      </section>
    </div>
  `;
}

export function validateSettingsForm(form) {
  clearFormErrors(form);
  const companyName = String(form.querySelector('[name="company_name"]')?.value || '').trim();
  const currency = String(form.querySelector('[name="currency"]')?.value || 'USD').trim().toUpperCase();
  const rawThreshold = String(form.querySelector('[name="default_low_stock_threshold"]')?.value ?? '').trim();
  const rawPerPage = String(form.querySelector('[name="items_per_page"]')?.value ?? '').trim();
  const alertsChecked = Boolean(form.querySelector('[name="enable_realtime_alerts"]')?.checked);
  const threshold = Number(rawThreshold);
  const perPage = Number(rawPerPage);
  let valid = true;

  if (!companyName) {
    setFieldError(form, 'company_name', 'Store name cannot be empty.');
    valid = false;
  }
  if (!CURRENCIES[currency]) {
    setFieldError(form, 'currency', 'Choose a supported currency.');
    valid = false;
  }
  if (rawThreshold === '' || !Number.isInteger(threshold) || threshold < 0) {
    setFieldError(form, 'default_low_stock_threshold', 'Must be a non-negative whole number.');
    valid = false;
  }
  if (rawPerPage === '' || !Number.isInteger(perPage) || perPage < 5 || perPage > 100) {
    setFieldError(form, 'items_per_page', 'Must be a whole number between 5 and 100.');
    valid = false;
  }

  const payload = {
    company_name: companyName,
    currency,
    default_low_stock_threshold: String(threshold),
    items_per_page: String(perPage),
    enable_realtime_alerts: alertsChecked ? 'true' : 'false'
  };

  if (isAdmin()) {
    const clusterRegion = String(form.querySelector('[name="cluster_region"]')?.value || '').trim();
    const backupSchedule = String(form.querySelector('[name="backup_schedule"]')?.value || '').trim();
    if (!clusterRegion) {
      setFieldError(form, 'cluster_region', 'Cluster region cannot be empty.');
      valid = false;
    } else {
      payload.cluster_region = clusterRegion;
    }
    if (backupSchedule) payload.backup_schedule = backupSchedule;
  }

  if (!valid) {
    setFormBanner(form, 'Please fix the highlighted settings fields.', 'error');
    return null;
  }
  return payload;
}

export function openCurrencyConverterModal() {
  const current = getCurrencyCode();
  const opts = Object.values(CURRENCIES).map((c) =>
    `<option value="${c.code}" ${c.code === current ? 'selected' : ''}>${escapeHtml(c.label)}</option>`
  ).join('');

  openModal('Convert catalog prices & currency', `
    <form class="modal-form" data-form="currency-convert" novalidate>
      <div class="form-message" role="alert" hidden></div>
      <div class="danger-confirm-box">
        This recalculates <strong>unit_price = ROUND(unit_price × rate, 2)</strong> across every product in your catalog and logs an audit entry. Current currency: <strong>${escapeHtml(current)}</strong>.
      </div>
      <div class="form-columns">
        <label class="field">
          <span>Target currency *</span>
          <select name="target_currency" required>${opts}</select>
          <span class="field-error" hidden></span>
        </label>
        <label class="field">
          <span>Conversion multiplier *</span>
          <input name="rate" type="number" min="0.000001" step="any" placeholder="0.012 or 83.50" required>
          <span class="field-hint">Example: 0.012 converts INR to USD; 83.5 converts USD to INR.</span>
          <span class="field-error" hidden></span>
        </label>
      </div>
      <div class="modal-actions">
        <button class="action-button ghost" data-action="close-modal" type="button">Cancel</button>
        <button class="action-button primary" type="submit">Apply conversion</button>
      </div>
    </form>`);
  attachFieldClearHandlers(dom.modalContent.querySelector('[data-form="currency-convert"]'));
}

export function csvImportForm(kind) {
  const label = kind[0].toUpperCase() + kind.slice(1);
  const allowReplace = canImportReplace();
  openModal(`Import ${label} CSV`, `
    <form class="modal-form" data-form="csv-import" data-kind="${kind}" novalidate>
      <div class="form-message" role="alert" hidden></div>
      <p class="import-hint">${escapeHtml(csvHints[kind] || '')}</p>
      <label class="field">
        <span>CSV file *</span>
        <input name="file" type="file" accept=".csv,text/csv" required>
        <span class="field-error" hidden></span>
      </label>
      <label class="field">
        <span>Import mode</span>
        <select name="mode" id="csv-import-mode">
          <option value="upsert">Update existing &amp; add new (Upsert)</option>
          <option value="skip">Add new only (Skip duplicates)</option>
          ${allowReplace ? `<option value="replace">Replace existing ${escapeHtml(kind)} (Delete &amp; reload)</option>` : ''}
        </select>
      </label>
      <div class="danger-confirm-box" id="replace-confirm-box" hidden>
        <strong>Destructive action warning:</strong> Replace mode deletes all existing ${escapeHtml(kind)} records before importing this file.
        <label class="checkbox-field">
          <input type="checkbox" name="confirm_replace" id="confirm-replace-checkbox">
          <span>I understand and want to replace all existing ${escapeHtml(kind)}.</span>
        </label>
      </div>
      ${kind === 'movements' ? '<label class="checkbox-field"><input type="checkbox" name="apply_stock_toggle" checked><span>Update current product stock quantities from movements</span></label>' : ''}
      <div class="modal-actions">
        <button class="action-button ghost" data-action="close-modal" type="button">Cancel</button>
        <button class="action-button primary" type="submit">Upload &amp; import</button>
      </div>
    </form>`);

  const modeSelect = dom.modalContent.querySelector('#csv-import-mode');
  const confirmBox = dom.modalContent.querySelector('#replace-confirm-box');
  modeSelect.addEventListener('change', () => {
    confirmBox.hidden = modeSelect.value !== 'replace';
  });
}

export function downloadTemplate() {
  downloadCsv('stockflow-products-template.csv', [templateCsvFields, ['SKU-001', 'Example product', 'General', '19.99', '25', '5', '100', '', '']]);
  showMessage('CSV template downloaded.', 'success');
}

export function loadDemoData() {
  openConfirmModal({
    title: 'Confirm demo data load',
    message: 'This will upsert 3 sample products (DEMO-COFFEE-001, DEMO-MUG-001, DEMO-NOTE-001) into your active product catalog. Existing products with other SKUs will remain untouched.',
    confirmLabel: 'Confirm & load demo data',
    onConfirm: async () => {
      const rows = [templateCsvFields, ...demoProducts.map((item) => templateCsvFields.map((field) => item[field] ?? ''))];
      const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\r\n');
      const file = new File([csv], 'stockflow-demo.csv', { type: 'text/csv' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', 'upsert');
      const result = await api.postForm('/api/products/import', formData);
      showMessage(`Demo data loaded: ${result.inserted || 0} added, ${result.updated || 0} updated.`, 'success');
      await goToView('products');
    }
  });
}

/* ---------- Admin Team & Audit Console ---------- */
export async function renderTeamAdmin() {
  if (!isAdmin()) {
    dom.appView.innerHTML = `<div class="info-banner">Administrator access is required to manage workspace users and inspect system audit logs.</div>`;
    return;
  }
  const [metricsData, usersData, logsData] = await Promise.all([
    api.get('/api/admin/metrics'),
    api.get('/api/admin/users'),
    api.get(`/api/admin/audit-logs?limit=${state.auditLimit}`)
  ]);
  state.adminMetrics = metricsData;
  state.adminUsers = usersData.users || [];
  state.auditLogs = logsData.logs || [];

  const uStats = metricsData.users || {};
  const sys = metricsData.system || {};

  dom.appView.innerHTML = `
    <section class="stat-grid" aria-label="Workspace administration summary">
      <article class="stat-card"><span>Total accounts</span><strong>${uStats.total || 0}</strong><small>${uStats.admins || 0} admins · ${uStats.managers || 0} managers</small></article>
      <article class="stat-card"><span>Store operators</span><strong>${uStats.regular || 0}</strong><small>${uStats.shopkeepers || 0} shopkeepers · ${uStats.staff || 0} staff</small></article>
      <article class="stat-card ${uStats.suspended > 0 ? 'warning' : ''}"><span>Suspended</span><strong>${uStats.suspended || 0}</strong><small>Blocked from sign-in</small></article>
      <article class="stat-card"><span>Database telemetry</span><strong>${escapeHtml(String(sys.database_size_kb ?? 0))} KB</strong><small>${escapeHtml(sys.database_engine || 'SQLite 3 WAL')} · ${sys.total_audit_events || 0} audit logs</small></article>
    </section>

    <div class="admin-tabs" role="tablist" aria-label="Administration sections">
      <button class="admin-tab ${state.adminTab === 'users' ? 'is-active' : ''}" data-admin-tab="users" type="button" role="tab" aria-selected="${state.adminTab === 'users'}">User Directory (${state.adminUsers.length})</button>
      <button class="admin-tab ${state.adminTab === 'audit' ? 'is-active' : ''}" data-admin-tab="audit" type="button" role="tab" aria-selected="${state.adminTab === 'audit'}">Audit Logs (${state.auditLogs.length})</button>
    </div>

    <div id="admin-tab-body"></div>
  `;
  renderAdminTabContent();

  dom.appView.querySelectorAll('[data-admin-tab]').forEach((tabBtn) => {
    tabBtn.addEventListener('click', () => {
      state.adminTab = tabBtn.dataset.adminTab;
      syncRouteHash();
      dom.appView.querySelectorAll('[data-admin-tab]').forEach((b) => {
        const active = b.dataset.adminTab === state.adminTab;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
      });
      renderAdminTabContent();
    });
  });
}

function renderAdminTabContent() {
  const container = document.querySelector('#admin-tab-body');
  if (!container) return;

  if (state.adminTab === 'audit') {
    const term = state.auditFilter.trim().toLowerCase();
    const logs = state.auditLogs.filter((l) => {
      if (!term) return true;
      return `${l.username || ''} ${l.action || ''} ${l.details || ''} ${l.status || ''}`.toLowerCase().includes(term);
    });
    container.innerHTML = `
      <div class="toolbar">
        <label class="search-field" aria-label="Filter audit logs">
          ${searchIconSvg}
          <input id="audit-filter-input" value="${escapeHtml(state.auditFilter)}" placeholder="Filter by actor, action, or details">
        </label>
        <select aria-label="Audit log limit" id="audit-limit-select">
          ${[25, 50, 100, 200].map((n) => `<option value="${n}" ${Number(state.auditLimit) === n ? 'selected' : ''}>Latest ${n} events</option>`).join('')}
        </select>
        <span class="table-count">${plural(logs.length, 'event')}</span>
      </div>
      <div class="table-panel">
        <div class="table-scroll">
          <table>
            <thead>
              <tr><th>Action</th><th>Actor</th><th>Details</th><th>IP</th><th>Status</th><th>Timestamp</th></tr>
            </thead>
            <tbody>
              ${logs.length ? logs.map((l) => `
                <tr>
                  <td data-primary><b class="mono">${escapeHtml(l.action)}</b></td>
                  <td data-label="Actor">${escapeHtml(l.username || 'system')}</td>
                  <td data-label="Details">${escapeHtml(l.details || '—')}</td>
                  <td data-label="IP" class="mono">${escapeHtml(l.ip_address || '—')}</td>
                  <td data-label="Status"><span class="status-badge audit-${escapeHtml(l.status || 'success')}">${escapeHtml(l.status || 'success')}</span></td>
                  <td data-label="Time">${formatDate(l.created_at)}</td>
                </tr>`).join('')
              : `<tr class="empty-row"><td colspan="6">${empty('No matching audit logs', 'Adjust your filter or event limit.')}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>`;
    container.querySelector('#audit-filter-input')?.addEventListener('input', (e) => {
      state.auditFilter = e.target.value;
      renderAdminTabContent();
      const input = document.querySelector('#audit-filter-input');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    });
    container.querySelector('#audit-limit-select')?.addEventListener('change', (e) => {
      state.auditLimit = Number(e.target.value) || 50;
      goToView('team', { keepContent: true });
    });
    return;
  }

  const rolesList = ['admin', 'manager', 'shopkeeper', 'wholesaler', 'staff', 'user'];
  container.innerHTML = `
    <div class="table-panel">
      <div class="table-scroll">
        <table>
          <thead>
            <tr><th>User</th><th>Username</th><th>Role</th><th>Status</th><th>Last Login</th><th></th></tr>
          </thead>
          <tbody>
            ${state.adminUsers.length ? state.adminUsers.map((u) => {
              const isSelf = Number(u.id) === Number(state.user?.id);
              const nextStatus = u.status === 'active' ? 'suspended' : 'active';
              return `
                <tr>
                  <td data-primary><b>${escapeHtml(u.full_name || u.username)}</b><small>${escapeHtml(u.email)}</small></td>
                  <td data-label="Username" class="mono">${escapeHtml(u.username)}</td>
                  <td data-label="Role">
                    <select class="inline-select" aria-label="Role for ${escapeHtml(u.username)}" data-user-role-id="${u.id}">
                      ${rolesList.map((r) => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${escapeHtml(r)}</option>`).join('')}
                    </select>
                  </td>
                  <td data-label="Status"><span class="status-badge ${escapeHtml(u.status)}">${escapeHtml(u.status)}</span></td>
                  <td data-label="Last login">${formatDate(u.last_login || u.created_at)}</td>
                  <td class="row-actions">
                    <button data-action="toggle-user-status" data-id="${u.id}" data-next="${nextStatus}" type="button" ${isSelf ? 'disabled title="Cannot suspend yourself"' : ''}>${u.status === 'active' ? 'Suspend' : 'Activate'}</button>
                    ${isSelf ? '' : `<button class="danger-link" data-action="delete-user" data-id="${u.id}" type="button">Delete</button>`}
                  </td>
                </tr>`;
            }).join('') : `<tr class="empty-row"><td colspan="6">${empty('No users found', 'Add team members using the button above.')}</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>`;

  container.querySelectorAll('[data-user-role-id]').forEach((sel) => {
    sel.addEventListener('change', async (e) => {
      const uid = sel.dataset.userRoleId;
      const newRole = e.target.value;
      try {
        await api.patch(`/api/admin/users/${uid}/role`, { role: newRole });
        showMessage(`Updated role to ${newRole}.`, 'success');
        await goToView('team', { keepContent: true });
      } catch (err) {
        showMessage(err.message || 'Unable to change role.');
        await goToView('team', { keepContent: true });
      }
    });
  });
}

export function adminCreateUserForm() {
  openModal('Create team account', `
    <form class="modal-form" data-form="admin-user" novalidate>
      <div class="form-message" role="alert" hidden></div>
      <div class="form-columns">
        <label class="field"><span>Full name *</span><input name="full_name" required placeholder="Priya Sharma"><span class="field-error" hidden></span></label>
        <label class="field"><span>Username *</span><input name="username" required minlength="3" placeholder="priya_mgr"><span class="field-error" hidden></span></label>
      </div>
      <div class="form-columns">
        <label class="field"><span>Email *</span><input name="email" type="email" required placeholder="priya@store.example"><span class="field-error" hidden></span></label>
        <label class="field"><span>Role *</span>
          <select name="role">
            <option value="shopkeeper">Shopkeeper</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
            <option value="wholesaler">Wholesaler</option>
            <option value="admin">Administrator</option>
          </select>
        </label>
      </div>
      <label class="field"><span>Initial password * (6+ chars)</span><input name="password" type="password" minlength="6" required placeholder="Temporary password"><span class="field-error" hidden></span></label>
      <div class="modal-actions">
        <button class="action-button ghost" data-action="close-modal" type="button">Cancel</button>
        <button class="action-button primary" type="submit">Create user</button>
      </div>
    </form>`);
  attachFieldClearHandlers(dom.modalContent.querySelector('[data-form="admin-user"]'));
}

/* ---------- Account Profile & Password Self-Service ---------- */
export function openProfileModal() {
  const u = state.user || {};
  openModal('Account profile & security', `
    <div class="modal-form" style="gap:18px;">
      <form data-form="profile" novalidate style="display:grid;gap:12px;">
        <div class="form-message" role="alert" hidden></div>
        <div class="form-columns">
          <label class="field"><span>Username</span><input value="${escapeHtml(u.username || '')}" readonly></label>
          <label class="field"><span>Role</span><input value="${escapeHtml(u.role || '')}" readonly></label>
        </div>
        <label class="field">
          <span>Display / Full name *</span>
          <input name="full_name" required value="${escapeHtml(u.full_name || '')}">
          <span class="field-error" hidden></span>
        </label>
        <div class="modal-actions">
          <button class="action-button primary small" type="submit">Update name</button>
        </div>
      </form>

      <form data-form="change-password" novalidate style="display:grid;gap:12px;padding-top:14px;border-top:1px solid var(--line);">
        <h3 style="margin:0;font-size:15px;">Change Password</h3>
        <div class="form-message" role="alert" hidden></div>
        <label class="field">
          <span>Current password *</span>
          <input name="current_password" type="password" autocomplete="current-password" required>
          <span class="field-error" hidden></span>
        </label>
        <div class="form-columns">
          <label class="field">
            <span>New password * (6+ chars)</span>
            <input name="new_password" type="password" autocomplete="new-password" minlength="6" required>
            <span class="field-error" hidden></span>
          </label>
          <label class="field">
            <span>Confirm new password *</span>
            <input name="confirm_password" type="password" autocomplete="new-password" minlength="6" required>
            <span class="field-error" hidden></span>
          </label>
        </div>
        <div class="modal-actions">
          <button class="action-button ghost" data-action="close-modal" type="button">Close</button>
          <button class="action-button primary small" type="submit">Change password</button>
        </div>
      </form>
    </div>`);
  attachFieldClearHandlers(dom.modalContent.querySelector('[data-form="profile"]'));
  attachFieldClearHandlers(dom.modalContent.querySelector('[data-form="change-password"]'));
}
