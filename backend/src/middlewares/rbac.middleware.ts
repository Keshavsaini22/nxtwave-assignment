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
  },
  '/api/v1/projects': {
    'POST': [Role.ADMIN, Role.MANAGER],
    'GET': [Role.ADMIN, Role.MANAGER, Role.MEMBER],
  },
  '/api/v1/projects/:id': {
    'GET': [Role.ADMIN, Role.MANAGER, Role.MEMBER],
    'PATCH': [Role.ADMIN, Role.MANAGER],
    'DELETE': [Role.ADMIN, Role.MANAGER],
  },
  '/api/v1/projects/:id/members': {
    'POST': [Role.ADMIN, Role.MANAGER],
  },
  '/api/v1/projects/:id/members/:userId': {
    'DELETE': [Role.ADMIN, Role.MANAGER],
  },
  '/api/v1/tasks': {
    'POST': [Role.ADMIN, Role.MANAGER],
    'GET': [Role.ADMIN, Role.MANAGER, Role.MEMBER],
  },
  '/api/v1/tasks/:id': {
    'GET': [Role.ADMIN, Role.MANAGER, Role.MEMBER],
    'PATCH': [Role.ADMIN, Role.MANAGER],
    'DELETE': [Role.ADMIN],
  },
  '/api/v1/tasks/:id/status': {
    'PATCH': [Role.ADMIN, Role.MANAGER, Role.MEMBER],
  },
  '/api/v1/analytics/tasks': {
    'GET': [Role.ADMIN, Role.MANAGER],
  }
};

export const authorizeRBAC = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401, 'UNAUTHORIZED', 'Unauthorized');
  }

  let routePath = `${req.baseUrl}${req.route?.path || ''}`;
  if (routePath.endsWith('/') && routePath.length > 1) {
    routePath = routePath.slice(0, -1);
  }
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
