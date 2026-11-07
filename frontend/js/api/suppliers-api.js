/**
 * Suppliers API Service
 */

import { apiClient } from './api-client.js';
import { state } from '../state/app-state.js';

export const suppliersApi = {
  async getSuppliers() {
    return apiClient.execute(() => [...state.suppliers]);
  },

  async createSupplier(data) {
    return apiClient.execute(() => state.addSupplier(data));
  },

  async updateSupplier(id, data) {
    return apiClient.execute(() => state.updateSupplier(id, data));
  },

  async deleteSupplier(id) {
    return apiClient.execute(() => state.deleteSupplier(id));
  }
};
