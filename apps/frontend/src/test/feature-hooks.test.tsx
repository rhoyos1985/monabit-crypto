import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { buildTestStore } from './utils.js';
import type { SessionState } from '../app/slices/session.js';

const usersMocks = vi.hoisted(() => ({
  listUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deactivateUser: vi.fn(),
}));

const marketMocks = vi.hoisted(() => ({ getMarketOverview: vi.fn() }));

const prefsMocks = vi.hoisted(() => ({
  getMyPreferences: vi.fn(),
  updateMyPreferences: vi.fn(),
  toggleFavorite: vi.fn(),
}));

const locationsMocks = vi.hoisted(() => ({ getCities: vi.fn() }));

vi.mock('../features/users/infrastructure/users-api-client.js', () => ({
  createUserRepository: () => usersMocks,
}));
vi.mock('../features/dashboard/infrastructure/market-api-client.js', () => ({
  createMarketRepository: () => marketMocks,
}));
vi.mock('../features/preferences/infrastructure/api-client.js', () => ({
  createPreferencesRepository: () => prefsMocks,
}));
vi.mock('../features/locations/infrastructure/api-client.js', () => ({
  createLocationsRepository: () => locationsMocks,
}));

import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeactivateUser,
} from '../features/users/application/hooks.js';
import { useMarketOverview } from '../features/dashboard/application/hooks.js';
import {
  usePreferences,
  useUpdatePreferences,
  useToggleFavorite,
} from '../features/preferences/application/hooks.js';
import { useCities } from '../features/locations/application/hooks.js';

const buildWrapper = (state?: Partial<SessionState>) => {
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

describe('Users feature hooks', () => {
  beforeEach(() => {
    Object.values(usersMocks).forEach((m) => m.mockReset());
  });

  it('useUsers carga la lista', async () => {
    usersMocks.listUsers.mockResolvedValueOnce([{ id: 'u-1' }]);
    const { result } = renderHook(() => useUsers(), { wrapper: buildWrapper() });
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
    expect(usersMocks.listUsers).toHaveBeenCalled();
  });

  it('useCreateUser ejecuta mutación', async () => {
    usersMocks.createUser.mockResolvedValueOnce({ id: 'new' });
    const { result } = renderHook(() => useCreateUser(), { wrapper: buildWrapper() });
    await act(async () => {
      await result.current.mutateAsync({ email: 'n@b.com', password: 'pwd12345' });
    });
    expect(usersMocks.createUser).toHaveBeenCalled();
  });

  it('useUpdateUser ejecuta mutación con id e input', async () => {
    usersMocks.updateUser.mockResolvedValueOnce({ id: 'u-1' });
    const { result } = renderHook(() => useUpdateUser(), { wrapper: buildWrapper() });
    await act(async () => {
      await result.current.mutateAsync({ id: 'u-1', input: { firstName: 'X' } });
    });
    expect(usersMocks.updateUser).toHaveBeenCalledWith('u-1', { firstName: 'X' });
  });

  it('useDeactivateUser ejecuta mutación', async () => {
    usersMocks.deactivateUser.mockResolvedValueOnce({ id: 'u-1', isActive: false });
    const { result } = renderHook(() => useDeactivateUser(), { wrapper: buildWrapper() });
    await act(async () => {
      await result.current.mutateAsync('u-1');
    });
    expect(usersMocks.deactivateUser).toHaveBeenCalledWith('u-1');
  });
});

describe('Dashboard feature hooks', () => {
  beforeEach(() => {
    marketMocks.getMarketOverview.mockReset();
  });

  it('useMarketOverview carga el overview', async () => {
    marketMocks.getMarketOverview.mockResolvedValueOnce({
      topCryptos: [],
      marketKpis: {},
      lastFetched: '',
    });
    const { result } = renderHook(() => useMarketOverview(), { wrapper: buildWrapper() });
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });
});

describe('Preferences feature hooks', () => {
  beforeEach(() => {
    Object.values(prefsMocks).forEach((m) => m.mockReset());
  });

  it('usePreferences se deshabilita sin token', async () => {
    const { result } = renderHook(() => usePreferences(), {
      wrapper: buildWrapper({ token: null }),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(prefsMocks.getMyPreferences).not.toHaveBeenCalled();
  });

  it('usePreferences carga con token presente', async () => {
    prefsMocks.getMyPreferences.mockResolvedValueOnce({
      userId: 'u-1',
      theme: 'light',
      favoriteCoins: [],
      updatedAt: '',
    });
    const { result } = renderHook(() => usePreferences(), {
      wrapper: buildWrapper({ token: 'jwt' }),
    });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(prefsMocks.getMyPreferences).toHaveBeenCalledWith('jwt');
  });

  it('useUpdatePreferences lanza si no hay token', async () => {
    const { result } = renderHook(() => useUpdatePreferences(), {
      wrapper: buildWrapper({ token: null }),
    });
    await expect(result.current.mutateAsync({ theme: 'dark' })).rejects.toThrow(/sesión/i);
  });

  it('useUpdatePreferences ejecuta mutación con token', async () => {
    prefsMocks.updateMyPreferences.mockResolvedValueOnce({
      userId: 'u-1',
      theme: 'dark',
      favoriteCoins: [],
      updatedAt: '',
    });
    const { result } = renderHook(() => useUpdatePreferences(), {
      wrapper: buildWrapper({ token: 'jwt' }),
    });
    await act(async () => {
      await result.current.mutateAsync({ theme: 'dark' });
    });
    expect(prefsMocks.updateMyPreferences).toHaveBeenCalled();
  });

  it('useToggleFavorite lanza si no hay token', async () => {
    const { result } = renderHook(() => useToggleFavorite(), {
      wrapper: buildWrapper({ token: null }),
    });
    await expect(result.current.mutateAsync('bitcoin')).rejects.toThrow(/sesión/i);
  });

  it('useToggleFavorite ejecuta mutación con coinId y token', async () => {
    prefsMocks.toggleFavorite.mockResolvedValueOnce({
      userId: 'u-1',
      theme: 'light',
      favoriteCoins: ['bitcoin'],
      updatedAt: '',
    });
    const { result } = renderHook(() => useToggleFavorite(), {
      wrapper: buildWrapper({ token: 'jwt' }),
    });
    await act(async () => {
      await result.current.mutateAsync('bitcoin');
    });
    expect(prefsMocks.toggleFavorite).toHaveBeenCalledWith('bitcoin', 'jwt');
  });
});

describe('Locations feature hooks', () => {
  beforeEach(() => {
    locationsMocks.getCities.mockReset();
  });

  it('useCities carga el listado de ciudades', async () => {
    locationsMocks.getCities.mockResolvedValueOnce([
      { city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', label: '' },
    ]);
    const { result } = renderHook(() => useCities(), { wrapper: buildWrapper() });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toHaveLength(1);
  });
});
