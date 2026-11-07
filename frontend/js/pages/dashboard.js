/**
 * Dashboard Page View
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
    <div class="page-header">
      <div class="page-title-group">
        <h1 class="page-title">Enterprise Dashboard</h1>
        <p class="page-description">Real-time stock valuation, inventory health, and operational activity.</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" id="dash-stock-in-btn">
          ${getIcon('arrowDownLeft')} Record Stock In
        </button>
        <button class="btn btn-secondary" id="dash-stock-out-btn">
          ${getIcon('arrowUpRight')} Record Stock Out
        </button>
        <button class="btn btn-primary" id="dash-add-prod-btn">
          ${getIcon('plus')} Add Product
        </button>
      </div>
    </div>

    <!-- Quick Action Cards Bar -->
    <div class="quick-actions-bar">
      <div class="quick-action-card" id="qa-add-product">
        <div class="quick-action-icon">${getIcon('package')}</div>
        <div>
          <div class="quick-action-title">Add Product</div>
          <div class="quick-action-desc">Register new catalog SKU</div>
        </div>
      </div>
      <div class="quick-action-card" id="qa-stock-in">
        <div class="quick-action-icon" style="background-color: var(--color-success-bg); color: var(--color-success);">${getIcon('arrowDownLeft')}</div>
        <div>
          <div class="quick-action-title">Receive Inventory</div>
          <div class="quick-action-desc">Log vendor shipments</div>
        </div>
      </div>
      <div class="quick-action-card" id="qa-stock-out">
        <div class="quick-action-icon" style="background-color: var(--color-danger-bg); color: var(--color-danger);">${getIcon('arrowUpRight')}</div>
        <div>
          <div class="quick-action-title">Dispatch Stock</div>
          <div class="quick-action-desc">Fulfill orders & usage</div>
        </div>
      </div>
      <div class="quick-action-card" id="qa-view-inventory">
        <div class="quick-action-icon" style="background-color: #FEF3C7; color: #D97706;">${getIcon('alertTriangle')}</div>
        <div>
          <div class="quick-action-title">${lowStockItems.length + outOfStockItems.length} Reorder Alerts</div>
          <div class="quick-action-desc">View threshold items</div>
        </div>
      </div>
    </div>

    <!-- KPI Summary Metrics Grid -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-info">
          <span class="metric-label">Total Catalog SKUs</span>
          <span class="metric-value">${formatNumber(totalProducts)}</span>
          <span class="metric-meta">Active product lines</span>
        </div>
        <div class="metric-icon-box metric-icon-blue">
          ${getIcon('package')}
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-info">
          <span class="metric-label">Total Inventory Units</span>
          <span class="metric-value">${formatNumber(totalUnits)}</span>
          <span class="metric-meta">Across all categories</span>
        </div>
        <div class="metric-icon-box metric-icon-purple">
          ${getIcon('boxes')}
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-info">
          <span class="metric-label">Total Inventory Value</span>
          <span class="metric-value">${formatCurrency(inventoryValue, state.settings.currency)}</span>
          <span class="metric-meta">Valued at unit cost</span>
        </div>
        <div class="metric-icon-box metric-icon-green">
          ${getIcon('dollarSign')}
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-info">
          <span class="metric-label">Low Stock Alerts</span>
          <span class="metric-value" style="color: var(--color-warning);">${formatNumber(lowStockItems.length)}</span>
          <span class="metric-meta">Below minimum safety limit</span>
        </div>
        <div class="metric-icon-box metric-icon-amber">
          ${getIcon('alertTriangle')}
        </div>
      </div>

      <div class="metric-card">
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

    <!-- Charts and Overview Section -->
    <div class="dashboard-grid">
      <!-- Category Valuation Breakdown -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-group">
            <h2 class="card-title">Inventory Valuation by Category</h2>
            <span class="card-subtitle">Distribution of stock capital and item volume</span>
          </div>
        </div>
        <div class="card-body">
          <div style="display: flex; flex-direction: column; gap: 16px;">
            ${Object.entries(categoryDist).map(([cat, data]) => {
              const pct = inventoryValue > 0 ? ((data.value / inventoryValue) * 100).toFixed(1) : 0;
              return `
                <div>
                  <div style="display: flex; justify-content: space-between; font-size: var(--font-size-sm); margin-bottom: 6px;">
                    <span style="font-weight: 500;">${cat}</span>
                    <span class="mono" style="color: var(--text-secondary);">${formatCurrency(data.value, state.settings.currency)} (${pct}%) &bull; ${data.units} units</span>
                  </div>
                  <div style="height: 8px; background: var(--bg-subtle); border-radius: var(--radius-full); overflow: hidden;">
                    <div style="height: 100%; width: ${pct}%; background: var(--accent-primary); border-radius: var(--radius-full); transition: width 0.4s ease;"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Stock Health Status Breakdown -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-group">
            <h2 class="card-title">Stock Health Breakdown</h2>
            <span class="card-subtitle">Safety threshold distribution</span>
          </div>
        </div>
        <div class="card-body">
          <div class="chart-container">
            ${renderHealthStatusDonut(statusDist, totalProducts)}
          </div>
          <div class="chart-legend">
            <div class="legend-item">
              <span class="legend-color-box" style="background: var(--color-success);"></span>
              <span>In Stock (${statusDist.IN_STOCK})</span>
            </div>
            <div class="legend-item">
              <span class="legend-color-box" style="background: var(--color-warning);"></span>
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

    <!-- Bottom Grids: Low-Stock Attention & Recent Activity -->
    <div class="dashboard-grid">
      <!-- Low Stock Attention Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-group">
            <h2 class="card-title">Products Requiring Attention</h2>
            <span class="card-subtitle">Items at or below minimum inventory threshold</span>
          </div>
          <a href="#/inventory" class="btn btn-secondary btn-sm">View All in Inventory</a>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Product / SKU</th>
                <th>Category</th>
                <th class="num">Current</th>
                <th class="num">Threshold</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${[...outOfStockItems, ...lowStockItems].slice(0, 5).map(p => `
                <tr>
                  <td>
                    <div style="font-weight: 500;">${p.name}</div>
                    <div class="mono" style="font-size: 11px; color: var(--text-secondary);">${p.sku}</div>
                  </td>
                  <td>${p.category}</td>
                  <td class="num" style="font-weight: 600;">${p.quantity}</td>
                  <td class="num mono" style="color: var(--text-secondary);">${p.minimumStock}</td>
                  <td>${renderStockBadge(state.getStockStatus(p))}</td>
                </tr>
              `).join('')}
              ${(outOfStockItems.length + lowStockItems.length) === 0 ? `
                <tr>
                  <td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 24px;">All items are well stocked.</td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Stock Movement Activity -->
      <div class="card">
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
  `;

  bindDashboardEvents(container);
}

function renderHealthStatusDonut(dist, total) {
  if (total === 0) return '<div>No inventory data available</div>';
  const inStockPct = ((dist.IN_STOCK / total) * 100).toFixed(0);
  const lowStockPct = ((dist.LOW_STOCK / total) * 100).toFixed(0);
  const outOfStockPct = ((dist.OUT_OF_STOCK / total) * 100).toFixed(0);

  return `
    <div style="position: relative; width: 140px; height: 140px; display: flex; align-items: center; justify-content: center;">
      <svg width="140" height="140" viewBox="0 0 42 42" class="donut">
        <circle class="donut-hole" cx="21" cy="21" r="15.915" fill="#fff"></circle>
        <circle class="donut-ring" cx="21" cy="21" r="15.915" fill="transparent" stroke="#E2E8F0" stroke-width="5"></circle>
        <circle class="donut-segment" cx="21" cy="21" r="15.915" fill="transparent" stroke="#16A34A" stroke-width="5" stroke-dasharray="${inStockPct} ${100 - inStockPct}" stroke-dashoffset="25"></circle>
        <circle class="donut-segment" cx="21" cy="21" r="15.915" fill="transparent" stroke="#D97706" stroke-width="5" stroke-dasharray="${lowStockPct} ${100 - lowStockPct}" stroke-dashoffset="${25 - inStockPct}"></circle>
        <circle class="donut-segment" cx="21" cy="21" r="15.915" fill="transparent" stroke="#DC2626" stroke-width="5" stroke-dasharray="${outOfStockPct} ${100 - outOfStockPct}" stroke-dashoffset="${25 - inStockPct - lowStockPct}"></circle>
      </svg>
      <div style="position: absolute; text-align: center;">
        <span style="font-size: 20px; font-weight: 700; color: var(--text-primary);">${inStockPct}%</span>
        <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Optimal</div>
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
