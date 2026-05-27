export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  country?: string;
  avatarUrl?: string;
  authProvider: 'email' | 'google';
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  country?: string;
  role?: 'admin' | 'user';
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface UserListResponse {
  users: User[];
}
