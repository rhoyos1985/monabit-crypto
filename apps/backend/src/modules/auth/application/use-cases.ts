import { IAuthService } from './ports.js';
import { AuthCredentials, AuthResult, User } from '../domain/types.js';

export const registerUser = (authService: IAuthService) => async (
  credentials: AuthCredentials
): Promise<AuthResult> => {
  if (!credentials.email || !credentials.password) {
    throw new Error('Email and password are required');
  }

  const result = await authService.registerUser(credentials);

  if (result.user.role !== 'user') {
    throw new Error('Registration must create user with role "user"');
  }

  return result;
};

export const loginUser = (authService: IAuthService) => async (
  credentials: AuthCredentials
): Promise<AuthResult> => {
  if (!credentials.email || !credentials.password) {
    throw new Error('Email and password are required');
  }

  return await authService.loginUser(credentials);
};

export const getCurrentUser = (authService: IAuthService) => async (token: string): Promise<User> => {
  if (!token) {
    throw new Error('Token is required');
  }

  return await authService.getCurrentUser(token);
};

export const logoutUser = (authService: IAuthService) => async (): Promise<void> => {
  return await authService.logoutUser();
};
