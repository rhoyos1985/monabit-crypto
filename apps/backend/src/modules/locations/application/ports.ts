import { CityLocation } from '../domain/types.js';

export interface ILocationProvider {
  getCities(): Promise<CityLocation[]>;
}
