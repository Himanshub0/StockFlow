/**
 * Stock Movements Audit Trail Page View
 */

import { state } from '../state/app-state.js';
import { getIcon } from '../utils/dom.js';
import { formatDate, formatNumber } from '../utils/formatters.js';
import { renderMovementBadge } from '../components/status-badge.js';
import { DataTable } from '../components/data-table.js';
import { openMovementForm } from '../features/movements/movement-form.js';

export function renderMovements(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1 class="page-title">Stock Movements & Audit Trail</h1>
        <p class="page-description">Immutable chronological log of all stock receipts, dispatches, and manual adjustments.</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" id="mov-page-in-btn">
          ${getIcon('arrowDownLeft')} Stock In
        </button>
        <button class="btn btn-secondary" id="mov-page-out-btn">
          ${getIcon('arrowUpRight')} Stock Out
        </button>
        <button class="btn btn-primary" id="mov-page-adj-btn">
          ${getIcon('refreshCw')} Audit Adjustment
        </button>
      </div>
    </div>

    <!-- Filter Toolbar -->
    <div class="filter-bar">
      <div class="filter-group">
        <div class="search-input-wrapper">
          <span class="search-icon">${getIcon('search')}</span>
          <input type="text" class="form-input" id="mov-search-input" placeholder="Search reference or product...">
        </div>

        <select class="form-select" id="mov-type-filter" style="width: 180px;">
          <option value="">All Movement Types</option>
          <option value="IN">Stock In (Receipts)</option>
          <option value="OUT">Stock Out (Dispatches)</option>
          <option value="ADJUSTMENT">Adjustments</option>
        </select>
      </div>

      <div style="font-size: var(--font-size-xs); color: var(--text-secondary);" id="mov-count-summary">
        ${state.movements.length} total logged transactions
      </div>
    </div>

    <!-- Data Table Container -->
    <div id="movements-table-container"></div>
  `;

  const columns = [
    {
      key: 'date',
      label: 'Timestamp',
      sortable: true,
      render: (val) => formatDate(val)
    },
    {
      key: 'reference',
      label: 'Reference ID',
      sortable: true,
      mono: true,
      render: (val) => `<span style="font-weight: 500;">${val}</span>`
    },
    {
      key: 'productId',
      label: 'Product / SKU',
      sortable: true,
      render: (val) => {
        const p = state.products.find(item => item.id === val) || { name: 'Unknown Product', sku: '—' };
        return `
          <div>
            <div style="font-weight: 500;">${p.name}</div>
            <div class="mono" style="font-size: 11px; color: var(--text-secondary);">${p.sku}</div>
          </div>
        `;
      }
    },
    {
      key: 'type',
      label: 'Transaction',
      sortable: true,
      render: (val) => renderMovementBadge(val)
    },
    {
      key: 'quantity',
      label: 'Quantity Delta',
      sortable: true,
      align: 'right',
      render: (val, row) => {
        const sign = row.type === 'IN' ? '+' : (row.type === 'OUT' ? '-' : (val >= 0 ? '+' : ''));
        const color = row.type === 'IN' ? 'var(--color-success)' : (row.type === 'OUT' ? 'var(--color-danger)' : 'var(--color-warning)');
        return `<strong style="color: ${color}; font-variant-numeric: tabular-nums;">${sign}${Math.abs(val)}</strong>`;
      }
    },
    {
      key: 'balance',
      label: 'Balance (Before → After)',
      align: 'right',
      mono: true,
      render: (_, row) => `
        <span style="color: var(--text-secondary);">${row.previousQuantity}</span> → <strong>${row.newQuantity}</strong>
      `
    },
    {
      key: 'notes',
      label: 'Notes / Audit Trail',
      render: (val) => `<span style="color: var(--text-secondary); font-size: 12px;">${val || '—'}</span>`
    }
  ];

  const tableContainer = container.querySelector('#movements-table-container');
  const dataTable = new DataTable({
    columns,
    data: state.movements,
    pageSize: state.settings.itemsPerPage || 10,
    emptyMessage: 'No stock movements logged for the selected filter'
  });

  const refreshTable = () => {
    const searchVal = container.querySelector('#mov-search-input').value.trim().toLowerCase();
    const typeVal = container.querySelector('#mov-type-filter').value;

    dataTable.setData(state.movements);
    dataTable.setFilter(m => {
      const prod = state.products.find(p => p.id === m.productId) || { name: '', sku: '' };
      const matchesSearch = !searchVal ||
        m.reference.toLowerCase().includes(searchVal) ||
        prod.name.toLowerCase().includes(searchVal) ||
        prod.sku.toLowerCase().includes(searchVal);
      const matchesType = !typeVal || m.type === typeVal;
      return matchesSearch && matchesType;
    });

    dataTable.render(tableContainer);

    const countSummary = container.querySelector('#mov-count-summary');
    if (countSummary) {
      countSummary.textContent = `${dataTable.filteredData.length} of ${state.movements.length} transactions displayed`;
    }
  };

  refreshTable();

  container.querySelector('#mov-search-input').addEventListener('input', refreshTable);
  container.querySelector('#mov-type-filter').addEventListener('change', refreshTable);

  container.querySelector('#mov-page-in-btn').onclick = () => openMovementForm('IN', null, refreshTable);
  container.querySelector('#mov-page-out-btn').onclick = () => openMovementForm('OUT', null, refreshTable);
  container.querySelector('#mov-page-adj-btn').onclick = () => openMovementForm('ADJUSTMENT', null, refreshTable);
}
