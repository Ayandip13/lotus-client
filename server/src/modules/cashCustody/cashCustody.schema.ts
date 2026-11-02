import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const cashMovementTypeEnum = z.enum([
  'CASH_INCOME_ASSIGNED',
  'PARTNER_HANDOVER',
  'BANK_DEPOSIT',
  'BANK_WITHDRAWAL',
  'CASH_EXPENSE',
  'OPENING_BALANCE',
]);

export const createCashMovementSchema = z
  .object({
    movementType: cashMovementTypeEnum,
    amount: z.number().positive('Amount must be greater than zero'),
    movementDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Valid date is required' })
      .optional(),
    fromPartner: z.string().regex(objectIdRegex, 'Invalid from partner ID').optional(),
    toPartner: z.string().regex(objectIdRegex, 'Invalid to partner ID').optional(),
    description: z.string().trim().min(2, 'Description must be at least 2 characters'),
    relatedEvent: z.string().regex(objectIdRegex, 'Invalid event ID').optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    // 1. Handover requires both fromPartner and toPartner, and they cannot be the same
    if (data.movementType === 'PARTNER_HANDOVER') {
      if (!data.fromPartner) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['fromPartner'],
          message: 'From partner is required for handover',
        });
      }
      if (!data.toPartner) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['toPartner'],
          message: 'To partner is required for handover',
        });
      }
      if (data.fromPartner && data.toPartner && data.fromPartner === data.toPartner) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['toPartner'],
          message: 'From partner and To partner cannot be the same person',
        });
      }
    }

    // 2. Bank deposit requires fromPartner
    if (data.movementType === 'BANK_DEPOSIT' && !data.fromPartner) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fromPartner'],
        message: 'Depositing partner is required',
      });
    }

    // 3. Bank withdrawal requires toPartner
    if (data.movementType === 'BANK_WITHDRAWAL' && !data.toPartner) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['toPartner'],
        message: 'Receiving partner is required for bank withdrawal',
      });
    }

    // 4. Cash expense requires fromPartner
    if (data.movementType === 'CASH_EXPENSE' && !data.fromPartner) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fromPartner'],
        message: 'Spending partner is required for cash expense',
      });
    }

    // 5. Cash income assigned or opening balance requires toPartner
    if (
      (data.movementType === 'CASH_INCOME_ASSIGNED' || data.movementType === 'OPENING_BALANCE') &&
      !data.toPartner
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['toPartner'],
        message: 'Receiving partner is required',
      });
    }
  });

export const queryCashMovementsSchema = z.object({
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
  movementType: cashMovementTypeEnum.optional(),
  partner: z.string().regex(objectIdRegex, 'Invalid partner ID').optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(['movementDate', 'amount', 'createdAt']).optional().default('movementDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateCashMovementInput = z.infer<typeof createCashMovementSchema>;
export type QueryCashMovementsInput = z.infer<typeof queryCashMovementsSchema>;
