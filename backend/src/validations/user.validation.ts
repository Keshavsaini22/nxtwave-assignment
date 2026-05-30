import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address format'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    role: z.enum(['MANAGER', 'MEMBER'], {
      errorMap: () => ({ message: 'Provisioned role must be either MANAGER or MEMBER' }),
    }),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    role: z.enum(['MANAGER', 'MEMBER'], {
      errorMap: () => ({ message: 'Role must be either MANAGER or MEMBER' }),
    }).optional(),
    isBlocked: z.boolean({
      invalid_type_error: 'isBlocked must be a boolean value',
    }).optional(),
  }).refine(
    (data) => data.role !== undefined || data.isBlocked !== undefined,
    { message: 'At least one field (role or isBlocked) must be provided for update' }
  ),
});
