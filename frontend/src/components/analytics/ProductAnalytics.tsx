import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useProducts } from '@/hooks/useProducts';
import { formatCurrency } from '@/utils/formatters';

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function ChartSkeleton() {
  return (
    <div className="flex h-[300px] w-full items-center justify-center">
      <Skeleton className="h-48 w-full max-w-md" />
    </div>
  );
}

function BarTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border bg-background px-4 py-3 shadow-lg">
      <p className="mb-1 text-sm font-medium text-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">
        {payload[0].dataKey === 'sales'
          ? `${payload[0].value} sold`
          : formatCurrency(payload[0].value as number)}
      </p>
    </div>
  );
}

function PieTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const { name, value } = payload[0];
  return (
    <div className="rounded-lg border bg-background px-4 py-3 shadow-lg">
      <p className="mb-1 text-sm font-medium text-foreground">{name}</p>
      <p className="text-sm font-semibold tabular-nums">
        {formatCurrency(value as number)}
      </p>
    </div>
  );
}

export function ProductAnalytics() {
  const { data: productsData, isLoading } = useProducts({
    per_page: 50,
    orderby: 'total_sales',
    order: 'desc',
  });

  const bestSellers = useMemo(() => {
    if (!productsData?.data) return [];
    return productsData.data
      .filter((p) => p.total_sales > 0)
      .slice(0, 10)
      .map((p) => ({
        name: p.name.length > 30 ? p.name.slice(0, 30) + '...' : p.name,
        sales: p.total_sales,
      }));
  }, [productsData]);

  const revenueShareData = useMemo(() => {
    if (!productsData?.data) return [];
    const items = productsData.data
      .filter((p) => p.total_sales > 0 && parseFloat(p.price || '0') > 0)
      .slice(0, 6)
      .map((p) => ({
        name: p.name.length > 20 ? p.name.slice(0, 20) + '...' : p.name,
        value: p.total_sales * parseFloat(p.price || '0'),
      }));

    const totalRevenue = items.reduce((sum, i) => sum + i.value, 0);

    // If there are more products, group as "Other"
    if (productsData.data.length > 6) {
      const otherRevenue = productsData.data
        .slice(6)
        .filter((p) => p.total_sales > 0 && parseFloat(p.price || '0') > 0)
        .reduce((sum, p) => sum + p.total_sales * parseFloat(p.price || '0'), 0);
      if (otherRevenue > 0) {
        items.push({ name: 'Other', value: otherRevenue });
      }
    }

    return items.length > 0 && totalRevenue > 0 ? items : [];
  }, [productsData]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Best Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Best-Selling Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : bestSellers.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No sales data available yet.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={bestSellers}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    className="fill-muted-foreground"
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={140}
                    className="fill-muted-foreground"
                  />
                  <Tooltip content={<BarTooltip />} />
                  <Bar dataKey="sales" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Product Revenue Share */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Product Revenue Share
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : revenueShareData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No product revenue data available yet.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={revenueShareData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {revenueShareData.map((_, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={PIE_COLORS[idx % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                  {revenueShareData.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      <span className="text-xs text-muted-foreground">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
