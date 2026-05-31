import { APIClient } from './api.js';
import type { Task, PaginatedTasksResponse } from '../types/task.types.js';

export class TaskService {
  public static async listTasks(
    projectId: string,
    filters: { page: number; limit: number; status?: string; priority?: string }
  ): Promise<PaginatedTasksResponse> {
    let url = `/tasks?projectId=${projectId}&page=${filters.page}&limit=${filters.limit}`;
    if (filters.status) url += `&status=${filters.status}`;
    if (filters.priority) url += `&priority=${filters.priority}`;
    return APIClient.get<PaginatedTasksResponse>(url);
  }

  public static async createTask(payload: {
    title: string;
    description?: string;
    priority?: string;
    projectId: string;
    assigneeId?: string;
    dueDate?: string;
  }): Promise<Task> {
    return APIClient.post<Task>('/tasks', payload);
  }

  public static async updateTaskStatus(taskId: string, status: string): Promise<Task> {
    return APIClient.patch<Task>(`/tasks/${taskId}/status`, { status });
  }

  public static async deleteTask(taskId: string): Promise<void> {
    return APIClient.delete(`/tasks/${taskId}`);
  }
}
