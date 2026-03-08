import { useState, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  UserCheck,
  Clock,
  Mail,
  Building2,
  Hash,
  Stethoscope,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useDoctors, useApproveDoctor, useRejectDoctor } from '@/hooks/useDoctors';
import { formatDate } from '@/utils/formatters';
import type { Doctor } from '@/types/doctor';

function LoadingSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-8 w-32" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function DoctorApplications() {
  const { data, isLoading } = useDoctors();
  const approveMutation = useApproveDoctor();
  const rejectMutation = useRejectDoctor();

  const [confirmAction, setConfirmAction] = useState<{
    mode: 'approve' | 'reject';
    doctor: Doctor;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const doctors = data?.doctors ?? [];
  const pendingDoctors = doctors.filter(
    (d) => d.doctor_status === 'pending'
  );

  const openConfirm = useCallback((mode: 'approve' | 'reject', doctor: Doctor) => {
    setError(null);
    approveMutation.reset();
    rejectMutation.reset();
    setConfirmAction({ mode, doctor });
  }, [approveMutation, rejectMutation]);

  const closeConfirm = useCallback(() => {
    setConfirmAction(null);
    setError(null);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!confirmAction) return;
    const { mode, doctor } = confirmAction;
    setError(null);
    try {
      if (mode === 'approve') {
        await approveMutation.mutateAsync(doctor.id);
      } else {
        await rejectMutation.mutateAsync(doctor.id);
      }
      setConfirmAction(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(msg);
    }
  }, [confirmAction, approveMutation, rejectMutation]);

  const isActing = approveMutation.isPending || rejectMutation.isPending;

  return (
    <div className="space-y-4">
      {!isLoading && (
        <div className="flex items-center gap-3">
          <Badge variant={pendingDoctors.length > 0 ? 'warning' : 'outline'} className="text-sm px-3 py-1">
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            {pendingDoctors.length} pending
          </Badge>
        </div>
      )}

      {!isLoading && pendingDoctors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/30">
              <UserCheck className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="mt-5 text-lg font-semibold">All caught up!</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              No pending doctor applications to review. New applications will appear
              here when doctors register through your site.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>NPI</TableHead>
                <TableHead>Practice</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <LoadingSkeleton />
              ) : (
                pendingDoctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-muted-foreground" />
                        {doctor.first_name} {doctor.last_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {doctor.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {doctor.npi_number ? (
                        <div className="flex items-center gap-1.5">
                          <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-mono text-sm">{doctor.npi_number}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {doctor.practice_name ? (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {doctor.practice_name}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{doctor.specialty || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {doctor.date_created ? formatDate(doctor.date_created) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => openConfirm('approve', doctor)}
                          disabled={isActing}
                        >
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                          onClick={() => openConfirm('reject', doctor)}
                          disabled={isActing}
                        >
                          <XCircle className="mr-1 h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmAction !== null} onOpenChange={(o) => { if (!o && !isActing) closeConfirm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.mode === 'approve' ? 'Approve Doctor' : 'Reject Doctor'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.mode === 'approve'
                ? `Approve ${confirmAction.doctor.first_name} ${confirmAction.doctor.last_name} as a doctor? This sets their B2BKing account to approved with wholesale access.`
                : `Reject ${confirmAction?.doctor.first_name} ${confirmAction?.doctor.last_name}'s application? They will not be granted doctor privileges.`}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeConfirm} disabled={isActing}>
              Cancel
            </Button>
            <Button
              variant={confirmAction?.mode === 'approve' ? 'default' : 'destructive'}
              onClick={handleConfirm}
              disabled={isActing}
            >
              {isActing ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  {confirmAction?.mode === 'approve' ? 'Approving...' : 'Rejecting...'}
                </>
              ) : confirmAction?.mode === 'approve' ? (
                <>
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  Approve
                </>
              ) : (
                <>
                  <XCircle className="mr-1.5 h-4 w-4" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
