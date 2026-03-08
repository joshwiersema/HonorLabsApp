import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DollarSign, ShoppingCart, Users } from 'lucide-react';
import { usePatients } from '@/hooks/usePatients';
import { useDoctors } from '@/hooks/useDoctors';
import { useDashboardStats } from '@/hooks/useDashboard';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import type { Patient } from '@/types/patient';
import type { Doctor } from '@/types/doctor';

const PIE_COLORS = ['#6366f1', '#22c55e'];

function ChartSkeleton() {
  return (
    <div className="flex h-[250px] w-full items-center justify-center">
      <Skeleton className="h-40 w-40 rounded-full" />
    </div>
  );
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name?: string; value?: number }> }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border bg-background px-4 py-3 shadow-lg">
      <p className="mb-1 text-sm font-medium text-foreground">{payload[0].name}</p>
      <p className="text-sm font-semibold tabular-nums">
        {formatNumber(payload[0].value as number)} orders
      </p>
    </div>
  );
}

interface StatMiniCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
}

function StatMiniCard({ icon: Icon, label, value, iconBg, iconColor }: StatMiniCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export function CustomerAnalytics() {
  const { data: patientsData, isLoading: patientsLoading } = usePatients({ per_page: 100 });
  const { data: doctorsData, isLoading: doctorsLoading } = useDoctors();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  const patients: Patient[] = useMemo(() => {
    if (!patientsData) return [];
    return patientsData.data ?? [];
  }, [patientsData]);

  const doctors: Doctor[] = useMemo(() => {
    if (!doctorsData) return [];
    return doctorsData.doctors ?? [];
  }, [doctorsData]);

  const topCustomers = useMemo(() => {
    return [...patients]
      .sort((a, b) => parseFloat(String(b.total_spent)) - parseFloat(String(a.total_spent)))
      .slice(0, 10);
  }, [patients]);

  const orderSplitData = useMemo(() => {
    const doctorOrders = doctors.reduce((sum, d) => sum + d.orders_count, 0);
    const patientOrders = patients.reduce((sum, p) => sum + p.orders_count, 0);
    if (doctorOrders === 0 && patientOrders === 0) return [];
    return [
      { name: 'Doctor Orders', value: doctorOrders },
      { name: 'Patient Orders', value: patientOrders },
    ];
  }, [doctors, patients]);

  const avgOrderValue = useMemo(() => {
    const totalOrders = stats?.total_orders ?? 0;
    const totalRevenue = stats?.total_revenue ?? 0;
    return totalOrders > 0 ? totalRevenue / totalOrders : 0;
  }, [stats]);

  const isLoading = patientsLoading || doctorsLoading || statsLoading;

  return (
    <div className="space-y-6">
      {/* Average Order Value Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {isLoading ? (
          <>
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </>
        ) : (
          <>
            <StatMiniCard
              icon={DollarSign}
              label="Average Order Value"
              value={formatCurrency(avgOrderValue)}
              iconBg="bg-indigo-100 dark:bg-indigo-950"
              iconColor="text-indigo-600 dark:text-indigo-400"
            />
            <StatMiniCard
              icon={ShoppingCart}
              label="Total Orders"
              value={formatNumber(stats?.total_orders ?? 0)}
              iconBg="bg-emerald-100 dark:bg-emerald-950"
              iconColor="text-emerald-600 dark:text-emerald-400"
            />
            <StatMiniCard
              icon={Users}
              label="Total Customers"
              value={formatNumber((stats?.active_doctors ?? 0) + (stats?.active_patients ?? 0))}
              iconBg="bg-amber-100 dark:bg-amber-950"
              iconColor="text-amber-600 dark:text-amber-400"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Top Customers by Spending
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : topCustomers.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No customer data available yet.
                </p>
              </div>
            ) : (
              <div className="max-h-[320px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Spent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCustomers.map((patient, idx) => (
                      <TableRow key={patient.id}>
                        <TableCell className="text-muted-foreground tabular-nums">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {patient.first_name} {patient.last_name}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {patient.orders_count}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">
                          {formatCurrency(patient.total_spent)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Doctor vs Patient Order Split */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Doctor vs Patient Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : orderSplitData.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No order data available yet.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={orderSplitData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {orderSplitData.map((_, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={PIE_COLORS[idx % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex items-center justify-center gap-6">
                  {orderSplitData.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {item.name} ({formatNumber(item.value)})
                      </span>
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
