import { useState, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { type PaginationState } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { usePatients } from '@/hooks/usePatients';
import type { Patient } from '@/types/patient';

interface PatientsTableProps {
  onViewPatient: (id: number) => void;
}

export function PatientsTable({ onViewPatient }: PatientsTableProps) {
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const params = useMemo(() => ({
    page: pagination.pageIndex + 1,
    per_page: pagination.pageSize,
    ...(search ? { search } : {}),
  }), [pagination, search]);

  const { data, isLoading } = usePatients(params);

  const columns: ColumnDef<Patient, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <button
            className="font-medium text-foreground hover:text-primary hover:underline transition-colors text-left"
            onClick={() => onViewPatient(row.original.id)}
          >
            {row.original.first_name} {row.original.last_name}
          </button>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.email}</span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'linked_doctor_name',
        header: 'Linked Doctor',
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.linked_doctor_name || (
              <span className="text-muted-foreground italic">None</span>
            )}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'date_created',
        header: 'Registered',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.date_created
              ? formatDate(row.original.date_created)
              : '--'}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'orders_count',
        header: 'Orders',
        cell: ({ row }) => (
          <span className="text-sm font-medium tabular-nums">
            {row.original.orders_count}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'total_spent',
        header: 'Total Spent',
        cell: ({ row }) => (
          <span className="text-sm font-semibold tabular-nums">
            {formatCurrency(row.original.total_spent)}
          </span>
        ),
        enableSorting: true,
      },
    ],
    [onViewPatient]
  );

  return (
    <DataTable
      columns={columns}
      data={data?.data ?? []}
      isLoading={isLoading}
      pageCount={data?.totalPages}
      pagination={pagination}
      onPaginationChange={setPagination}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search by name or email..."
      emptyMessage="No patients found."
    />
  );
}
