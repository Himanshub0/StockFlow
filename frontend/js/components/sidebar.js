/**
 * Sidebar Navigation Component
 */

import { getIcon } from '../utils/dom.js';
import { state } from '../state/app-state.js';

export class Sidebar {
  constructor(container) {
    this.container = container;
    this.currentRoute = 'dashboard';
    this.isCollapsed = false;

    this.navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '#/dashboard' },
      { id: 'products', label: 'Products', icon: 'package', path: '#/products' },
      { id: 'inventory', label: 'Inventory', icon: 'boxes', path: '#/inventory', hasBadge: true },
      { id: 'movements', label: 'Stock Movements', icon: 'movements', path: '#/movements' },
      { id: 'suppliers', label: 'Suppliers', icon: 'suppliers', path: '#/suppliers' },
      { id: 'reports', label: 'Reports', icon: 'reports', path: '#/reports' },
      { id: 'settings', label: 'Settings', icon: 'settings', path: '#/settings' }
    ];

    state.subscribe('PRODUCTS_CHANGED', () => this.updateBadge());
    state.subscribe('MOVEMENTS_CHANGED', () => this.updateBadge());
  }

  setActiveRoute(route) {
    this.currentRoute = route;
    const links = this.container.querySelectorAll('.nav-link');
    links.forEach(link => {
      if (link.getAttribute('data-route') === route) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  updateBadge() {
    const badgeEl = this.container.querySelector('.inventory-badge');
    if (badgeEl) {
      const lowStockCount = state.getLowStockProducts().length + state.getOutOfStockProducts().length;
      if (lowStockCount > 0) {
        badgeEl.textContent = lowStockCount;
        badgeEl.style.display = 'inline-block';
      } else {
        badgeEl.style.display = 'none';
      }
    }
  }

  render() {
    const lowStockCount = state.getLowStockProducts().length + state.getOutOfStockProducts().length;

    this.container.innerHTML = `
      <div class="sidebar-header">
        <button type="button" class="sidebar-brand" id="sidebar-brand-btn" title="Click logo to collapse / expand sidebar" aria-label="Toggle sidebar navigation">
          <div class="sidebar-brand-icon">
            ${getIcon('boxes')}
          </div>
          <div class="sidebar-brand-text">
            <span class="sidebar-brand-title">StockFlow</span>
            <span class="sidebar-brand-tagline">ERP Inventory</span>
          </div>
        </button>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-title">Navigation</div>
        <ul class="nav-list">
          ${this.navItems.map(item => `
            <li class="nav-item">
              <a href="${item.path}" class="nav-link ${this.currentRoute === item.id ? 'active' : ''}" data-route="${item.id}">
                <span class="nav-link-icon">${getIcon(item.icon)}</span>
                <span class="nav-link-title">${item.label}</span>
                ${item.hasBadge ? `<span class="nav-badge inventory-badge" style="${lowStockCount > 0 ? '' : 'display:none;'}">${lowStockCount}</span>` : ''}
              </a>
            </li>
          `).join('')}
        </ul>
      </nav>

      <div class="sidebar-footer">
        <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; color: #F8FAFC; margin-bottom: 2px;">
          <span style="width: 6px; height: 6px; border-radius: 9999px; background: #10B981; box-shadow: 0 0 8px #10B981;"></span>
          StockFlow v1.0.0
        </div>
        <div style="font-size: 10px; color: #64748B;">Enterprise Edition &bull; Sem 3 AIML</div>
      </div>
    `;

    // Toggle Sidebar Width via Logo click / Mobile Close
    const brandBtn = this.container.querySelector('#sidebar-brand-btn');
    if (brandBtn) {
      brandBtn.addEventListener('click', () => {
        if (window.innerWidth <= 1024) {
          document.body.classList.remove('sidebar-mobile-open');
        } else {
          const isCollapsed = document.body.classList.toggle('sidebar-collapsed');
          brandBtn.setAttribute('title', isCollapsed ? 'Click logo to expand sidebar' : 'Click logo to collapse sidebar');
        }
      });
    }

    // Auto-close mobile drawer when a link is clicked
    this.container.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        document.body.classList.remove('sidebar-mobile-open');
      });
    });
  }
}
