import { Badge } from '@/components/ui/badge';
import { ORDER_STATUSES } from '@/utils/constants';
import type { VariantProps } from 'class-variance-authority';
import type { badgeVariants } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = ORDER_STATUSES[status as keyof typeof ORDER_STATUSES];

  if (!statusConfig) {
    return <Badge variant="outline">{status}</Badge>;
  }

  return (
    <Badge variant={statusConfig.color as VariantProps<typeof badgeVariants>['variant']}>
      {statusConfig.label}
    </Badge>
  );
}
