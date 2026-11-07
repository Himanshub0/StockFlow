/**
 * Inventory Management & Health Monitoring Page View
 */

import { state } from '../state/app-state.js';
import { getIcon } from '../utils/dom.js';
import { formatCurrency, formatNumber } from '../utils/formatters.js';
import { renderStockBadge } from '../components/status-badge.js';
import { DataTable } from '../components/data-table.js';
import { openMovementForm } from '../features/movements/movement-form.js';

export function renderInventory(container) {
  const lowStockCount = state.getLowStockProducts().length;
  const outOfStockCount = state.getOutOfStockProducts().length;

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <span class="eyebrow-tag eyebrow-tag-emerald">${getIcon('boxes')} Real-Time Telemetry</span>
        <h1 class="page-title">Live Inventory Tracking</h1>
        <p class="page-description">Monitor safety buffers, stock depletion rates, and physical warehouse counts.</p>
      </div>
      <div class="page-actions">
        <button class="btn-pill btn-pill-secondary" id="inv-stock-in-btn">
          <span class="btn-icon-bubble">${getIcon('arrowDownLeft')}</span> Quick Receive
        </button>
        <button class="btn-pill btn-pill-secondary" id="inv-stock-out-btn">
          <span class="btn-icon-bubble">${getIcon('arrowUpRight')}</span> Quick Dispatch
        </button>
        <button class="btn-pill btn-pill-primary" id="inv-adjust-btn">
          <span class="btn-icon-bubble">${getIcon('refreshCw')}</span> Audit Adjustment
        </button>
      </div>
    </div>

    <!-- Filter & Stock Health Tabs -->
    <div class="filter-bar">
      <div class="filter-group">
        <div class="search-input-wrapper">
          <span class="search-icon">${getIcon('search')}</span>
          <input type="text" class="form-input" id="inv-search-input" placeholder="Filter by product or SKU...">
        </div>

        <button class="btn btn-secondary btn-sm inv-filter-tab active" data-status="">
          All (${state.products.length})
        </button>
        <button class="btn btn-secondary btn-sm inv-filter-tab" data-status="LOW_STOCK">
          Low Stock (${lowStockCount})
        </button>
        <button class="btn btn-secondary btn-sm inv-filter-tab" data-status="OUT_OF_STOCK">
          Out of Stock (${outOfStockCount})
        </button>
        <button class="btn btn-secondary btn-sm inv-filter-tab" data-status="IN_STOCK">
          In Stock (${state.products.length - lowStockCount - outOfStockCount})
        </button>
      </div>
    </div>

    <!-- Inventory Data Table -->
    <div id="inventory-table-container"></div>
  `;

  let activeStatusFilter = '';

  const columns = [
    {
      key: 'name',
      label: 'Product Item',
      sortable: true,
      render: (val, row) => `
        <div class="product-name-cell">
          <span class="product-name-title">${val}</span>
          <span class="product-name-desc">${row.category}</span>
        </div>
      `
    },
    {
      key: 'sku',
      label: 'SKU',
      sortable: true,
      mono: true
    },
    {
      key: 'quantity',
      label: 'Stock Health & Units',
      sortable: true,
      render: (val, row) => {
        const status = state.getStockStatus(row);
        const ratio = row.minimumStock > 0 ? Math.min(100, Math.round((val / (row.minimumStock * 2)) * 100)) : 100;
        let fillClass = 'in-stock';
        if (status === 'LOW_STOCK') fillClass = 'low-stock';
        if (status === 'OUT_OF_STOCK') fillClass = 'out-of-stock';

        return `
          <div>
            <div style="display: flex; justify-content: space-between; font-size: var(--font-size-xs);">
              <span><strong>${formatNumber(val)}</strong> units</span>
              <span class="mono" style="color: var(--text-secondary);">Min: ${row.minimumStock}</span>
            </div>
            <div class="stock-level-bar">
              <div class="stock-level-fill ${fillClass}" style="width: ${ratio}%;"></div>
            </div>
          </div>
        `;
      }
    },
    {
      key: 'price',
      label: 'Unit Cost',
      sortable: true,
      align: 'right',
      render: (val) => formatCurrency(val, state.settings.currency)
    },
    {
      key: 'totalValue',
      label: 'Total Valuation',
      sortable: true,
      align: 'right',
      render: (_, row) => formatCurrency(row.price * row.quantity, state.settings.currency)
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_, row) => renderStockBadge(state.getStockStatus(row))
    },
    {
      key: 'actions',
      label: 'Fast Action',
      align: 'right',
      render: (_, row) => `
        <div style="display: flex; gap: 4px; justify-content: flex-end;">
          <button class="btn btn-secondary btn-sm" data-action="quick-in" data-id="${row.id}" title="Receive Stock">
            ${getIcon('plus')} In
          </button>
          <button class="btn btn-secondary btn-sm" data-action="quick-out" data-id="${row.id}" title="Dispatch Stock">
            ${getIcon('arrowUpRight')} Out
          </button>
        </div>
      `
    }
  ];

  const tableContainer = container.querySelector('#inventory-table-container');
  const dataTable = new DataTable({
    columns,
    data: state.products,
    pageSize: state.settings.itemsPerPage || 10,
    emptyMessage: 'No inventory items match the filter'
  });

  const refreshTable = () => {
    const searchVal = container.querySelector('#inv-search-input').value.trim().toLowerCase();

    dataTable.setData(state.products);
    dataTable.setFilter(p => {
      const matchesSearch = !searchVal ||
        p.name.toLowerCase().includes(searchVal) ||
        p.sku.toLowerCase().includes(searchVal);
      const matchesStatus = !activeStatusFilter || state.getStockStatus(p) === activeStatusFilter;
      return matchesSearch && matchesStatus;
    });

    dataTable.render(tableContainer, (action, row) => {
      if (action === 'quick-in') {
        openMovementForm('IN', row.id, refreshTable);
      } else if (action === 'quick-out') {
        openMovementForm('OUT', row.id, refreshTable);
      }
    });
  };

  refreshTable();

  // Search input
  container.querySelector('#inv-search-input').addEventListener('input', refreshTable);

  // Status Filter Tabs
  container.querySelectorAll('.inv-filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.inv-filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeStatusFilter = tab.getAttribute('data-status');
      refreshTable();
    });
  });

  // Header quick buttons
  container.querySelector('#inv-stock-in-btn').onclick = () => openMovementForm('IN', null, refreshTable);
  container.querySelector('#inv-stock-out-btn').onclick = () => openMovementForm('OUT', null, refreshTable);
  container.querySelector('#inv-adjust-btn').onclick = () => openMovementForm('ADJUSTMENT', null, refreshTable);
}
