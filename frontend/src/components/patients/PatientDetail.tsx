import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  Mail,
  Calendar,
  ShoppingCart,
  DollarSign,
  Stethoscope,
  Tag,
} from 'lucide-react';
import { usePatient } from '@/hooks/usePatients';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface PatientDetailProps {
  patientId: number | null;
  open: boolean;
  onClose: () => void;
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-32" />
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

export function PatientDetail({ patientId, open, onClose }: PatientDetailProps) {
  const { data, isLoading } = usePatient(patientId);

  const patient = data?.patient;
  const orders = data?.orders ?? [];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isLoading ? (
              <Skeleton className="h-6 w-48" />
            ) : patient ? (
              `${patient.first_name} ${patient.last_name}`
            ) : (
              'Patient Details'
            )}
          </DialogTitle>
          <DialogDescription>
            Patient profile and activity overview
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <DetailSkeleton />
        ) : patient ? (
          <div className="space-y-5">
            {/* Contact Info */}
            <div className="space-y-3">
              <InfoRow icon={Mail} label="Email" value={patient.email} />
              <InfoRow
                icon={Calendar}
                label="Registered"
                value={patient.date_created ? formatDate(patient.date_created) : '--'}
              />
            </div>

            <Separator />

            {/* Linked Doctor */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">
                Doctor Link
              </h4>
              <InfoRow
                icon={Stethoscope}
                label="Linked Doctor"
                value={
                  patient.linked_doctor_name || (
                    <span className="italic text-muted-foreground">
                      No doctor linked
                    </span>
                  )
                }
              />
              {patient.referral_code_used && (
                <InfoRow
                  icon={Tag}
                  label="Referral Code Used"
                  value={
                    <span className="font-mono text-xs rounded bg-muted px-1.5 py-0.5">
                      {patient.referral_code_used}
                    </span>
                  }
                />
              )}
            </div>

            <Separator />

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Total Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold tabular-nums">
                    {patient.orders_count}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <DollarSign className="h-3.5 w-3.5" />
                    Total Spent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold tabular-nums">
                    {formatCurrency(patient.total_spent)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Order History */}
            {orders.length > 0 ? (
              <>
                <Separator />
                <div>
                  <h4 className="mb-3 text-sm font-semibold">
                    Order History ({orders.length})
                  </h4>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono font-medium">
                              #{order.number}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={order.status} />
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(parseFloat(order.total))}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(order.date_created)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground/30" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No orders yet
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">
              Patient not found.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
