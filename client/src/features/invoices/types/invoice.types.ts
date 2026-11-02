export type InvoiceType = 'GST' | 'NON_GST';
export type InvoicePaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  amountPaise: number;
  gstRate?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalAmount: number;
}

export interface InvoicePaymentRecord {
  amount: number;
  amountPaise: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionRef?: any;
  notes?: string;
  receivedByPartner: {
    _id: string;
    name: string;
    email?: string;
  };
  recordedAt: string;
}

export interface BusinessSnapshot {
  legalName: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  pan?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankBranch?: string;
}

export interface InvoiceItem {
  _id: string;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  invoiceDate: string;
  dueDate?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  customerGstin?: string;
  relatedEvent: {
    _id: string;
    title: string;
    eventDate: string;
    eventType?: string;
    guestCount?: number;
    location?: string;
  };
  items: InvoiceLineItem[];
  subtotal: number;
  subtotalPaise: number;
  discount: number;
  discountPaise: number;
  taxDetails?: {
    isInterState: boolean;
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    totalTax: number;
    totalTaxPaise: number;
  };
  grandTotal: number;
  grandTotalPaise: number;
  amountPaid: number;
  amountPaidPaise: number;
  remainingDue: number;
  remainingDuePaise: number;
  paymentStatus: InvoicePaymentStatus;
  payments: InvoicePaymentRecord[];
  businessDetails: BusinessSnapshot;
  notes?: string;
  createdByPartner: {
    _id: string;
    name: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoicePayload {
  invoiceType: InvoiceType;
  invoiceDate: string;
  dueDate?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  customerGstin?: string;
  relatedEvent: string;
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    rate: number;
    gstRate?: number;
  }>;
  discount?: number;
  isInterState?: boolean;
  businessDetails?: Partial<BusinessSnapshot>;
  notes?: string;
}
