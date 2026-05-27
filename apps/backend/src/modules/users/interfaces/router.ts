/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión de usuarios
 */

import { Router, RequestHandler } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseUserRepository } from '../infrastructure/supabase-user-repository.js';
import { createSupabaseAuthService } from '../../auth/infrastructure/supabase-auth.js';
import { createUsersController } from '../application/controller.js';
import { createRequireAuthMiddleware, requireAdmin } from '../../auth/interfaces/middleware.js';

export const createUsersRouter = (supabase: SupabaseClient): Router => {
  const router = Router();
  const userRepository = createSupabaseUserRepository(supabase);
  const authService = createSupabaseAuthService(supabase);
  const { listUsersHandler, createUserHandler, updateUserHandler, updateMeHandler, deactivateUserHandler } = createUsersController(
    userRepository,
    authService
  );
  const requireAuth = createRequireAuthMiddleware(supabase);

  /**
   * @swagger
   * /users:
   *   get:
   *     summary: Listar todos los usuarios
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de usuarios
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/User'
   *       401:
   *         description: Token inválido o ausente
   *       403:
   *         description: Solo admin puede listar usuarios
   */
  router.get('/', requireAuth as RequestHandler, listUsersHandler as RequestHandler);

  /**
   * @swagger
   * /users:
   *   post:
   *     summary: Crear nuevo usuario
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: user@example.com
   *               password:
   *                 type: string
   *                 minLength: 8
   *                 example: MySecure123!
   *               displayName:
   *                 type: string
   *                 example: John Doe
   *               role:
   *                 type: string
   *                 enum: [admin, user]
   *                 example: user
   *             required: [email, password]
   *     responses:
   *       201:
   *         description: Usuario creado exitosamente
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/User' }
   *       401:
   *         description: Token inválido o ausente
   *       403:
   *         description: Solo admin puede crear usuarios
   *       409:
   *         description: Email ya registrado
   */
  router.post(
    '/',
    requireAuth as RequestHandler,
    requireAdmin as unknown as RequestHandler,
    createUserHandler as RequestHandler
  );

  /**
   * @swagger
   * /users/{id}:
   *   patch:
   *     summary: Actualizar perfil de usuario
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               displayName:
   *                 type: string
   *     responses:
   *       200:
   *         description: Usuario actualizado
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/User' }
   *       401:
   *         description: Token inválido o ausente
   *       403:
   *         description: No puedes editar otros perfiles
   *       404:
   *         description: Usuario no encontrado
   */
  /**
   * @swagger
   * /users/me:
   *   patch:
   *     summary: Actualizar el perfil del usuario autenticado
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               firstName: { type: string }
   *               lastName: { type: string }
   *               city: { type: string }
   *               state: { type: string }
   *               country: { type: string }
   *     responses:
   *       200:
   *         description: Perfil actualizado
   *       401:
   *         description: Token inválido o ausente
   */
  router.patch('/me', requireAuth as RequestHandler, updateMeHandler as RequestHandler);

  router.patch('/:id', requireAuth as RequestHandler, updateUserHandler as RequestHandler);

  /**
   * @swagger
   * /users/{id}/deactivate:
   *   patch:
   *     summary: Desactivar usuario
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Usuario desactivado
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/User' }
   *       401:
   *         description: Token inválido o ausente
   *       403:
   *         description: Solo admin puede desactivar usuarios
   *       404:
   *         description: Usuario no encontrado
   */
  router.patch(
    '/:id/deactivate',
    requireAuth as RequestHandler,
    requireAdmin as unknown as RequestHandler,
    deactivateUserHandler as RequestHandler
  );

  return router;
};
