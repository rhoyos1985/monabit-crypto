import type { MarketOverview, CoinChart, ChartRange } from '../domain/types.js';
import type { IMarketRepository } from '../ports/index.js';
import { apiFetch } from '../../../shared/http-client.js';

export const createMarketRepository = (): IMarketRepository => ({
  async getMarketOverview(): Promise<MarketOverview> {
    return apiFetch<MarketOverview>('GET', '/market/overview');
  },

  async getCoinChart(id: string, range: ChartRange): Promise<CoinChart> {
    return apiFetch<CoinChart>(
      'GET',
      `/market/coins/${encodeURIComponent(id)}/chart?range=${range}`
    );
  },
});
