import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service.js';

export class AnalyticsController {
  public static async getTaskAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;

      const data = await AnalyticsService.getTaskAnalytics(orgId);

      res.status(200).json({
        status: 200,
        message: 'Task analytics fetched successfully.',
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}
