/**
 * StockFlow Enterprise Frontend - Standalone Universal Bundle
 * Runs natively in all browsers over both file:// (double-click) and http:// without CORS errors.
 */
(function() {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. ICONS & DOM HELPERS
  // ---------------------------------------------------------------------------
  const ICONS = {
    dashboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>`,
    package: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
    boxes: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"/><path d="m7 16.5-4.74-2.85"/><path d="m7 16.5 5-3"/><path d="M7 16.5v5.17"/><path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z"/><path d="m17 16.5-5-3"/><path d="m17 16.5 4.74-2.85"/><path d="M17 16.5v5.17"/><path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z"/><path d="M12 8 7.26 5.15"/><path d="m12 8 4.74-2.85"/><path d="M12 13.5V8"/></svg>`,
    movements: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>`,
    suppliers: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    reports: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>`,
    settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
    plus: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,
    search: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
    bell: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
    menu: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`,
    x: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
    arrowUpRight: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>`,
    arrowDownLeft: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 17H7V7"/><path d="M17 7 7 17"/></svg>`,
    refreshCw: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>`,
    download: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`,
    edit: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`,
    trash: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
    alertTriangle: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>`,
    checkCircle: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>`,
    dollarSign: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    chevronLeft: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`,
    chevronRight: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
    collapse: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>`
  };

  function getIcon(name) {
    return ICONS[name] || '';
  }

  // ---------------------------------------------------------------------------
  // 2. FORMATTERS & VALIDATORS
  // ---------------------------------------------------------------------------
  function formatCurrency(amount, currencyCode = 'USD') {
    const num = Number(amount) || 0;
    const symbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
    const sym = symbols[currencyCode] || '$';
    return `${sym}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function formatNumber(value) {
    return (Number(value) || 0).toLocaleString('en-US');
  }

  function formatDate(dateString, includeTime = true) {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const opts = { year: 'numeric', month: 'short', day: 'numeric' };
    if (includeTime) { opts.hour = '2-digit'; opts.minute = '2-digit'; }
    return d.toLocaleDateString('en-US', opts);
  }

  function exportToCSV(filename, headers, rows) {
    if (!rows || !rows.length) throw new Error('No data available to export.');
    const esc = (v) => {
      if (v === null || v === undefined) return '""';
      const s = String(v);
      if (s.includes('"') || s.includes(',') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
      return `"${s}"`;
    };
    const head = headers.map(h => esc(h.label || h)).join(',');
    const body = rows.map(r => headers.map(h => esc(r[typeof h === 'object' ? h.key : h])).join(','));
    const blob = new Blob([[head, ...body].join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // ---------------------------------------------------------------------------
  // 3. INITIAL MOCK DATASET
  // ---------------------------------------------------------------------------
  const INITIAL_SUPPLIERS = [
    { id: 'sup-1', name: 'TechMatrix Global Ltd', contactPerson: 'Arun Verma', email: 'arun@techmatrix.com', phone: '+1 555-0192', status: 'Active' },
    { id: 'sup-2', name: 'PaperCraft & Stationery Co', contactPerson: 'Elena Rostova', email: 'elena@papercraft.org', phone: '+1 555-0143', status: 'Active' },
    { id: 'sup-3', name: 'Apex Accessories Corp', contactPerson: 'David Chen', email: 'sales@apexaccessories.io', phone: '+1 555-0188', status: 'Active' },
    { id: 'sup-4', name: 'Modular Workspace Solutions', contactPerson: 'Sarah Jenkins', email: 'sarah@modularworkspace.com', phone: '+1 555-0131', status: 'Active' },
    { id: 'sup-5', name: 'Titan Storage & Logistics', contactPerson: 'Marcus Vance', email: 'marcus@titanstorage.net', phone: '+1 555-0174', status: 'Active' }
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

  // ---------------------------------------------------------------------------
  // 4. CENTRAL APP STATE
  // ---------------------------------------------------------------------------
  class AppState {
    constructor() {
      this.products = [...INITIAL_PRODUCTS];
      this.suppliers = [...INITIAL_SUPPLIERS];
      this.movements = [...INITIAL_MOVEMENTS];
      this.settings = {
        companyName: 'StockFlow Enterprises',
        currency: 'USD',
        defaultLowStockThreshold: 10,
        itemsPerPage: 10
      };
      this.subscribers = new Map();
    }

    subscribe(event, cb) {
      if (!this.subscribers.has(event)) this.subscribers.set(event, new Set());
      this.subscribers.get(event).add(cb);
      return () => this.subscribers.get(event).delete(cb);
    }

    notify(event, data) {
      if (this.subscribers.has(event)) {
        this.subscribers.get(event).forEach(cb => { try { cb(data); } catch (e) { console.error(e); } });
      }
      if (this.subscribers.has('*')) {
        this.subscribers.get('*').forEach(cb => cb({ event, data }));
      }
    }

    getStockStatus(p) {
      const q = Number(p.quantity) || 0;
      const m = Number(p.minimumStock) || 0;
      if (q === 0) return 'OUT_OF_STOCK';
      if (q <= m) return 'LOW_STOCK';
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
      const dist = {};
      this.products.forEach(p => {
        const c = p.category || 'Other';
        if (!dist[c]) dist[c] = { count: 0, units: 0, value: 0 };
        dist[c].count++;
        dist[c].units += p.quantity;
        dist[c].value += (p.price * p.quantity);
      });
      return dist;
    }

    calculateStockStatusDistribution() {
      const dist = { IN_STOCK: 0, LOW_STOCK: 0, OUT_OF_STOCK: 0 };
      this.products.forEach(p => {
        dist[this.getStockStatus(p)]++;
      });
      return dist;
    }

    addProduct(data) {
      const p = {
        id: `prod-${Date.now()}`,
        name: data.name.trim(),
        sku: data.sku.trim().toUpperCase(),
        category: data.category.trim(),
        price: Number(data.price),
        quantity: Number(data.quantity) || 0,
        minimumStock: Number(data.minimumStock) || this.settings.defaultLowStockThreshold,
        supplierId: data.supplierId || null,
        description: (data.description || '').trim()
      };
      this.products.unshift(p);
      if (p.quantity > 0) {
        this.movements.unshift({
          id: `mov-${Date.now()}`,
          productId: p.id,
          type: 'IN',
          quantity: p.quantity,
          previousQuantity: 0,
          newQuantity: p.quantity,
          reference: `INIT-${p.sku}`,
          date: new Date().toISOString(),
          notes: 'Initial stock intake'
        });
      }
      this.notify('PRODUCTS_CHANGED');
      this.notify('STATE_CHANGED');
      return p;
    }

    updateProduct(id, data) {
      const i = this.products.findIndex(p => p.id === id);
      if (i === -1) throw new Error('Product not found');
      const prev = this.products[i];
      const newQty = Number(data.quantity);
      const updated = {
        ...prev,
        name: data.name ? data.name.trim() : prev.name,
        sku: data.sku ? data.sku.trim().toUpperCase() : prev.sku,
        category: data.category || prev.category,
        price: data.price !== undefined ? Number(data.price) : prev.price,
        quantity: !isNaN(newQty) ? newQty : prev.quantity,
        minimumStock: data.minimumStock !== undefined ? Number(data.minimumStock) : prev.minimumStock,
        supplierId: data.supplierId !== undefined ? data.supplierId : prev.supplierId,
        description: data.description !== undefined ? data.description.trim() : prev.description
      };
      this.products[i] = updated;
      if (!isNaN(newQty) && newQty !== prev.quantity) {
        this.movements.unshift({
          id: `mov-${Date.now()}`,
          productId: updated.id,
          type: 'ADJUSTMENT',
          quantity: newQty - prev.quantity,
          previousQuantity: prev.quantity,
          newQuantity: newQty,
          reference: `ADJ-${updated.sku}`,
          date: new Date().toISOString(),
          notes: 'Count adjusted via edit form'
        });
        this.notify('MOVEMENTS_CHANGED');
      }
      this.notify('PRODUCTS_CHANGED');
      this.notify('STATE_CHANGED');
      return updated;
    }

    deleteProduct(id) {
      const i = this.products.findIndex(p => p.id === id);
      if (i === -1) throw new Error('Product not found');
      const removed = this.products.splice(i, 1)[0];
      this.notify('PRODUCTS_CHANGED');
      this.notify('STATE_CHANGED');
      return removed;
    }

    recordStockMovement({ productId, type, quantity, reference, notes }) {
      const p = this.products.find(item => item.id === productId);
      if (!p) throw new Error('Product not found');
      const qty = Number(quantity);
      if (isNaN(qty) || qty <= 0) throw new Error('Quantity must be greater than zero');
      const prev = p.quantity;
      let next = prev;
      if (type === 'IN') next = prev + qty;
      else if (type === 'OUT') {
        if (prev - qty < 0) throw new Error(`Cannot dispatch ${qty}. Only ${prev} units in stock.`);
        next = prev - qty;
      } else if (type === 'ADJUSTMENT') {
        next = qty;
      }
      p.quantity = next;
      const mov = {
        id: `mov-${Date.now()}`,
        productId: p.id,
        type,
        quantity: type === 'ADJUSTMENT' ? (next - prev) : qty,
        previousQuantity: prev,
        newQuantity: next,
        reference: reference ? reference.trim() : `TX-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        notes: notes ? notes.trim() : ''
      };
      this.movements.unshift(mov);
      this.notify('PRODUCTS_CHANGED');
      this.notify('MOVEMENTS_CHANGED');
      this.notify('STATE_CHANGED');
      return { product: p, movement: mov };
    }

    addSupplier(data) {
      const s = {
        id: `sup-${Date.now()}`,
        name: data.name.trim(),
        contactPerson: data.contactPerson.trim(),
        email: (data.email || '').trim(),
        phone: (data.phone || '').trim(),
        status: data.status || 'Active'
      };
      this.suppliers.unshift(s);
      this.notify('SUPPLIERS_CHANGED');
      this.notify('STATE_CHANGED');
      return s;
    }

    updateSupplier(id, data) {
      const i = this.suppliers.findIndex(s => s.id === id);
      if (i === -1) throw new Error('Supplier not found');
      const s = { ...this.suppliers[i], ...data };
      this.suppliers[i] = s;
      this.notify('SUPPLIERS_CHANGED');
      this.notify('STATE_CHANGED');
      return s;
    }

    deleteSupplier(id) {
      const i = this.suppliers.findIndex(s => s.id === id);
      if (i === -1) throw new Error('Supplier not found');
      const r = this.suppliers.splice(i, 1)[0];
      this.notify('SUPPLIERS_CHANGED');
      this.notify('STATE_CHANGED');
      return r;
    }

    updateSettings(s) {
      this.settings = { ...this.settings, ...s };
      this.notify('SETTINGS_CHANGED');
      this.notify('STATE_CHANGED');
    }

    resetToMockData() {
      this.products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
      this.suppliers = JSON.parse(JSON.stringify(INITIAL_SUPPLIERS));
      this.movements = JSON.parse(JSON.stringify(INITIAL_MOVEMENTS));
      this.notify('STATE_CHANGED');
    }
  }

  const state = new AppState();

  // ---------------------------------------------------------------------------
  // 5. TOAST & MODAL NOTIFICATION MANAGERS
  // ---------------------------------------------------------------------------
  class ToastManager {
    constructor() {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
    show({ title, message, type = 'info' }) {
      const t = document.createElement('div');
      t.className = `toast toast-${type}`;
      let ico = 'info';
      if (type === 'success') ico = 'checkCircle';
      if (type === 'warning') ico = 'alertTriangle';
      if (type === 'danger') ico = 'x';
      t.innerHTML = `
        <div class="toast-icon">${getIcon(ico)}</div>
        <div class="toast-content">
          ${title ? `<div class="toast-title">${title}</div>` : ''}
          <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">${getIcon('x')}</button>
      `;
      t.querySelector('.toast-close').onclick = () => this.dismiss(t);
      this.container.appendChild(t);
      setTimeout(() => this.dismiss(t), 3500);
    }
    dismiss(t) {
      t.style.opacity = '0';
      t.style.transform = 'translateY(10px)';
      setTimeout(() => { if (t.parentElement) t.parentElement.removeChild(t); }, 200);
    }
    success(m, title = 'Success') { this.show({ type: 'success', title, message: m }); }
    warning(m, title = 'Warning') { this.show({ type: 'warning', title, message: m }); }
    danger(m, title = 'Error') { this.show({ type: 'danger', title, message: m }); }
  }

  const toast = new ToastManager();

  class ModalManager {
    constructor() {
      this.overlay = document.createElement('div');
      this.overlay.className = 'modal-overlay';
      this.overlay.innerHTML = `
        <div class="modal-container" role="dialog">
          <div class="modal-header">
            <h3 class="modal-title"></h3>
            <button class="btn btn-ghost btn-icon-only modal-close-btn">${getIcon('x')}</button>
          </div>
          <div class="modal-body"></div>
          <div class="modal-footer"></div>
        </div>
      `;
      document.body.appendChild(this.overlay);
      this.overlay.querySelector('.modal-close-btn').onclick = () => this.close();
      this.overlay.onclick = (e) => { if (e.target === this.overlay) this.close(); };
    }
    open({ title, body, footer, maxWidth = '560px' }) {
      this.overlay.querySelector('.modal-title').textContent = title || '';
      this.overlay.querySelector('.modal-container').style.maxWidth = maxWidth;
      this.overlay.querySelector('.modal-body').innerHTML = typeof body === 'string' ? body : '';
      this.overlay.querySelector('.modal-footer').innerHTML = typeof footer === 'string' ? footer : '';
      this.overlay.classList.add('open');
    }
    close() { this.overlay.classList.remove('open'); }
    confirm({ title, message, confirmText = 'Confirm', isDanger = false, onConfirm }) {
      this.open({
        title,
        body: `<p style="font-size:14px;color:var(--text-secondary);line-height:1.5;">${message}</p>`,
        footer: `
          <button class="btn btn-secondary modal-cancel-btn">Cancel</button>
          <button class="btn ${isDanger ? 'btn-danger' : 'btn-primary'} modal-confirm-btn">${confirmText}</button>
        `,
        maxWidth: '460px'
      });
      this.overlay.querySelector('.modal-cancel-btn').onclick = () => this.close();
      this.overlay.querySelector('.modal-confirm-btn').onclick = () => {
        this.close();
        if (onConfirm) onConfirm();
      };
    }
  }

  const modal = new ModalManager();

  function renderStockBadge(status) {
    if (status === 'IN_STOCK') return `<span class="badge badge-success"><span class="badge-dot"></span>In Stock</span>`;
    if (status === 'LOW_STOCK') return `<span class="badge badge-warning"><span class="badge-dot"></span>Low Stock</span>`;
    return `<span class="badge badge-danger"><span class="badge-dot"></span>Out of Stock</span>`;
  }

  function renderMovementBadge(type) {
    if (type === 'IN') return `<span class="movement-type-tag movement-type-in">STOCK IN</span>`;
    if (type === 'OUT') return `<span class="movement-type-tag movement-type-out">STOCK OUT</span>`;
    return `<span class="movement-type-tag movement-type-adjustment">ADJUSTMENT</span>`;
  }

  // ---------------------------------------------------------------------------
  // 6. REUSABLE DATA TABLE
  // ---------------------------------------------------------------------------
  class DataTable {
    constructor({ columns, data, pageSize = 10, emptyMessage = 'No records found' }) {
      this.columns = columns;
      this.data = [...data];
      this.filteredData = [...data];
      this.pageSize = pageSize;
      this.currentPage = 1;
      this.sortKey = null;
      this.sortDirection = 'asc';
      this.emptyMessage = emptyMessage;
    }
    setData(d) { this.data = [...d]; this.applySort(); }
    setFilter(fn) {
      this.filteredData = fn ? this.data.filter(fn) : [...this.data];
      this.currentPage = 1;
      this.applySort();
    }
    sortBy(key) {
      if (this.sortKey === key) this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      else { this.sortKey = key; this.sortDirection = 'asc'; }
      this.applySort();
    }
    applySort() {
      if (!this.sortKey) return;
      this.filteredData.sort((a, b) => {
        let va = a[this.sortKey], vb = b[this.sortKey];
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
        if (va < vb) return this.sortDirection === 'asc' ? -1 : 1;
        if (va > vb) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    render(container, onAction) {
      const totalPages = Math.max(1, Math.ceil(this.filteredData.length / this.pageSize));
      const start = (this.currentPage - 1) * this.pageSize;
      const pageData = this.filteredData.slice(start, start + this.pageSize);
      const total = this.filteredData.length;

      let html = `
        <div class="card">
          <div class="card-inner">
            <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  ${this.columns.map(col => `
                    <th class="${col.sortable ? 'sortable' : ''} ${col.align === 'right' ? 'num' : ''}" data-key="${col.key}">
                      <div class="th-content">
                        <span>${col.label}</span>
                        ${col.sortable && this.sortKey === col.key ? `<span style="font-size:10px;margin-left:2px;">${this.sortDirection === 'asc' ? '↑' : '↓'}</span>` : ''}
                      </div>
                    </th>
                  `).join('')}
                </tr>
              </thead>
              <tbody>
      `;
      if (pageData.length === 0) {
        html += `
          <tr>
            <td colspan="${this.columns.length}" style="text-align:center;padding:48px 16px;">
              <div class="empty-state">
                <div class="empty-state-icon">${getIcon('search')}</div>
                <div class="empty-state-title">${this.emptyMessage}</div>
              </div>
            </td>
          </tr>
        `;
      } else {
        html += pageData.map(row => `
          <tr data-id="${row.id}">
            ${this.columns.map(col => `
              <td class="${col.align === 'right' ? 'num' : ''} ${col.mono ? 'mono' : ''}">
                ${col.render ? col.render(row[col.key], row) : (row[col.key] !== undefined ? row[col.key] : '—')}
              </td>
            `).join('')}
          </tr>
        `).join('');
      }
      html += `
              </tbody>
            </table>
          </div>
          <div class="table-pagination">
            <div>Showing <strong>${total ? start + 1 : 0}</strong> - <strong>${Math.min(start + this.pageSize, total)}</strong> of <strong>${total}</strong> entries</div>
            <div class="pagination-controls">
              <button class="btn btn-secondary btn-sm prev-page" ${this.currentPage <= 1 ? 'disabled' : ''}>${getIcon('chevronLeft')} Previous</button>
              <span style="font-weight:500;">Page ${this.currentPage} of ${totalPages}</span>
              <button class="btn btn-secondary btn-sm next-page" ${this.currentPage >= totalPages ? 'disabled' : ''}>Next ${getIcon('chevronRight')}</button>
            </div>
          </div>
          </div>
        </div>
      `;
      container.innerHTML = html;

      container.querySelectorAll('th.sortable').forEach(th => {
        th.onclick = () => { this.sortBy(th.getAttribute('data-key')); this.render(container, onAction); };
      });
      const pBtn = container.querySelector('.prev-page');
      if (pBtn && !pBtn.disabled) pBtn.onclick = () => { this.currentPage--; this.render(container, onAction); };
      const nBtn = container.querySelector('.next-page');
      if (nBtn && !nBtn.disabled) nBtn.onclick = () => { this.currentPage++; this.render(container, onAction); };

      if (onAction) {
        container.querySelectorAll('[data-action]').forEach(btn => {
          btn.onclick = (e) => {
            const act = btn.getAttribute('data-action');
            const id = btn.getAttribute('data-id');
            const item = this.data.find(d => d.id === id) || id;
            onAction(act, item, e);
          };
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 7. MODAL FORMS: PRODUCT, MOVEMENT, SUPPLIER
  // ---------------------------------------------------------------------------
  function openProductForm(prod = null, onSaved = null) {
    const isEdit = !!prod;
    const cats = ['Electronics', 'Stationery', 'Accessories', 'Office Supplies', 'Storage'];
    modal.open({
      title: isEdit ? `Edit Product: ${prod.name}` : 'Add New Product',
      body: `
        <form id="p-form" class="form-grid">
          <div class="form-group form-full">
            <label class="form-label required">Product Name</label>
            <input type="text" name="name" class="form-input" value="${prod ? prod.name : ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label required">SKU Code</label>
            <input type="text" name="sku" class="form-input" value="${prod ? prod.sku : ''}" style="text-transform:uppercase;" required>
          </div>
          <div class="form-group">
            <label class="form-label required">Category</label>
            <select name="category" class="form-select">
              ${cats.map(c => `<option value="${c}" ${prod && prod.category === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Price (${state.settings.currency})</label>
            <input type="number" step="0.01" min="0" name="price" class="form-input" value="${prod ? prod.price : ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label required">Quantity</label>
            <input type="number" step="1" min="0" name="quantity" class="form-input" value="${prod ? prod.quantity : 0}" required>
          </div>
          <div class="form-group">
            <label class="form-label required">Safety Minimum</label>
            <input type="number" step="1" min="0" name="minimumStock" class="form-input" value="${prod ? prod.minimumStock : 10}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Primary Supplier</label>
            <select name="supplierId" class="form-select">
              <option value="">-- None --</option>
              ${state.suppliers.map(s => `<option value="${s.id}" ${prod && prod.supplierId === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group form-full">
            <label class="form-label">Description</label>
            <textarea name="description" class="form-textarea">${prod ? prod.description || '' : ''}</textarea>
          </div>
        </form>
      `,
      footer: `
        <button class="btn btn-secondary modal-cancel">Cancel</button>
        <button class="btn btn-primary" id="save-p-btn">${isEdit ? 'Save Changes' : 'Create Product'}</button>
      `
    });
    modal.overlay.querySelector('.modal-cancel').onclick = () => modal.close();
    document.getElementById('save-p-btn').onclick = () => {
      const f = document.getElementById('p-form');
      const d = {
        name: f.name.value.trim(),
        sku: f.sku.value.trim().toUpperCase(),
        category: f.category.value,
        price: Number(f.price.value),
        quantity: Number(f.quantity.value),
        minimumStock: Number(f.minimumStock.value),
        supplierId: f.supplierId.value || null,
        description: f.description.value.trim()
      };
      if (!d.name || !d.sku || isNaN(d.price)) {
        toast.danger('Please fill out all required fields properly.');
        return;
      }
      try {
        if (isEdit) { state.updateProduct(prod.id, d); toast.success(`Product ${d.name} updated.`); }
        else { state.addProduct(d); toast.success(`Product ${d.name} created.`); }
        modal.close();
        if (onSaved) onSaved();
      } catch (err) { toast.danger(err.message); }
    };
  }

  function openMovementForm(defaultType = 'IN', defaultProdId = null, onSaved = null) {
    modal.open({
      title: defaultType === 'IN' ? 'Record Stock In' : (defaultType === 'OUT' ? 'Record Stock Out' : 'Record Stock Adjustment'),
      body: `
        <form id="m-form" class="form-grid">
          <div class="form-group form-full">
            <label class="form-label required">Transaction Type</label>
            <select name="type" class="form-select">
              <option value="IN" ${defaultType === 'IN' ? 'selected' : ''}>Stock In (Receipt)</option>
              <option value="OUT" ${defaultType === 'OUT' ? 'selected' : ''}>Stock Out (Dispatch)</option>
              <option value="ADJUSTMENT" ${defaultType === 'ADJUSTMENT' ? 'selected' : ''}>Stock Adjustment</option>
            </select>
          </div>
          <div class="form-group form-full">
            <label class="form-label required">Product</label>
            <select name="productId" class="form-select" required>
              <option value="">-- Choose Product --</option>
              ${state.products.map(p => `<option value="${p.id}" ${defaultProdId === p.id ? 'selected' : ''}>${p.name} (${p.sku}) &bull; Current: ${p.quantity} units</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Quantity</label>
            <input type="number" step="1" min="1" name="quantity" class="form-input" placeholder="e.g. 10" required>
          </div>
          <div class="form-group">
            <label class="form-label">Reference ID</label>
            <input type="text" name="reference" class="form-input" placeholder="e.g. PO-2026-105">
          </div>
          <div class="form-group form-full">
            <label class="form-label">Notes</label>
            <textarea name="notes" class="form-textarea" placeholder="Reason for inventory change..."></textarea>
          </div>
        </form>
      `,
      footer: `
        <button class="btn btn-secondary modal-cancel">Cancel</button>
        <button class="btn btn-primary" id="save-m-btn">Confirm Transaction</button>
      `
    });
    modal.overlay.querySelector('.modal-cancel').onclick = () => modal.close();
    document.getElementById('save-m-btn').onclick = () => {
      const f = document.getElementById('m-form');
      try {
        const res = state.recordStockMovement({
          productId: f.productId.value,
          type: f.type.value,
          quantity: Number(f.quantity.value),
          reference: f.reference.value,
          notes: f.notes.value
        });
        toast.success(`Recorded ${f.type.value} for ${res.product.name}. New total: ${res.product.quantity} units.`);
        modal.close();
        if (onSaved) onSaved();
      } catch (err) { toast.danger(err.message); }
    };
  }

  function openSupplierForm(sup = null, onSaved = null) {
    const isEdit = !!sup;
    modal.open({
      title: isEdit ? `Edit Supplier: ${sup.name}` : 'Add New Supplier',
      body: `
        <form id="s-form" class="form-grid">
          <div class="form-group form-full">
            <label class="form-label required">Company Name</label>
            <input type="text" name="name" class="form-input" value="${sup ? sup.name : ''}" required>
          </div>
          <div class="form-group form-full">
            <label class="form-label required">Contact Person</label>
            <input type="text" name="contactPerson" class="form-input" value="${sup ? sup.contactPerson : ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" name="email" class="form-input" value="${sup ? sup.email : ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input type="text" name="phone" class="form-input" value="${sup ? sup.phone : ''}">
          </div>
        </form>
      `,
      footer: `
        <button class="btn btn-secondary modal-cancel">Cancel</button>
        <button class="btn btn-primary" id="save-s-btn">${isEdit ? 'Save Changes' : 'Create Supplier'}</button>
      `
    });
    modal.overlay.querySelector('.modal-cancel').onclick = () => modal.close();
    document.getElementById('save-s-btn').onclick = () => {
      const f = document.getElementById('s-form');
      const d = {
        name: f.name.value.trim(),
        contactPerson: f.contactPerson.value.trim(),
        email: f.email.value.trim(),
        phone: f.phone.value.trim()
      };
      if (!d.name || !d.contactPerson) { toast.danger('Name and contact person required'); return; }
      try {
        if (isEdit) { state.updateSupplier(sup.id, d); toast.success(`Supplier ${d.name} updated.`); }
        else { state.addSupplier(d); toast.success(`Supplier ${d.name} registered.`); }
        modal.close();
        if (onSaved) onSaved();
      } catch (e) { toast.danger(e.message); }
    };
  }

  // ---------------------------------------------------------------------------
  // 8. PAGE RENDERERS
  // ---------------------------------------------------------------------------
  function renderDashboard(c) {
    const totalProd = state.products.length;
    const totalUnits = state.calculateTotalUnits();
    const invVal = state.calculateInventoryValue();
    const lowItems = state.getLowStockProducts();
    const outItems = state.getOutOfStockProducts();
    const catDist = state.calculateCategoryDistribution();
    const statusDist = state.calculateStockStatusDistribution();
    const recent = state.movements.slice(0, 6);

    c.innerHTML = `
      <!-- Page Header with Microscopic Eyebrow and Island Action Pills -->
      <div class="page-header">
        <div class="page-title-group">
          <span class="eyebrow-tag eyebrow-tag-blue">
            ${getIcon('boxes')} Real-Time Inventory Mesh
          </span>
          <h1 class="page-title">Enterprise Dashboard</h1>
          <p class="page-description">Automated valuation, multi-tier SKU tracking, and inventory health telemetry.</p>
        </div>
        <div class="page-actions">
          <button class="btn-pill btn-pill-secondary" id="dash-in">
            <span class="btn-icon-bubble">${getIcon('arrowDownLeft')}</span>
            Record Stock In
          </button>
          <button class="btn-pill btn-pill-secondary" id="dash-out">
            <span class="btn-icon-bubble">${getIcon('arrowUpRight')}</span>
            Record Stock Out
          </button>
          <button class="btn-pill btn-pill-primary" id="dash-add">
            <span class="btn-icon-bubble">${getIcon('plus')}</span>
            Add Product
          </button>
        </div>
      </div>

      <!-- Quick Action Cards Bar -->
      <div class="quick-actions-bar">
        <div class="quick-action-card" id="qa-add-product">
          <div class="quick-action-icon">${getIcon('package')}</div>
          <div>
            <div class="quick-action-title">Add Product</div>
            <div class="quick-action-desc">Register new catalog SKU & minimum threshold</div>
          </div>
        </div>
        <div class="quick-action-card" id="qa-stock-in">
          <div class="quick-action-icon" style="background-color: var(--color-success-bg); color: var(--color-success);">${getIcon('arrowDownLeft')}</div>
          <div>
            <div class="quick-action-title">Receive Inventory</div>
            <div class="quick-action-desc">Log vendor shipments & stock inbound</div>
          </div>
        </div>
        <div class="quick-action-card" id="qa-stock-out">
          <div class="quick-action-icon" style="background-color: var(--color-danger-bg); color: var(--color-danger);">${getIcon('arrowUpRight')}</div>
          <div>
            <div class="quick-action-title">Dispatch Stock</div>
            <div class="quick-action-desc">Fulfill customer orders & internal usage</div>
          </div>
        </div>
        <div class="quick-action-card" id="qa-view-inventory">
          <div class="quick-action-icon" style="background-color: var(--color-warning-bg); color: var(--color-warning);">${getIcon('alertTriangle')}</div>
          <div>
            <div class="quick-action-title">${lowItems.length + outItems.length} Reorder Alerts</div>
            <div class="quick-action-desc">Review safety thresholds & shortages</div>
          </div>
        </div>
      </div>

      <!-- KPI Summary Metrics Grid (Double-Bezel Architecture) -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-card-inner">
            <div class="metric-info">
              <span class="metric-label">Catalog SKUs</span>
              <span class="metric-value">${formatNumber(totalProd)}</span>
              <span class="metric-meta">Active product lines</span>
            </div>
            <div class="metric-icon-box metric-icon-blue">${getIcon('package')}</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-card-inner">
            <div class="metric-info">
              <span class="metric-label">Total Units</span>
              <span class="metric-value">${formatNumber(totalUnits)}</span>
              <span class="metric-meta">Across all categories</span>
            </div>
            <div class="metric-icon-box metric-icon-purple">${getIcon('boxes')}</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-card-inner">
            <div class="metric-info">
              <span class="metric-label">Valuation</span>
              <span class="metric-value">${formatCurrency(invVal, state.settings.currency)}</span>
              <span class="metric-meta">Valued at unit cost</span>
            </div>
            <div class="metric-icon-box metric-icon-green">${getIcon('dollarSign')}</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-card-inner">
            <div class="metric-info">
              <span class="metric-label">Low Stock</span>
              <span class="metric-value" style="color:var(--color-warning);">${formatNumber(lowItems.length)}</span>
              <span class="metric-meta">Below safety limit</span>
            </div>
            <div class="metric-icon-box metric-icon-amber">${getIcon('alertTriangle')}</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-card-inner">
            <div class="metric-info">
              <span class="metric-label">Out of Stock</span>
              <span class="metric-value" style="color:var(--color-danger);">${formatNumber(outItems.length)}</span>
              <span class="metric-meta">0 units available</span>
            </div>
            <div class="metric-icon-box metric-icon-red">${getIcon('x')}</div>
          </div>
        </div>
      </div>

      <!-- Charts and Overview Section (Double-Bezel) -->
      <div class="dashboard-grid">
        <!-- Category Valuation Breakdown -->
        <div class="card">
          <div class="card-inner">
            <div class="card-header">
              <div class="card-title-group">
                <h2 class="card-title">Inventory Valuation by Category</h2>
                <span class="card-subtitle">Distribution of stock capital and item volume</span>
              </div>
              <span class="badge badge-neutral">${Object.keys(catDist).length} Categories</span>
            </div>
            <div class="card-body">
              <div style="display:flex;flex-direction:column;gap:18px;">
                ${Object.entries(catDist).map(([cat, d]) => {
                  const pct = invVal > 0 ? ((d.value / invVal) * 100).toFixed(1) : 0;
                  return `
                    <div class="category-stat-row">
                      <div class="category-stat-header">
                        <span class="category-stat-title">${cat}</span>
                        <span class="category-stat-meta">${formatCurrency(d.value, state.settings.currency)} &bull; ${pct}% &bull; ${d.units} units</span>
                      </div>
                      <div class="category-progress-track">
                        <div class="category-progress-fill" style="width:${pct}%;"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- Stock Health Status Breakdown -->
        <div class="card">
          <div class="card-inner">
            <div class="card-header">
              <div class="card-title-group">
                <h2 class="card-title">Stock Health Breakdown</h2>
                <span class="card-subtitle">Safety threshold distribution</span>
              </div>
              <span class="badge badge-success">Telemetry Live</span>
            </div>
            <div class="card-body">
              <div class="chart-container">
                ${renderHealthDonut(statusDist, totalProd)}
              </div>
              <div class="chart-legend">
                <div class="legend-item">
                  <span class="legend-color-box" style="background:var(--color-success);"></span>
                  <span>In Stock (${statusDist.IN_STOCK})</span>
                </div>
                <div class="legend-item">
                  <span class="legend-color-box" style="background:var(--color-warning);"></span>
                  <span>Low Stock (${statusDist.LOW_STOCK})</span>
                </div>
                <div class="legend-item">
                  <span class="legend-color-box" style="background:var(--color-danger);"></span>
                  <span>Out of Stock (${statusDist.OUT_OF_STOCK})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Grids: Low-Stock Attention & Recent Activity -->
      <div class="dashboard-grid">
        <!-- Low Stock Attention Table (Double-Bezel) -->
        <div class="card">
          <div class="card-inner">
            <div class="card-header">
              <div class="card-title-group">
                <h2 class="card-title">Products Requiring Attention</h2>
                <span class="card-subtitle">Items at or below safety limit</span>
              </div>
              <a href="#/inventory" class="btn btn-secondary btn-sm">View in Inventory</a>
            </div>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr><th>Product / SKU</th><th>Category</th><th class="num">Current</th><th class="num">Target</th><th>Status</th></tr>
                </thead>
                <tbody>
                  ${[...outItems, ...lowItems].slice(0, 5).map(p => `
                    <tr>
                      <td><strong>${p.name}</strong><div class="mono" style="font-size:11px;color:var(--text-secondary);">${p.sku}</div></td>
                      <td>${p.category}</td>
                      <td class="num" style="font-weight:700;">${p.quantity}</td>
                      <td class="num mono">${p.minimumStock}</td>
                      <td>${renderStockBadge(state.getStockStatus(p))}</td>
                    </tr>
                  `).join('')}
                  ${(outItems.length + lowItems.length) === 0 ? `
                    <tr><td colspan="5" style="text-align:center;color:var(--text-secondary);padding:32px;">All items are well stocked above safety limits.</td></tr>
                  ` : ''}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Recent Stock Activity (Double-Bezel) -->
        <div class="card">
          <div class="card-inner">
            <div class="card-header">
              <div class="card-title-group">
                <h2 class="card-title">Recent Stock Activity</h2>
                <span class="card-subtitle">Latest fulfillment and receipts</span>
              </div>
              <a href="#/movements" class="btn btn-secondary btn-sm">Audit Log</a>
            </div>
            <div class="card-body">
              <div class="activity-list">
                ${recent.map(m => {
                  const prod = state.products.find(p => p.id === m.productId) || { name: 'Product' };
                  const sign = m.type === 'IN' ? '+' : (m.type === 'OUT' ? '-' : '');
                  return `
                    <div class="activity-item">
                      <div class="activity-left">
                        <div class="activity-badge ${m.type.toLowerCase()}">${m.type}</div>
                        <div>
                          <div class="activity-title">${prod.name}</div>
                          <div class="activity-meta">${formatDate(m.date)} &bull; Ref: ${m.reference}</div>
                        </div>
                      </div>
                      <div class="activity-qty ${m.type.toLowerCase()}">${sign}${Math.abs(m.quantity)}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    c.querySelector('#dash-in').onclick = () => openMovementForm('IN', null, () => renderDashboard(c));
    c.querySelector('#dash-out').onclick = () => openMovementForm('OUT', null, () => renderDashboard(c));
    c.querySelector('#dash-add').onclick = () => openProductForm(null, () => renderDashboard(c));

    const qaAdd = c.querySelector('#qa-add-product');
    const qaIn = c.querySelector('#qa-stock-in');
    const qaOut = c.querySelector('#qa-stock-out');
    const qaInv = c.querySelector('#qa-view-inventory');
    if (qaAdd) qaAdd.onclick = () => openProductForm(null, () => renderDashboard(c));
    if (qaIn) qaIn.onclick = () => openMovementForm('IN', null, () => renderDashboard(c));
    if (qaOut) qaOut.onclick = () => openMovementForm('OUT', null, () => renderDashboard(c));
    if (qaInv) qaInv.onclick = () => { window.location.hash = '#/inventory'; };
  }

  function renderHealthDonut(dist, total) {
    if (total === 0) return '<div>No inventory data available</div>';
    const inStockPct = Math.round((dist.IN_STOCK / total) * 100);
    const lowStockPct = Math.round((dist.LOW_STOCK / total) * 100);
    const outOfStockPct = 100 - inStockPct - lowStockPct;

    return `
      <div style="position:relative;width:140px;height:140px;display:flex;align-items:center;justify-content:center;">
        <svg width="140" height="140" viewBox="0 0 42 42" class="donut" style="transform:rotate(-90deg);">
          <circle class="donut-hole" cx="21" cy="21" r="15.915" fill="transparent"></circle>
          <circle class="donut-ring" cx="21" cy="21" r="15.915" fill="transparent" stroke="rgba(255, 255, 255, 0.08)" stroke-width="4.5"></circle>
          <circle class="donut-segment" cx="21" cy="21" r="15.915" fill="transparent" stroke="#10B981" stroke-width="4.5" stroke-dasharray="${inStockPct} ${100 - inStockPct}" stroke-dashoffset="0"></circle>
          <circle class="donut-segment" cx="21" cy="21" r="15.915" fill="transparent" stroke="#F59E0B" stroke-width="4.5" stroke-dasharray="${lowStockPct} ${100 - lowStockPct}" stroke-dashoffset="${-inStockPct}"></circle>
          <circle class="donut-segment" cx="21" cy="21" r="15.915" fill="transparent" stroke="#EF4444" stroke-width="4.5" stroke-dasharray="${outOfStockPct} ${100 - outOfStockPct}" stroke-dashoffset="${-(inStockPct + lowStockPct)}"></circle>
        </svg>
        <div style="position:absolute;text-align:center;">
          <span style="font-size:26px;font-weight:800;font-family:var(--font-mono);color:#FFFFFF;letter-spacing:-0.02em;">${inStockPct}%</span>
          <div style="font-size:9px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.12em;margin-top:2px;">Optimal Ratio</div>
        </div>
      </div>
    `;
  }

  function renderProducts(c) {
    c.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <span class="eyebrow-tag eyebrow-tag-blue">${getIcon('package')} Master SKU Catalog</span>
          <h1 class="page-title">Products Management</h1>
          <p class="page-description">Maintain master product catalog, specifications, and SKU attributes.</p>
        </div>
        <div class="page-actions">
          <button class="btn-pill btn-pill-primary" id="p-add-btn">
            <span class="btn-icon-bubble">${getIcon('plus')}</span>
            Add Product
          </button>
        </div>
      </div>
      <div class="filter-bar">
        <div class="filter-group">
          <div class="search-input-wrapper">
            <span class="search-icon">${getIcon('search')}</span>
            <input type="text" class="form-input" id="p-search" placeholder="Search product name or SKU...">
          </div>
          <select class="form-select" id="p-cat-filter" style="width:170px;">
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Stationery">Stationery</option>
            <option value="Accessories">Accessories</option>
            <option value="Office Supplies">Office Supplies</option>
            <option value="Storage">Storage</option>
          </select>
          <select class="form-select" id="p-status-filter" style="width:160px;">
            <option value="">All Statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>
      </div>
      <div id="p-table-wrap"></div>
    `;

    const cols = [
      {
        key: 'name',
        label: 'Product Details',
        sortable: true,
        render: (val, r) => `<div class="product-name-cell"><span class="product-name-title">${val}</span><span class="product-name-desc">${r.description || '—'}</span></div>`
      },
      { key: 'sku', label: 'SKU', sortable: true, mono: true },
      { key: 'category', label: 'Category', sortable: true },
      { key: 'price', label: 'Unit Price', sortable: true, align: 'right', render: v => formatCurrency(v, state.settings.currency) },
      { key: 'quantity', label: 'Available', sortable: true, align: 'right', render: v => `<strong>${formatNumber(v)}</strong>` },
      { key: 'minimumStock', label: 'Min Safety', sortable: true, align: 'right', mono: true },
      { key: 'status', label: 'Status', sortable: true, render: (_, r) => renderStockBadge(state.getStockStatus(r)) },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        render: (_, r) => `
          <div style="display:flex;gap:4px;justify-content:flex-end;">
            <button class="btn btn-secondary btn-sm btn-icon-only" data-action="edit" data-id="${r.id}" title="Edit">${getIcon('edit')}</button>
            <button class="btn btn-outline-danger btn-sm btn-icon-only" data-action="delete" data-id="${r.id}" title="Delete">${getIcon('trash')}</button>
          </div>
        `
      }
    ];

    const dt = new DataTable({ columns: cols, data: state.products, pageSize: 10 });
    const refresh = () => {
      const q = c.querySelector('#p-search').value.trim().toLowerCase();
      const cat = c.querySelector('#p-cat-filter').value;
      const st = c.querySelector('#p-status-filter').value;
      dt.setData(state.products);
      dt.setFilter(p => {
        const mQ = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
        const mC = !cat || p.category === cat;
        const mS = !st || state.getStockStatus(p) === st;
        return mQ && mC && mS;
      });
      dt.render(c.querySelector('#p-table-wrap'), (act, row) => {
        if (act === 'edit') openProductForm(row, refresh);
        if (act === 'delete') {
          modal.confirm({
            title: 'Delete Product',
            message: `Permanently delete <strong>${row.name}</strong> (${row.sku})?`,
            confirmText: 'Delete',
            isDanger: true,
            onConfirm: () => { state.deleteProduct(row.id); toast.success(`Removed ${row.name}`); refresh(); }
          });
        }
      });
    };
    refresh();
    c.querySelector('#p-search').oninput = refresh;
    c.querySelector('#p-cat-filter').onchange = refresh;
    c.querySelector('#p-status-filter').onchange = refresh;
    c.querySelector('#p-add-btn').onclick = () => openProductForm(null, refresh);
  }

  function renderInventory(c) {
    c.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <span class="eyebrow-tag eyebrow-tag-emerald">${getIcon('boxes')} Real-Time Telemetry</span>
          <h1 class="page-title">Live Inventory Tracking</h1>
          <p class="page-description">Monitor safety buffers, stock depletion rates, and physical warehouse counts.</p>
        </div>
        <div class="page-actions">
          <button class="btn-pill btn-pill-secondary" id="inv-in">
            <span class="btn-icon-bubble">${getIcon('arrowDownLeft')}</span> Quick Receive
          </button>
          <button class="btn-pill btn-pill-secondary" id="inv-out">
            <span class="btn-icon-bubble">${getIcon('arrowUpRight')}</span> Quick Dispatch
          </button>
          <button class="btn-pill btn-pill-primary" id="inv-adj">
            <span class="btn-icon-bubble">${getIcon('refreshCw')}</span> Audit Adjustment
          </button>
        </div>
      </div>
      <div class="filter-bar">
        <div class="search-input-wrapper">
          <span class="search-icon">${getIcon('search')}</span>
          <input type="text" class="form-input" id="inv-search" placeholder="Filter by product or SKU...">
        </div>
      </div>
      <div id="inv-table-wrap"></div>
    `;

    const cols = [
      { key: 'name', label: 'Product Item', sortable: true, render: (v, r) => `<div><strong>${v}</strong><div style="font-size:12px;color:var(--text-secondary);">${r.category}</div></div>` },
      { key: 'sku', label: 'SKU', sortable: true, mono: true },
      {
        key: 'quantity',
        label: 'Stock Health',
        sortable: true,
        render: (v, r) => {
          const ratio = Math.min(100, Math.round((v / (r.minimumStock * 2 || 20)) * 100));
          const st = state.getStockStatus(r);
          const colorClass = st === 'OUT_OF_STOCK' ? 'out-of-stock' : (st === 'LOW_STOCK' ? 'low-stock' : 'in-stock');
          return `
            <div>
              <div style="display:flex;justify-content:space-between;font-size:12px;"><span><strong>${v}</strong> units</span><span class="mono" style="color:var(--text-secondary);">Min: ${r.minimumStock}</span></div>
              <div class="stock-level-bar"><div class="stock-level-fill ${colorClass}" style="width:${ratio}%;"></div></div>
            </div>
          `;
        }
      },
      { key: 'price', label: 'Unit Cost', align: 'right', sortable: true, render: v => formatCurrency(v, state.settings.currency) },
      { key: 'totalVal', label: 'Valuation', align: 'right', sortable: true, render: (_, r) => formatCurrency(r.price * r.quantity, state.settings.currency) },
      { key: 'status', label: 'Status', sortable: true, render: (_, r) => renderStockBadge(state.getStockStatus(r)) },
      {
        key: 'actions',
        label: 'Fast Action',
        align: 'right',
        render: (_, r) => `
          <div style="display:flex;gap:4px;justify-content:flex-end;">
            <button class="btn btn-secondary btn-sm" data-action="quick-in" data-id="${r.id}">${getIcon('plus')} In</button>
            <button class="btn btn-secondary btn-sm" data-action="quick-out" data-id="${r.id}">${getIcon('arrowUpRight')} Out</button>
          </div>
        `
      }
    ];

    const dt = new DataTable({ columns: cols, data: state.products, pageSize: 10 });
    const refresh = () => {
      const q = c.querySelector('#inv-search').value.trim().toLowerCase();
      dt.setData(state.products);
      dt.setFilter(p => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
      dt.render(c.querySelector('#inv-table-wrap'), (act, row) => {
        if (act === 'quick-in') openMovementForm('IN', row.id, refresh);
        if (act === 'quick-out') openMovementForm('OUT', row.id, refresh);
      });
    };
    refresh();
    c.querySelector('#inv-search').oninput = refresh;
    c.querySelector('#inv-in').onclick = () => openMovementForm('IN', null, refresh);
    c.querySelector('#inv-out').onclick = () => openMovementForm('OUT', null, refresh);
    c.querySelector('#inv-adj').onclick = () => openMovementForm('ADJUSTMENT', null, refresh);
  }

  function renderMovements(c) {
    c.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <span class="eyebrow-tag eyebrow-tag-blue">${getIcon('movements')} Immutable Journal</span>
          <h1 class="page-title">Stock Movements & Audit Trail</h1>
          <p class="page-description">Chronological ledger of receipts, customer dispatches, and inventory corrections.</p>
        </div>
        <div class="page-actions">
          <button class="btn-pill btn-pill-secondary" id="m-in"><span class="btn-icon-bubble">${getIcon('arrowDownLeft')}</span> Stock In</button>
          <button class="btn-pill btn-pill-secondary" id="m-out"><span class="btn-icon-bubble">${getIcon('arrowUpRight')}</span> Stock Out</button>
          <button class="btn-pill btn-pill-primary" id="m-adj"><span class="btn-icon-bubble">${getIcon('refreshCw')}</span> Adjustment</button>
        </div>
      </div>
      <div id="m-table-wrap"></div>
    `;

    const cols = [
      { key: 'date', label: 'Timestamp', sortable: true, render: v => formatDate(v) },
      { key: 'reference', label: 'Reference ID', sortable: true, mono: true, render: v => `<strong>${v}</strong>` },
      {
        key: 'productId',
        label: 'Product / SKU',
        render: v => {
          const p = state.products.find(item => item.id === v) || { name: 'Product', sku: '—' };
          return `<div><strong>${p.name}</strong><div class="mono" style="font-size:11px;color:var(--text-secondary);">${p.sku}</div></div>`;
        }
      },
      { key: 'type', label: 'Type', sortable: true, render: v => renderMovementBadge(v) },
      {
        key: 'quantity',
        label: 'Delta',
        align: 'right',
        sortable: true,
        render: (v, r) => {
          const sign = r.type === 'IN' ? '+' : (r.type === 'OUT' ? '-' : '');
          const col = r.type === 'IN' ? 'var(--color-success)' : (r.type === 'OUT' ? 'var(--color-danger)' : 'var(--color-warning)');
          return `<strong style="color:${col};">${sign}${Math.abs(v)}</strong>`;
        }
      },
      { key: 'bal', label: 'Balance Before → After', align: 'right', mono: true, render: (_, r) => `${r.previousQuantity} → <strong>${r.newQuantity}</strong>` },
      { key: 'notes', label: 'Notes', render: v => `<span style="font-size:12px;color:var(--text-secondary);">${v || '—'}</span>` }
    ];

    const dt = new DataTable({ columns: cols, data: state.movements, pageSize: 10 });
    const refresh = () => dt.render(c.querySelector('#m-table-wrap'));
    refresh();

    c.querySelector('#m-in').onclick = () => openMovementForm('IN', null, refresh);
    c.querySelector('#m-out').onclick = () => openMovementForm('OUT', null, refresh);
    c.querySelector('#m-adj').onclick = () => openMovementForm('ADJUSTMENT', null, refresh);
  }

  function renderSuppliers(c) {
    c.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <span class="eyebrow-tag eyebrow-tag-blue">${getIcon('suppliers')} Vendor Ecosystem</span>
          <h1 class="page-title">Suppliers Directory</h1>
          <p class="page-description">Manage approved vendor partners, contact representatives, and supply accounts.</p>
        </div>
        <div class="page-actions">
          <button class="btn-pill btn-pill-primary" id="s-add-btn"><span class="btn-icon-bubble">${getIcon('plus')}</span> Add Supplier</button>
        </div>
      </div>
      <div id="s-table-wrap"></div>
    `;

    const cols = [
      { key: 'name', label: 'Supplier Organization', sortable: true, render: (v, r) => `<div><strong>${v}</strong><div class="mono" style="font-size:11px;color:var(--text-secondary);">${r.id}</div></div>` },
      { key: 'contactPerson', label: 'Contact Person', sortable: true, render: (v, r) => `<div>${v}<div style="font-size:12px;color:var(--text-secondary);">${r.email || '—'}</div></div>` },
      { key: 'phone', label: 'Phone', mono: true, render: v => v || '—' },
      { key: 'status', label: 'Status', render: v => `<span class="badge ${v === 'Active' ? 'badge-success' : 'badge-neutral'}">${v}</span>` },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        render: (_, r) => `
          <div style="display:flex;gap:4px;justify-content:flex-end;">
            <button class="btn btn-secondary btn-sm btn-icon-only" data-action="edit" data-id="${r.id}">${getIcon('edit')}</button>
            <button class="btn btn-outline-danger btn-sm btn-icon-only" data-action="delete" data-id="${r.id}">${getIcon('trash')}</button>
          </div>
        `
      }
    ];

    const dt = new DataTable({ columns: cols, data: state.suppliers, pageSize: 10 });
    const refresh = () => {
      dt.setData(state.suppliers);
      dt.render(c.querySelector('#s-table-wrap'), (act, row) => {
        if (act === 'edit') openSupplierForm(row, refresh);
        if (act === 'delete') {
          modal.confirm({
            title: 'Delete Supplier',
            message: `Remove <strong>${row.name}</strong> from vendor registry?`,
            confirmText: 'Delete',
            isDanger: true,
            onConfirm: () => { state.deleteSupplier(row.id); toast.success(`Removed ${row.name}`); refresh(); }
          });
        }
      });
    };
    refresh();
    c.querySelector('#s-add-btn').onclick = () => openSupplierForm(null, refresh);
  }

  function renderReports(c) {
    const totalVal = state.calculateInventoryValue();
    const catDist = state.calculateCategoryDistribution();
    const lowStock = [...state.getOutOfStockProducts(), ...state.getLowStockProducts()];

    c.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <span class="eyebrow-tag eyebrow-tag-blue">${getIcon('reports')} Financial Intelligence</span>
          <h1 class="page-title">Inventory Reports & Analytics</h1>
          <p class="page-description">Exportable financial auditing, asset valuation, and stock replenishment metrics.</p>
        </div>
        <div class="page-actions">
          <button class="btn-pill btn-pill-secondary" id="exp-mov"><span class="btn-icon-bubble">${getIcon('download')}</span> Export Movements CSV</button>
          <button class="btn-pill btn-pill-primary" id="exp-inv"><span class="btn-icon-bubble">${getIcon('download')}</span> Export Inventory CSV</button>
        </div>
      </div>

      <div class="card" style="margin-bottom:24px;">
        <div class="card-inner">
          <div class="card-header"><h2 class="card-title">Category Valuation & Asset Allocation</h2></div>
          <div class="table-responsive">
            <table class="data-table">
              <thead><tr><th>Category</th><th class="num">SKU Count</th><th class="num">Total Units</th><th class="num">Valuation</th><th class="num">Share</th></tr></thead>
              <tbody>
                ${Object.entries(catDist).map(([cat, d]) => {
                  const s = totalVal > 0 ? ((d.value / totalVal) * 100).toFixed(1) : 0;
                  return `<tr><td style="font-weight:600;">${cat}</td><td class="num">${d.count} SKUs</td><td class="num">${formatNumber(d.units)}</td><td class="num" style="font-weight:600;">${formatCurrency(d.value, state.settings.currency)}</td><td class="num mono">${s}%</td></tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-inner">
          <div class="card-header"><h2 class="card-title">Replenishment Priority Audit</h2></div>
          <div class="table-responsive">
            <table class="data-table">
              <thead><tr><th>SKU / Product</th><th>Category</th><th class="num">Current Stock</th><th class="num">Target Safety</th><th class="num">Recommended Order</th></tr></thead>
              <tbody>
                ${lowStock.map(p => {
                  const req = Math.max(p.minimumStock * 2 - p.quantity, p.minimumStock);
                  return `<tr><td><strong>${p.name}</strong><div class="mono" style="font-size:11px;color:var(--text-secondary);">${p.sku}</div></td><td>${p.category}</td><td class="num" style="color:${p.quantity === 0 ? 'var(--color-danger)' : 'var(--color-warning)'};font-weight:600;">${p.quantity}</td><td class="num mono">${p.minimumStock}</td><td class="num" style="font-weight:700;color:var(--accent-primary);">+${req} units</td></tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    c.querySelector('#exp-inv').onclick = () => {
      exportToCSV('StockFlow_Inventory', [
        { label: 'Name', key: 'name' },
        { label: 'SKU', key: 'sku' },
        { label: 'Category', key: 'category' },
        { label: 'Price', key: 'price' },
        { label: 'Quantity', key: 'quantity' },
        { label: 'MinStock', key: 'minimumStock' }
      ], state.products);
      toast.success('Inventory CSV exported.');
    };

    c.querySelector('#exp-mov').onclick = () => {
      exportToCSV('StockFlow_Movements', [
        { label: 'Timestamp', key: 'date' },
        { label: 'Reference', key: 'reference' },
        { label: 'Type', key: 'type' },
        { label: 'Quantity', key: 'quantity' },
        { label: 'Previous', key: 'previousQuantity' },
        { label: 'New', key: 'newQuantity' },
        { label: 'Notes', key: 'notes' }
      ], state.movements);
      toast.success('Movements CSV exported.');
    };
  }

  function renderSettings(c) {
    c.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <span class="eyebrow-tag eyebrow-tag-blue">${getIcon('settings')} System Configuration</span>
          <h1 class="page-title">System Settings</h1>
          <p class="page-description">Configure regional currency, safety thresholds, and demo dataset state.</p>
        </div>
        <div class="page-actions"><button class="btn-pill btn-pill-primary" id="save-set"><span class="btn-icon-bubble">${getIcon('checkCircle')}</span> Save Preferences</button></div>
      </div>

      <div class="settings-section">
        <div class="settings-section-inner">
          <div class="settings-row">
            <div class="settings-label-group"><label class="settings-label">Company Name</label></div>
            <div style="width:280px;"><input type="text" id="set-company" class="form-input" value="${state.settings.companyName}"></div>
          </div>
          <div class="settings-row">
            <div class="settings-label-group"><label class="settings-label">Display Currency</label></div>
            <div style="width:280px;">
              <select id="set-curr" class="form-select">
                <option value="USD" ${state.settings.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
                <option value="EUR" ${state.settings.currency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
                <option value="GBP" ${state.settings.currency === 'GBP' ? 'selected' : ''}>GBP (£)</option>
                <option value="INR" ${state.settings.currency === 'INR' ? 'selected' : ''}>INR (₹)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-section" style="border-color:rgba(220, 38, 38, 0.3);">
        <div class="settings-section-inner">
          <div class="settings-row">
            <div><strong style="color:var(--color-danger);">Reset Mock Data</strong><div class="settings-help">Restores all 22 products and original movement logs</div></div>
            <div><button class="btn btn-outline-danger" id="reset-data-btn">${getIcon('refreshCw')} Reset Data</button></div>
          </div>
        </div>
      </div>
    `;

    c.querySelector('#save-set').onclick = () => {
      state.updateSettings({
        companyName: c.querySelector('#set-company').value.trim(),
        currency: c.querySelector('#set-curr').value
      });
      toast.success('Settings saved.');
    };

    c.querySelector('#reset-data-btn').onclick = () => {
      modal.confirm({
        title: 'Reset Demo Data',
        message: 'Restore default 22 products and transactions?',
        confirmText: 'Reset',
        isDanger: true,
        onConfirm: () => { state.resetToMockData(); toast.success('Data restored.'); renderSettings(c); }
      });
    };
  }

  // ---------------------------------------------------------------------------
  // 9. CLIENT ROUTER & SHELL COMPONENT BINDING
  // ---------------------------------------------------------------------------
  const routes = {
    dashboard: { title: 'Dashboard', render: renderDashboard },
    products: { title: 'Products', render: renderProducts },
    inventory: { title: 'Inventory', render: renderInventory },
    movements: { title: 'Stock Movements', render: renderMovements },
    suppliers: { title: 'Suppliers', render: renderSuppliers },
    reports: { title: 'Reports', render: renderReports },
    settings: { title: 'Settings', render: renderSettings }
  };

  function initApp() {
    const sidebarEl = document.getElementById('sidebar-container');
    const topbarEl = document.getElementById('topbar-container');
    const mainEl = document.getElementById('main-content');
    const overlay = document.getElementById('sidebar-overlay');

    if (!sidebarEl || !topbarEl || !mainEl) return;

    // Render Sidebar (Obsidian Titanium with Live Pulse)
    const navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '#/dashboard' },
      { id: 'products', label: 'Products', icon: 'package', path: '#/products' },
      { id: 'inventory', label: 'Inventory', icon: 'boxes', path: '#/inventory' },
      { id: 'movements', label: 'Stock Movements', icon: 'movements', path: '#/movements' },
      { id: 'suppliers', label: 'Suppliers', icon: 'suppliers', path: '#/suppliers' },
      { id: 'reports', label: 'Reports', icon: 'reports', path: '#/reports' },
      { id: 'settings', label: 'Settings', icon: 'settings', path: '#/settings' }
    ];

    function updateSidebar() {
      const lowCount = state.getLowStockProducts().length + state.getOutOfStockProducts().length;
      const currentRoute = (window.location.hash.replace('#/', '') || 'dashboard').trim();

      sidebarEl.innerHTML = `
        <div class="sidebar-header">
          <div class="sidebar-brand">
            <div class="sidebar-brand-icon">${getIcon('boxes')}</div>
            <div class="sidebar-brand-text">
              <span class="sidebar-brand-title">StockFlow</span>
              <span class="sidebar-brand-tagline">ERP Inventory</span>
            </div>
          </div>
          <button class="sidebar-toggle-btn" id="s-toggle">${getIcon('collapse')}</button>
        </div>
        <nav class="sidebar-nav">
          <div class="nav-section-title">Navigation</div>
          <ul class="nav-list">
            ${navItems.map(item => `
              <li class="nav-item">
                <a href="${item.path}" class="nav-link ${currentRoute === item.id ? 'active' : ''}" data-route="${item.id}">
                  <span class="nav-link-icon">${getIcon(item.icon)}</span>
                  <span class="nav-link-title">${item.label}</span>
                  ${item.id === 'inventory' && lowCount > 0 ? `<span class="nav-badge">${lowCount}</span>` : ''}
                </a>
              </li>
            `).join('')}
          </ul>
        </nav>
        <div class="sidebar-footer">
          <div style="display:flex;align-items:center;gap:6px;font-weight:700;color:#F8FAFC;margin-bottom:2px;">
            <span style="width:6px;height:6px;border-radius:9999px;background:#10B981;box-shadow:0 0 8px #10B981;"></span>
            StockFlow v1.0.0
          </div>
          <div style="font-size:10px;color:#64748B;">Enterprise Edition &bull; Sem 3 AIML</div>
        </div>
      `;

      const tBtn = sidebarEl.querySelector('#s-toggle');
      if (tBtn) tBtn.onclick = () => document.body.classList.toggle('sidebar-collapsed');

      sidebarEl.querySelectorAll('.nav-link').forEach(l => {
        l.onclick = () => document.body.classList.remove('sidebar-mobile-open');
      });
    }

    // Render Floating Island Topbar
    function updateTopbar(title = 'Dashboard') {
      const low = state.getLowStockProducts().length + state.getOutOfStockProducts().length;
      topbarEl.innerHTML = `
        <div class="topbar-left">
          <button class="mobile-menu-btn" id="m-menu">${getIcon('menu')}</button>
          <div class="breadcrumbs">
            <span>StockFlow</span>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-current">${title}</span>
          </div>
        </div>
        <div class="topbar-search-container">
          <span class="topbar-search-icon">${getIcon('search')}</span>
          <input type="text" class="topbar-search-input" id="top-search" placeholder="Search product name or SKU..." autocomplete="off">
          <span class="topbar-search-shortcut">⌘K</span>
          <div class="topbar-search-dropdown" id="top-dropdown"></div>
        </div>
        <div class="topbar-right">
          <button class="topbar-icon-btn" id="top-alerts" title="${low} Low Stock Alerts">
            ${getIcon('bell')}
            ${low > 0 ? `<span class="notification-indicator"></span>` : ''}
          </button>
          <div class="user-profile-badge">
            <div class="user-avatar">AD</div>
            <div class="user-info">
              <span class="user-name">Inventory Admin</span>
              <span class="user-role">AIML Student (Sem 3)</span>
            </div>
          </div>
        </div>
      `;

      const mMenu = topbarEl.querySelector('#m-menu');
      if (mMenu) mMenu.onclick = () => document.body.classList.toggle('sidebar-mobile-open');

      const sIn = topbarEl.querySelector('#top-search');
      const sDrop = topbarEl.querySelector('#top-dropdown');
      if (sIn && sDrop) {
        sIn.oninput = () => {
          const q = sIn.value.trim().toLowerCase();
          if (!q) { sDrop.classList.remove('open'); return; }
          const m = state.products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 5);
          if (!m.length) sDrop.innerHTML = '<div style="padding:12px;font-size:12px;color:var(--text-muted);text-align:center;">No products found</div>';
          else {
            sDrop.innerHTML = m.map(p => `
              <div class="search-result-item" data-id="${p.id}">
                <div><div class="search-result-title">${p.name}</div><div class="search-result-sub">${p.sku} &bull; ${p.category}</div></div>
                <div><span class="badge ${p.quantity === 0 ? 'badge-danger' : 'badge-success'}">${p.quantity} units</span></div>
              </div>
            `).join('');
            sDrop.querySelectorAll('.search-result-item').forEach(it => {
              it.onclick = () => { sDrop.classList.remove('open'); sIn.value = ''; window.location.hash = '#/products'; };
            });
          }
          sDrop.classList.add('open');
        };
      }

      const aBtn = topbarEl.querySelector('#top-alerts');
      if (aBtn) {
        aBtn.onclick = () => { window.location.hash = '#/inventory'; };
      }
    }

    if (overlay) overlay.onclick = () => document.body.classList.remove('sidebar-mobile-open');

    // Routing Logic
    function route() {
      let h = window.location.hash.replace('#/', '').trim();
      if (!h || !routes[h]) { h = 'dashboard'; window.location.hash = '#/dashboard'; }
      const r = routes[h];
      updateSidebar();
      updateTopbar(r.title);
      mainEl.innerHTML = '';
      r.render(mainEl);
      window.scrollTo(0, 0);
    }

    window.addEventListener('hashchange', route);
    state.subscribe('STATE_CHANGED', () => {
      updateSidebar();
      const currentRoute = (window.location.hash.replace('#/', '') || 'dashboard').trim();
      const r = routes[currentRoute] || routes.dashboard;
      updateTopbar(r.title);
    });

    route();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
