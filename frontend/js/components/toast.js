/**
 * Toast Notification Component
 */

import { getIcon } from '../utils/dom.js';

class ToastManager {
  constructor() {
    this.container = null;
    this.ensureContainer();
  }

  ensureContainer() {
    if (!this.container) {
      this.container = document.querySelector('.toast-container');
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
      }
    }
  }

  show({ title, message, type = 'info', duration = 3500 }) {
    this.ensureContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconName = 'info';
    if (type === 'success') iconName = 'checkCircle';
    if (type === 'warning') iconName = 'alertTriangle';
    if (type === 'danger') iconName = 'x';

    toast.innerHTML = `
      <div class="toast-icon">${getIcon(iconName)}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Close notification">${getIcon('x')}</button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.dismiss(toast));

    this.container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toast);
      }, duration);
    }
  }

  dismiss(toast) {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 200);
  }

  success(message, title = 'Success') {
    this.show({ type: 'success', title, message });
  }

  warning(message, title = 'Warning') {
    this.show({ type: 'warning', title, message });
  }

  danger(message, title = 'Error') {
    this.show({ type: 'danger', title, message });
  }

  info(message, title = 'Notice') {
    this.show({ type: 'info', title, message });
  }
}

export const toast = new ToastManager();
