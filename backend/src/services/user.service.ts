import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import redis from '../config/redis.js';
import { Role, User } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware.js';

export class UserService {
  public static async createUser(
    adminOrgId: string,
    data: { email: string; password_raw: string; role: Role }
  ): Promise<Omit<User, 'passwordHash'>> {
    if (data.role !== Role.MANAGER && data.role !== Role.MEMBER) {
      throw new AppError('Privilege violation. Provisioned user role must be MANAGER or MEMBER.', 400, 'INVALID_PROVISIONING_ROLE');
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('User creation failed. Email address is already registered in the system.', 409, 'EMAIL_EXISTS');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password_raw, salt);

    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: data.role,
        organizationId: adminOrgId,
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  public static async listUsers(
    adminOrgId: string,
    page: number,
    limit: number
  ): Promise<{ items: Array<Omit<User, 'passwordHash'>>; total: number }> {
    const skip = (page - 1) * limit;

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where: { organizationId: adminOrgId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({
        where: { organizationId: adminOrgId },
      }),
    ]);

    return {
      items: users.map(({ passwordHash, ...user }) => user),
      total,
    };
  }

  public static async updateUser(
    adminOrgId: string,
    currentAdminId: string,
    targetUserId: string,
    updates: { role?: Role; isBlocked?: boolean }
  ): Promise<Omit<User, 'passwordHash'>> {
    if (currentAdminId === targetUserId) {
      throw new AppError('Action denied. You cannot alter your own administrative role or block status.', 400, 'SELF_MUTATION_DENIED');
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user || user.organizationId !== adminOrgId) {
      throw new AppError('Target user not found or does not belong to your organization.', 404, 'USER_NOT_FOUND');
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        ...(updates.role && { role: updates.role }),
        ...(updates.isBlocked !== undefined && { isBlocked: updates.isBlocked }),
      },
    });

    await redis.del(`user:${targetUserId}:status`);

    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  public static async deleteUser(adminOrgId: string, currentAdminId: string, targetUserId: string): Promise<void> {
    if (currentAdminId === targetUserId) {
      throw new AppError('Action denied. You cannot delete your own administrative account.', 400, 'SELF_DELETION_DENIED');
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user || user.organizationId !== adminOrgId) {
      throw new AppError('Target user not found or does not belong to your organization.', 404, 'USER_NOT_FOUND');
    }

    await prisma.user.delete({
      where: { id: targetUserId },
    });

    await redis.del(`user:${targetUserId}:status`);
  }
}
