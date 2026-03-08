import { Sun, Moon, Monitor } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSettingsStore } from '@/stores/settingsStore';
import { ConnectionSettings } from '@/components/settings/ConnectionSettings';
import { StoreInfoCard } from '@/components/settings/StoreInfo';
import { WooCommerceSettings } from '@/components/settings/WooCommerceSettings';

export function Settings() {
  const { theme, setTheme } = useSettingsStore();

  const themeOptions = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your store connection, WooCommerce configuration, and app
          preferences.
        </p>
      </div>

      <Tabs defaultValue="connection" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="store">Store</TabsTrigger>
          <TabsTrigger value="woocommerce">WooCommerce</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        {/* Connection Tab */}
        <TabsContent value="connection">
          <ConnectionSettings />
        </TabsContent>

        {/* Store Tab */}
        <TabsContent value="store">
          <StoreInfoCard />
        </TabsContent>

        {/* WooCommerce Tab */}
        <TabsContent value="woocommerce">
          <WooCommerceSettings />
        </TabsContent>

        {/* Display Tab */}
        <TabsContent value="display">
          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
              <CardDescription>
                Customize the appearance of the dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm font-medium">Theme</span>
                <div className="mt-2 flex gap-2">
                  {themeOptions.map(({ value, label, icon: Icon }) => (
                    <Button
                      key={value}
                      variant={theme === value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme(value)}
                      className="flex-1"
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">
                  Honor Labs Control
                </span>{' '}
                v1.0.0
              </p>
              <p>
                Business control dashboard for the Honor Labs supplement
                marketplace.
              </p>
              <p>
                Connects eye care doctors with patients through a B2B/B2C
                platform.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
