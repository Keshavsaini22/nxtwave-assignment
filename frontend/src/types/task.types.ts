import type { StaffUser } from './user.types.js';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';
  organizationId: string;
  projectId: string;
  assigneeId: string | null;
  assignee?: StaffUser | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedTasksResponse {
  items: Task[];
  total: number;
}
