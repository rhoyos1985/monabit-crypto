import { MarketOverview, CoinChart, ChartRange } from '../domain/types.js';

export interface ICoinGeckoClient {
  getMarketOverview(): Promise<MarketOverview>;
  getCoinChart(id: string, range: ChartRange): Promise<CoinChart>;
}
