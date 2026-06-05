import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPreferencesRepository } from './api-client.js';

const ok = (data: unknown): Response =>
  ({
    ok: true,
    status: 200,
    json: async () => ({ httpStatus: '200', apiMessage: 'ok', apiData: data }),
  }) as Response;

describe('PreferencesRepository (api-client)', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  const prefs = { userId: 'u-1', theme: 'light', favoriteCoins: [], updatedAt: '' };

  it('getMyPreferences hace GET /preferences/me via cookie', async () => {
    fetchSpy.mockResolvedValueOnce(ok(prefs));
    const repo = createPreferencesRepository();
    const result = await repo.getMyPreferences();
    expect(result.userId).toBe('u-1');
  });

  it('updateMyPreferences hace PATCH con body JSON', async () => {
    fetchSpy.mockResolvedValueOnce(ok({ ...prefs, theme: 'dark' }));
    const repo = createPreferencesRepository();
    const result = await repo.updateMyPreferences({ theme: 'dark' });
    expect(result.theme).toBe('dark');
  });

  it('toggleFavorite hace POST a /preferences/me/favorites con coinId', async () => {
    fetchSpy.mockResolvedValueOnce(ok({ ...prefs, favoriteCoins: ['bitcoin'] }));
    const repo = createPreferencesRepository();
    const result = await repo.toggleFavorite('bitcoin');
    expect(result.favoriteCoins).toContain('bitcoin');
    const [, init] = fetchSpy.mock.calls[0]!;
    expect((init as RequestInit).body).toBe(JSON.stringify({ coinId: 'bitcoin' }));
  });

  it('lanza error cuando el response no es ok', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ httpStatus: '401', apiMessage: 'Unauthorized', apiData: null }),
    } as Response);
    const repo = createPreferencesRepository();
    await expect(repo.getMyPreferences()).rejects.toThrow('Unauthorized');
  });

  it('lanza error cuando el JSON es inválido', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('invalid');
      },
    } as unknown as Response);
    const repo = createPreferencesRepository();
    await expect(repo.getMyPreferences()).rejects.toThrow(/respuesta inválida/i);
  });
});
