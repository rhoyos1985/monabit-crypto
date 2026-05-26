import { SupabaseClient } from '@supabase/supabase-js';
import { IAuthService } from '../application/ports.js';
import { User, AuthToken, AuthCredentials, AuthResult } from '../domain/types.js';

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const createSupabaseAuthService = (supabase: SupabaseClient): IAuthService => {
  const mapProfileToUser = (profile: Profile): User => ({
    id: profile.id,
    email: profile.email,
    displayName: profile.display_name || undefined,
    role: (profile.role || 'user') as 'admin' | 'user',
    isActive: profile.is_active,
    createdAt: new Date(profile.created_at),
    updatedAt: new Date(profile.updated_at),
  });

  const registerUser = async (credentials: AuthCredentials): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
    });

    if (error || !data.user || !data.session) {
      throw new Error(`Registration failed: ${error?.message || 'Unknown error'}`);
    }

    const user = await getCurrentUser(data.session.access_token);

    const token: AuthToken = {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      token_type: 'Bearer',
    };

    return { user, token };
  };

  const loginUser = async (credentials: AuthCredentials): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error || !data.session) {
      throw new Error(`Login failed: ${error?.message || 'Invalid credentials'}`);
    }

    const user = await getCurrentUser(data.session.access_token);

    const token: AuthToken = {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      token_type: 'Bearer',
    };

    return { user, token };
  };

  const getCurrentUser = async (token: string): Promise<User> => {
    if (!token) {
      throw new Error('Token is required');
    }

    const { data: authUser, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser.user) {
      throw new Error(`Invalid token: ${authError?.message || 'User not found'}`);
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.user.id)
      .single();

    if (profileError || !profile) {
      throw new Error(`Profile not found: ${profileError?.message || 'Unknown error'}`);
    }

    return mapProfileToUser(profile as Profile);
  };

  const logoutUser = async (): Promise<void> => {
    return Promise.resolve();
  };

  return {
    registerUser,
    loginUser,
    getCurrentUser,
    logoutUser,
  };
};
