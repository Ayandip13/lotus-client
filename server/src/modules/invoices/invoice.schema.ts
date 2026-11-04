import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const lineItemSchema = z.object({
  description: z.string().trim().min(1, 'Item description is required'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  unit: z.string().trim().min(1, 'Unit is required').optional().default('plates'),
  rate: z.number().min(0, 'Rate cannot be negative'),
  gstRate: z.number().min(0).max(100).optional(),
});

export const businessDetailsSchema = z.object({
  legalName: z.string().trim().min(1, 'Legal business name is required'),
  address: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  gstin: z.string().trim().optional().or(z.literal('')),
  pan: z.string().trim().optional().or(z.literal('')),
  bankName: z.string().trim().optional().or(z.literal('')),
  bankAccountNumber: z.string().trim().optional().or(z.literal('')),
  bankIfsc: z.string().trim().optional().or(z.literal('')),
  bankBranch: z.string().trim().optional().or(z.literal('')),
});

export const createInvoiceSchema = z.object({
  invoiceType: z.enum(['GST', 'NON_GST'], {
    required_error: 'Invoice type must be either GST or NON_GST',
  }),
  invoiceDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid invoice date is required',
  }),
  dueDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid due date format',
    })
    .optional(),
  customerName: z.string().trim().min(2, 'Customer name must be at least 2 characters'),
  customerPhone: z.string().trim().min(5, 'Customer phone must be at least 5 digits'),
  customerEmail: z.string().trim().email('Invalid customer email').optional().or(z.literal('')),
  customerAddress: z.string().trim().optional(),
  customerGstin: z.string().trim().optional().or(z.literal('')),
  relatedEvent: z.string().regex(objectIdRegex, 'Invalid event ID format'),
  items: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  discount: z.number().min(0, 'Discount cannot be negative').optional(),
  isInterState: z.boolean().optional(),
  businessDetails: businessDetailsSchema.optional(),
  notes: z.string().trim().optional(),
});

export const recordInvoicePaymentSchema = z.object({
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Valid payment date is required',
    })
    .optional(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE'], {
    required_error: 'Payment method is required',
  }),
  notes: z.string().trim().optional(),
  idempotencyKey: z.string().trim().min(1).max(100).optional(),
  assignCashToPartner: z.string().regex(objectIdRegex, 'Invalid partner ID format').optional(),
});

export const queryInvoicesSchema = z.object({
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
  invoiceType: z.enum(['GST', 'NON_GST']).optional(),
  paymentStatus: z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE']).optional(),
  relatedEvent: z.string().regex(objectIdRegex, 'Invalid event ID').optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(['invoiceDate', 'grandTotal', 'createdAt']).optional().default('invoiceDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type RecordInvoicePaymentInput = z.infer<typeof recordInvoicePaymentSchema>;
export type QueryInvoicesInput = z.infer<typeof queryInvoicesSchema>;
