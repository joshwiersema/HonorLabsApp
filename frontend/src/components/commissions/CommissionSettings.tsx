import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Info, DollarSign, Calendar, ToggleLeft } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import type { CommissionSettings as CommissionSettingsType } from '@/types/commission';

interface CommissionSettingsProps {
  settings: CommissionSettingsType | undefined;
  isLoading: boolean;
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

const SCHEDULE_LABELS: Record<string, string> = {
  monthly: 'Monthly',
  biweekly: 'Bi-Weekly',
  weekly: 'Weekly',
};

export function CommissionSettings({ settings, isLoading }: CommissionSettingsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Commission Settings</CardTitle>
          <CardDescription>
            View current commission configuration. Settings are managed on the
            WordPress side.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SettingsSkeleton />
          ) : settings ? (
            <div className="space-y-6">
              {/* Default Rate */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Default Commission Rate
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={settings.defaultRate}
                    readOnly
                    className="max-w-[120px] tabular-nums bg-muted"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>

              <Separator />

              {/* Payment Schedule */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Payment Schedule
                </Label>
                <Badge variant="outline" className="text-sm">
                  {SCHEDULE_LABELS[settings.paymentSchedule] ?? settings.paymentSchedule}
                </Badge>
              </div>

              <Separator />

              {/* Minimum Payout */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Minimum Payout
                </Label>
                <p className="text-sm font-medium tabular-nums">
                  {formatCurrency(settings.minimumPayout)}
                </p>
              </div>

              <Separator />

              {/* Auto-Approve */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                    Auto-Approve Commissions
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically approve new commissions
                  </p>
                </div>
                <Switch checked={settings.autoApprove} disabled />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              Unable to load commission settings.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Read-only notice */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardContent className="flex items-start gap-3 pt-5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium">Read-Only View</p>
            <p className="mt-1 text-blue-700/80 dark:text-blue-400/80">
              Commission settings are managed through the WordPress admin panel.
              Changes made there will be reflected here automatically.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
