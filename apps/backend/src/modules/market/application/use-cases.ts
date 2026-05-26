import { ICoinGeckoClient } from './ports.js';
import { GetMarketOverviewInput, MarketOverview } from '../domain/types.js';

export const getMarketOverview = (coinGeckoClient: ICoinGeckoClient) => async (
  _input: GetMarketOverviewInput
): Promise<MarketOverview> => {
  return coinGeckoClient.getMarketOverview();
};
