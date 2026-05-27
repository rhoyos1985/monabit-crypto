import { Request, Response, NextFunction } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { User } from '../domain/types.js';
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

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.user.id)
      .single();

    if (profileError || !profileData) {
      throw new HTTPUnauthorized('User profile not found');
    }

    const typedProfile = profileData as Profile;
    const user: User = {
      id: typedProfile.id,
      email: typedProfile.email,
      firstName: typedProfile.first_name || undefined,
      lastName: typedProfile.last_name || undefined,
      city: typedProfile.city || undefined,
      state: typedProfile.state || undefined,
      country: typedProfile.country || undefined,
      avatarUrl: typedProfile.avatar_url || undefined,
      authProvider: typedProfile.auth_provider || 'email',
      role: (typedProfile.role || 'user') as 'admin' | 'user',
      isActive: typedProfile.is_active,
      createdAt: new Date(typedProfile.created_at),
      updatedAt: new Date(typedProfile.updated_at),
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
