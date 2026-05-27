import { describe, it, expect, beforeEach, vi } from 'vitest';
import sessionReducer, {
  setLoading,
  setError,
  setSession,
  clearSession,
  setUser,
  SessionState,
  SessionUser,
} from './session.js';

const buildUser = (overrides: Partial<SessionUser> = {}): SessionUser => ({
  id: 'user-1',
  email: 'user@example.com',
  firstName: 'Juan',
  lastName: 'Pérez',
  authProvider: 'email',
  role: 'user',
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const initialState: SessionState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
};

describe('session slice', () => {
  beforeEach(() => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});
  });

  it('setLoading actualiza isLoading', () => {
    const state = sessionReducer(initialState, setLoading(true));
    expect(state.isLoading).toBe(true);
  });

  it('setError almacena el mensaje', () => {
    const state = sessionReducer(initialState, setError('Algo falló'));
    expect(state.error).toBe('Algo falló');
  });

  it('setSession persiste el token en localStorage y guarda usuario', () => {
    const user = buildUser();
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    const state = sessionReducer(initialState, setSession({ user, token: 'jwt-token' }));

    expect(state.user).toEqual(user);
    expect(state.token).toBe('jwt-token');
    expect(setItemSpy).toHaveBeenCalledWith('auth_token', 'jwt-token');
  });

  it('clearSession limpia user, token y remueve del localStorage', () => {
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
    const populated: SessionState = {
      user: buildUser(),
      token: 'jwt',
      isLoading: false,
      error: null,
    };

    const state = sessionReducer(populated, clearSession());

    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(removeItemSpy).toHaveBeenCalledWith('auth_token');
  });

  it('setUser actualiza solo el campo user sin tocar token', () => {
    const populated: SessionState = {
      user: null,
      token: 'jwt',
      isLoading: false,
      error: null,
    };
    const user = buildUser({ firstName: 'Nuevo' });

    const state = sessionReducer(populated, setUser(user));

    expect(state.user).toEqual(user);
    expect(state.token).toBe('jwt');
  });
});
