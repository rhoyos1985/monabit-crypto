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
    localStorage.clear();
  });

  it('lanza error cuando no hay token', async () => {
    const repo = createMarketRepository();
    await expect(repo.getMarketOverview()).rejects.toThrow(/sesión/i);
  });

  it('GET /market/overview con token devuelve overview', async () => {
    localStorage.setItem('auth_token', 'jwt');
    fetchSpy.mockResolvedValueOnce(
      apiResponse({ topCryptos: [], marketKpis: {}, lastFetched: '2026-05-27' })
    );
    const repo = createMarketRepository();
    const result = await repo.getMarketOverview();
    expect(result).toBeDefined();
  });

  it('lanza error con apiMessage del backend cuando responde con error', async () => {
    localStorage.setItem('auth_token', 'jwt');
    fetchSpy.mockResolvedValueOnce(
      apiResponse(null, false, 'CoinGecko no disponible')
    );
    const repo = createMarketRepository();
    await expect(repo.getMarketOverview()).rejects.toThrow(/CoinGecko/);
  });

  it('lanza error de conexión cuando fetch falla', async () => {
    localStorage.setItem('auth_token', 'jwt');
    fetchSpy.mockRejectedValueOnce(new Error('Net'));
    const repo = createMarketRepository();
    await expect(repo.getMarketOverview()).rejects.toThrow(/conexión/i);
  });

  it('lanza error cuando el JSON es inválido', async () => {
    localStorage.setItem('auth_token', 'jwt');
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('bad json');
      },
    } as Response);
    const repo = createMarketRepository();
    await expect(repo.getMarketOverview()).rejects.toThrow(/respuesta inválida/i);
  });
});
