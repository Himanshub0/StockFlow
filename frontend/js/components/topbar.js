/**
 * Topbar Component
 */

import { getIcon } from '../utils/dom.js';
import { state } from '../state/app-state.js';

export class Topbar {
  constructor(container) {
    this.container = container;
    this.currentBreadcrumb = 'Dashboard';
  }

  setBreadcrumb(pageName) {
    this.currentBreadcrumb = pageName;
    const breadcrumbEl = this.container.querySelector('.breadcrumb-current');
    if (breadcrumbEl) {
      breadcrumbEl.textContent = pageName;
    }
  }

  render() {
    const lowStockItems = state.getLowStockProducts();
    const outOfStockItems = state.getOutOfStockProducts();
    const alertsCount = lowStockItems.length + outOfStockItems.length;

    this.container.innerHTML = `
      <div class="topbar-left">
        <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Open navigation menu">
          ${getIcon('menu')}
        </button>

        <div class="breadcrumbs">
          <span>StockFlow</span>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current">${this.currentBreadcrumb}</span>
        </div>
      </div>

      <div class="topbar-search-container">
        <span class="topbar-search-icon">${getIcon('search')}</span>
        <input type="text" class="topbar-search-input" id="global-search-input" placeholder="Search product name or SKU..." autocomplete="off">
        <span class="topbar-search-shortcut">⌘K</span>
        <div class="topbar-search-dropdown" id="global-search-dropdown"></div>
      </div>

      <div class="topbar-right">
        <div style="position: relative;">
          <button class="topbar-icon-btn" id="notifications-btn" title="Inventory Alerts">
            ${getIcon('bell')}
            ${alertsCount > 0 ? `<span class="notification-indicator"></span>` : ''}
          </button>
          <div class="notifications-popover" id="notifications-popover">
            <div class="notifications-header">
              <span class="notifications-title">Inventory Alerts</span>
              <span class="badge ${alertsCount > 0 ? 'badge-warning' : 'badge-success'}">${alertsCount} Active</span>
            </div>
            <div class="notifications-list" id="notifications-list">
              ${this.renderNotificationsList(outOfStockItems, lowStockItems)}
            </div>
          </div>
        </div>

        <div class="user-profile-badge" title="Active User Session">
          <div class="user-avatar">AD</div>
          <div class="user-info">
            <span class="user-name">Inventory Admin</span>
            <span class="user-role">AIML Student (Sem 3)</span>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  renderNotificationsList(outOfStockItems, lowStockItems) {
    if (outOfStockItems.length === 0 && lowStockItems.length === 0) {
      return `
        <div style="padding: 24px 16px; text-align: center; color: var(--text-secondary); font-size: var(--font-size-xs);">
          All inventory items are currently above safety thresholds.
        </div>
      `;
    }

    let items = '';
    outOfStockItems.forEach(p => {
      items += `
        <div class="notification-item" onclick="window.location.hash='#/inventory'">
          <span style="color: var(--color-danger);">${getIcon('alertTriangle')}</span>
          <div>
            <div style="font-weight: 600; color: var(--text-primary);">${p.name} (${p.sku})</div>
            <div style="color: var(--color-danger);">Completely out of stock (0 units). Reorder required.</div>
          </div>
        </div>
      `;
    });

    lowStockItems.forEach(p => {
      items += `
        <div class="notification-item" onclick="window.location.hash='#/inventory'">
          <span style="color: var(--color-warning);">${getIcon('alertTriangle')}</span>
          <div>
            <div style="font-weight: 600; color: var(--text-primary);">${p.name} (${p.sku})</div>
            <div style="color: var(--text-secondary);">Low stock: ${p.quantity} remaining (Min threshold: ${p.minimumStock}).</div>
          </div>
        </div>
      `;
    });

    return items;
  }

  bindEvents() {
    // Mobile Drawer Toggle
    const mobileBtn = this.container.querySelector('#mobile-menu-btn');
    if (mobileBtn) {
      mobileBtn.addEventListener('click', () => {
        document.body.classList.toggle('sidebar-mobile-open');
      });
    }

    // Global Search
    const searchInput = this.container.querySelector('#global-search-input');
    const searchDropdown = this.container.querySelector('#global-search-dropdown');

    if (searchInput && searchDropdown) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (!query) {
          searchDropdown.classList.remove('open');
          searchDropdown.innerHTML = '';
          return;
        }

        const matches = state.products.filter(p =>
          p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query)
        ).slice(0, 6);

        if (matches.length === 0) {
          searchDropdown.innerHTML = `<div style="padding: 12px; font-size: var(--font-size-xs); color: var(--text-muted); text-align: center;">No matching products found</div>`;
        } else {
          searchDropdown.innerHTML = matches.map(p => `
            <div class="search-result-item" data-id="${p.id}">
              <div>
                <div class="search-result-title">${p.name}</div>
                <div class="search-result-sub">${p.sku} &bull; ${p.category}</div>
              </div>
              <div>
                <span class="badge ${p.quantity === 0 ? 'badge-danger' : (p.quantity <= p.minimumStock ? 'badge-warning' : 'badge-success')}">
                  ${p.quantity} units
                </span>
              </div>
            </div>
          `).join('');

          searchDropdown.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
              searchDropdown.classList.remove('open');
              searchInput.value = '';
              window.location.hash = '#/products';
            });
          });
        }

        searchDropdown.classList.add('open');
      });

      document.addEventListener('click', (e) => {
        if (!this.container.contains(e.target)) {
          searchDropdown.classList.remove('open');
        }
      });
    }

    // Notifications Toggle
    const notifBtn = this.container.querySelector('#notifications-btn');
    const notifPopover = this.container.querySelector('#notifications-popover');
    if (notifBtn && notifPopover) {
      notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notifPopover.classList.toggle('open');
      });

      document.addEventListener('click', (e) => {
        if (!notifPopover.contains(e.target) && e.target !== notifBtn) {
          notifPopover.classList.remove('open');
        }
      });
    }
  }
}
