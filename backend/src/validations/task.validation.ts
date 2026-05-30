import { z } from 'zod';
import { Priority, TaskStatus } from '@prisma/client';

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, 'Task title must be at least 1 character long'),
    description: z.string().trim().optional(),
    priority: z.nativeEnum(Priority).optional().default(Priority.LOW),
    projectId: z.string().uuid('Invalid project ID format'),
    assigneeId: z.string().uuid('Invalid assignee user ID format').optional(),
    dueDate: z.string().datetime({ message: 'dueDate must be a valid ISO 8601 datetime string' }).optional().transform(val => val ? new Date(val) : undefined),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, 'Task title must be at least 1 character long').optional(),
    description: z.string().trim().optional(),
    priority: z.nativeEnum(Priority).optional(),
    assigneeId: z.string().uuid('Invalid assignee user ID format').nullable().optional(),
    dueDate: z.string().datetime({ message: 'dueDate must be a valid ISO 8601 datetime string' }).nullable().optional().transform(val => val ? new Date(val) : undefined),
  }).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for task update' }
  ),
});

export const updateTaskStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(TaskStatus, {
      errorMap: () => ({ message: 'Invalid status transition value' }),
    }),
  }),
});

export const listTasksQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 1),
    limit: z.string().optional().transform(val => val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(Priority).optional(),
    assigneeId: z.string().uuid('Invalid assignee filter format').optional(),
    projectId: z.string().uuid('Invalid project filter format').optional(),
  }),
});
