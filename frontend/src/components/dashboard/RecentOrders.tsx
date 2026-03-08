import { ArrowRight, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { ORDER_STATUSES } from '@/utils/constants';
import type { WcOrder, OrderStatus } from '@/types/order';

interface RecentOrdersProps {
  orders: WcOrder[] | undefined;
  isLoading: boolean;
  onViewOrder: (id: number) => void;
}

function OrderRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex flex-col gap-1.5">
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        <div className="h-3 w-28 animate-pulse rounded bg-muted" />
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        <div className="h-5 w-20 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

function getStatusVariant(
  status: OrderStatus
): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' {
  const mapping = ORDER_STATUSES[status];
  if (!mapping) return 'default';
  return mapping.color as 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

export function RecentOrders({ orders, isLoading, onViewOrder }: RecentOrdersProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
        <Button variant="ghost" size="sm" className="h-8 gap-1" asChild>
          <Link to="/orders">
            View All
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <OrderRowSkeleton key={i} />
            ))}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Package className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              No recent orders
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Orders will appear here when placed.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {orders.slice(0, 10).map((order) => {
              const statusConfig = ORDER_STATUSES[order.status];
              return (
                <button
                  key={order.id}
                  onClick={() => onViewOrder(order.id)}
                  className="flex w-full items-center justify-between py-3 text-left transition-colors hover:bg-muted/50 -mx-2 px-2 rounded-md"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      #{order.number}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {order.billing.first_name} {order.billing.last_name}
                    </p>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-1">
                    <span className="text-sm font-semibold">
                      {formatCurrency(parseFloat(order.total))}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusVariant(order.status)}>
                        {statusConfig?.label ?? order.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(order.date_created)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
