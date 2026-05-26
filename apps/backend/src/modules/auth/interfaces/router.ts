import { Router, Request, Response, NextFunction } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseAuthService } from '../infrastructure/supabase-auth.js';
import { registerUser, loginUser } from '../application/use-cases.js';
import { createRequireAuthMiddleware, AuthRequest } from './middleware.js';
import { registerSchema, loginSchema, authResultResponseSchema, userResponseSchema } from './schemas.js';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;
type AsyncAuthHandler = (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;

const wrapAsync =
  (fn: AsyncHandler) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };

const wrapAsyncAuth =
  (fn: AsyncAuthHandler) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req as AuthRequest, res, next).catch(next);
  };

export const createAuthRouter = (supabase: SupabaseClient): Router => {
  const router = Router();
  const authService = createSupabaseAuthService(supabase);
  const requireAuth = createRequireAuthMiddleware(supabase);

  const doRegisterUser = registerUser(authService);
  const doLoginUser = loginUser(authService);

  const handleRegister: AsyncHandler = async (req, res, next) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
        return;
      }

      const result = await doRegisterUser(parsed.data);
      const response = authResultResponseSchema.parse({
        user: {
          ...result.user,
          createdAt: result.user.createdAt.toISOString(),
          updatedAt: result.user.updatedAt.toISOString(),
        },
        token: result.token,
      });

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  const handleLogin: AsyncHandler = async (req, res, next) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
        return;
      }

      const result = await doLoginUser(parsed.data);
      const response = authResultResponseSchema.parse({
        user: {
          ...result.user,
          createdAt: result.user.createdAt.toISOString(),
          updatedAt: result.user.updatedAt.toISOString(),
        },
        token: result.token,
      });

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  const handleLogout: AsyncAuthHandler = async (_req, res, next) => {
    try {
      await authService.logoutUser();
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  };

  const handleGetMe = (req: AuthRequest, res: Response): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = req.user;
    const response = userResponseSchema.parse({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });

    res.status(200).json(response);
  };

  router.post('/register', wrapAsync(handleRegister));
  router.post('/login', wrapAsync(handleLogin));
  router.post('/logout', wrapAsyncAuth(requireAuth), wrapAsyncAuth(handleLogout));
  router.get('/me', wrapAsyncAuth(requireAuth), handleGetMe);

  return router;
};
