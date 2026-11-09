import { z } from 'zod';

export const createEventSchema = z.object({
  title: z
    .string()
    .trim()
    .max(200, 'Event/booking name must not exceed 200 characters')
    .optional()
    .or(z.literal('')),
  eventDate: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid event date format (must be ISO-8601 date string)',
    }),
  eventDetails: z
    .string()
    .trim()
    .max(2000, 'Event details must not exceed 2000 characters')
    .optional()
    .or(z.literal('')),
  guestName: z
    .string()
    .trim()
    .max(100, 'Guest name must not exceed 100 characters')
    .optional()
    .or(z.literal('')),
  guestPhone: z
    .string()
    .trim()
    .max(20, 'Contact number must not exceed 20 characters')
    .optional()
    .or(z.literal('')),
  guestEmail: z
    .string()
    .trim()
    .email('Invalid email address format')
    .optional()
    .or(z.literal('')),
  guestAddress: z
    .string()
    .trim()
    .max(500, 'Guest address must not exceed 500 characters')
    .optional()
    .or(z.literal('')),
});

export const updateEventSchema = createEventSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one field must be provided for update',
  }
);

export const queryEventsSchema = z.object({
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
  search: z.string().trim().optional(),
  sortBy: z
    .enum(['eventDate', 'createdAt', 'title', 'guestName'])
    .optional()
    .default('eventDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type QueryEventsInput = z.infer<typeof queryEventsSchema>;
