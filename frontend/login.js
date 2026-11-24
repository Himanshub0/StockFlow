(() => {
  const form = document.querySelector('#login-form');
  const message = document.querySelector('#login-message');
  const submit = document.querySelector('.submit-button');
  const label = document.querySelector('#login-submit-label');
  const apiBase = window.STOCKFLOW_API_BASE || (window.location.protocol.startsWith('http') ? window.location.origin : 'http://127.0.0.1:5000');

  const showMessage = (text, state) => {
    message.hidden = false;
    message.dataset.state = state;
    message.textContent = text;
  };

  const setFieldError = (input, text = '') => {
    const field = input.closest('.field');
    const errorEl = field?.querySelector('.field-error');
    if (field) field.classList.toggle('has-error', Boolean(text));
    input.setAttribute('aria-invalid', text ? 'true' : 'false');
    if (errorEl) {
      errorEl.textContent = text;
      errorEl.hidden = !text;
    }
  };

  const params = new URLSearchParams(window.location.search);
  const queryMsg = params.get('message');
  if (queryMsg) showMessage(queryMsg, 'error');

  form.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', () => setFieldError(input, ''));
  });

  form.querySelectorAll('[data-toggle-pw]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.togglePw);
      if (!target) return;
      const showing = target.type === 'text';
      target.type = showing ? 'password' : 'text';
      btn.textContent = showing ? 'Show' : 'Hide';
      btn.setAttribute('aria-pressed', String(!showing));
      btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.hidden = true;
    const identifierInput = document.querySelector('#identifier');
    const passwordInput = document.querySelector('#login-password');
    setFieldError(identifierInput, '');
    setFieldError(passwordInput, '');

    let hasError = false;
    if (!identifierInput.value.trim()) {
      setFieldError(identifierInput, 'Enter your email or username.');
      hasError = true;
    }
    if (!passwordInput.value) {
      setFieldError(passwordInput, 'Enter your password.');
      hasError = true;
    }
    if (hasError) {
      showMessage('Please complete the highlighted fields.', 'error');
      (!identifierInput.value.trim() ? identifierInput : passwordInput).focus();
      return;
    }

    submit.disabled = true;
    label.textContent = 'Checking your workspace…';
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({identifier: identifierInput.value.trim(), password: passwordInput.value}),
        signal: controller.signal
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Login failed.');
      localStorage.setItem('stockflow_token', payload.data.token);
      localStorage.setItem('stockflow_user', JSON.stringify(payload.data.user));
      window.location.href = 'app.html';
    } catch (error) {
      const messageText = error.name === 'AbortError'
        ? 'The backend took too long to respond. Check that the StockFlow backend is running.'
        : (error instanceof TypeError ? 'StockFlow backend is offline. Start the server and try again.' : (error.message || 'Login failed.'));
      showMessage(messageText, 'error');
      submit.disabled = false;
      label.textContent = 'Log in to StockFlow';
    } finally {
      window.clearTimeout(timeout);
    }
  });

  /* ══════════════════════════════════════════════════════════════════════════
     THEME MANAGEMENT — Dark/Light Mode Sync with app.html & index.html
     ══════════════════════════════════════════════════════════════════════════ */
  const themeToggle = document.querySelector('#theme-toggle');
  const SUN_PATH = 'M12 3v2m0 14v2m9-9h-2M5 12H3m15.4-6.4-1.4 1.4M7 17l-1.4 1.4m0-12.8L7 7m10 10 1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z';
  const MOON_PATH = 'M20.6 15.7A8.5 8.5 0 0 1 8.3 3.4 8.5 8.5 0 1 0 20.6 15.7Z';

  const syncThemeUI = (theme) => {
    const isDark = theme === 'dark';
    const targetPath = isDark ? SUN_PATH : MOON_PATH;
    const nextLabel = `Switch to ${isDark ? 'light' : 'dark'} mode`;

    if (themeToggle) {
      themeToggle.setAttribute('aria-label', nextLabel);
      themeToggle.setAttribute('title', nextLabel);
      const pathEl = themeToggle.querySelector('path');
      if (pathEl) pathEl.setAttribute('d', targetPath);
    }
  };

  const toggleTheme = () => {
    const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('stockflow-theme', next);
    } catch (_) {}
    syncThemeUI(next);
  };

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  syncThemeUI(document.documentElement.dataset.theme || 'light');
})();
