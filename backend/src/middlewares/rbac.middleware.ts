import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AppError } from './error.middleware.js';

const ROLE_PERMISSIONS: Record<string, Record<string, Role[]>> = {
  '/api/v1/users': {
    'POST': [Role.ADMIN],
    'GET': [Role.ADMIN, Role.MANAGER],
  },
  '/api/v1/users/:id': {
    'PATCH': [Role.ADMIN],
    'DELETE': [Role.ADMIN],
  }
};

export const authorizeRBAC = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401, 'UNAUTHORIZED', 'Unauthorized');
  }

  const routePath = `${req.baseUrl}${req.route?.path || ''}`;
  const method = req.method;
  const allowedRoles = ROLE_PERMISSIONS[routePath]?.[method];

  if (allowedRoles && !allowedRoles.includes(req.user.role)) {
    throw new AppError(
      `Access denied. Role '${req.user.role}' lacks sufficient permissions for ${method} ${routePath}`,
      403,
      'FORBIDDEN_ACCESS',
      'Forbidden'
    );
  }

  next();
};
