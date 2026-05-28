import type { MarketOverview, CoinChart, ChartRange } from '../domain/types.js';

export interface IMarketRepository {
  getMarketOverview(): Promise<MarketOverview>;
  getCoinChart(id: string, range: ChartRange): Promise<CoinChart>;
}
