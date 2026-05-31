import { jest } from '@jest/globals';
import { AppError } from '../middlewares/error.middleware.js';

const mockPrismaInternal = {
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

const mockPrisma = new Proxy(mockPrismaInternal, {
  get(target: any, prop: string | symbol) {
    if (prop in target) {
      return target[prop];
    }
    if (typeof prop === 'string') {
      if (prop.startsWith('$')) {
        return undefined;
      }
      target[prop] = {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        upsert: jest.fn(),
      };
      return target[prop];
    }
    return undefined;
  }
});

const mockRedis = {
  publish: jest.fn(),
  del: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  sadd: jest.fn(),
  smembers: jest.fn(),
  expire: jest.fn(),
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

      (prisma.organization.findUnique as any).mockResolvedValue(org);
      (prisma.project.findUnique as any).mockResolvedValue({
        id: 10,
        uuid: 'project-1',
        organizationId: org.id,
      });
      (prisma.user.findUnique as any).mockResolvedValue(nonMemberUser);
      (prisma.project.count as any).mockResolvedValue(0);

      let thrownError: AppError | null = null;
      try {
        await TaskService.createTask(org.uuid, {
          title: 'Review PR',
          projectId: 'project-1',
          assigneeId: nonMemberUser.uuid,
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
      const expectedTask = {
        ...TaskMother.create({
          id: 1,
          uuid: 'task-1',
          title: 'Build API',
          organizationId: org.id,
          projectId: 10,
          assigneeId: memberUser.id,
        }),
        organization: org,
        project: { id: 10, uuid: 'project-1' },
        assignee: memberUser,
      };

      (prisma.organization.findUnique as any).mockResolvedValue(org);
      (prisma.project.findUnique as any).mockResolvedValue({
        id: 10,
        uuid: 'project-1',
        organizationId: org.id,
      });
      (prisma.user.findUnique as any).mockResolvedValue(memberUser);
      (prisma.project.count as any).mockResolvedValue(1);
      (prisma.task.create as any).mockResolvedValue(expectedTask);

      const task = await TaskService.createTask(org.uuid, {
        title: 'Build API',
        projectId: 'project-1',
        assigneeId: memberUser.uuid,
      });

      expect(task).toEqual({
        id: 'task-1',
        title: 'Build API',
        description: expectedTask.description,
        priority: expectedTask.priority,
        status: expectedTask.status,
        organizationId: org.uuid,
        projectId: 'project-1',
        assigneeId: memberUser.uuid,
        dueDate: expectedTask.dueDate,
        completedAt: expectedTask.completedAt,
        createdAt: expectedTask.createdAt,
        updatedAt: expectedTask.updatedAt,
      });

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Build API',
          projectId: 10,
          assigneeId: memberUser.id,
          organizationId: org.id,
        }),
        include: {
          organization: true,
          project: true,
          assignee: true,
        },
      });
    });
  });

  describe('updateTaskStatus Workflow', () => {
    it('should throw an error if a member tries to update status of a task assigned to someone else', async () => {
      const org = OrganizationMother.create();
      const member1 = UserMother.createMember({ id: 1, uuid: 'member-1', organizationId: org.id });
      const member2 = UserMother.createMember({ id: 2, uuid: 'member-2', organizationId: org.id });
      const task = {
        ...TaskMother.create({
          id: 100,
          uuid: 'task-1',
          organizationId: org.id,
          assigneeId: member2.id,
          status: TaskStatus.TODO,
        }),
        organization: org,
        assignee: member2,
      };

      (prisma.task.findUnique as any).mockResolvedValue(task);

      let thrownError: AppError | null = null;
      try {
        await TaskService.updateTaskStatus(org.uuid, member1.uuid, Role.MEMBER, task.uuid, TaskStatus.IN_PROGRESS);
      } catch (error: any) {
        thrownError = error;
      }

      expect(thrownError).not.toBeNull();
      expect(thrownError!.status).toBe(403);
      expect(thrownError!.code).toBe('FORBIDDEN_TASK_STATUS_UPDATE');
    });

    it('should throw an error when attempting an invalid state transition', async () => {
      const org = OrganizationMother.create();
      const member = UserMother.createMember({ id: 1, uuid: 'member-1', organizationId: org.id });
      const task = {
        ...TaskMother.create({
          id: 100,
          uuid: 'task-1',
          organizationId: org.id,
          assigneeId: member.id,
          status: TaskStatus.TODO,
        }),
        organization: org,
        assignee: member,
      };

      (prisma.task.findUnique as any).mockResolvedValue(task);

      let thrownError: AppError | null = null;
      try {
        await TaskService.updateTaskStatus(org.uuid, member.uuid, Role.MEMBER, task.uuid, TaskStatus.DONE);
      } catch (error: any) {
        thrownError = error;
      }

      expect(thrownError).not.toBeNull();
      expect(thrownError!.status).toBe(400);
      expect(thrownError!.code).toBe('INVALID_STATUS_TRANSITION');
    });

    it('should successfully transition status and write status histories on valid moves', async () => {
      const org = OrganizationMother.create();
      const member = UserMother.createMember({ id: 1, uuid: 'member-1', organizationId: org.id });
      const task = {
        ...TaskMother.create({
          id: 100,
          uuid: 'task-1',
          organizationId: org.id,
          assigneeId: member.id,
          status: TaskStatus.TODO,
        }),
        organization: org,
        assignee: member,
      };
      const expectedUpdatedTask = {
        ...task,
        status: TaskStatus.IN_PROGRESS,
        project: { id: 10, uuid: 'project-1' },
      };

      (prisma.task.findUnique as any).mockResolvedValue(task);
      (prisma.user.findUnique as any).mockResolvedValue(member);
      (prisma.task.update as any).mockResolvedValue(expectedUpdatedTask);
      (prisma.taskStatusHistory.create as any).mockResolvedValue({});
      (prisma.notification.create as any).mockResolvedValue({});

      const updated = await TaskService.updateTaskStatus(org.uuid, member.uuid, Role.MEMBER, task.uuid, TaskStatus.IN_PROGRESS);

      expect(updated).toEqual({
        id: 'task-1',
        title: expectedUpdatedTask.title,
        description: expectedUpdatedTask.description,
        priority: expectedUpdatedTask.priority,
        status: TaskStatus.IN_PROGRESS,
        organizationId: org.uuid,
        projectId: 'project-1',
        assigneeId: member.uuid,
        dueDate: expectedUpdatedTask.dueDate,
        completedAt: expectedUpdatedTask.completedAt,
        createdAt: expectedUpdatedTask.createdAt,
        updatedAt: expectedUpdatedTask.updatedAt,
      });

      expect(prisma.task.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: task.id },
        data: expect.objectContaining({
          status: TaskStatus.IN_PROGRESS,
        }),
      }));
    });
  });
});
