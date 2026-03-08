import { useQuery } from '@tanstack/react-query';
import { wcApi } from '@/api/woocommerce';
import { customersApi } from '@/api/customers';
import type { DashboardStats, RevenueDataPoint } from '@/types/dashboard';
import type { WcOrder } from '@/types/order';
import { subDays, subMonths, format } from 'date-fns';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Fetch data from multiple sources in parallel
      const [salesRes, statsRes] = await Promise.allSettled([
        wcApi.reports.sales({
          date_min: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
          date_max: format(new Date(), 'yyyy-MM-dd'),
        }),
        customersApi.stats(),
      ]);

      // Extract sales data
      let totalRevenueThisMonth = 0;
      let totalOrdersThisMonth = 0;
      if (salesRes.status === 'fulfilled') {
        const salesData = salesRes.value.data;
        if (Array.isArray(salesData) && salesData.length > 0) {
          totalRevenueThisMonth = parseFloat(salesData[0]?.total_sales || '0');
          totalOrdersThisMonth = parseInt(salesData[0]?.total_orders || '0', 10);
        }
      }

      // Extract customer stats
      let doctorCount = 0;
      let patientCount = 0;
      if (statsRes.status === 'fulfilled') {
        const statsData = statsRes.value.data;
        doctorCount = statsData.doctor_count || 0;
        patientCount = statsData.patient_count || 0;
      }

      const stats: DashboardStats = {
        total_revenue: 0, // Total all-time revenue not available from reports endpoint
        total_revenue_this_month: totalRevenueThisMonth,
        total_orders: 0, // Total all-time orders not available from reports endpoint
        total_orders_this_month: totalOrdersThisMonth,
        active_doctors: doctorCount,
        active_patients: patientCount,
        pending_applications: 0, // Requires Honor Labs WordPress plugin
        wholesale_revenue: 0,
        retail_revenue: 0,
      };

      return stats;
    },
  });
}

export function useRecentOrders() {
  return useQuery({
    queryKey: ['orders', { per_page: 10, orderby: 'date', order: 'desc' }],
    queryFn: async () => {
      const res = await wcApi.orders.list({
        per_page: 10,
        orderby: 'date',
        order: 'desc',
      });
      return {
        data: res.data as WcOrder[],
        total: parseInt(res.headers['x-wp-total'] || '0'),
        totalPages: parseInt(res.headers['x-wp-totalpages'] || '0'),
      };
    },
  });
}

export function useRevenueData(period: '30d' | '90d' | '12m') {
  return useQuery({
    queryKey: ['revenue-data', period],
    queryFn: async () => {
      const now = new Date();
      let dateMin: Date;

      switch (period) {
        case '30d':
          dateMin = subDays(now, 30);
          break;
        case '90d':
          dateMin = subDays(now, 90);
          break;
        case '12m':
          dateMin = subMonths(now, 12);
          break;
      }

      const res = await wcApi.reports.sales({
        date_min: format(dateMin, 'yyyy-MM-dd'),
        date_max: format(now, 'yyyy-MM-dd'),
      });

      return res.data as RevenueDataPoint[];
    },
  });
}
