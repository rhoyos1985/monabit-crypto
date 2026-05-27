import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLocationsRepository } from './api-client.js';

describe('LocationsRepository (api-client)', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('getCities hace GET /locations/cities y devuelve el array', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        httpStatus: '200',
        apiMessage: 'ok',
        apiData: [{ city: 'Cartagena', state: 'Bolívar', country: 'Colombia', label: 'Cartagena - Bolívar - Colombia' }],
      }),
    } as Response);

    const repo = createLocationsRepository();
    const cities = await repo.getCities();
    expect(cities).toHaveLength(1);
    expect(cities[0]?.city).toBe('Cartagena');
  });

  it('devuelve arreglo vacío cuando apiData es null', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ httpStatus: '200', apiMessage: 'ok', apiData: null }),
    } as Response);

    const repo = createLocationsRepository();
    const cities = await repo.getCities();
    expect(cities).toEqual([]);
  });

  it('lanza error cuando el response no es ok', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ apiData: null }),
    } as Response);

    const repo = createLocationsRepository();
    await expect(repo.getCities()).rejects.toThrow(/listado de ciudades/i);
  });
});
