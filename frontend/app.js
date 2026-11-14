import { api } from './api-client.js';
import {
  VALID_VIEWS,
  VIEW_META,
  canManageSettings,
  dom,
  isAdmin,
  parseRouteHash,
  registerRouter,
  state,
  syncRouteHash
} from './modules/state.js';
import {
  applyServerErrors,
  button,
  clearFormErrors,
  closeModal,
  errorStateMarkup,
  hideMessage,
  loadingMarkup,
  openConfirmModal,
  setFieldError,
  setFormBanner,
  showMessage
} from './modules/ui.js';
import {
  exportMovementsCsv,
  exportProductsCsv,
  movementForm,
  productForm,
  refreshAlertBadge,
  refreshMovementsTable,
  refreshProductsTable,
  renderAlerts,
  renderDashboard,
  renderDashboardChart,
  renderMovements,
  renderProducts,
  updateAlertsDom,
  validateMovementForm,
  validateProductForm
} from './modules/views-inventory.js';
import {
  cancelPurchaseOrderAction,
  exportReportCsv,
  purchaseOrderForm,
  receivePurchaseOrderAction,
  refreshPurchaseOrders,
  refreshSalesOrders,
  refreshSuppliersTable,
  renderPurchaseOrders,
  renderReports,
  renderSalesOrders,
  renderSuppliers,
  salesOrderForm,
  submitPurchaseOrderForm,
  submitSalesOrderForm,
  supplierForm,
  validateSupplierForm,
  viewInvoiceModal,
  viewPurchaseOrderModal,
  voidSalesOrderAction
} from './modules/views-operations.js';
import {
  adminCreateUserForm,
  applyUserToDom,
  csvImportForm,
  downloadTemplate,
  resetStoreData,
  loadSettings,
  openProfileModal,
  renderSettings,
  renderTeamAdmin,
  validateSettingsForm
} from './modules/views-admin.js';

function setTopbar(view) {
  const [kicker, title, subtitle] = VIEW_META[view] || VIEW_META.dashboard;
  dom.pageKicker.textContent = kicker;
  dom.pageTitle.textContent = title;
  dom.pageSubtitle.textContent = subtitle;
  if (view === 'dashboard') {
    dom.topbarActions.innerHTML = `${button('New sale', 'add-sale', 'primary')}${button('Add product', 'add-product')}${button('Record movement', 'add-movement')}`;
  } else if (view === 'products') {
    dom.topbarActions.innerHTML = `${button('Export CSV', 'export-products')}${button('Import CSV', 'import-products')}${button('Add product', 'add-product', 'primary')}`;
  } else if (view === 'movements') {
    dom.topbarActions.innerHTML = `${button('Export CSV', 'export-movements')}${button('Import CSV', 'import-movements')}${button('Record movement', 'add-movement', 'primary')}`;
  } else if (view === 'alerts') {
    dom.topbarActions.innerHTML = button('Record inbound', 'add-inbound-movement', 'primary');
  } else if (view === 'purchases') {
    dom.topbarActions.innerHTML = button('New purchase order', 'add-po', 'primary');
  } else if (view === 'sales') {
    dom.topbarActions.innerHTML = button('New sale invoice', 'add-sale', 'primary');
  } else if (view === 'suppliers') {
    dom.topbarActions.innerHTML = `${button('Import CSV', 'import-suppliers')}${button('Add supplier', 'add-supplier', 'primary')}`;
  } else if (view === 'reports') {
    dom.topbarActions.innerHTML = button('Export summary CSV', 'export-report');
  } else if (view === 'team') {
    dom.topbarActions.innerHTML = isAdmin() ? button('Create user', 'add-admin-user', 'primary') : '';
  } else if (view === 'settings') {
    const canEdit = canManageSettings();
    dom.topbarActions.innerHTML = `${canEdit ? button('Save settings', 'save-settings', 'primary') : ''}${button('Log out', 'logout', 'danger')}`;
  } else {
    dom.topbarActions.innerHTML = '';
  }
}

async function navigate(view, { keepContent = false } = {}) {
  const safeView = VALID_VIEWS.includes(view) ? view : 'dashboard';
  state.view = safeView === 'team' && !isAdmin() ? 'dashboard' : safeView;
  document.querySelectorAll('[data-view]').forEach((item) => item.classList.toggle('active', item.dataset.view === state.view));
  document.querySelector('#app-sidebar').classList.remove('is-open');
  setTopbar(state.view);
  syncRouteHash();
  if (!keepContent) {
    dom.appView.innerHTML = loadingMarkup();
  }
  try {
    await renderView();
    if (state.view === 'dashboard') renderDashboardChart();
  } catch (error) {
    if (error.status === 401) return signOut(false);
    showMessage(error.message || 'Unable to load workspace data.');
    dom.appView.innerHTML = errorStateMarkup('Could not load this section', error.message || 'Please check that the backend is running and retry.');
  }
}

async function renderView() {
  if (state.view === 'dashboard') return renderDashboard();
  if (state.view === 'products') return renderProducts();
  if (state.view === 'movements') return renderMovements();
  if (state.view === 'alerts') return renderAlerts();
  if (state.view === 'purchases') return renderPurchaseOrders();
  if (state.view === 'sales') return renderSalesOrders();
  if (state.view === 'suppliers') return renderSuppliers();
  if (state.view === 'reports') return renderReports();
  if (state.view === 'team') return renderTeamAdmin();
  return renderSettings();
}

async function signOut(redirect = true, reason = 'Your session expired. Please sign in again.') {
  const token = localStorage.getItem('stockflow_token');
  try {
    if (token) await api.post('/api/auth/logout', {});
  } catch { /* local session still cleared */ }
  localStorage.removeItem('stockflow_token');
  localStorage.removeItem('stockflow_user');
  if (redirect) window.location.href = 'index.html?logged-out=1';
  else window.location.href = `login.html?message=${encodeURIComponent(reason)}`;
}

registerRouter({ navigate, signOut });

async function handleSubmit(form) {
  const submit = form.querySelector('[type=submit]');
  if (submit) submit.disabled = true;
  try {
    if (form.dataset.form === 'csv-import') {
      clearFormErrors(form);
      const kind = form.dataset.kind;
      const file = form.querySelector('input[type="file"]')?.files?.[0];
      const mode = form.querySelector('select[name="mode"]').value;
      if (!file) {
        setFieldError(form, 'file', 'Please choose a CSV file to upload.');
        setFormBanner(form, 'Select a CSV file before importing.', 'error');
        return;
      }
      if (mode === 'replace' && !form.querySelector('#confirm-replace-checkbox')?.checked) {
        setFormBanner(form, 'Please check the confirmation box to proceed with destructive replace mode.', 'error');
        return;
      }
      const fd = new FormData();
      fd.append('file', file);
      fd.append('mode', mode);
      if (kind === 'movements') {
        const applyChecked = form.querySelector('input[name="apply_stock_toggle"]')?.checked ?? true;
        fd.append('apply_stock', applyChecked ? 'true' : 'false');
      }
      const res = await api.postForm(`/api/${kind}/import`, fd);
      closeModal();
      if (kind === 'suppliers') state.allSuppliers = [];
      state.productCache.clear();
      refreshAlertBadge();
      const extra = res.error_count ? ` (${res.error_count} skipped with errors)` : '';
      showMessage(`Imported ${res.inserted} added, ${res.updated} updated, ${res.skipped} skipped${extra}.`, res.error_count ? 'error' : 'success');
      await navigate(state.view);
      return;
    }

    if (form.dataset.form === 'product') {
      const payload = validateProductForm(form);
      if (!payload) return;
      const id = form.dataset.id;
      await (id ? api.put(`/api/products/${id}`, payload) : api.post('/api/products', payload));
      closeModal();
      state.productCache.clear();
      refreshAlertBadge();
      showMessage(id ? 'Product updated successfully.' : 'Product created successfully.', 'success');
      await navigate(state.view, { keepContent: true });
      return;
    }

    if (form.dataset.form === 'movement') {
      const payload = validateMovementForm(form);
      if (!payload) return;
      const res = await api.post('/api/movements', payload);
      const cached = state.productCache.get(payload.product_id);
      if (cached && res.new_stock != null) {
        cached.current_stock = res.new_stock;
        cached.status = res.status || cached.status;
      }
      if (payload.target_product_id) state.productCache.delete(payload.target_product_id);
      closeModal();
      refreshAlertBadge();
      showMessage(`${payload.type} movement recorded successfully.`, 'success');
      await navigate(state.view, { keepContent: true });
      return;
    }

    if (form.dataset.form === 'supplier') {
      const payload = validateSupplierForm(form);
      if (!payload) return;
      const id = form.dataset.id;
      await (id ? api.put(`/api/suppliers/${id}`, payload) : api.post('/api/suppliers', payload));
      state.allSuppliers = [];
      closeModal();
      showMessage(id ? 'Supplier updated successfully.' : 'Supplier created successfully.', 'success');
      await navigate(state.view, { keepContent: true });
      return;
    }

    if (form.dataset.form === 'purchase-order') {
      const payload = await submitPurchaseOrderForm(form);
      if (!payload) return;
      const res = await api.post('/api/purchase-orders', payload);
      closeModal();
      showMessage(`Purchase order ${res.purchase_order?.po_number || ''} created.`, 'success');
      await navigate('purchases');
      return;
    }

    if (form.dataset.form === 'sales-order') {
      const payload = submitSalesOrderForm(form);
      if (!payload) return;
      const res = await api.post('/api/sales-orders', payload);
      closeModal();
      state.productCache.clear();
      refreshAlertBadge();
      showMessage(`Invoice ${res.sales_order?.invoice_number || ''} completed.`, 'success');
      await navigate('sales');
      return;
    }

    if (form.dataset.form === 'void-sale') {
      const id = form.dataset.id;
      const reason = String(new FormData(form).get('reason') || '').trim();
      const res = await api.post(`/api/sales-orders/${id}/void`, { reason });
      closeModal();
      state.productCache.clear();
      refreshAlertBadge();
      showMessage(`Invoice ${res.invoice_number || ''} voided and stock restored.`, 'success');
      await navigate('sales', { keepContent: true });
      return;
    }

    if (form.dataset.form === 'settings') {
      const payload = validateSettingsForm(form);
      if (!payload) return;
      const res = await api.put('/api/inventory/settings', payload);
      state.settings = { ...state.settings, ...(res.settings || payload) };
      state.productPage = 1;
      state.movementPage = 1;
      refreshAlertBadge();
      state.settings.currency = 'INR';
      showMessage('Settings saved. All prices are displayed in ₹ INR.', 'success');
      await navigate('settings', { keepContent: true });
      return;
    }

    if (form.dataset.form === 'admin-user') {
      clearFormErrors(form);
      const fd = new FormData(form);
      const full_name = String(fd.get('full_name') || '').trim();
      const username = String(fd.get('username') || '').trim();
      const email = String(fd.get('email') || '').trim();
      const role = String(fd.get('role') || 'shopkeeper');
      const password = String(fd.get('password') || '');
      let valid = true;
      if (!full_name) { setFieldError(form, 'full_name', 'Full name is required.'); valid = false; }
      if (username.length < 3) { setFieldError(form, 'username', 'Username needs at least 3 characters.'); valid = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError(form, 'email', 'Enter a valid email.'); valid = false; }
      if (password.length < 6) { setFieldError(form, 'password', 'Password must be 6+ characters.'); valid = false; }
      if (!valid) { setFormBanner(form, 'Fix highlighted user fields.', 'error'); return; }
      await api.post('/api/admin/users', { full_name, username, email, role, password });
      closeModal();
      showMessage(`User ${username} created with role ${role}.`, 'success');
      await navigate('team', { keepContent: true });
      return;
    }

    if (form.dataset.form === 'profile') {
      clearFormErrors(form);
      const full_name = String(new FormData(form).get('full_name') || '').trim();
      if (full_name.length < 2) {
        setFieldError(form, 'full_name', 'Name must be at least 2 characters.');
        setFormBanner(form, 'Enter a valid display name.', 'error');
        return;
      }
      const res = await api.patch('/api/auth/profile', { full_name });
      if (res.user) {
        applyUserToDom(res.user);
        localStorage.setItem('stockflow_user', JSON.stringify(res.user));
      }
      setFormBanner(form, 'Display name updated.', 'success');
      showMessage('Profile updated.', 'success');
      return;
    }

    if (form.dataset.form === 'change-password') {
      clearFormErrors(form);
      const fd = new FormData(form);
      const current_password = String(fd.get('current_password') || '');
      const new_password = String(fd.get('new_password') || '');
      const confirm_password = String(fd.get('confirm_password') || '');
      let valid = true;
      if (!current_password) { setFieldError(form, 'current_password', 'Enter current password.'); valid = false; }
      if (new_password.length < 6) { setFieldError(form, 'new_password', 'New password must be 6+ characters.'); valid = false; }
      if (new_password !== confirm_password) { setFieldError(form, 'confirm_password', 'Passwords do not match.'); valid = false; }
      if (!valid) { setFormBanner(form, 'Fix highlighted password fields.', 'error'); return; }
      await api.post('/api/auth/change-password', { current_password, new_password });
      form.reset();
      setFormBanner(form, 'Password changed successfully.', 'success');
      showMessage('Password updated.', 'success');
      return;
    }
  } catch (error) {
    applyServerErrors(form, error);
    showMessage(error.message || 'Save failed.');
  } finally {
    if (submit) submit.disabled = false;
  }
}

async function deleteEntity(type, id) {
  openConfirmModal({
    title: `Delete ${type}`,
    message: `Delete this ${type}? This action permanently removes the record and cannot be undone.`,
    confirmLabel: `Delete ${type}`,
    onConfirm: async () => {
      await api.delete(`/api/${type === 'product' ? 'products' : 'suppliers'}/${id}`);
      state.productCache.clear();
      if (type === 'supplier') state.allSuppliers = [];
      refreshAlertBadge();
      showMessage(`${type[0].toUpperCase() + type.slice(1)} deleted.`, 'success');
      await navigate(state.view, { keepContent: true });
    }
  });
}

async function handleAction(action, target) {
  if (action.startsWith('view-')) return navigate(action.slice(5));
  if (action === 'retry-boot') return boot();
  if (action === 'retry-view') return navigate(state.view);
  if (action === 'close-modal') return closeModal();
  if (action === 'open-profile') return openProfileModal();
  if (action === 'add-product') return productForm();
  if (action === 'import-products') return csvImportForm('products');
  if (action === 'import-suppliers') return csvImportForm('suppliers');
  if (action === 'import-movements') return csvImportForm('movements');
  if (action === 'export-products') return exportProductsCsv();
  if (action === 'export-movements') return exportMovementsCsv();
  if (action === 'export-report') return exportReportCsv();
  if (action === 'download-template') return downloadTemplate();
  if (action === 'reset-store-data') return resetStoreData();
  if (action === 'logout') return signOut();
  if (action === 'save-settings') return document.querySelector('[data-form="settings"]')?.requestSubmit();
  if (action === 'add-movement') return movementForm();
  if (action === 'add-inbound-movement') return movementForm({ type: 'INBOUND' });
  if (action === 'add-supplier') return supplierForm();
  if (action === 'add-po') return purchaseOrderForm();
  if (action === 'add-sale') return salesOrderForm();
  if (action === 'add-admin-user') return adminCreateUserForm();

  if (action === 'create-po-alert') {
    const id = target.dataset.id;
    const item = state.alerts.find((p) => String(p.id) === id) || state.productCache.get(Number(id));
    return purchaseOrderForm({
      product: item || null,
      productId: id,
      notes: item ? `Replenishment for low-stock ${item.sku}` : ''
    });
  }
  if (action === 'view-po') return viewPurchaseOrderModal(target.dataset.id);
  if (action === 'receive-po') return receivePurchaseOrderAction(target.dataset.id);
  if (action === 'cancel-po') return cancelPurchaseOrderAction(target.dataset.id);
  if (action === 'view-sale') return viewInvoiceModal(target.dataset.id);
  if (action === 'void-sale') return voidSalesOrderAction(target.dataset.id);

  if (action === 'move-product') {
    const id = target.dataset.id;
    const prod = state.products.find((p) => String(p.id) === id) || state.alerts.find((p) => String(p.id) === id) || state.productCache.get(Number(id));
    return movementForm({ product: prod || null, productId: id });
  }
  if (action === 'restock-alert') {
    const id = target.dataset.id;
    const alertItem = state.alerts.find((p) => String(p.id) === id) || state.productCache.get(Number(id));
    const suggested = alertItem?.suggested_reorder || (alertItem ? Math.max(1, (alertItem.max_stock || 0) - (alertItem.current_stock || 0)) : '');
    return movementForm({
      type: 'INBOUND',
      product: alertItem || null,
      productId: id,
      quantity: suggested,
      notes: 'Restock low inventory'
    });
  }
  if (action === 'edit-product') {
    const prod = state.products.find((item) => String(item.id) === target.dataset.id);
    if (!prod) return showMessage('Product record not found.');
    return productForm(prod);
  }
  if (action === 'edit-supplier') {
    const supp = state.suppliers.find((item) => String(item.id) === target.dataset.id);
    if (!supp) return showMessage('Supplier record not found.');
    return supplierForm(supp);
  }
  if (action === 'delete-product') return deleteEntity('product', target.dataset.id);
  if (action === 'delete-supplier') return deleteEntity('supplier', target.dataset.id);

  if (action === 'toggle-user-status') {
    const uid = target.dataset.id;
    const next = target.dataset.next;
    await api.patch(`/api/admin/users/${uid}/status`, { status: next });
    showMessage(`User account status set to ${next}.`, 'success');
    return navigate('team', { keepContent: true });
  }
  if (action === 'delete-user') {
    const uid = target.dataset.id;
    const u = state.adminUsers.find((x) => String(x.id) === String(uid));
    return openConfirmModal({
      title: 'Delete user account',
      message: `Permanently delete user ${u?.username || uid}?`,
      confirmLabel: 'Delete user',
      onConfirm: async () => {
        await api.delete(`/api/admin/users/${uid}`);
        showMessage('User account deleted.', 'success');
        await navigate('team', { keepContent: true });
      }
    });
  }

  if (action === 'clear-product-filters') {
    state.productSearch = '';
    state.productCategory = 'all';
    state.productStatus = 'all';
    state.productPage = 1;
    syncRouteHash();
    return renderProducts();
  }
  if (action === 'clear-movement-filters') {
    state.movementSearch = '';
    state.movementType = 'all';
    state.movementStartDate = '';
    state.movementEndDate = '';
    state.movementPage = 1;
    syncRouteHash();
    return renderMovements();
  }
  if (action === 'clear-alert-filters') {
    state.alertSearch = '';
    state.alertSeverity = 'all';
    state.alertCategory = 'all';
    syncRouteHash();
    return renderAlerts();
  }
  if (action === 'clear-po-filters') {
    state.poSearch = '';
    state.poStatus = 'all';
    state.poPage = 1;
    syncRouteHash();
    return renderPurchaseOrders();
  }
  if (action === 'clear-sales-filters') {
    state.salesSearch = '';
    state.salesStatus = 'all';
    state.salesStartDate = '';
    state.salesEndDate = '';
    state.salesPage = 1;
    syncRouteHash();
    return renderSalesOrders();
  }
  if (action === 'clear-supplier-search') {
    state.supplierSearch = '';
    state.supplierTier = 'all';
    state.supplierStatus = 'all';
    syncRouteHash();
    return renderSuppliers();
  }
  if (action === 'clear-report-filters') {
    state.reportCategory = 'all';
    state.reportStartDate = '';
    state.reportEndDate = '';
    syncRouteHash();
    return navigate('reports', { keepContent: true });
  }
}

document.addEventListener('click', (event) => {
  const themeToggle = event.target.closest('#theme-toggle');
  if (themeToggle) {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('stockflow-theme', theme);
    themeToggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    themeToggle.setAttribute('title', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    themeToggle.querySelector('path').setAttribute('d', theme === 'dark'
      ? 'M12 3v2m0 14v2m9-9h-2M5 12H3m15.4-6.4-1.4 1.4M7 17l-1.4 1.4m0-12.8L7 7m10 10 1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z'
      : 'M20.6 15.7A8.5 8.5 0 0 1 8.3 3.4 8.5 8.5 0 1 0 20.6 15.7Z');
    return;
  }
  const actionEl = event.target.closest('[data-action]');
  if (actionEl) {
    Promise.resolve(handleAction(actionEl.dataset.action, actionEl)).catch((err) => {
      showMessage(err?.message || 'Action failed.');
    });
    return;
  }
  const pageBtn = event.target.closest('[data-page-scope]');
  if (pageBtn && !pageBtn.disabled) {
    const scope = pageBtn.dataset.pageScope;
    const nextPage = Math.max(1, parseInt(pageBtn.dataset.page, 10) || 1);
    if (scope === 'products') {
      state.productPage = nextPage;
      syncRouteHash();
      refreshProductsTable();
    } else if (scope === 'movements') {
      state.movementPage = nextPage;
      syncRouteHash();
      refreshMovementsTable();
    } else if (scope === 'purchases') {
      state.poPage = nextPage;
      syncRouteHash();
      refreshPurchaseOrders();
    } else if (scope === 'sales') {
      state.salesPage = nextPage;
      syncRouteHash();
      refreshSalesOrders();
    }
    return;
  }
  const viewBtn = event.target.closest('[data-view]');
  if (viewBtn) {
    hideMessage();
    navigate(viewBtn.dataset.view);
    return;
  }
  if (event.target === dom.modal) closeModal();
});

document.addEventListener('submit', (event) => {
  if (event.target.matches('[data-form]')) {
    event.preventDefault();
    handleSubmit(event.target);
  }
});

document.addEventListener('input', (event) => {
  if (event.target.dataset.search === 'products') {
    state.productSearch = event.target.value;
    state.productPage = 1;
    syncRouteHash();
    window.clearTimeout(event.target.searchTimer);
    event.target.searchTimer = window.setTimeout(() => refreshProductsTable(), 240);
  } else if (event.target.dataset.search === 'movements') {
    state.movementSearch = event.target.value;
    state.movementPage = 1;
    syncRouteHash();
    window.clearTimeout(event.target.searchTimer);
    event.target.searchTimer = window.setTimeout(() => refreshMovementsTable(), 240);
  } else if (event.target.dataset.search === 'purchases') {
    state.poSearch = event.target.value;
    state.poPage = 1;
    syncRouteHash();
    window.clearTimeout(event.target.searchTimer);
    event.target.searchTimer = window.setTimeout(() => refreshPurchaseOrders(), 240);
  } else if (event.target.dataset.search === 'sales') {
    state.salesSearch = event.target.value;
    state.salesPage = 1;
    syncRouteHash();
    window.clearTimeout(event.target.searchTimer);
    event.target.searchTimer = window.setTimeout(() => refreshSalesOrders(), 240);
  } else if (event.target.dataset.search === 'suppliers') {
    state.supplierSearch = event.target.value;
    syncRouteHash();
    window.clearTimeout(event.target.searchTimer);
    event.target.searchTimer = window.setTimeout(() => refreshSuppliersTable(), 240);
  } else if (event.target.dataset.search === 'alerts') {
    state.alertSearch = event.target.value;
    syncRouteHash();
    updateAlertsDom();
  }
});

document.querySelector('#app-message-close')?.addEventListener('click', hideMessage);
document.querySelector('#mobile-menu')?.addEventListener('click', () => document.querySelector('#app-sidebar').classList.add('is-open'));
document.querySelector('#mobile-close')?.addEventListener('click', () => document.querySelector('#app-sidebar').classList.remove('is-open'));
document.querySelector('#app-scrim')?.addEventListener('click', () => document.querySelector('#app-sidebar').classList.remove('is-open'));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.querySelector('#app-sidebar')?.classList.contains('is-open')) {
    document.querySelector('#app-sidebar').classList.remove('is-open');
    document.querySelector('#mobile-menu')?.focus();
  }
});

const sidebarToggle = document.querySelector('#sidebar-toggle');
const setSidebarCollapsed = (collapsed) => {
  document.body.classList.toggle('sidebar-collapsed', collapsed);
  sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
  sidebarToggle.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
  sidebarToggle.setAttribute('title', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
  sidebarToggle.setAttribute('data-tooltip', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
  const labelSpan = sidebarToggle.querySelector('span');
  if (labelSpan) labelSpan.textContent = collapsed ? 'Expand' : 'Collapse';
  localStorage.setItem('stockflow_sidebar_collapsed', collapsed ? '1' : '0');
};
setSidebarCollapsed(localStorage.getItem('stockflow_sidebar_collapsed') === '1');
sidebarToggle.addEventListener('click', () => setSidebarCollapsed(!document.body.classList.contains('sidebar-collapsed')));

window.addEventListener('hashchange', () => {
  parseRouteHash();
  navigate(state.view);
});

async function boot() {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  const themeToggle = document.querySelector('#theme-toggle');
  themeToggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
  themeToggle.setAttribute('title', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
  themeToggle.querySelector('path').setAttribute('d', theme === 'dark'
    ? 'M12 3v2m0 14v2m9-9h-2M5 12H3m15.4-6.4-1.4 1.4M7 17l-1.4 1.4m0-12.8L7 7m10 10 1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z'
    : 'M20.6 15.7A8.5 8.5 0 0 1 8.3 3.4 8.5 8.5 0 1 0 20.6 15.7Z');
  if (!localStorage.getItem('stockflow_token')) {
    return signOut(false, 'Please sign in to open your workspace.');
  }
  dom.appView.innerHTML = loadingMarkup('Connecting to your workspace…');
  try {
    const [meData] = await Promise.all([api.get('/api/auth/me'), loadSettings()]);
    applyUserToDom(meData.user);
    parseRouteHash();
    await navigate(state.view);
    if (state.view !== 'dashboard') refreshAlertBadge();
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      return signOut(false, 'Your session expired. Please sign in again.');
    }
    const msg = error?.message || 'Unable to connect to the StockFlow backend.';
    showMessage(msg);
    dom.appView.innerHTML = errorStateMarkup('Unable to connect to workspace', msg, 'retry-boot');
  }
}

boot();
