import { MarketOverview } from '../domain/types.js';

export interface ICoinGeckoClient {
  getMarketOverview(): Promise<MarketOverview>;
}
