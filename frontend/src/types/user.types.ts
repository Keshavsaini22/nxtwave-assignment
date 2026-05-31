export interface StaffUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  isBlocked: boolean;
  createdAt: string;
}

export interface PaginatedUsersResponse {
  items: StaffUser[];
  total: number;
}
