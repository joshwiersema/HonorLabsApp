import {
  Store,
  MapPin,
  DollarSign,
  Wifi,
  ExternalLink,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useStoreInfo } from '@/hooks/useSettings';
import { useAuthStore } from '@/stores/authStore';

export function StoreInfoCard() {
  const { data: store, isLoading, isError } = useStoreInfo();
  const storeUrl = useAuthStore((s) => s.storeUrl);

  const isConnected = !!storeUrl;
  const wpAdminUrl = storeUrl ? `${storeUrl}/wp-admin` : null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Store Information</CardTitle>
          <CardDescription>Your WooCommerce store details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !store) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Store Information</CardTitle>
          <CardDescription>Your WooCommerce store details.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load store information. Make sure the backend connection is active.
          </p>
        </CardContent>
      </Card>
    );
  }

  const addressParts = [
    store.address,
    store.city,
    store.state,
    store.postcode,
    store.country,
  ].filter(Boolean);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          Store Information
        </CardTitle>
        <CardDescription>Your WooCommerce store details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Store Name */}
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Store className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">Store Name</p>
            <p className="text-sm text-muted-foreground">{store.name}</p>
          </div>
        </div>

        {/* Address */}
        {addressParts.length > 0 && (
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">Address</p>
              <p className="text-sm text-muted-foreground">
                {addressParts.join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Currency */}
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <DollarSign className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">Currency</p>
            <p className="text-sm text-muted-foreground">
              {store.currency} ({store.currency_symbol})
            </p>
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Wifi className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">Connection</p>
            <Badge variant={isConnected ? 'success' : 'destructive'} className="mt-0.5">
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
        </div>

        {wpAdminUrl && (
          <>
            <Separator />
            <Button variant="outline" size="sm" asChild>
              <a href={wpAdminUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open WordPress Admin
              </a>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
