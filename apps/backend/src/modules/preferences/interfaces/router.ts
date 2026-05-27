/**
 * @swagger
 * tags:
 *   name: Preferences
 *   description: Preferencias del usuario (tema, favoritos)
 */

import { Router, Response, NextFunction, RequestHandler } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { createSupabasePreferencesRepository } from '../infrastructure/supabase-preferences-repository.js';
import {
  updatePreferencesSchema,
  toggleFavoriteSchema,
  preferencesResponseSchema,
} from './schemas.js';
import { createRequireAuthMiddleware, AuthRequest } from '../../auth/interfaces/middleware.js';
import { createApiResponse } from '../../../shared/api-response.js';
import { HttpStatusCode, HTTPBadRequest, HTTPUnauthorized } from '../../../shared/http-error.js';
import { UserPreferences } from '../domain/types.js';

const formatPreferences = (prefs: UserPreferences) =>
  preferencesResponseSchema.parse({
    userId: prefs.userId,
    theme: prefs.theme,
    favoriteCoins: prefs.favoriteCoins,
    updatedAt: prefs.updatedAt.toISOString(),
  });

export const createPreferencesRouter = (supabase: SupabaseClient): Router => {
  const router = Router();
  const repository = createSupabasePreferencesRepository(supabase);
  const requireAuth = createRequireAuthMiddleware(supabase);

  /**
   * @swagger
   * /preferences/me:
   *   get:
   *     summary: Obtener preferencias del usuario autenticado
   *     tags: [Preferences]
   *     security:
   *       - bearerAuth: []
   */
  const getMyPreferencesHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) throw new HTTPUnauthorized('No autenticado');
      const prefs = await repository.getByUserId(req.user.id);
      res.status(200).json(createApiResponse(formatPreferences(prefs), 'Preferencias obtenidas', HttpStatusCode.OK));
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /preferences/me:
   *   patch:
   *     summary: Actualizar preferencias del usuario autenticado
   *     tags: [Preferences]
   *     security:
   *       - bearerAuth: []
   */
  const updateMyPreferencesHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) throw new HTTPUnauthorized('No autenticado');
      const parsed = updatePreferencesSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new HTTPBadRequest('Datos inválidos', {
          error: 'Validation failed',
          details: parsed.error.flatten(),
        });
      }
      const prefs = await repository.update(req.user.id, parsed.data);
      res.status(200).json(createApiResponse(formatPreferences(prefs), 'Preferencias actualizadas', HttpStatusCode.OK));
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /preferences/me/favorites:
   *   post:
   *     summary: Alternar una criptomoneda en favoritos del usuario autenticado
   *     tags: [Preferences]
   *     security:
   *       - bearerAuth: []
   */
  const toggleFavoriteHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) throw new HTTPUnauthorized('No autenticado');
      const parsed = toggleFavoriteSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new HTTPBadRequest('Datos inválidos', {
          error: 'Validation failed',
          details: parsed.error.flatten(),
        });
      }

      const current = await repository.getByUserId(req.user.id);
      const exists = current.favoriteCoins.includes(parsed.data.coinId);
      const nextFavorites = exists
        ? current.favoriteCoins.filter((id) => id !== parsed.data.coinId)
        : [...current.favoriteCoins, parsed.data.coinId];

      const updated = await repository.update(req.user.id, { favoriteCoins: nextFavorites });
      res.status(200).json(createApiResponse(formatPreferences(updated), 'Favoritos actualizados', HttpStatusCode.OK));
    } catch (error) {
      next(error);
    }
  };

  router.get('/me', requireAuth as RequestHandler, getMyPreferencesHandler as RequestHandler);
  router.patch('/me', requireAuth as RequestHandler, updateMyPreferencesHandler as RequestHandler);
  router.post('/me/favorites', requireAuth as RequestHandler, toggleFavoriteHandler as RequestHandler);

  return router;
};
