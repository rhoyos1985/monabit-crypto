import { ICoinGeckoClient } from './ports.js';
import { GetMarketOverviewInput, GetCoinChartInput, MarketOverview, CoinChart } from '../domain/types.js';

export const getMarketOverview = (coinGeckoClient: ICoinGeckoClient) => async (
  _input: GetMarketOverviewInput
): Promise<MarketOverview> => {
  return coinGeckoClient.getMarketOverview();
};

export const getCoinChart = (coinGeckoClient: ICoinGeckoClient) => async (
  input: GetCoinChartInput
): Promise<CoinChart> => {
  return coinGeckoClient.getCoinChart(input.id, input.range);
};
