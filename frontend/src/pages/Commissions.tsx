import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { CommissionOverview } from '@/components/commissions/CommissionOverview';
import { CommissionTable } from '@/components/commissions/CommissionTable';
import { CommissionSettings } from '@/components/commissions/CommissionSettings';
import { useCommissions, useCommissionSummary, useCommissionSettings } from '@/hooks/useCommissions';
import { exportToCSV } from '@/utils/formatters';

export function Commissions() {
  const { data: commissions, isLoading: commissionsLoading } = useCommissions();
  const { data: summary, isLoading: summaryLoading } = useCommissionSummary();
  const { data: settings, isLoading: settingsLoading } = useCommissionSettings();

  const handleExportCSV = () => {
    if (!commissions || commissions.length === 0) return;

    const csvData = commissions.map((c) => ({
      'Doctor Name': c.doctorName,
      'Order ID': c.orderId,
      'Order Total': c.orderTotal,
      'Commission Rate (%)': c.commissionRate,
      'Commission Amount': c.commissionAmount,
      Status: c.status,
      'Date Created': c.dateCreated,
      'Date Paid': c.datePaid ?? '',
    }));

    exportToCSV(csvData as Record<string, unknown>[], `commissions-export-${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commissions"
        description="Track and manage doctor commissions"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={!commissions || commissions.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <CommissionOverview summary={summary} isLoading={summaryLoading} />

      <Tabs defaultValue="per-doctor" className="space-y-4">
        <TabsList>
          <TabsTrigger value="per-doctor">Per-Doctor</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="per-doctor">
          <CommissionTable
            commissions={commissions ?? []}
            isLoading={commissionsLoading}
          />
        </TabsContent>

        <TabsContent value="settings">
          <CommissionSettings
            settings={settings}
            isLoading={settingsLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
