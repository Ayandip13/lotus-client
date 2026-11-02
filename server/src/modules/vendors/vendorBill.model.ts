import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import { IVendor } from './vendor.model';
import { IEvent } from '../events/event.model';
import { IPartner } from '../partners/partner.model';
import { ITransaction, ITransactionAttachment } from '../transactions/transaction.model';

export type VendorBillStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
export type VendorPaymentSource = 'COMMON_BUSINESS' | 'PARTNER_PERSONAL';

export interface IVendorPaymentRecord {
  amount: number;
  amountPaise: number;
  paymentDate: Date;
  paymentSource: VendorPaymentSource;
  paidByPartner: Types.ObjectId | IPartner;
  transactionRef?: Types.ObjectId | ITransaction;
  notes?: string;
  idempotencyKey?: string;
  recordedAt: Date;
}

export interface IVendorBill extends Document {
  billNumber?: string;
  vendor: Types.ObjectId | IVendor;
  relatedEvent?: Types.ObjectId | IEvent;
  billDate: Date;
  dueDate?: Date;
  description: string;
  totalAmount: number;
  totalAmountPaise: number;
  paidAmount: number;
  paidAmountPaise: number;
  remainingAmount: number;
  remainingAmountPaise: number;
  status: VendorBillStatus;
  paymentHistory: IVendorPaymentRecord[];
  attachments: ITransactionAttachment[];
  createdByPartner: Types.ObjectId | IPartner;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedByPartner?: Types.ObjectId | IPartner;
  createdAt: Date;
  updatedAt: Date;
}

const vendorPaymentSchema = new Schema<IVendorPaymentRecord>(
  {
    amount: { type: Number, required: true, min: 0.01 },
    amountPaise: { type: Number, required: true },
    paymentDate: { type: Date, required: true, default: Date.now },
    paymentSource: {
      type: String,
      enum: ['COMMON_BUSINESS', 'PARTNER_PERSONAL'],
      default: 'COMMON_BUSINESS',
      required: true,
    },
    paidByPartner: { type: Schema.Types.ObjectId, ref: 'Partner', required: true },
    transactionRef: { type: Schema.Types.ObjectId, ref: 'Transaction', default: undefined },
    notes: { type: String, trim: true },
    idempotencyKey: { type: String, trim: true, default: undefined },
    recordedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const vendorBillSchema = new Schema<IVendorBill>(
  {
    billNumber: {
      type: String,
      trim: true,
      default: undefined,
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: [true, 'Vendor reference is required'],
      index: true,
    },
    relatedEvent: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      default: undefined,
      index: true,
    },
    billDate: {
      type: Date,
      required: [true, 'Bill date is required'],
      default: Date.now,
      index: true,
    },
    dueDate: {
      type: Date,
      default: undefined,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Purchase/bill description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total payable amount is required'],
      min: [0.01, 'Total amount must be greater than zero'],
    },
    totalAmountPaise: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    paidAmountPaise: {
      type: Number,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      required: true,
    },
    remainingAmountPaise: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'],
      default: 'UNPAID',
      required: true,
      index: true,
    },
    paymentHistory: {
      type: [vendorPaymentSchema],
      default: [],
    },
    attachments: {
      type: [Schema.Types.Mixed] as any,
      default: [],
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

vendorBillSchema.index({ isDeleted: 1, status: 1, dueDate: 1 });
vendorBillSchema.index({ isDeleted: 1, relatedEvent: 1 });
vendorBillSchema.index({ isDeleted: 1, vendor: 1 });

export const VendorBill: Model<IVendorBill> =
  mongoose.models.VendorBill || mongoose.model<IVendorBill>('VendorBill', vendorBillSchema);
