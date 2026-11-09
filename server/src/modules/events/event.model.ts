import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import { IPartner } from '../partners/partner.model';

export interface IEvent extends Document {
  title: string;
  eventDate: Date;
  eventDetails?: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  guestAddress?: string;
  createdByPartner: Types.ObjectId | IPartner;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedByPartner?: Types.ObjectId | IPartner;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      trim: true,
      default: 'Catering Event',
      maxlength: [200, 'Event/booking name must not exceed 200 characters'],
    },
    eventDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    eventDetails: {
      type: String,
      trim: true,
      maxlength: [2000, 'Event details must not exceed 2000 characters'],
      default: undefined,
    },
    guestName: {
      type: String,
      trim: true,
      default: 'Guest',
      maxlength: [100, 'Guest name must not exceed 100 characters'],
      index: true,
    },
    guestPhone: {
      type: String,
      trim: true,
      default: '',
      maxlength: [20, 'Contact number must not exceed 20 characters'],
      index: true,
    },
    guestEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: undefined,
    },
    guestAddress: {
      type: String,
      trim: true,
      maxlength: [500, 'Guest address must not exceed 500 characters'],
      default: undefined,
    },
    createdByPartner: {
      type: Schema.Types.ObjectId,
      ref: 'Partner',
      required: [true, 'Creator partner reference is required'],
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

// Compound indexes for searching and sorting
eventSchema.index({ isDeleted: 1, eventDate: -1 });
eventSchema.index({ isDeleted: 1, createdAt: -1 });

export const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>('Event', eventSchema);
