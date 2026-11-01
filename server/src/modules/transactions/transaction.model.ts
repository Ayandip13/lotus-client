import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import { IPartner } from '../partners/partner.model';
import { IEvent } from '../events/event.model';

export type TransactionType = 'BUSINESS_INCOME' | 'PARTNER_CONTRIBUTION' | 'BUSINESS_EXPENSE';
export type PaymentSource = 'COMMON_BUSINESS' | 'PARTNER_PERSONAL';

export interface ITransactionAttachment {
  url: string;
  publicId: string;
  fileSize: number;
  mimeType: string;
  originalName?: string;
  uploadedByPartner: Types.ObjectId | IPartner;
  uploadedAt: Date;
}

export interface ITransaction extends Document {
  transactionType: TransactionType;
  amount: number; // In Rupees (e.g. 1500.50)
  amountPaise: number; // In integer paise to guarantee zero floating point arithmetic error (e.g. 150050)
  transactionDate: Date;
  description: string;
  paymentSource: PaymentSource;
  partner?: Types.ObjectId | IPartner; // Contributing or paying partner
  relatedEvent?: Types.ObjectId | IEvent; // Linked catering assignment
  attachments: ITransactionAttachment[];
  createdByPartner: Types.ObjectId | IPartner;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedByPartner?: Types.ObjectId | IPartner;
  createdAt: Date;
  updatedAt: Date;
}

const attachmentSchema = new Schema<ITransactionAttachment>(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      trim: true,
    },
    uploadedByPartner: {
      type: Schema.Types.ObjectId,
      ref: 'Partner',
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const transactionSchema = new Schema<ITransaction>(
  {
    transactionType: {
      type: String,
      enum: {
        values: ['BUSINESS_INCOME', 'PARTNER_CONTRIBUTION', 'BUSINESS_EXPENSE'],
        message: '{VALUE} is not a valid transaction type',
      },
      required: [true, 'Transaction type is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
      set: (val: number) => Math.round(val * 100) / 100, // Enforce 2 decimal places
    },
    amountPaise: {
      type: Number,
      required: true,
      index: true,
    },
    transactionDate: {
      type: Date,
      required: [true, 'Transaction date is required'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Transaction description is required'],
      trim: true,
      minlength: [2, 'Description must be at least 2 characters'],
      maxlength: [1000, 'Description must not exceed 1000 characters'],
    },
    paymentSource: {
      type: String,
      enum: {
        values: ['COMMON_BUSINESS', 'PARTNER_PERSONAL'],
        message: '{VALUE} is not a valid payment source',
      },
      default: 'COMMON_BUSINESS',
      required: true,
      index: true,
    },
    partner: {
      type: Schema.Types.ObjectId,
      ref: 'Partner',
      default: undefined,
      index: true,
    },
    relatedEvent: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      default: undefined,
      index: true,
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    createdByPartner: {
      type: Schema.Types.ObjectId,
      ref: 'Partner',
      required: [true, 'Creator partner identity is required'],
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

// Pre-save hook to ensure amountPaise always equals Math.round(amount * 100)
transactionSchema.pre('validate', function (next) {
  if (this.amount !== undefined) {
    this.amountPaise = Math.round(this.amount * 100);
  }
  next();
});

// Compound indexes for financial queries and date ranges
transactionSchema.index({ isDeleted: 1, transactionDate: -1 });
transactionSchema.index({ isDeleted: 1, transactionType: 1, transactionDate: -1 });
transactionSchema.index({ isDeleted: 1, partner: 1, transactionDate: -1 });
transactionSchema.index({ isDeleted: 1, relatedEvent: 1 });

export const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', transactionSchema);
