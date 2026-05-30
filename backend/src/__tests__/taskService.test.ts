import { jest } from '@jest/globals';
import type { AppError } from '../middlewares/error.middleware.js';

const mockPrisma = {
  project: {
    findUnique: jest.fn(),
    count: jest.fn(),
  },
  task: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  taskStatusHistory: {
    create: jest.fn(),
  },
  notification: {
    create: jest.fn(),
  },
  $transaction: jest.fn((arg: any) => {
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    return arg(mockPrisma);
  }),
};

const mockRedis = {
  publish: jest.fn(),
  del: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  sadd: jest.fn(),
  smembers: jest.fn(),
};

jest.unstable_mockModule('../config/prisma.js', () => ({
  __esModule: true,
  default: mockPrisma,
}));

jest.unstable_mockModule('../config/redis.js', () => ({
  __esModule: true,
  default: mockRedis,
  redis: mockRedis,
}));

const { default: prisma } = await import('../config/prisma.js');
const { TaskService } = await import('../services/task.service.js');
const { UserMother } = await import('./mothers/user.mother.js');
const { TaskMother } = await import('./mothers/task.mother.js');
const { OrganizationMother } = await import('./mothers/organization.mother.js');
const { TaskStatus, Role } = await import('@prisma/client');

describe('TaskService Critical Workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask Workflow', () => {
    it('should throw an error if the assignee is not a member of the project', async () => {
      const org = OrganizationMother.create();
      const nonMemberUser = UserMother.createMember({ organizationId: org.id });

      (prisma.project.findUnique as any).mockResolvedValue({
        id: 'project-1',
        organizationId: org.id,
      });

      (prisma.project.count as any).mockResolvedValue(0);

      let thrownError: AppError | null = null;
      try {
        await TaskService.createTask(org.id, {
          title: 'Review PR',
          projectId: 'project-1',
          assigneeId: nonMemberUser.id,
        });
      } catch (error: any) {
        thrownError = error;
      }

      expect(thrownError).not.toBeNull();
      expect(thrownError!.status).toBe(400);
      expect(thrownError!.code).toBe('ASSIGNEE_NOT_MEMBER');
      expect(thrownError!.message).toBe('The assignee must be a registered member of this project.');
    });

    it('should successfully create a task when all parameters and assignee membership are valid', async () => {
      const org = OrganizationMother.create();
      const memberUser = UserMother.createMember({ organizationId: org.id });
      const expectedTask = TaskMother.create({
        title: 'Build API',
        organizationId: org.id,
        projectId: 'project-1',
        assigneeId: memberUser.id,
      });

      (prisma.project.findUnique as any).mockResolvedValue({
        id: 'project-1',
        organizationId: org.id,
      });

      (prisma.project.count as any).mockResolvedValue(1);
      (prisma.task.create as any).mockResolvedValue(expectedTask);

      const task = await TaskService.createTask(org.id, {
        title: 'Build API',
        projectId: 'project-1',
        assigneeId: memberUser.id,
      });

      expect(task).toEqual(expectedTask);
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Build API',
          projectId: 'project-1',
          assigneeId: memberUser.id,
          organizationId: org.id,
        }),
      });
    });
  });

  describe('updateTaskStatus Workflow', () => {
    it('should throw an error if a member tries to update status of a task assigned to someone else', async () => {
      const org = OrganizationMother.create();
      const member1 = UserMother.createMember({ id: 'member-1', organizationId: org.id });
      const member2 = UserMother.createMember({ id: 'member-2', organizationId: org.id });
      const task = TaskMother.create({
        id: 'task-1',
        organizationId: org.id,
        assigneeId: member2.id,
        status: TaskStatus.TODO,
      });

      (prisma.task.findUnique as any).mockResolvedValue(task);

      let thrownError: AppError | null = null;
      try {
        await TaskService.updateTaskStatus(org.id, member1.id, Role.MEMBER, task.id, TaskStatus.IN_PROGRESS);
      } catch (error: any) {
        thrownError = error;
      }

      expect(thrownError).not.toBeNull();
      expect(thrownError!.status).toBe(403);
      expect(thrownError!.code).toBe('FORBIDDEN_TASK_STATUS_UPDATE');
    });

    it('should throw an error when attempting an invalid state transition', async () => {
      const org = OrganizationMother.create();
      const member = UserMother.createMember({ id: 'member-1', organizationId: org.id });
      const task = TaskMother.create({
        id: 'task-1',
        organizationId: org.id,
        assigneeId: member.id,
        status: TaskStatus.TODO,
      });

      (prisma.task.findUnique as any).mockResolvedValue(task);

      let thrownError: AppError | null = null;
      try {
        await TaskService.updateTaskStatus(org.id, member.id, Role.MEMBER, task.id, TaskStatus.DONE);
      } catch (error: any) {
        thrownError = error;
      }

      expect(thrownError).not.toBeNull();
      expect(thrownError!.status).toBe(400);
      expect(thrownError!.code).toBe('INVALID_STATUS_TRANSITION');
    });

    it('should successfully transition status and write status histories on valid moves', async () => {
      const org = OrganizationMother.create();
      const member = UserMother.createMember({ id: 'member-1', organizationId: org.id });
      const task = TaskMother.create({
        id: 'task-1',
        organizationId: org.id,
        assigneeId: member.id,
        status: TaskStatus.TODO,
      });
      const expectedUpdatedTask = { ...task, status: TaskStatus.IN_PROGRESS };

      (prisma.task.findUnique as any).mockResolvedValue(task);
      (prisma.task.update as any).mockResolvedValue(expectedUpdatedTask);
      (prisma.taskStatusHistory.create as any).mockResolvedValue({});
      (prisma.notification.create as any).mockResolvedValue({});

      const updated = await TaskService.updateTaskStatus(org.id, member.id, Role.MEMBER, task.id, TaskStatus.IN_PROGRESS);

      expect(updated).toEqual(expectedUpdatedTask);
      expect(prisma.task.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: task.id },
        data: expect.objectContaining({
          status: TaskStatus.IN_PROGRESS,
        }),
      }));
      expect(prisma.taskStatusHistory.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          taskId: task.id,
          userId: member.id,
          fromStatus: TaskStatus.TODO,
          toStatus: TaskStatus.IN_PROGRESS,
        }),
      }));
    });
  });
});
