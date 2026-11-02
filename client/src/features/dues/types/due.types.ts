export interface CustomerDueItem {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  customerName: string;
  customerPhone: string;
  relatedEvent?: {
    id: string;
    title: string;
    eventDate: string;
  };
  totalBillAmount: number;
  amountReceived: number;
  remainingDue: number;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  paymentCount: number;
  isOverdue: boolean;
}

export interface CustomerDuesSummary {
  totalCustomerDue: number;
  totalInvoiced: number;
  totalCollected: number;
  overdueCount: number;
  overdueAmount: number;
  dues: CustomerDueItem[];
}

export interface VendorItem {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  category: string;
  address?: string;
  bankDetails?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface VendorDueItem {
  billId: string;
  billNumber?: string;
  billDate: string;
  dueDate?: string;
  vendorId: string;
  vendorName: string;
  vendorPhone: string;
  category: string;
  relatedEvent?: {
    id: string;
    title: string;
    eventDate: string;
  };
  description: string;
  totalPayableAmount: number;
  amountPaid: number;
  remainingAmount: number;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  paymentCount: number;
  isOverdue: boolean;
}

export interface VendorDuesSummary {
  totalVendorDue: number;
  totalPayable: number;
  totalPaid: number;
  overdueCount: number;
  overdueAmount: number;
  dues: VendorDueItem[];
}
