/**
 * Semantic Status Badge Component
 */

export function renderStockBadge(status) {
  switch (status) {
    case 'IN_STOCK':
      return `<span class="badge badge-arsenic"><span class="badge-dot"></span>In Stock</span>`;
    case 'LOW_STOCK':
      return `<span class="badge badge-orange"><span class="badge-dot"></span>Low Stock</span>`;
    case 'OUT_OF_STOCK':
      return `<span class="badge badge-danger"><span class="badge-dot"></span>Out of Stock</span>`;
    default:
      return `<span class="badge badge-neutral">${status}</span>`;
  }
}

export function renderMovementBadge(type) {
  switch (type) {
    case 'IN':
      return `<span class="movement-type-tag movement-type-in">STOCK IN</span>`;
    case 'OUT':
      return `<span class="movement-type-tag movement-type-out">STOCK OUT</span>`;
    case 'ADJUSTMENT':
      return `<span class="movement-type-tag movement-type-adjustment">ADJUSTMENT</span>`;
    default:
      return `<span class="badge badge-neutral">${type}</span>`;
  }
}
