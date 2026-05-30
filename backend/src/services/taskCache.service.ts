import redis from '../config/redis.js';
import crypto from 'crypto';

export class TaskCacheService {
  private static TTL = 600;

  private static buildCacheKey(assigneeId: string, query: any): string {
    const queryCopy = { ...query };
    delete queryCopy.page;
    delete queryCopy.limit;

    const queryStr = JSON.stringify(queryCopy);
    const queryHash = crypto.createHash('md5').update(queryStr).digest('hex');

    const page = query.page || 1;
    const limit = query.limit || 10;

    return `cache:tasks:assignee:${assigneeId}:page:${page}:limit:${limit}:filter:${queryHash}`;
  }

  public static async getTasksCache(assigneeId: string, query: any): Promise<any | null> {
    try {
      const cacheKey = this.buildCacheKey(assigneeId, query);
      const data = await redis.get(cacheKey);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  public static async setTasksCache(assigneeId: string, query: any, data: any): Promise<void> {
    try {
      const cacheKey = this.buildCacheKey(assigneeId, query);
      const trackingSetKey = `active_caches:assignee:${assigneeId}`;

      await redis.setex(cacheKey, this.TTL, JSON.stringify(data));
      await redis.sadd(trackingSetKey, cacheKey);
      await redis.expire(trackingSetKey, 3600);
    } catch (error) {
    }
  }

  public static async invalidateAssigneeCache(assigneeId: string): Promise<void> {
    try {
      const trackingSetKey = `active_caches:assignee:${assigneeId}`;
      const cacheKeys = await redis.smembers(trackingSetKey);

      if (cacheKeys.length > 0) {
        await redis.del(...cacheKeys);
      }

      await redis.del(trackingSetKey);
    } catch (error) {
    }
  }
}
