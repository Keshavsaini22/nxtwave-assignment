import { APIClient } from './api.js';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedNotificationsResponse {
  items: Notification[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class NotificationService {
  public static async listNotifications(page: number = 1, limit: number = 20): Promise<any> {
    return APIClient.get(`/notifications?page=${page}&limit=${limit}`);
  }

  public static async markAsRead(notificationId: string): Promise<any> {
    return APIClient.patch(`/notifications/${notificationId}/read`, {});
  }

  public static async markAllAsRead(): Promise<any> {
    return APIClient.post('/notifications/read-all', {});
  }
}
