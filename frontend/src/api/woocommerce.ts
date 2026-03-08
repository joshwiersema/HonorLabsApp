import apiClient from './client';
import type { ProductUpdatePayload } from '@/types/product';

export const wcApi = {
  orders: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get('/wc/v3/orders', { params }),
    get: (id: number) =>
      apiClient.get(`/wc/v3/orders/${id}`),
    update: (id: number, data: Record<string, unknown>) =>
      apiClient.put(`/wc/v3/orders/${id}`, data),
  },
  products: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get('/products', { params }),
    get: (id: number) =>
      apiClient.get(`/products/${id}`),
    update: (id: number, data: ProductUpdatePayload) =>
      apiClient.put(`/products/${id}`, data),
  },
  customers: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get('/wc/v3/customers', { params }),
    get: (id: number) =>
      apiClient.get(`/wc/v3/customers/${id}`),
  },
  reports: {
    sales: (params?: Record<string, unknown>) =>
      apiClient.get('/wc/v3/reports/sales', { params }),
  },
};
