export interface AuthCredentials {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface AuthToken {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

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
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResult {
  user: User;
  token: AuthToken;
}
