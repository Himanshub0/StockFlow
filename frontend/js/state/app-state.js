/**
 * Centralized Application State Store
 * Single source of truth for products, suppliers, movements, settings, and business calculations.
 */

const INITIAL_SUPPLIERS = [
  { id: 'sup-1', name: 'TechMatrix Global Ltd', contactPerson: 'Arun Verma', email: 'arun@techmatrix.com', phone: '+1 555-0192', productsSupplied: 6, status: 'Active' },
  { id: 'sup-2', name: 'PaperCraft & Stationery Co', contactPerson: 'Elena Rostova', email: 'elena@papercraft.org', phone: '+1 555-0143', productsSupplied: 5, status: 'Active' },
  { id: 'sup-3', name: 'Apex Accessories Corp', contactPerson: 'David Chen', email: 'sales@apexaccessories.io', phone: '+1 555-0188', productsSupplied: 4, status: 'Active' },
  { id: 'sup-4', name: 'Modular Workspace Solutions', contactPerson: 'Sarah Jenkins', email: 'sarah@modularworkspace.com', phone: '+1 555-0131', productsSupplied: 4, status: 'Active' },
  { id: 'sup-5', name: 'Titan Storage & Logistics', contactPerson: 'Marcus Vance', email: 'marcus@titanstorage.net', phone: '+1 555-0174', productsSupplied: 3, status: 'Active' }
];

const INITIAL_PRODUCTS = [
  { id: 'prod-1', name: 'Ergonomic Mechanical Keyboard', sku: 'ELEC-KB-01', category: 'Electronics', price: 129.99, quantity: 42, minimumStock: 15, supplierId: 'sup-1', description: 'Wireless RGB mechanical keyboard with hot-swappable switches' },
  { id: 'prod-2', name: 'Ultra-Wide 34" Curved Monitor', sku: 'ELEC-MON-02', category: 'Electronics', price: 449.50, quantity: 8, minimumStock: 10, supplierId: 'sup-1', description: '144Hz IPS display with USB-C 90W power delivery' },
  { id: 'prod-3', name: 'Noise-Cancelling Studio Headset', sku: 'ELEC-AUD-03', category: 'Electronics', price: 189.00, quantity: 24, minimumStock: 12, supplierId: 'sup-1', description: 'Active noise cancellation with 40-hour battery life' },
  { id: 'prod-4', name: 'Precision Wireless Trackball Mouse', sku: 'ELEC-MOU-04', category: 'Electronics', price: 69.95, quantity: 3, minimumStock: 10, supplierId: 'sup-1', description: 'Ergonomic sculptured thumb-control trackball' },
  { id: 'prod-5', name: '10-in-1 Thunderbolt 4 Hub', sku: 'ELEC-HUB-05', category: 'Electronics', price: 159.00, quantity: 0, minimumStock: 8, supplierId: 'sup-1', description: 'Dual 4K display support, 2.5G ethernet, SD 4.0 card reader' },

  { id: 'prod-6', name: 'Hardcover Dot-Grid Executive Notebook', sku: 'STAT-NTB-01', category: 'Stationery', price: 24.50, quantity: 85, minimumStock: 25, supplierId: 'sup-2', description: '120gsm fountain-pen friendly numbered paper with dual ribbon' },
  { id: 'prod-7', name: 'Archival Rollerball Ink Pens (Pack 12)', sku: 'STAT-PEN-02', category: 'Stationery', price: 18.00, quantity: 110, minimumStock: 30, supplierId: 'sup-2', description: '0.5mm waterproof pigmented black ink fine writing pens' },
  { id: 'prod-8', name: 'Minimalist Aluminum Desktop Ruler', sku: 'STAT-RUL-03', category: 'Stationery', price: 14.99, quantity: 15, minimumStock: 20, supplierId: 'sup-2', description: 'Laser-etched imperial and metric 30cm aluminum rule' },
  { id: 'prod-9', name: 'Premium Brass Mechanical Pencil 0.7mm', sku: 'STAT-PCL-04', category: 'Stationery', price: 32.00, quantity: 5, minimumStock: 15, supplierId: 'sup-2', description: 'Solid machined brass hexagonal body with knurled grip' },
  { id: 'prod-10', name: 'Sticky Note Value Dispenser Pack', sku: 'STAT-NOT-05', category: 'Stationery', price: 12.50, quantity: 64, minimumStock: 20, supplierId: 'sup-2', description: 'Removable adhesive paper notes in pastel enterprise tones' },

  { id: 'prod-11', name: 'Full-Grain Leather Desk Mat (XL)', sku: 'ACC-MAT-01', category: 'Accessories', price: 79.00, quantity: 19, minimumStock: 15, supplierId: 'sup-3', description: '900x400mm waterproof vegetable-tanned desk surface protector' },
  { id: 'prod-12', name: 'Magnetic Braided Cable Organizers (6pk)', sku: 'ACC-CAB-02', category: 'Accessories', price: 16.50, quantity: 45, minimumStock: 20, supplierId: 'sup-3', description: 'Silicone magnetic clip ties for under-desk cable routing' },
  { id: 'prod-13', name: 'Anodized Aluminum Laptop Stand', sku: 'ACC-LST-03', category: 'Accessories', price: 49.99, quantity: 2, minimumStock: 8, supplierId: 'sup-3', description: 'Elevated vented cooling stand compatible with 13-17 inch laptops' },
  { id: 'prod-14', name: 'Microfiber Optical Cleaning Cloths (10pk)', sku: 'ACC-CLT-04', category: 'Accessories', price: 9.99, quantity: 130, minimumStock: 25, supplierId: 'sup-3', description: 'Ultra-dense lint-free screen cleaning cloths' },

  { id: 'prod-15', name: 'Dual-Motor Electric Standing Desk 60"', sku: 'OFF-DSK-01', category: 'Office Supplies', price: 499.00, quantity: 7, minimumStock: 5, supplierId: 'sup-4', description: 'Quiet dual-motor lift with programmable 4-height memory controller' },
  { id: 'prod-16', name: 'High-Back Mesh Ergonomic Task Chair', sku: 'OFF-CHR-02', category: 'Office Supplies', price: 349.00, quantity: 11, minimumStock: 8, supplierId: 'sup-4', description: 'Dynamic lumbar support, 4D armrests, and synchro-tilt mechanism' },
  { id: 'prod-17', name: 'Articulating Dual Monitor Arm', sku: 'OFF-ARM-03', category: 'Office Supplies', price: 95.00, quantity: 4, minimumStock: 10, supplierId: 'sup-4', description: 'Gas-spring counterbalanced arms for monitors up to 32 inches' },
  { id: 'prod-18', name: 'Acoustic Desk Privacy Divider 48"', sku: 'OFF-DIV-04', category: 'Office Supplies', price: 65.00, quantity: 0, minimumStock: 6, supplierId: 'sup-4', description: 'Recycled PET sound-dampening clamp-on privacy screen' },

  { id: 'prod-19', name: 'Heavy-Duty Modular Storage Crate 45L', sku: 'STR-CRT-01', category: 'Storage', price: 29.50, quantity: 58, minimumStock: 20, supplierId: 'sup-5', description: 'Stackable high-density polypropylene container with dual latches' },
  { id: 'prod-20', name: 'Industrial 5-Tier Steel Shelving Unit', sku: 'STR-SHL-02', category: 'Storage', price: 185.00, quantity: 9, minimumStock: 5, supplierId: 'sup-5', description: 'Commercial 800lb per shelf capacity boltless rack' },
  { id: 'prod-21', name: 'Clear Parts Storage Cabinet (30-Drawer)', sku: 'STR-CAB-03', category: 'Storage', price: 42.00, quantity: 14, minimumStock: 10, supplierId: 'sup-5', description: 'Impact-resistant transparent drawer unit with removable dividers' },
  { id: 'prod-22', name: 'Pallet Hand Truck 5500lb Capacity', sku: 'STR-TRK-04', category: 'Storage', price: 389.00, quantity: 1, minimumStock: 2, supplierId: 'sup-5', description: 'Polyurethane load wheels with 3-position hand control lever' }
];

const INITIAL_MOVEMENTS = [
  { id: 'mov-1', productId: 'prod-1', type: 'IN', quantity: 20, previousQuantity: 22, newQuantity: 42, reference: 'PO-2026-104', date: '2026-11-06T10:15:00Z', notes: 'Quarterly restock from TechMatrix' },
  { id: 'mov-2', productId: 'prod-5', type: 'OUT', quantity: 8, previousQuantity: 8, newQuantity: 0, reference: 'SO-2026-891', date: '2026-11-06T11:45:00Z', notes: 'Corporate workstation upgrade order' },
  { id: 'mov-3', productId: 'prod-4', type: 'OUT', quantity: 7, previousQuantity: 10, newQuantity: 3, reference: 'SO-2026-892', date: '2026-11-05T14:20:00Z', notes: 'Direct customer shipment' },
  { id: 'mov-4', productId: 'prod-2', type: 'IN', quantity: 5, previousQuantity: 3, newQuantity: 8, reference: 'PO-2026-102', date: '2026-11-05T09:00:00Z', notes: 'Supplier expedited fulfillment' },
  { id: 'mov-5', productId: 'prod-13', type: 'OUT', quantity: 6, previousQuantity: 8, newQuantity: 2, reference: 'SO-2026-880', date: '2026-11-04T16:10:00Z', notes: 'Dispatched to East Regional Store' },
  { id: 'mov-6', productId: 'prod-18', type: 'ADJUSTMENT', quantity: -6, previousQuantity: 6, newQuantity: 0, reference: 'ADJ-2026-014', date: '2026-11-03T13:00:00Z', notes: 'Annual physical audit variance write-off' },
  { id: 'mov-7', productId: 'prod-6', type: 'IN', quantity: 40, previousQuantity: 45, newQuantity: 85, reference: 'PO-2026-098', date: '2026-11-02T11:30:00Z', notes: 'Bulk purchase order received' }
];

const INITIAL_SETTINGS = {
  companyName: 'StockFlow Enterprises',
  currency: 'USD',
  defaultLowStockThreshold: 10,
  enableRealTimeAlerts: true,
  itemsPerPage: 10
};

class AppState {
  constructor() {
    this.products = [...INITIAL_PRODUCTS];
    this.suppliers = [...INITIAL_SUPPLIERS];
    this.movements = [...INITIAL_MOVEMENTS];
    this.settings = { ...INITIAL_SETTINGS };
    this.subscribers = new Map();
  }

  // Pub/Sub Event System
  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event).add(callback);
    return () => this.subscribers.get(event).delete(callback);
  }

  notify(event, data) {
    if (this.subscribers.has(event)) {
      this.subscribers.get(event).forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in subscriber for ${event}:`, err);
        }
      });
    }
    // Also notify wildcard 'ALL'
    if (this.subscribers.has('*')) {
      this.subscribers.get('*').forEach(cb => cb({ event, data }));
    }
  }

  // Core Calculations (Single Source of Truth)
  getStockStatus(product) {
    const qty = Number(product.quantity) || 0;
    const min = Number(product.minimumStock) || 0;
    if (qty === 0) return 'OUT_OF_STOCK';
    if (qty <= min) return 'LOW_STOCK';
    return 'IN_STOCK';
  }

  calculateInventoryValue() {
    return this.products.reduce((acc, p) => acc + (p.price * p.quantity), 0);
  }

  calculateTotalUnits() {
    return this.products.reduce((acc, p) => acc + p.quantity, 0);
  }

  getLowStockProducts() {
    return this.products.filter(p => this.getStockStatus(p) === 'LOW_STOCK');
  }

  getOutOfStockProducts() {
    return this.products.filter(p => this.getStockStatus(p) === 'OUT_OF_STOCK');
  }

  calculateCategoryDistribution() {
    const distribution = {};
    this.products.forEach(p => {
      const cat = p.category || 'Uncategorized';
      if (!distribution[cat]) {
        distribution[cat] = { count: 0, units: 0, value: 0 };
      }
      distribution[cat].count += 1;
      distribution[cat].units += p.quantity;
      distribution[cat].value += (p.price * p.quantity);
    });
    return distribution;
  }

  calculateStockStatusDistribution() {
    const dist = {
      IN_STOCK: 0,
      LOW_STOCK: 0,
      OUT_OF_STOCK: 0
    };
    this.products.forEach(p => {
      const status = this.getStockStatus(p);
      dist[status] = (dist[status] || 0) + 1;
    });
    return dist;
  }

  // Product Actions
  addProduct(productData) {
    const newProduct = {
      id: `prod-${Date.now()}`,
      name: productData.name.trim(),
      sku: productData.sku.trim().toUpperCase(),
      category: productData.category.trim(),
      price: Number(productData.price),
      quantity: Number(productData.quantity) || 0,
      minimumStock: Number(productData.minimumStock) || this.settings.defaultLowStockThreshold,
      supplierId: productData.supplierId || null,
      description: (productData.description || '').trim(),
      createdAt: new Date().toISOString()
    };

    this.products.unshift(newProduct);

    // If initial quantity > 0, record initial stock-in movement
    if (newProduct.quantity > 0) {
      this.movements.unshift({
        id: `mov-${Date.now()}`,
        productId: newProduct.id,
        type: 'IN',
        quantity: newProduct.quantity,
        previousQuantity: 0,
        newQuantity: newProduct.quantity,
        reference: `INIT-${newProduct.sku}`,
        date: new Date().toISOString(),
        notes: 'Initial inventory registration'
      });
    }

    this.notify('PRODUCTS_CHANGED', { action: 'ADD', product: newProduct });
    this.notify('STATE_CHANGED');
    return newProduct;
  }

  updateProduct(id, productData) {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error(`Product not found: ${id}`);

    const existing = this.products[index];
    const prevQty = existing.quantity;
    const newQty = Number(productData.quantity);

    const updated = {
      ...existing,
      name: productData.name !== undefined ? productData.name.trim() : existing.name,
      sku: productData.sku !== undefined ? productData.sku.trim().toUpperCase() : existing.sku,
      category: productData.category !== undefined ? productData.category.trim() : existing.category,
      price: productData.price !== undefined ? Number(productData.price) : existing.price,
      quantity: !isNaN(newQty) ? newQty : existing.quantity,
      minimumStock: productData.minimumStock !== undefined ? Number(productData.minimumStock) : existing.minimumStock,
      supplierId: productData.supplierId !== undefined ? productData.supplierId : existing.supplierId,
      description: productData.description !== undefined ? productData.description.trim() : existing.description,
      updatedAt: new Date().toISOString()
    };

    this.products[index] = updated;

    // If quantity was altered manually during edit, log an adjustment
    if (!isNaN(newQty) && newQty !== prevQty) {
      const diff = newQty - prevQty;
      this.movements.unshift({
        id: `mov-${Date.now()}`,
        productId: updated.id,
        type: 'ADJUSTMENT',
        quantity: diff,
        previousQuantity: prevQty,
        newQuantity: newQty,
        reference: `MAN-ADJ-${updated.sku}`,
        date: new Date().toISOString(),
        notes: 'Quantity modified via product edit form'
      });
      this.notify('MOVEMENTS_CHANGED');
    }

    this.notify('PRODUCTS_CHANGED', { action: 'UPDATE', product: updated });
    this.notify('STATE_CHANGED');
    return updated;
  }

  deleteProduct(id) {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error(`Product not found: ${id}`);

    const removed = this.products.splice(index, 1)[0];
    this.notify('PRODUCTS_CHANGED', { action: 'DELETE', product: removed });
    this.notify('STATE_CHANGED');
    return removed;
  }

  // Stock Movement Operations
  recordStockMovement({ productId, type, quantity, reference, notes }) {
    const product = this.products.find(p => p.id === productId);
    if (!product) throw new Error('Product not found for movement.');

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      throw new Error('Movement quantity must be a positive number.');
    }

    const prevQty = product.quantity;
    let newQty = prevQty;

    if (type === 'IN') {
      newQty = prevQty + qty;
    } else if (type === 'OUT') {
      if (prevQty - qty < 0) {
        throw new Error(`Insufficient stock. Available: ${prevQty}, requested: ${qty}.`);
      }
      newQty = prevQty - qty;
    } else if (type === 'ADJUSTMENT') {
      // In adjustment, quantity is the target new count or delta
      newQty = qty;
    } else {
      throw new Error(`Invalid movement type: ${type}`);
    }

    product.quantity = newQty;

    const newMovement = {
      id: `mov-${Date.now()}`,
      productId: product.id,
      type,
      quantity: type === 'ADJUSTMENT' ? (newQty - prevQty) : qty,
      previousQuantity: prevQty,
      newQuantity: newQty,
      reference: reference ? reference.trim() : `TX-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      notes: notes ? notes.trim() : ''
    };

    this.movements.unshift(newMovement);

    this.notify('PRODUCTS_CHANGED', { action: 'UPDATE', product });
    this.notify('MOVEMENTS_CHANGED', { movement: newMovement });
    this.notify('STATE_CHANGED');

    return { product, movement: newMovement };
  }

  // Supplier Actions
  addSupplier(supplierData) {
    const newSupplier = {
      id: `sup-${Date.now()}`,
      name: supplierData.name.trim(),
      contactPerson: supplierData.contactPerson.trim(),
      email: (supplierData.email || '').trim(),
      phone: (supplierData.phone || '').trim(),
      productsSupplied: 0,
      status: supplierData.status || 'Active'
    };

    this.suppliers.unshift(newSupplier);
    this.notify('SUPPLIERS_CHANGED', { action: 'ADD', supplier: newSupplier });
    this.notify('STATE_CHANGED');
    return newSupplier;
  }

  updateSupplier(id, supplierData) {
    const index = this.suppliers.findIndex(s => s.id === id);
    if (index === -1) throw new Error(`Supplier not found: ${id}`);

    const existing = this.suppliers[index];
    const updated = {
      ...existing,
      name: supplierData.name ? supplierData.name.trim() : existing.name,
      contactPerson: supplierData.contactPerson ? supplierData.contactPerson.trim() : existing.contactPerson,
      email: supplierData.email !== undefined ? supplierData.email.trim() : existing.email,
      phone: supplierData.phone !== undefined ? supplierData.phone.trim() : existing.phone,
      status: supplierData.status || existing.status
    };

    this.suppliers[index] = updated;
    this.notify('SUPPLIERS_CHANGED', { action: 'UPDATE', supplier: updated });
    this.notify('STATE_CHANGED');
    return updated;
  }

  deleteSupplier(id) {
    const index = this.suppliers.findIndex(s => s.id === id);
    if (index === -1) throw new Error(`Supplier not found: ${id}`);

    const removed = this.suppliers.splice(index, 1)[0];
    this.notify('SUPPLIERS_CHANGED', { action: 'DELETE', supplier: removed });
    this.notify('STATE_CHANGED');
    return removed;
  }

  // Settings Actions
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.notify('SETTINGS_CHANGED', { settings: this.settings });
    this.notify('STATE_CHANGED');
    return this.settings;
  }

  // Reset to Clean Mock Data
  resetToMockData() {
    this.products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
    this.suppliers = JSON.parse(JSON.stringify(INITIAL_SUPPLIERS));
    this.movements = JSON.parse(JSON.stringify(INITIAL_MOVEMENTS));
    this.settings = JSON.parse(JSON.stringify(INITIAL_SETTINGS));
    this.notify('STATE_CHANGED');
  }
}

export const state = new AppState();
