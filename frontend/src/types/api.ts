export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
}

export interface MeResponse {
  username: string;
  store_connected: boolean;
  store_url: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  totalPages: number;
  page: number;
  perPage: number;
}

export interface DashboardStats {
  total_revenue: number;
  total_revenue_this_month: number;
  total_orders: number;
  total_orders_this_month: number;
  active_doctors: number;
  active_patients: number;
  pending_applications: number;
  wholesale_revenue: number;
  retail_revenue: number;
}

export interface RevenueDataPoint {
  date: string;
  total: number;
  wholesale: number;
  retail: number;
}
