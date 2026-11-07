/**
 * Stock Movements API Service
 */

import { apiClient } from './api-client.js';
import { state } from '../state/app-state.js';

export const movementsApi = {
  async getMovements() {
    return apiClient.execute(() => [...state.movements]);
  },

  async recordMovement(movementData) {
    return apiClient.execute(() => state.recordStockMovement(movementData));
  }
};
