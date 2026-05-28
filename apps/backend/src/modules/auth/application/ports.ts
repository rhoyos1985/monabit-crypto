import { User, AuthToken, AuthCredentials } from '../domain/types.js';

export interface IAuthService {
  registerUser(credentials: AuthCredentials): Promise<{ user: User; token: AuthToken }>;

  loginUser(credentials: AuthCredentials): Promise<{ user: User; token: AuthToken }>;

  getCurrentUser(token: string): Promise<User>;

  logoutUser(): Promise<void>;

  changePassword(
    userId: string,
    email: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void>;
}
