/**
 * API Client Layer
 * Standardizes API communication. Operates against the local AppState store,
 * providing clean asynchronous interfaces identical to future Flask backend HTTP endpoints.
 */

export const apiClient = {
  // Configured base URL for future Flask endpoints (e.g. '/api/v1')
  baseURL: '/api/v1',

  // Simulated latency for realistic enterprise network behavior
  async execute(fn, delayMs = 60) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const result = fn();
          resolve({ success: true, data: result, timestamp: new Date().toISOString() });
        } catch (error) {
          reject({ success: false, error: error.message || 'Network request failed' });
        }
      }, delayMs);
    });
  }
};
