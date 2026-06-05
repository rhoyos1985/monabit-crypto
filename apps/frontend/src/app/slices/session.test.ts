import { describe, it, expect } from 'vitest';
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
  isLoading: false,
  error: null,
  bootstrapped: false,
};

describe('session slice', () => {
  it('setLoading actualiza isLoading', () => {
    const state = sessionReducer(initialState, setLoading(true));
    expect(state.isLoading).toBe(true);
  });

  it('setError almacena el mensaje', () => {
    const state = sessionReducer(initialState, setError('Algo falló'));
    expect(state.error).toBe('Algo falló');
  });

  it('setSession guarda el usuario y marca la sesión rehidratada', () => {
    const user = buildUser();

    const state = sessionReducer(initialState, setSession({ user }));

    expect(state.user).toEqual(user);
    expect(state.bootstrapped).toBe(true);
    expect(state.error).toBeNull();
  });

  it('clearSession limpia el usuario y marca rehidratado', () => {
    const populated: SessionState = {
      user: buildUser(),
      isLoading: false,
      error: null,
      bootstrapped: false,
    };

    const state = sessionReducer(populated, clearSession());

    expect(state.user).toBeNull();
    expect(state.bootstrapped).toBe(true);
  });

  it('setUser actualiza solo el campo user', () => {
    const populated: SessionState = {
      user: null,
      isLoading: false,
      error: null,
      bootstrapped: true,
    };
    const user = buildUser({ firstName: 'Nuevo' });

    const state = sessionReducer(populated, setUser(user));

    expect(state.user).toEqual(user);
    expect(state.bootstrapped).toBe(true);
  });
});
