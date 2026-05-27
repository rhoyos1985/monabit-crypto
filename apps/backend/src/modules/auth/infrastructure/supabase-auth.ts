import { SupabaseClient, AuthUser } from '@supabase/supabase-js';
import { IAuthService } from '../application/ports.js';
import { User, AuthToken, AuthCredentials, AuthResult } from '../domain/types.js';
import { HTTPConflict, HTTPUnauthorized, HTTPBadRequest } from '../../../shared/http-error.js';
import logger from '../../../shared/logger.js';

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  avatar_url: string | null;
  auth_provider: 'email' | 'google';
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthData {
  user: AuthUser | null;
  session: { access_token: string; refresh_token: string; expires_in: number } | null;
}

export const createSupabaseAuthService = (supabase: SupabaseClient): IAuthService => {
  const mapProfileToUser = (profile: Profile): User => ({
    id: profile.id,
    email: profile.email,
    firstName: profile.first_name || undefined,
    lastName: profile.last_name || undefined,
    city: profile.city || undefined,
    state: profile.state || undefined,
    country: profile.country || undefined,
    avatarUrl: profile.avatar_url || undefined,
    authProvider: profile.auth_provider || 'email',
    role: (profile.role || 'user') as 'admin' | 'user',
    isActive: profile.is_active,
    createdAt: new Date(profile.created_at),
    updatedAt: new Date(profile.updated_at),
  });

  const registerUser = async (credentials: AuthCredentials): Promise<AuthResult> => {
    let data: AuthData;
    try {
      const response = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            first_name: credentials.firstName,
            last_name: credentials.lastName,
            city: credentials.city,
            state: credentials.state,
            country: credentials.country,
          },
        },
      });

      data = response.data as AuthData;
      const error = response.error;

      if (error || !data.user || !data.session) {
        const errorMsg = error?.message || 'Error desconocido';
        if (errorMsg.includes('already registered')) {
          throw new HTTPConflict('Este email ya está registrado. Por favor, usa otro email o inicia sesión.');
        }
        throw new HTTPBadRequest(`Error al registrarse: ${errorMsg}`);
      }
    } catch (err) {
      if (err instanceof HTTPConflict || err instanceof HTTPBadRequest) {
        throw err;
      }
      throw new HTTPBadRequest('Error al conectar con el servicio de autenticación. Por favor, intenta de nuevo más tarde.');
    }

    if (!data.session) {
      throw new HTTPBadRequest('No se pudo obtener la sesión. Por favor, intenta de nuevo.');
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
    let data: AuthData;
    try {
      const response = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      data = response.data as AuthData;
      const error = response.error;

      if (error || !data.session) {
        throw new HTTPUnauthorized('Email o contraseña incorrectos. Por favor, intenta de nuevo.');
      }
    } catch (err) {
      if (err instanceof HTTPUnauthorized) {
        throw err;
      }
      throw new HTTPBadRequest('Error al conectar con el servicio de autenticación. Por favor, intenta de nuevo más tarde.');
    }

    if (!data.session) {
      throw new HTTPBadRequest('No se pudo obtener la sesión. Por favor, intenta de nuevo.');
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
      throw new HTTPUnauthorized('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    }

    const { data: authUser, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser.user) {
      throw new HTTPUnauthorized('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    }

    const profileResult = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.user.id)
      .single<Profile>();

    const profile = profileResult.data;
    const profileError = profileResult.error;

    if (profileError || !profile) {
      logger.error('Failed to load user profile', {
        userId: authUser.user.id,
        errorCode: profileError?.code,
        errorMessage: profileError?.message,
        errorDetails: profileError?.details,
        errorHint: profileError?.hint,
      });
      throw new HTTPBadRequest('No se pudo cargar el perfil del usuario. Por favor, intenta de nuevo.');
    }

    return mapProfileToUser(profile);
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
