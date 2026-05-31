import { APIClient } from './api.js';
import type { Project, PaginatedProjectsResponse } from '../types/project.types.js';

export class ProjectService {
  public static async listProjects(page: number, limit: number): Promise<PaginatedProjectsResponse> {
    return APIClient.get<PaginatedProjectsResponse>(`/projects?page=${page}&limit=${limit}`);
  }

  public static async getProject(projectId: string): Promise<Project> {
    return APIClient.get<Project>(`/projects/${projectId}`);
  }

  public static async createProject(payload: { name: string; description?: string }): Promise<Project> {
    return APIClient.post<Project>('/projects', payload);
  }

  public static async updateProject(projectId: string, updates: { name?: string; description?: string }): Promise<Project> {
    return APIClient.patch<Project>(`/projects/${projectId}`, updates);
  }

  public static async deleteProject(projectId: string): Promise<void> {
    return APIClient.delete(`/projects/${projectId}`);
  }

  public static async assignMember(projectId: string, userId: string): Promise<void> {
    return APIClient.post(`/projects/${projectId}/members`, { userId });
  }

  public static async removeMember(projectId: string, userId: string): Promise<void> {
    return APIClient.delete(`/projects/${projectId}/members/${userId}`);
  }
}
