export interface UserDTO {
  id: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  displayName?: string;
  role?: 'admin' | 'user';
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
  displayName?: string;
}

export interface DeactivateUserInput {
  userId: string;
  requesterId: string;
  requesterRole: 'admin' | 'user';
}

export interface ListUsersInput {
  requesterId: string;
  requesterRole: 'admin' | 'user';
}
