import { Router, RequestHandler } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { createMarketController } from './controller.js';
import { createCoinGeckoClient } from '../infrastructure/coingecko-client.js';
import { createRequireAuthMiddleware } from '../../auth/interfaces/middleware.js';

export const createMarketRouter = (supabase: SupabaseClient) => {
  const router = Router();

  const apiBaseUrl = process.env.COINGECKO_API_BASE || 'https://api.coingecko.com/api/v3';
  const coinGeckoClient = createCoinGeckoClient(apiBaseUrl);
  const { getMarketOverviewHandler, getCoinChartHandler } = createMarketController(coinGeckoClient);
  const requireAuth = createRequireAuthMiddleware(supabase);

  /**
   * @swagger
   * /market/overview:
   *   get:
   *     tags:
   *       - Market
   *     summary: Get market overview with top 10 cryptocurrencies
   *     description: Returns the top 10 cryptocurrencies by market cap and global market KPIs. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Market overview retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *       401:
   *         description: Unauthorized - missing or invalid JWT
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get(
    '/overview',
    requireAuth as RequestHandler,
    getMarketOverviewHandler as RequestHandler
  );

  /**
   * @swagger
   * /market/coins/{id}/chart:
   *   get:
   *     tags:
   *       - Market
   *     summary: Get price history for a coin
   *     description: Returns the price history of a coin for a day or week range. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: CoinGecko coin id (e.g. bitcoin)
   *       - in: query
   *         name: range
   *         required: false
   *         schema:
   *           type: string
   *           enum: [day, week]
   *           default: day
   *         description: Time range of the chart
   *     responses:
   *       200:
   *         description: Coin chart retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *       401:
   *         description: Unauthorized - missing or invalid JWT
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       503:
   *         description: Upstream market data provider unavailable
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get(
    '/coins/:id/chart',
    requireAuth as RequestHandler,
    getCoinChartHandler as RequestHandler
  );

  return router;
};
