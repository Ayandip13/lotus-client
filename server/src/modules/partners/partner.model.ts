import mongoose, { Document, Schema, Model } from 'mongoose';

export type PartnerStatus = 'ACTIVE' | 'INACTIVE';

export interface IPartner extends Document {
  name: string;
  email?: string;
  phone?: string;
  status: PartnerStatus;
  createdAt: Date;
  updatedAt: Date;
}

const partnerSchema = new Schema<IPartner>(
  {
    name: {
      type: String,
      required: [true, 'Partner name is required'],
      trim: true,
      minlength: [2, 'Partner name must be at least 2 characters long'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: undefined,
    },
    phone: {
      type: String,
      trim: true,
      default: undefined,
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'INACTIVE'],
        message: '{VALUE} is not a supported partner status',
      },
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Optional sparse index for email if present
partnerSchema.index({ email: 1 }, { unique: true, sparse: true });

export const Partner: Model<IPartner> =
  mongoose.models.Partner || mongoose.model<IPartner>('Partner', partnerSchema);
