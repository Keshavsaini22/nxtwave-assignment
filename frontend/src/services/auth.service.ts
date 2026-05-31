import { APIClient } from './api.js';

export class AuthService {
  public static async login(credentials: { email: string; password: string }): Promise<any> {
    return APIClient.post('/auth/login', credentials);
  }

  public static async register(payload: {
    email: string;
    password: string;
    role: 'ADMIN' | 'MANAGER' | 'MEMBER';
    organizationName?: string;
    organizationId?: string;
  }): Promise<any> {
    return APIClient.post('/auth/register', payload);
  }

  public static async logout(refreshToken: string): Promise<void> {
    try {
      await APIClient.post('/auth/logout', { refreshToken });
    } catch (e) {
    }
  }
}
