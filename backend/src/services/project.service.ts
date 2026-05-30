import prisma from '../config/prisma.js';
import { Role, Project } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware.js';

export class ProjectService {
  public static async createProject(
    orgId: string,
    data: { name: string; description?: string }
  ): Promise<Project> {
    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        organizationId: orgId,
      },
    });

    return project;
  }

  public static async listProjects(
    orgId: string,
    userId: string,
    role: Role
  ): Promise<Project[]> {
    if (role === Role.ADMIN || role === Role.MANAGER) {
      return prisma.project.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
      });
    }

    return prisma.project.findMany({
      where: {
        organizationId: orgId,
        members: {
          some: { id: userId },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async getProject(
    orgId: string,
    userId: string,
    role: Role,
    projectId: string
  ): Promise<Project & { members: Array<{ id: string; email: string; role: Role }> }> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          select: { id: true, email: true, role: true },
        },
      },
    });

    if (!project || project.organizationId !== orgId) {
      throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');
    }

    if (role === Role.MEMBER) {
      const isMember = project.members.some((m) => m.id === userId);
      if (!isMember) {
        throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');
      }
    }

    return project;
  }

  public static async updateProject(
    orgId: string,
    projectId: string,
    updates: { name?: string; description?: string }
  ): Promise<Project> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.organizationId !== orgId) {
      throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description }),
      },
    });

    return updated;
  }

  public static async deleteProject(orgId: string, projectId: string): Promise<void> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.organizationId !== orgId) {
      throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');
    }

    await prisma.project.delete({
      where: { id: projectId },
    });
  }

  public static async assignMember(
    orgId: string,
    projectId: string,
    targetUserId: string
  ): Promise<void> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.organizationId !== orgId) {
      throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user || user.organizationId !== orgId) {
      throw new AppError('Target user not found in your organization.', 404, 'USER_NOT_FOUND');
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          connect: { id: targetUserId },
        },
      },
    });
  }

  public static async removeMember(
    orgId: string,
    projectId: string,
    targetUserId: string
  ): Promise<void> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.organizationId !== orgId) {
      throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          disconnect: { id: targetUserId },
        },
      },
    });
  }
}
