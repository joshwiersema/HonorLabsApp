import apiClient from './client';
import type { LoginCredentials, LoginResponse, MeResponse } from '@/types/api';

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<LoginResponse>('/auth/login', credentials),
  me: () =>
    apiClient.get<MeResponse>('/auth/me'),
};
