import apiClient from './client';
import type { StoreInfo, WcSetting } from '@/types/settings';

export const settingsApi = {
  getStore: () => apiClient.get<StoreInfo>('/settings/store'),

  getWooCommerce: () =>
    apiClient.get<Record<string, WcSetting[]>>('/settings/woocommerce'),

  updateSetting: (groupId: string, settingId: string, value: string) =>
    apiClient.put<WcSetting>(
      `/settings/woocommerce/${groupId}/${settingId}`,
      { value },
    ),
};
