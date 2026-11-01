import { z } from 'zod';

export const bookingFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Event / Booking name must be at least 2 characters')
    .max(200, 'Event / Booking name cannot exceed 200 characters'),
  eventDate: z
    .string()
    .min(1, 'Please select the scheduled event date')
    .refine((val) => !isNaN(Date.parse(val)), {
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
    .min(2, 'Guest / Client name must be at least 2 characters')
    .max(100, 'Guest name cannot exceed 100 characters'),
  guestPhone: z
    .string()
    .trim()
    .min(5, 'Contact number must be at least 5 digits')
    .max(20, 'Contact number cannot exceed 20 digits'),
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
