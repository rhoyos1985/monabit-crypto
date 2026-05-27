import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { createCoinGeckoClient } from './coingecko-client.js';

const mockCryptoResponse = [
  {
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    image: 'btc.png',
    current_price: 50000,
    market_cap: 1000000000,
    market_cap_rank: 1,
    total_volume: 50000000,
    price_change_percentage_24h: 2.5,
    last_updated: '2026-05-27T00:00:00Z',
  },
];

const mockGlobalResponse = {
  data: {
    total_market_cap: { usd: 2_500_000_000_000 },
    total_volume: { usd: 100_000_000_000 },
    market_cap_percentage: { btc: 45, eth: 18 },
    updated_at: 1716768000,
  },
};

describe('CoinGeckoClient', () => {
  let fetchSpy: jest.SpiedFunction<typeof fetch>;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  const mockSuccessfulFetch = (): void => {
    fetchSpy
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCryptoResponse,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockGlobalResponse,
      } as Response);
  };

  it('hace fetch a los dos endpoints de CoinGecko y mapea la respuesta', async () => {
    mockSuccessfulFetch();
    const client = createCoinGeckoClient('https://api.coingecko.com/api/v3');

    const result = await client.getMarketOverview();

    expect(result.topCryptos).toHaveLength(1);
    expect(result.topCryptos[0]).toMatchObject({
      id: 'bitcoin',
      symbol: 'BTC',
      currentPrice: 50000,
      changePercent24h: 2.5,
    });
    expect(result.marketKpis.btcDominance).toBe(45);
    expect(result.marketKpis.totalMarketCap).toBe(2_500_000_000_000);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('cachea la respuesta y no llama de nuevo dentro del TTL', async () => {
    mockSuccessfulFetch();
    const client = createCoinGeckoClient('https://api.coingecko.com/api/v3');

    await client.getMarketOverview();
    await client.getMarketOverview();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('devuelve datos cacheados si CoinGecko falla en una llamada posterior', async () => {
    mockSuccessfulFetch();
    const client = createCoinGeckoClient('https://api.coingecko.com/api/v3');
    const firstCall = await client.getMarketOverview();

    jest.useFakeTimers();
    jest.advanceTimersByTime(120_000);

    fetchSpy.mockRejectedValueOnce(new Error('CoinGecko down'));
    fetchSpy.mockRejectedValueOnce(new Error('CoinGecko down'));

    const secondCall = await client.getMarketOverview();
    expect(secondCall).toEqual(firstCall);

    jest.useRealTimers();
  });

  it('lanza error si CoinGecko falla en la primera llamada (sin cache)', async () => {
    fetchSpy.mockRejectedValue(new Error('Network error'));
    const client = createCoinGeckoClient('https://api.coingecko.com/api/v3');

    await expect(client.getMarketOverview()).rejects.toThrow();
  });

  it('mapea símbolos a mayúsculas', async () => {
    mockSuccessfulFetch();
    const client = createCoinGeckoClient('https://api.coingecko.com/api/v3');

    const result = await client.getMarketOverview();
    expect(result.topCryptos[0]?.symbol).toBe('BTC');
  });
});
