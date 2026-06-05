import type { AuthResult, LoginInput, RegisterInput, UpdateProfileInput, User } from '../domain/types.js';
import type { IAuthRepository, ChangePasswordInput } from '../ports/index.js';
import { apiFetch } from '../../../shared/http-client.js';
import { supabase } from '../../../shared/supabase.js';

export const createAuthRepository = (): IAuthRepository => ({
  async register(input: RegisterInput): Promise<AuthResult> {
    return apiFetch<AuthResult>('POST', '/auth/register', input);
  },

  async login(input: LoginInput): Promise<AuthResult> {
    return apiFetch<AuthResult>('POST', '/auth/login', input);
  },

  async logout(): Promise<void> {
    await apiFetch<void>('POST', '/auth/logout', {});
  },

  async getCurrentUser(): Promise<User> {
    return apiFetch<User>('GET', '/auth/me');
  },

  async signInWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      throw new Error(error.message || 'No se pudo iniciar sesión con Google');
    }
  },

  // Intercambia el access_token de Supabase (obtenido en el cliente tras el
  // OAuth de Google) por la cookie httpOnly del backend.
  async createSession(accessToken: string): Promise<User> {
    return apiFetch<User>('POST', '/auth/session', { accessToken });
  },

  async updateMe(input: UpdateProfileInput): Promise<User> {
    return apiFetch<User>('PATCH', '/users/me', input);
  },

  async changePassword(input: ChangePasswordInput): Promise<void> {
    await apiFetch<{ success: boolean }>('POST', '/auth/change-password', input);
  },
});
