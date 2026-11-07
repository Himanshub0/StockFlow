/**
 * Inventory Reports and Analytics Page View
 */

import { state } from '../state/app-state.js';
import { getIcon } from '../utils/dom.js';
import { formatCurrency, formatNumber } from '../utils/formatters.js';
import { exportToCSV } from '../utils/csv-export.js';
import { toast } from '../components/toast.js';

export function renderReports(container) {
  const totalValuation = state.calculateInventoryValue();
  const totalUnits = state.calculateTotalUnits();
  const catDist = state.calculateCategoryDistribution();
  const statusDist = state.calculateStockStatusDistribution();
  const lowStockProducts = [...state.getOutOfStockProducts(), ...state.getLowStockProducts()];

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <span class="eyebrow-tag eyebrow-tag-blue">${getIcon('reports')} Financial Intelligence</span>
        <h1 class="page-title">Inventory Reports & Analytics</h1>
        <p class="page-description">Exportable financial auditing, asset valuation, and stock replenishment metrics.</p>
      </div>
      <div class="page-actions">
        <button class="btn-pill btn-pill-secondary" id="export-movements-csv-btn">
          <span class="btn-icon-bubble">${getIcon('download')}</span>
          Export Movements CSV
        </button>
        <button class="btn-pill btn-pill-primary" id="export-inventory-csv-btn">
          <span class="btn-icon-bubble">${getIcon('download')}</span>
          Export Full Inventory CSV
        </button>
      </div>
    </div>

    <!-- Summary Metrics -->
    <div class="reports-summary-grid">
      <div class="report-stat-card">
        <div class="report-stat-header">
          <span style="font-size: var(--font-size-xs); font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Total Asset Value</span>
          <span style="color: var(--accent-primary);">${getIcon('dollarSign')}</span>
        </div>
        <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
          ${formatCurrency(totalValuation, state.settings.currency)}
        </div>
        <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">
          Aggregate cost of ${formatNumber(totalUnits)} physical units in stock
        </div>
      </div>

      <div class="report-stat-card">
        <div class="report-stat-header">
          <span style="font-size: var(--font-size-xs); font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Safety Compliance</span>
          <span style="color: var(--color-success);">${getIcon('checkCircle')}</span>
        </div>
        <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-success); margin-bottom: 4px;">
          ${((statusDist.IN_STOCK / state.products.length) * 100).toFixed(1)}%
        </div>
        <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">
          ${statusDist.IN_STOCK} of ${state.products.length} products above threshold
        </div>
      </div>

      <div class="report-stat-card">
        <div class="report-stat-header">
          <span style="font-size: var(--font-size-xs); font-weight: 600; color: var(--text-secondary); text-transform: uppercase;">Stock Variance Risks</span>
          <span style="color: var(--color-danger);">${getIcon('alertTriangle')}</span>
        </div>
        <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-danger); margin-bottom: 4px;">
          ${lowStockProducts.length} Items
        </div>
        <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">
          ${statusDist.OUT_OF_STOCK} out of stock, ${statusDist.LOW_STOCK} critically low
        </div>
      </div>
    </div>

    <!-- Category Valuation Audit Table -->
    <div class="card" style="margin-bottom: var(--spacing-6);">
      <div class="card-header">
        <div class="card-title-group">
          <h2 class="card-title">Category Valuation & Asset Allocation</h2>
          <span class="card-subtitle">Breakdown of inventory investment across product families</span>
        </div>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th class="num">SKU Count</th>
              <th class="num">Total Units</th>
              <th class="num">Category Valuation</th>
              <th class="num">Capital Share</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(catDist).map(([cat, data]) => {
              const share = totalValuation > 0 ? ((data.value / totalValuation) * 100).toFixed(1) : 0;
              return `
                <tr>
                  <td style="font-weight: 600;">${cat}</td>
                  <td class="num">${data.count} SKUs</td>
                  <td class="num">${formatNumber(data.units)}</td>
                  <td class="num" style="font-weight: 600;">${formatCurrency(data.value, state.settings.currency)}</td>
                  <td class="num mono">${share}%</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Replenishment Recommendations Table -->
    <div class="card">
      <div class="card-header">
        <div class="card-title-group">
          <h2 class="card-title">Replenishment Priority Audit</h2>
          <span class="card-subtitle">Recommended procurement quantities to restore safety stock</span>
        </div>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>SKU / Product</th>
              <th>Category</th>
              <th>Supplier</th>
              <th class="num">Current Stock</th>
              <th class="num">Safety Target</th>
              <th class="num">Recommended Order</th>
            </tr>
          </thead>
          <tbody>
            ${lowStockProducts.map(p => {
              const sup = state.suppliers.find(s => s.id === p.supplierId);
              const reorderQty = Math.max(p.minimumStock * 2 - p.quantity, p.minimumStock);
              return `
                <tr>
                  <td>
                    <div style="font-weight: 500;">${p.name}</div>
                    <div class="mono" style="font-size: 11px; color: var(--text-secondary);">${p.sku}</div>
                  </td>
                  <td>${p.category}</td>
                  <td>${sup ? sup.name : '—'}</td>
                  <td class="num" style="color: ${p.quantity === 0 ? 'var(--color-danger)' : 'var(--color-warning)'}; font-weight: 600;">
                    ${p.quantity}
                  </td>
                  <td class="num mono">${p.minimumStock}</td>
                  <td class="num" style="font-weight: 700; color: var(--accent-primary);">
                    +${reorderQty} units
                  </td>
                </tr>
              `;
            }).join('')}
            ${lowStockProducts.length === 0 ? `
              <tr>
                <td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 32px;">
                  All inventory lines currently exceed minimum safety thresholds.
                </td>
              </tr>
            ` : ''}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // CSV Export Handlers
  container.querySelector('#export-inventory-csv-btn').onclick = () => {
    try {
      const headers = [
        { label: 'Product Name', key: 'name' },
        { label: 'SKU', key: 'sku' },
        { label: 'Category', key: 'category' },
        { label: 'Unit Price', key: 'price' },
        { label: 'Current Quantity', key: 'quantity' },
        { label: 'Minimum Stock', key: 'minimumStock' },
        { label: 'Stock Status', key: 'status' },
        { label: 'Total Valuation', key: 'totalValue' },
        { label: 'Supplier', key: 'supplierName' }
      ];

      const rows = state.products.map(p => {
        const sup = state.suppliers.find(s => s.id === p.supplierId);
        return {
          name: p.name,
          sku: p.sku,
          category: p.category,
          price: p.price,
          quantity: p.quantity,
          minimumStock: p.minimumStock,
          status: state.getStockStatus(p),
          totalValue: (p.price * p.quantity).toFixed(2),
          supplierName: sup ? sup.name : 'None'
        };
      });

      exportToCSV('StockFlow_Inventory_Report', headers, rows);
      toast.success('Inventory dataset exported as CSV file.');
    } catch (err) {
      toast.danger(err.message);
    }
  };

  container.querySelector('#export-movements-csv-btn').onclick = () => {
    try {
      const headers = [
        { label: 'Timestamp', key: 'date' },
        { label: 'Reference', key: 'reference' },
        { label: 'Transaction Type', key: 'type' },
        { label: 'Product SKU', key: 'sku' },
        { label: 'Product Name', key: 'productName' },
        { label: 'Quantity Change', key: 'quantity' },
        { label: 'Previous Balance', key: 'previousQuantity' },
        { label: 'New Balance', key: 'newQuantity' },
        { label: 'Notes', key: 'notes' }
      ];

      const rows = state.movements.map(m => {
        const p = state.products.find(prod => prod.id === m.productId) || { name: 'Unknown', sku: '—' };
        return {
          date: m.date,
          reference: m.reference,
          type: m.type,
          sku: p.sku,
          productName: p.name,
          quantity: m.quantity,
          previousQuantity: m.previousQuantity,
          newQuantity: m.newQuantity,
          notes: m.notes || ''
        };
      });

      exportToCSV('StockFlow_Movements_Audit_Report', headers, rows);
      toast.success('Audit trail movements exported as CSV file.');
    } catch (err) {
      toast.danger(err.message);
    }
  };
}
