import { z } from 'zod';

export const uuidParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid parameter ID format (must be a valid UUID)'),
  }),
});

export const projectMemberParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid project ID format (must be a valid UUID)'),
    userId: z.string().uuid('Invalid user ID format (must be a valid UUID)'),
  }),
});
