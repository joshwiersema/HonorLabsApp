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
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  formatCurrency,
  formatDateTime,
} from '@/utils/formatters';
import { ORDER_STATUSES } from '@/utils/constants';
import { useUpdateOrderStatus, useAddOrderNote } from '@/hooks/useOrders';
import { RequestLogoModal } from './RequestLogoModal';
import type { WcOrder, OrderStatus } from '@/types/order';
import {
  Calendar,
  CreditCard,
  Image,
  Loader2,
  Mail,
  MapPin,
  MessageSquarePlus,
  Package,
  Phone,
  Send,
  User,
  CheckCircle2,
} from 'lucide-react';

interface OrderDetailProps {
  order: WcOrder | null;
  isLoading: boolean;
  open: boolean;
  onClose: () => void;
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export function OrderDetail({ order, isLoading, open, onClose }: OrderDetailProps) {
  const [newStatus, setNewStatus] = useState<string>('');
  const [noteText, setNoteText] = useState('');
  const [isCustomerNote, setIsCustomerNote] = useState(false);
  const [noteSent, setNoteSent] = useState(false);
  const [showEmailCompose, setShowEmailCompose] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);

  const updateStatus = useUpdateOrderStatus();
  const addNote = useAddOrderNote();

  const handleStatusUpdate = () => {
    if (!order || !newStatus || newStatus === order.status) return;
    updateStatus.mutate(
      { id: order.id, status: newStatus as OrderStatus },
      {
        onSuccess: () => {
          setNewStatus('');
        },
      }
    );
  };

  const handleAddNote = () => {
    if (!order || !noteText.trim()) return;
    addNote.mutate(
      { id: order.id, note: noteText.trim(), customerNote: isCustomerNote },
      {
        onSuccess: () => {
          setNoteText('');
          setIsCustomerNote(false);
          setNoteSent(true);
          setTimeout(() => setNoteSent(false), 3000);
        },
      }
    );
  };

  const handleSendEmail = () => {
    if (!order || !emailMessage.trim()) return;
    addNote.mutate(
      { id: order.id, note: emailMessage.trim(), customerNote: true },
      {
        onSuccess: () => {
          setEmailMessage('');
          setEmailSent(true);
          setTimeout(() => {
            setEmailSent(false);
            setShowEmailCompose(false);
          }, 2000);
        },
      }
    );
  };

  const handleClose = () => {
    setNoteText('');
    setIsCustomerNote(false);
    setNoteSent(false);
    setShowEmailCompose(false);
    setEmailMessage('');
    setEmailSent(false);
    setNewStatus('');
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {isLoading || !order ? (
            <>
              <DialogHeader>
                <DialogTitle>Loading Order...</DialogTitle>
                <DialogDescription>Please wait while we fetch the order details.</DialogDescription>
              </DialogHeader>
              <DetailSkeleton />
            </>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-xl">Order #{order.number}</DialogTitle>
                  <StatusBadge status={order.status} />
                </div>
                <DialogDescription className="flex items-center gap-4 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDateTime(order.date_created)}
                  </span>
                  {order.payment_method_title && (
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5" />
                      {order.payment_method_title}
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-2">
                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setShowLogoModal(true)}
                    className="gap-2"
                  >
                    <Image className="h-4 w-4" />
                    Request Logo
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowEmailCompose(!showEmailCompose);
                      setEmailSent(false);
                    }}
                    className="gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email Customer
                  </Button>
                </div>

                {/* Email Compose (inline) */}
                {showEmailCompose && (
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Send className="h-4 w-4 text-primary" />
                        Email to {order.billing.first_name} {order.billing.last_name}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {order.billing.email}
                      </span>
                    </div>
                    {emailSent ? (
                      <div className="flex items-center gap-2 py-3 text-sm text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        Email sent successfully!
                      </div>
                    ) : (
                      <>
                        <Textarea
                          value={emailMessage}
                          onChange={(e) => setEmailMessage(e.target.value)}
                          placeholder="Type your message..."
                          rows={4}
                        />
                        {addNote.isError && (
                          <p className="text-xs text-red-600 dark:text-red-400">
                            Failed to send. Please try again.
                          </p>
                        )}
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowEmailCompose(false);
                              setEmailMessage('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSendEmail}
                            disabled={!emailMessage.trim() || addNote.isPending}
                          >
                            {addNote.isPending ? (
                              <>
                                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="mr-1 h-3.5 w-3.5" />
                                Send
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Customer & Shipping Info */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Billing Info */}
                  <div className="rounded-lg border p-4">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Billing Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">
                        {order.billing.first_name} {order.billing.last_name}
                      </p>
                      {order.billing.company && (
                        <p className="text-muted-foreground">{order.billing.company}</p>
                      )}
                      <p className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {order.billing.email}
                      </p>
                      {order.billing.phone && (
                        <p className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {order.billing.phone}
                        </p>
                      )}
                      <p className="flex items-start gap-1.5 text-muted-foreground">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>
                          {order.billing.address_1}
                          {order.billing.address_2 && `, ${order.billing.address_2}`}
                          <br />
                          {order.billing.city}, {order.billing.state}{' '}
                          {order.billing.postcode}
                          <br />
                          {order.billing.country}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Shipping Info */}
                  <div className="rounded-lg border p-4">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      Shipping Address
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">
                        {order.shipping.first_name} {order.shipping.last_name}
                      </p>
                      {order.shipping.company && (
                        <p className="text-muted-foreground">
                          {order.shipping.company}
                        </p>
                      )}
                      <p className="flex items-start gap-1.5 text-muted-foreground">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>
                          {order.shipping.address_1}
                          {order.shipping.address_2 &&
                            `, ${order.shipping.address_2}`}
                          <br />
                          {order.shipping.city}, {order.shipping.state}{' '}
                          {order.shipping.postcode}
                          <br />
                          {order.shipping.country}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Line Items */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold">Line Items</h4>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.line_items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {item.image?.src && (
                                  <img
                                    src={item.image.src}
                                    alt={item.name}
                                    className="h-10 w-10 rounded-md border object-cover"
                                  />
                                )}
                                <div>
                                  <p className="text-sm font-medium">{item.name}</p>
                                  {item.sku && (
                                    <p className="text-xs text-muted-foreground">
                                      SKU: {item.sku}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.price)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(parseFloat(item.total))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <Separator />

                {/* Order Totals */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold">Order Totals</h4>
                  <div className="rounded-lg border p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>
                          {formatCurrency(
                            order.line_items.reduce(
                              (sum, item) => sum + parseFloat(item.total),
                              0
                            )
                          )}
                        </span>
                      </div>
                      {parseFloat(order.discount_total) > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Discount</span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            -{formatCurrency(parseFloat(order.discount_total))}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>
                          {formatCurrency(parseFloat(order.shipping_total))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Tax</span>
                        <span>
                          {formatCurrency(parseFloat(order.total_tax))}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-sm font-semibold">Total</span>
                        <span className="text-lg font-bold">
                          {formatCurrency(parseFloat(order.total))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Note */}
                {order.customer_note && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="mb-2 text-sm font-semibold">Customer Note</h4>
                      <p className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
                        {order.customer_note}
                      </p>
                    </div>
                  </>
                )}

                <Separator />

                {/* Update Status */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold">Update Status</h4>
                  <div className="flex items-center gap-3">
                    <Select
                      value={newStatus || order.status}
                      onValueChange={setNewStatus}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.entries(ORDER_STATUSES) as [
                            OrderStatus,
                            { label: string; color: string },
                          ][]
                        ).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={handleStatusUpdate}
                      disabled={
                        !newStatus ||
                        newStatus === order.status ||
                        updateStatus.isPending
                      }
                    >
                      {updateStatus.isPending ? 'Updating...' : 'Update'}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Add Note Section */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold flex items-center gap-2">
                    <MessageSquarePlus className="h-4 w-4 text-muted-foreground" />
                    Add Note
                  </h4>
                  <div className="space-y-3">
                    <Textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add a note to this order..."
                      rows={3}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="customer-note"
                          checked={isCustomerNote}
                          onCheckedChange={setIsCustomerNote}
                        />
                        <Label
                          htmlFor="customer-note"
                          className="text-sm cursor-pointer"
                        >
                          Send to customer
                        </Label>
                        {isCustomerNote && (
                          <span className="text-xs text-muted-foreground">
                            (will be emailed to {order.billing.email})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {noteSent && (
                          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Note added
                            {isCustomerNote ? ' & emailed' : ''}
                          </span>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleAddNote}
                          disabled={!noteText.trim() || addNote.isPending}
                        >
                          {addNote.isPending ? (
                            <>
                              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            'Add Note'
                          )}
                        </Button>
                      </div>
                    </div>
                    {addNote.isError && !showEmailCompose && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Failed to add note. Please try again.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Logo Request Modal */}
      <RequestLogoModal
        order={order}
        open={showLogoModal}
        onClose={() => setShowLogoModal(false)}
      />
    </>
  );
}
