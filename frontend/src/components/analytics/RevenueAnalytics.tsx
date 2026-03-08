import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';
import { useRevenueData } from '@/hooks/useDashboard';
import { useProducts } from '@/hooks/useProducts';
import { useDoctors } from '@/hooks/useDoctors';
import { formatCurrency } from '@/utils/formatters';

type RevenuePeriod = '30d' | '90d' | '12m';

const PERIOD_OPTIONS: { value: RevenuePeriod; label: string }[] = [
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '12m', label: '12 Months' },
];

function ChartSkeleton() {
  return (
    <div className="flex h-[300px] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="h-48 w-full max-w-md" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

function RevenueTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border bg-background px-4 py-3 shadow-lg">
      <p className="mb-2 text-sm font-medium text-foreground">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs capitalize text-muted-foreground">
                {String(entry.dataKey)}
              </span>
            </div>
            <span className="text-sm font-medium">
              {formatCurrency(entry.value as number)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border bg-background px-4 py-3 shadow-lg">
      <p className="mb-1 text-sm font-medium text-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">
        {formatCurrency(payload[0].value as number)}
      </p>
    </div>
  );
}

export function RevenueAnalytics() {
  const [period, setPeriod] = useState<RevenuePeriod>('30d');
  const { data: revenueData, isLoading: revenueLoading } = useRevenueData(period);
  const { data: productsData, isLoading: productsLoading } = useProducts({ per_page: 10, orderby: 'total_sales', order: 'desc' });
  const { data: doctorsData, isLoading: doctorsLoading } = useDoctors();

  const productChartData = useMemo(() => {
    if (!productsData?.data) return [];
    return productsData.data
      .filter((p) => p.total_sales > 0)
      .slice(0, 8)
      .map((p) => ({
        name: p.name.length > 25 ? p.name.slice(0, 25) + '...' : p.name,
        revenue: p.total_sales * parseFloat(p.price || '0'),
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [productsData]);

  const doctorChartData = useMemo(() => {
    if (!doctorsData) return [];
    const doctors = doctorsData.doctors ?? [];
    return doctors
      .filter((d) => d.total_spent > 0)
      .slice(0, 8)
      .map((d) => ({
        name: `Dr. ${d.last_name}`,
        revenue: d.total_spent,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [doctorsData]);

  return (
    <div className="space-y-6">
      {/* Revenue Over Time */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <TrendingUp className="h-4 w-4" />
            Revenue Over Time
          </CardTitle>
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {PERIOD_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={period === option.value ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setPeriod(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {revenueLoading ? (
            <ChartSkeleton />
          ) : !revenueData || revenueData.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No revenue data available for this period.
              </p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueWholesale" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="revenueRetail" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} className="fill-muted-foreground" width={50} />
                  <Tooltip content={<RevenueTooltip />} />
                  <Area type="monotone" dataKey="wholesale" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#revenueWholesale)" />
                  <Area type="monotone" dataKey="retail" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#revenueRetail)" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-4 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-indigo-500" />
                  <span className="text-sm text-muted-foreground">Wholesale</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm text-muted-foreground">Retail</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue by Product */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Revenue by Product
            </CardTitle>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <ChartSkeleton />
            ) : productChartData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No product revenue data available.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} className="fill-muted-foreground" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={130} className="fill-muted-foreground" />
                  <Tooltip content={<BarTooltip />} />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Doctor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Top Doctors by Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {doctorsLoading ? (
              <ChartSkeleton />
            ) : doctorChartData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No doctor revenue data available.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={doctorChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} className="fill-muted-foreground" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={100} className="fill-muted-foreground" />
                  <Tooltip content={<BarTooltip />} />
                  <Bar dataKey="revenue" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
