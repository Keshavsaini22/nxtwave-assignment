import prisma from '../config/prisma.js';
import { Role, Task, TaskStatus, Priority } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware.js';
import { TaskStateFactory } from './states/taskState.js';
import { TaskCacheService } from './taskCache.service.js';

export class TaskService {
  public static async createTask(
    orgId: string,
    data: {
      title: string;
      description?: string;
      priority?: Priority;
      projectId: string;
      assigneeId?: string;
      dueDate?: Date;
    }
  ): Promise<Task> {
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project || project.organizationId !== orgId) {
      throw new AppError('Target project not found.', 404, 'PROJECT_NOT_FOUND');
    }

    if (data.assigneeId) {
      const isMember = await prisma.project.count({
        where: {
          id: data.projectId,
          members: {
            some: { id: data.assigneeId },
          },
        },
      });

      if (isMember === 0) {
        throw new AppError('The assignee must be a registered member of this project.', 400, 'ASSIGNEE_NOT_MEMBER');
      }
    }

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        projectId: data.projectId,
        organizationId: orgId,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate,
        status: TaskStatus.TODO,
      },
    });

    if (task.assigneeId) {
      await TaskCacheService.invalidateAssigneeCache(task.assigneeId);
    }

    return task;
  }

  public static async listTasks(
    orgId: string,
    userId: string,
    role: Role,
    filters: {
      page: number;
      limit: number;
      status?: TaskStatus;
      priority?: Priority;
      assigneeId?: string;
      projectId?: string;
    }
  ): Promise<{ items: Task[]; total: number }> {
    const assigneeId = role === Role.MEMBER ? userId : filters.assigneeId;

    if (assigneeId) {
      const cached = await TaskCacheService.getTasksCache(assigneeId, filters);
      if (cached) {
        return cached;
      }
    }

    const skip = (filters.page - 1) * filters.limit;

    const whereClause: any = { organizationId: orgId };

    if (role === Role.MEMBER) {
      whereClause.assigneeId = userId;
    } else {
      if (filters.assigneeId) {
        whereClause.assigneeId = filters.assigneeId;
      }
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }
    if (filters.priority) {
      whereClause.priority = filters.priority;
    }
    if (filters.projectId) {
      whereClause.projectId = filters.projectId;
    }

    const [tasks, total] = await prisma.$transaction([
      prisma.task.findMany({
        where: whereClause,
        skip,
        take: filters.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignee: { select: { id: true, email: true, role: true } },
          project: { select: { id: true, name: true } },
        },
      }),
      prisma.task.count({
        where: whereClause,
      }),
    ]);

    const result = { items: tasks, total };

    if (assigneeId) {
      await TaskCacheService.setTasksCache(assigneeId, filters, result);
    }

    return result;
  }

  public static async getTask(
    orgId: string,
    userId: string,
    role: Role,
    taskId: string
  ): Promise<Task> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: { select: { id: true, email: true, role: true } },
        project: { select: { id: true, name: true } },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, email: true, role: true } },
          },
        },
      },
    });

    if (!task || task.organizationId !== orgId) {
      throw new AppError('Task not found.', 404, 'TASK_NOT_FOUND');
    }

    if (role === Role.MEMBER && task.assigneeId !== userId) {
      throw new AppError('Task not found.', 404, 'TASK_NOT_FOUND');
    }

    return task;
  }

  public static async updateTask(
    orgId: string,
    taskId: string,
    updates: {
      title?: string;
      description?: string;
      priority?: Priority;
      assigneeId?: string | null;
      dueDate?: Date | null;
    }
  ): Promise<Task> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.organizationId !== orgId) {
      throw new AppError('Task not found.', 404, 'TASK_NOT_FOUND');
    }

    if (updates.assigneeId) {
      const project = await prisma.project.findUnique({
        where: { id: task.projectId },
      });

      if (!project || project.organizationId !== orgId) {
        throw new AppError('Target project not found.', 404, 'PROJECT_NOT_FOUND');
      }

      const isMember = await prisma.project.count({
        where: {
          id: task.projectId,
          members: {
            some: { id: updates.assigneeId },
          },
        },
      });

      if (isMember === 0) {
        throw new AppError('The assignee must be a registered member of this project.', 400, 'ASSIGNEE_NOT_MEMBER');
      }
    }

    const oldAssigneeId = task.assigneeId;
    const newAssigneeId = updates.assigneeId;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.priority !== undefined && { priority: updates.priority }),
        ...(updates.assigneeId !== undefined && { assigneeId: updates.assigneeId }),
        ...(updates.dueDate !== undefined && { dueDate: updates.dueDate }),
      },
    });

    if (oldAssigneeId) {
      await TaskCacheService.invalidateAssigneeCache(oldAssigneeId);
    }
    if (newAssigneeId && newAssigneeId !== oldAssigneeId) {
      await TaskCacheService.invalidateAssigneeCache(newAssigneeId);
    }

    return updatedTask;
  }

  public static async updateTaskStatus(
    orgId: string,
    userId: string,
    role: Role,
    taskId: string,
    newStatus: TaskStatus
  ): Promise<Task> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.organizationId !== orgId) {
      throw new AppError('Task not found.', 404, 'TASK_NOT_FOUND');
    }

    if (role === Role.MEMBER && task.assigneeId !== userId) {
      throw new AppError('Permission denied. You can only advance the status of tasks assigned to you.', 403, 'FORBIDDEN_TASK_STATUS_UPDATE');
    }

    const currentState = TaskStateFactory.get(task.status);
    if (!currentState.canTransitionTo(newStatus)) {
      throw new AppError(`Invalid task status transition from '${task.status}' to '${newStatus}'.`, 400, 'INVALID_STATUS_TRANSITION');
    }

    const [updatedTask] = await prisma.$transaction([
      prisma.task.update({
        where: { id: taskId },
      	data: {
          status: newStatus,
          ...(newStatus === TaskStatus.DONE && { completedAt: new Date() }),
          ...(newStatus !== TaskStatus.DONE && { completedAt: null }),
      	},
      }),
      prisma.taskStatusHistory.create({
      	data: {
          taskId,
          userId,
          fromStatus: task.status,
          toStatus: newStatus,
      	},
      }),
    ]);

    if (updatedTask.assigneeId) {
      await TaskCacheService.invalidateAssigneeCache(updatedTask.assigneeId);
    }

    return updatedTask;
  }

  public static async deleteTask(orgId: string, taskId: string): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.organizationId !== orgId) {
      throw new AppError('Task not found.', 404, 'TASK_NOT_FOUND');
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    if (task.assigneeId) {
      await TaskCacheService.invalidateAssigneeCache(task.assigneeId);
    }
  }
}
