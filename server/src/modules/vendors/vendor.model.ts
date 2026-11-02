import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import { IPartner } from '../partners/partner.model';

export type VendorCategory =
  | 'GROCERIES_SPICES'
  | 'MEAT_FISH'
  | 'VEGETABLES'
  | 'DAIRY_SWEETS'
  | 'CROCKERY_UTENSILS'
  | 'LABOR_STAFF'
  | 'DECOR_FLORAL'
  | 'TRANSPORTATION'
  | 'COOKING_GAS'
  | 'OTHER';

export interface IVendor extends Document {
  name: string;
  phone: string;
  email?: string;
  category: VendorCategory;
  address?: string;
  bankDetails?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdByPartner: Types.ObjectId | IPartner;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const vendorSchema = new Schema<IVendor>(
  {
    name: {
      type: String,
      required: [true, 'Vendor name is required'],
      trim: true,
      minlength: [2, 'Vendor name must be at least 2 characters'],
      maxlength: [100, 'Vendor name cannot exceed 100 characters'],
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Vendor phone number is required'],
      trim: true,
      minlength: [5, 'Contact number must be at least 5 digits'],
      maxlength: [20, 'Contact number cannot exceed 20 digits'],
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: undefined,
    },
    category: {
      type: String,
      enum: [
        'GROCERIES_SPICES',
        'MEAT_FISH',
        'VEGETABLES',
        'DAIRY_SWEETS',
        'CROCKERY_UTENSILS',
        'LABOR_STAFF',
        'DECOR_FLORAL',
        'TRANSPORTATION',
        'COOKING_GAS',
        'OTHER',
      ],
      default: 'OTHER',
      required: true,
      index: true,
    },
    address: {
      type: String,
      trim: true,
      maxlength: [300, 'Address cannot exceed 300 characters'],
      default: undefined,
    },
    bankDetails: {
      type: String,
      trim: true,
      default: undefined,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      required: true,
      index: true,
    },
    createdByPartner: {
      type: Schema.Types.ObjectId,
      ref: 'Partner',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

vendorSchema.index({ isDeleted: 1, name: 1 });

export const Vendor: Model<IVendor> =
  mongoose.models.Vendor || mongoose.model<IVendor>('Vendor', vendorSchema);
