/**
 * Supplier Form Modal Feature
 * Add and Edit Supplier records with validation.
 */

import { modal } from '../../components/modal.js';
import { toast } from '../../components/toast.js';
import { state } from '../../state/app-state.js';
import { validateRequired, validateEmail } from '../../utils/validators.js';

export function openSupplierForm(supplier = null, onSaved = null) {
  const isEdit = !!supplier;
  const title = isEdit ? `Edit Supplier: ${supplier.name}` : 'Add New Supplier';

  const formHtml = `
    <form id="supplier-form" class="form-grid">
      <div class="form-group form-full">
        <label class="form-label required" for="sup-name">Company / Supplier Name</label>
        <input type="text" id="sup-name" name="name" class="form-input" placeholder="e.g. Acme Components LLC" value="${supplier ? supplier.name : ''}">
        <span class="form-error" id="err-sup-name"></span>
      </div>

      <div class="form-group form-full">
        <label class="form-label required" for="sup-contact">Contact Person</label>
        <input type="text" id="sup-contact" name="contactPerson" class="form-input" placeholder="e.g. Jane Doe" value="${supplier ? supplier.contactPerson : ''}">
        <span class="form-error" id="err-sup-contact"></span>
      </div>

      <div class="form-group">
        <label class="form-label" for="sup-email">Email Address</label>
        <input type="email" id="sup-email" name="email" class="form-input" placeholder="contact@example.com" value="${supplier ? supplier.email : ''}">
        <span class="form-error" id="err-sup-email"></span>
      </div>

      <div class="form-group">
        <label class="form-label" for="sup-phone">Phone Number</label>
        <input type="text" id="sup-phone" name="phone" class="form-input" placeholder="+1 555-0199" value="${supplier ? supplier.phone : ''}">
        <span class="form-error" id="err-sup-phone"></span>
      </div>

      <div class="form-group form-full">
        <label class="form-label" for="sup-status">Supplier Status</label>
        <select id="sup-status" name="status" class="form-select">
          <option value="Active" ${supplier && supplier.status === 'Active' ? 'selected' : ''}>Active</option>
          <option value="Inactive" ${supplier && supplier.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
        </select>
      </div>
    </form>
  `;

  const footerHtml = `
    <button type="button" class="btn btn-secondary" id="cancel-sup-btn">Cancel</button>
    <button type="button" class="btn btn-primary" id="save-sup-btn">${isEdit ? 'Save Changes' : 'Create Supplier'}</button>
  `;

  modal.open({
    title,
    body: formHtml,
    footer: footerHtml,
    maxWidth: '520px'
  });

  document.getElementById('cancel-sup-btn').onclick = () => modal.close();

  document.getElementById('save-sup-btn').onclick = () => {
    const form = document.getElementById('supplier-form');
    const formData = {
      name: form.name.value.trim(),
      contactPerson: form.contactPerson.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      status: form.status.value
    };

    form.querySelectorAll('.form-error').forEach(el => el.textContent = '');

    let hasErrors = false;

    const nameErr = validateRequired(formData.name, 'Supplier Name');
    if (nameErr) {
      document.getElementById('err-sup-name').textContent = nameErr;
      hasErrors = true;
    }

    const contactErr = validateRequired(formData.contactPerson, 'Contact Person');
    if (contactErr) {
      document.getElementById('err-sup-contact').textContent = contactErr;
      hasErrors = true;
    }

    const emailErr = validateEmail(formData.email);
    if (emailErr) {
      document.getElementById('err-sup-email').textContent = emailErr;
      hasErrors = true;
    }

    if (hasErrors) return;

    try {
      if (isEdit) {
        state.updateSupplier(supplier.id, formData);
        toast.success(`Supplier "${formData.name}" updated successfully.`);
      } else {
        state.addSupplier(formData);
        toast.success(`Supplier "${formData.name}" registered.`);
      }
      modal.close();
      if (onSaved) onSaved();
    } catch (err) {
      toast.danger(err.message);
    }
  };
}
