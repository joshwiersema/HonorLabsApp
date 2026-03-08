import { useState, useEffect } from 'react';
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
import { useRequestLogo } from '@/hooks/useOrders';
import type { WcOrder } from '@/types/order';
import { Image, CheckCircle2, Loader2 } from 'lucide-react';

interface RequestLogoModalProps {
  order: WcOrder | null;
  open: boolean;
  onClose: () => void;
}

function getDefaultMessage(order: WcOrder): string {
  const customerName = `${order.billing.first_name} ${order.billing.last_name}`.trim();
  return `Hi ${customerName},

Thank you for your order (#${order.number})!

We're preparing your custom supplement bottles and need your logo to proceed. Could you please reply with:

1. Your logo in high resolution (PNG or SVG preferred, minimum 300 DPI)
2. Any specific color requirements or brand guidelines

Best regards,
The Honor Labs Team`;
}

export function RequestLogoModal({ order, open, onClose }: RequestLogoModalProps) {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const requestLogo = useRequestLogo();

  useEffect(() => {
    if (order && open) {
      setMessage(getDefaultMessage(order));
      setSent(false);
    }
  }, [order, open]);

  const handleSend = () => {
    if (!order) return;
    requestLogo.mutate(
      { id: order.id, message },
      {
        onSuccess: () => {
          setSent(true);
        },
      }
    );
  };

  const handleClose = () => {
    setSent(false);
    requestLogo.reset();
    onClose();
  };

  const customerName = order
    ? `${order.billing.first_name} ${order.billing.last_name}`.trim()
    : '';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            Request Logo from Customer
          </DialogTitle>
          <DialogDescription>
            Send an email to <span className="font-medium text-foreground">{customerName}</span> requesting
            their logo for order <span className="font-mono font-medium text-foreground">#{order?.number}</span>.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/30">
              <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Email Sent Successfully</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              The logo request has been emailed to {customerName}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo-message">Email Message</Label>
              <Textarea
                id="logo-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                This message will be sent to the customer at{' '}
                <span className="font-medium">{order?.billing.email}</span>.
              </p>
            </div>

            {requestLogo.isError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                Failed to send email. Please try again.
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {sent ? (
            <Button onClick={handleClose}>Close</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={!message.trim() || requestLogo.isPending}
              >
                {requestLogo.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Email'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
