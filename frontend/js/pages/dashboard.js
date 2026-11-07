/**
 * StockFlow Dashboard Page View
 * High-End Visual Design: Double-Bezel, Button-in-Button, Eyebrow Badges
 */

import { state } from '../state/app-state.js';
import { getIcon } from '../utils/dom.js';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters.js';
import { renderStockBadge } from '../components/status-badge.js';
import { openProductForm } from '../features/products/product-form.js';
import { openMovementForm } from '../features/movements/movement-form.js';

export function renderDashboard(container) {
  const totalProducts = state.products.length;
  const totalUnits = state.calculateTotalUnits();
  const inventoryValue = state.calculateInventoryValue();
  const lowStockItems = state.getLowStockProducts();
  const outOfStockItems = state.getOutOfStockProducts();
  const recentMovements = state.movements.slice(0, 6);
  const categoryDist = state.calculateCategoryDistribution();
  const statusDist = state.calculateStockStatusDistribution();

  container.innerHTML = `
    <!-- Page Header with Microscopic Eyebrow and Island Action Pills -->
    <div class="page-header">
      <div class="page-title-group">
        <span class="eyebrow-tag eyebrow-tag-blue">
          ${getIcon('boxes')} Real-Time Inventory Mesh
        </span>
        <h1 class="page-title">Enterprise Dashboard</h1>
        <p class="page-description">Automated valuation, multi-tier SKU tracking, and inventory health telemetry.</p>
      </div>
      <div class="page-actions">
        <button class="btn-pill btn-pill-secondary" id="dash-stock-in-btn">
          <span class="btn-icon-bubble">${getIcon('arrowDownLeft')}</span>
          Record Stock In
        </button>
        <button class="btn-pill btn-pill-secondary" id="dash-stock-out-btn">
          <span class="btn-icon-bubble">${getIcon('arrowUpRight')}</span>
          Record Stock Out
        </button>
        <button class="btn-pill btn-pill-primary" id="dash-add-prod-btn">
          <span class="btn-icon-bubble">${getIcon('plus')}</span>
          Add Product
        </button>
      </div>
    </div>

    <!-- Quick Action Cards Bar -->
    <div class="quick-actions-bar">
      <div class="quick-action-card" id="qa-add-product">
        <div class="quick-action-icon">${getIcon('package')}</div>
        <div>
          <div class="quick-action-title">Add Product</div>
          <div class="quick-action-desc">Register new catalog SKU & minimum threshold</div>
        </div>
      </div>
      <div class="quick-action-card" id="qa-stock-in">
        <div class="quick-action-icon" style="background-color: var(--color-success-bg); color: var(--color-success);">${getIcon('arrowDownLeft')}</div>
        <div>
          <div class="quick-action-title">Receive Inventory</div>
          <div class="quick-action-desc">Log vendor shipments & stock inbound</div>
        </div>
      </div>
      <div class="quick-action-card" id="qa-stock-out">
        <div class="quick-action-icon" style="background-color: var(--color-danger-bg); color: var(--color-danger);">${getIcon('arrowUpRight')}</div>
        <div>
          <div class="quick-action-title">Dispatch Stock</div>
          <div class="quick-action-desc">Fulfill customer orders & internal usage</div>
        </div>
      </div>
      <div class="quick-action-card" id="qa-view-inventory">
        <div class="quick-action-icon" style="background-color: var(--color-warning-bg); color: var(--color-warning);">${getIcon('alertTriangle')}</div>
        <div>
          <div class="quick-action-title">${lowStockItems.length + outOfStockItems.length} Reorder Alerts</div>
          <div class="quick-action-desc">Review safety thresholds & shortages</div>
        </div>
      </div>
    </div>

    <!-- KPI Summary Metrics Grid (Double-Bezel Architecture) -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-card-inner">
          <div class="metric-info">
            <span class="metric-label">Catalog SKUs</span>
            <span class="metric-value">${formatNumber(totalProducts)}</span>
            <span class="metric-meta">Active product lines</span>
          </div>
          <div class="metric-icon-box metric-icon-blue">
            ${getIcon('package')}
          </div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-card-inner">
          <div class="metric-info">
            <span class="metric-label">Total Units</span>
            <span class="metric-value">${formatNumber(totalUnits)}</span>
            <span class="metric-meta">Across all categories</span>
          </div>
          <div class="metric-icon-box metric-icon-purple">
            ${getIcon('boxes')}
          </div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-card-inner">
          <div class="metric-info">
            <span class="metric-label">Valuation</span>
            <span class="metric-value">${formatCurrency(inventoryValue, state.settings.currency)}</span>
            <span class="metric-meta">Valued at unit cost</span>
          </div>
          <div class="metric-icon-box metric-icon-green">
            ${getIcon('dollarSign')}
          </div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-card-inner">
          <div class="metric-info">
            <span class="metric-label">Low Stock</span>
            <span class="metric-value" style="color: var(--color-warning);">${formatNumber(lowStockItems.length)}</span>
            <span class="metric-meta">Below safety limit</span>
          </div>
          <div class="metric-icon-box metric-icon-amber">
            ${getIcon('alertTriangle')}
          </div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-card-inner">
          <div class="metric-info">
            <span class="metric-label">Out of Stock</span>
            <span class="metric-value" style="color: var(--color-danger);">${formatNumber(outOfStockItems.length)}</span>
            <span class="metric-meta">0 units available</span>
          </div>
          <div class="metric-icon-box metric-icon-red">
            ${getIcon('x')}
          </div>
        </div>
      </div>
    </div>

    <!-- Charts and Overview Section (Double-Bezel) -->
    <div class="dashboard-grid">
      <!-- Category Valuation Breakdown -->
      <div class="card">
        <div class="card-inner">
          <div class="card-header">
            <div class="card-title-group">
              <h2 class="card-title">Inventory Valuation by Category</h2>
              <span class="card-subtitle">Distribution of stock capital and item volume</span>
            </div>
            <span class="badge badge-neutral">${Object.keys(categoryDist).length} Categories</span>
          </div>
          <div class="card-body">
            <div style="display: flex; flex-direction: column; gap: 18px;">
              ${Object.entries(categoryDist).map(([cat, data]) => {
                const pct = inventoryValue > 0 ? ((data.value / inventoryValue) * 100).toFixed(1) : 0;
                return `
                  <div class="category-stat-row">
                    <div class="category-stat-header">
                      <span class="category-stat-title">${cat}</span>
                      <span class="category-stat-meta">${formatCurrency(data.value, state.settings.currency)} &bull; ${pct}% &bull; ${data.units} units</span>
                    </div>
                    <div class="category-progress-track">
                      <div class="category-progress-fill" style="width: ${pct}%;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Stock Health Status Breakdown -->
      <div class="card">
        <div class="card-inner">
          <div class="card-header">
            <div class="card-title-group">
              <h2 class="card-title">Stock Health Breakdown</h2>
              <span class="card-subtitle">Safety threshold distribution</span>
            </div>
            <span class="badge badge-arsenic">Telemetry Live</span>
          </div>
          <div class="card-body">
            <div class="chart-container">
              ${renderHealthStatusDonut(statusDist, totalProducts)}
            </div>
            <div class="chart-legend">
              <div class="legend-item">
                <span class="legend-color-box" style="background: var(--color-arsenic);"></span>
                <span>In Stock (${statusDist.IN_STOCK})</span>
              </div>
              <div class="legend-item">
                <span class="legend-color-box" style="background: var(--color-orange);"></span>
                <span>Low Stock (${statusDist.LOW_STOCK})</span>
              </div>
              <div class="legend-item">
                <span class="legend-color-box" style="background: var(--color-danger);"></span>
                <span>Out of Stock (${statusDist.OUT_OF_STOCK})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Grids: Low-Stock Attention & Recent Activity -->
    <div class="dashboard-grid">
      <!-- Low Stock Attention Table (Double-Bezel) -->
      <div class="card">
        <div class="card-inner">
          <div class="card-header">
            <div class="card-title-group">
              <h2 class="card-title">Products Requiring Attention</h2>
              <span class="card-subtitle">Items at or below safety limit</span>
            </div>
            <a href="#/inventory" class="btn btn-secondary btn-sm">View in Inventory</a>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Product / SKU</th>
                  <th>Category</th>
                  <th class="num">Current</th>
                  <th class="num">Target</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${[...outOfStockItems, ...lowStockItems].slice(0, 5).map(p => `
                  <tr>
                    <td>
                      <div style="font-weight: 600; color: var(--text-primary);">${p.name}</div>
                      <div class="mono">${p.sku}</div>
                    </td>
                    <td>${p.category}</td>
                    <td class="num" style="font-weight: 700;">${p.quantity}</td>
                    <td class="num mono">${p.minimumStock}</td>
                    <td>${renderStockBadge(state.getStockStatus(p))}</td>
                  </tr>
                `).join('')}
                ${(outOfStockItems.length + lowStockItems.length) === 0 ? `
                  <tr>
                    <td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 32px;">All items are well stocked above safety limits.</td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Recent Stock Movement Activity (Double-Bezel) -->
      <div class="card">
        <div class="card-inner">
          <div class="card-header">
            <div class="card-title-group">
              <h2 class="card-title">Recent Stock Activity</h2>
              <span class="card-subtitle">Latest fulfillment and receipts</span>
            </div>
            <a href="#/movements" class="btn btn-secondary btn-sm">Audit Log</a>
          </div>
          <div class="card-body">
            <div class="activity-list">
              ${recentMovements.map(m => {
                const prod = state.products.find(p => p.id === m.productId) || { name: 'Unknown Product', sku: '' };
                const sign = m.type === 'IN' ? '+' : (m.type === 'OUT' ? '-' : '');
                return `
                  <div class="activity-item">
                    <div class="activity-left">
                      <div class="activity-badge ${m.type.toLowerCase()}">
                        ${m.type === 'IN' ? 'IN' : (m.type === 'OUT' ? 'OUT' : 'ADJ')}
                      </div>
                      <div>
                        <div class="activity-title">${prod.name}</div>
                        <div class="activity-meta">${formatDate(m.date)} &bull; Ref: ${m.reference}</div>
                      </div>
                    </div>
                    <div class="activity-qty ${m.type.toLowerCase()}">
                      ${sign}${Math.abs(m.quantity)}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  bindDashboardEvents(container);
}

function renderHealthStatusDonut(dist, total) {
  if (total === 0) return '<div>No inventory data available</div>';
  const inStockPct = Math.round((dist.IN_STOCK / total) * 100);
  const lowStockPct = Math.round((dist.LOW_STOCK / total) * 100);
  const outOfStockPct = 100 - inStockPct - lowStockPct;

  return `
    <div style="position: relative; width: 140px; height: 140px; display: flex; align-items: center; justify-content: center;">
      <svg width="140" height="140" viewBox="0 0 42 42" class="donut" style="transform: rotate(-90deg);">
        <circle class="donut-hole" cx="21" cy="21" r="15.915" fill="transparent"></circle>
        <circle class="donut-ring" cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--border-color)" stroke-width="4.5"></circle>
        <circle class="donut-segment" cx="21" cy="21" r="15.915" fill="transparent" stroke="#2EB872" stroke-width="4.5" stroke-dasharray="${inStockPct} ${100 - inStockPct}" stroke-dashoffset="0"></circle>
        <circle class="donut-segment" cx="21" cy="21" r="15.915" fill="transparent" stroke="#F97316" stroke-width="4.5" stroke-dasharray="${lowStockPct} ${100 - lowStockPct}" stroke-dashoffset="${-inStockPct}"></circle>
        <circle class="donut-segment" cx="21" cy="21" r="15.915" fill="transparent" stroke="#EF4444" stroke-width="4.5" stroke-dasharray="${outOfStockPct} ${100 - outOfStockPct}" stroke-dashoffset="${-(inStockPct + lowStockPct)}"></circle>
      </svg>
      <div style="position: absolute; text-align: center;">
        <span style="font-size: 26px; font-weight: 800; font-family: var(--font-mono); color: var(--text-primary); letter-spacing: -0.02em;">${inStockPct}%</span>
        <div style="font-size: 9px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.14em; margin-top: 2px;">Optimal Ratio</div>
      </div>
    </div>
  `;
}

function bindDashboardEvents(container) {
  const addProdBtn = container.querySelector('#dash-add-prod-btn');
  const stockInBtn = container.querySelector('#dash-stock-in-btn');
  const stockOutBtn = container.querySelector('#dash-stock-out-btn');

  if (addProdBtn) addProdBtn.onclick = () => openProductForm(null, () => renderDashboard(container));
  if (stockInBtn) stockInBtn.onclick = () => openMovementForm('IN', null, () => renderDashboard(container));
  if (stockOutBtn) stockOutBtn.onclick = () => openMovementForm('OUT', null, () => renderDashboard(container));

  const qaAdd = container.querySelector('#qa-add-product');
  const qaIn = container.querySelector('#qa-stock-in');
  const qaOut = container.querySelector('#qa-stock-out');
  const qaInv = container.querySelector('#qa-view-inventory');

  if (qaAdd) qaAdd.onclick = () => openProductForm(null, () => renderDashboard(container));
  if (qaIn) qaIn.onclick = () => openMovementForm('IN', null, () => renderDashboard(container));
  if (qaOut) qaOut.onclick = () => openMovementForm('OUT', null, () => renderDashboard(container));
  if (qaInv) qaInv.onclick = () => window.location.hash = '#/inventory';
}
