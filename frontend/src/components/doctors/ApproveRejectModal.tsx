import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { DoctorApplication } from '@/types/doctor';

interface ApproveRejectModalProps {
  mode: 'approve' | 'reject';
  application: DoctorApplication | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  isPending: boolean;
}

export function ApproveRejectModal({
  mode,
  application,
  open,
  onClose,
  onConfirm,
  isPending,
}: ApproveRejectModalProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (mode === 'reject') {
      onConfirm(reason || undefined);
    } else {
      onConfirm();
    }
    setReason('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setReason('');
      onClose();
    }
  };

  if (!application) return null;

  const fullName = `${application.firstName} ${application.lastName}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'approve' ? 'Approve Application' : 'Reject Application'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'approve'
              ? `Are you sure you want to approve ${fullName}'s doctor application? They will gain access to doctor features including referral codes.`
              : `Are you sure you want to reject ${fullName}'s doctor application?`}
          </DialogDescription>
        </DialogHeader>

        {mode === 'reject' && (
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason (optional)</Label>
            <Textarea
              id="reject-reason"
              placeholder="Provide a reason for rejection..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant={mode === 'approve' ? 'default' : 'destructive'}
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending
              ? mode === 'approve'
                ? 'Approving...'
                : 'Rejecting...'
              : mode === 'approve'
                ? 'Approve'
                : 'Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
