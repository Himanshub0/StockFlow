/**
 * Stock Movement Transaction Form Modal
 * Records Stock In, Stock Out, and Stock Adjustments with strict quantity validation.
 */

import { modal } from '../../components/modal.js';
import { toast } from '../../components/toast.js';
import { state } from '../../state/app-state.js';
import { validateRequired, validateNumber } from '../../utils/validators.js';

export function openMovementForm(defaultType = 'IN', defaultProductId = null, onSaved = null) {
  const products = state.products;

  const titleMap = {
    IN: 'Record Stock In (Receiving)',
    OUT: 'Record Stock Out (Dispatch / Sale)',
    ADJUSTMENT: 'Record Stock Adjustment (Audit Correction)'
  };

  const formHtml = `
    <form id="movement-form" class="form-grid">
      <div class="form-group form-full">
        <label class="form-label required" for="mov-type">Transaction Type</label>
        <select id="mov-type" name="type" class="form-select">
          <option value="IN" ${defaultType === 'IN' ? 'selected' : ''}>Stock In (Increase Inventory)</option>
          <option value="OUT" ${defaultType === 'OUT' ? 'selected' : ''}>Stock Out (Fulfillment / Sale)</option>
          <option value="ADJUSTMENT" ${defaultType === 'ADJUSTMENT' ? 'selected' : ''}>Stock Adjustment (Inventory Audit)</option>
        </select>
      </div>

      <div class="form-group form-full">
        <label class="form-label required" for="mov-product">Select Product</label>
        <select id="mov-product" name="productId" class="form-select">
          <option value="">-- Choose Product --</option>
          ${products.map(p => `
            <option value="${p.id}" ${defaultProductId === p.id ? 'selected' : ''} data-qty="${p.quantity}">
              ${p.name} (${p.sku}) &bull; Current Stock: ${p.quantity} units
            </option>
          `).join('')}
        </select>
        <span class="form-error" id="err-mov-product"></span>
      </div>

      <div class="form-group">
        <label class="form-label required" for="mov-qty" id="mov-qty-label">Quantity</label>
        <input type="number" step="1" min="1" id="mov-qty" name="quantity" class="form-input" placeholder="e.g. 10">
        <span class="form-error" id="err-mov-qty"></span>
      </div>

      <div class="form-group">
        <label class="form-label" for="mov-ref">Reference / Order ID</label>
        <input type="text" id="mov-ref" name="reference" class="form-input" placeholder="e.g. PO-2026-105">
      </div>

      <div class="form-group form-full">
        <label class="form-label" for="mov-notes">Transaction Notes</label>
        <textarea id="mov-notes" name="notes" class="form-textarea" placeholder="Reason for inventory change..."></textarea>
      </div>
    </form>
  `;

  const footerHtml = `
    <button type="button" class="btn btn-secondary" id="cancel-mov-btn">Cancel</button>
    <button type="button" class="btn btn-primary" id="save-mov-btn">Record Transaction</button>
  `;

  modal.open({
    title: titleMap[defaultType] || 'Record Stock Movement',
    body: formHtml,
    footer: footerHtml,
    maxWidth: '540px'
  });

  const typeSelect = document.getElementById('mov-type');
  const qtyLabel = document.getElementById('mov-qty-label');

  typeSelect.addEventListener('change', () => {
    const selectedType = typeSelect.value;
    if (selectedType === 'ADJUSTMENT') {
      qtyLabel.textContent = 'Corrected Physical Count';
    } else {
      qtyLabel.textContent = 'Quantity';
    }
  });

  document.getElementById('cancel-mov-btn').onclick = () => modal.close();

  document.getElementById('save-mov-btn').onclick = () => {
    const form = document.getElementById('movement-form');
    const type = form.type.value;
    const productId = form.productId.value;
    const quantity = form.quantity.value;
    const reference = form.reference.value.trim();
    const notes = form.notes.value.trim();

    form.querySelectorAll('.form-error').forEach(el => el.textContent = '');

    let hasErrors = false;

    if (!productId) {
      document.getElementById('err-mov-product').textContent = 'Please select a product';
      hasErrors = true;
    }

    const qtyErr = validateNumber(quantity, 'Quantity', type === 'ADJUSTMENT' ? 0 : 1, true);
    if (qtyErr) {
      document.getElementById('err-mov-qty').textContent = qtyErr;
      hasErrors = true;
    }

    if (hasErrors) return;

    try {
      const result = state.recordStockMovement({
        productId,
        type,
        quantity: Number(quantity),
        reference,
        notes
      });

      toast.success(
        `Recorded ${type} transaction for ${result.product.name}. New balance: ${result.product.quantity} units.`
      );

      modal.close();
      if (onSaved) onSaved();
    } catch (err) {
      toast.danger(err.message);
    }
  };
}
