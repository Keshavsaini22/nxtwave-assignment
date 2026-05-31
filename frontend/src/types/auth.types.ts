export interface UserPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  organizationId: string;
}

export interface AuthSuccessPayload {
  user: UserPayload;
  accessToken: string;
  refreshToken: string;
}
