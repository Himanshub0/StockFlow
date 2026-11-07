/**
 * Suppliers Directory Page View
 */

import { state } from '../state/app-state.js';
import { getIcon } from '../utils/dom.js';
import { DataTable } from '../components/data-table.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { openSupplierForm } from '../features/suppliers/supplier-form.js';

export function renderSuppliers(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <span class="eyebrow-tag eyebrow-tag-blue">${getIcon('suppliers')} Vendor Ecosystem</span>
        <h1 class="page-title">Suppliers Directory</h1>
        <p class="page-description">Manage approved vendor partners, contact representatives, and procurement tiers.</p>
      </div>
      <div class="page-actions">
        <button class="btn-pill btn-pill-primary" id="add-supplier-btn">
          <span class="btn-icon-bubble">${getIcon('plus')}</span>
          Add Supplier
        </button>
      </div>
    </div>

    <!-- Filter Toolbar -->
    <div class="filter-bar">
      <div class="filter-group">
        <div class="search-input-wrapper">
          <span class="search-icon">${getIcon('search')}</span>
          <input type="text" class="form-input" id="supplier-search-input" placeholder="Search supplier or contact...">
        </div>
      </div>

      <div style="font-size: var(--font-size-xs); color: var(--text-secondary);" id="sup-count-summary">
        ${state.suppliers.length} registered vendors
      </div>
    </div>

    <!-- Table Container -->
    <div id="suppliers-table-container"></div>
  `;

  const columns = [
    {
      key: 'name',
      label: 'Supplier Organization',
      sortable: true,
      render: (val, row) => `
        <div style="font-weight: 600; color: var(--text-primary);">${val}</div>
        <div style="font-size: 11px; color: var(--text-secondary); font-family: var(--font-mono);">${row.id}</div>
      `
    },
    {
      key: 'contactPerson',
      label: 'Contact Representative',
      sortable: true,
      render: (val, row) => `
        <div class="supplier-contact-cell">
          <span class="supplier-contact-name">${val}</span>
          <span class="supplier-contact-info">${row.email || 'No email registered'}</span>
        </div>
      `
    },
    {
      key: 'phone',
      label: 'Phone Contact',
      mono: true,
      render: (val) => val || '—'
    },
    {
      key: 'productsSupplied',
      label: 'Active SKUs',
      align: 'right',
      sortable: true,
      render: (_, row) => {
        const count = state.products.filter(p => p.supplierId === row.id).length;
        return `<strong>${count}</strong> products`;
      }
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (val) => `
        <span class="badge ${val === 'Active' ? 'badge-arsenic' : 'badge-neutral'}">
          <span class="badge-dot"></span>${val}
        </span>
      `
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (_, row) => `
        <div style="display: flex; gap: 4px; justify-content: flex-end;">
          <button class="btn btn-secondary btn-sm btn-icon-only" data-action="edit" data-id="${row.id}" title="Edit Supplier">
            ${getIcon('edit')}
          </button>
          <button class="btn btn-outline-danger btn-sm btn-icon-only" data-action="delete" data-id="${row.id}" title="Delete Supplier">
            ${getIcon('trash')}
          </button>
        </div>
      `
    }
  ];

  const tableContainer = container.querySelector('#suppliers-table-container');
  const dataTable = new DataTable({
    columns,
    data: state.suppliers,
    pageSize: state.settings.itemsPerPage || 10,
    emptyMessage: 'No suppliers match your search'
  });

  const refreshTable = () => {
    const searchVal = container.querySelector('#supplier-search-input').value.trim().toLowerCase();

    dataTable.setData(state.suppliers);
    dataTable.setFilter(s => {
      if (!searchVal) return true;
      return s.name.toLowerCase().includes(searchVal) ||
        s.contactPerson.toLowerCase().includes(searchVal) ||
        (s.email && s.email.toLowerCase().includes(searchVal));
    });

    dataTable.render(tableContainer, (action, row) => {
      if (action === 'edit') {
        openSupplierForm(row, refreshTable);
      } else if (action === 'delete') {
        const productsUsing = state.products.filter(p => p.supplierId === row.id);
        const warning = productsUsing.length > 0
          ? `<br><br><span style="color: var(--color-warning);">Note: ${productsUsing.length} products currently reference this vendor.</span>`
          : '';

        modal.confirm({
          title: 'Delete Supplier',
          message: `Are you sure you want to remove <strong>${row.name}</strong> from the vendor registry?${warning}`,
          confirmText: 'Delete Supplier',
          isDanger: true,
          onConfirm: () => {
            try {
              state.deleteSupplier(row.id);
              toast.success(`Supplier "${row.name}" removed.`);
              refreshTable();
            } catch (err) {
              toast.danger(err.message);
            }
          }
        });
      }
    });

    const countSummary = container.querySelector('#sup-count-summary');
    if (countSummary) {
      countSummary.textContent = `${dataTable.filteredData.length} of ${state.suppliers.length} vendors displayed`;
    }
  };

  refreshTable();

  container.querySelector('#supplier-search-input').addEventListener('input', refreshTable);
  container.querySelector('#add-supplier-btn').onclick = () => openSupplierForm(null, refreshTable);
}
