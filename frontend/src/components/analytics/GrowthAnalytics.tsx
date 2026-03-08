import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
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
import { useDoctors } from '@/hooks/useDoctors';
import { usePatients } from '@/hooks/usePatients';
import { format, parseISO } from 'date-fns';
import type { Doctor } from '@/types/doctor';
import type { Patient } from '@/types/patient';

function ChartSkeleton() {
  return (
    <div className="flex h-[280px] w-full items-center justify-center">
      <Skeleton className="h-48 w-full max-w-md" />
    </div>
  );
}

function SimpleTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey?: string; value?: number; color?: string }>; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border bg-background px-4 py-3 shadow-lg">
      <p className="mb-1 text-sm font-medium text-foreground">{label}</p>
      {payload.map((entry: { dataKey?: string; value?: number; color?: string }) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-xs text-muted-foreground capitalize">{String(entry.dataKey)}:</span>
          <span className="text-sm font-semibold tabular-nums">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function groupByMonth<T extends { date_created: string }>(
  items: T[]
): { month: string; count: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    try {
      const monthKey = format(parseISO(item.date_created), 'yyyy-MM');
      map.set(monthKey, (map.get(monthKey) ?? 0) + 1);
    } catch {
      // skip items with invalid dates
    }
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({
      month: format(parseISO(`${month}-01`), 'MMM yyyy'),
      count,
    }));
}

export function GrowthAnalytics() {
  const { data: doctorsData, isLoading: doctorsLoading } = useDoctors();
  const { data: patientsData, isLoading: patientsLoading } = usePatients({ per_page: 100 });

  const doctors: Doctor[] = useMemo(() => {
    if (!doctorsData) return [];
    return doctorsData.doctors ?? [];
  }, [doctorsData]);

  const patients: Patient[] = useMemo(() => {
    if (!patientsData) return [];
    return patientsData.data ?? [];
  }, [patientsData]);

  const doctorsByMonth = useMemo(() => groupByMonth(doctors), [doctors]);
  const patientsByMonth = useMemo(() => groupByMonth(patients), [patients]);

  const ratioData = useMemo(() => {
    const allMonths = new Set<string>();
    const doctorMap = new Map<string, number>();
    const patientMap = new Map<string, number>();

    for (const d of doctors) {
      try {
        const key = format(parseISO(d.date_created), 'yyyy-MM');
        allMonths.add(key);
        doctorMap.set(key, (doctorMap.get(key) ?? 0) + 1);
      } catch { /* skip */ }
    }
    for (const p of patients) {
      try {
        const key = format(parseISO(p.date_created), 'yyyy-MM');
        allMonths.add(key);
        patientMap.set(key, (patientMap.get(key) ?? 0) + 1);
      } catch { /* skip */ }
    }

    let cumulativeDoctors = 0;
    let cumulativePatients = 0;

    return Array.from(allMonths)
      .sort()
      .map((m) => {
        cumulativeDoctors += doctorMap.get(m) ?? 0;
        cumulativePatients += patientMap.get(m) ?? 0;
        return {
          month: format(parseISO(`${m}-01`), 'MMM yyyy'),
          ratio: cumulativeDoctors > 0 ? +(cumulativePatients / cumulativeDoctors).toFixed(1) : 0,
        };
      });
  }, [doctors, patients]);

  const referralData = useMemo(() => {
    const map = new Map<string, { name: string; referrals: number }>();
    for (const d of doctors) {
      if (d.referral_code && d.orders_count > 0) {
        map.set(d.referral_code, {
          name: `Dr. ${d.first_name} ${d.last_name}`,
          referrals: d.orders_count,
        });
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.referrals - a.referrals)
      .slice(0, 10);
  }, [doctors]);

  const isLoading = doctorsLoading || patientsLoading;
  const hasData = doctors.length > 0 || patients.length > 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* New Doctors Per Month */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              New Doctors Per Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : doctorsByMonth.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Data will populate as doctors register
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={doctorsByMonth} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} className="fill-muted-foreground" width={30} allowDecimals={false} />
                  <Tooltip content={<SimpleTooltip />} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="doctors" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* New Patients Per Month */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              New Patients Per Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : patientsByMonth.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Data will populate as patients register
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={patientsByMonth} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} className="fill-muted-foreground" width={30} allowDecimals={false} />
                  <Tooltip content={<SimpleTooltip />} />
                  <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} name="patients" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Doctor-to-Patient Ratio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Patient-to-Doctor Ratio Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : ratioData.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Data will populate as doctors and patients register
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={ratioData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} className="fill-muted-foreground" width={30} />
                  <Tooltip content={<SimpleTooltip />} />
                  <Line type="monotone" dataKey="ratio" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} name="ratio" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Referral Code Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Top Referring Doctors
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : !hasData || referralData.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No referral data available yet
                </p>
              </div>
            ) : (
              <div className="max-h-[280px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doctor</TableHead>
                      <TableHead className="text-right">Referrals</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referralData.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">
                          {item.referrals}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
