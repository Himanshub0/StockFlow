import { api } from '../api-client.js';
import {
  cacheProducts,
  canDeleteRecords,
  canImportReplace,
  canVoidOrders,
  dom,
  goToView,
  state,
  syncRouteHash,
  triggerSignOut
} from './state.js';
import {
  downloadCsv,
  escapeHtml,
  formatDate,
  getCurrencyCode,
  getItemsPerPage,
  money,
  plural
} from './formatters.js';
import {
  attachFieldClearHandlers,
  button,
  clearFormErrors,
  closeModal,
  empty,
  errorStateMarkup,
  mountProductCombobox,
  openConfirmModal,
  openModal,
  paginationMarkup,
  searchIconSvg,
  setFieldError,
  setFormBanner,
  showMessage
} from './ui.js';
import { refreshAlertBadge } from './views-inventory.js';

/* ---------- Suppliers ---------- */
function hasSupplierFilters() {
  return Boolean(state.supplierSearch.trim() || state.supplierTier !== 'all' || state.supplierStatus !== 'all');
}

function buildSupplierQuery() {
  const qs = new URLSearchParams();
  if (state.supplierSearch.trim()) qs.set('search', state.supplierSearch.trim());
  if (state.supplierTier !== 'all') qs.set('tier', state.supplierTier);
  if (state.supplierStatus !== 'all') qs.set('status', state.supplierStatus);
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export async function renderSuppliers() {
  const reqId = ++state.reqSeq.suppliers;
  const data = await api.get(`/api/suppliers${buildSupplierQuery()}`);
  if (reqId !== state.reqSeq.suppliers) return;
  state.suppliers = data.suppliers || [];

  dom.appView.innerHTML = `
    <div class="toolbar">
      <label class="search-field" aria-label="Search suppliers">
        ${searchIconSvg}
        <input data-search="suppliers" value="${escapeHtml(state.supplierSearch)}" placeholder="Search supplier name, code, or contact">
      </label>
      <select aria-label="Filter by supplier tier" data-filter="supplier-tier">
        <option value="all" ${state.supplierTier === 'all' ? 'selected' : ''}>All tiers</option>
        <option value="Tier A" ${state.supplierTier === 'Tier A' ? 'selected' : ''}>Tier A</option>
        <option value="Tier B" ${state.supplierTier === 'Tier B' ? 'selected' : ''}>Tier B</option>
        <option value="Tier C" ${state.supplierTier === 'Tier C' ? 'selected' : ''}>Tier C</option>
      </select>
      <select aria-label="Filter by supplier status" data-filter="supplier-status">
        <option value="all" ${state.supplierStatus === 'all' ? 'selected' : ''}>All statuses</option>
        <option value="active" ${state.supplierStatus === 'active' ? 'selected' : ''}>Active</option>
        <option value="inactive" ${state.supplierStatus === 'inactive' ? 'selected' : ''}>Inactive</option>
      </select>
      <button class="action-button ghost small" id="clear-supplier-search" data-action="clear-supplier-search" type="button" ${hasSupplierFilters() ? '' : 'disabled'}>Clear filters</button>
      <span class="table-count" id="suppliers-count">${plural(state.suppliers.length, 'supplier')}</span>
    </div>
    <div id="suppliers-results" class="table-panel"></div>
  `;
  updateSuppliersDom();

  document.querySelector('[data-filter="supplier-tier"]').addEventListener('change', (e) => {
    state.supplierTier = e.target.value;
    syncRouteHash();
    refreshSuppliersTable();
  });
  document.querySelector('[data-filter="supplier-status"]').addEventListener('change', (e) => {
    state.supplierStatus = e.target.value;
    syncRouteHash();
    refreshSuppliersTable();
  });
}

export async function refreshSuppliersTable() {
  const resultsEl = document.querySelector('#suppliers-results');
  if (!resultsEl) return goToView('suppliers');
  const reqId = ++state.reqSeq.suppliers;
  resultsEl.classList.add('is-loading');
  try {
    const data = await api.get(`/api/suppliers${buildSupplierQuery()}`);
    if (reqId !== state.reqSeq.suppliers) return;
    state.suppliers = data.suppliers || [];
    updateSuppliersDom();
  } catch (error) {
    if (reqId !== state.reqSeq.suppliers) return;
    if (error.status === 401) return triggerSignOut(false);
    showMessage(error.message || 'Failed to load suppliers.');
    resultsEl.innerHTML = errorStateMarkup('Failed to load suppliers', error.message);
  } finally {
    resultsEl.classList.remove('is-loading');
  }
}

function updateSuppliersDom() {
  const resultsEl = document.querySelector('#suppliers-results');
  const countEl = document.querySelector('#suppliers-count');
  const clearBtn = document.querySelector('#clear-supplier-search');
  if (!resultsEl) return;

  if (countEl) countEl.textContent = plural(state.suppliers.length, 'supplier');
  if (clearBtn) clearBtn.disabled = !hasSupplierFilters();

  const emptyAction = hasSupplierFilters()
    ? button('Clear filters', 'clear-supplier-search', 'primary')
    : button('Add supplier', 'add-supplier', 'primary');

  resultsEl.innerHTML = `
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Supplier</th>
            <th>Code</th>
            <th>Contact</th>
            <th>Tier &amp; Rating</th>
            <th>Linked SKUs</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${state.suppliers.length
            ? state.suppliers.map(supplierRow).join('')
            : `<tr class="empty-row"><td colspan="7">${empty('No suppliers found', hasSupplierFilters() ? 'No suppliers match your search or filters.' : 'Add sourcing partners or import a CSV.', emptyAction)}</td></tr>`}
        </tbody>
      </table>
    </div>`;
}

function supplierRow(item) {
  const canDelete = canDeleteRecords();
  const ratingText = item.rating != null ? ` · ★ ${Number(item.rating).toFixed(1)}` : '';
  return `
    <tr>
      <td data-primary><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.email || 'No email')}</small></td>
      <td data-label="Code" class="mono">${escapeHtml(item.code)}</td>
      <td data-label="Contact">${escapeHtml(item.contact_name || item.phone || '—')}</td>
      <td data-label="Tier">${escapeHtml(item.tier)}${escapeHtml(ratingText)}</td>
      <td data-label="Linked SKUs">${plural(item.products_count ?? 0, 'product')}</td>
      <td data-label="Status"><span class="status-badge ${escapeHtml(item.status)}">${escapeHtml(item.status)}</span></td>
      <td class="row-actions">
        <button data-action="edit-supplier" data-id="${item.id}" type="button">Edit</button>
        ${canDelete ? `<button class="danger-link" data-action="delete-supplier" data-id="${item.id}" type="button">Delete</button>` : ''}
      </td>
    </tr>`;
}

export function supplierForm(item = {}) {
  const editing = Boolean(item && item.id);
  openModal(editing ? 'Edit supplier' : 'Add supplier', `
    <form class="modal-form" data-form="supplier" data-id="${item.id || ''}" novalidate>
      <div class="form-message" role="alert" hidden></div>
      <div class="form-columns">
        <label class="field"><span>Supplier name *</span><input name="name" required value="${escapeHtml(item.name || '')}"><span class="field-error" hidden></span></label>
        <label class="field"><span>Supplier code *</span><input name="code" required value="${escapeHtml(item.code || '')}" placeholder="SUP-101"><span class="field-error" hidden></span></label>
      </div>
      <div class="form-columns">
        <label class="field"><span>Contact name</span><input name="contact_name" value="${escapeHtml(item.contact_name || '')}"><span class="field-error" hidden></span></label>
        <label class="field"><span>Email</span><input name="email" type="email" value="${escapeHtml(item.email || '')}"><span class="field-error" hidden></span></label>
      </div>
      <div class="form-columns">
        <label class="field"><span>Phone</span><input name="phone" type="tel" value="${escapeHtml(item.phone || '')}" placeholder="+1 555-0100"><span class="field-error" hidden></span></label>
        <label class="field"><span>Tier</span><select name="tier"><option ${item.tier === 'Tier A' ? 'selected' : ''}>Tier A</option><option ${item.tier === 'Tier B' || !item.tier ? 'selected' : ''}>Tier B</option><option ${item.tier === 'Tier C' ? 'selected' : ''}>Tier C</option></select><span class="field-error" hidden></span></label>
      </div>
      <div class="form-columns">
        <label class="field"><span>Lead time days</span><input name="lead_time_days" type="number" min="0" step="1" value="${item.lead_time_days ?? 7}"><span class="field-error" hidden></span></label>
        <label class="field"><span>Rating (0.0–5.0)</span><input name="rating" type="number" min="0" max="5" step="0.1" value="${item.rating ?? 4.5}"><span class="field-error" hidden></span></label>
      </div>
      ${editing ? `<label class="field"><span>Status</span><select name="status"><option value="active" ${item.status !== 'inactive' ? 'selected' : ''}>Active</option><option value="inactive" ${item.status === 'inactive' ? 'selected' : ''}>Inactive</option></select><span class="field-error" hidden></span></label>` : ''}
      <div class="modal-actions">
        <button class="action-button ghost" data-action="close-modal" type="button">Cancel</button>
        <button class="action-button primary" type="submit">${editing ? 'Save supplier' : 'Create supplier'}</button>
      </div>
    </form>`);
  attachFieldClearHandlers(dom.modalContent.querySelector('[data-form="supplier"]'));
}

export function validateSupplierForm(form) {
  clearFormErrors(form);
  const editing = Boolean(form.dataset.id);
  const fd = new FormData(form);
  const name = String(fd.get('name') || '').trim();
  const code = String(fd.get('code') || '').trim().toUpperCase();
  const email = String(fd.get('email') || '').trim();
  const phone = String(fd.get('phone') || '').trim();
  const rawLead = String(fd.get('lead_time_days') ?? '7').trim();
  const rawRating = String(fd.get('rating') ?? '4.5').trim();
  const lead = Number(rawLead);
  const rating = Number(rawRating);
  let valid = true;

  if (!name) {
    setFieldError(form, 'name', 'Supplier name is required.');
    valid = false;
  }
  if (!code) {
    setFieldError(form, 'code', 'Supplier code is required.');
    valid = false;
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFieldError(form, 'email', 'Enter a valid email address.');
    valid = false;
  }
  if (rawLead !== '' && (!Number.isInteger(lead) || lead < 0)) {
    setFieldError(form, 'lead_time_days', 'Lead time must be a whole number (0 or higher).');
    valid = false;
  }
  if (rawRating !== '' && (!Number.isFinite(rating) || rating < 0 || rating > 5)) {
    setFieldError(form, 'rating', 'Rating must be between 0.0 and 5.0.');
    valid = false;
  }
  if (!valid) {
    setFormBanner(form, 'Please fix the highlighted supplier fields.', 'error');
    return null;
  }
  return {
    name,
    code,
    contact_name: String(fd.get('contact_name') || '').trim(),
    email,
    phone,
    tier: String(fd.get('tier') || 'Tier B'),
    lead_time_days: rawLead === '' ? 7 : lead,
    rating: rawRating === '' ? 4.5 : rating,
    ...(editing ? { status: String(fd.get('status') || 'active') } : {})
  };
}

/* ---------- Purchase Orders ---------- */
function hasPoFilters() {
  return Boolean(state.poSearch.trim() || state.poStatus !== 'all');
}

function buildPoQuery() {
  const limit = getItemsPerPage();
  const offset = (state.poPage - 1) * limit;
  const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (state.poSearch.trim()) qs.set('search', state.poSearch.trim());
  if (state.poStatus !== 'all') qs.set('status', state.poStatus);
  return qs.toString();
}

export async function renderPurchaseOrders() {
  const reqId = ++state.reqSeq.purchases;
  const data = await api.get(`/api/purchase-orders?${buildPoQuery()}`);
  if (reqId !== state.reqSeq.purchases) return;
  if (data.currency) state.settings.currency = data.currency;
  state.purchaseOrders = data.purchase_orders || [];
  state.poTotal = data.total ?? state.purchaseOrders.length;
  state.poFilteredTotal = data.filtered_total ?? state.purchaseOrders.length;

  dom.appView.innerHTML = `
    <div class="toolbar">
      <label class="search-field" aria-label="Search purchase orders">
        ${searchIconSvg}
        <input data-search="purchases" value="${escapeHtml(state.poSearch)}" placeholder="Search PO number, supplier, or notes">
      </label>
      <select aria-label="Filter by PO status" data-filter="po-status">
        <option value="all" ${state.poStatus === 'all' ? 'selected' : ''}>All statuses</option>
        <option value="ordered" ${state.poStatus === 'ordered' ? 'selected' : ''}>Ordered (Open)</option>
        <option value="draft" ${state.poStatus === 'draft' ? 'selected' : ''}>Draft</option>
        <option value="received" ${state.poStatus === 'received' ? 'selected' : ''}>Received</option>
        <option value="cancelled" ${state.poStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
      </select>
      <button class="action-button ghost small" id="clear-po-filters" data-action="clear-po-filters" type="button" ${hasPoFilters() ? '' : 'disabled'}>Clear filters</button>
      <span class="table-count" id="po-count"></span>
    </div>
    <div id="po-results" class="table-panel"></div>
  `;
  updatePurchaseOrdersDom();

  document.querySelector('[data-filter="po-status"]').addEventListener('change', (e) => {
    state.poStatus = e.target.value;
    state.poPage = 1;
    syncRouteHash();
    refreshPurchaseOrders();
  });
}

export async function refreshPurchaseOrders() {
  const resultsEl = document.querySelector('#po-results');
  if (!resultsEl) return goToView('purchases');
  const reqId = ++state.reqSeq.purchases;
  resultsEl.classList.add('is-loading');
  try {
    const data = await api.get(`/api/purchase-orders?${buildPoQuery()}`);
    if (reqId !== state.reqSeq.purchases) return;
    state.purchaseOrders = data.purchase_orders || [];
    state.poTotal = data.total ?? state.purchaseOrders.length;
    state.poFilteredTotal = data.filtered_total ?? state.purchaseOrders.length;
    updatePurchaseOrdersDom();
  } catch (error) {
    if (reqId !== state.reqSeq.purchases) return;
    if (error.status === 401) return triggerSignOut(false);
    showMessage(error.message || 'Failed to load purchase orders.');
    resultsEl.innerHTML = errorStateMarkup('Failed to load purchase orders', error.message);
  } finally {
    resultsEl.classList.remove('is-loading');
  }
}

function updatePurchaseOrdersDom() {
  const resultsEl = document.querySelector('#po-results');
  const countEl = document.querySelector('#po-count');
  const clearBtn = document.querySelector('#clear-po-filters');
  if (!resultsEl) return;

  const limit = getItemsPerPage();
  const total = state.poTotal;
  const filtered = state.poFilteredTotal;
  if (countEl) {
    countEl.textContent = hasPoFilters()
      ? `${filtered} matching of ${total} total`
      : plural(total, 'purchase order');
  }
  if (clearBtn) clearBtn.disabled = !hasPoFilters();

  const emptyAction = hasPoFilters()
    ? button('Clear filters', 'clear-po-filters', 'primary')
    : button('New purchase order', 'add-po', 'primary');

  resultsEl.innerHTML = `
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>PO Number</th>
            <th>Supplier</th>
            <th>Items</th>
            <th>Total (${escapeHtml(getCurrencyCode())})</th>
            <th>Status</th>
            <th>Date</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${state.purchaseOrders.length
            ? state.purchaseOrders.map(poRow).join('')
            : `<tr class="empty-row"><td colspan="7">${empty('No purchase orders found', hasPoFilters() ? 'No purchase orders matched your search or status filter.' : 'Create a supplier purchase order to replenish stock.', emptyAction)}</td></tr>`}
        </tbody>
      </table>
    </div>
    ${paginationMarkup(state.poPage, filtered, limit, 'purchases')}
  `;
}

function poRow(po) {
  const itemSummary = (po.items || []).map((i) => `${i.product_sku || i.sku || 'SKU'} × ${i.quantity}`).slice(0, 2).join(', ');
  const extra = (po.items || []).length > 2 ? ` +${po.items.length - 2} more` : '';
  const isOpen = po.status === 'ordered' || po.status === 'draft';
  const canCancel = isOpen && canImportReplace();
  return `
    <tr>
      <td data-primary><b class="mono">${escapeHtml(po.po_number)}</b><small>${escapeHtml(po.notes || 'Supplier restock order')}</small></td>
      <td data-label="Supplier">${escapeHtml(po.supplier_name || 'Unassigned supplier')}</td>
      <td data-label="Items">${plural((po.items || []).length, 'line')}<small>${escapeHtml(itemSummary + extra)}</small></td>
      <td data-label="Total" class="mono">${escapeHtml(money(po.total_cost))}</td>
      <td data-label="Status"><span class="status-badge ${escapeHtml(po.status)}">${escapeHtml(po.status)}</span></td>
      <td data-label="Date">${formatDate(po.received_at || po.created_at)}</td>
      <td class="row-actions">
        <button data-action="view-po" data-id="${po.id}" type="button">View</button>
        ${isOpen ? `<button class="action-button small primary" data-action="receive-po" data-id="${po.id}" type="button">Receive</button>` : ''}
        ${canCancel ? `<button class="danger-link" data-action="cancel-po" data-id="${po.id}" type="button">Cancel</button>` : ''}
      </td>
    </tr>`;
}

export async function purchaseOrderForm(opts = {}) {
  if (!state.allSuppliers.length) {
    try {
      const sRes = await api.get('/api/suppliers');
      state.allSuppliers = sRes.suppliers || [];
    } catch { /* fallback empty */ }
  }

  let initialProduct = opts.product || null;
  if (!initialProduct && opts.productId) {
    try {
      const pRes = await api.get(`/api/products/${opts.productId}`);
      if (pRes.product) {
        initialProduct = pRes.product;
        cacheProducts([initialProduct]);
      }
    } catch { /* ignore */ }
  }

  const initialSupplierId = opts.supplierId ?? initialProduct?.supplier_id ?? '';
  const initialQty = opts.quantity ?? (initialProduct ? Math.max(1, Number(initialProduct.suggested_reorder || (initialProduct.max_stock || 50) - (initialProduct.current_stock || 0))) : 10);
  const initialCost = initialProduct?.unit_price != null ? Number(initialProduct.unit_price).toFixed(2) : '0.00';

  const supplierOpts = [
    '<option value="">Select supplier (optional)</option>',
    ...state.allSuppliers.map((s) => `<option value="${s.id}" ${Number(initialSupplierId) === Number(s.id) ? 'selected' : ''}>${escapeHtml(s.name)} (${escapeHtml(s.code)})</option>`)
  ].join('');

  openModal('New purchase order', `
    <form class="modal-form" id="po-create-form" data-form="purchase-order" novalidate>
      <div class="form-message" role="alert" hidden></div>
      <div class="form-columns">
        <label class="field">
          <span>Supplier</span>
          <select name="supplier_id">${supplierOpts}</select>
          <span class="field-error" hidden></span>
        </label>
        <label class="field">
          <span>Status</span>
          <select name="status">
            <option value="ordered" selected>Ordered (Ready to receive)</option>
            <option value="draft">Draft</option>
          </select>
        </label>
      </div>

      <div class="line-items-box">
        <div class="line-items-head">
          <strong style="font-size:13px;">Order line items *</strong>
          <button class="action-button small" id="add-po-line" type="button">+ Add product</button>
        </div>
        <div id="po-lines-container" style="display:grid;gap:8px;"></div>
      </div>

      <div class="line-items-summary" id="po-summary-box">
        <div class="total-row"><span>Order total (${escapeHtml(getCurrencyCode())})</span><strong class="mono" id="po-total-val">${escapeHtml(money(0))}</strong></div>
      </div>

      <label class="field">
        <span>Notes</span>
        <textarea name="notes" rows="2" placeholder="Delivery instructions or supplier reference">${escapeHtml(opts.notes || '')}</textarea>
      </label>

      <div class="modal-actions">
        <button class="action-button ghost" data-action="close-modal" type="button">Cancel</button>
        <button class="action-button primary" type="submit">Create purchase order</button>
      </div>
    </form>`, { wide: true });

  const form = dom.modalContent.querySelector('#po-create-form');
  const linesContainer = form.querySelector('#po-lines-container');
  const totalEl = form.querySelector('#po-total-val');
  let lineCounter = 0;

  const updateTotal = () => {
    let sum = 0;
    linesContainer.querySelectorAll('.line-item-row').forEach((row) => {
      const q = Number(row.querySelector('[data-line-qty]')?.value || 0);
      const c = Number(row.querySelector('[data-line-cost]')?.value || 0);
      if (Number.isFinite(q) && q > 0 && Number.isFinite(c) && c >= 0) sum += q * c;
    });
    totalEl.textContent = money(sum);
  };

  const addLine = (prefillProd = null, qtyVal = 10, costVal = '0.00') => {
    const idx = ++lineCounter;
    const row = document.createElement('div');
    row.className = 'line-item-row';
    row.innerHTML = `
      <div class="po-line-prod"></div>
      <label class="field"><span>Qty *</span><input type="number" min="1" step="1" data-line-qty value="${qtyVal}"></label>
      <label class="field"><span>Unit cost *</span><input type="number" min="0" step="0.01" data-line-cost value="${costVal}"></label>
      <button class="line-item-remove" type="button" aria-label="Remove line item">×</button>
    `;
    linesContainer.appendChild(row);
    mountProductCombobox(row.querySelector('.po-line-prod'), {
      id: `po-prod-${idx}`,
      name: `line_prod_${idx}`,
      label: 'Product *',
      placeholder: 'Search SKU or name…',
      compact: true,
      initialProduct: prefillProd,
      onSelect: (p) => {
        if (p) {
          row.querySelector('[data-line-cost]').value = Number(p.unit_price || 0).toFixed(2);
          updateTotal();
        }
      }
    });
    row.querySelector('[data-line-qty]').addEventListener('input', updateTotal);
    row.querySelector('[data-line-cost]').addEventListener('input', updateTotal);
    row.querySelector('.line-item-remove').addEventListener('click', () => {
      if (linesContainer.children.length > 1) {
        row.remove();
        syncRemoveButtons();
        updateTotal();
      }
    });
    syncRemoveButtons();
    updateTotal();
  };

  const syncRemoveButtons = () => {
    const rows = [...linesContainer.querySelectorAll('.line-item-row')];
    rows.forEach((r) => { r.querySelector('.line-item-remove').disabled = rows.length <= 1; });
  };

  addLine(initialProduct, initialQty, initialCost);
  form.querySelector('#add-po-line').addEventListener('click', () => addLine(null, 10, '0.00'));
}

export async function submitPurchaseOrderForm(form) {
  clearFormErrors(form);
  const rows = [...form.querySelectorAll('#po-lines-container .line-item-row')];
  const items = [];
  for (let i = 0; i < rows.length; i += 1) {
    const pid = rows[i].querySelector('input[type="hidden"]')?.value;
    const qty = Number(rows[i].querySelector('[data-line-qty]')?.value);
    const cost = Number(rows[i].querySelector('[data-line-cost]')?.value);
    if (!pid) {
      setFormBanner(form, `Select a product on line item ${i + 1}.`, 'error');
      return null;
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      setFormBanner(form, `Quantity on line ${i + 1} must be a positive whole number.`, 'error');
      return null;
    }
    if (!Number.isFinite(cost) || cost < 0) {
      setFormBanner(form, `Unit cost on line ${i + 1} must be 0 or higher.`, 'error');
      return null;
    }
    items.push({ product_id: Number(pid), quantity: qty, unit_cost: cost });
  }

  const fd = new FormData(form);
  const suppId = String(fd.get('supplier_id') || '').trim();
  return {
    supplier_id: suppId ? Number(suppId) : null,
    status: String(fd.get('status') || 'ordered'),
    notes: String(fd.get('notes') || '').trim(),
    items
  };
}

export function viewPurchaseOrderModal(id) {
  const po = state.purchaseOrders.find((p) => String(p.id) === String(id));
  if (!po) return showMessage('Purchase order not found.');
  const lines = (po.items || []).map((i) => `
    <tr>
      <td><b>${escapeHtml(i.product_name || 'Product')}</b><small class="mono">${escapeHtml(i.product_sku || '')}</small></td>
      <td class="mono">${i.quantity}</td>
      <td class="mono">${escapeHtml(money(i.unit_cost))}</td>
      <td class="mono">${escapeHtml(money(Number(i.quantity) * Number(i.unit_cost)))}</td>
    </tr>`).join('');
  openModal(`Purchase Order ${po.po_number}`, `
    <div class="modal-form invoice-sheet">
      <div class="invoice-meta-grid">
        <div><span>Supplier</span><b>${escapeHtml(po.supplier_name || 'Unassigned')}</b></div>
        <div><span>Status</span><span class="status-badge ${escapeHtml(po.status)}">${escapeHtml(po.status)}</span></div>
        <div><span>Created</span><b>${formatDate(po.created_at)} (${escapeHtml(po.created_by || 'system')})</b></div>
        <div><span>Received</span><b>${po.received_at ? formatDate(po.received_at) : 'Pending receipt'}</b></div>
      </div>
      <table>
        <thead><tr><th>Product</th><th>Qty</th><th>Unit Cost</th><th>Line Total</th></tr></thead>
        <tbody>${lines}</tbody>
      </table>
      <div class="line-items-summary">
        <div class="total-row"><span>Order Total</span><strong class="mono">${escapeHtml(money(po.total_cost))}</strong></div>
      </div>
      <div class="modal-actions">
        <button class="action-button ghost" data-action="close-modal" type="button">Close</button>
      </div>
    </div>`, { wide: true });
}

export function receivePurchaseOrderAction(id) {
  const po = state.purchaseOrders.find((p) => String(p.id) === String(id));
  if (!po) return showMessage('Purchase order not found.');
  openConfirmModal({
    title: `Receive ${po.po_number}`,
    message: `Mark ${po.po_number} as received? This adds all ordered quantities to product stock and records INBOUND stock movements.`,
    confirmLabel: 'Receive into stock',
    danger: false,
    onConfirm: async () => {
      await api.post(`/api/purchase-orders/${id}/receive`, {});
      state.productCache.clear();
      refreshAlertBadge();
      showMessage(`Purchase order ${po.po_number} received into stock.`, 'success');
      await goToView('purchases', { keepContent: true });
    }
  });
}

export function cancelPurchaseOrderAction(id) {
  const po = state.purchaseOrders.find((p) => String(p.id) === String(id));
  if (!po) return showMessage('Purchase order not found.');
  openConfirmModal({
    title: `Cancel ${po.po_number}`,
    message: `Cancel purchase order ${po.po_number}? Stock will not be modified.`,
    confirmLabel: 'Cancel PO',
    danger: true,
    onConfirm: async () => {
      await api.post(`/api/purchase-orders/${id}/cancel`, {});
      showMessage(`Purchase order ${po.po_number} cancelled.`, 'success');
      await goToView('purchases', { keepContent: true });
    }
  });
}

/* ---------- Sales & Billing ---------- */
function hasSalesFilters() {
  return Boolean(state.salesSearch.trim() || state.salesStatus !== 'all' || state.salesStartDate || state.salesEndDate);
}

function buildSalesQuery() {
  const limit = getItemsPerPage();
  const offset = (state.salesPage - 1) * limit;
  const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (state.salesSearch.trim()) qs.set('search', state.salesSearch.trim());
  if (state.salesStatus !== 'all') qs.set('status', state.salesStatus);
  if (state.salesStartDate) qs.set('start_date', state.salesStartDate);
  if (state.salesEndDate) qs.set('end_date', state.salesEndDate);
  return qs.toString();
}

export async function renderSalesOrders() {
  const reqId = ++state.reqSeq.sales;
  const data = await api.get(`/api/sales-orders?${buildSalesQuery()}`);
  if (reqId !== state.reqSeq.sales) return;
  if (data.currency) state.settings.currency = data.currency;
  state.salesOrders = data.sales_orders || [];
  state.salesTotal = data.total ?? state.salesOrders.length;
  state.salesFilteredTotal = data.filtered_total ?? state.salesOrders.length;

  dom.appView.innerHTML = `
    <div class="toolbar">
      <label class="search-field" aria-label="Search invoices">
        ${searchIconSvg}
        <input data-search="sales" value="${escapeHtml(state.salesSearch)}" placeholder="Search invoice #, customer, or notes">
      </label>
      <select aria-label="Filter by invoice status" data-filter="sales-status">
        <option value="all" ${state.salesStatus === 'all' ? 'selected' : ''}>All statuses</option>
        <option value="completed" ${state.salesStatus === 'completed' ? 'selected' : ''}>Completed</option>
        <option value="voided" ${state.salesStatus === 'voided' ? 'selected' : ''}>Voided</option>
      </select>
      <label class="date-filter-field">
        <span>From</span>
        <input type="date" data-filter="sales-start" value="${escapeHtml(state.salesStartDate)}" aria-label="Sales start date">
      </label>
      <label class="date-filter-field">
        <span>To</span>
        <input type="date" data-filter="sales-end" value="${escapeHtml(state.salesEndDate)}" aria-label="Sales end date">
      </label>
      <button class="action-button ghost small" id="clear-sales-filters" data-action="clear-sales-filters" type="button" ${hasSalesFilters() ? '' : 'disabled'}>Clear filters</button>
      <span class="table-count" id="sales-count"></span>
    </div>
    <div id="sales-results" class="table-panel"></div>
  `;
  updateSalesOrdersDom();

  const applyFilter = () => {
    const startVal = document.querySelector('[data-filter="sales-start"]')?.value || '';
    const endVal = document.querySelector('[data-filter="sales-end"]')?.value || '';
    if (startVal && endVal && startVal > endVal) {
      showMessage('Start date cannot be after end date.');
      return;
    }
    state.salesStatus = document.querySelector('[data-filter="sales-status"]')?.value || 'all';
    state.salesStartDate = startVal;
    state.salesEndDate = endVal;
    state.salesPage = 1;
    syncRouteHash();
    refreshSalesOrders();
  };
  document.querySelector('[data-filter="sales-status"]').addEventListener('change', applyFilter);
  document.querySelector('[data-filter="sales-start"]').addEventListener('change', applyFilter);
  document.querySelector('[data-filter="sales-end"]').addEventListener('change', applyFilter);
}

export async function refreshSalesOrders() {
  const resultsEl = document.querySelector('#sales-results');
  if (!resultsEl) return goToView('sales');
  const reqId = ++state.reqSeq.sales;
  resultsEl.classList.add('is-loading');
  try {
    const data = await api.get(`/api/sales-orders?${buildSalesQuery()}`);
    if (reqId !== state.reqSeq.sales) return;
    state.salesOrders = data.sales_orders || [];
    state.salesTotal = data.total ?? state.salesOrders.length;
    state.salesFilteredTotal = data.filtered_total ?? state.salesOrders.length;
    updateSalesOrdersDom();
  } catch (error) {
    if (reqId !== state.reqSeq.sales) return;
    if (error.status === 401) return triggerSignOut(false);
    showMessage(error.message || 'Failed to load sales invoices.');
    resultsEl.innerHTML = errorStateMarkup('Failed to load sales invoices', error.message);
  } finally {
    resultsEl.classList.remove('is-loading');
  }
}

function updateSalesOrdersDom() {
  const resultsEl = document.querySelector('#sales-results');
  const countEl = document.querySelector('#sales-count');
  const clearBtn = document.querySelector('#clear-sales-filters');
  if (!resultsEl) return;

  const limit = getItemsPerPage();
  const total = state.salesTotal;
  const filtered = state.salesFilteredTotal;
  if (countEl) {
    countEl.textContent = hasSalesFilters()
      ? `${filtered} matching of ${total} total`
      : plural(total, 'invoice');
  }
  if (clearBtn) clearBtn.disabled = !hasSalesFilters();

  const emptyAction = hasSalesFilters()
    ? button('Clear filters', 'clear-sales-filters', 'primary')
    : button('New sale invoice', 'add-sale', 'primary');

  resultsEl.innerHTML = `
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Customer</th>
            <th>Items &amp; Payment</th>
            <th>Total (${escapeHtml(getCurrencyCode())})</th>
            <th>Status</th>
            <th>Date</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${state.salesOrders.length
            ? state.salesOrders.map(salesRow).join('')
            : `<tr class="empty-row"><td colspan="7">${empty('No sales invoices found', hasSalesFilters() ? 'No invoices match your search or filters.' : 'Create a customer invoice to record sales and deduct stock.', emptyAction)}</td></tr>`}
        </tbody>
      </table>
    </div>
    ${paginationMarkup(state.salesPage, filtered, limit, 'sales')}
  `;
}

function salesRow(so) {
  const canVoid = so.status === 'completed' && canVoidOrders();
  return `
    <tr>
      <td data-primary><b class="mono">${escapeHtml(so.invoice_number)}</b><small>${escapeHtml(so.created_by || 'staff')}</small></td>
      <td data-label="Customer">${escapeHtml(so.customer_name || 'Walk-in Customer')}${so.customer_contact ? `<small>${escapeHtml(so.customer_contact)}</small>` : ''}</td>
      <td data-label="Items">${plural((so.items || []).length, 'line')}<small>${escapeHtml(String(so.payment_method || 'cash').toUpperCase())}</small></td>
      <td data-label="Total" class="mono">${escapeHtml(money(so.total_amount))}</td>
      <td data-label="Status"><span class="status-badge ${escapeHtml(so.status)}">${escapeHtml(so.status)}</span></td>
      <td data-label="Date">${formatDate(so.created_at)}</td>
      <td class="row-actions">
        <button data-action="view-sale" data-id="${so.id}" type="button">Invoice</button>
        ${canVoid ? `<button class="danger-link" data-action="void-sale" data-id="${so.id}" type="button">Void</button>` : ''}
      </td>
    </tr>`;
}

export function salesOrderForm() {
  openModal('New sale / invoice', `
    <form class="modal-form" id="sale-create-form" data-form="sales-order" novalidate>
      <div class="form-message" role="alert" hidden></div>
      <div class="form-columns">
        <label class="field"><span>Customer name</span><input name="customer_name" placeholder="Walk-in Customer"></label>
        <label class="field"><span>Phone / Email</span><input name="customer_contact" placeholder="Optional contact"></label>
      </div>
      <div class="form-columns">
        <label class="field">
          <span>Payment method</span>
          <select name="payment_method">
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="bank_transfer">Bank transfer</option>
          </select>
        </label>
        <label class="field">
          <span>Discount (${escapeHtml(getCurrencyCode())})</span>
          <input name="discount" id="sale-discount-input" type="number" min="0" step="0.01" value="0.00">
          <span class="field-error" hidden></span>
        </label>
      </div>

      <div class="line-items-box">
        <div class="line-items-head">
          <strong style="font-size:13px;">Billed products *</strong>
          <button class="action-button small" id="add-sale-line" type="button">+ Add item</button>
        </div>
        <div id="sale-lines-container" style="display:grid;gap:8px;"></div>
      </div>

      <div class="line-items-summary" id="sale-summary-box">
        <div><span>Subtotal</span><strong class="mono" id="sale-subtotal-val">${escapeHtml(money(0))}</strong></div>
        <div><span>Discount</span><strong class="mono" id="sale-discount-val">${escapeHtml(money(0))}</strong></div>
        <div class="total-row"><span>Net Total (${escapeHtml(getCurrencyCode())})</span><strong class="mono" id="sale-total-val">${escapeHtml(money(0))}</strong></div>
        <small id="sale-stock-warning" style="color:var(--red);" hidden></small>
      </div>

      <label class="field">
        <span>Notes</span>
        <textarea name="notes" rows="2" placeholder="Optional billing memo"></textarea>
      </label>

      <div class="modal-actions">
        <button class="action-button ghost" data-action="close-modal" type="button">Cancel</button>
        <button class="action-button primary" type="submit">Complete sale &amp; invoice</button>
      </div>
    </form>`, { wide: true });

  const form = dom.modalContent.querySelector('#sale-create-form');
  const linesContainer = form.querySelector('#sale-lines-container');
  const discountInput = form.querySelector('#sale-discount-input');
  const warnEl = form.querySelector('#sale-stock-warning');
  let lineCounter = 0;

  const updateTotals = () => {
    let subtotal = 0;
    const neededByPid = new Map();
    linesContainer.querySelectorAll('.line-item-row').forEach((row) => {
      const pid = row.querySelector('input[type="hidden"]')?.value;
      const qty = Number(row.querySelector('[data-line-qty]')?.value || 0);
      const price = Number(row.querySelector('[data-line-price]')?.value || 0);
      if (pid && Number.isInteger(qty) && qty > 0) {
        neededByPid.set(Number(pid), (neededByPid.get(Number(pid)) || 0) + qty);
      }
      if (Number.isFinite(qty) && qty > 0 && Number.isFinite(price) && price >= 0) {
        subtotal += qty * price;
      }
    });

    let stockWarning = '';
    for (const [pid, need] of neededByPid.entries()) {
      const prod = state.productCache.get(pid);
      if (prod && need > prod.current_stock) {
        stockWarning = `Insufficient stock for ${prod.sku}: ${prod.current_stock} available, requested ${need}.`;
        break;
      }
    }
    warnEl.textContent = stockWarning;
    warnEl.hidden = !stockWarning;

    const disc = Math.max(0, Number(discountInput.value || 0));
    form.querySelector('#sale-subtotal-val').textContent = money(subtotal);
    form.querySelector('#sale-discount-val').textContent = money(disc);
    form.querySelector('#sale-total-val').textContent = money(Math.max(0, subtotal - disc));
  };

  const addLine = () => {
    const idx = ++lineCounter;
    const row = document.createElement('div');
    row.className = 'line-item-row';
    row.innerHTML = `
      <div class="sale-line-prod"></div>
      <label class="field"><span>Qty *</span><input type="number" min="1" step="1" data-line-qty value="1"></label>
      <label class="field"><span>Unit price *</span><input type="number" min="0" step="0.01" data-line-price value="0.00"></label>
      <button class="line-item-remove" type="button" aria-label="Remove line item">×</button>
    `;
    linesContainer.appendChild(row);
    mountProductCombobox(row.querySelector('.sale-line-prod'), {
      id: `sale-prod-${idx}`,
      name: `sale_prod_${idx}`,
      label: 'Product *',
      placeholder: 'Search product SKU or name…',
      compact: true,
      onSelect: (p) => {
        if (p) {
          row.querySelector('[data-line-price]').value = Number(p.unit_price || 0).toFixed(2);
          updateTotals();
        }
      }
    });
    row.querySelector('[data-line-qty]').addEventListener('input', updateTotals);
    row.querySelector('[data-line-price]').addEventListener('input', updateTotals);
    row.querySelector('.line-item-remove').addEventListener('click', () => {
      if (linesContainer.children.length > 1) {
        row.remove();
        syncRemove();
        updateTotals();
      }
    });
    syncRemove();
    updateTotals();
  };

  const syncRemove = () => {
    const rows = [...linesContainer.querySelectorAll('.line-item-row')];
    rows.forEach((r) => { r.querySelector('.line-item-remove').disabled = rows.length <= 1; });
  };

  discountInput.addEventListener('input', updateTotals);
  addLine();
  form.querySelector('#add-sale-line').addEventListener('click', addLine);
}

export function submitSalesOrderForm(form) {
  clearFormErrors(form);
  const rows = [...form.querySelectorAll('#sale-lines-container .line-item-row')];
  const items = [];
  let subtotal = 0;
  const qtyByPid = new Map();

  for (let i = 0; i < rows.length; i += 1) {
    const pid = rows[i].querySelector('input[type="hidden"]')?.value;
    const qty = Number(rows[i].querySelector('[data-line-qty]')?.value);
    const price = Number(rows[i].querySelector('[data-line-price]')?.value);
    if (!pid) {
      setFormBanner(form, `Select a product on line item ${i + 1}.`, 'error');
      return null;
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      setFormBanner(form, `Quantity on line ${i + 1} must be a positive whole number.`, 'error');
      return null;
    }
    if (!Number.isFinite(price) || price < 0) {
      setFormBanner(form, `Unit price on line ${i + 1} cannot be negative.`, 'error');
      return null;
    }
    const numPid = Number(pid);
    qtyByPid.set(numPid, (qtyByPid.get(numPid) || 0) + qty);
    subtotal += qty * price;
    items.push({ product_id: numPid, quantity: qty, unit_price: price });
  }

  for (const [pid, needed] of qtyByPid.entries()) {
    const prod = state.productCache.get(pid);
    if (prod && needed > prod.current_stock) {
      setFormBanner(form, `Insufficient stock for ${prod.sku}: ${prod.current_stock} available, requested ${needed}.`, 'error');
      return null;
    }
  }

  const fd = new FormData(form);
  const discount = Number(fd.get('discount') ?? 0);
  if (!Number.isFinite(discount) || discount < 0) {
    setFieldError(form, 'discount', 'Discount cannot be negative.');
    setFormBanner(form, 'Fix discount amount before completing sale.', 'error');
    return null;
  }
  if (discount > subtotal + 0.0001) {
    setFieldError(form, 'discount', `Discount cannot exceed subtotal (${money(subtotal)}).`);
    setFormBanner(form, 'Discount cannot exceed invoice subtotal.', 'error');
    return null;
  }

  return {
    customer_name: String(fd.get('customer_name') || '').trim(),
    customer_contact: String(fd.get('customer_contact') || '').trim(),
    payment_method: String(fd.get('payment_method') || 'cash'),
    discount,
    notes: String(fd.get('notes') || '').trim(),
    items
  };
}

export function viewInvoiceModal(id) {
  const so = state.salesOrders.find((s) => String(s.id) === String(id));
  if (!so) return showMessage('Invoice not found.');
  const lines = (so.items || []).map((i) => `
    <tr>
      <td><b>${escapeHtml(i.product_name || 'Product')}</b><small class="mono">${escapeHtml(i.product_sku || '')}</small></td>
      <td class="mono">${i.quantity}</td>
      <td class="mono">${escapeHtml(money(i.unit_price))}</td>
      <td class="mono">${escapeHtml(money(Number(i.quantity) * Number(i.unit_price)))}</td>
    </tr>`).join('');
  openModal(`Invoice ${so.invoice_number}`, `
    <div class="modal-form invoice-sheet">
      <div class="invoice-meta-grid">
        <div><span>Store</span><b>${escapeHtml(state.settings.company_name || 'StockFlow Store')}</b></div>
        <div><span>Status</span><span class="status-badge ${escapeHtml(so.status)}">${escapeHtml(so.status)}</span></div>
        <div><span>Customer</span><b>${escapeHtml(so.customer_name || 'Walk-in Customer')}${so.customer_contact ? ` · ${escapeHtml(so.customer_contact)}` : ''}</b></div>
        <div><span>Payment &amp; Date</span><b>${escapeHtml(String(so.payment_method).toUpperCase())} · ${formatDate(so.created_at)}</b></div>
      </div>
      <table>
        <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Line Total</th></tr></thead>
        <tbody>${lines}</tbody>
      </table>
      <div class="line-items-summary">
        <div><span>Subtotal</span><strong class="mono">${escapeHtml(money(so.subtotal))}</strong></div>
        <div><span>Discount</span><strong class="mono">${escapeHtml(money(so.discount))}</strong></div>
        <div class="total-row"><span>Total Paid</span><strong class="mono">${escapeHtml(money(so.total_amount))}</strong></div>
      </div>
      <div class="modal-actions">
        <button class="action-button ghost" data-action="close-modal" type="button">Close</button>
        <button class="action-button primary" id="print-invoice-btn" type="button">Print</button>
      </div>
    </div>`, { wide: true });
  dom.modalContent.querySelector('#print-invoice-btn')?.addEventListener('click', () => window.print());
}

export function voidSalesOrderAction(id) {
  const so = state.salesOrders.find((s) => String(s.id) === String(id));
  if (!so) return showMessage('Invoice not found.');
  openModal(`Void invoice ${so.invoice_number}`, `
    <form class="modal-form" data-form="void-sale" data-id="${so.id}" novalidate>
      <div class="danger-confirm-box">Voiding ${escapeHtml(so.invoice_number)} restores sold item quantities to stock and logs a compensating adjustment entry.</div>
      <label class="field">
        <span>Void reason</span>
        <input name="reason" placeholder="Customer return or billing mistake" value="Customer return">
      </label>
      <div class="modal-actions">
        <button class="action-button ghost" data-action="close-modal" type="button">Cancel</button>
        <button class="action-button danger" type="submit">Confirm void invoice</button>
      </div>
    </form>`);
}

/* ---------- Reports ---------- */
export async function renderReports() {
  const params = new URLSearchParams();
  if (state.reportCategory !== 'all') params.set('category', state.reportCategory);
  if (state.reportStartDate) params.set('start_date', state.reportStartDate);
  if (state.reportEndDate) params.set('end_date', state.reportEndDate);
  const qs = params.toString();

  const data = await api.get(`/api/reports/summary${qs ? `?${qs}` : ''}`);
  state.reportData = data;
  if (data.currency) state.settings.currency = data.currency;

  const categories = data.categories || [];
  const movements = data.movements || [];
  const suppliers = data.supplier_performance || [];
  const totals = data.totals || {};
  const sales = data.sales_summary || {};
  const purchases = data.purchase_summary || {};
  const availableCategories = data.available_categories || [];
  const catOptions = availableCategories.map((c) => `<option value="${escapeHtml(c)}" ${state.reportCategory === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('');
  const hasReportFilters = state.reportCategory !== 'all' || Boolean(state.reportStartDate) || Boolean(state.reportEndDate);

  dom.appView.innerHTML = `
    <div class="info-banner">
      <strong>Live Operational Reports:</strong> Valuation (${escapeHtml(getCurrencyCode())}), stock movements, completed sales invoices, and purchase orders below reflect actual database records matching your filters.
    </div>

    <form class="toolbar" id="report-filter-form">
      <select aria-label="Filter report by category" name="category">
        <option value="all">All categories</option>
        ${catOptions}
      </select>
      <label class="date-filter-field">
        <span>From</span>
        <input type="date" name="start_date" value="${escapeHtml(state.reportStartDate)}" aria-label="Report start date">
      </label>
      <label class="date-filter-field">
        <span>To</span>
        <input type="date" name="end_date" value="${escapeHtml(state.reportEndDate)}" aria-label="Report end date">
      </label>
      <button class="action-button primary small" type="submit">Apply filters</button>
      <button class="action-button ghost small" data-action="clear-report-filters" type="button" ${hasReportFilters ? '' : 'disabled'}>Clear filters</button>
    </form>

    <section class="stat-grid" aria-label="Report summary totals">
      <article class="stat-card"><span>Matching products</span><strong>${Number(totals.total_products || 0).toLocaleString('en-US')}</strong><small>${plural(categories.length, 'category', 'categories')} · ${Number(totals.total_units || 0).toLocaleString('en-US')} units</small></article>
      <article class="stat-card"><span>Inventory valuation</span><strong>${escapeHtml(money(totals.total_value || 0))}</strong><small>Formatted in ${escapeHtml(getCurrencyCode())}</small></article>
      <article class="stat-card"><span>Completed sales</span><strong>${escapeHtml(money(sales.net_revenue || 0))}</strong><small>${plural(sales.total_orders || 0, 'invoice')} · ${plural(sales.units_sold || 0, 'unit')} sold</small></article>
      <article class="stat-card"><span>Purchase orders</span><strong>${escapeHtml(money(purchases.total_spend || 0))}</strong><small>${plural(purchases.total_orders || 0, 'PO')} (${purchases.received_count || 0} received)</small></article>
    </section>

    <section class="report-grid">
      <article class="panel">
        <div class="panel-heading">
          <div><p class="eyebrow">Inventory by category</p><h3>Catalog valuation</h3></div>
        </div>
        ${categories.length
          ? `<div class="report-list">${categories.map((item) => `
            <div class="report-row">
              <span><b>${escapeHtml(item.category)}</b><small>${plural(item.product_count, 'product')} · ${plural(item.total_units, 'unit')}</small></span>
              <strong>${escapeHtml(money(item.total_value))}</strong>
            </div>`).join('')}</div>`
          : empty('No category data', 'No products match the selected filter.')}
      </article>

      <article class="panel">
        <div class="panel-heading">
          <div><p class="eyebrow">Movement ledger (${Number(totals.total_movements || 0)} events)</p><h3>Operations by type</h3></div>
        </div>
        ${movements.length
          ? `<div class="report-list">${movements.map((item) => `
            <div class="report-row">
              <span><b>${escapeHtml(item.type)}</b><small>${plural(item.count, 'recorded movement')}</small></span>
              <strong>${item.net_quantity > 0 && item.type === 'ADJUSTMENT' ? `+${item.net_quantity}` : item.net_quantity} units</strong>
            </div>`).join('')}</div>`
          : empty('No movement data', 'No stock movements match the selected category or date range.')}
      </article>

      <article class="panel field-wide">
        <div class="panel-heading">
          <div><p class="eyebrow">Sourcing partners</p><h3>Supplier tiers</h3></div>
        </div>
        ${suppliers.length
          ? `<div class="report-list">${suppliers.map((item) => `
            <div class="report-row">
              <span><b>${escapeHtml(item.tier)}</b><small>${plural(item.managed_products, 'linked product')}</small></span>
              <strong>${item.avg_rating != null ? `★ ${Number(item.avg_rating).toFixed(2)}` : '—'}</strong>
            </div>`).join('')}</div>`
          : empty('No supplier data', 'Add suppliers to track tier coverage.')}
      </article>
    </section>
  `;

  const reportForm = document.querySelector('#report-filter-form');
  reportForm.querySelector('[name="category"]')?.addEventListener('change', () => reportForm.requestSubmit());
  reportForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const fd = new FormData(event.target);
    const start = String(fd.get('start_date') || '');
    const end = String(fd.get('end_date') || '');
    if (start && end && start > end) {
      showMessage('Start date cannot be after end date.');
      return;
    }
    state.reportCategory = String(fd.get('category') || 'all');
    state.reportStartDate = start;
    state.reportEndDate = end;
    syncRouteHash();
    goToView('reports', { keepContent: true });
  });
}

export function exportReportCsv() {
  if (!state.reportData) return showMessage('Load reports first before exporting.');
  const currency = getCurrencyCode();
  const sales = state.reportData.sales_summary || {};
  const purchases = state.reportData.purchase_summary || {};
  const rows = [
    ['section', 'label', 'count', 'units_or_rating', 'value', 'currency', 'category_filter', 'start_date', 'end_date']
  ];
  rows.push(['Sales Revenue', 'Completed Invoices', sales.total_orders || 0, sales.units_sold || 0, Number(sales.net_revenue || 0).toFixed(2), currency, state.reportCategory, state.reportStartDate, state.reportEndDate]);
  rows.push(['Purchasing', 'Active & Received POs', purchases.total_orders || 0, purchases.received_count || 0, Number(purchases.total_spend || 0).toFixed(2), currency, state.reportCategory, state.reportStartDate, state.reportEndDate]);
  (state.reportData.categories || []).forEach((c) => {
    rows.push(['Category Valuation', c.category, c.product_count, c.total_units, Number(c.total_value || 0).toFixed(2), currency, state.reportCategory, state.reportStartDate, state.reportEndDate]);
  });
  (state.reportData.movements || []).forEach((m) => {
    rows.push(['Movement Operations', m.type, m.count, m.net_quantity, '', currency, state.reportCategory, state.reportStartDate, state.reportEndDate]);
  });
  (state.reportData.supplier_performance || []).forEach((s) => {
    rows.push(['Supplier Tiers', s.tier, s.managed_products, s.avg_rating ?? '', '', currency, state.reportCategory, state.reportStartDate, state.reportEndDate]);
  });
  downloadCsv(`stockflow-report-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  showMessage(`Report summary exported (${currency}).`, 'success');
}
