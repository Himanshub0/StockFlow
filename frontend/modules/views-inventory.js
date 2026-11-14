import { api } from '../api-client.js';
import {
  cacheProducts,
  canDeleteRecords,
  dom,
  goToView,
  state,
  syncRouteHash,
  triggerSignOut
} from './state.js';
import {
  downloadAuthedCsv,
  escapeHtml,
  formatDate,
  formatShortDate,
  getCurrencyCode,
  getItemsPerPage,
  money,
  plural,
  statusLabel
} from './formatters.js';
import {
  attachFieldClearHandlers,
  button,
  clearFieldError,
  clearFormErrors,
  empty,
  errorStateMarkup,
  mountProductCombobox,
  openModal,
  paginationMarkup,
  searchIconSvg,
  setFieldError,
  setFormBanner,
  showMessage
} from './ui.js';

export function updateAlertBadge(count) {
  if (!dom.alertBadge) return;
  const alertsEnabled = String(state.settings?.enable_realtime_alerts ?? 'true') !== 'false';
  if (alertsEnabled && count > 0) {
    dom.alertBadge.hidden = false;
    dom.alertBadge.textContent = String(count);
  } else {
    dom.alertBadge.hidden = true;
  }
}

export async function refreshAlertBadge() {
  try {
    const d = await api.get('/api/inventory/alerts');
    updateAlertBadge((d.alerts || []).length);
  } catch {
    /* non-blocking badge refresh */
  }
}

/* ---------- Dashboard ---------- */
export async function renderDashboard() {
  const [overview, alertData, movementData] = await Promise.all([
    api.get('/api/inventory/overview'),
    api.get('/api/inventory/alerts'),
    api.get('/api/movements?limit=50')
  ]);
  if (overview.currency) state.settings.currency = overview.currency;
  const alerts = alertData.alerts || [];
  state.alerts = alerts;
  cacheProducts(alerts);
  updateAlertBadge(alerts.length);

  const movements = movementData.movements || [];
  const recentMovements = movements.slice(0, 8);
  state.movements = recentMovements;
  const today = new Date().toDateString();
  const todayMovements = movements.filter(
    (item) => new Date(String(item.created_at).replace(' ', 'T')).toDateString() === today
  ).length;
  const totalProducts = Number(overview.total_items || 0);
  const outOfStock = Number(overview.out_of_stock_count || 0);
  const lowStock = Number(overview.low_stock_count || 0);
  const inStock = Math.max(0, totalProducts - outOfStock - lowStock);
  const totalAlerts = outOfStock + lowStock;
  const healthyPercent = totalProducts ? Math.round((inStock / totalProducts) * 100) : 0;

  dom.appView.innerHTML = `
    <section class="stat-grid" aria-label="Store key metrics">
      <article class="stat-card">
        <span>Total products</span>
        <strong>${Number(overview.total_items || 0).toLocaleString('en-US')}</strong>
        <small>${Number(overview.total_stock || 0).toLocaleString('en-US')} total units on hand</small>
      </article>
      <article class="stat-card">
        <span>Stock value (${escapeHtml(getCurrencyCode())})</span>
        <strong>${escapeHtml(money(overview.total_value))}</strong>
        <small>Active inventory valuation</small>
      </article>
      <article class="stat-card ${overview.out_of_stock_count > 0 ? 'danger' : (totalAlerts > 0 ? 'warning' : '')}">
        <span>Urgent stock alerts</span>
        <strong>${totalAlerts}</strong>
        <small>${outOfStock} out of stock · ${lowStock} low stock</small>
      </article>
      <article class="stat-card">
        <span>Recent movements</span>
        <strong>${Number(movementData.total ?? movements.length).toLocaleString('en-US')}</strong>
        <small>${todayMovements} logged today</small>
      </article>
    </section>

    <section class="dashboard-priority-grid" aria-label="Stock health and urgent alerts">
      <article class="panel stock-health-panel" aria-labelledby="stock-health-heading">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Catalog health</p>
            <h2 id="stock-health-heading">Stock health</h2>
          </div>
          <span class="stock-health-percent">${healthyPercent}% healthy</span>
        </div>
        <div class="stock-health-bar" role="img" aria-label="${inStock} healthy, ${lowStock} low stock, ${outOfStock} out of stock">
          <span class="stock-health-segment healthy" style="width:${healthyPercent}%"></span>
          <span class="stock-health-segment low" style="width:${totalProducts ? (lowStock / totalProducts) * 100 : 0}%"></span>
          <span class="stock-health-segment out" style="width:${totalProducts ? (outOfStock / totalProducts) * 100 : 0}%"></span>
        </div>
        <div class="stock-health-legend">
          <span><i class="healthy" aria-hidden="true"></i>Healthy <b>${inStock}</b></span>
          <span><i class="low" aria-hidden="true"></i>Low <b>${lowStock}</b></span>
          <span><i class="out" aria-hidden="true"></i>Out <b>${outOfStock}</b></span>
        </div>
      </article>

      <section class="panel dashboard-alerts-panel" aria-labelledby="dash-alerts-heading">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Urgent priority</p>
            <h2 id="dash-alerts-heading">Stock alerts needing attention</h2>
          </div>
          ${button(`View all alerts (${alerts.length})`, 'view-alerts', 'text-button')}
        </div>
        ${alerts.length
          ? `<div class="alert-list">${alerts.slice(0, 5).map(dashboardAlertRow).join('')}</div>`
          : empty('Inventory is in shape', 'No products are at or below their minimum stock threshold.')}
      </section>
    </section>

    <section class="dashboard-secondary">
      ${movementChart(recentMovements)}
      <article class="panel recent-activity-panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Recent activity</p>
            <h3>Latest movements</h3>
          </div>
          ${button('See all', 'view-movements', 'text-button')}
        </div>
        ${recentMovements.length
          ? `<div class="activity-list">${recentMovements.slice(0, 5).map(activityRow).join('')}</div>`
          : empty('No movements yet', 'Your stock ledger will appear here.')}
      </article>
    </section>
  `;
}

function dashboardAlertRow(item) {
  const isOut = Number(item.current_stock) === 0;
  const suggested = Number(item.suggested_reorder || Math.max(1, (item.max_stock || 0) - (item.current_stock || 0)));
  return `
    <div class="alert-row">
      <span class="status-dot ${isOut ? 'red' : 'orange'}" aria-hidden="true"></span>
      <span>
        <b>${escapeHtml(item.name)} <span class="mono">(${escapeHtml(item.sku)})</span></b>
        <small>${item.current_stock} available · min ${item.min_stock} · max ${item.max_stock} · suggested restock +${suggested}</small>
      </span>
      <div class="alert-row-actions">
        <span class="status-badge ${isOut ? 'out' : 'low'}">${isOut ? 'Out of stock' : 'Low stock'}</span>
        <button class="action-button small primary" data-action="restock-alert" data-id="${item.id}" type="button">Restock (+${suggested})</button>
        <button class="action-button small" data-action="create-po-alert" data-id="${item.id}" type="button">Create PO</button>
      </div>
    </div>`;
}

function activityRow(item) {
  return `
    <div class="activity-row">
      <span class="activity-icon" aria-hidden="true">${escapeHtml((item.type || 'M').slice(0, 2))}</span>
      <span>
        <b>${escapeHtml(item.type)} · ${escapeHtml(item.product_name || `Product #${item.product_id}`)}</b>
        <small>${plural(Math.abs(Number(item.quantity || 0)), 'unit')} · ${formatShortDate(item.created_at)}</small>
      </span>
    </div>`;
}

export function renderDashboardChart() {
  const items = state.movements.slice(0, 8).reverse();
  dom.appView.querySelectorAll('.dashboard-chart .chart-label').forEach((label, index) => {
    if (items[index]) label.textContent = formatShortDate(items[index].created_at);
  });
  const chart = dom.appView.querySelector('.dashboard-chart .chart-wrap');
  if (chart && !chart.querySelector('.chart-scale')) {
    const max = Math.max(...items.map((item) => Math.abs(Number(item.quantity) || 0)), 1);
    chart.insertAdjacentHTML('afterbegin', `<div class="chart-scale"><span>${max.toLocaleString('en-US')}</span><span>${Math.round(max / 2).toLocaleString('en-US')}</span><span>0</span></div>`);
  }
}

function movementChart(movements = []) {
  if (!movements.length) {
    return `<section class="panel dashboard-chart"><div class="panel-heading"><div><p class="eyebrow">Movement pulse</p><h3>Recent stock flow</h3></div></div>${empty('No movement data yet', 'Your stock activity will become a chart here.')}</section>`;
  }
  const items = movements.slice(0, 8).reverse();
  const max = Math.max(...items.map((item) => Math.abs(Number(item.quantity) || 0)), 1);
  const bars = items.map((item, index) => {
    const quantity = Math.abs(Number(item.quantity) || 0);
    const height = Math.max(10, Math.round((quantity / max) * 128));
    const x = 36 + (index * 76);
    const y = 158 - height;
    const color = String(item.type).toUpperCase() === 'INBOUND' ? '#d8f06e' : '#246b4b';
    return `<rect class="chart-bar" x="${x}" y="${y}" width="38" height="${height}" rx="7" fill="${color}"><title>${escapeHtml(item.type)} · ${quantity} units</title></rect><text class="chart-label" x="${x + 19}" y="184" text-anchor="middle">${escapeHtml(String(item.type || 'M').slice(0, 2))}</text>`;
  }).join('');

  return `
    <section class="panel dashboard-chart">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Movement pulse</p>
          <h3>Recent stock flow</h3>
        </div>
        <span class="chart-summary">${plural(items.length, 'recent event')}</span>
      </div>
      <div class="chart-wrap">
        <svg class="flow-chart" viewBox="0 0 640 205" role="img" aria-label="Recent stock movement quantities">
          <line class="chart-gridline" x1="28" y1="30" x2="624" y2="30"></line>
          <line class="chart-gridline" x1="28" y1="94" x2="624" y2="94"></line>
          <line class="chart-gridline" x1="28" y1="158" x2="624" y2="158"></line>
          ${bars}
        </svg>
        <div class="chart-legend">
          <span><i class="legend-inbound"></i>Inbound</span>
          <span><i class="legend-outbound"></i>Outbound / adjustment / transfer</span>
        </div>
      </div>
    </section>`;
}

/* ---------- Products with server pagination ---------- */
function hasProductFilters() {
  return Boolean(state.productSearch.trim() || state.productCategory !== 'all' || state.productStatus !== 'all');
}

function buildProductQueryParams({ includePaging = true } = {}) {
  const limit = getItemsPerPage();
  const offset = (state.productPage - 1) * limit;
  const params = new URLSearchParams();
  if (includePaging) {
    params.set('limit', String(limit));
    params.set('offset', String(offset));
  }
  if (state.productSearch.trim()) params.set('search', state.productSearch.trim());
  if (state.productCategory !== 'all') params.set('category', state.productCategory);
  if (state.productStatus !== 'all') params.set('status', state.productStatus);
  return params;
}

export async function renderProducts() {
  const limit = getItemsPerPage();
  const reqId = ++state.reqSeq.products;
  const data = await api.get(`/api/products?${buildProductQueryParams().toString()}`);
  if (reqId !== state.reqSeq.products) return;

  state.products = data.products || [];
  cacheProducts(state.products);
  state.categories = data.categories || [];
  state.productTotal = data.total ?? state.products.length;
  state.productFilteredTotal = data.filtered_total ?? state.products.length;

  const totalPages = Math.max(1, Math.ceil(state.productFilteredTotal / limit));
  if (state.productPage > totalPages) {
    state.productPage = totalPages;
    syncRouteHash();
    return renderProducts();
  }

  dom.appView.innerHTML = `
    <div class="toolbar">
      <label class="search-field" aria-label="Search products">
        ${searchIconSvg}
        <input id="product-search-input" data-search="products" value="${escapeHtml(state.productSearch)}" placeholder="Search product name or SKU">
      </label>
      <select aria-label="Filter by category" data-filter="product-category"></select>
      <select aria-label="Filter by stock status" data-filter="product-status">
        <option value="all" ${state.productStatus === 'all' ? 'selected' : ''}>All statuses</option>
        <option value="in_stock" ${state.productStatus === 'in_stock' ? 'selected' : ''}>In stock</option>
        <option value="low_stock" ${state.productStatus === 'low_stock' ? 'selected' : ''}>Low stock</option>
        <option value="out_of_stock" ${state.productStatus === 'out_of_stock' ? 'selected' : ''}>Out of stock</option>
      </select>
      <button class="action-button ghost small" id="clear-product-filters" data-action="clear-product-filters" type="button" ${hasProductFilters() ? '' : 'disabled'}>Clear filters</button>
      <span class="table-count" id="products-count"></span>
    </div>
    <div id="products-results" class="table-panel"></div>
  `;

  updateProductsDom();

  document.querySelector('[data-filter="product-category"]').addEventListener('change', (event) => {
    state.productCategory = event.target.value;
    state.productPage = 1;
    syncRouteHash();
    refreshProductsTable();
  });
  document.querySelector('[data-filter="product-status"]').addEventListener('change', (event) => {
    state.productStatus = event.target.value;
    state.productPage = 1;
    syncRouteHash();
    refreshProductsTable();
  });
}

export async function refreshProductsTable() {
  const resultsEl = document.querySelector('#products-results');
  if (!resultsEl) return goToView('products');
  const reqId = ++state.reqSeq.products;
  resultsEl.classList.add('is-loading');
  resultsEl.setAttribute('aria-busy', 'true');
  try {
    const limit = getItemsPerPage();
    const data = await api.get(`/api/products?${buildProductQueryParams().toString()}`);
    if (reqId !== state.reqSeq.products) return;

    state.products = data.products || [];
    cacheProducts(state.products);
    state.categories = data.categories || [];
    state.productTotal = data.total ?? state.products.length;
    state.productFilteredTotal = data.filtered_total ?? state.products.length;

    const totalPages = Math.max(1, Math.ceil(state.productFilteredTotal / limit));
    if (state.productPage > totalPages) {
      state.productPage = totalPages;
      syncRouteHash();
      return refreshProductsTable();
    }
    updateProductsDom();
  } catch (error) {
    if (reqId !== state.reqSeq.products) return;
    if (error.status === 401) return triggerSignOut(false);
    showMessage(error.message || 'Failed to load products.');
    resultsEl.innerHTML = errorStateMarkup('Failed to load products', error.message);
  } finally {
    resultsEl.classList.remove('is-loading');
    resultsEl.removeAttribute('aria-busy');
  }
}

function updateProductsDom() {
  const resultsEl = document.querySelector('#products-results');
  const countEl = document.querySelector('#products-count');
  const clearBtn = document.querySelector('#clear-product-filters');
  const catSelect = document.querySelector('[data-filter="product-category"]');
  if (!resultsEl) return;

  if (catSelect) {
    const catOptions = state.categories
      .map((cat) => `<option value="${escapeHtml(cat)}" ${state.productCategory === cat ? 'selected' : ''}>${escapeHtml(cat)}</option>`)
      .join('');
    catSelect.innerHTML = `<option value="all" ${state.productCategory === 'all' ? 'selected' : ''}>All categories</option>${catOptions}`;
  }

  const limit = getItemsPerPage();
  const total = state.productTotal;
  const filtered = state.productFilteredTotal;
  const offset = (state.productPage - 1) * limit;
  const start = filtered === 0 ? 0 : offset + 1;
  const end = Math.min(offset + state.products.length, filtered);

  if (countEl) {
    countEl.textContent = hasProductFilters()
      ? `${filtered} matching of ${total} total`
      : (filtered > 0 ? `Showing ${start}–${end} of ${total} total` : '0 products');
  }
  if (clearBtn) clearBtn.disabled = !hasProductFilters();

  const emptyAction = hasProductFilters()
    ? button('Clear search & filters', 'clear-product-filters', 'primary')
    : button('Add product', 'add-product', 'primary');
  const emptyTitle = hasProductFilters() ? 'No matching products' : 'No products yet';
  const emptyCopy = hasProductFilters()
    ? 'No products matched your current search or filter settings.'
    : 'Add your first product or import a CSV catalog.';

  resultsEl.innerHTML = `
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Price (${escapeHtml(getCurrencyCode())})</th>
            <th>Stock</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${state.products.length
            ? state.products.map(productRow).join('')
            : `<tr class="empty-row"><td colspan="7">${empty(emptyTitle, emptyCopy, emptyAction)}</td></tr>`}
        </tbody>
      </table>
    </div>
    ${paginationMarkup(state.productPage, filtered, limit, 'products')}
  `;
}

function productRow(item) {
  const canDelete = canDeleteRecords();
  return `
    <tr data-product-row data-id="${item.id}">
      <td data-primary><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.supplier_name || 'No supplier')}</small></td>
      <td data-label="SKU" class="mono">${escapeHtml(item.sku)}</td>
      <td data-label="Category">${escapeHtml(item.category)}</td>
      <td data-label="Price" class="mono">${escapeHtml(money(item.unit_price))}</td>
      <td data-label="Stock">${item.current_stock} <small>min ${item.min_stock} / max ${item.max_stock}</small></td>
      <td data-label="Status"><span class="status-badge ${escapeHtml(item.status)}">${escapeHtml(statusLabel(item.status))}</span></td>
      <td class="row-actions">
        <button data-action="move-product" data-id="${item.id}" type="button" aria-label="Move stock for ${escapeHtml(item.name)}">Move</button>
        <button data-action="edit-product" data-id="${item.id}" type="button" aria-label="Edit ${escapeHtml(item.name)}">Edit</button>
        ${canDelete ? `<button class="danger-link" data-action="delete-product" data-id="${item.id}" type="button" aria-label="Delete ${escapeHtml(item.name)}">Delete</button>` : ''}
      </td>
    </tr>`;
}

export async function exportProductsCsv() {
  try {
    const qs = buildProductQueryParams({ includePaging: false }).toString();
    await downloadAuthedCsv(`/api/products/export${qs ? `?${qs}` : ''}`, `stockflow-products-${new Date().toISOString().slice(0, 10)}.csv`);
    showMessage(`Products CSV exported in ${getCurrencyCode()}.`, 'success');
  } catch (error) {
    showMessage(error.message);
  }
}

/* ---------- Movements with date filters & CSV export ---------- */
function hasMovementFilters() {
  return Boolean(state.movementSearch.trim() || state.movementType !== 'all' || state.movementStartDate || state.movementEndDate);
}

function buildMovementQueryParams({ includePaging = true } = {}) {
  const limit = getItemsPerPage();
  const offset = (state.movementPage - 1) * limit;
  const params = new URLSearchParams();
  if (includePaging) {
    params.set('limit', String(limit));
    params.set('offset', String(offset));
  }
  if (state.movementSearch.trim()) params.set('search', state.movementSearch.trim());
  if (state.movementType !== 'all') params.set('type', state.movementType);
  if (state.movementStartDate) params.set('start_date', state.movementStartDate);
  if (state.movementEndDate) params.set('end_date', state.movementEndDate);
  return params;
}

export async function renderMovements() {
  const reqId = ++state.reqSeq.movements;
  const data = await api.get(`/api/movements?${buildMovementQueryParams().toString()}`);
  if (reqId !== state.reqSeq.movements) return;

  state.movements = data.movements || [];
  state.movementTotal = data.total ?? state.movements.length;
  state.movementFilteredTotal = data.filtered_total ?? state.movements.length;

  dom.appView.innerHTML = `
    <div class="toolbar">
      <label class="search-field" aria-label="Search movements">
        ${searchIconSvg}
        <input data-search="movements" value="${escapeHtml(state.movementSearch)}" placeholder="Search SKU, product, reference, or notes">
      </label>
      <select aria-label="Filter by movement type" data-filter="movement-type">
        <option value="all" ${state.movementType === 'all' ? 'selected' : ''}>All types</option>
        <option value="INBOUND" ${state.movementType === 'INBOUND' ? 'selected' : ''}>Inbound</option>
        <option value="OUTBOUND" ${state.movementType === 'OUTBOUND' ? 'selected' : ''}>Outbound</option>
        <option value="TRANSFER" ${state.movementType === 'TRANSFER' ? 'selected' : ''}>Transfer</option>
        <option value="ADJUSTMENT" ${state.movementType === 'ADJUSTMENT' ? 'selected' : ''}>Adjustment</option>
      </select>
      <label class="date-filter-field">
        <span>From</span>
        <input type="date" data-filter="movement-start" value="${escapeHtml(state.movementStartDate)}" aria-label="Movement start date">
      </label>
      <label class="date-filter-field">
        <span>To</span>
        <input type="date" data-filter="movement-end" value="${escapeHtml(state.movementEndDate)}" aria-label="Movement end date">
      </label>
      <button class="action-button ghost small" id="clear-movement-filters" data-action="clear-movement-filters" type="button" ${hasMovementFilters() ? '' : 'disabled'}>Clear filters</button>
      <span class="table-count" id="movements-count"></span>
    </div>
    <div id="movements-results" class="table-panel"></div>
  `;

  updateMovementsDom();

  const applyDateOrType = () => {
    const startVal = document.querySelector('[data-filter="movement-start"]')?.value || '';
    const endVal = document.querySelector('[data-filter="movement-end"]')?.value || '';
    if (startVal && endVal && startVal > endVal) {
      showMessage('Start date cannot be after end date.');
      return;
    }
    state.movementType = document.querySelector('[data-filter="movement-type"]')?.value || 'all';
    state.movementStartDate = startVal;
    state.movementEndDate = endVal;
    state.movementPage = 1;
    syncRouteHash();
    refreshMovementsTable();
  };

  document.querySelector('[data-filter="movement-type"]').addEventListener('change', applyDateOrType);
  document.querySelector('[data-filter="movement-start"]').addEventListener('change', applyDateOrType);
  document.querySelector('[data-filter="movement-end"]').addEventListener('change', applyDateOrType);
}

export async function refreshMovementsTable() {
  const resultsEl = document.querySelector('#movements-results');
  if (!resultsEl) return goToView('movements');
  const reqId = ++state.reqSeq.movements;
  resultsEl.classList.add('is-loading');
  resultsEl.setAttribute('aria-busy', 'true');
  try {
    const data = await api.get(`/api/movements?${buildMovementQueryParams().toString()}`);
    if (reqId !== state.reqSeq.movements) return;
    state.movements = data.movements || [];
    state.movementTotal = data.total ?? state.movements.length;
    state.movementFilteredTotal = data.filtered_total ?? state.movements.length;
    updateMovementsDom();
  } catch (error) {
    if (reqId !== state.reqSeq.movements) return;
    if (error.status === 401) return triggerSignOut(false);
    showMessage(error.message || 'Failed to load movements.');
    resultsEl.innerHTML = errorStateMarkup('Failed to load movements', error.message);
  } finally {
    resultsEl.classList.remove('is-loading');
    resultsEl.removeAttribute('aria-busy');
  }
}

function updateMovementsDom() {
  const resultsEl = document.querySelector('#movements-results');
  const countEl = document.querySelector('#movements-count');
  const clearBtn = document.querySelector('#clear-movement-filters');
  if (!resultsEl) return;

  const limit = getItemsPerPage();
  const total = state.movementTotal;
  const filtered = state.movementFilteredTotal;
  const offset = (state.movementPage - 1) * limit;
  const start = filtered === 0 ? 0 : offset + 1;
  const end = Math.min(offset + state.movements.length, filtered);

  if (countEl) {
    countEl.textContent = hasMovementFilters()
      ? `${filtered} matching of ${total} total`
      : (filtered > 0 ? `Showing ${start}–${end} of ${total} total` : '0 movements');
  }
  if (clearBtn) clearBtn.disabled = !hasMovementFilters();

  const emptyAction = hasMovementFilters()
    ? button('Clear filters', 'clear-movement-filters', 'primary')
    : button('Record movement', 'add-movement', 'primary');

  resultsEl.innerHTML = `
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Type</th>
            <th>Quantity</th>
            <th>Reference &amp; Notes</th>
            <th>Performed by</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${state.movements.length
            ? state.movements.map(movementRow).join('')
            : `<tr class="empty-row"><td colspan="6">${empty('No matching movements', hasMovementFilters() ? 'Try clearing your filters or searching another SKU.' : 'Record an inbound, outbound, adjustment, or transfer.', emptyAction)}</td></tr>`}
        </tbody>
      </table>
    </div>
    ${paginationMarkup(state.movementPage, filtered, limit, 'movements')}
  `;
}

function movementRow(item) {
  const sku = item.product_sku || item.sku || '';
  const ref = item.reference_no || '—';
  const notes = item.notes ? `<small>${escapeHtml(item.notes)}</small>` : '';
  return `
    <tr>
      <td data-primary><b>${escapeHtml(item.product_name || `Product #${item.product_id}`)}</b><small class="mono">${escapeHtml(sku)}</small></td>
      <td data-label="Type"><span class="status-badge movement-${escapeHtml(String(item.type).toLowerCase())}">${escapeHtml(item.type)}</span></td>
      <td data-label="Quantity" class="mono">${item.quantity > 0 && item.type === 'ADJUSTMENT' ? `+${item.quantity}` : item.quantity}</td>
      <td data-label="Reference">${escapeHtml(ref)}${notes}</td>
      <td data-label="Performed by">${escapeHtml(item.performed_by || '—')}</td>
      <td data-label="Date">${formatDate(item.created_at)}</td>
    </tr>`;
}

export async function exportMovementsCsv() {
  try {
    const qs = buildMovementQueryParams({ includePaging: false }).toString();
    await downloadAuthedCsv(`/api/movements/export${qs ? `?${qs}` : ''}`, `stockflow-movements-${new Date().toISOString().slice(0, 10)}.csv`);
    showMessage('Stock movements CSV exported.', 'success');
  } catch (error) {
    showMessage(error.message);
  }
}

/* ---------- Stock Alerts ---------- */
function sortAlertsPriority(alerts = []) {
  return [...alerts].sort((a, b) => {
    const aOut = Number(a.current_stock) === 0 ? 0 : 1;
    const bOut = Number(b.current_stock) === 0 ? 0 : 1;
    if (aOut !== bOut) return aOut - bOut;
    const aDeficit = Number(a.min_stock || 0) - Number(a.current_stock || 0);
    const bDeficit = Number(b.min_stock || 0) - Number(b.current_stock || 0);
    if (aDeficit !== bDeficit) return bDeficit - aDeficit;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
}

function hasAlertFilters() {
  return Boolean(state.alertSearch.trim() || state.alertSeverity !== 'all' || state.alertCategory !== 'all');
}

export async function renderAlerts() {
  const data = await api.get('/api/inventory/alerts');
  const alerts = sortAlertsPriority(data.alerts || []);
  state.alerts = alerts;
  cacheProducts(alerts);
  updateAlertBadge(alerts.length);

  const categories = [...new Set(alerts.map((a) => a.category).filter(Boolean))].sort();
  const catOptions = categories.map((cat) => `<option value="${escapeHtml(cat)}" ${state.alertCategory === cat ? 'selected' : ''}>${escapeHtml(cat)}</option>`).join('');

  dom.appView.innerHTML = `
    <div class="toolbar">
      <label class="search-field" aria-label="Search alerts">
        ${searchIconSvg}
        <input data-search="alerts" value="${escapeHtml(state.alertSearch)}" placeholder="Search alert product, SKU, or supplier">
      </label>
      <select aria-label="Filter by alert severity" data-filter="alert-severity">
        <option value="all" ${state.alertSeverity === 'all' ? 'selected' : ''}>All severities</option>
        <option value="out_of_stock" ${state.alertSeverity === 'out_of_stock' ? 'selected' : ''}>Out of stock only</option>
        <option value="low_stock" ${state.alertSeverity === 'low_stock' ? 'selected' : ''}>Low stock only</option>
      </select>
      <select aria-label="Filter alerts by category" data-filter="alert-category">
        <option value="all">All categories</option>
        ${catOptions}
      </select>
      <button class="action-button ghost small" id="clear-alert-filters" data-action="clear-alert-filters" type="button" ${hasAlertFilters() ? '' : 'disabled'}>Clear filters</button>
      <span class="table-count" id="alerts-count"></span>
    </div>
    <div id="alerts-list-container"></div>
  `;

  updateAlertsDom();

  document.querySelector('[data-filter="alert-severity"]').addEventListener('change', (event) => {
    state.alertSeverity = event.target.value;
    syncRouteHash();
    updateAlertsDom();
  });
  document.querySelector('[data-filter="alert-category"]').addEventListener('change', (event) => {
    state.alertCategory = event.target.value;
    syncRouteHash();
    updateAlertsDom();
  });
}

export function updateAlertsDom() {
  const container = document.querySelector('#alerts-list-container');
  const countEl = document.querySelector('#alerts-count');
  const clearBtn = document.querySelector('#clear-alert-filters');
  if (!container) return;

  const term = state.alertSearch.trim().toLowerCase();
  const filtered = state.alerts.filter((item) => {
    const isOut = Number(item.current_stock) === 0;
    if (state.alertSeverity === 'out_of_stock' && !isOut) return false;
    if (state.alertSeverity === 'low_stock' && isOut) return false;
    if (state.alertCategory !== 'all' && item.category !== state.alertCategory) return false;
    if (term) {
      const hay = `${item.name || ''} ${item.sku || ''} ${item.supplier_name || ''}`.toLowerCase();
      if (!hay.includes(term)) return false;
    }
    return true;
  });

  const outCount = filtered.filter((a) => Number(a.current_stock) === 0).length;
  const lowCount = filtered.length - outCount;
  if (countEl) {
    countEl.textContent = hasAlertFilters()
      ? `${filtered.length} matching of ${state.alerts.length} alerts (${outCount} out · ${lowCount} low)`
      : `${state.alerts.length} alerts (${outCount} out of stock · ${lowCount} low stock)`;
  }
  if (clearBtn) clearBtn.disabled = !hasAlertFilters();

  if (!filtered.length) {
    container.innerHTML = `<div class="panel">${empty(
      hasAlertFilters() ? 'No matching alerts' : 'No stock alerts',
      hasAlertFilters() ? 'No alerts match your current search or filter.' : 'Every product is above its minimum stock threshold.',
      hasAlertFilters() ? button('Clear filters', 'clear-alert-filters', 'primary') : ''
    )}</div>`;
    return;
  }

  container.innerHTML = `<div class="alert-panel">${filtered.map(alertCardMarkup).join('')}</div>`;
}

function alertCardMarkup(item) {
  const isOut = Number(item.current_stock) === 0;
  const suggested = Number(item.suggested_reorder || Math.max(1, (item.max_stock || 0) - (item.current_stock || 0)));
  return `
    <article class="alert-card">
      <div class="alert-card-head">
        <div>
          <span class="status-badge ${isOut ? 'out' : 'low'}">${isOut ? 'Out of stock' : 'Low stock'}</span>
          <h3>${escapeHtml(item.name)}</h3>
          <p><span class="mono">${escapeHtml(item.sku)}</span> · ${escapeHtml(item.category)} · ${escapeHtml(item.supplier_name || 'No supplier')}</p>
        </div>
      </div>
      <div class="alert-metrics">
        <div><span>Current</span><b>${item.current_stock}</b></div>
        <div><span>Minimum</span><b>${item.min_stock}</b></div>
        <div><span>Maximum</span><b>${item.max_stock}</b></div>
        <div><span>Suggested order</span><b>+${suggested}</b></div>
      </div>
      <div class="alert-card-actions">
        <button class="action-button small primary" data-action="restock-alert" data-id="${item.id}" type="button">Restock (+${suggested})</button>
        <button class="action-button small" data-action="create-po-alert" data-id="${item.id}" type="button">Create PO</button>
        <button class="action-button small ghost" data-action="move-product" data-id="${item.id}" type="button">Record movement</button>
      </div>
    </article>`;
}

/* ---------- Product & Movement Forms ---------- */
export async function productForm(item = {}) {
  const editing = Boolean(item && item.id);
  const loaders = [];
  if (!state.allSuppliers.length) {
    loaders.push(api.get('/api/suppliers').then((d) => { state.allSuppliers = d.suppliers || []; }).catch(() => {}));
  }
  if (!state.categories.length) {
    loaders.push(api.get('/api/products?limit=1').then((d) => { state.categories = d.categories || []; }).catch(() => {}));
  }
  if (loaders.length) await Promise.all(loaders);

  const defaultMin = Number.parseInt(state.settings?.default_low_stock_threshold, 10);
  const minVal = editing ? item.min_stock : (Number.isFinite(defaultMin) ? defaultMin : 10);
  const supplierOpts = [
    '<option value="">No supplier</option>',
    ...state.allSuppliers.map((s) => `<option value="${s.id}" ${Number(item.supplier_id) === Number(s.id) ? 'selected' : ''}>${escapeHtml(s.name)} (${escapeHtml(s.code)})</option>`)
  ].join('');
  const categoryList = state.categories.map((c) => `<option value="${escapeHtml(c)}"></option>`).join('');

  openModal(editing ? 'Edit product' : 'Add product', `
    <form class="modal-form" data-form="product" data-id="${item.id || ''}" novalidate>
      <div class="form-message" role="alert" hidden></div>
      <div class="form-columns">
        <label class="field">
          <span>SKU ${editing ? '(read-only)' : '*'}</span>
          <input name="sku" ${editing ? 'readonly' : 'required'} value="${escapeHtml(item.sku || '')}" placeholder="SKU-001">
          <span class="field-error" hidden></span>
        </label>
        <label class="field">
          <span>Category *</span>
          <input name="category" list="product-categories-list" required value="${escapeHtml(item.category || 'General')}" placeholder="General">
          <datalist id="product-categories-list">${categoryList}</datalist>
          <span class="field-error" hidden></span>
        </label>
      </div>
      <label class="field">
        <span>Product name *</span>
        <input name="name" required value="${escapeHtml(item.name || '')}" placeholder="Product name">
        <span class="field-error" hidden></span>
      </label>
      <div class="form-columns">
        <label class="field">
          <span>Unit price (${escapeHtml(getCurrencyCode())}) *</span>
          <input name="unit_price" type="number" min="0" step="0.01" required value="${item.unit_price ?? ''}" placeholder="0.00">
          <span class="field-error" hidden></span>
        </label>
        <label class="field">
          <span>Supplier</span>
          <select name="supplier_id">${supplierOpts}</select>
          <span class="field-error" hidden></span>
        </label>
      </div>
      <div class="form-columns">
        <label class="field">
          <span>Current stock *</span>
          <input name="current_stock" type="number" min="0" step="1" required value="${item.current_stock ?? 0}">
          <span class="field-error" hidden></span>
        </label>
        <label class="field">
          <span>Minimum stock *</span>
          <input name="min_stock" type="number" min="0" step="1" required value="${minVal}">
          <span class="field-error" hidden></span>
        </label>
      </div>
      <label class="field">
        <span>Maximum stock *</span>
        <input name="max_stock" type="number" min="0" step="1" required value="${item.max_stock ?? 500}">
        <span class="field-error" hidden></span>
      </label>
      <div class="modal-actions">
        <button class="action-button ghost" data-action="close-modal" type="button">Cancel</button>
        <button class="action-button primary" type="submit">${editing ? 'Save product' : 'Create product'}</button>
      </div>
    </form>`);
  attachFieldClearHandlers(dom.modalContent.querySelector('[data-form="product"]'));
}

export function validateProductForm(form) {
  clearFormErrors(form);
  const editing = Boolean(form.dataset.id);
  const fd = new FormData(form);
  const sku = String(fd.get('sku') || '').trim().toUpperCase();
  const name = String(fd.get('name') || '').trim();
  const category = String(fd.get('category') || '').trim();
  const rawPrice = String(fd.get('unit_price') ?? '').trim();
  const rawStock = String(fd.get('current_stock') ?? '').trim();
  const rawMin = String(fd.get('min_stock') ?? '').trim();
  const rawMax = String(fd.get('max_stock') ?? '').trim();
  let valid = true;

  if (!editing && !sku) {
    setFieldError(form, 'sku', 'SKU is required.');
    valid = false;
  }
  if (!name) {
    setFieldError(form, 'name', 'Product name is required.');
    valid = false;
  }
  if (!category) {
    setFieldError(form, 'category', 'Category is required.');
    valid = false;
  }

  const price = Number(rawPrice);
  if (rawPrice === '' || !Number.isFinite(price) || price < 0) {
    setFieldError(form, 'unit_price', 'Enter a valid non-negative price (0 or higher).');
    valid = false;
  }

  const parseIntNonNeg = (raw, field, label) => {
    const n = Number(raw);
    if (raw === '' || !Number.isInteger(n) || n < 0) {
      setFieldError(form, field, `${label} must be a whole number (0 or higher).`);
      return null;
    }
    return n;
  };
  const currentStock = parseIntNonNeg(rawStock, 'current_stock', 'Current stock');
  const minStock = parseIntNonNeg(rawMin, 'min_stock', 'Minimum stock');
  const maxStock = parseIntNonNeg(rawMax, 'max_stock', 'Maximum stock');
  if (currentStock === null || minStock === null || maxStock === null) valid = false;

  if (minStock !== null && maxStock !== null && maxStock < minStock) {
    setFieldError(form, 'max_stock', `Maximum stock (${maxStock}) must be greater than or equal to minimum stock (${minStock}).`);
    valid = false;
  }

  if (!valid) {
    setFormBanner(form, 'Please fix the highlighted fields before saving.', 'error');
    form.querySelector('.has-error input, .has-error select')?.focus();
    return null;
  }

  const supplierId = String(fd.get('supplier_id') || '').trim();
  return {
    ...(editing ? {} : { sku }),
    name,
    category,
    unit_price: price,
    current_stock: currentStock,
    min_stock: minStock,
    max_stock: maxStock,
    supplier_id: supplierId ? Number(supplierId) : null
  };
}

export async function movementForm(opts = {}) {
  let initialProduct = opts.product || null;
  const targetId = opts.productId ?? initialProduct?.id;
  if (targetId) {
    try {
      const res = await api.get(`/api/products/${targetId}`);
      if (res.product) {
        initialProduct = res.product;
        cacheProducts([initialProduct]);
      }
    } catch {
      if (!initialProduct) initialProduct = state.productCache.get(Number(targetId)) || null;
    }
  }
  const initialType = opts.type || 'INBOUND';
  const initialQty = opts.quantity != null ? String(opts.quantity) : '';
  const initialNotes = opts.notes || '';

  openModal('Record stock movement', `
    <form class="modal-form" data-form="movement" novalidate>
      <div class="form-message" role="alert" hidden></div>
      <div id="source-product-slot"></div>
      <div class="form-columns">
        <label class="field" for="movement-type-select">
          <span>Movement type *</span>
          <select id="movement-type-select" name="type" required>
            <option value="INBOUND" ${initialType === 'INBOUND' ? 'selected' : ''}>Inbound (Receive)</option>
            <option value="OUTBOUND" ${initialType === 'OUTBOUND' ? 'selected' : ''}>Outbound (Dispatch)</option>
            <option value="ADJUSTMENT" ${initialType === 'ADJUSTMENT' ? 'selected' : ''}>Adjustment (Manual)</option>
            <option value="TRANSFER" ${initialType === 'TRANSFER' ? 'selected' : ''}>Transfer (Between SKUs)</option>
          </select>
          <span class="field-error" hidden></span>
        </label>
        <label class="field" for="movement-quantity-input">
          <span>Quantity *</span>
          <input id="movement-quantity-input" name="quantity" type="number" step="1" required value="${escapeHtml(initialQty)}" placeholder="10">
          <span class="field-hint" id="movement-qty-hint">Positive whole number</span>
          <span class="field-error" hidden></span>
        </label>
      </div>
      <div id="destination-product-slot" hidden></div>
      <div id="movement-stock-preview" class="stock-preview" aria-live="polite"></div>
      <label class="field" for="movement-ref-input">
        <span>Reference</span>
        <input id="movement-ref-input" name="reference_no" placeholder="Optional PO / SO / Ref number">
      </label>
      <label class="field" for="movement-notes-input">
        <span id="movement-notes-label">Notes</span>
        <textarea id="movement-notes-input" name="notes" rows="2" placeholder="Why is this movement happening?">${escapeHtml(initialNotes)}</textarea>
        <span class="field-error" hidden></span>
      </label>
      <div class="modal-actions">
        <button class="action-button ghost" data-action="close-modal" type="button">Cancel</button>
        <button class="action-button primary" type="submit">Record movement</button>
      </div>
    </form>`);

  const form = dom.modalContent.querySelector('[data-form="movement"]');
  const typeSelect = form.querySelector('#movement-type-select');
  const qtyInput = form.querySelector('#movement-quantity-input');
  const qtyHint = form.querySelector('#movement-qty-hint');
  const notesLabel = form.querySelector('#movement-notes-label');
  const destSlot = form.querySelector('#destination-product-slot');
  const preview = form.querySelector('#movement-stock-preview');

  let sourceProd = initialProduct;
  let destProd = null;

  const updatePreview = () => {
    const mType = typeSelect.value;
    const isTransfer = mType === 'TRANSFER';
    destSlot.hidden = !isTransfer;
    qtyHint.textContent = mType === 'ADJUSTMENT'
      ? 'Positive adds stock (+5), negative deducts (-5); non-zero integer'
      : 'Positive whole number';
    notesLabel.textContent = mType === 'ADJUSTMENT' ? 'Reason / Notes * (required for adjustments)' : 'Notes';

    const rawQty = qtyInput.value.trim();
    const qty = rawQty === '' ? NaN : Number(rawQty);
    const hasIntQty = rawQty !== '' && Number.isInteger(qty) && qty !== 0;

    preview.className = 'stock-preview';
    if (!sourceProd) {
      preview.innerHTML = '<span>Select a product above to see current stock and projected stock balance.</span>';
      return;
    }

    if (!hasIntQty) {
      const extra = isTransfer && destProd
        ? `<div class="stock-preview-row"><span>Destination (${escapeHtml(destProd.sku)})</span><strong>${destProd.current_stock} units currently in stock</strong></div>`
        : (isTransfer ? '<div class="stock-preview-row"><span>Destination</span><strong>Select a destination product</strong></div>' : '');
      preview.innerHTML = `<div class="stock-preview-row"><span>Source (${escapeHtml(sourceProd.sku)})</span><strong>${sourceProd.current_stock} units currently in stock (min ${sourceProd.min_stock})</strong></div>${extra}`;
      return;
    }

    if (mType === 'INBOUND') {
      if (qty < 0) {
        preview.classList.add('is-invalid');
        preview.innerHTML = '<strong>Inbound quantity must be positive.</strong>';
        return;
      }
      const next = sourceProd.current_stock + qty;
      preview.innerHTML = `<div class="stock-preview-row"><span>${escapeHtml(sourceProd.sku)} balance</span><strong>${sourceProd.current_stock} → ${next} units (+${qty})</strong></div>`;
      return;
    }

    if (mType === 'OUTBOUND') {
      if (qty < 0) {
        preview.classList.add('is-invalid');
        preview.innerHTML = '<strong>Outbound quantity must be positive.</strong>';
        return;
      }
      const next = sourceProd.current_stock - qty;
      if (next < 0) {
        preview.classList.add('is-invalid');
        preview.innerHTML = `<strong>Insufficient stock: ${sourceProd.current_stock} available, cannot dispatch ${qty}.</strong>`;
        return;
      }
      if (next <= sourceProd.min_stock) preview.classList.add('is-warning');
      preview.innerHTML = `<div class="stock-preview-row"><span>${escapeHtml(sourceProd.sku)} balance</span><strong>${sourceProd.current_stock} → ${next} units (-${qty})${next === 0 ? ' · Out of stock' : (next <= sourceProd.min_stock ? ' · Low stock' : '')}</strong></div>`;
      return;
    }

    if (mType === 'ADJUSTMENT') {
      const next = sourceProd.current_stock + qty;
      if (next < 0) {
        preview.classList.add('is-invalid');
        preview.innerHTML = `<strong>Invalid adjustment: ${sourceProd.current_stock} + (${qty}) = ${next} (negative stock not allowed).</strong>`;
        return;
      }
      if (next <= sourceProd.min_stock) preview.classList.add('is-warning');
      preview.innerHTML = `<div class="stock-preview-row"><span>${escapeHtml(sourceProd.sku)} balance</span><strong>${sourceProd.current_stock} → ${next} units (${qty > 0 ? `+${qty}` : qty})</strong></div>`;
      return;
    }

    if (mType === 'TRANSFER') {
      if (qty < 0) {
        preview.classList.add('is-invalid');
        preview.innerHTML = '<strong>Transfer quantity must be positive.</strong>';
        return;
      }
      const srcNext = sourceProd.current_stock - qty;
      const sameProd = destProd && Number(destProd.id) === Number(sourceProd.id);
      if (sameProd) {
        preview.classList.add('is-invalid');
        preview.innerHTML = '<strong>Source and destination products must differ.</strong>';
        return;
      }
      if (srcNext < 0) {
        preview.classList.add('is-invalid');
        preview.innerHTML = `<strong>Insufficient source stock: ${sourceProd.current_stock} available, cannot transfer ${qty}.</strong>`;
        return;
      }
      const dstNext = destProd ? destProd.current_stock + qty : null;
      preview.innerHTML = `
        <div class="stock-preview-row"><span>Source (${escapeHtml(sourceProd.sku)})</span><strong>${sourceProd.current_stock} → ${srcNext} units (-${qty})</strong></div>
        <div class="stock-preview-row"><span>Destination ${destProd ? `(${escapeHtml(destProd.sku)})` : ''}</span><strong>${destProd ? `${destProd.current_stock} → ${dstNext} units (+${qty})` : 'Select destination product'}</strong></div>
        <small style="color:var(--muted);">Transfers debit the source SKU and record a matching inbound credit on the destination SKU.</small>`;
    }
  };

  mountProductCombobox(form.querySelector('#source-product-slot'), {
    id: 'src-product',
    name: 'product_id',
    label: 'Source product *',
    placeholder: 'Search product name or SKU…',
    initialProduct,
    onSelect: (prod) => { sourceProd = prod; updatePreview(); }
  });

  mountProductCombobox(destSlot, {
    id: 'dst-product',
    name: 'target_product_id',
    label: 'Destination product * (receives stock)',
    placeholder: 'Search destination product or SKU…',
    initialProduct: null,
    onSelect: (prod) => { destProd = prod; updatePreview(); }
  });

  typeSelect.addEventListener('change', () => {
    if (typeSelect.value !== 'TRANSFER') clearFieldError(form, 'target_product_id');
    updatePreview();
  });
  qtyInput.addEventListener('input', () => {
    clearFieldError(form, 'quantity');
    updatePreview();
  });
  form.querySelector('#movement-notes-input')?.addEventListener('input', () => clearFieldError(form, 'notes'));
  updatePreview();
}

export function validateMovementForm(form) {
  clearFormErrors(form);
  const fd = new FormData(form);
  const productId = String(fd.get('product_id') || '').trim();
  const targetId = String(fd.get('target_product_id') || '').trim();
  const mType = String(fd.get('type') || '').toUpperCase();
  const rawQty = String(fd.get('quantity') ?? '').trim();
  const notes = String(fd.get('notes') || '').trim();
  const ref = String(fd.get('reference_no') || '').trim();
  const qty = Number(rawQty);
  let valid = true;

  const src = productId ? state.productCache.get(Number(productId)) : null;

  if (!productId) {
    setFieldError(form, 'product_id', 'Please select a product from the search list.');
    valid = false;
  }
  if (rawQty === '' || !Number.isInteger(qty) || qty === 0) {
    setFieldError(form, 'quantity', 'Quantity must be a non-zero whole number.');
    valid = false;
  } else if (mType !== 'ADJUSTMENT' && qty < 0) {
    setFieldError(form, 'quantity', `Quantity for ${mType.toLowerCase()} must be positive.`);
    valid = false;
  }

  if (mType === 'OUTBOUND' && src && Number.isInteger(qty) && qty > 0 && qty > src.current_stock) {
    setFieldError(form, 'quantity', `Insufficient stock: only ${src.current_stock} available for ${src.sku}.`);
    valid = false;
  }

  if (mType === 'ADJUSTMENT') {
    if (src && Number.isInteger(qty) && src.current_stock + qty < 0) {
      setFieldError(form, 'quantity', `Adjustment would make stock negative (${src.current_stock + qty}).`);
      valid = false;
    }
    if (!notes) {
      setFieldError(form, 'notes', 'A reason / notes explanation is required for stock adjustments.');
      valid = false;
    }
  }

  if (mType === 'TRANSFER') {
    if (!targetId) {
      setFieldError(form, 'target_product_id', 'Please select a destination product for transfer.');
      valid = false;
    } else if (targetId === productId) {
      setFieldError(form, 'target_product_id', 'Destination product must differ from source product.');
      valid = false;
    }
    if (src && Number.isInteger(qty) && qty > 0 && qty > src.current_stock) {
      setFieldError(form, 'quantity', `Insufficient stock to transfer (${src.current_stock} available).`);
      valid = false;
    }
  }

  if (!valid) {
    setFormBanner(form, 'Please resolve the highlighted movement errors.', 'error');
    return null;
  }

  return {
    product_id: Number(productId),
    type: mType,
    quantity: qty,
    reference_no: ref,
    notes,
    ...(mType === 'TRANSFER' ? { target_product_id: Number(targetId) } : {})
  };
}
