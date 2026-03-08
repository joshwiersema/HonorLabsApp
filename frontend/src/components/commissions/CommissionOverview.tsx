import {
  DollarSign,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/formatters';
import type { CommissionSummary } from '@/types/commission';

interface CommissionOverviewProps {
  summary: CommissionSummary | undefined;
  isLoading: boolean;
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-3 w-20" />
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  highlight?: boolean;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  highlight,
}: StatCardProps) {
  return (
    <Card className={highlight ? 'ring-2 ring-amber-500/20 bg-amber-50/30 dark:bg-amber-950/10' : ''}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`flex h-8 w-8 items-center justify-center rounded-md ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold tracking-tight tabular-nums ${highlight ? 'text-amber-700 dark:text-amber-400' : ''}`}>
          {value}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function CommissionOverview({ summary, isLoading }: CommissionOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const totalAmount = summary?.totalAmount ?? 0;
  const totalPaid = summary?.totalPaid ?? 0;
  const totalPending = summary?.totalPending ?? 0;
  const totalApproved = summary?.totalApproved ?? 0;
  const outstanding = totalPending + totalApproved;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Commissions"
        value={formatCurrency(totalAmount)}
        subtitle="All time"
        icon={TrendingUp}
        iconBg="bg-indigo-100 dark:bg-indigo-950"
        iconColor="text-indigo-600 dark:text-indigo-400"
      />
      <StatCard
        title="Total Paid"
        value={formatCurrency(totalPaid)}
        subtitle="Completed payouts"
        icon={CheckCircle2}
        iconBg="bg-emerald-100 dark:bg-emerald-950"
        iconColor="text-emerald-600 dark:text-emerald-400"
      />
      <StatCard
        title="Outstanding"
        value={formatCurrency(outstanding)}
        subtitle={`${formatCurrency(totalPending)} pending, ${formatCurrency(totalApproved)} approved`}
        icon={Clock}
        iconBg="bg-amber-100 dark:bg-amber-950"
        iconColor="text-amber-600 dark:text-amber-400"
        highlight={outstanding > 0}
      />
      <StatCard
        title="Total Pending"
        value={formatCurrency(totalPending)}
        subtitle="Awaiting approval"
        icon={DollarSign}
        iconBg="bg-blue-100 dark:bg-blue-950"
        iconColor="text-blue-600 dark:text-blue-400"
      />
    </div>
  );
}
