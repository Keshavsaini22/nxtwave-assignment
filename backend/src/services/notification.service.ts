import { Response } from 'express';
import { Redis } from 'ioredis';
import { redis } from '../config/redis.js';
import prisma from '../config/prisma.js';
import { Notification } from '@prisma/client';
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
  ): Promise<Notification> {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
      },
    });

    const channel = `notifications:user:${userId}`;
    const payload = JSON.stringify({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    });

    await redis.publish(channel, payload);

    return notification;
  }

  public static async getUserNotifications(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ items: Notification[]; total: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [items, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({
        where: { userId },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      totalPages,
    };
  }

  public static async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new AppError('Notification not found.', 404, 'NOTIFICATION_NOT_FOUND');
    }

    if (notification.userId !== userId) {
      throw new AppError('Access denied. You cannot modify notifications that do not belong to you.', 403, 'FORBIDDEN_NOTIFICATION_ACCESS');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  public static async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
