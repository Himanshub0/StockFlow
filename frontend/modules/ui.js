import { api } from '../api-client.js';
import { cacheProducts, dom, state } from './state.js';
import { escapeHtml } from './formatters.js';

export const searchIconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';

export function showMessage(text, type = 'error') {
  dom.appMessage.hidden = false;
  dom.appMessage.dataset.type = type;
  dom.appMessageText.textContent = text;
  window.clearTimeout(showMessage.timer);
  if (type === 'success') {
    showMessage.timer = window.setTimeout(() => {
      dom.appMessage.hidden = true;
    }, 5500);
  }
}

export function hideMessage() {
  dom.appMessage.hidden = true;
}

export function button(label, action, extra = '', attrs = '') {
  return `<button class="action-button ${extra}" data-action="${action}" type="button" ${attrs}>${escapeHtml(label)}</button>`;
}

export function empty(title, copy, action = '') {
  return `<div class="empty-state"><span class="empty-mark" aria-hidden="true">—</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(copy)}</p>${action}</div>`;
}

export function loadingMarkup(label = 'Loading workspace data…') {
  return `<div class="loading-state"><span></span><span></span><span></span><p>${escapeHtml(label)}</p></div>`;
}

export function errorStateMarkup(title, message, retryAction = 'retry-view') {
  return `<div class="error-state" role="alert"><span class="error-mark" aria-hidden="true">!</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p><div class="view-actions">${button('Retry', retryAction, 'primary')}</div></div>`;
}

export function openModal(title, content, { wide = false } = {}) {
  dom.modal.classList.toggle('is-wide', Boolean(wide));
  dom.modalContent.innerHTML = `
    <div class="modal-head">
      <div><p class="eyebrow">StockFlow action</p><h2>${escapeHtml(title)}</h2></div>
      <button data-action="close-modal" type="button" aria-label="Close dialog">×</button>
    </div>
    ${content}`;
  if (!dom.modal.open) dom.modal.showModal();
}

export function closeModal() {
  if (dom.modal.open) dom.modal.close();
  dom.modal.classList.remove('is-wide');
  dom.modalContent.innerHTML = '';
}

export function openConfirmModal({ title, message, confirmLabel, danger = true, onConfirm }) {
  openModal(title, `
    <div class="modal-form">
      <div class="danger-confirm-box">${escapeHtml(message)}</div>
      <div class="modal-actions">
        <button class="action-button ghost" data-action="close-modal" type="button">Cancel</button>
        <button class="action-button ${danger ? 'danger' : 'primary'}" id="confirm-modal-submit" type="button">${escapeHtml(confirmLabel)}</button>
      </div>
    </div>`);
  dom.modalContent.querySelector('#confirm-modal-submit').addEventListener('click', async (event) => {
    event.currentTarget.disabled = true;
    try {
      await onConfirm();
      closeModal();
    } catch (error) {
      showMessage(error.message);
      event.currentTarget.disabled = false;
    }
  });
}

export function setFormBanner(form, text = '', stateName = 'error') {
  const banner = form?.querySelector('.form-message');
  if (!banner) return;
  if (!text) {
    banner.hidden = true;
    banner.textContent = '';
    return;
  }
  banner.hidden = false;
  banner.dataset.state = stateName;
  banner.textContent = text;
}

export function clearFormErrors(form) {
  setFormBanner(form, '');
  form.querySelectorAll('.field').forEach((field) => {
    field.classList.remove('has-error');
    const err = field.querySelector('.field-error');
    if (err) {
      err.textContent = '';
      err.hidden = true;
    }
    const ctrl = field.querySelector('input, select, textarea');
    if (ctrl) ctrl.setAttribute('aria-invalid', 'false');
  });
}

export function clearFieldError(form, fieldName) {
  const ctrl = form?.querySelector(`[name="${fieldName}"]`);
  if (!ctrl) return;
  const field = ctrl.closest('.field');
  if (!field) return;
  field.classList.remove('has-error');
  const visibleInput = field.querySelector('.combobox-input') || ctrl;
  visibleInput.setAttribute('aria-invalid', 'false');
  const err = field.querySelector('.field-error');
  if (err) {
    err.textContent = '';
    err.hidden = true;
  }
}

export function attachFieldClearHandlers(form) {
  form?.querySelectorAll('input, select, textarea').forEach((ctrl) => {
    const clear = () => {
      const field = ctrl.closest('.field');
      if (!field) return;
      field.classList.remove('has-error');
      ctrl.setAttribute('aria-invalid', 'false');
      const err = field.querySelector('.field-error');
      if (err) {
        err.textContent = '';
        err.hidden = true;
      }
    };
    ctrl.addEventListener('input', clear);
    ctrl.addEventListener('change', clear);
  });
}

export function setFieldError(form, fieldName, message) {
  const ctrl = form.querySelector(`[name="${fieldName}"]`);
  if (!ctrl) return;
  const field = ctrl.closest('.field');
  if (!field) return;
  field.classList.add('has-error');
  const visibleInput = field.querySelector('.combobox-input') || ctrl;
  visibleInput.setAttribute('aria-invalid', 'true');
  let err = field.querySelector('.field-error');
  if (!err) {
    err = document.createElement('span');
    err.className = 'field-error';
    field.appendChild(err);
  }
  err.textContent = message;
  err.hidden = false;
}

export function applyServerErrors(form, error) {
  const msg = error.message || 'Please check the highlighted fields.';
  setFormBanner(form, msg, 'error');
  const fieldMap = error.payload?.errors;
  if (fieldMap && typeof fieldMap === 'object') {
    Object.entries(fieldMap).forEach(([k, v]) => setFieldError(form, k, String(v)));
  } else if (/sku/i.test(msg)) {
    setFieldError(form, 'sku', msg);
  } else if (/max/i.test(msg)) {
    setFieldError(form, 'max_stock', msg);
  } else if (/price/i.test(msg)) {
    setFieldError(form, 'unit_price', msg);
  } else if (/stock|quantity|insufficient/i.test(msg)) {
    setFieldError(form, 'quantity', msg);
    setFieldError(form, 'current_stock', msg);
  } else if (/notes|reason/i.test(msg)) {
    setFieldError(form, 'notes', msg);
  }
}

export function paginationMarkup(currentPage, totalItems, pageSize, scope) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems === 0 || totalPages <= 1) return '';

  const pages = [];
  for (let p = 1; p <= totalPages; p += 1) {
    if (p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return `
    <nav class="pagination-bar" aria-label="${escapeHtml(scope)} pagination">
      <span>Page ${currentPage} of ${totalPages}</span>
      <div class="pagination-controls">
        <button class="page-btn" type="button" data-page-scope="${scope}" data-page="${currentPage - 1}" ${currentPage <= 1 ? 'disabled' : ''}>Prev</button>
        ${pages.map((p) => (p === '...'
          ? '<span aria-hidden="true">…</span>'
          : `<button class="page-btn ${p === currentPage ? 'is-active' : ''}" type="button" data-page-scope="${scope}" data-page="${p}" ${p === currentPage ? 'aria-current="page"' : ''}>${p}</button>`
        )).join('')}
        <button class="page-btn" type="button" data-page-scope="${scope}" data-page="${currentPage + 1}" ${currentPage >= totalPages ? 'disabled' : ''}>Next</button>
      </div>
    </nav>`;
}

export function mountProductCombobox(container, { id, name, label, placeholder, initialProduct = null, compact = false, onSelect }) {
  container.innerHTML = `
    <label class="field" for="${id}-input">
      ${label ? `<span>${escapeHtml(label)}</span>` : ''}
      <div class="combobox" data-combobox="${id}">
        <input type="hidden" name="${escapeHtml(name)}" value="${initialProduct ? initialProduct.id : ''}">
        <div class="combobox-input-wrap">
          <input id="${id}-input" class="combobox-input" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}-listbox" autocomplete="off" placeholder="${escapeHtml(placeholder)}" value="${initialProduct ? escapeHtml(`${initialProduct.name} (${initialProduct.sku})`) : ''}">
          <button class="combobox-clear" type="button" aria-label="Clear selected product" ${initialProduct ? '' : 'hidden'}>×</button>
        </div>
        ${compact ? '' : `<span class="combobox-meta" id="${id}-meta">${initialProduct ? escapeHtml(`${initialProduct.sku} · ${initialProduct.current_stock} in stock · Min ${initialProduct.min_stock} / Max ${initialProduct.max_stock}`) : 'Type to search by product name or SKU'}</span>`}
        <ul id="${id}-listbox" class="combobox-list" role="listbox" hidden></ul>
      </div>
      <span class="field-error" hidden></span>
    </label>`;

  const hidden = container.querySelector(`input[name="${name}"]`);
  const input = container.querySelector(`#${id}-input`);
  const clearBtn = container.querySelector('.combobox-clear');
  const meta = container.querySelector(`#${id}-meta`);
  const listbox = container.querySelector(`#${id}-listbox`);
  let options = [];
  let activeIndex = -1;
  let searchTimer = null;
  let searchSeq = 0;

  const updateActiveDescendant = () => {
    const activeOpt = activeIndex >= 0 ? listbox.children[activeIndex] : null;
    if (activeOpt?.id) {
      input.setAttribute('aria-activedescendant', activeOpt.id);
      activeOpt.scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  };

  const selectProduct = (prod) => {
    if (prod) cacheProducts([prod]);
    hidden.value = prod ? String(prod.id) : '';
    input.value = prod ? `${prod.name} (${prod.sku})` : '';
    clearBtn.hidden = !prod;
    if (meta) {
      meta.textContent = prod
        ? `${prod.sku} · ${prod.current_stock} in stock · Min ${prod.min_stock} / Max ${prod.max_stock}`
        : 'Type to search by product name or SKU';
    }
    listbox.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    activeIndex = -1;
    if (onSelect) onSelect(prod || null);
  };

  const renderOptions = () => {
    if (!options.length) {
      listbox.innerHTML = '<li class="combobox-empty">No matching products found</li>';
      activeIndex = -1;
    } else {
      listbox.innerHTML = options.map((p, idx) => `
        <li id="${id}-opt-${idx}" class="combobox-option ${idx === activeIndex ? 'is-active' : ''}" role="option" aria-selected="${idx === activeIndex}" data-index="${idx}">
          <span><b>${escapeHtml(p.name)}</b> <span class="mono">${escapeHtml(p.sku)}</span></span>
          <small>${p.current_stock} in stock</small>
        </li>`).join('');
    }
    listbox.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    updateActiveDescendant();
  };

  const loadMatches = async (term) => {
    const reqId = ++searchSeq;
    try {
      const qs = new URLSearchParams({ limit: '25' });
      if (term.trim()) qs.set('search', term.trim());
      const res = await api.get(`/api/products?${qs.toString()}`);
      if (reqId !== searchSeq) return;
      options = res.products || [];
      cacheProducts(options);
      activeIndex = options.length ? 0 : -1;
      renderOptions();
    } catch {
      if (reqId !== searchSeq) return;
      options = [...state.productCache.values()].filter((p) => {
        const q = term.trim().toLowerCase();
        return !q || `${p.name} ${p.sku}`.toLowerCase().includes(q);
      }).slice(0, 25);
      activeIndex = options.length ? 0 : -1;
      renderOptions();
    }
  };

  input.addEventListener('focus', () => {
    if (!hidden.value) loadMatches(input.value);
  });

  input.addEventListener('input', () => {
    const form = input.closest('form');
    clearFieldError(form, name);
    if (hidden.value) {
      hidden.value = '';
      clearBtn.hidden = true;
      if (meta) meta.textContent = 'Type to search by product name or SKU';
      if (onSelect) onSelect(null);
    }
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => loadMatches(input.value), 160);
  });

  input.addEventListener('keydown', (event) => {
    if (listbox.hidden && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      loadMatches(hidden.value ? '' : input.value);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (options.length) {
        activeIndex = (activeIndex + 1) % options.length;
        renderOptions();
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (options.length) {
        activeIndex = (activeIndex - 1 + options.length) % options.length;
        renderOptions();
      }
    } else if (event.key === 'Enter' && !listbox.hidden && activeIndex >= 0 && options[activeIndex]) {
      event.preventDefault();
      clearFieldError(input.closest('form'), name);
      selectProduct(options[activeIndex]);
    } else if (event.key === 'Escape') {
      listbox.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
    }
  });

  listbox.addEventListener('mousedown', (event) => {
    event.preventDefault();
    const opt = event.target.closest('.combobox-option');
    if (!opt) return;
    const idx = Number(opt.dataset.index);
    if (options[idx]) {
      clearFieldError(input.closest('form'), name);
      selectProduct(options[idx]);
    }
  });

  clearBtn.addEventListener('click', () => {
    selectProduct(null);
    input.focus();
  });

  input.addEventListener('blur', () => {
    window.setTimeout(() => {
      listbox.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
    }, 150);
  });

  return { selectProduct };
}
