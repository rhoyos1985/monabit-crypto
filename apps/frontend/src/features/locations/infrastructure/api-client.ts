import type { CityLocation } from '../domain/types.js';
import type { ILocationsRepository } from '../ports/index.js';
import { fetchNoAuth } from '../../../shared/http-client.js';

export const createLocationsRepository = (): ILocationsRepository => ({
  async getCities(): Promise<CityLocation[]> {
    const cities = await fetchNoAuth<CityLocation[]>('GET', '/locations/cities');
    return cities ?? [];
  },
});
