import prisma from '../config/prisma.js';
import { Role, TaskStatus, Priority } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware.js';
import { TaskStateFactory } from './states/taskState.js';
import { TaskCacheService } from './taskCache.service.js';
import { NotificationService } from './notification.service.js';
import { mapTaskToPublic, PublicTask } from '../utils/mappers.js';

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
  ): Promise<PublicTask> {
    const org = await prisma.organization.findUnique({
      where: { uuid: orgId },
    });

    if (!org) {
      throw new AppError('Organization not found.', 404, 'ORGANIZATION_NOT_FOUND');
    }

    const project = await prisma.project.findUnique({
      where: { uuid: data.projectId },
    });

    if (!project || project.organizationId !== org.id) {
      throw new AppError('Target project not found.', 404, 'PROJECT_NOT_FOUND');
    }

    let resolvedAssigneeId: number | undefined = undefined;

    if (data.assigneeId) {
      const user = await prisma.user.findUnique({
        where: { uuid: data.assigneeId },
      });

      if (!user || user.organizationId !== org.id) {
        throw new AppError('Assignee not found.', 404, 'USER_NOT_FOUND');
      }

      resolvedAssigneeId = user.id;

      const isMember = await prisma.project.count({
        where: {
          id: project.id,
          members: {
            some: { id: user.id },
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
        projectId: project.id,
        organizationId: org.id,
        assigneeId: resolvedAssigneeId,
        dueDate: data.dueDate,
        status: TaskStatus.TODO,
      },
      include: {
        organization: true,
        project: true,
        assignee: true,
      },
    });

    if (data.assigneeId) {
      await TaskCacheService.invalidateAssigneeCache(data.assigneeId);
    }

    return mapTaskToPublic(task);
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
  ): Promise<{ items: PublicTask[]; total: number }> {
    const assigneeId = role === Role.MEMBER ? userId : filters.assigneeId;

    if (assigneeId) {
      const cached = await TaskCacheService.getTasksCache(assigneeId, filters);
      if (cached) {
        return cached;
      }
    }

    const skip = (filters.page - 1) * filters.limit;
    const whereClause: any = { organization: { uuid: orgId } };

    if (role === Role.MEMBER) {
      whereClause.assignee = { uuid: userId };
    } else {
      if (filters.assigneeId) {
        whereClause.assignee = { uuid: filters.assigneeId };
      }
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }
    if (filters.priority) {
      whereClause.priority = filters.priority;
    }
    if (filters.projectId) {
      whereClause.project = { uuid: filters.projectId };
    }

    const [tasks, total] = await prisma.$transaction([
      prisma.task.findMany({
        where: whereClause,
        skip,
        take: filters.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignee: { include: { organization: true } },
          project: { include: { organization: true } },
          organization: true,
        },
      }),
      prisma.task.count({
        where: whereClause,
      }),
    ]);

    const result = { items: tasks.map(mapTaskToPublic), total };

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
  ): Promise<PublicTask> {
    const task = await prisma.task.findUnique({
      where: { uuid: taskId },
      include: {
        organization: true,
        assignee: { include: { organization: true } },
        project: { include: { organization: true } },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { include: { organization: true } },
          },
        },
      },
    });

    if (!task || task.organization.uuid !== orgId) {
      throw new AppError('Task not found.', 404, 'TASK_NOT_FOUND');
    }

    if (role === Role.MEMBER && (!task.assignee || task.assignee.uuid !== userId)) {
      throw new AppError('Task not found.', 404, 'TASK_NOT_FOUND');
    }

    return mapTaskToPublic(task);
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
  ): Promise<PublicTask> {
    const task = await prisma.task.findUnique({
      where: { uuid: taskId },
      include: { organization: true, assignee: true },
    });

    if (!task || task.organization.uuid !== orgId) {
      throw new AppError('Task not found.', 404, 'TASK_NOT_FOUND');
    }

    let resolvedAssigneeId: number | null | undefined = undefined;

    if (updates.assigneeId) {
      const user = await prisma.user.findUnique({
        where: { uuid: updates.assigneeId },
        include: { organization: true },
      });

      if (!user || user.organization.uuid !== orgId) {
        throw new AppError('Assignee not found in your organization.', 404, 'USER_NOT_FOUND');
      }

      resolvedAssigneeId = user.id;

      const isMember = await prisma.project.count({
        where: {
          id: task.projectId,
          members: {
            some: { id: user.id },
          },
        },
      });

      if (isMember === 0) {
        throw new AppError('The assignee must be a registered member of this project.', 400, 'ASSIGNEE_NOT_MEMBER');
      }
    } else if (updates.assigneeId === null) {
      resolvedAssigneeId = null;
    }

    const oldAssigneeUuid = task.assignee?.uuid;
    const newAssigneeUuid = updates.assigneeId;

    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data: {
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.priority !== undefined && { priority: updates.priority }),
        ...(resolvedAssigneeId !== undefined && { assigneeId: resolvedAssigneeId }),
        ...(updates.dueDate !== undefined && { dueDate: updates.dueDate }),
      },
      include: {
        organization: true,
        project: true,
        assignee: true,
      },
    });

    if (oldAssigneeUuid) {
      await TaskCacheService.invalidateAssigneeCache(oldAssigneeUuid);
    }
    if (newAssigneeUuid && newAssigneeUuid !== oldAssigneeUuid) {
      await TaskCacheService.invalidateAssigneeCache(newAssigneeUuid);
    }

    return mapTaskToPublic(updatedTask);
  }

  public static async updateTaskStatus(
    orgId: string,
    userId: string,
    role: Role,
    taskId: string,
    newStatus: TaskStatus
  ): Promise<PublicTask> {
    const task = await prisma.task.findUnique({
      where: { uuid: taskId },
      include: { organization: true, assignee: true },
    });

    if (!task || task.organization.uuid !== orgId) {
      throw new AppError('Task not found.', 404, 'TASK_NOT_FOUND');
    }

    if (role === Role.MEMBER && (!task.assignee || task.assignee.uuid !== userId)) {
      throw new AppError('Permission denied. You can only advance the status of tasks assigned to you.', 403, 'FORBIDDEN_TASK_STATUS_UPDATE');
    }

    const user = await prisma.user.findUnique({
      where: { uuid: userId },
    });

    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    const currentState = TaskStateFactory.get(task.status);
    if (!currentState.canTransitionTo(newStatus)) {
      throw new AppError(`Invalid task status transition from '${task.status}' to '${newStatus}'.`, 400, 'INVALID_STATUS_TRANSITION');
    }

    const [updatedTask] = await prisma.$transaction([
      prisma.task.update({
        where: { id: task.id },
        data: {
          status: newStatus,
          ...(newStatus === TaskStatus.DONE && { completedAt: new Date() }),
          ...(newStatus !== TaskStatus.DONE && { completedAt: null }),
        },
        include: { organization: true, project: true, assignee: true },
      }),
      prisma.taskStatusHistory.create({
        data: {
          taskId: task.id,
          userId: user.id,
          fromStatus: task.status,
          toStatus: newStatus,
        },
      }),
    ]);

    if (task.assignee?.uuid) {
      await TaskCacheService.invalidateAssigneeCache(task.assignee.uuid);
      await NotificationService.createAndPublishNotification(
        task.assignee.uuid,
        'Task Status Updated',
        `Your task "${updatedTask.title}" has been updated from ${task.status} to ${updatedTask.status}.`
      );
    }

    return mapTaskToPublic(updatedTask);
  }

  public static async deleteTask(orgId: string, taskId: string): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { uuid: taskId },
      include: { organization: true, assignee: true },
    });

    if (!task || task.organization.uuid !== orgId) {
      throw new AppError('Task not found.', 404, 'TASK_NOT_FOUND');
    }

    await prisma.task.delete({
      where: { id: task.id },
    });

    if (task.assignee?.uuid) {
      await TaskCacheService.invalidateAssigneeCache(task.assignee.uuid);
    }
  }
}
