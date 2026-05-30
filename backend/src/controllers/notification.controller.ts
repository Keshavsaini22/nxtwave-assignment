import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service.js';

export class NotificationController {
  public static async getStream(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      res.flushHeaders();

      const cleanup = await NotificationService.registerClient(userId, res);

      req.on('close', () => {
        cleanup();
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string || '10', 10)));

      const { items, total, totalPages } = await NotificationService.getUserNotifications(userId, page, limit);

      res.status(200).json({
        status: 200,
        message: 'Notifications fetched successfully.',
        data: {
          items,
          meta: {
            total,
            page,
            limit,
            totalPages,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const notificationId = req.params.id;

      const notification = await NotificationService.markAsRead(userId, notificationId);

      res.status(200).json({
        status: 200,
        message: 'Notification marked as read.',
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;

      await NotificationService.markAllAsRead(userId);

      res.status(200).json({
        status: 200,
        message: 'All notifications marked as read.',
      });
    } catch (error) {
      next(error);
    }
  }
}
