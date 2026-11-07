/**
 * Reports and Analytics API Service
 */

import { apiClient } from './api-client.js';
import { state } from '../state/app-state.js';

export const reportsApi = {
  async getInventorySummary() {
    return apiClient.execute(() => ({
      totalProducts: state.products.length,
      totalUnits: state.calculateTotalUnits(),
      inventoryValue: state.calculateInventoryValue(),
      lowStockCount: state.getLowStockProducts().length,
      outOfStockCount: state.getOutOfStockProducts().length,
      categoryDistribution: state.calculateCategoryDistribution(),
      statusDistribution: state.calculateStockStatusDistribution()
    }));
  }
};
