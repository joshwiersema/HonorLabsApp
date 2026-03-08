import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { RevenueAnalytics } from '@/components/analytics/RevenueAnalytics';
import { GrowthAnalytics } from '@/components/analytics/GrowthAnalytics';
import { ProductAnalytics } from '@/components/analytics/ProductAnalytics';
import { CustomerAnalytics } from '@/components/analytics/CustomerAnalytics';

export function Analytics() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Deep business intelligence and performance insights"
      />

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <RevenueAnalytics />
        </TabsContent>

        <TabsContent value="growth">
          <GrowthAnalytics />
        </TabsContent>

        <TabsContent value="products">
          <ProductAnalytics />
        </TabsContent>

        <TabsContent value="customers">
          <CustomerAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
