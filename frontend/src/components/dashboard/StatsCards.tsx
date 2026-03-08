import {
  DollarSign,
  ShoppingCart,
  Stethoscope,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import type { DashboardStats } from '@/types/api';

interface StatsCardsProps {
  stats: DashboardStats | undefined;
  isLoading: boolean;
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  isLoading: boolean;
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-8 w-8 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-3 w-20 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, isLoading }: StatCardProps) {
  if (isLoading) {
    return <StatCardSkeleton />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Revenue"
        value={stats ? formatCurrency(stats.total_revenue) : '$0'}
        subtitle={
          stats
            ? `${formatCurrency(stats.total_revenue_this_month)} this month`
            : undefined
        }
        icon={DollarSign}
        isLoading={isLoading}
      />
      <StatCard
        title="Total Orders"
        value={stats ? formatNumber(stats.total_orders) : '0'}
        subtitle={
          stats
            ? `${formatNumber(stats.total_orders_this_month)} this month`
            : undefined
        }
        icon={ShoppingCart}
        isLoading={isLoading}
      />
      <StatCard
        title="Active Doctors"
        value={stats ? formatNumber(stats.active_doctors) : '0'}
        subtitle="Approved practitioners"
        icon={Stethoscope}
        isLoading={isLoading}
      />
      <StatCard
        title="Active Patients"
        value={stats ? formatNumber(stats.active_patients) : '0'}
        subtitle="Registered patients"
        icon={Users}
        isLoading={isLoading}
      />
    </div>
  );
}
