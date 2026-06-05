import type { CityLocation } from '../domain/types.js';
import type { ILocationsRepository } from '../ports/index.js';
import { apiFetch } from '../../../shared/http-client.js';

export const createLocationsRepository = (): ILocationsRepository => ({
  async getCities(): Promise<CityLocation[]> {
    const cities = await apiFetch<CityLocation[]>('GET', '/locations/cities');
    return cities ?? [];
  },
});
