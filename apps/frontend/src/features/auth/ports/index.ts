import type { AuthResult, LoginInput, RegisterInput, UpdateProfileInput, User } from '../domain/types.js';

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface IAuthRepository {
  register(input: RegisterInput): Promise<AuthResult>;
  login(input: LoginInput): Promise<AuthResult>;
  logout(): Promise<void>;
  getCurrentUser(token: string): Promise<User>;
  signInWithGoogle(): Promise<void>;
  updateMe(input: UpdateProfileInput, token: string): Promise<User>;
  changePassword(input: ChangePasswordInput, token: string): Promise<void>;
}

export interface IAuthProvider {
  signUpWithEmail(email: string, password: string): Promise<{ user: { id: string; email: string } }>;
  signInWithPassword(email: string, password: string): Promise<{ session: { access_token: string } }>;
  signOut(): Promise<void>;
  getSession(): Promise<{ data: { session: { user: { id: string; email: string } } | null } }>;
}
