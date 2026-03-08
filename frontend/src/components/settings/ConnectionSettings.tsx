import { LogOut, ExternalLink } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/authStore';

export function ConnectionSettings() {
  const username = useAuthStore((s) => s.username);
  const storeUrl = useAuthStore((s) => s.storeUrl);
  const logout = useAuthStore((s) => s.logout);

  const wpAdminUrl = storeUrl ? `${storeUrl}/wp-admin` : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account & Connection</CardTitle>
        <CardDescription>
          Your account and WooCommerce store connection.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Signed in as</span>
          <span className="text-sm text-muted-foreground">{username}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Store</span>
          <Badge variant="success">Connected</Badge>
        </div>

        {storeUrl && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Site URL</span>
            <span className="text-sm text-muted-foreground">{storeUrl}</span>
          </div>
        )}

        <Separator />

        <div className="flex items-center gap-2">
          <Button variant="destructive" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>

          {wpAdminUrl && (
            <Button variant="outline" size="default" asChild>
              <a href={wpAdminUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                WordPress Admin
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
