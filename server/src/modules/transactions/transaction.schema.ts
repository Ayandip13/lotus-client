import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createTransactionSchema = z
  .object({
    transactionType: z.enum(['BUSINESS_INCOME', 'PARTNER_CONTRIBUTION', 'BUSINESS_EXPENSE'], {
      required_error: 'Transaction type is required',
    }),
    amount: z
      .number({ required_error: 'Amount is required' })
      .positive('Amount must be greater than zero')
      .max(100000000, 'Amount exceeds allowable maximum threshold'),
    transactionDate: z
      .string({ required_error: 'Transaction date is required' })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid transaction date format (must be ISO-8601 date string)',
      }),
    description: z
      .string({ required_error: 'Description is required' })
      .trim()
      .min(2, 'Description must be at least 2 characters')
      .max(1000, 'Description must not exceed 1000 characters'),
    paymentSource: z
      .enum(['COMMON_BUSINESS', 'PARTNER_PERSONAL'])
      .optional()
      .default('COMMON_BUSINESS'),
    partner: z
      .string()
      .regex(objectIdRegex, 'Invalid partner ID format')
      .optional()
      .or(z.literal('')),
    relatedEvent: z
      .string()
      .regex(objectIdRegex, 'Invalid related event ID format')
      .optional()
      .or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    // 1. If PARTNER_CONTRIBUTION, partner reference is mandatory
    if (data.transactionType === 'PARTNER_CONTRIBUTION') {
      if (!data.partner || data.partner.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['partner'],
          message: 'Contributing partner must be identified for partner contributions',
        });
      }
    }

    // 2. If BUSINESS_EXPENSE with PARTNER_PERSONAL payment source, paying partner is mandatory
    if (data.transactionType === 'BUSINESS_EXPENSE' && data.paymentSource === 'PARTNER_PERSONAL') {
      if (!data.partner || data.partner.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['partner'],
          message: 'Paying partner must be identified when expense is paid personally',
        });
      }
    }
  });

export const updateTransactionSchema = z
  .object({
    amount: z.number().positive('Amount must be greater than zero').optional(),
    transactionDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid transaction date format',
      })
      .optional(),
    description: z
      .string()
      .trim()
      .min(2, 'Description must be at least 2 characters')
      .max(1000, 'Description must not exceed 1000 characters')
      .optional(),
    paymentSource: z.enum(['COMMON_BUSINESS', 'PARTNER_PERSONAL']).optional(),
    partner: z
      .string()
      .regex(objectIdRegex, 'Invalid partner ID format')
      .optional()
      .or(z.literal(''))
      .or(z.null()),
    relatedEvent: z
      .string()
      .regex(objectIdRegex, 'Invalid related event ID format')
      .optional()
      .or(z.literal(''))
      .or(z.null()),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const queryTransactionsSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val >= 1, {
      message: 'Page must be a positive integer',
    }),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 100, {
      message: 'Limit must be between 1 and 100',
    }),
  transactionType: z.enum(['BUSINESS_INCOME', 'PARTNER_CONTRIBUTION', 'BUSINESS_EXPENSE']).optional(),
  paymentSource: z.enum(['COMMON_BUSINESS', 'PARTNER_PERSONAL']).optional(),
  partner: z.string().regex(objectIdRegex, 'Invalid partner ID format').optional(),
  relatedEvent: z.string().regex(objectIdRegex, 'Invalid event ID format').optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(['transactionDate', 'createdAt', 'amount']).optional().default('transactionDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type QueryTransactionsInput = z.infer<typeof queryTransactionsSchema>;
