import { Request, Response, NextFunction } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { User, UserRole } from '../domain/types.js';
import { HTTPUnauthorized, HTTPForbidden } from '../../../shared/http-error.js';

export interface AuthRequest extends Request {
  user?: User;
  token?: string;
}

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

export const createRequireAuthMiddleware =
  (supabase: SupabaseClient) =>
  async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HTTPUnauthorized('Missing or invalid authorization header');
    }

    const token = authHeader.slice(7);
    const { data: authUser, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser.user) {
      throw new HTTPUnauthorized('Invalid or expired token');
    }

    const profileResult = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.user.id)
      .single<Profile>();

    const profileData = profileResult.data;
    const profileError = profileResult.error;

    if (profileError || !profileData) {
      throw new HTTPUnauthorized('User profile not found');
    }

    const user: User = {
      id: profileData.id,
      email: profileData.email,
      firstName: profileData.first_name || undefined,
      lastName: profileData.last_name || undefined,
      city: profileData.city || undefined,
      state: profileData.state || undefined,
      country: profileData.country || undefined,
      avatarUrl: profileData.avatar_url || undefined,
      authProvider: profileData.auth_provider || 'email',
      role: (profileData.role || 'user') as UserRole,
      isActive: profileData.is_active,
      createdAt: new Date(profileData.created_at),
      updatedAt: new Date(profileData.updated_at),
    };

    req.user = user;
    req.token = token;
    next();
  };

export const requireAdmin = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new HTTPUnauthorized('Not authenticated');
  }

  if (req.user.role !== 'admin') {
    throw new HTTPForbidden('Admin role required');
  }

  next();
};
