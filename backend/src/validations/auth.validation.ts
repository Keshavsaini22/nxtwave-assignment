import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address format'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    role: z.enum(['ADMIN', 'MANAGER', 'MEMBER'], {
      errorMap: () => ({ message: 'Role must be one of ADMIN, MANAGER, or MEMBER' }),
    }),
    organizationName: z.string().trim().min(2, 'Organization name must be at least 2 characters').optional(),
    organizationId: z.string().uuid('Invalid organization ID format').optional(),
  }).refine((data) => {
    if (data.role === 'ADMIN') {
      return !!data.organizationName;
    }
    return true;
  }, {
    message: 'organizationName is required when registering as an ADMIN',
    path: ['organizationName'],
  }).refine((data) => {
    if (data.role === 'MANAGER' || data.role === 'MEMBER') {
      return !!data.organizationId;
    }
    return true;
  }, {
    message: 'organizationId is required when registering as a MANAGER or MEMBER to join an organization',
    path: ['organizationId'],
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
