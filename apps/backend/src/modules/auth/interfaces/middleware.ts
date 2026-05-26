import { Request, Response, NextFunction } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { User } from '../domain/types.js';

export interface AuthRequest extends Request {
  user?: User;
  token?: string;
}

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const createRequireAuthMiddleware =
  (supabase: SupabaseClient) =>
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.slice(7);

    try {
      const { data: authUser, error: authError } = await supabase.auth.getUser(token);

      if (authError || !authUser.user) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.user.id)
        .single();

      if (profileError || !profileData) {
        res.status(401).json({ error: 'User profile not found' });
        return;
      }

      const typedProfile = profileData as Profile;
      const user: User = {
        id: typedProfile.id,
        email: typedProfile.email,
        displayName: typedProfile.display_name || undefined,
        role: (typedProfile.role || 'user') as 'admin' | 'user',
        isActive: typedProfile.is_active,
        createdAt: new Date(typedProfile.created_at),
        updatedAt: new Date(typedProfile.updated_at),
      };

      req.user = user;
      req.token = token;
      next();
    } catch {
      res.status(401).json({ error: 'Authentication failed' });
    }
  };

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin role required' });
    return;
  }

  next();
};
