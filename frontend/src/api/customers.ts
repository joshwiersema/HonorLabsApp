import apiClient from './client';

export const customersApi = {
  doctors: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get('/customers/doctors', { params }),
    get: (id: number) =>
      apiClient.get(`/customers/doctors/${id}`),
    approve: (id: number) =>
      apiClient.post(`/customers/doctors/${id}/approve`),
    reject: (id: number) =>
      apiClient.post(`/customers/doctors/${id}/reject`),
  },
  patients: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get('/customers/patients', { params }),
    get: (id: number) =>
      apiClient.get(`/customers/patients/${id}`),
  },
  stats: () =>
    apiClient.get('/customers/stats'),
};
