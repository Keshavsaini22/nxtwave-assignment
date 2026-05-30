import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/project.service.js';

export class ProjectController {
  public static async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const { name, description } = req.body;

      const project = await ProjectService.createProject(orgId, { name, description });

      res.status(201).json({
        status: 201,
        message: 'Project created successfully.',
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const userId = req.user!.userId;
      const role = req.user!.role;
      const page = req.query.page as unknown as number;
      const limit = req.query.limit as unknown as number;

      const { items, total } = await ProjectService.listProjects(orgId, userId, role, page, limit);

      res.status(200).json({
        status: 200,
        message: 'Projects fetched successfully.',
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

  public static async getProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const userId = req.user!.userId;
      const role = req.user!.role;
      const projectId = req.params.id;

      const project = await ProjectService.getProject(orgId, userId, role, projectId);

      res.status(200).json({
        status: 200,
        message: 'Project details fetched successfully.',
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const projectId = req.params.id;
      const { name, description } = req.body;

      const updated = await ProjectService.updateProject(orgId, projectId, { name, description });

      res.status(200).json({
        status: 200,
        message: 'Project updated successfully.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const projectId = req.params.id;

      await ProjectService.deleteProject(orgId, projectId);

      res.status(200).json({
        status: 200,
        message: 'Project deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  public static async assignMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const projectId = req.params.id;
      const { userId } = req.body;

      await ProjectService.assignMember(orgId, projectId, userId);

      res.status(201).json({
        status: 201,
        message: 'Member assigned to project successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  public static async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const projectId = req.params.id;
      const targetUserId = req.params.userId;

      await ProjectService.removeMember(orgId, projectId, targetUserId);

      res.status(200).json({
        status: 200,
        message: 'Member removed from project successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}
