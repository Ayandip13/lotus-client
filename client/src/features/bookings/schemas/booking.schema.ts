import { z } from 'zod';

export const bookingFormSchema = z.object({
  title: z
    .string()
    .trim()
    .max(200, 'Event / Booking name cannot exceed 200 characters')
    .optional()
    .or(z.literal('')),
  eventDate: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Please provide a valid date',
    }),
  eventDetails: z
    .string()
    .trim()
    .max(2000, 'Details cannot exceed 2000 characters')
    .optional()
    .or(z.literal('')),
  guestName: z
    .string()
    .trim()
    .max(100, 'Guest name cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),
  guestPhone: z
    .string()
    .trim()
    .max(20, 'Contact phone number cannot exceed 20 characters')
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
    .max(500, 'Address cannot exceed 500 characters')
    .optional()
    .or(z.literal('')),
});

export type BookingFormSchema = z.infer<typeof bookingFormSchema>;
