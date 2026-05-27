import type { CityLocation } from '../domain/types.js';
import type { ILocationsRepository } from '../ports/index.js';
import { API_BASE_URL } from '../../../shared/config.js';

interface ApiResponse<T> {
  httpStatus: string;
  apiMessage: string;
  apiData: T | null;
}

export const createLocationsRepository = (): ILocationsRepository => ({
  async getCities(): Promise<CityLocation[]> {
    const response = await fetch(`${API_BASE_URL}/locations/cities`);
    if (!response.ok) {
      throw new Error('No se pudo cargar el listado de ciudades');
    }
    const data = (await response.json()) as ApiResponse<CityLocation[]>;
    return data.apiData ?? [];
  },
});
