import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatCurrency, formatDate, formatPercentage } from '@/utils/formatters';
import type { Commission } from '@/types/commission';

interface CommissionTableProps {
  commissions: Commission[];
  isLoading: boolean;
}

interface DoctorAggregation {
  doctorId: number;
  doctorName: string;
  totalOrders: number;
  totalRevenue: number;
  avgCommissionRate: number;
  totalCommission: number;
  totalPaid: number;
  totalOutstanding: number;
  entries: Commission[];
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={`skeleton-${i}`}>
          {Array.from({ length: 7 }).map((_, j) => (
            <TableCell key={`skeleton-${i}-${j}`}>
              <Skeleton className="h-5 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function StatusBadge({ status }: { status: Commission['status'] }) {
  const config = {
    pending: { label: 'Pending', variant: 'warning' as const },
    approved: { label: 'Approved', variant: 'default' as const },
    paid: { label: 'Paid', variant: 'success' as const },
  };
  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function CommissionTable({ commissions, isLoading }: CommissionTableProps) {
  const [expandedDoctor, setExpandedDoctor] = useState<number | null>(null);

  const doctorAggregations = useMemo(() => {
    const map = new Map<number, DoctorAggregation>();

    for (const c of commissions) {
      const existing = map.get(c.doctorId);
      if (existing) {
        existing.totalOrders += 1;
        existing.totalRevenue += c.orderTotal;
        existing.totalCommission += c.commissionAmount;
        if (c.status === 'paid') {
          existing.totalPaid += c.commissionAmount;
        } else {
          existing.totalOutstanding += c.commissionAmount;
        }
        existing.entries.push(c);
        // Recalc average rate
        existing.avgCommissionRate =
          existing.entries.reduce((sum, e) => sum + e.commissionRate, 0) /
          existing.entries.length;
      } else {
        map.set(c.doctorId, {
          doctorId: c.doctorId,
          doctorName: c.doctorName,
          totalOrders: 1,
          totalRevenue: c.orderTotal,
          avgCommissionRate: c.commissionRate,
          totalCommission: c.commissionAmount,
          totalPaid: c.status === 'paid' ? c.commissionAmount : 0,
          totalOutstanding: c.status !== 'paid' ? c.commissionAmount : 0,
          entries: [c],
        });
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => b.totalCommission - a.totalCommission
    );
  }, [commissions]);

  const toggleExpand = (doctorId: number) => {
    setExpandedDoctor((prev) => (prev === doctorId ? null : doctorId));
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Doctor</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Earned</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Outstanding</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableSkeleton />
          </TableBody>
        </Table>
      </div>
    );
  }

  if (doctorAggregations.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Doctor</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Earned</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Outstanding</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                No commission data available.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Doctor</TableHead>
            <TableHead className="text-right">Orders</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Rate</TableHead>
            <TableHead className="text-right">Earned</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right">Outstanding</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {doctorAggregations.map((doc) => (
            <>
              <TableRow
                key={`doctor-${doc.doctorId}`}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => toggleExpand(doc.doctorId)}
              >
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    {expandedDoctor === doc.doctorId ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
                <TableCell className="font-medium">{doc.doctorName}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {doc.totalOrders}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(doc.totalRevenue)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPercentage(doc.avgCommissionRate)}
                </TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {formatCurrency(doc.totalCommission)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(doc.totalPaid)}
                </TableCell>
                <TableCell className={`text-right tabular-nums ${doc.totalOutstanding > 0 ? 'font-bold text-amber-600 dark:text-amber-400' : ''}`}>
                  {formatCurrency(doc.totalOutstanding)}
                </TableCell>
              </TableRow>
              {expandedDoctor === doc.doctorId && (
                doc.entries.map((entry) => (
                  <TableRow
                    key={`entry-${entry.id}`}
                    className="bg-muted/30"
                  >
                    <TableCell />
                    <TableCell className="pl-10 text-sm text-muted-foreground">
                      Order #{entry.orderId}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      --
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {formatCurrency(entry.orderTotal)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {formatPercentage(entry.commissionRate)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {formatCurrency(entry.commissionAmount)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      <StatusBadge status={entry.status} />
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatDate(entry.dateCreated)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
