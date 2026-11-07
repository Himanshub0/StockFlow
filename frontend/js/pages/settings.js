/**
 * Settings and Configuration Page View
 */

import { state } from '../state/app-state.js';
import { getIcon } from '../utils/dom.js';
import { toast } from '../components/toast.js';
import { modal } from '../components/modal.js';

export function renderSettings(container) {
  const settings = state.settings;

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <span class="eyebrow-tag eyebrow-tag-blue">${getIcon('settings')} System Configuration</span>
        <h1 class="page-title">System Settings & Preferences</h1>
        <p class="page-description">Configure regional currency, inventory safety thresholds, and mock dataset state.</p>
      </div>
      <div class="page-actions">
        <button class="btn-pill btn-pill-primary" id="save-settings-btn">
          <span class="btn-icon-bubble">${getIcon('check')}</span>
          Save Preferences
        </button>
      </div>
    </div>

    <!-- General Application Configuration -->
    <div class="settings-section">
      <div class="settings-section-header">
        <h2 class="settings-section-title">General Preferences</h2>
        <p class="settings-section-desc">Application branding and global threshold defaults.</p>
      </div>

      <div class="settings-row">
        <div class="settings-label-group">
          <label class="settings-label" for="setting-company">Company / Organization Name</label>
          <span class="settings-help">Displayed in navigation headers and exported audit reports</span>
        </div>
        <div style="width: 280px;">
          <input type="text" id="setting-company" class="form-input" value="${settings.companyName}">
        </div>
      </div>

      <div class="settings-row">
        <div class="settings-label-group">
          <label class="settings-label" for="setting-currency">Display Currency</label>
          <span class="settings-help">Symbol used across dashboard cards, valuation tables, and reports</span>
        </div>
        <div style="width: 280px;">
          <select id="setting-currency" class="form-select">
            <option value="USD" ${settings.currency === 'USD' ? 'selected' : ''}>USD ($) - US Dollar</option>
            <option value="EUR" ${settings.currency === 'EUR' ? 'selected' : ''}>EUR (€) - Euro</option>
            <option value="GBP" ${settings.currency === 'GBP' ? 'selected' : ''}>GBP (£) - British Pound</option>
            <option value="INR" ${settings.currency === 'INR' ? 'selected' : ''}>INR (₹) - Indian Rupee</option>
          </select>
        </div>
      </div>

      <div class="settings-row">
        <div class="settings-label-group">
          <label class="settings-label" for="setting-threshold">Default Minimum Stock Threshold</label>
          <span class="settings-help">Initial low-stock warning limit assigned to newly created products</span>
        </div>
        <div style="width: 280px;">
          <input type="number" id="setting-threshold" min="1" step="1" class="form-input" value="${settings.defaultLowStockThreshold}">
        </div>
      </div>

      <div class="settings-row">
        <div class="settings-label-group">
          <label class="settings-label" for="setting-page-size">Table Items Per Page</label>
          <span class="settings-help">Number of rows rendered before pagination controls</span>
        </div>
        <div style="width: 280px;">
          <select id="setting-page-size" class="form-select">
            <option value="5" ${settings.itemsPerPage === 5 ? 'selected' : ''}>5 rows</option>
            <option value="10" ${settings.itemsPerPage === 10 ? 'selected' : ''}>10 rows</option>
            <option value="20" ${settings.itemsPerPage === 20 ? 'selected' : ''}>20 rows</option>
            <option value="50" ${settings.itemsPerPage === 50 ? 'selected' : ''}>50 rows</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Backend Integration Architecture Information -->
    <div class="settings-section">
      <div class="settings-section-header">
        <h2 class="settings-section-title">Backend Architecture Readiness</h2>
        <p class="settings-section-desc">Preparation for Python Flask + SQLite integration.</p>
      </div>

      <div style="font-size: var(--font-size-sm); color: var(--text-secondary); line-height: 1.6;">
        <p style="margin-bottom: 12px;">
          This frontend operates on an isolated service layer located in <code>frontend/js/api/</code>. 
          When connecting to your future Python Flask backend:
        </p>
        <ul style="list-style: disc; padding-left: 20px; display: flex; flex-direction: column; gap: 6px;">
          <li>All UI views call <code>productsApi</code>, <code>movementsApi</code>, and <code>suppliersApi</code> asynchronously.</li>
          <li>In <code>api-client.js</code>, update <code>baseURL</code> to point to your Flask server (e.g. <code>http://localhost:5000/api</code>).</li>
          <li>Database tables in SQLite match the JSON schema (<code>id</code>, <code>sku</code>, <code>name</code>, <code>category</code>, <code>price</code>, <code>quantity</code>, <code>minimum_stock</code>).</li>
        </ul>
      </div>
    </div>

    <!-- Data Management & Prototype Reset -->
    <div class="settings-section" style="border-color: #FECACA;">
      <div class="settings-section-header">
        <h2 class="settings-section-title" style="color: var(--color-danger);">Prototype Dataset Management</h2>
        <p class="settings-section-desc">Reset inventory back to clean initial demo records.</p>
      </div>

      <div class="settings-row">
        <div class="settings-label-group">
          <span class="settings-label">Reset Sample Data</span>
          <span class="settings-help">Restores all 22 initial products, 5 suppliers, and stock transaction logs</span>
        </div>
        <div>
          <button class="btn btn-outline-danger" id="reset-mock-btn">
            ${getIcon('refreshCw')} Reset to Default Mock Data
          </button>
        </div>
      </div>
    </div>
  `;

  // Save Settings
  container.querySelector('#save-settings-btn').onclick = () => {
    const companyName = container.querySelector('#setting-company').value.trim() || 'StockFlow Enterprises';
    const currency = container.querySelector('#setting-currency').value;
    const defaultLowStockThreshold = Number(container.querySelector('#setting-threshold').value) || 10;
    const itemsPerPage = Number(container.querySelector('#setting-page-size').value) || 10;

    state.updateSettings({
      companyName,
      currency,
      defaultLowStockThreshold,
      itemsPerPage
    });

    toast.success('System preferences saved successfully.');
  };

  // Reset Mock Data
  container.querySelector('#reset-mock-btn').onclick = () => {
    modal.confirm({
      title: 'Reset Demo Data',
      message: 'Are you sure you want to restore the original 22 mock products and suppliers? Any newly added records will be overwritten.',
      confirmText: 'Reset Dataset',
      isDanger: true,
      onConfirm: () => {
        state.resetToMockData();
        toast.success('Inventory dataset restored to initial mock state.');
        renderSettings(container);
      }
    });
  };
}
