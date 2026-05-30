import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service.js';
import { TaskStatus, Priority } from '@prisma/client';

export class TaskController {
  public static async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const { title, description, priority, projectId, assigneeId, dueDate } = req.body;

      const task = await TaskService.createTask(orgId, {
        title,
        description,
        priority: priority as Priority,
        projectId,
        assigneeId,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });

      res.status(201).json({
        status: 201,
        message: 'Task created successfully.',
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const userId = req.user!.userId;
      const role = req.user!.role;

      const page = req.query.page as unknown as number;
      const limit = req.query.limit as unknown as number;
      const status = req.query.status as TaskStatus | undefined;
      const priority = req.query.priority as Priority | undefined;
      const assigneeId = req.query.assigneeId as string | undefined;
      const projectId = req.query.projectId as string | undefined;

      const { items, total } = await TaskService.listTasks(orgId, userId, role, {
        page,
        limit,
        status,
        priority,
        assigneeId,
        projectId,
      });

      res.status(200).json({
        status: 200,
        message: 'Tasks fetched successfully.',
        data: {
          items,
          meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const userId = req.user!.userId;
      const role = req.user!.role;
      const taskId = req.params.id;

      const task = await TaskService.getTask(orgId, userId, role, taskId);

      res.status(200).json({
        status: 200,
        message: 'Task details fetched successfully.',
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const taskId = req.params.id;
      const { title, description, priority, assigneeId, dueDate } = req.body;

      const updated = await TaskService.updateTask(orgId, taskId, {
        title,
        description,
        priority: priority as Priority,
        assigneeId,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
      });

      res.status(200).json({
        status: 200,
        message: 'Task updated successfully.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateTaskStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const userId = req.user!.userId;
      const role = req.user!.role;
      const taskId = req.params.id;
      const { status } = req.body;

      const updated = await TaskService.updateTaskStatus(orgId, userId, role, taskId, status as TaskStatus);

      res.status(200).json({
        status: 200,
        message: 'Task status transitioned successfully.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const taskId = req.params.id;

      await TaskService.deleteTask(orgId, taskId);

      res.status(200).json({
        status: 200,
        message: 'Task deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}
