import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/api/orders';
import type { WcOrder } from '@/types/order';

export function useOrders(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: async () => {
      const res = await ordersApi.list(params);
      return {
        data: res.data as WcOrder[],
        total: parseInt(res.headers['x-wp-total'] || '0'),
        totalPages: parseInt(res.headers['x-wp-totalpages'] || '0'),
      };
    },
  });
}

export function useOrder(id: number | null) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const res = await ordersApi.get(id!);
      return res.data as WcOrder;
    },
    enabled: id !== null,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await ordersApi.updateStatus(id, status);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useAddOrderNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      note,
      customerNote,
    }: {
      id: number;
      note: string;
      customerNote?: boolean;
    }) => {
      const res = await ordersApi.addNote(id, note, customerNote);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useRequestLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, message }: { id: number; message?: string }) => {
      const res = await ordersApi.requestLogo(id, message);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
