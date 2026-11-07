/**
 * Products Management Page View
 */

import { state } from '../state/app-state.js';
import { getIcon } from '../utils/dom.js';
import { formatCurrency, formatNumber } from '../utils/formatters.js';
import { renderStockBadge } from '../components/status-badge.js';
import { DataTable } from '../components/data-table.js';
import { openProductForm } from '../features/products/product-form.js';
import { handleProductAction } from '../features/products/product-actions.js';

export function renderProducts(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <span class="eyebrow-tag eyebrow-tag-blue">${getIcon('package')} Master SKU Catalog</span>
        <h1 class="page-title">Products Management</h1>
        <p class="page-description">Maintain master product catalog, specifications, and SKU attributes.</p>
      </div>
      <div class="page-actions">
        <button class="btn-pill btn-pill-primary" id="add-product-btn">
          <span class="btn-icon-bubble">${getIcon('plus')}</span>
          Add Product
        </button>
      </div>
    </div>

    <!-- Filter & Search Toolbar -->
    <div class="filter-bar">
      <div class="filter-group">
        <div class="search-input-wrapper">
          <span class="search-icon">${getIcon('search')}</span>
          <input type="text" class="form-input" id="product-search-input" placeholder="Search by name or SKU...">
        </div>

        <select class="form-select" id="product-category-filter" style="width: 170px;">
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Stationery">Stationery</option>
          <option value="Accessories">Accessories</option>
          <option value="Office Supplies">Office Supplies</option>
          <option value="Storage">Storage</option>
        </select>

        <select class="form-select" id="product-status-filter" style="width: 160px;">
          <option value="">All Stock Statuses</option>
          <option value="IN_STOCK">In Stock</option>
          <option value="LOW_STOCK">Low Stock</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
        </select>
      </div>

      <div style="font-size: var(--font-size-xs); color: var(--text-secondary);" id="product-count-summary">
        Showing ${state.products.length} products
      </div>
    </div>

    <!-- Data Table Container -->
    <div id="products-table-container"></div>
  `;

  const columns = [
    {
      key: 'name',
      label: 'Product Details',
      sortable: true,
      render: (val, row) => `
        <div class="product-name-cell">
          <span class="product-name-title">${val}</span>
          <span class="product-name-desc">${row.description || 'No description provided'}</span>
        </div>
      `
    },
    {
      key: 'sku',
      label: 'SKU',
      sortable: true,
      mono: true,
      render: (val) => `<span style="font-weight: 500;">${val}</span>`
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true
    },
    {
      key: 'price',
      label: 'Unit Price',
      sortable: true,
      align: 'right',
      render: (val) => formatCurrency(val, state.settings.currency)
    },
    {
      key: 'quantity',
      label: 'Available',
      sortable: true,
      align: 'right',
      render: (val) => `<strong>${formatNumber(val)}</strong>`
    },
    {
      key: 'minimumStock',
      label: 'Min Safety',
      sortable: true,
      align: 'right',
      mono: true,
      render: (val) => formatNumber(val)
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_, row) => renderStockBadge(state.getStockStatus(row))
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (_, row) => `
        <div class="products-table-actions" style="justify-content: flex-end;">
          <button class="btn btn-secondary btn-sm btn-icon-only" data-action="edit" data-id="${row.id}" title="Edit Product">
            ${getIcon('edit')}
          </button>
          <button class="btn btn-outline-danger btn-sm btn-icon-only" data-action="delete" data-id="${row.id}" title="Delete Product">
            ${getIcon('trash')}
          </button>
        </div>
      `
    }
  ];

  const tableContainer = container.querySelector('#products-table-container');
  const dataTable = new DataTable({
    columns,
    data: state.products,
    pageSize: state.settings.itemsPerPage || 10,
    emptyMessage: 'No products match the selected criteria'
  });

  const refreshTable = () => {
    const searchVal = container.querySelector('#product-search-input').value.trim().toLowerCase();
    const catVal = container.querySelector('#product-category-filter').value;
    const statusVal = container.querySelector('#product-status-filter').value;

    dataTable.setData(state.products);
    dataTable.setFilter(p => {
      const matchesSearch = !searchVal ||
        p.name.toLowerCase().includes(searchVal) ||
        p.sku.toLowerCase().includes(searchVal);
      const matchesCat = !catVal || p.category === catVal;
      const matchesStatus = !statusVal || state.getStockStatus(p) === statusVal;
      return matchesSearch && matchesCat && matchesStatus;
    });

    dataTable.render(tableContainer, (action, row) => {
      handleProductAction(action, row, refreshTable);
    });

    const countSummary = container.querySelector('#product-count-summary');
    if (countSummary) {
      countSummary.textContent = `Showing ${dataTable.filteredData.length} of ${state.products.length} products`;
    }
  };

  refreshTable();

  // Bind Filters
  container.querySelector('#product-search-input').addEventListener('input', refreshTable);
  container.querySelector('#product-category-filter').addEventListener('change', refreshTable);
  container.querySelector('#product-status-filter').addEventListener('change', refreshTable);

  // Bind Add Product Button
  container.querySelector('#add-product-btn').onclick = () => {
    openProductForm(null, refreshTable);
  };
}
