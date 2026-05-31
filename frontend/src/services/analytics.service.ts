import { APIClient } from './api.js';

export interface EmployeeProductivityMetric {
  userId: string;
  email: string;
  role: string;
  overdueCount: number;
  avgCompletionSeconds: number;
  performanceRank: number;
  orgWideAvgCompletionSeconds: number;
}

export class AnalyticsService {
  public static async getTaskAnalytics(): Promise<EmployeeProductivityMetric[]> {
    return APIClient.get<EmployeeProductivityMetric[]>('/analytics/tasks');
  }
}
