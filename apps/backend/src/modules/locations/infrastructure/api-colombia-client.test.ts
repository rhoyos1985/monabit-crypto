import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { createApiColombiaClient } from './api-colombia-client.js';

describe('ApiColombiaClient', () => {
  let fetchSpy: jest.SpiedFunction<typeof fetch>;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('combina departments y cities en label "Ciudad - Departamento - Colombia"', async () => {
    fetchSpy
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 1, name: 'Bolívar' },
          { id: 2, name: 'Antioquia' },
        ],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 100, name: 'Cartagena', departmentId: 1 },
          { id: 200, name: 'Medellín', departmentId: 2 },
        ],
      } as Response);

    const client = createApiColombiaClient('https://api-colombia.com/api/v1');
    const cities = await client.getCities();

    expect(cities).toHaveLength(2);
    expect(cities.map((c) => c.label)).toEqual(
      expect.arrayContaining([
        'Cartagena - Bolívar - Colombia',
        'Medellín - Antioquia - Colombia',
      ])
    );
  });

  it('filtra ciudades sin departamento asociado', async () => {
    fetchSpy
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, name: 'Bolívar' }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 100, name: 'Cartagena', departmentId: 1 },
          { id: 200, name: 'Ciudad sin depto', departmentId: 999 },
        ],
      } as Response);

    const client = createApiColombiaClient('https://api-colombia.com/api/v1');
    const cities = await client.getCities();

    expect(cities).toHaveLength(1);
    expect(cities[0]?.city).toBe('Cartagena');
  });

  it('cachea el resultado y no llama de nuevo en lecturas subsecuentes', async () => {
    fetchSpy
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 1, name: 'X' }] } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, name: 'C1', departmentId: 1 }],
      } as Response);

    const client = createApiColombiaClient('https://api-colombia.com/api/v1');
    await client.getCities();
    await client.getCities();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('lanza error si la API falla y no hay datos cacheados', async () => {
    fetchSpy.mockRejectedValue(new Error('Network down'));

    const client = createApiColombiaClient('https://api-colombia.com/api/v1');
    await expect(client.getCities()).rejects.toThrow();
  });
});
