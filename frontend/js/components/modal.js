/**
 * Modal Dialog Component
 * Handles custom form modals and confirmation dialogs with accessible backdrop and focus management.
 */

import { getIcon } from '../utils/dom.js';

class ModalManager {
  constructor() {
    this.overlay = null;
    this.currentOnClose = null;
    this.init();
  }

  init() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.innerHTML = `
      <div class="modal-container" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h3 class="modal-title"></h3>
          <button class="btn btn-ghost btn-icon-only modal-close-btn" aria-label="Close dialog">
            ${getIcon('x')}
          </button>
        </div>
        <div class="modal-body"></div>
        <div class="modal-footer"></div>
      </div>
    `;

    document.body.appendChild(this.overlay);

    const closeBtn = this.overlay.querySelector('.modal-close-btn');
    closeBtn.addEventListener('click', () => this.close());

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  }

  isOpen() {
    return this.overlay.classList.contains('open');
  }

  open({ title, body, footer, onClose, maxWidth }) {
    this.currentOnClose = onClose;

    const titleEl = this.overlay.querySelector('.modal-title');
    const bodyEl = this.overlay.querySelector('.modal-body');
    const footerEl = this.overlay.querySelector('.modal-footer');
    const container = this.overlay.querySelector('.modal-container');

    titleEl.textContent = title || '';

    if (maxWidth) {
      container.style.maxWidth = maxWidth;
    } else {
      container.style.maxWidth = '580px';
    }

    if (typeof body === 'string') {
      bodyEl.innerHTML = body;
    } else if (body instanceof HTMLElement) {
      bodyEl.innerHTML = '';
      bodyEl.appendChild(body);
    }

    if (typeof footer === 'string') {
      footerEl.innerHTML = footer;
    } else if (footer instanceof HTMLElement) {
      footerEl.innerHTML = '';
      footerEl.appendChild(footer);
    } else {
      footerEl.innerHTML = `<button class="btn btn-secondary modal-cancel-btn">Close</button>`;
      footerEl.querySelector('.modal-cancel-btn').addEventListener('click', () => this.close());
    }

    this.overlay.classList.add('open');
  }

  close() {
    if (this.currentOnClose) {
      this.currentOnClose();
      this.currentOnClose = null;
    }
    this.overlay.classList.remove('open');
  }

  confirm({ title = 'Confirm Action', message, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false, onConfirm }) {
    const body = document.createElement('div');
    body.style.padding = '8px 0';
    body.innerHTML = `<p style="font-size: var(--font-size-sm); color: var(--text-secondary); line-height: 1.5;">${message}</p>`;

    const footer = document.createElement('div');
    footer.style.display = 'flex';
    footer.style.justifyContent = 'flex-end';
    footer.style.gap = '8px';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = cancelText;
    cancelBtn.onclick = () => this.close();

    const confirmBtn = document.createElement('button');
    confirmBtn.className = isDanger ? 'btn btn-danger' : 'btn btn-primary';
    confirmBtn.textContent = confirmText;
    confirmBtn.onclick = () => {
      this.close();
      if (onConfirm) onConfirm();
    };

    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);

    this.open({
      title,
      body,
      footer,
      maxWidth: '460px'
    });
  }
}

export const modal = new ModalManager();
