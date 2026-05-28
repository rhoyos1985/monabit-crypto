import { describe, it, expect, jest } from '@jest/globals';
import { getMarketOverview, getCoinChart } from './use-cases.js';
import { ICoinGeckoClient } from './ports.js';
import { MarketOverview, CoinChart, ChartRange } from '../domain/types.js';

const buildOverview = (): MarketOverview => ({
  topCryptos: [],
  marketKpis: {
    totalMarketCap: 1_000_000,
    totalVolume: 500_000,
    btcDominance: 50,
    ethereumDominance: 18,
    lastUpdated: '2026-05-27T00:00:00Z',
  },
  lastFetched: '2026-05-27T00:00:00Z',
});

const buildChart = (): CoinChart => ({
  id: 'bitcoin',
  range: 'day',
  points: [{ timestamp: 1716768000000, price: 50000 }],
});

const buildClient = (overrides: Partial<ICoinGeckoClient> = {}): jest.Mocked<ICoinGeckoClient> => ({
  getMarketOverview: jest.fn<() => Promise<MarketOverview>>().mockResolvedValue(buildOverview()),
  getCoinChart: jest
    .fn<(id: string, range: ChartRange) => Promise<CoinChart>>()
    .mockResolvedValue(buildChart()),
  ...overrides,
});

describe('market use-cases', () => {
  it('getMarketOverview delega al cliente de CoinGecko', async () => {
    const overview = buildOverview();
    const client = buildClient({
      getMarketOverview: jest.fn<() => Promise<MarketOverview>>().mockResolvedValue(overview),
    });

    const handler = getMarketOverview(client);
    const result = await handler({ requesterId: 'u-1', requesterRole: 'user' });

    expect(result).toBe(overview);
    expect(client.getMarketOverview).toHaveBeenCalledTimes(1);
  });

  it('getMarketOverview propaga errores del cliente', async () => {
    const client = buildClient({
      getMarketOverview: jest
        .fn<() => Promise<MarketOverview>>()
        .mockRejectedValue(new Error('CoinGecko down')),
    });

    const handler = getMarketOverview(client);
    await expect(handler({ requesterId: 'u-1', requesterRole: 'user' })).rejects.toThrow(
      'CoinGecko down'
    );
  });

  it('getCoinChart delega al cliente con id y rango', async () => {
    const chart = buildChart();
    const client = buildClient({
      getCoinChart: jest
        .fn<(id: string, range: ChartRange) => Promise<CoinChart>>()
        .mockResolvedValue(chart),
    });

    const handler = getCoinChart(client);
    const result = await handler({ id: 'bitcoin', range: 'week' });

    expect(result).toBe(chart);
    expect(client.getCoinChart).toHaveBeenCalledWith('bitcoin', 'week');
  });

  it('getCoinChart propaga errores del cliente', async () => {
    const client = buildClient({
      getCoinChart: jest
        .fn<(id: string, range: ChartRange) => Promise<CoinChart>>()
        .mockRejectedValue(new Error('chart down')),
    });

    const handler = getCoinChart(client);
    await expect(handler({ id: 'bitcoin', range: 'day' })).rejects.toThrow('chart down');
  });
});
