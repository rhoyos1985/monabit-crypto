import type { MarketOverview } from '../domain/types.js';

export interface IMarketRepository {
  getMarketOverview(): Promise<MarketOverview>;
}
