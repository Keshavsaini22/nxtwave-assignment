import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';
import { Role } from '@prisma/client';

export class UserController {
  public static async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminOrgId = req.user!.organizationId;
      const { email, password, role } = req.body;

      const newUser = await UserService.createUser(adminOrgId, {
        email,
        password_raw: password,
        role: role as Role,
      });

      res.status(201).json({
        status: 201,
        message: 'Tenant user provisioned successfully.',
        data: newUser,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminOrgId = req.user!.organizationId;
      const page = req.query.page as unknown as number;
      const limit = req.query.limit as unknown as number;

      const { items, total } = await UserService.listUsers(adminOrgId, page, limit);

      res.status(200).json({
        status: 200,
        message: 'Users fetched successfully.',
        data: {
          items,
          meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminOrgId = req.user!.organizationId;
      const currentAdminId = req.user!.userId;
      const targetUserId = req.params.id;
      const { role, isBlocked } = req.body;

      const updatedUser = await UserService.updateUser(adminOrgId, currentAdminId, targetUserId, {
        role: role as Role,
        isBlocked,
      });

      res.status(200).json({
        status: 200,
        message: 'User updated successfully.',
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminOrgId = req.user!.organizationId;
      const currentAdminId = req.user!.userId;
      const targetUserId = req.params.id;

      await UserService.deleteUser(adminOrgId, currentAdminId, targetUserId);

      res.status(200).json({
        status: 200,
        message: 'User deleted and removed from organization successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}
