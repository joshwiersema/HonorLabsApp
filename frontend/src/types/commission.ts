export interface Commission {
  id: number;
  doctorId: number;
  doctorName: string;
  orderId: number;
  orderTotal: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid';
  dateCreated: string;
  datePaid?: string;
}

export interface CommissionSummary {
  totalPending: number;
  totalApproved: number;
  totalPaid: number;
  totalAmount: number;
  periodStart: string;
  periodEnd: string;
}

export interface CommissionSettings {
  defaultRate: number;
  paymentSchedule: 'monthly' | 'biweekly' | 'weekly';
  minimumPayout: number;
  autoApprove: boolean;
}
