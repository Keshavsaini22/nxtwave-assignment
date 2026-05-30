import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/prisma.js';
import { Role, User } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware.js';
import { AuthSuccessPayload } from '../types/index.js';

export class AuthService {
  private static ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'supersecretaccesskeyfornxtwavetasktrackerapi123!';
  private static REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'supersecretrefreshkeyfornxtwavetasktrackerapi123!';
  private static ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
  private static REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

  public static async register(data: {
    email: string;
    password: string;
    role: Role;
    organizationName?: string;
    organizationId?: string;
  }): Promise<User> {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('User registration failed. Email is already registered.', 409, 'EMAIL_EXISTS');
    }

    let resolvedOrganizationId = '';

    if (data.role === Role.ADMIN) {
      if (!data.organizationName) {
        throw new AppError('organizationName is required to register as an ADMIN and initialize an organization', 400, 'BAD_REQUEST');
      }

      const org = await prisma.organization.create({
        data: { name: data.organizationName },
      });
      resolvedOrganizationId = org.id;
    } else {
      if (!data.organizationId) {
        throw new AppError('organizationId is required to register as a MANAGER or MEMBER', 400, 'BAD_REQUEST');
      }

      const org = await prisma.organization.findUnique({
        where: { id: data.organizationId },
      });

      if (!org) {
        throw new AppError('Organization association failed. The requested organization ID does not exist.', 404, 'ORGANIZATION_NOT_FOUND');
      }
      resolvedOrganizationId = org.id;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: data.role,
        organizationId: resolvedOrganizationId,
      },
    });

    return newUser;
  }

  public static async login(data: {
    email: string;
    password: string;
  }): Promise<AuthSuccessPayload> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError('Authentication failed. Invalid email or password credentials.', 401, 'INVALID_CREDENTIALS');
    }

    if (user.isBlocked) {
      throw new AppError('Your account has been suspended or blocked by an administrator.', 403, 'BLOCKED_USER', 'Account Suspended');
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Authentication failed. Invalid email or password credentials.', 401, 'INVALID_CREDENTIALS');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshTokenString();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
      accessToken,
      refreshToken,
    };
  }

  public static async refreshSession(oldRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: oldRefreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
      if (tokenRecord) {
        await prisma.refreshToken.updateMany({
          where: { userId: tokenRecord.userId },
          data: { isRevoked: true },
        });
      }
      throw new AppError('Access session refresh failed. Refresh token is expired, revoked, or invalid.', 401, 'INVALID_SESSION');
    }

    await prisma.refreshToken.delete({
      where: { id: tokenRecord.id },
    });

    const user = tokenRecord.user;

    if (user.isBlocked) {
      throw new AppError('Access session refresh failed. Your account has been suspended or blocked.', 403, 'BLOCKED_USER', 'Account Suspended');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshTokenString();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  public static async logout(refreshToken: string): Promise<void> {
    try {
      await prisma.refreshToken.delete({
        where: { token: refreshToken },
      });
    } catch (error) {
    }
  }

  private static generateAccessToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
      this.ACCESS_SECRET,
      { expiresIn: this.ACCESS_EXPIRY as any }
    );
  }

  private static generateRefreshTokenString(): string {
    return crypto.randomBytes(40).toString('hex');
  }
}
