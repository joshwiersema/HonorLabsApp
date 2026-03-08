import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/formatters';
import type { RevenueDataPoint } from '@/types/api';

type RevenuePeriod = '30d' | '90d' | '12m';

interface RevenueChartProps {
  data: RevenueDataPoint[] | undefined;
  isLoading: boolean;
  period: RevenuePeriod;
  onPeriodChange: (period: RevenuePeriod) => void;
}

const PERIOD_OPTIONS: { value: RevenuePeriod; label: string }[] = [
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '12m', label: '12 Months' },
];

function ChartSkeleton() {
  return (
    <div className="flex h-[350px] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="h-48 w-full max-w-md animate-pulse rounded bg-muted" />
        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const wholesale = payload.find((p) => p.dataKey === 'wholesale');
  const retail = payload.find((p) => p.dataKey === 'retail');
  const total = payload.find((p) => p.dataKey === 'total');

  return (
    <div className="rounded-lg border bg-background px-4 py-3 shadow-lg">
      <p className="mb-2 text-sm font-medium text-foreground">{label}</p>
      <div className="space-y-1">
        {total && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-sm font-semibold">
              {formatCurrency(total.value as number)}
            </span>
          </div>
        )}
        {wholesale && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-indigo-500" />
              <span className="text-xs text-muted-foreground">Wholesale</span>
            </div>
            <span className="text-sm font-medium">
              {formatCurrency(wholesale.value as number)}
            </span>
          </div>
        )}
        {retail && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">Retail</span>
            </div>
            <span className="text-sm font-medium">
              {formatCurrency(retail.value as number)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function RevenueChart({
  data,
  isLoading,
  period,
  onPeriodChange,
}: RevenueChartProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Revenue Overview</CardTitle>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {PERIOD_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={period === option.value ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => onPeriodChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <ChartSkeleton />
        ) : !data || data.length === 0 ? (
          <div className="flex h-[350px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No revenue data available for this period.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart
              data={data}
              margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorWholesale" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorRetail" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) =>
                  `$${(value / 1000).toFixed(0)}k`
                }
                className="fill-muted-foreground"
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="wholesale"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorWholesale)"
              />
              <Area
                type="monotone"
                dataKey="retail"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRetail)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
        {!isLoading && data && data.length > 0 && (
          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-indigo-500" />
              <span className="text-sm text-muted-foreground">Wholesale</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-muted-foreground">Retail</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
