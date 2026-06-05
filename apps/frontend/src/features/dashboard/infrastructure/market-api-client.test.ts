import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMarketRepository } from './market-api-client.js';

const apiResponse = (data: unknown, ok = true, message = 'ok'): Response =>
  ({
    ok,
    status: ok ? 200 : 400,
    json: async () => ({ httpStatus: '200', apiMessage: message, apiData: data }),
  }) as Response;

describe('MarketRepository (api-client)', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('GET /market/overview envía la cookie de sesión (credentials: include)', async () => {
    fetchSpy.mockResolvedValueOnce(
      apiResponse({ topCryptos: [], marketKpis: {}, lastFetched: '2026-05-27' })
    );
    const repo = createMarketRepository();
    const result = await repo.getMarketOverview();
    expect(result).toBeDefined();
    const [, init] = fetchSpy.mock.calls[0]!;
    expect((init as RequestInit).credentials).toBe('include');
  });

  it('lanza error con apiMessage del backend cuando responde con error', async () => {
    fetchSpy.mockResolvedValueOnce(apiResponse(null, false, 'CoinGecko no disponible'));
    const repo = createMarketRepository();
    await expect(repo.getMarketOverview()).rejects.toThrow(/CoinGecko/);
  });

  it('lanza error de conexión cuando fetch falla', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Net'));
    const repo = createMarketRepository();
    await expect(repo.getMarketOverview()).rejects.toThrow(/conexión/i);
  });

  it('lanza error cuando el JSON es inválido', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('bad json');
      },
    } as unknown as Response);
    const repo = createMarketRepository();
    await expect(repo.getMarketOverview()).rejects.toThrow(/respuesta inválida/i);
  });

  it('GET /market/coins/:id/chart devuelve el chart', async () => {
    fetchSpy.mockResolvedValueOnce(
      apiResponse({ id: 'bitcoin', range: 'day', points: [{ timestamp: 1, price: 50000 }] })
    );
    const repo = createMarketRepository();
    const result = await repo.getCoinChart('bitcoin', 'day');

    expect(result).toBeDefined();
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/market/coins/bitcoin/chart?range=day'),
      expect.anything()
    );
  });
});
