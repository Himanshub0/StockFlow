/**
 * Product Form Modal Feature
 * Handles Add and Edit Product form rendering, validation, and submission.
 */

import { modal } from '../../components/modal.js';
import { toast } from '../../components/toast.js';
import { state } from '../../state/app-state.js';
import { validateRequired, validateNumber, validateSKU } from '../../utils/validators.js';

export function openProductForm(product = null, onSaved = null) {
  const isEdit = !!product;
  const title = isEdit ? `Edit Product: ${product.name}` : 'Add New Product';

  const categories = ['Electronics', 'Stationery', 'Accessories', 'Office Supplies', 'Storage'];
  const suppliers = state.suppliers;

  const formHtml = `
    <form id="product-form" class="form-grid">
      <div class="form-group form-full">
        <label class="form-label required" for="prod-name">Product Name</label>
        <input type="text" id="prod-name" name="name" class="form-input" placeholder="e.g. Ergonomic Keyboard" value="${product ? product.name : ''}">
        <span class="form-error" id="err-name"></span>
      </div>

      <div class="form-group">
        <label class="form-label required" for="prod-sku">SKU Code</label>
        <input type="text" id="prod-sku" name="sku" class="form-input" placeholder="e.g. ELEC-KB-01" value="${product ? product.sku : ''}" style="text-transform: uppercase;">
        <span class="form-error" id="err-sku"></span>
      </div>

      <div class="form-group">
        <label class="form-label required" for="prod-category">Category</label>
        <select id="prod-category" name="category" class="form-select">
          ${categories.map(c => `
            <option value="${c}" ${product && product.category === c ? 'selected' : ''}>${c}</option>
          `).join('')}
        </select>
        <span class="form-error" id="err-category"></span>
      </div>

      <div class="form-group">
        <label class="form-label required" for="prod-price">Unit Price (${state.settings.currency})</label>
        <input type="number" step="0.01" min="0" id="prod-price" name="price" class="form-input" placeholder="0.00" value="${product ? product.price : ''}">
        <span class="form-error" id="err-price"></span>
      </div>

      <div class="form-group">
        <label class="form-label required" for="prod-qty">${isEdit ? 'Current Quantity' : 'Initial Quantity'}</label>
        <input type="number" step="1" min="0" id="prod-qty" name="quantity" class="form-input" placeholder="0" value="${product ? product.quantity : 0}">
        <span class="form-error" id="err-quantity"></span>
      </div>

      <div class="form-group">
        <label class="form-label required" for="prod-min">Minimum Safety Stock</label>
        <input type="number" step="1" min="0" id="prod-min" name="minimumStock" class="form-input" placeholder="10" value="${product ? product.minimumStock : state.settings.defaultLowStockThreshold}">
        <span class="form-error" id="err-minimumStock"></span>
      </div>

      <div class="form-group">
        <label class="form-label" for="prod-supplier">Primary Supplier</label>
        <select id="prod-supplier" name="supplierId" class="form-select">
          <option value="">-- Select Supplier --</option>
          ${suppliers.map(s => `
            <option value="${s.id}" ${product && product.supplierId === s.id ? 'selected' : ''}>${s.name}</option>
          `).join('')}
        </select>
        <span class="form-error" id="err-supplierId"></span>
      </div>

      <div class="form-group form-full">
        <label class="form-label" for="prod-desc">Product Description</label>
        <textarea id="prod-desc" name="description" class="form-textarea" placeholder="Detailed product specifications...">${product ? product.description || '' : ''}</textarea>
      </div>
    </form>
  `;

  const footerHtml = `
    <button type="button" class="btn btn-secondary" id="cancel-prod-btn">Cancel</button>
    <button type="button" class="btn btn-primary" id="save-prod-btn">${isEdit ? 'Save Changes' : 'Create Product'}</button>
  `;

  modal.open({
    title,
    body: formHtml,
    footer: footerHtml,
    maxWidth: '560px'
  });

  document.getElementById('cancel-prod-btn').onclick = () => modal.close();

  document.getElementById('save-prod-btn').onclick = () => {
    const form = document.getElementById('product-form');
    const formData = {
      name: form.name.value.trim(),
      sku: form.sku.value.trim().toUpperCase(),
      category: form.category.value,
      price: form.price.value,
      quantity: form.quantity.value,
      minimumStock: form.minimumStock.value,
      supplierId: form.supplierId.value || null,
      description: form.description.value.trim()
    };

    // Reset error messages
    form.querySelectorAll('.form-error').forEach(el => el.textContent = '');

    let hasErrors = false;

    // Validate Name
    const nameErr = validateRequired(formData.name, 'Product Name');
    if (nameErr) {
      document.getElementById('err-name').textContent = nameErr;
      hasErrors = true;
    }

    // Validate SKU
    const skuErr = validateSKU(formData.sku, state.products, product ? product.id : null);
    if (skuErr) {
      document.getElementById('err-sku').textContent = skuErr;
      hasErrors = true;
    }

    // Validate Price
    const priceErr = validateNumber(formData.price, 'Price', 0, false);
    if (priceErr) {
      document.getElementById('err-price').textContent = priceErr;
      hasErrors = true;
    }

    // Validate Quantity
    const qtyErr = validateNumber(formData.quantity, 'Quantity', 0, true);
    if (qtyErr) {
      document.getElementById('err-quantity').textContent = qtyErr;
      hasErrors = true;
    }

    // Validate Min Stock
    const minErr = validateNumber(formData.minimumStock, 'Minimum Stock', 0, true);
    if (minErr) {
      document.getElementById('err-minimumStock').textContent = minErr;
      hasErrors = true;
    }

    if (hasErrors) return;

    try {
      if (isEdit) {
        state.updateProduct(product.id, formData);
        toast.success(`Product "${formData.name}" updated successfully.`);
      } else {
        state.addProduct(formData);
        toast.success(`Product "${formData.name}" added to inventory.`);
      }
      modal.close();
      if (onSaved) onSaved();
    } catch (err) {
      toast.danger(err.message || 'Failed to save product');
    }
  };
}
