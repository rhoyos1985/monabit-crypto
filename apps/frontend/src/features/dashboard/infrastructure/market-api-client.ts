import type { MarketOverview } from '../domain/types.js';
import type { IMarketRepository } from '../ports/index.js';
import { fetchByAuth, getStoredToken } from '../../../shared/http-client.js';

export const createMarketRepository = (): IMarketRepository => ({
  async getMarketOverview(): Promise<MarketOverview> {
    return fetchByAuth<MarketOverview>('GET', '/market/overview', getStoredToken());
  },
});
