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
})();
