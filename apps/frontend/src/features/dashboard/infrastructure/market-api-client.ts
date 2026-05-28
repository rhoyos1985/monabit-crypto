import type { MarketOverview, CoinChart, ChartRange } from '../domain/types.js';
import type { IMarketRepository } from '../ports/index.js';
import { fetchByAuth, getStoredToken } from '../../../shared/http-client.js';

export const createMarketRepository = (): IMarketRepository => ({
  async getMarketOverview(): Promise<MarketOverview> {
    return fetchByAuth<MarketOverview>('GET', '/market/overview', getStoredToken());
  },

  async getCoinChart(id: string, range: ChartRange): Promise<CoinChart> {
    return fetchByAuth<CoinChart>(
      'GET',
      `/market/coins/${encodeURIComponent(id)}/chart?range=${range}`,
      getStoredToken()
    );
  },
});
