import { z } from 'zod';

export const transactionFormSchema = z
  .object({
    transactionType: z.enum(['BUSINESS_INCOME', 'PARTNER_CONTRIBUTION', 'BUSINESS_EXPENSE'], {
      required_error: 'Please select a transaction type',
    }),
    amount: z
      .number({ invalid_type_error: 'Please enter a valid numeric amount' })
      .positive('Amount must be greater than zero')
      .max(100000000, 'Amount exceeds allowable maximum threshold'),
    transactionDate: z
      .string()
      .min(1, 'Please select the transaction date')
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date format',
      }),
    description: z
      .string()
      .trim()
      .min(2, 'Description must be at least 2 characters')
      .max(1000, 'Description cannot exceed 1000 characters'),
    paymentSource: z.enum(['COMMON_BUSINESS', 'PARTNER_PERSONAL']).default('COMMON_BUSINESS'),
    partner: z.string().optional(),
    relatedEvent: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.transactionType === 'PARTNER_CONTRIBUTION') {
      if (!data.partner || data.partner.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['partner'],
          message: 'Contributing partner must be identified',
        });
      }
    }

    if (data.transactionType === 'BUSINESS_EXPENSE' && data.paymentSource === 'PARTNER_PERSONAL') {
      if (!data.partner || data.partner.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['partner'],
          message: 'Please identify the partner who personally paid this expense',
        });
      }
    }
  });

export type TransactionFormSchema = z.infer<typeof transactionFormSchema>;
