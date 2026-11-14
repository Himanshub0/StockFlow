export const CURRENCIES = {
  INR: { code: 'INR', symbol: '₹', locale: 'en-IN', label: 'INR (₹) — Indian Rupee' }
};

export const BACKUP_SCHEDULES = [
  { value: 'daily_2200_close', label: 'Daily at 22:00 (store close)' },
  { value: 'hourly', label: 'Hourly incremental snapshot' },
  { value: 'weekly_sunday', label: 'Weekly on Sunday' },
  { value: 'manual_only', label: 'Manual snapshots only' }
];

export const DEFAULT_SETTINGS = {
  company_name: 'StockFlow Store',
  currency: 'INR',
  default_low_stock_threshold: '15',
  enable_realtime_alerts: 'true',
  items_per_page: '15',
  cluster_region: 'local-store',
  backup_schedule: 'daily_2200_close'
};

export const VALID_VIEWS = [
  'dashboard',
  'products',
  'movements',
  'alerts',
  'purchases',
  'sales',
  'suppliers',
  'reports',
  'team',
  'settings'
];

export const VIEW_META = {
  dashboard: ['Workspace', 'Dashboard', 'Urgent stock alerts, inventory valuation, and recent stock flow.'],
  products: ['Inventory', 'Products', 'Search, filter, paginate, and maintain your store SKU catalog.'],
  movements: ['Inventory', 'Stock movements', 'Audit every inbound, outbound, adjustment, and SKU transfer.'],
  alerts: ['Inventory', 'Stock alerts', 'Out-of-stock SKUs prioritized before low-stock items for restocking.'],
  purchases: ['Operations', 'Purchase orders', 'Create supplier replenishment orders and receive deliveries into stock.'],
  sales: ['Operations', 'Sales & billing', 'Issue customer invoices with live stock checks and ledger updates.'],
  suppliers: ['Operations', 'Suppliers', 'Manage sourcing partners, tiers, lead times, ratings, and contact details.'],
  reports: ['Insights', 'Reports', 'Live category valuation, sales revenue, purchase spend, and supplier tiers.'],
  team: ['Administration', 'Team & audit', 'Manage workspace accounts, roles, account status, and system audit logs.'],
  settings: ['Configuration', 'Settings', 'Store preferences, role-restricted system settings, and data tools.']
};

export const state = {
  user: null,
  settings: { ...DEFAULT_SETTINGS },
  view: 'dashboard',
  products: [],
  categories: [],
  productTotal: 0,
  productFilteredTotal: 0,
  productPage: 1,
  productSearch: '',
  productCategory: 'all',
  productStatus: 'all',
  suppliers: [],
  allSuppliers: [],
  supplierSearch: '',
  supplierTier: 'all',
  supplierStatus: 'all',
  movements: [],
  movementTotal: 0,
  movementFilteredTotal: 0,
  movementPage: 1,
  movementSearch: '',
  movementType: 'all',
  movementStartDate: '',
  movementEndDate: '',
  alerts: [],
  alertSearch: '',
  alertSeverity: 'all',
  alertCategory: 'all',
  purchaseOrders: [],
  poTotal: 0,
  poFilteredTotal: 0,
  poPage: 1,
  poSearch: '',
  poStatus: 'all',
  salesOrders: [],
  salesTotal: 0,
  salesFilteredTotal: 0,
  salesPage: 1,
  salesSearch: '',
  salesStatus: 'all',
  salesStartDate: '',
  salesEndDate: '',
  reportData: null,
  reportCategory: 'all',
  reportStartDate: '',
  reportEndDate: '',
  adminTab: 'users',
  adminMetrics: null,
  adminUsers: [],
  auditLogs: [],
  auditLimit: 50,
  auditFilter: '',
  productCache: new Map(),
  reqSeq: { products: 0, movements: 0, suppliers: 0, purchases: 0, sales: 0 }
};

export const dom = {
  appView: document.querySelector('#app-view'),
  modal: document.querySelector('#entity-modal'),
  modalContent: document.querySelector('#modal-content'),
  pageTitle: document.querySelector('#page-title'),
  pageKicker: document.querySelector('#page-kicker'),
  pageSubtitle: document.querySelector('#page-subtitle'),
  topbarActions: document.querySelector('#topbar-view-actions'),
  appMessage: document.querySelector('#app-message'),
  appMessageText: document.querySelector('#app-message-text'),
  alertBadge: document.querySelector('#sidebar-alert-badge')
};

let navigatorFn = async () => {};
let signOutFn = async () => {};

export function registerRouter({ navigate, signOut }) {
  navigatorFn = navigate;
  signOutFn = signOut;
}

export function goToView(view, opts = {}) {
  return navigatorFn(view, opts);
}

export function triggerSignOut(redirect = true, reason) {
  return signOutFn(redirect, reason);
}

export function isAdmin() {
  return String(state.user?.role || '').toLowerCase() === 'admin';
}

export function canManageSettings() {
  const role = String(state.user?.role || '').toLowerCase();
  return role === 'admin' || role === 'manager' || role === 'shopkeeper';
}

export function canDeleteRecords() {
  const role = String(state.user?.role || '').toLowerCase();
  return role === 'admin' || role === 'manager';
}

export function canImportReplace() {
  const role = String(state.user?.role || '').toLowerCase();
  return role === 'admin' || role === 'manager' || role === 'shopkeeper';
}

export function canVoidOrders() {
  return canImportReplace();
}

export function cacheProducts(items = []) {
  items.forEach((p) => {
    if (p && p.id != null) state.productCache.set(Number(p.id), p);
  });
}

export function parseRouteHash() {
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw) return;
  const [viewPart, queryPart] = raw.split('?');
  if (VALID_VIEWS.includes(viewPart)) {
    state.view = viewPart === 'team' && !isAdmin() ? 'dashboard' : viewPart;
  }
  const params = new URLSearchParams(queryPart || '');
  if (viewPart === 'products') {
    state.productSearch = params.get('q') || '';
    state.productCategory = params.get('category') || 'all';
    state.productStatus = params.get('status') || 'all';
    state.productPage = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
  } else if (viewPart === 'movements') {
    state.movementSearch = params.get('q') || '';
    state.movementType = params.get('type') || 'all';
    state.movementStartDate = params.get('start') || '';
    state.movementEndDate = params.get('end') || '';
    state.movementPage = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
  } else if (viewPart === 'alerts') {
    state.alertSearch = params.get('q') || '';
    state.alertSeverity = params.get('severity') || 'all';
    state.alertCategory = params.get('category') || 'all';
  } else if (viewPart === 'purchases') {
    state.poSearch = params.get('q') || '';
    state.poStatus = params.get('status') || 'all';
    state.poPage = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
  } else if (viewPart === 'sales') {
    state.salesSearch = params.get('q') || '';
    state.salesStatus = params.get('status') || 'all';
    state.salesStartDate = params.get('start') || '';
    state.salesEndDate = params.get('end') || '';
    state.salesPage = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
  } else if (viewPart === 'suppliers') {
    state.supplierSearch = params.get('q') || '';
    state.supplierTier = params.get('tier') || 'all';
    state.supplierStatus = params.get('status') || 'all';
  } else if (viewPart === 'reports') {
    state.reportCategory = params.get('category') || 'all';
    state.reportStartDate = params.get('start') || '';
    state.reportEndDate = params.get('end') || '';
  } else if (viewPart === 'team') {
    state.adminTab = params.get('tab') === 'audit' ? 'audit' : 'users';
  }
}

export function syncRouteHash() {
  const params = new URLSearchParams();
  if (state.view === 'products') {
    if (state.productSearch) params.set('q', state.productSearch);
    if (state.productCategory !== 'all') params.set('category', state.productCategory);
    if (state.productStatus !== 'all') params.set('status', state.productStatus);
    if (state.productPage > 1) params.set('page', String(state.productPage));
  } else if (state.view === 'movements') {
    if (state.movementSearch) params.set('q', state.movementSearch);
    if (state.movementType !== 'all') params.set('type', state.movementType);
    if (state.movementStartDate) params.set('start', state.movementStartDate);
    if (state.movementEndDate) params.set('end', state.movementEndDate);
    if (state.movementPage > 1) params.set('page', String(state.movementPage));
  } else if (state.view === 'alerts') {
    if (state.alertSearch) params.set('q', state.alertSearch);
    if (state.alertSeverity !== 'all') params.set('severity', state.alertSeverity);
    if (state.alertCategory !== 'all') params.set('category', state.alertCategory);
  } else if (state.view === 'purchases') {
    if (state.poSearch) params.set('q', state.poSearch);
    if (state.poStatus !== 'all') params.set('status', state.poStatus);
    if (state.poPage > 1) params.set('page', String(state.poPage));
  } else if (state.view === 'sales') {
    if (state.salesSearch) params.set('q', state.salesSearch);
    if (state.salesStatus !== 'all') params.set('status', state.salesStatus);
    if (state.salesStartDate) params.set('start', state.salesStartDate);
    if (state.salesEndDate) params.set('end', state.salesEndDate);
    if (state.salesPage > 1) params.set('page', String(state.salesPage));
  } else if (state.view === 'suppliers') {
    if (state.supplierSearch) params.set('q', state.supplierSearch);
    if (state.supplierTier !== 'all') params.set('tier', state.supplierTier);
    if (state.supplierStatus !== 'all') params.set('status', state.supplierStatus);
  } else if (state.view === 'reports') {
    if (state.reportCategory !== 'all') params.set('category', state.reportCategory);
    if (state.reportStartDate) params.set('start', state.reportStartDate);
    if (state.reportEndDate) params.set('end', state.reportEndDate);
  } else if (state.view === 'team') {
    if (state.adminTab !== 'users') params.set('tab', state.adminTab);
  }
  const qs = params.toString();
  const nextHash = `#${state.view}${qs ? `?${qs}` : ''}`;
  if (window.location.hash !== nextHash) {
    window.history.replaceState(null, '', nextHash);
  }
}
