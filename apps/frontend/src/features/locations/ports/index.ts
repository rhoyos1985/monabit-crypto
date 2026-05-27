import type { CityLocation } from '../domain/types.js';

export interface ILocationsRepository {
  getCities(): Promise<CityLocation[]>;
}
