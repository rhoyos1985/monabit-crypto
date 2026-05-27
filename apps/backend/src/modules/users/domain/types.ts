import type { UserRole } from '../../auth/domain/types.js';

export type { UserRole };

export interface UserDTO {
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
  createdAt: Date;
  updatedAt: Date;
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

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  user: UserDTO;
  token: {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
  };
}

export interface UpdateUserProfileInput {
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface DeactivateUserInput {
  userId: string;
  requesterId: string;
  requesterRole: UserRole;
}

export interface ListUsersInput {
  requesterId: string;
  requesterRole: UserRole;
}
