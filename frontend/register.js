(() => {
  const form = document.querySelector('#register-form');
  const message = document.querySelector('#form-message');
  const submit = document.querySelector('.submit-button');
  const submitLabel = document.querySelector('#submit-label');
  const apiBase = window.STOCKFLOW_API_BASE || (window.location.protocol.startsWith('http') ? window.location.origin : 'http://127.0.0.1:5000');

  const showMessage = (text, state) => {
    message.hidden = false;
    message.dataset.state = state;
    message.textContent = text;
  };

  const setFieldError = (fieldEl, text = '') => {
    const field = fieldEl?.closest('.field');
    if (field) field.classList.toggle('has-error', Boolean(text));
    if (fieldEl) fieldEl.setAttribute('aria-invalid', text ? 'true' : 'false');
    const err = field?.querySelector('.field-error');
    if (err) {
      err.textContent = text;
      err.hidden = !text;
    }
  };

  form.querySelectorAll('input, select').forEach((ctrl) => {
    ctrl.addEventListener('input', () => setFieldError(ctrl, ''));
    ctrl.addEventListener('change', () => setFieldError(ctrl, ''));
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
    form.querySelectorAll('input, select').forEach((ctrl) => setFieldError(ctrl, ''));

    const fullName = document.querySelector('#full-name');
    const username = document.querySelector('#username');
    const email = document.querySelector('#email');
    const password = document.querySelector('#password');
    const confirm = document.querySelector('#confirm-password');
    const role = document.querySelector('#role');
    const terms = document.querySelector('#terms');

    let firstInvalid = null;
    const markInvalid = (el, msg) => {
      setFieldError(el, msg);
      if (!firstInvalid) firstInvalid = el;
    };

    if (!fullName.value.trim()) markInvalid(fullName, 'Enter your full name.');
    if (username.value.trim().length < 3) markInvalid(username, 'Username needs at least 3 characters.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) markInvalid(email, 'Enter a valid email address.');
    if (password.value.length < 6) markInvalid(password, 'Password must be at least 6 characters.');
    if (!confirm.value) markInvalid(confirm, 'Repeat your password.');
    else if (password.value !== confirm.value) markInvalid(confirm, 'Passwords do not match.');

    if (firstInvalid) {
      const msg = firstInvalid === confirm && password.value !== confirm.value
        ? 'Passwords do not match.'
        : 'Complete the highlighted fields to continue.';
      showMessage(msg, 'error');
      firstInvalid.focus();
      return;
    }
    if (!terms.checked) {
      setFieldError(terms, 'Please confirm to create your account.');
      showMessage('Complete the highlighted fields to continue.', 'error');
      terms.focus();
      return;
    }

    submit.disabled = true;
    submitLabel.textContent = 'Creating workspace…';
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          username: username.value.trim(),
          email: email.value.trim(),
          password: password.value,
          full_name: fullName.value.trim(),
          role: role.value
        }),
        signal: controller.signal
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Registration failed.');
      if (payload.data?.token) localStorage.setItem('stockflow_token', payload.data.token);
      if (payload.data?.user) localStorage.setItem('stockflow_user', JSON.stringify(payload.data.user));
      showMessage('Account created. Your StockFlow workspace is ready.', 'success');
      submitLabel.textContent = 'Account created';
      setTimeout(() => { window.location.href = 'app.html'; }, 500);
    } catch (error) {
      const messageText = error.name === 'AbortError'
        ? 'The backend took too long to respond. Check that the StockFlow backend is running.'
        : (error instanceof TypeError ? 'StockFlow backend is offline. Start the server and try again.' : (error.message || 'Registration failed.'));
      if (/username/i.test(messageText)) setFieldError(username, messageText);
      else if (/email/i.test(messageText)) setFieldError(email, messageText);
      else if (/password/i.test(messageText)) setFieldError(password, messageText);
      showMessage(messageText, 'error');
      submit.disabled = false;
      submitLabel.textContent = 'Create account';
    } finally {
      window.clearTimeout(timeout);
    }
  });
})();
