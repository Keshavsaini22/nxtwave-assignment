import { jest } from '@jest/globals';
import type { AppError } from '../middlewares/error.middleware.js';

const mockPrisma = {
  notification: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
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
const { redis } = await import('../config/redis.js');
const { NotificationService } = await import('../services/notification.service.js');
const { UserMother } = await import('./mothers/user.mother.js');

describe('NotificationService Critical Workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAndPublishNotification', () => {
    it('should successfully save notification and publish event via Redis Pub/Sub', async () => {
      const user = UserMother.createMember();
      const mockNotification = {
        id: 'notif-1',
        userId: user.id,
        title: 'Task Assigned',
        message: 'A new task has been assigned to you.',
        isRead: false,
        createdAt: new Date(),
      };

      (prisma.notification.create as any).mockResolvedValue(mockNotification);
      (redis.publish as any).mockResolvedValue(1);

      const result = await NotificationService.createAndPublishNotification(
        user.id,
        'Task Assigned',
        'A new task has been assigned to you.'
      );

      expect(result).toEqual(mockNotification);
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: user.id,
          title: 'Task Assigned',
          message: 'A new task has been assigned to you.',
        },
      });
      expect(redis.publish).toHaveBeenCalledWith(
        `notifications:user:${user.id}`,
        expect.stringContaining('notif-1')
      );
    });
  });

  describe('getUserNotifications', () => {
    it('should return paginated list of notifications for the specified user', async () => {
      const user = UserMother.createMember();
      const mockNotifications = [
        {
          id: 'notif-1',
          userId: user.id,
          title: 'First Notif',
          message: 'Message 1',
          isRead: false,
          createdAt: new Date(),
        },
      ];

      (prisma.notification.findMany as any).mockResolvedValue(mockNotifications);
      (prisma.notification.count as any).mockResolvedValue(1);

      const result = await NotificationService.getUserNotifications(user.id, 1, 10);

      expect(result.items).toEqual(mockNotifications);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(prisma.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: user.id },
        skip: 0,
        take: 10,
      }));
    });
  });

  describe('markAsRead', () => {
    it('should throw an error if the notification does not exist', async () => {
      const user = UserMother.createMember();
      (prisma.notification.findUnique as any).mockResolvedValue(null);

      let thrownError: AppError | null = null;
      try {
        await NotificationService.markAsRead(user.id, 'notif-missing');
      } catch (error: any) {
        thrownError = error;
      }

      expect(thrownError).not.toBeNull();
      expect(thrownError!.status).toBe(404);
      expect(thrownError!.code).toBe('NOTIFICATION_NOT_FOUND');
    });

    it('should throw an error if the user tries to mark someone else\'s notification as read', async () => {
      const user1 = UserMother.createMember({ id: 'user-1' });
      const user2 = UserMother.createMember({ id: 'user-2' });
      const mockNotification = {
        id: 'notif-1',
        userId: user2.id,
        title: 'Private Notif',
        message: 'Secret',
        isRead: false,
        createdAt: new Date(),
      };

      (prisma.notification.findUnique as any).mockResolvedValue(mockNotification);

      let thrownError: AppError | null = null;
      try {
        await NotificationService.markAsRead(user1.id, 'notif-1');
      } catch (error: any) {
        thrownError = error;
      }

      expect(thrownError).not.toBeNull();
      expect(thrownError!.status).toBe(403);
      expect(thrownError!.code).toBe('FORBIDDEN_NOTIFICATION_ACCESS');
    });

    it('should successfully update isRead to true when parameters and ownership are valid', async () => {
      const user = UserMother.createMember();
      const mockNotification = {
        id: 'notif-1',
        userId: user.id,
        title: 'Task Assigned',
        message: 'Message',
        isRead: false,
        createdAt: new Date(),
      };
      const expectedUpdated = { ...mockNotification, isRead: true };

      (prisma.notification.findUnique as any).mockResolvedValue(mockNotification);
      (prisma.notification.update as any).mockResolvedValue(expectedUpdated);

      const result = await NotificationService.markAsRead(user.id, 'notif-1');

      expect(result.isRead).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { isRead: true },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should update all unread notifications to read for the given user', async () => {
      const user = UserMother.createMember();
      (prisma.notification.updateMany as any).mockResolvedValue({ count: 5 });

      await NotificationService.markAllAsRead(user.id);

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
    });
  });
});
