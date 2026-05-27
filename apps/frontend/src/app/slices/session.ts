import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SessionState {
  user: SessionUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SessionState = {
  user: null,
  token: localStorage.getItem('auth_token'),
  isLoading: false,
  error: null,
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
    setSession: (state, action: PayloadAction<{ user: SessionUser; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
      localStorage.setItem('auth_token', action.payload.token);
    },
    clearSession: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem('auth_token');
    },
    setUser: (state, action: PayloadAction<SessionUser>) => {
      state.user = action.payload;
    },
  },
});

export const { setLoading, setError, setSession, clearSession, setUser } = sessionSlice.actions;
export default sessionSlice.reducer;
