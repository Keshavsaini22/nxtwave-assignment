import { Response } from 'express';
import { Redis } from 'ioredis';
import { redis } from '../config/redis.js';
import prisma from '../config/prisma.js';
import { AppError } from '../middlewares/error.middleware.js';

export class NotificationService {
  public static async registerClient(userId: string, res: Response): Promise<() => void> {
    const subscriber = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
    });

    const channel = `notifications:user:${userId}`;

    await subscriber.subscribe(channel);

    subscriber.on('message', (chan, message) => {
      if (chan === channel) {
        res.write(`data: ${message}\n\n`);
      }
    });

    const heartbeatInterval = setInterval(() => {
      res.write(':\n\n');
    }, 25000);

    return () => {
      clearInterval(heartbeatInterval);
      subscriber.unsubscribe(channel).catch(() => {});
      subscriber.quit().catch(() => {});
    };
  }

  public static async createAndPublishNotification(
    userId: string,
    title: string,
    message: string
  ): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { uuid: userId },
    });

    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        title,
        message,
      },
    });

    const channel = `notifications:user:${userId}`;
    const payload = JSON.stringify({
      id: notification.uuid,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    });

    await redis.publish(channel, payload);

    return {
      id: notification.uuid,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };
  }

  public static async getUserNotifications(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ items: any[]; total: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [items, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where: { user: { uuid: userId } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({
        where: { user: { uuid: userId } },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const mappedItems = items.map((notif) => ({
      id: notif.uuid,
      title: notif.title,
      message: notif.message,
      isRead: notif.isRead,
      createdAt: notif.createdAt,
    }));

    return {
      items: mappedItems,
      total,
      totalPages,
    };
  }

  public static async markAsRead(userId: string, notificationId: string): Promise<any> {
    const notification = await prisma.notification.findUnique({
      where: { uuid: notificationId },
      include: { user: true },
    });

    if (!notification) {
      throw new AppError('Notification not found.', 404, 'NOTIFICATION_NOT_FOUND');
    }

    if (notification.user.uuid !== userId) {
      throw new AppError('Access denied. You cannot modify notifications that do not belong to you.', 403, 'FORBIDDEN_NOTIFICATION_ACCESS');
    }

    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true },
    });

    return {
      id: updated.uuid,
      title: updated.title,
      message: updated.message,
      isRead: updated.isRead,
      createdAt: updated.createdAt,
    };
  }

  public static async markAllAsRead(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { uuid: userId },
    });

    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });
  }
}
