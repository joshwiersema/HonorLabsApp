import { useMemo } from 'react';
import { type ColumnDef, type PaginationState } from '@tanstack/react-table';
import { MoreHorizontal, Eye, RefreshCw } from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { ORDER_STATUSES } from '@/utils/constants';
import type { WcOrder, OrderStatus } from '@/types/order';

interface OrdersTableProps {
  orders: WcOrder[];
  isLoading: boolean;
  pageCount: number;
  pagination: PaginationState;
  onPaginationChange: (pagination: PaginationState) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onViewOrder: (id: number) => void;
}

export function OrdersTable({
  orders,
  isLoading,
  pageCount,
  pagination,
  onPaginationChange,
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onViewOrder,
}: OrdersTableProps) {
  const columns = useMemo<ColumnDef<WcOrder, unknown>[]>(
    () => [
      {
        accessorKey: 'number',
        header: 'Order',
        cell: ({ row }) => (
          <button
            onClick={() => onViewOrder(row.original.id)}
            className="font-semibold text-primary hover:underline"
          >
            #{row.original.number}
          </button>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'date_created',
        header: 'Date',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.date_created)}
          </span>
        ),
      },
      {
        id: 'customer',
        header: 'Customer',
        cell: ({ row }) => {
          const { billing } = row.original;
          return (
            <div>
              <p className="text-sm font-medium">
                {billing.first_name} {billing.last_name}
              </p>
              <p className="text-xs text-muted-foreground">{billing.email}</p>
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: 'items',
        header: 'Items',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.line_items.length} item
            {row.original.line_items.length !== 1 ? 's' : ''}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'total',
        header: 'Total',
        cell: ({ row }) => (
          <span className="font-semibold">
            {formatCurrency(parseFloat(row.original.total))}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        enableSorting: false,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onViewOrder(row.original.id)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewOrder(row.original.id)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Update Status
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        enableSorting: false,
      },
    ],
    [onViewOrder]
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search orders..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(Object.entries(ORDER_STATUSES) as [OrderStatus, { label: string; color: string }][]).map(
              ([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value.label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={orders}
        isLoading={isLoading}
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        emptyMessage="No orders found matching your criteria."
      />
    </div>
  );
}
