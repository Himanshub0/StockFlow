/**
 * Products API Service
 */

import { apiClient } from './api-client.js';
import { state } from '../state/app-state.js';

export const productsApi = {
  async getProducts() {
    return apiClient.execute(() => [...state.products]);
  },

  async getProductById(id) {
    return apiClient.execute(() => {
      const p = state.products.find(item => item.id === id);
      if (!p) throw new Error(`Product not found: ${id}`);
      return { ...p };
    });
  },

  async createProduct(productData) {
    return apiClient.execute(() => state.addProduct(productData));
  },

  async updateProduct(id, productData) {
    return apiClient.execute(() => state.updateProduct(id, productData));
  },

  async deleteProduct(id) {
    return apiClient.execute(() => state.deleteProduct(id));
  }
};
