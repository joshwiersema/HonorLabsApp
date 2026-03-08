import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wcApi } from '@/api/woocommerce';
import type { WcProduct, ProductUpdatePayload } from '@/types/product';

export function useProducts(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const res = await wcApi.products.list(params);
      return {
        data: res.data as WcProduct[],
        total: parseInt(res.headers['x-wp-total'] || '0'),
        totalPages: parseInt(res.headers['x-wp-totalpages'] || '0'),
      };
    },
  });
}

export function useProduct(id: number | null) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await wcApi.products.get(id!);
      return res.data as WcProduct;
    },
    enabled: id !== null,
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProductUpdatePayload }) => {
      const res = await wcApi.products.update(id, data);
      return res.data as WcProduct;
    },
    onSuccess: (updatedProduct) => {
      // Immediately update single product cache
      qc.setQueryData(['product', updatedProduct.id], updatedProduct);

      // Immediately update product in all list caches so UI reflects changes
      const queries = qc.getQueryCache().findAll({ queryKey: ['products'] });
      for (const query of queries) {
        const oldData = query.state.data as
          | { data: WcProduct[]; total: number; totalPages: number }
          | undefined;
        if (oldData?.data) {
          qc.setQueryData(query.queryKey, {
            ...oldData,
            data: oldData.data.map((p) =>
              p.id === updatedProduct.id ? updatedProduct : p
            ),
          });
        }
      }

      // Also invalidate for background consistency
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['product'] });
    },
  });
}
