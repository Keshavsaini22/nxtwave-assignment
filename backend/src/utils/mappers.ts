export interface PublicUser {
  id: string;
  email: string;
  role: string;
  isBlocked: boolean;
  organizationId: string;
  createdAt: Date;
}

export interface PublicProject {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  members?: PublicUser[];
}

export interface PublicTask {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  organizationId: string;
  projectId: string;
  assigneeId: string | null;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const mapUserToPublic = (user: any): PublicUser => {
  if (!user) return user;
  return {
    id: user.uuid,
    email: user.email,
    role: user.role,
    isBlocked: user.isBlocked,
    organizationId: user.organization?.uuid || user.organizationUuid || '',
    createdAt: user.createdAt,
  };
};

export const mapProjectToPublic = (project: any): PublicProject => {
  if (!project) return project;
  return {
    id: project.uuid,
    name: project.name,
    description: project.description,
    organizationId: project.organization?.uuid || project.organizationUuid || '',
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    members: project.members ? project.members.map(mapUserToPublic) : undefined,
  };
};

export const mapTaskToPublic = (task: any): PublicTask => {
  if (!task) return task;
  return {
    id: task.uuid,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    organizationId: task.organization?.uuid || task.organizationUuid || '',
    projectId: task.project?.uuid || task.projectUuid || '',
    assigneeId: task.assignee?.uuid || task.assigneeUuid || null,
    dueDate: task.dueDate,
    completedAt: task.completedAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
};
