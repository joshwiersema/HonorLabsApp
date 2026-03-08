import apiClient from './client';

export const honorLabsApi = {
  doctors: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get('/honor-labs/doctors', { params }),
    get: (id: number) =>
      apiClient.get(`/honor-labs/doctors/${id}`),
    approve: (id: number) =>
      apiClient.post(`/honor-labs/doctors/${id}/approve`),
    reject: (id: number, reason?: string) =>
      apiClient.post(`/honor-labs/doctors/${id}/reject`, { reason }),
  },
  patients: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get('/honor-labs/patients', { params }),
    get: (id: number) =>
      apiClient.get(`/honor-labs/patients/${id}`),
  },
  doctorApplications: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get('/honor-labs/doctor-applications', { params }),
    get: (id: number) =>
      apiClient.get(`/honor-labs/doctor-applications/${id}`),
    approve: (id: number) =>
      apiClient.post(`/honor-labs/doctor-applications/${id}/approve`),
    reject: (id: number, reason?: string) =>
      apiClient.post(`/honor-labs/doctor-applications/${id}/reject`, { reason }),
  },
  commissions: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get('/honor-labs/commissions', { params }),
    summary: (params?: Record<string, unknown>) =>
      apiClient.get('/honor-labs/commissions/summary', { params }),
    approve: (id: number) =>
      apiClient.post(`/honor-labs/commissions/${id}/approve`),
    markPaid: (id: number) =>
      apiClient.post(`/honor-labs/commissions/${id}/mark-paid`),
    settings: () =>
      apiClient.get('/honor-labs/commissions/settings'),
    updateSettings: (settings: Record<string, unknown>) =>
      apiClient.put('/honor-labs/commissions/settings', settings),
  },
  referralCodes: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get('/honor-labs/referral-codes', { params }),
    get: (code: string) =>
      apiClient.get(`/honor-labs/referral-codes/${code}`),
  },
  dashboardStats: () =>
    apiClient.get('/honor-labs/dashboard-stats'),
};
