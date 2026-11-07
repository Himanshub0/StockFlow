/**
 * Product Row Actions
 * Edit, Delete with confirmation, and view details.
 */

import { modal } from '../../components/modal.js';
import { toast } from '../../components/toast.js';
import { state } from '../../state/app-state.js';
import { openProductForm } from './product-form.js';

export function handleProductAction(action, product, onRefresh) {
  if (action === 'edit') {
    openProductForm(product, onRefresh);
  } else if (action === 'delete') {
    modal.confirm({
      title: 'Delete Product',
      message: `Are you sure you want to permanently delete <strong>${product.name}</strong> (${product.sku})? This action cannot be undone.`,
      confirmText: 'Delete Product',
      isDanger: true,
      onConfirm: () => {
        try {
          state.deleteProduct(product.id);
          toast.success(`Product "${product.name}" was removed.`);
          if (onRefresh) onRefresh();
        } catch (err) {
          toast.danger(err.message || 'Failed to delete product.');
        }
      }
    });
  }
}
