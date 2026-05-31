import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import prisma from '../config/prisma.js';
import redis from '../config/redis.js';
import { AppError } from './error.middleware.js';

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

    const cacheKey = `user:${decoded.userId}:status`;
    const cachedStatus = await redis.get(cacheKey);

    let isBlocked = false;

    if (cachedStatus !== null) {
      if (cachedStatus === 'DELETED') {
        next(new AppError('The authenticated user account no longer exists.', 401, 'UNAUTHORIZED', 'Unauthorized'));
        return;
      }
      isBlocked = cachedStatus === 'true';
    } else {
      const user = await prisma.user.findUnique({
        where: { uuid: decoded.userId },
        select: { isBlocked: true },
      });

      if (!user) {
        await redis.setex(cacheKey, 300, 'DELETED');
        next(new AppError('The authenticated user account no longer exists.', 401, 'UNAUTHORIZED', 'Unauthorized'));
        return;
      }

      isBlocked = user.isBlocked;
      await redis.setex(cacheKey, 300, isBlocked ? 'true' : 'false');
    }

    if (isBlocked) {
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
