import apiClient from './client';

export const ordersApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/orders', { params }),
  get: (id: number) =>
    apiClient.get(`/orders/${id}`),
  updateStatus: (id: number, status: string) =>
    apiClient.put(`/orders/${id}/status`, { status }),
  addNote: (id: number, note: string, customerNote: boolean = false) =>
    apiClient.post(`/orders/${id}/notes`, { note, customer_note: customerNote }),
  requestLogo: (id: number, message?: string) =>
    apiClient.post(`/orders/${id}/request-logo`, { message }),
};
