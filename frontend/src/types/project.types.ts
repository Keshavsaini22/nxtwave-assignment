import type { StaffUser } from './user.types.js';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  members?: StaffUser[];
}

export interface PaginatedProjectsResponse {
  items: Project[];
  total: number;
}
