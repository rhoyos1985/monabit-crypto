import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useLogin,
  useRegister,
  useLogout,
  useSessionBootstrap,
  useAuth,
  useUpdateProfile,
  useChangePassword,
  useGoogleLogin,
} from './hooks.js';
import { buildTestStore } from '../../../test/utils.js';
import type { SessionState } from '../../../app/slices/session.js';

const buildUser = () => ({
  id: 'u-1',
  email: 'a@b.com',
  firstName: 'Juan',
  lastName: 'Pérez',
  authProvider: 'email' as const,
  role: 'user' as const,
  isActive: true,
  createdAt: '',
  updatedAt: '',
});

const mocks = vi.hoisted(() => ({
  register: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  signInWithGoogle: vi.fn(),
  createSession: vi.fn(),
  updateMe: vi.fn(),
  changePassword: vi.fn(),
}));

vi.mock('../infrastructure/api-client.js', () => ({
  createAuthRepository: () => mocks,
}));

const wrapperWith = (state?: Partial<SessionState>) => {
  const store = buildTestStore(state);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );
};

describe('Auth hooks', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
  });

  it('useLogin envuelve la llamada al repository y guarda sesión en Redux', async () => {
    mocks.login.mockResolvedValueOnce({
      user: buildUser(),
      token: { access_token: 'jwt', expires_in: 3600, token_type: 'Bearer' },
    });
    const { result } = renderHook(() => useLogin(), { wrapper: wrapperWith() });

    await act(async () => {
      await result.current({ email: 'a@b.com', password: 'pwd' });
    });
    expect(mocks.login).toHaveBeenCalled();
  });

  it('useLogin propaga el error y lo guarda en el slice', async () => {
    mocks.login.mockRejectedValueOnce(new Error('Credenciales'));
    const { result } = renderHook(() => useLogin(), { wrapper: wrapperWith() });

    await expect(result.current({ email: 'a@b.com', password: 'x' })).rejects.toThrow();
  });

  it('useRegister llama al repository y dispara setSession', async () => {
    mocks.register.mockResolvedValueOnce({
      user: buildUser(),
      token: { access_token: 'jwt', expires_in: 3600, token_type: 'Bearer' },
    });
    const { result } = renderHook(() => useRegister(), { wrapper: wrapperWith() });
    await act(async () => {
      await result.current({
        email: 'a@b.com',
        password: 'pwd',
        firstName: 'A',
        lastName: 'B',
        city: 'Bogotá',
        state: 'Cundinamarca',
        country: 'Colombia',
      });
    });
    expect(mocks.register).toHaveBeenCalled();
  });

  it('useRegister propaga errores del repository', async () => {
    mocks.register.mockRejectedValueOnce(new Error('fail'));
    const { result } = renderHook(() => useRegister(), { wrapper: wrapperWith() });
    await expect(
      result.current({
        email: 'a@b.com',
        password: 'pwd',
        firstName: 'A',
        lastName: 'B',
        city: 'X',
        state: 'X',
        country: 'X',
      })
    ).rejects.toThrow();
  });

  it('useLogout limpia la sesión incluso si el endpoint falla', async () => {
    mocks.logout.mockRejectedValueOnce(new Error('net'));
    const { result } = renderHook(() => useLogout(), { wrapper: wrapperWith() });
    await act(async () => {
      await result.current();
    });
    expect(mocks.logout).toHaveBeenCalled();
  });

  it('useSessionBootstrap rehidrata el usuario desde la cookie (GET /auth/me)', async () => {
    mocks.getCurrentUser.mockResolvedValueOnce(buildUser());
    const { result } = renderHook(
      () => {
        useSessionBootstrap();
        return useAuth();
      },
      { wrapper: wrapperWith() }
    );

    await waitFor(() => {
      expect(mocks.getCurrentUser).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(result.current.user?.email).toBe('a@b.com');
      expect(result.current.bootstrapped).toBe(true);
    });
  });

  it('useSessionBootstrap limpia la sesión cuando no hay cookie válida', async () => {
    mocks.getCurrentUser.mockRejectedValueOnce(new Error('expired'));
    const { result } = renderHook(
      () => {
        useSessionBootstrap();
        return useAuth();
      },
      { wrapper: wrapperWith() }
    );
    await waitFor(() => {
      expect(mocks.getCurrentUser).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.bootstrapped).toBe(true);
    });
  });

  it('useSessionBootstrap no consulta si ya está rehidratada', () => {
    renderHook(() => useSessionBootstrap(), {
      wrapper: wrapperWith({ bootstrapped: true }),
    });
    expect(mocks.getCurrentUser).not.toHaveBeenCalled();
  });

  it('useAuth devuelve user + isAuthenticated correcto', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: wrapperWith({ user: buildUser() }),
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('a@b.com');
  });

  it('useUpdateProfile delega al repository con el input', async () => {
    mocks.updateMe.mockResolvedValueOnce(buildUser());
    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: wrapperWith({ user: buildUser() }),
    });
    await act(async () => {
      await result.current({ firstName: 'Nuevo' });
    });
    expect(mocks.updateMe).toHaveBeenCalledWith({ firstName: 'Nuevo' });
  });

  it('useUpdateProfile propaga errores del repository', async () => {
    mocks.updateMe.mockRejectedValueOnce(new Error('fail'));
    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: wrapperWith({ user: buildUser() }),
    });
    await expect(result.current({ firstName: 'X' })).rejects.toThrow();
  });

  it('useChangePassword delega al repository', async () => {
    mocks.changePassword.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useChangePassword(), {
      wrapper: wrapperWith({ user: buildUser() }),
    });
    await act(async () => {
      await result.current({ currentPassword: 'old', newPassword: 'new12345' });
    });
    expect(mocks.changePassword).toHaveBeenCalledWith({
      currentPassword: 'old',
      newPassword: 'new12345',
    });
  });

  it('useChangePassword propaga errores del repo', async () => {
    mocks.changePassword.mockRejectedValueOnce(new Error('bad password'));
    const { result } = renderHook(() => useChangePassword(), {
      wrapper: wrapperWith({ user: buildUser() }),
    });
    await expect(
      result.current({ currentPassword: 'x', newPassword: 'new12345' })
    ).rejects.toThrow();
  });

  it('useGoogleLogin delega al repository.signInWithGoogle', async () => {
    mocks.signInWithGoogle.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useGoogleLogin(), { wrapper: wrapperWith() });
    await act(async () => {
      await result.current();
    });
    expect(mocks.signInWithGoogle).toHaveBeenCalled();
  });

  it('useGoogleLogin propaga errores', async () => {
    mocks.signInWithGoogle.mockRejectedValueOnce(new Error('oauth'));
    const { result } = renderHook(() => useGoogleLogin(), { wrapper: wrapperWith() });
    await expect(result.current()).rejects.toThrow();
  });
});
