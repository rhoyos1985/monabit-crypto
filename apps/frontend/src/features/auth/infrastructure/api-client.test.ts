import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAuthRepository } from './api-client.js';

vi.mock('../../../shared/supabase.js', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
    },
  },
}));

import { supabase } from '../../../shared/supabase.js';

const apiResponse = <T>(data: T, status = 200, message = 'ok'): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({ httpStatus: `${status}`, apiMessage: message, apiData: data }),
  }) as Response;

const errorResponse = (message: string, status = 400): Response =>
  ({
    ok: false,
    status,
    json: async () => ({ httpStatus: `${status}`, apiMessage: message, apiData: null }),
  }) as Response;

describe('AuthRepository (api-client)', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch');
    localStorage.clear();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('register hace POST a /auth/register y devuelve AuthResult', async () => {
    fetchSpy.mockResolvedValueOnce(
      apiResponse({
        user: { id: 'u-1', email: 'a@b.com', authProvider: 'email', role: 'user', isActive: true, createdAt: '', updatedAt: '' },
        token: { access_token: 't', expires_in: 3600, token_type: 'Bearer' },
      })
    );

    const repo = createAuthRepository();
    const result = await repo.register({
      email: 'a@b.com',
      password: 'pwd12345',
      firstName: 'A',
      lastName: 'B',
      city: 'Bogotá',
      state: 'Cundinamarca',
      country: 'Colombia',
    });

    expect(result.user.email).toBe('a@b.com');
    const [, init] = fetchSpy.mock.calls[0]!;
    expect((init as RequestInit).method).toBe('POST');
  });

  it('login hace POST a /auth/login', async () => {
    fetchSpy.mockResolvedValueOnce(
      apiResponse({
        user: { id: 'u-1', email: 'a@b.com', authProvider: 'email', role: 'user', isActive: true, createdAt: '', updatedAt: '' },
        token: { access_token: 't', expires_in: 3600, token_type: 'Bearer' },
      })
    );

    const repo = createAuthRepository();
    await repo.login({ email: 'a@b.com', password: 'pwd' });
    expect(fetchSpy).toHaveBeenCalled();
  });

  it('login lanza Error con el mensaje del backend cuando falla', async () => {
    fetchSpy.mockResolvedValueOnce(errorResponse('Credenciales inválidas', 401));
    const repo = createAuthRepository();
    await expect(repo.login({ email: 'a@b.com', password: 'bad' })).rejects.toThrow(
      'Credenciales inválidas'
    );
  });

  it('login lanza error cuando fetch falla (no hay red)', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Failed to fetch'));
    const repo = createAuthRepository();
    await expect(repo.login({ email: 'a@b.com', password: 'x' })).rejects.toThrow(
      /No hay conexión/
    );
  });

  it('logout hace POST a /auth/logout (la cookie httpOnly se limpia en el backend)', async () => {
    fetchSpy.mockResolvedValueOnce(apiResponse(null));
    const repo = createAuthRepository();
    await repo.logout();
    expect(fetchSpy).toHaveBeenCalled();
    const [, init] = fetchSpy.mock.calls[0]!;
    expect((init as RequestInit).method).toBe('POST');
    expect((init as RequestInit).credentials).toBe('include');
  });

  it('getCurrentUser hace GET a /auth/me usando la cookie (credentials: include)', async () => {
    fetchSpy.mockResolvedValueOnce(
      apiResponse({ id: 'u-1', email: 'a@b.com', authProvider: 'email', role: 'user', isActive: true, createdAt: '', updatedAt: '' })
    );
    const repo = createAuthRepository();
    const user = await repo.getCurrentUser();
    expect(user.email).toBe('a@b.com');
    const [, init] = fetchSpy.mock.calls[0]!;
    expect((init as RequestInit).credentials).toBe('include');
  });

  it('createSession intercambia el token de Supabase por la cookie httpOnly', async () => {
    fetchSpy.mockResolvedValueOnce(
      apiResponse({ id: 'u-1', email: 'a@b.com', authProvider: 'google', role: 'user', isActive: true, createdAt: '', updatedAt: '' })
    );
    const repo = createAuthRepository();
    const user = await repo.createSession('supabase-token');
    expect(user.email).toBe('a@b.com');
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toContain('/auth/session');
    expect((init as RequestInit).method).toBe('POST');
  });

  it('signInWithGoogle delega en supabase.auth.signInWithOAuth', async () => {
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValueOnce({
      data: { provider: 'google', url: '' },
      error: null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const repo = createAuthRepository();
    await repo.signInWithGoogle();
    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google' })
    );
  });

  it('signInWithGoogle lanza error cuando supabase reporta error', async () => {
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValueOnce({
      data: null,
      error: { message: 'oauth failed' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const repo = createAuthRepository();
    await expect(repo.signInWithGoogle()).rejects.toThrow();
  });

  it('updateMe hace PATCH a /users/me', async () => {
    fetchSpy.mockResolvedValueOnce(
      apiResponse({ id: 'u-1', email: 'a@b.com', firstName: 'Nuevo', authProvider: 'email', role: 'user', isActive: true, createdAt: '', updatedAt: '' })
    );
    const repo = createAuthRepository();
    const user = await repo.updateMe({ firstName: 'Nuevo' });
    expect(user.firstName).toBe('Nuevo');
  });

  it('changePassword hace POST a /auth/change-password', async () => {
    fetchSpy.mockResolvedValueOnce(apiResponse({ success: true }));
    const repo = createAuthRepository();
    await repo.changePassword({ currentPassword: 'old', newPassword: 'new12345' });
    expect(fetchSpy).toHaveBeenCalled();
  });
});
