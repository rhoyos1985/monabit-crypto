import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserRole } from '../../features/auth/domain/types.js';

export interface SessionUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  country?: string;
  avatarUrl?: string;
  authProvider: 'email' | 'google';
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// El token ya no vive en el estado de JS: la sesion la transporta la cookie
// httpOnly. El estado solo refleja el usuario autenticado. `bootstrapped` indica
// si ya se intento rehidratar la sesion contra el backend (GET /auth/me).
export interface SessionState {
  user: SessionUser | null;
  isLoading: boolean;
  error: string | null;
  bootstrapped: boolean;
}

const initialState: SessionState = {
  user: null,
  isLoading: false,
  error: null,
  bootstrapped: false,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setSession: (state, action: PayloadAction<{ user: SessionUser }>) => {
      state.user = action.payload.user;
      state.error = null;
      state.bootstrapped = true;
    },
    clearSession: (state) => {
      state.user = null;
      state.error = null;
      state.bootstrapped = true;
    },
    setUser: (state, action: PayloadAction<SessionUser>) => {
      state.user = action.payload;
    },
  },
});

export const { setLoading, setError, setSession, clearSession, setUser } = sessionSlice.actions;
export default sessionSlice.reducer;
