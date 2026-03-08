import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { type PaginationState } from '@tanstack/react-table';
import { PageHeader } from '@/components/shared/PageHeader';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { OrderDetail } from '@/components/orders/OrderDetail';
import { useOrders, useOrder } from '@/hooks/useOrders';

const PAGE_SIZE = 20;

export function Orders() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract order ID from URL params if present (e.g., from dashboard link)
  const orderIdFromUrl = searchParams.get('order');

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(
    orderIdFromUrl ? parseInt(orderIdFromUrl, 10) : null
  );
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchValue]);

  // Sync URL order param
  useEffect(() => {
    if (orderIdFromUrl) {
      setSelectedOrderId(parseInt(orderIdFromUrl, 10));
    }
  }, [orderIdFromUrl]);

  // Build query params
  const queryParams: Record<string, unknown> = {
    page: pagination.pageIndex + 1,
    per_page: pagination.pageSize,
    orderby: 'date',
    order: 'desc',
  };

  if (statusFilter && statusFilter !== 'all') {
    queryParams.status = statusFilter;
  }

  if (debouncedSearch) {
    queryParams.search = debouncedSearch;
  }

  const { data: ordersData, isLoading: ordersLoading } = useOrders(queryParams);
  const { data: selectedOrder, isLoading: orderDetailLoading } =
    useOrder(selectedOrderId);

  const handleViewOrder = useCallback((id: number) => {
    setSelectedOrderId(id);
    setSearchParams((prev) => {
      prev.set('order', String(id));
      return prev;
    });
  }, [setSearchParams]);

  const handleCloseDetail = useCallback(() => {
    setSelectedOrderId(null);
    setSearchParams((prev) => {
      prev.delete('order');
      return prev;
    });
  }, [setSearchParams]);

  const handleStatusFilterChange = useCallback((status: string) => {
    setStatusFilter(status);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="View and manage all store orders"
      />

      <OrdersTable
        orders={ordersData?.data ?? []}
        isLoading={ordersLoading}
        pageCount={ordersData?.totalPages ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        onViewOrder={handleViewOrder}
      />

      <OrderDetail
        order={selectedOrder ?? null}
        isLoading={orderDetailLoading && selectedOrderId !== null}
        open={selectedOrderId !== null}
        onClose={handleCloseDetail}
      />
    </div>
  );
}
