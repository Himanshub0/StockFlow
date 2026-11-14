export const API_BASE = window.STOCKFLOW_API_BASE || (window.location.protocol.startsWith('http') ? window.location.origin : 'http://127.0.0.1:5000');

export class ApiError extends Error {
  constructor(message, status, payload) { super(message); this.name = 'ApiError'; this.status = status; this.payload = payload; }
}

export async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const token = localStorage.getItem('stockflow_token');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {...options, headers, signal: controller.signal});
  } catch (error) {
    if (error.name === 'AbortError') throw new ApiError('The backend took too long to respond. Check that the StockFlow backend is running.', 0, {});
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) throw new ApiError(payload.error || `Request failed (${response.status})`, response.status, payload);
  return payload.data ?? payload;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, {method: 'POST', body: JSON.stringify(body)}),
  postForm: (path, formData) => request(path, {method: 'POST', body: formData}),
  put: (path, body) => request(path, {method: 'PUT', body: JSON.stringify(body)}),
  patch: (path, body) => request(path, {method: 'PATCH', body: JSON.stringify(body)}),
  delete: (path) => request(path, {method: 'DELETE'})
};
