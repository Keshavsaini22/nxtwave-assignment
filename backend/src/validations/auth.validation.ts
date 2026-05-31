import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address format'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    role: z.literal('ADMIN', {
      errorMap: () => ({ message: 'Self-registration is restricted strictly to ADMIN workspace creators' }),
    }),
    organizationName: z.string().trim().min(2, 'Organization name must be at least 2 characters'),
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address format'),
    password: z.string().min(1, 'Password is required'),
  })
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'refreshToken is required'),
  })
});
