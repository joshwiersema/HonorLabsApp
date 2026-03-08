import { useState, useCallback } from 'react';
import {
  Copy,
  Check,
  Users,
  ShoppingCart,
  DollarSign,
  Mail,
  Calendar,
  Building2,
  Stethoscope,
  Hash,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { useDoctor } from '@/hooks/useDoctors';
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters';

interface DoctorProfileProps {
  doctorId: number | null;
  open: boolean;
  onClose: () => void;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'approved':
    case 'active':
      return <Badge variant="success">Active</Badge>;
    case 'pending':
      return <Badge variant="warning">Pending</Badge>;
    case 'rejected':
    case 'inactive':
      return <Badge variant="destructive">Inactive</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function CopyReferralCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div className="flex items-center gap-2">
      <code className="rounded-md bg-muted px-3 py-1.5 text-sm font-mono font-semibold">
        {code}
      </code>
      <Button
        variant="outline"
        size="sm"
        className="h-8"
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <Check className="mr-1 h-3.5 w-3.5 text-emerald-500" />
            Copied
          </>
        ) : (
          <>
            <Copy className="mr-1 h-3.5 w-3.5" />
            Copy
          </>
        )}
      </Button>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}

function StatCard({ icon, label, value, className }: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function DoctorProfile({ doctorId, open, onClose }: DoctorProfileProps) {
  const { data, isLoading } = useDoctor(doctorId);

  const doctor = data?.doctor;
  const patients = data?.patients ?? [];
  const orders = data?.orders ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {doctor
              ? `Dr. ${doctor.first_name} ${doctor.last_name}`
              : 'Doctor Profile'}
          </DialogTitle>
          <DialogDescription>
            {doctor ? 'Doctor profile and performance overview' : 'Loading...'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <ProfileSkeleton />
        ) : doctor ? (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold">
                    Dr. {doctor.first_name} {doctor.last_name}
                  </h3>
                  {doctor.doctor_status && getStatusBadge(doctor.doctor_status)}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {doctor.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined {formatDate(doctor.date_created)}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Info Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {doctor.npi_number && (
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">NPI:</span>
                  <span className="font-mono font-medium">{doctor.npi_number}</span>
                </div>
              )}
              {doctor.practice_name && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Practice:</span>
                  <span className="font-medium">{doctor.practice_name}</span>
                </div>
              )}
              {doctor.specialty && (
                <div className="flex items-center gap-2 text-sm">
                  <Stethoscope className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Specialty:</span>
                  <span className="font-medium">{doctor.specialty}</span>
                </div>
              )}
            </div>

            {/* Referral Code */}
            {doctor.referral_code && (
              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  Referral Code
                </p>
                <CopyReferralCode code={doctor.referral_code} />
              </div>
            )}

            <Separator />

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatCard
                icon={<ShoppingCart className="h-5 w-5 text-muted-foreground" />}
                label="Total Orders"
                value={formatNumber(doctor.orders_count)}
              />
              <StatCard
                icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
                label="Total Spent"
                value={formatCurrency(doctor.total_spent)}
              />
              <StatCard
                icon={<Users className="h-5 w-5 text-muted-foreground" />}
                label="Patients"
                value={formatNumber(patients.length)}
              />
            </div>

            {/* Recent Orders */}
            {orders.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="mb-3 text-sm font-semibold">
                    Recent Orders ({orders.length})
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
            )}

            {/* Linked Patients */}
            {patients.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="mb-3 text-sm font-semibold">
                    Linked Patients ({patients.length})
                  </h4>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Referral Code</TableHead>
                          <TableHead className="text-right">Orders</TableHead>
                          <TableHead className="text-right">Total Spent</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {patients.map((patient) => (
                          <TableRow key={patient.id}>
                            <TableCell className="font-medium">
                              {patient.first_name} {patient.last_name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {patient.email}
                            </TableCell>
                            <TableCell>
                              {patient.referral_code_used ? (
                                <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                                  {patient.referral_code_used}
                                </code>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(patient.orders_count)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(patient.total_spent)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {patient.date_created
                                ? formatDate(patient.date_created)
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}

            {patients.length === 0 && (
              <>
                <Separator />
                <div className="flex flex-col items-center py-8 text-center">
                  <Users className="h-8 w-8 text-muted-foreground/30" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No patients linked to this doctor yet.
                  </p>
                </div>
              </>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
