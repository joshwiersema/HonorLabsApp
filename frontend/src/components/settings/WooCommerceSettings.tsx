import { useState, useCallback } from 'react';
import { ExternalLink, AlertCircle, Loader2, Settings2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SettingField } from '@/components/settings/SettingField';
import { useWooCommerceSettings, useUpdateSetting } from '@/hooks/useSettings';
import { useAuthStore } from '@/stores/authStore';
import type { WcSetting, WcSettingsGroupId } from '@/types/settings';
import { IMPORTANT_SETTINGS, GROUP_LABELS } from '@/types/settings';

const GROUP_ORDER: WcSettingsGroupId[] = [
  'general',
  'products',
  'tax',
  'shipping',
  'checkout',
  'email',
];

/** Filter settings to only the important ones for a group. */
function filterImportant(
  settings: WcSetting[],
  groupId: string,
): WcSetting[] {
  const ids = IMPORTANT_SETTINGS[groupId];
  if (!ids || ids.length === 0) return [];
  // Maintain the order defined in IMPORTANT_SETTINGS
  return ids
    .map((id) => settings.find((s) => s.id === id))
    .filter((s): s is WcSetting => s !== undefined);
}

export function WooCommerceSettings() {
  const { data: groups, isLoading, isError, error } = useWooCommerceSettings();
  const updateMutation = useUpdateSetting();
  const siteUrl = useAuthStore((s) => s.storeUrl);

  // Local edits: { [settingId]: localValue }
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  // Track which setting is currently saving
  const [savingId, setSavingId] = useState<string | null>(null);
  // Track recently saved for brief checkmark display
  const [justSavedId, setJustSavedId] = useState<string | null>(null);

  const wpAdminUrl = siteUrl ? `${siteUrl}/wp-admin` : null;

  const handleChange = useCallback((settingId: string, value: string) => {
    setLocalValues((prev) => ({ ...prev, [settingId]: value }));
  }, []);

  const handleSave = useCallback(
    async (groupId: string, setting: WcSetting) => {
      const val = localValues[setting.id];
      if (val === undefined || val === setting.value) return;

      setSavingId(setting.id);
      try {
        await updateMutation.mutateAsync({
          groupId,
          settingId: setting.id,
          value: val,
        });
        // Clear local edit on success
        setLocalValues((prev) => {
          const next = { ...prev };
          delete next[setting.id];
          return next;
        });
        setJustSavedId(setting.id);
        setTimeout(() => setJustSavedId(null), 2500);
      } catch {
        // Error is handled by react-query; mutation.error is available
      } finally {
        setSavingId(null);
      }
    },
    [localValues, updateMutation],
  );

  // Loading skeleton
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            WooCommerce Settings
          </CardTitle>
          <CardDescription>Loading store settings...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-64" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            WooCommerce Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Failed to load WooCommerce settings
              </p>
              <p className="text-xs text-muted-foreground">
                {error instanceof Error
                  ? error.message
                  : 'An unknown error occurred. Check your backend connection.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!groups) return null;

  // Build available tabs
  const availableGroups = GROUP_ORDER.filter(
    (gid) => groups[gid] && groups[gid].length > 0,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          WooCommerce Settings
        </CardTitle>
        <CardDescription>
          Manage your store configuration. Changes are saved individually per
          field.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {availableGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No settings groups available.
          </p>
        ) : (
          <Tabs defaultValue={availableGroups[0]}>
            <TabsList className="mb-4 flex w-full flex-wrap gap-1">
              {availableGroups.map((gid) => (
                <TabsTrigger key={gid} value={gid}>
                  {GROUP_LABELS[gid]}
                </TabsTrigger>
              ))}
            </TabsList>

            {availableGroups.map((gid) => {
              const importantSettings = filterImportant(groups[gid], gid);
              const isComplexGroup =
                gid === 'shipping' || gid === 'checkout';
              const hasImportant = importantSettings.length > 0;

              return (
                <TabsContent key={gid} value={gid}>
                  {hasImportant ? (
                    <div className="divide-y">
                      {importantSettings.map((setting) => {
                        const localVal = localValues[setting.id];
                        const currentVal =
                          localVal !== undefined ? localVal : setting.value;
                        const isChanged =
                          localVal !== undefined && localVal !== setting.value;

                        return (
                          <SettingField
                            key={setting.id}
                            setting={setting}
                            value={currentVal}
                            onChange={(v) => handleChange(setting.id, v)}
                            onSave={() => handleSave(gid, setting)}
                            isSaving={savingId === setting.id}
                            isChanged={isChanged}
                            justSaved={justSavedId === setting.id}
                          />
                        );
                      })}
                    </div>
                  ) : isComplexGroup ? (
                    <ComplexGroupFallback
                      groupId={gid}
                      wpAdminUrl={wpAdminUrl}
                    />
                  ) : (
                    <p className="py-4 text-sm text-muted-foreground">
                      No settings available for this group.
                    </p>
                  )}

                  {/* Always offer a link for complex groups even when some settings shown */}
                  {isComplexGroup && hasImportant && wpAdminUrl && (
                    <>
                      <Separator className="my-4" />
                      <ManageInWpLink
                        groupId={gid}
                        wpAdminUrl={wpAdminUrl}
                      />
                    </>
                  )}

                  {/* Mutation error display */}
                  {updateMutation.isError && (
                    <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
                      <p className="text-xs text-destructive">
                        Failed to save setting. Please try again.
                      </p>
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ComplexGroupFallback({
  groupId,
  wpAdminUrl,
}: {
  groupId: string;
  wpAdminUrl: string | null;
}) {
  const settingsPath: Record<string, string> = {
    shipping: '/admin.php?page=wc-settings&tab=shipping',
    checkout: '/admin.php?page=wc-settings&tab=checkout',
  };

  const path = settingsPath[groupId] ?? '/admin.php?page=wc-settings';
  const url = wpAdminUrl ? `${wpAdminUrl}${path}` : null;

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Settings2 className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">
          {GROUP_LABELS[groupId as keyof typeof GROUP_LABELS]} settings are
          managed in WordPress
        </p>
        <p className="text-xs text-muted-foreground">
          These settings involve complex configuration best handled in the
          WordPress admin panel.
        </p>
      </div>
      {url && (
        <Button variant="outline" size="sm" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in WordPress Admin
          </a>
        </Button>
      )}
    </div>
  );
}

function ManageInWpLink({
  groupId,
  wpAdminUrl,
}: {
  groupId: string;
  wpAdminUrl: string;
}) {
  const settingsPath: Record<string, string> = {
    shipping: '/admin.php?page=wc-settings&tab=shipping',
    checkout: '/admin.php?page=wc-settings&tab=checkout',
  };
  const path = settingsPath[groupId] ?? '/admin.php?page=wc-settings';

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Loader2 className="hidden h-3 w-3" />
      <span>Need more options?</span>
      <a
        href={`${wpAdminUrl}${path}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
      >
        Manage in WordPress Admin
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
