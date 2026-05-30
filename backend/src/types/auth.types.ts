import { Role } from '@prisma/client';

export interface UserPayload {
  userId: string;
  email: string;
  role: Role;
  organizationId: string;
}

export interface AuthSuccessPayload {
  user: {
    id: string;
    email: string;
    role: Role;
    organizationId: string;
  };
  accessToken: string;
  refreshToken: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}
