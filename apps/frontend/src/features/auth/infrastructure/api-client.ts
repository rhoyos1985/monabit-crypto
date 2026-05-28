import type { AuthResult, LoginInput, RegisterInput, UpdateProfileInput, User } from '../domain/types.js';
import type { IAuthRepository, ChangePasswordInput } from '../ports/index.js';
import { fetchByAuth, fetchNoAuth } from '../../../shared/http-client.js';
import { supabase } from '../../../shared/supabase.js';

export const createAuthRepository = (): IAuthRepository => ({
  async register(input: RegisterInput): Promise<AuthResult> {
    return fetchNoAuth<AuthResult>('POST', '/auth/register', input);
  },

  async login(input: LoginInput): Promise<AuthResult> {
    return fetchNoAuth<AuthResult>('POST', '/auth/login', input);
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem('auth_token');
    if (token) {
      await fetchByAuth<void>('POST', '/auth/logout', token, {});
    }
  },

  async getCurrentUser(token: string): Promise<User> {
    return fetchByAuth<User>('GET', '/auth/me', token);
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

  async updateMe(input: UpdateProfileInput, token: string): Promise<User> {
    return fetchByAuth<User>('PATCH', '/users/me', token, input);
  },

  async changePassword(input: ChangePasswordInput, token: string): Promise<void> {
    await fetchByAuth<{ success: boolean }>('POST', '/auth/change-password', token, input);
  },
});
