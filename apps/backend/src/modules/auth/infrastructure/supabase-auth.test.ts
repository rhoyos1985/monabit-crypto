import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseAuthService } from './supabase-auth.js';
import {
  HTTPConflict,
  HTTPUnauthorized,
  HTTPBadRequest,
} from '../../../shared/http-error.js';

const buildSession = (overrides: Record<string, unknown> = {}) => ({
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  expires_in: 3600,
  ...overrides,
});

const buildAuthUser = () => ({ id: 'user-1', email: 'user@example.com' });

const buildProfileRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
  email: 'user@example.com',
  first_name: 'Juan',
  last_name: 'Pérez',
  city: null,
  state: null,
  country: null,
  avatar_url: null,
  auth_provider: 'email',
  role: 'user',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

const buildClient = (config: {
  signUp?: unknown;
  signIn?: unknown;
  getUser?: unknown;
  profile?: ReturnType<typeof buildProfileRow> | null;
  profileError?: unknown;
  updateUserResult?: unknown;
}): jest.Mocked<SupabaseClient> => {
  const queryChain = {
    select: jest.fn(),
    eq: jest.fn(),
    single: jest
      .fn()
      .mockResolvedValue({ data: config.profile ?? null, error: config.profileError ?? null }),
  };
  queryChain.select.mockReturnValue(queryChain);
  queryChain.eq.mockReturnValue(queryChain);

  const mock = {
    auth: {
      signUp: jest.fn().mockResolvedValue(config.signUp ?? { data: null, error: null }),
      signInWithPassword: jest
        .fn()
        .mockResolvedValue(config.signIn ?? { data: null, error: null }),
      getUser: jest.fn().mockResolvedValue(config.getUser ?? { data: { user: null }, error: null }),
      admin: {
        updateUserById: jest
          .fn()
          .mockResolvedValue(config.updateUserResult ?? { data: null, error: null }),
      },
    },
    from: jest.fn().mockReturnValue(queryChain),
  };
  return mock as unknown as jest.Mocked<SupabaseClient>;
};

describe('SupabaseAuthService', () => {
  describe('registerUser', () => {
    it('lanza HTTPConflict cuando Supabase reporta usuario ya registrado', async () => {
      const client = buildClient({
        signUp: { data: null, error: { message: 'User already registered' } },
      });
      const service = createSupabaseAuthService(client);

      await expect(
        service.registerUser({ email: 'a@b.com', password: 'pwd12345' })
      ).rejects.toThrow(HTTPConflict);
    });

    it('lanza HTTPBadRequest cuando signUp falla por red', async () => {
      const client = buildClient({});
      client.auth.signUp.mockRejectedValueOnce(new Error('network error'));
      const service = createSupabaseAuthService(client);

      await expect(
        service.registerUser({ email: 'a@b.com', password: 'pwd12345' })
      ).rejects.toThrow(HTTPBadRequest);
    });

    it('crea sesión y devuelve user + token correctamente', async () => {
      const client = buildClient({
        signUp: { data: { user: buildAuthUser(), session: buildSession() }, error: null },
        getUser: { data: { user: buildAuthUser() }, error: null },
        profile: buildProfileRow(),
      });
      const service = createSupabaseAuthService(client);

      const result = await service.registerUser({ email: 'a@b.com', password: 'pwd12345' });

      expect(result.token.access_token).toBe('access-token');
      expect(result.user.email).toBe('user@example.com');
    });
  });

  describe('loginUser', () => {
    it('lanza HTTPUnauthorized cuando las credenciales son incorrectas', async () => {
      const client = buildClient({
        signIn: { data: null, error: { message: 'Invalid login credentials' } },
      });
      const service = createSupabaseAuthService(client);

      await expect(
        service.loginUser({ email: 'a@b.com', password: 'wrong' })
      ).rejects.toThrow(HTTPUnauthorized);
    });

    it('devuelve user + token con credenciales correctas', async () => {
      const client = buildClient({
        signIn: { data: { user: buildAuthUser(), session: buildSession() }, error: null },
        getUser: { data: { user: buildAuthUser() }, error: null },
        profile: buildProfileRow(),
      });
      const service = createSupabaseAuthService(client);

      const result = await service.loginUser({ email: 'a@b.com', password: 'pwd12345' });
      expect(result.user.role).toBe('user');
    });
  });

  describe('getCurrentUser', () => {
    it('lanza HTTPUnauthorized si no hay token', async () => {
      const client = buildClient({});
      const service = createSupabaseAuthService(client);

      await expect(service.getCurrentUser('')).rejects.toThrow(HTTPUnauthorized);
    });

    it('lanza HTTPUnauthorized si Supabase reporta token inválido', async () => {
      const client = buildClient({
        getUser: { data: { user: null }, error: { message: 'invalid token' } },
      });
      const service = createSupabaseAuthService(client);

      await expect(service.getCurrentUser('bad-token')).rejects.toThrow(HTTPUnauthorized);
    });

    it('lanza HTTPBadRequest si no encuentra el profile', async () => {
      const client = buildClient({
        getUser: { data: { user: buildAuthUser() }, error: null },
        profile: null,
        profileError: { message: 'not found' },
      });
      const service = createSupabaseAuthService(client);

      await expect(service.getCurrentUser('token')).rejects.toThrow(HTTPBadRequest);
    });

    it('devuelve el usuario mapeado', async () => {
      const client = buildClient({
        getUser: { data: { user: buildAuthUser() }, error: null },
        profile: buildProfileRow({ role: 'admin' }),
      });
      const service = createSupabaseAuthService(client);

      const user = await service.getCurrentUser('token');
      expect(user.role).toBe('admin');
    });
  });

  describe('logoutUser', () => {
    it('resuelve sin errores (no-op)', async () => {
      const client = buildClient({});
      const service = createSupabaseAuthService(client);
      await expect(service.logoutUser()).resolves.toBeUndefined();
    });
  });

  describe('changePassword', () => {
    it('lanza HTTPBadRequest si el usuario es de Google', async () => {
      const client = buildClient({ profile: buildProfileRow({ auth_provider: 'google' }) });
      const service = createSupabaseAuthService(client);

      await expect(
        service.changePassword('u-1', 'u@x.com', 'old', 'new12345')
      ).rejects.toThrow(HTTPBadRequest);
    });

    it('lanza HTTPBadRequest si el profile no se encuentra', async () => {
      const client = buildClient({ profile: null, profileError: { message: 'not found' } });
      const service = createSupabaseAuthService(client);

      await expect(
        service.changePassword('u-1', 'u@x.com', 'old', 'new12345')
      ).rejects.toThrow(HTTPBadRequest);
    });

    it('lanza HTTPUnauthorized si la contraseña actual es incorrecta', async () => {
      const client = buildClient({
        profile: buildProfileRow({ auth_provider: 'email' }),
        signIn: { data: null, error: { message: 'Invalid' } },
      });
      const service = createSupabaseAuthService(client);

      await expect(
        service.changePassword('u-1', 'u@x.com', 'wrong', 'new12345')
      ).rejects.toThrow(HTTPUnauthorized);
    });

    it('lanza HTTPBadRequest si updateUserById falla', async () => {
      const client = buildClient({
        profile: buildProfileRow({ auth_provider: 'email' }),
        signIn: { data: { user: buildAuthUser(), session: buildSession() }, error: null },
        updateUserResult: { data: null, error: { message: 'update failed' } },
      });
      const service = createSupabaseAuthService(client);

      await expect(
        service.changePassword('u-1', 'u@x.com', 'old12345', 'new12345')
      ).rejects.toThrow(HTTPBadRequest);
    });

    it('actualiza la contraseña exitosamente', async () => {
      const client = buildClient({
        profile: buildProfileRow({ auth_provider: 'email' }),
        signIn: { data: { user: buildAuthUser(), session: buildSession() }, error: null },
        updateUserResult: { data: { user: buildAuthUser() }, error: null },
      });
      const service = createSupabaseAuthService(client);

      await expect(
        service.changePassword('u-1', 'u@x.com', 'old12345', 'new12345')
      ).resolves.toBeUndefined();
      expect(client.auth.admin.updateUserById).toHaveBeenCalledWith('u-1', {
        password: 'new12345',
      });
    });
  });
});
