import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import { IPartner } from '../partners/partner.model';
import { IEvent } from '../events/event.model';
import { ITransaction } from '../transactions/transaction.model';

export type CashMovementType =
  | 'CASH_INCOME_ASSIGNED'
  | 'PARTNER_HANDOVER'
  | 'BANK_DEPOSIT'
  | 'BANK_WITHDRAWAL'
  | 'CASH_EXPENSE'
  | 'OPENING_BALANCE';

export type AccountChannel = 'BANK' | 'PARTNER_CUSTODY' | 'CUSTOMER' | 'EXPENSE';

export interface ICashMovement extends Document {
  movementType: CashMovementType;
  amount: number;
  amountPaise: number;
  movementDate: Date;
  fromPartner?: Types.ObjectId | IPartner;
  toPartner?: Types.ObjectId | IPartner;
  sourceAccount: AccountChannel;
  destinationAccount: AccountChannel;
  description: string;
  relatedEvent?: Types.ObjectId | IEvent;
  relatedTransaction?: Types.ObjectId | ITransaction;
  createdByPartner: Types.ObjectId | IPartner;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedByPartner?: Types.ObjectId | IPartner;
  createdAt: Date;
  updatedAt: Date;
}

const cashMovementSchema = new Schema<ICashMovement>(
  {
    movementType: {
      type: String,
      enum: [
        'CASH_INCOME_ASSIGNED',
        'PARTNER_HANDOVER',
        'BANK_DEPOSIT',
        'BANK_WITHDRAWAL',
        'CASH_EXPENSE',
        'OPENING_BALANCE',
      ],
      required: [true, 'Movement type is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    amountPaise: {
      type: Number,
      required: true,
      index: true,
    },
    movementDate: {
      type: Date,
      required: [true, 'Movement date is required'],
      default: Date.now,
      index: true,
    },
    fromPartner: {
      type: Schema.Types.ObjectId,
      ref: 'Partner',
      default: undefined,
      index: true,
    },
    toPartner: {
      type: Schema.Types.ObjectId,
      ref: 'Partner',
      default: undefined,
      index: true,
    },
    sourceAccount: {
      type: String,
      enum: ['BANK', 'PARTNER_CUSTODY', 'CUSTOMER', 'EXPENSE'],
      required: true,
    },
    destinationAccount: {
      type: String,
      enum: ['BANK', 'PARTNER_CUSTODY', 'CUSTOMER', 'EXPENSE'],
      required: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    relatedEvent: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      default: undefined,
      index: true,
    },
    relatedTransaction: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
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

// Pre-validate hook to calculate amountPaise
cashMovementSchema.pre('validate', function (next) {
  if (this.amount !== undefined) {
    this.amountPaise = Math.round(this.amount * 100);
  }
  next();
});

cashMovementSchema.index({ isDeleted: 1, movementDate: -1 });
cashMovementSchema.index({ isDeleted: 1, fromPartner: 1 });
cashMovementSchema.index({ isDeleted: 1, toPartner: 1 });

export const CashMovement: Model<ICashMovement> =
  mongoose.models.CashMovement ||
  mongoose.model<ICashMovement>('CashMovement', cashMovementSchema);
