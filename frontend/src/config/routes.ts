// All route paths in one place. Never hardcode `/products` in a component —
// import from here so a rename is a one-line change.

export const routes = {
  home:      '/',
  login:     '/login',
  signup:    '/signup',
  stores:    '/stores',
  dashboard: '/dashboard',
  products:  '/products',
  stock:     '/stock',
  suppliers: '/suppliers',
  sales:     '/sales',
  alerts:    '/alerts',
  reports:   '/reports',
  scanner:   '/scanner',
  settings:  '/settings',
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];

// Legacy uppercase export — keep for backward compatibility with existing imports
export const ROUTES = {
  LOGIN:     routes.login,
  STORES:    routes.stores,
  DASHBOARD: routes.home,
  PRODUCTS:  routes.products,
  STOCK:     routes.stock,
  SUPPLIERS: routes.suppliers,
  SALES:     routes.sales,
  ALERTS:    routes.alerts,
  REPORTS:   routes.reports,
  SETTINGS:  routes.settings,
} as const;
