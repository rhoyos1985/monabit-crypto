import { describe, it, expect, jest } from '@jest/globals';
import { registerUser, loginUser, getCurrentUser, logoutUser } from './use-cases.js';
import { IAuthService } from './ports.js';
import { AuthResult, User } from '../domain/types.js';
import { HTTPBadRequest, HTTPUnauthorized } from '../../../shared/http-error.js';

const buildUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-123',
  email: 'user@example.com',
  firstName: 'Juan',
  lastName: 'Pérez',
  authProvider: 'email',
  role: 'user',
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

const buildAuthResult = (userOverrides: Partial<User> = {}): AuthResult => ({
  user: buildUser(userOverrides),
  token: {
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    expires_in: 3600,
    token_type: 'Bearer',
  },
});

const createMockAuthService = (): jest.Mocked<IAuthService> => ({
  registerUser: jest.fn(),
  loginUser: jest.fn(),
  getCurrentUser: jest.fn(),
  logoutUser: jest.fn(),
  changePassword: jest.fn(),
});

describe('auth use-cases', () => {
  describe('registerUser', () => {
    it('lanza HTTPBadRequest si falta email', async () => {
      const service = createMockAuthService();
      const register = registerUser(service);

      await expect(register({ email: '', password: 'secret123' })).rejects.toThrow(HTTPBadRequest);
      expect(service.registerUser).not.toHaveBeenCalled();
    });

    it('lanza HTTPBadRequest si falta password', async () => {
      const service = createMockAuthService();
      const register = registerUser(service);

      await expect(register({ email: 'a@b.com', password: '' })).rejects.toThrow(HTTPBadRequest);
    });

    it('registra exitosamente cuando el servicio devuelve un usuario con rol user', async () => {
      const service = createMockAuthService();
      const result = buildAuthResult();
      service.registerUser.mockResolvedValue(result);

      const register = registerUser(service);
      const output = await register({ email: 'a@b.com', password: 'secret123' });

      expect(output).toEqual(result);
      expect(service.registerUser).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret123' });
    });

    it('lanza HTTPBadRequest si el servicio retorna un usuario con rol admin', async () => {
      const service = createMockAuthService();
      service.registerUser.mockResolvedValue(buildAuthResult({ role: 'admin' }));

      const register = registerUser(service);
      await expect(register({ email: 'a@b.com', password: 'secret123' })).rejects.toThrow(HTTPBadRequest);
    });
  });

  describe('loginUser', () => {
    it('lanza HTTPBadRequest si falta email o password', async () => {
      const service = createMockAuthService();
      const login = loginUser(service);

      await expect(login({ email: '', password: 'pwd' })).rejects.toThrow(HTTPBadRequest);
      await expect(login({ email: 'a@b.com', password: '' })).rejects.toThrow(HTTPBadRequest);
    });

    it('delega al servicio cuando las credenciales están completas', async () => {
      const service = createMockAuthService();
      const result = buildAuthResult();
      service.loginUser.mockResolvedValue(result);

      const login = loginUser(service);
      const output = await login({ email: 'a@b.com', password: 'pwd123' });

      expect(output).toBe(result);
      expect(service.loginUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCurrentUser', () => {
    it('lanza HTTPUnauthorized si el token está vacío', async () => {
      const service = createMockAuthService();
      const getMe = getCurrentUser(service);

      await expect(getMe('')).rejects.toThrow(HTTPUnauthorized);
      expect(service.getCurrentUser).not.toHaveBeenCalled();
    });

    it('devuelve el usuario cuando el token es válido', async () => {
      const service = createMockAuthService();
      const user = buildUser();
      service.getCurrentUser.mockResolvedValue(user);

      const getMe = getCurrentUser(service);
      await expect(getMe('valid-token')).resolves.toBe(user);
    });
  });

  describe('logoutUser', () => {
    it('llama a logoutUser del servicio', async () => {
      const service = createMockAuthService();
      const logout = logoutUser(service);

      await logout();
      expect(service.logoutUser).toHaveBeenCalledTimes(1);
    });
  });
});
