import type { UserRole } from '../../auth/domain/types.js';

export type { UserRole };

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
  role: UserRole;
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
  role?: UserRole;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  country?: string;
  role?: UserRole;
}

export interface UserListResponse {
  users: User[];
}
