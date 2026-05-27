/**
 * @swagger
 * tags:
 *   name: Locations
 *   description: Ciudades y departamentos para registro y perfil
 */

import { Router, Request, Response, NextFunction } from 'express';
import { createApiColombiaClient } from '../infrastructure/api-colombia-client.js';
import { createApiResponse } from '../../../shared/api-response.js';
import { HttpStatusCode } from '../../../shared/http-error.js';

const API_COLOMBIA_BASE = process.env.API_COLOMBIA_BASE || 'https://api-colombia.com/api/v1';

export const createLocationsRouter = (): Router => {
  const router = Router();
  const locationProvider = createApiColombiaClient(API_COLOMBIA_BASE);

  /**
   * @swagger
   * /locations/cities:
   *   get:
   *     summary: Listar ciudades disponibles (Colombia)
   *     tags: [Locations]
   *     responses:
   *       200:
   *         description: Listado de ciudades con departamento y país
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   city: { type: string }
   *                   state: { type: string }
   *                   country: { type: string }
   *                   label: { type: string }
   */
  router.get('/cities', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cities = await locationProvider.getCities();
      res.status(200).json(createApiResponse(cities, 'Ciudades obtenidas exitosamente', HttpStatusCode.OK));
    } catch (error) {
      next(error);
    }
  });

  return router;
};
