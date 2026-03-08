import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/api/settings';

export function useWooCommerceSettings() {
  return useQuery({
    queryKey: ['settings', 'woocommerce'],
    queryFn: async () => {
      const res = await settingsApi.getWooCommerce();
      return res.data;
    },
  });
}

export function useUpdateSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      settingId,
      value,
    }: {
      groupId: string;
      settingId: string;
      value: string;
    }) => {
      const res = await settingsApi.updateSetting(groupId, settingId, value);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useStoreInfo() {
  return useQuery({
    queryKey: ['settings', 'store'],
    queryFn: async () => {
      const res = await settingsApi.getStore();
      return res.data;
    },
  });
}
