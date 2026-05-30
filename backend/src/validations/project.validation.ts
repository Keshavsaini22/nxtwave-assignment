import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().trim().min(3, 'Project name must be at least 3 characters long'),
    description: z.string().trim().optional(),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().trim().min(3, 'Project name must be at least 3 characters long').optional(),
    description: z.string().trim().optional(),
  }).refine(
    (data) => data.name !== undefined || data.description !== undefined,
    { message: 'At least one field (name or description) must be provided for update' }
  ),
});

export const assignMemberSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID format'),
  }),
});
