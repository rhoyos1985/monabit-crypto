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

  const mockChartResponse = {
    prices: [
      [1716768000000, 50000],
      [1716771600000, 51000],
    ],
  };

  it('getCoinChart hace fetch y mapea prices a points', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => mockChartResponse } as Response);
    const client = createCoinGeckoClient('https://api.coingecko.com/api/v3');

    const chart = await client.getCoinChart('bitcoin', 'day');

    expect(chart.id).toBe('bitcoin');
    expect(chart.range).toBe('day');
    expect(chart.points).toHaveLength(2);
    expect(chart.points[0]).toEqual({ timestamp: 1716768000000, price: 50000 });
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/coins/bitcoin/market_chart?vs_currency=usd&days=1')
    );
  });

  it('getCoinChart usa days=7 para el rango week', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => mockChartResponse } as Response);
    const client = createCoinGeckoClient('https://api.coingecko.com/api/v3');

    await client.getCoinChart('ethereum', 'week');

    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('days=7'));
  });

  it('getCoinChart cachea por id+range dentro del TTL', async () => {
    fetchSpy.mockResolvedValue({ ok: true, json: async () => mockChartResponse } as Response);
    const client = createCoinGeckoClient('https://api.coingecko.com/api/v3');

    await client.getCoinChart('bitcoin', 'day');
    await client.getCoinChart('bitcoin', 'day');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('getCoinChart devuelve cache si una llamada posterior falla', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => mockChartResponse } as Response);
    const client = createCoinGeckoClient('https://api.coingecko.com/api/v3');
    const first = await client.getCoinChart('bitcoin', 'day');

    jest.useFakeTimers();
    jest.advanceTimersByTime(120_000);

    fetchSpy.mockRejectedValueOnce(new Error('CoinGecko down'));
    const second = await client.getCoinChart('bitcoin', 'day');

    expect(second).toEqual(first);
    jest.useRealTimers();
  });

  it('getCoinChart lanza error si la respuesta no es ok y no hay cache', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: false, json: async () => ({}) } as Response);
    const client = createCoinGeckoClient('https://api.coingecko.com/api/v3');

    await expect(client.getCoinChart('bitcoin', 'day')).rejects.toThrow();
  });

  it('getCoinChart lanza error si fetch falla en la primera llamada (sin cache)', async () => {
    fetchSpy.mockRejectedValue(new Error('Network error'));
    const client = createCoinGeckoClient('https://api.coingecko.com/api/v3');

    await expect(client.getCoinChart('bitcoin', 'day')).rejects.toThrow();
  });
});
