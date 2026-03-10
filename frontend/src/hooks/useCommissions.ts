import { useQuery } from '@tanstack/react-query';
import { honorLabsApi } from '@/api/honor-labs';
import type { Commission, CommissionSummary, CommissionSettings } from '@/types/commission';

export function useCommissions(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['commissions', params],
    queryFn: async () => {
      const res = await honorLabsApi.commissions.list(params);
      return res.data as Commission[];
    },
    retry: false,
  });
}

export function useCommissionSummary(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['commissions', 'summary', params],
    queryFn: async () => {
      const res = await honorLabsApi.commissions.summary(params);
      return res.data as CommissionSummary;
    },
    retry: false,
  });
}

export function useCommissionSettings() {
  return useQuery({
    queryKey: ['commissions', 'settings'],
    queryFn: async () => {
      const res = await honorLabsApi.commissions.settings();
      return res.data as CommissionSettings;
    },
    retry: false,
  });
}
