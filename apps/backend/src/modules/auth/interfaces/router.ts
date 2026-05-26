/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Autenticación y gestión de sesión
 */

import { Router, RequestHandler } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseAuthService } from '../infrastructure/supabase-auth.js';
import { createAuthController } from '../application/controller.js';
import { createRequireAuthMiddleware } from './middleware.js';

export const createAuthRouter = (supabase: SupabaseClient): Router => {
  const router = Router();
  const authService = createSupabaseAuthService(supabase);
  const { registerHandler, loginHandler, logoutHandler, getMeHandler } = createAuthController(authService);
  const requireAuth = createRequireAuthMiddleware(supabase);

  /**
   * @swagger
   * /auth/register:
   *   post:
   *     summary: Registrar nuevo usuario
   *     tags: [Authentication]
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
   *             required: [email, password]
   *     responses:
   *       201:
   *         description: Usuario registrado exitosamente
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/AuthResponse' }
   *       400:
   *         description: Datos inválidos
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/ValidationError' }
   *       409:
   *         description: El email ya está registrado
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/ErrorResponse' }
   */
  router.post('/register', registerHandler as RequestHandler);

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     summary: Iniciar sesión
   *     tags: [Authentication]
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
   *                 example: MySecure123!
   *             required: [email, password]
   *     responses:
   *       200:
   *         description: Login exitoso
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/AuthResponse' }
   *       400:
   *         description: Datos inválidos
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/ValidationError' }
   *       401:
   *         description: Email o contraseña incorrectos
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/ErrorResponse' }
   */
  router.post('/login', loginHandler as RequestHandler);

  /**
   * @swagger
   * /auth/logout:
   *   post:
   *     summary: Cerrar sesión
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Sesión cerrada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Logged out successfully
   *       401:
   *         description: Token inválido o expirado
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/ErrorResponse' }
   */
  router.post('/logout', requireAuth as RequestHandler, logoutHandler as RequestHandler);

  /**
   * @swagger
   * /auth/me:
   *   get:
   *     summary: Obtener usuario actual
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Datos del usuario autenticado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 httpStatus:
   *                   type: string
   *                   example: 200 - OK
   *                 apiMessage:
   *                   type: string
   *                 apiData:
   *                   $ref: '#/components/schemas/User'
   *       401:
   *         description: Token inválido, expirado o ausente
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/ErrorResponse' }
   */
  router.get('/me', requireAuth as RequestHandler, getMeHandler as RequestHandler);

  return router;
};
