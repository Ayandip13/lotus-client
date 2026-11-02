import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import { IPartner } from '../partners/partner.model';
import { IEvent } from '../events/event.model';
import { ITransaction } from '../transactions/transaction.model';

export type InvoiceType = 'GST' | 'NON_GST';
export type InvoicePaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE';

export interface IInvoiceLineItem {
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  amountPaise: number;
  gstRate?: number; // e.g. 5, 12, 18
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalAmount: number;
}

export interface IInvoicePaymentRecord {
  amount: number;
  amountPaise: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  transactionRef?: Types.ObjectId | ITransaction;
  notes?: string;
  receivedByPartner: Types.ObjectId | IPartner;
  recordedAt: Date;
}

export interface IBusinessSnapshot {
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

export interface IInvoice extends Document {
  invoiceNumber: string;
  invoiceType: InvoiceType;
  invoiceDate: Date;
  dueDate?: Date;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  customerGstin?: string;
  relatedEvent: Types.ObjectId | IEvent;
  items: IInvoiceLineItem[];
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
  payments: IInvoicePaymentRecord[];
  businessDetails: IBusinessSnapshot;
  notes?: string;
  createdByPartner: Types.ObjectId | IPartner;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedByPartner?: Types.ObjectId | IPartner;
  createdAt: Date;
  updatedAt: Date;
}

const lineItemSchema = new Schema<IInvoiceLineItem>(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0.01 },
    unit: { type: String, required: true, trim: true, default: 'plates' },
    rate: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    amountPaise: { type: Number, required: true },
    gstRate: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
  },
  { _id: true }
);

const paymentRecordSchema = new Schema<IInvoicePaymentRecord>(
  {
    amount: { type: Number, required: true, min: 0.01 },
    amountPaise: { type: Number, required: true },
    paymentDate: { type: Date, required: true, default: Date.now },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE'],
      default: 'CASH',
      required: true,
    },
    transactionRef: { type: Schema.Types.ObjectId, ref: 'Transaction', default: undefined },
    notes: { type: String, trim: true },
    receivedByPartner: { type: Schema.Types.ObjectId, ref: 'Partner', required: true },
    recordedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    invoiceType: {
      type: String,
      enum: ['GST', 'NON_GST'],
      default: 'NON_GST',
      required: true,
      index: true,
    },
    invoiceDate: {
      type: Date,
      required: [true, 'Invoice date is required'],
      default: Date.now,
      index: true,
    },
    dueDate: {
      type: Date,
      default: undefined,
      index: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      index: true,
    },
    customerPhone: {
      type: String,
      required: [true, 'Customer contact number is required'],
      trim: true,
      index: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: undefined,
    },
    customerAddress: {
      type: String,
      trim: true,
      default: undefined,
    },
    customerGstin: {
      type: String,
      trim: true,
      uppercase: true,
      default: undefined,
    },
    relatedEvent: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Associated catering event reference is required'],
      index: true,
    },
    items: {
      type: [lineItemSchema],
      required: true,
      validate: {
        validator: (v: IInvoiceLineItem[]) => Array.isArray(v) && v.length > 0,
        message: 'An invoice must contain at least one line item',
      },
    },
    subtotal: { type: Number, required: true },
    subtotalPaise: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    discountPaise: { type: Number, default: 0 },
    taxDetails: {
      isInterState: { type: Boolean, default: false },
      totalCgst: { type: Number, default: 0 },
      totalSgst: { type: Number, default: 0 },
      totalIgst: { type: Number, default: 0 },
      totalTax: { type: Number, default: 0 },
      totalTaxPaise: { type: Number, default: 0 },
    },
    grandTotal: { type: Number, required: true },
    grandTotalPaise: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    amountPaidPaise: { type: Number, default: 0 },
    remainingDue: { type: Number, required: true },
    remainingDuePaise: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'],
      default: 'UNPAID',
      required: true,
      index: true,
    },
    payments: {
      type: [paymentRecordSchema],
      default: [],
    },
    businessDetails: {
      legalName: { type: String, default: 'Lotus Caterer' },
      address: { type: String, default: 'Salt Lake Sector 5, Kolkata, West Bengal - 700091' },
      phone: { type: String, default: '+91 98300 12345' },
      email: { type: String, default: 'contact@lotuscaterer.internal' },
      gstin: { type: String, default: '19AAACL1234F1Z5' },
      pan: { type: String, default: 'AAACL1234F' },
      bankName: { type: String, default: 'State Bank of India' },
      bankAccountNumber: { type: String, default: '389201948201' },
      bankIfsc: { type: String, default: 'SBIN0001234' },
      bankBranch: { type: String, default: 'Salt Lake Kolkata Branch' },
    },
    notes: {
      type: String,
      trim: true,
      default: undefined,
    },
    createdByPartner: {
      type: Schema.Types.ObjectId,
      ref: 'Partner',
      required: true,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: undefined,
    },
    deletedByPartner: {
      type: Schema.Types.ObjectId,
      ref: 'Partner',
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast due management and event accounting queries
invoiceSchema.index({ isDeleted: 1, paymentStatus: 1, dueDate: 1 });
invoiceSchema.index({ isDeleted: 1, relatedEvent: 1 });
invoiceSchema.index({ isDeleted: 1, customerPhone: 1 });

export const Invoice: Model<IInvoice> =
  mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', invoiceSchema);
