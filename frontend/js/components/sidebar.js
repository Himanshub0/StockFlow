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
        <div class="sidebar-brand">
          <div class="sidebar-brand-icon">
            ${getIcon('boxes')}
          </div>
          <div class="sidebar-brand-text">
            <span class="sidebar-brand-title">StockFlow</span>
            <span class="sidebar-brand-tagline">ERP Inventory</span>
          </div>
        </div>
        <button class="sidebar-toggle-btn" id="sidebar-toggle-btn" title="Toggle Sidebar">
          ${getIcon('collapse')}
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
        <div style="font-weight: 600; color: #E2E8F0; margin-bottom: 2px;">StockFlow v1.0.0</div>
        <div>Semester 3 AIML Project</div>
      </div>
    `;

    // Toggle Sidebar Width
    const toggleBtn = this.container.querySelector('#sidebar-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('sidebar-collapsed');
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
