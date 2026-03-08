export const B2BKING_GROUPS = {
  DOCTORS: '599',
  PATIENTS: '695',
  B2C: 'b2cuser',
} as const;

export const ORDER_STATUSES = {
  pending: { label: 'Pending', color: 'warning' },
  processing: { label: 'Processing', color: 'default' },
  'on-hold': { label: 'On Hold', color: 'warning' },
  completed: { label: 'Completed', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'destructive' },
  refunded: { label: 'Refunded', color: 'secondary' },
  failed: { label: 'Failed', color: 'destructive' },
} as const;

export const API_BASE_URL = '/api';

export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/orders', label: 'Orders', icon: 'ShoppingCart' },
  { path: '/products', label: 'Products', icon: 'Package' },
  { path: '/doctors', label: 'Doctors', icon: 'Stethoscope' },
  { path: '/patients', label: 'Patients', icon: 'Users' },
  { path: '/commissions', label: 'Commissions', icon: 'DollarSign' },
  { path: '/analytics', label: 'Analytics', icon: 'BarChart3' },
  { path: '/settings', label: 'Settings', icon: 'Settings' },
] as const;
