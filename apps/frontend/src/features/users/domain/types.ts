export interface User {
  id: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  displayName?: string;
  role?: 'admin' | 'user';
}

export interface UpdateUserInput {
  displayName?: string;
}

export interface UserListResponse {
  users: User[];
}
