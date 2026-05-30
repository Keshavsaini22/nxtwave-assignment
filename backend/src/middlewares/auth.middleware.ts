import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import prisma from '../config/prisma.js';
import { AppError } from './error.middleware.js';
import { UserPayload } from '../types/index.js';

export const authenticateJWT = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new AppError('Access token is missing or malformed. Provide: Bearer <token>', 401, 'UNAUTHORIZED', 'Unauthorized'));
    return;
  }

  const token = authHeader.split(' ')[1];
  const accessSecret = process.env.JWT_ACCESS_SECRET || 'supersecretaccesskeyfornxtwavetasktrackerapi123!';

  try {
    const decoded = jwt.verify(token, accessSecret) as jwt.JwtPayload;

    if (!decoded.userId || !decoded.role || !decoded.organizationId) {
      next(new AppError('Access token contains invalid claims payload', 401, 'UNAUTHORIZED', 'Unauthorized'));
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isBlocked: true },
    });

    if (!user) {
      next(new AppError('The authenticated user account no longer exists.', 401, 'UNAUTHORIZED', 'Unauthorized'));
      return;
    }

    if (user.isBlocked) {
      next(new AppError('Your account has been suspended or blocked by an administrator.', 403, 'BLOCKED_USER', 'Account Suspended'));
      return;
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role as Role,
      organizationId: decoded.organizationId,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      next(new AppError('Access token has expired. Request a new token using refresh endpoint', 401, 'TOKEN_EXPIRED', 'Token Expired'));
    } else {
      next(new AppError('Invalid or untrusted access token signature', 401, 'UNAUTHORIZED', 'Unauthorized'));
    }
  }
};
