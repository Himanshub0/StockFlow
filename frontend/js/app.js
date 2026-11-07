/**
 * Application Entrypoint
 * Initializes application shell, state listeners, and client-side routing.
 */

import { state } from './state/app-state.js';
import { Sidebar } from './components/sidebar.js';
import { Topbar } from './components/topbar.js';
import { Router } from './router.js';
import { tracker } from './telemetry/usage-tracker.js';

document.addEventListener('DOMContentLoaded', () => {
  const sidebarContainer = document.getElementById('sidebar-container');
  const topbarContainer = document.getElementById('topbar-container');
  const mainContent = document.getElementById('main-content');
  const sidebarOverlay = document.getElementById('sidebar-overlay');

  if (!sidebarContainer || !topbarContainer || !mainContent) {
    console.error('StockFlow bootstrap failed: essential DOM containers missing.');
    return;
  }

  // Initialize Shell Components
  const sidebar = new Sidebar(sidebarContainer);
  sidebar.render();

  const topbar = new Topbar(topbarContainer);
  topbar.render();

  // Initialize Router
  const router = new Router({
    mainContainer: mainContent,
    sidebar,
    topbar
  });
  router.init();

  // Dismiss mobile drawer on overlay click
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      document.body.classList.remove('sidebar-mobile-open');
    });
  }

  // Re-render topbar indicators when state changes
  state.subscribe('STATE_CHANGED', () => {
    topbar.render();
  });

  // Track session start
  tracker.track('APP_INIT', {
    totalProducts: state.products.length,
    totalSuppliers: state.suppliers.length
  });

  console.log('StockFlow Enterprise Frontend initialized successfully.');
});
