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

export interface AuthToken {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export interface AuthResult {
  user: User;
  token: AuthToken;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  city: string;
  state: string;
  country: string;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthError {
  message: string;
  code?: string;
}
