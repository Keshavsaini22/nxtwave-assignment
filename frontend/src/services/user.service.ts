import { APIClient } from './api.js';
import type { StaffUser, PaginatedUsersResponse } from '../types/user.types.js';

export class UserService {
  public static async listUsers(page: number, limit: number): Promise<PaginatedUsersResponse> {
    return APIClient.get<PaginatedUsersResponse>(`/users?page=${page}&limit=${limit}`);
  }

  public static async createUser(payload: { email: string; password_raw: string; role: 'MANAGER' | 'MEMBER' }): Promise<StaffUser> {
    return APIClient.post<StaffUser>('/users', {
      email: payload.email,
      password: payload.password_raw,
      role: payload.role,
    });
  }

  public static async updateUser(userId: string, updates: { role?: 'MANAGER' | 'MEMBER'; isBlocked?: boolean }): Promise<StaffUser> {
    return APIClient.patch<StaffUser>(`/users/${userId}`, updates);
  }

  public static async deleteUser(userId: string): Promise<void> {
    return APIClient.delete(`/users/${userId}`);
  }
}
