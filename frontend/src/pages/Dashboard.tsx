import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Stethoscope, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { RecentOrders } from '@/components/dashboard/RecentOrders';
import { DoctorPipeline } from '@/components/dashboard/DoctorPipeline';
import {
  useDashboardStats,
  useRecentOrders,
  useRevenueData,
} from '@/hooks/useDashboard';
import { useDoctors } from '@/hooks/useDoctors';

type RevenuePeriod = '30d' | '90d' | '12m';

export function Dashboard() {
  const navigate = useNavigate();
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('30d');

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: revenueData, isLoading: revenueLoading } =
    useRevenueData(revenuePeriod);
  const { data: recentOrdersData, isLoading: ordersLoading } =
    useRecentOrders();
  const { data: doctorsData, isLoading: doctorsLoading } = useDoctors();

  const handleViewOrder = (id: number) => {
    navigate(`/orders?order=${id}`);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Business overview at a glance"
      />

      {/* Stats Cards */}
      <StatsCards stats={stats} isLoading={statsLoading} />

      {/* Main Content: Revenue Chart + Side Panel */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Revenue Chart - takes ~60% */}
        <div className="lg:col-span-3">
          <RevenueChart
            data={revenueData}
            isLoading={revenueLoading}
            period={revenuePeriod}
            onPeriodChange={setRevenuePeriod}
          />
        </div>

        {/* Side Panel - takes ~40% */}
        <div className="space-y-6 lg:col-span-2">
          <RecentOrders
            orders={recentOrdersData?.data}
            isLoading={ordersLoading}
            onViewOrder={handleViewOrder}
          />
          <DoctorPipeline
            doctors={doctorsData?.doctors}
            isLoading={doctorsLoading}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="gap-2" asChild>
            <Link to="/orders">
              <ShoppingCart className="h-4 w-4" />
              View All Orders
            </Link>
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link to="/doctors">
              <Stethoscope className="h-4 w-4" />
              Manage Doctors
            </Link>
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link to="/products">
              <Package className="h-4 w-4" />
              View Products
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
