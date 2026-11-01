import { PaginationMetadata } from '../../../types';

export type TransactionType = 'BUSINESS_INCOME' | 'PARTNER_CONTRIBUTION' | 'BUSINESS_EXPENSE';
export type PaymentSource = 'COMMON_BUSINESS' | 'PARTNER_PERSONAL';

export interface TransactionAttachment {
  _id: string;
  url: string;
  publicId: string;
  fileSize: number;
  mimeType: string;
  originalName?: string;
  uploadedByPartner?: {
    _id: string;
    name: string;
  } | string;
  uploadedAt: string;
}

export interface PartnerReference {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  status?: string;
}

export interface EventReference {
  _id: string;
  title: string;
  eventDate: string;
  guestName: string;
  guestPhone: string;
}

export interface Transaction {
  _id: string;
  transactionType: TransactionType;
  amount: number;
  amountPaise: number;
  transactionDate: string;
  description: string;
  paymentSource: PaymentSource;
  partner?: PartnerReference;
  relatedEvent?: EventReference;
  attachments: TransactionAttachment[];
  createdByPartner: PartnerReference;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionListResponse {
  items: Transaction[];
  pagination: PaginationMetadata;
}

export interface TransactionQueryParams {
  page?: number;
  limit?: number;
  transactionType?: TransactionType;
  paymentSource?: PaymentSource;
  partner?: string;
  relatedEvent?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: 'transactionDate' | 'createdAt' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

export interface TransactionFormData {
  transactionType: TransactionType;
  amount: number;
  transactionDate: string;
  description: string;
  paymentSource?: PaymentSource;
  partner?: string;
  relatedEvent?: string;
}

export interface FinancialSummary {
  totalBusinessIncome: number;
  totalBusinessExpenses: number;
  totalPartnerContributions: number;
  commonBusinessBalance: number;
  commonAccountExpenses: number;
  partnerPersonallyPaidExpenses: number;
  currency: string;
}

export interface PartnerFinancialSummary {
  partnerId: string;
  partnerName: string;
  partnerEmail?: string;
  partnerPhone?: string;
  totalContributions: number;
  totalPersonallyPaidExpenses: number;
  transactionCount: number;
}

export interface DateWiseFinancialResult {
  targetDate: string;
  totalTransactions: number;
  totalExpenses: number;
  commonAccountExpenses: number;
  partnerPaidExpenses: number;
  totalIncome: number;
  totalContributions: number;
  transactions: Transaction[];
}
