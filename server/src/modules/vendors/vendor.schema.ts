import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const vendorCategoryEnum = z.enum([
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
]);

export const createVendorSchema = z.object({
  name: z.string().trim().min(2, 'Vendor name must be at least 2 characters').max(100),
  phone: z.string().trim().min(5, 'Phone must be at least 5 digits').max(20),
  email: z.string().trim().email('Invalid email').optional().or(z.literal('')),
  category: vendorCategoryEnum.default('OTHER'),
  address: z.string().trim().optional(),
  bankDetails: z.string().trim().optional(),
});

export const updateVendorSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(5).max(20).optional(),
  email: z.string().trim().email().optional().or(z.literal('')),
  category: vendorCategoryEnum.optional(),
  address: z.string().trim().optional(),
  bankDetails: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const createVendorBillSchema = z.object({
  billNumber: z.string().trim().optional(),
  vendor: z.string().regex(objectIdRegex, 'Invalid vendor ID format'),
  relatedEvent: z.string().regex(objectIdRegex, 'Invalid event ID format').optional().or(z.literal('')),
  billDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid bill date is required',
  }),
  dueDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid due date format',
    })
    .optional(),
  description: z.string().trim().min(2, 'Description must be at least 2 characters'),
  totalAmount: z.number().positive('Total bill amount must be greater than zero'),
});

export const recordVendorPaymentSchema = z.object({
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Valid payment date is required',
    })
    .optional(),
  paymentSource: z.enum(['COMMON_BUSINESS', 'PARTNER_PERSONAL']).optional().default('COMMON_BUSINESS'),
  paidByPartner: z.string().regex(objectIdRegex, 'Invalid partner ID format').optional(),
  notes: z.string().trim().optional(),
  idempotencyKey: z.string().trim().min(1).max(100).optional(),
  deductFromPartnerCash: z.boolean().optional(),
});

export const queryVendorBillsSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val >= 1, { message: 'Page must be >= 1' }),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 100, { message: 'Limit must be 1-100' }),
  vendor: z.string().regex(objectIdRegex, 'Invalid vendor ID').optional(),
  relatedEvent: z.string().regex(objectIdRegex, 'Invalid event ID').optional(),
  status: z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(['billDate', 'totalAmount', 'createdAt']).optional().default('billDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
export type CreateVendorBillInput = z.infer<typeof createVendorBillSchema>;
export type RecordVendorPaymentInput = z.infer<typeof recordVendorPaymentSchema>;
export type QueryVendorBillsInput = z.infer<typeof queryVendorBillsSchema>;
