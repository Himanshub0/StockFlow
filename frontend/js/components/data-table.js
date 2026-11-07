/**
 * Reusable Enterprise Data Table Component
 */

import { getIcon } from '../utils/dom.js';

export class DataTable {
  constructor({ columns, data = [], pageSize = 10, emptyMessage = 'No records found' }) {
    this.columns = columns;
    this.data = [...data];
    this.filteredData = [...data];
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.sortKey = null;
    this.sortDirection = 'asc';
    this.emptyMessage = emptyMessage;
  }

  setData(data) {
    this.data = [...data];
    this.applySortAndFilter();
  }

  setFilter(filterPredicate) {
    if (!filterPredicate) {
      this.filteredData = [...this.data];
    } else {
      this.filteredData = this.data.filter(filterPredicate);
    }
    this.currentPage = 1;
    this.applySort();
  }

  sortBy(key) {
    if (this.sortKey === key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDirection = 'asc';
    }
    this.applySort();
  }

  applySort() {
    if (!this.sortKey) return;
    this.filteredData.sort((a, b) => {
      let valA = a[this.sortKey];
      let valB = b[this.sortKey];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  applySortAndFilter() {
    this.filteredData = [...this.data];
    this.applySort();
  }

  getTotalPages() {
    return Math.max(1, Math.ceil(this.filteredData.length / this.pageSize));
  }

  getCurrentPageData() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredData.slice(start, start + this.pageSize);
  }

  render(container, onAction) {
    const pageData = this.getCurrentPageData();
    const totalPages = this.getTotalPages();
    const totalItems = this.filteredData.length;
    const startItem = totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
    const endItem = Math.min(this.currentPage * this.pageSize, totalItems);

    let html = `
      <div class="card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                ${this.columns.map(col => {
                  const isSorted = this.sortKey === col.key;
                  const sortIcon = isSorted
                    ? (this.sortDirection === 'asc' ? '↑' : '↓')
                    : '';
                  const numClass = col.align === 'right' ? 'num' : '';
                  return `
                    <th class="${col.sortable ? 'sortable' : ''} ${numClass}" data-key="${col.key}">
                      <div class="th-content">
                        <span>${col.label}</span>
                        ${col.sortable ? `<span class="sort-indicator" style="font-size: 10px; margin-left: 2px;">${sortIcon}</span>` : ''}
                      </div>
                    </th>
                  `;
                }).join('')}
              </tr>
            </thead>
            <tbody>
    `;

    if (pageData.length === 0) {
      html += `
        <tr>
          <td colspan="${this.columns.length}" style="text-align: center; padding: 48px 16px;">
            <div class="empty-state">
              <div class="empty-state-icon">${getIcon('search')}</div>
              <div class="empty-state-title">${this.emptyMessage}</div>
              <div class="empty-state-desc">Try refining your search terms or filters.</div>
            </div>
          </td>
        </tr>
      `;
    } else {
      html += pageData.map((row, rowIndex) => {
        return `
          <tr data-id="${row.id || rowIndex}">
            ${this.columns.map(col => {
              const numClass = col.align === 'right' ? 'num' : '';
              const monoClass = col.mono ? 'mono' : '';
              let cellContent = col.render ? col.render(row[col.key], row) : (row[col.key] !== undefined ? row[col.key] : '—');
              return `<td class="${numClass} ${monoClass}">${cellContent}</td>`;
            }).join('')}
          </tr>
        `;
      }).join('');
    }

    html += `
            </tbody>
          </table>
        </div>
        <div class="table-pagination">
          <div>Showing <strong>${startItem}</strong> - <strong>${endItem}</strong> of <strong>${totalItems}</strong> entries</div>
          <div class="pagination-controls">
            <button class="btn btn-secondary btn-sm prev-page-btn" ${this.currentPage <= 1 ? 'disabled' : ''}>
              ${getIcon('chevronLeft')} Previous
            </button>
            <span style="font-weight: 500;">Page ${this.currentPage} of ${totalPages}</span>
            <button class="btn btn-secondary btn-sm next-page-btn" ${this.currentPage >= totalPages ? 'disabled' : ''}>
              Next ${getIcon('chevronRight')}
            </button>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Attach Header Sort Handlers
    container.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.getAttribute('data-key');
        this.sortBy(key);
        this.render(container, onAction);
      });
    });

    // Attach Pagination Handlers
    const prevBtn = container.querySelector('.prev-page-btn');
    if (prevBtn && !prevBtn.disabled) {
      prevBtn.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.render(container, onAction);
        }
      });
    }

    const nextBtn = container.querySelector('.next-page-btn');
    if (nextBtn && !nextBtn.disabled) {
      nextBtn.addEventListener('click', () => {
        if (this.currentPage < totalPages) {
          this.currentPage++;
          this.render(container, onAction);
        }
      });
    }

    // Attach custom row actions if provided
    if (onAction) {
      container.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const action = btn.getAttribute('data-action');
          const rowId = btn.getAttribute('data-id') || btn.closest('tr')?.getAttribute('data-id');
          const rowData = this.data.find(d => d.id === rowId) || rowId;
          onAction(action, rowData, e);
        });
      });
    }
  }
}
