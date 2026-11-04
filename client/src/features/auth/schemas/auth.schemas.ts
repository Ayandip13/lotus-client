import { z } from 'zod';

export const loginFormSchema = z.object({
  username: z
    .string({ required_error: 'Username is required' })
    .trim()
    .min(3, 'Username must be at least 3 characters long'),
  password: z
    .string({ required_error: 'Password is required' })
    .trim()
    .min(6, 'Password must be at least 6 characters long'),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
