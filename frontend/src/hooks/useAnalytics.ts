import { useQuery } from '@tanstack/react-query';
import { wcApi } from '@/api/woocommerce';
import { honorLabsApi } from '@/api/honor-labs';
import type { RevenueDataPoint } from '@/types/dashboard';
import type { WcProduct } from '@/types/product';
import { subDays, subMonths, format } from 'date-fns';

interface RevenueAnalyticsParams {
  date_min?: string;
  date_max?: string;
  period?: '30d' | '90d' | '12m';
}

export function useRevenueAnalytics(params?: RevenueAnalyticsParams) {
  return useQuery({
    queryKey: ['analytics', 'revenue', params],
    queryFn: async () => {
      let dateMin = params?.date_min;
      let dateMax = params?.date_max;

      if (!dateMin && params?.period) {
        const now = new Date();
        dateMax = format(now, 'yyyy-MM-dd');
        switch (params.period) {
          case '30d':
            dateMin = format(subDays(now, 30), 'yyyy-MM-dd');
            break;
          case '90d':
            dateMin = format(subDays(now, 90), 'yyyy-MM-dd');
            break;
          case '12m':
            dateMin = format(subMonths(now, 12), 'yyyy-MM-dd');
            break;
        }
      }

      const res = await wcApi.reports.sales({
        date_min: dateMin,
        date_max: dateMax,
      });

      return res.data as RevenueDataPoint[];
    },
  });
}

export function useGrowthAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'growth'],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      const sixtyDaysAgo = subDays(now, 60);

      const [currentPeriod, previousPeriod] = await Promise.all([
        wcApi.reports.sales({
          date_min: format(thirtyDaysAgo, 'yyyy-MM-dd'),
          date_max: format(now, 'yyyy-MM-dd'),
        }),
        wcApi.reports.sales({
          date_min: format(sixtyDaysAgo, 'yyyy-MM-dd'),
          date_max: format(thirtyDaysAgo, 'yyyy-MM-dd'),
        }),
      ]);

      return {
        current: currentPeriod.data as RevenueDataPoint[],
        previous: previousPeriod.data as RevenueDataPoint[],
      };
    },
  });
}

export function useProductAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'products'],
    queryFn: async () => {
      const res = await wcApi.products.list({
        per_page: 10,
        orderby: 'popularity',
        order: 'desc',
      });

      return res.data as WcProduct[];
    },
  });
}

export function useTopCustomers() {
  return useQuery({
    queryKey: ['analytics', 'top-customers'],
    queryFn: async () => {
      const res = await wcApi.customers.list({
        per_page: 10,
        orderby: 'registered_date',
        order: 'desc',
        role: 'all',
      });

      return res.data as Array<{
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        orders_count: number;
        total_spent: string;
        avatar_url: string;
      }>;
    },
  });
}
