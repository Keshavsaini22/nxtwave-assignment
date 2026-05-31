import prisma from '../config/prisma.js';
import { Role } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware.js';
import { mapProjectToPublic, PublicProject } from '../utils/mappers.js';

export class ProjectService {
  public static async createProject(
    orgId: string,
    data: { name: string; description?: string }
  ): Promise<PublicProject> {
    const org = await prisma.organization.findUnique({
      where: { uuid: orgId },
    });

    if (!org) {
      throw new AppError('Organization not found.', 404, 'ORGANIZATION_NOT_FOUND');
    }

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        organizationId: org.id,
      },
      include: { organization: true },
    });

    return mapProjectToPublic(project);
  }

  public static async listProjects(
    orgId: string,
    userId: string,
    role: Role,
    page: number,
    limit: number
  ): Promise<{ items: PublicProject[]; total: number }> {
    const skip = (page - 1) * limit;

    if (role === Role.ADMIN || role === Role.MANAGER) {
      const [projects, total] = await prisma.$transaction([
        prisma.project.findMany({
          where: { organization: { uuid: orgId } },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { organization: true },
        }),
        prisma.project.count({
          where: { organization: { uuid: orgId } },
        }),
      ]);
      return { items: projects.map(mapProjectToPublic), total };
    }

    const [projects, total] = await prisma.$transaction([
      prisma.project.findMany({
        where: {
          organization: { uuid: orgId },
          members: {
            some: { uuid: userId },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { organization: true },
      }),
      prisma.project.count({
        where: {
          organization: { uuid: orgId },
          members: {
            some: { uuid: userId },
          },
        },
      }),
    ]);

    return { items: projects.map(mapProjectToPublic), total };
  }

  public static async getProject(
    orgId: string,
    userId: string,
    role: Role,
    projectId: string
  ): Promise<PublicProject> {
    const project = await prisma.project.findUnique({
      where: { uuid: projectId },
      include: {
        organization: true,
        members: {
          include: { organization: true },
        },
      },
    });

    if (!project || project.organization.uuid !== orgId) {
      throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');
    }

    if (role === Role.MEMBER) {
      const isMember = project.members.some((m) => m.uuid === userId);
      if (!isMember) {
        throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');
      }
    }

    return mapProjectToPublic(project);
  }

  public static async updateProject(
    orgId: string,
    projectId: string,
    updates: { name?: string; description?: string }
  ): Promise<PublicProject> {
    const project = await prisma.project.findUnique({
      where: { uuid: projectId },
      include: { organization: true },
    });

    if (!project || project.organization.uuid !== orgId) {
      throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');
    }

    const updated = await prisma.project.update({
      where: { id: project.id },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description }),
      },
      include: { organization: true },
    });

    return mapProjectToPublic(updated);
  }

  public static async deleteProject(orgId: string, projectId: string): Promise<void> {
    const project = await prisma.project.findUnique({
      where: { uuid: projectId },
      include: { organization: true },
    });

    if (!project || project.organization.uuid !== orgId) {
      throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');
    }

    await prisma.project.delete({
      where: { id: project.id },
    });
  }

  public static async assignMember(
    orgId: string,
    projectId: string,
    targetUserId: string
  ): Promise<void> {
    const [project, user] = await Promise.all([
      prisma.project.findUnique({ where: { uuid: projectId }, include: { organization: true } }),
      prisma.user.findUnique({ where: { uuid: targetUserId }, include: { organization: true } }),
    ]);

    if (!project || project.organization.uuid !== orgId) {
      throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');
    }

    if (!user || user.organization.uuid !== orgId) {
      throw new AppError('Target user not found in your organization.', 404, 'USER_NOT_FOUND');
    }

    await prisma.project.update({
      where: { id: project.id },
      data: {
        members: {
          connect: { id: user.id },
        },
      },
    });
  }

  public static async removeMember(
    orgId: string,
    projectId: string,
    targetUserId: string
  ): Promise<void> {
    const [project, user] = await Promise.all([
      prisma.project.findUnique({ where: { uuid: projectId }, include: { organization: true } }),
      prisma.user.findUnique({ where: { uuid: targetUserId } }),
    ]);

    if (!project || project.organization.uuid !== orgId) {
      throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');
    }

    if (!user) {
      throw new AppError('Target user not found.', 404, 'USER_NOT_FOUND');
    }

    await prisma.project.update({
      where: { id: project.id },
      data: {
        members: {
          disconnect: { id: user.id },
        },
      },
    });
  }
}
