import { describe, it, expect, jest } from '@jest/globals';
import { getMarketOverview } from './use-cases.js';
import { ICoinGeckoClient } from './ports.js';
import { MarketOverview } from '../domain/types.js';

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

describe('market use-cases', () => {
  it('getMarketOverview delega al cliente de CoinGecko', async () => {
    const overview = buildOverview();
    const client: jest.Mocked<ICoinGeckoClient> = {
      getMarketOverview: jest.fn<() => Promise<MarketOverview>>().mockResolvedValue(overview),
    };

    const handler = getMarketOverview(client);
    const result = await handler({ requesterId: 'u-1', requesterRole: 'user' });

    expect(result).toBe(overview);
    expect(client.getMarketOverview).toHaveBeenCalledTimes(1);
  });

  it('propaga errores del cliente', async () => {
    const client: jest.Mocked<ICoinGeckoClient> = {
      getMarketOverview: jest.fn<() => Promise<MarketOverview>>().mockRejectedValue(
        new Error('CoinGecko down')
      ),
    };

    const handler = getMarketOverview(client);
    await expect(handler({ requesterId: 'u-1', requesterRole: 'user' })).rejects.toThrow(
      'CoinGecko down'
    );
  });
});
