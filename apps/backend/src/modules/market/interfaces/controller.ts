import { Request, Response, NextFunction } from 'express';
import { ICoinGeckoClient } from '../application/ports.js';
import { getMarketOverview } from '../application/use-cases.js';
import { marketOverviewResponseSchema } from './schemas.js';
import { createApiResponse } from '../../../shared/api-response.js';
import { HttpStatusCode } from '../../../shared/http-error.js';
import { User } from '../../auth/domain/types.js';

interface MarketRequest extends Request {
  user?: User;
}

export const createMarketController = (coinGeckoClient: ICoinGeckoClient) => {
  const getMarketOverviewHandler = async (
    req: MarketRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const doGetMarketOverview = getMarketOverview(coinGeckoClient);
      const overview = await doGetMarketOverview({
        requesterId: req.user?.id || '',
        requesterRole: req.user?.role || 'user',
      });

      const formatted = marketOverviewResponseSchema.parse(overview);
      res
        .status(200)
        .json(
          createApiResponse(
            formatted,
            'Market overview retrieved successfully',
            HttpStatusCode.OK
          )
        );
    } catch (error) {
      next(error);
    }
  };

  return { getMarketOverviewHandler };
};
