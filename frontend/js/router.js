/**
 * Client-Side Hash Router
 * Manages view switching, URL synchronization, and page rendering.
 */

import { renderDashboard } from './pages/dashboard.js';
import { renderProducts } from './pages/products.js';
import { renderInventory } from './pages/inventory.js';
import { renderMovements } from './pages/movements.js';
import { renderSuppliers } from './pages/suppliers.js';
import { renderReports } from './pages/reports.js';
import { renderSettings } from './pages/settings.js';
import { tracker } from './telemetry/usage-tracker.js';

export class Router {
  constructor({ mainContainer, sidebar, topbar }) {
    this.mainContainer = mainContainer;
    this.sidebar = sidebar;
    this.topbar = topbar;

    this.routes = {
      dashboard: { title: 'Dashboard', render: renderDashboard },
      products: { title: 'Products', render: renderProducts },
      inventory: { title: 'Inventory', render: renderInventory },
      movements: { title: 'Stock Movements', render: renderMovements },
      suppliers: { title: 'Suppliers', render: renderSuppliers },
      reports: { title: 'Reports', render: renderReports },
      settings: { title: 'Settings', render: renderSettings }
    };
  }

  init() {
    window.addEventListener('hashchange', () => this.handleRouting());
    this.handleRouting();
  }

  handleRouting() {
    let hash = window.location.hash.replace('#/', '').trim();
    if (!hash || !this.routes[hash]) {
      hash = 'dashboard';
      window.location.hash = '#/dashboard';
      return;
    }

    const route = this.routes[hash];

    // Update active nav and breadcrumbs
    if (this.sidebar) this.sidebar.setActiveRoute(hash);
    if (this.topbar) this.topbar.setBreadcrumb(route.title);

    // Track navigation event
    tracker.track('PAGE_VIEW', { route: hash, title: route.title });

    // Render page view
    this.mainContainer.innerHTML = '';
    route.render(this.mainContainer);

    // Scroll to top of content
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
}
