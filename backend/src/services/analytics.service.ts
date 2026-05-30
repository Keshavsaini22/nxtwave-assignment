import prisma from '../config/prisma.js';
import { Prisma } from '@prisma/client';

export class AnalyticsService {
  public static async getTaskAnalytics(orgId: string): Promise<any[]> {
    return prisma.$queryRaw<any[]>(
      Prisma.sql`
        SELECT 
          u.id AS "userId",
          u.email AS "email",
          u.role AS "role",
          COALESCE(COUNT(t.id) FILTER (WHERE t.status != 'DONE' AND t.due_date < NOW()), 0)::integer AS "overdueCount",
          COALESCE(AVG(EXTRACT(EPOCH FROM (t.completed_at - t.created_at))) FILTER (WHERE t.status = 'DONE'), 0)::double precision AS "avgCompletionSeconds",
          RANK() OVER (
            ORDER BY COALESCE(AVG(EXTRACT(EPOCH FROM (t.completed_at - t.created_at))) FILTER (WHERE t.status = 'DONE'), 99999999) ASC
          )::integer AS "performanceRank",
          COALESCE(AVG(AVG(EXTRACT(EPOCH FROM (t.completed_at - t.created_at))) FILTER (WHERE t.status = 'DONE')) OVER (), 0)::double precision AS "orgWideAvgCompletionSeconds"
        FROM users u
        LEFT JOIN tasks t ON u.id = t.assignee_id
        WHERE u.organization_id = ${orgId}
        GROUP BY u.id, u.email, u.role
        ORDER BY "performanceRank" ASC
      `
    );
  }
}
