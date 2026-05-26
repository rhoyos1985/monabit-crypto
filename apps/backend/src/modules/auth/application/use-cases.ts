import { IAuthService } from './ports.js';
import { AuthCredentials, AuthResult, User } from '../domain/types.js';
import { HTTPBadRequest, HTTPUnauthorized } from '../../../shared/http-error.js';

export const registerUser = (authService: IAuthService) => async (
  credentials: AuthCredentials
): Promise<AuthResult> => {
  if (!credentials.email || !credentials.password) {
    throw new HTTPBadRequest('El email y contraseña son requeridos');
  }

  const result = await authService.registerUser(credentials);

  if (result.user.role !== 'user') {
    throw new HTTPBadRequest('El usuario debe ser registrado con rol "user"');
  }

  return result;
};

export const loginUser = (authService: IAuthService) => async (
  credentials: AuthCredentials
): Promise<AuthResult> => {
  if (!credentials.email || !credentials.password) {
    throw new HTTPBadRequest('El email y contraseña son requeridos');
  }

  return await authService.loginUser(credentials);
};

export const getCurrentUser = (authService: IAuthService) => async (token: string): Promise<User> => {
  if (!token) {
    throw new HTTPUnauthorized('El token es requerido');
  }

  return await authService.getCurrentUser(token);
};

export const logoutUser = (authService: IAuthService) => async (): Promise<void> => {
  return await authService.logoutUser();
};
