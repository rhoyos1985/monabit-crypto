import { ILocationProvider } from '../application/ports.js';
import { CityLocation } from '../domain/types.js';
import logger from '../../../shared/logger.js';
import { HTTPServiceUnavailable } from '../../../shared/http-error.js';

interface ApiColombiaDepartment {
  id: number;
  name: string;
}

interface ApiColombiaCity {
  id: number;
  name: string;
  departmentId: number;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const COUNTRY_NAME = 'Colombia';

export const createApiColombiaClient = (baseUrl: string): ILocationProvider => {
  let cachedCities: CityLocation[] | null = null;
  let cacheExpireTime = 0;

  const isCacheValid = (): boolean => cachedCities !== null && Date.now() < cacheExpireTime;

  const fetchCities = async (): Promise<CityLocation[]> => {
    try {
      const [departmentsResponse, citiesResponse] = await Promise.all([
        fetch(`${baseUrl}/Department`),
        fetch(`${baseUrl}/City`),
      ]);

      if (!departmentsResponse.ok || !citiesResponse.ok) {
        throw new HTTPServiceUnavailable('No se pudo cargar el listado de ciudades');
      }

      const departments = (await departmentsResponse.json()) as ApiColombiaDepartment[];
      const cities = (await citiesResponse.json()) as ApiColombiaCity[];

      const departmentMap = new Map<number, string>();
      for (const dept of departments) {
        departmentMap.set(dept.id, dept.name);
      }

      const result: CityLocation[] = cities
        .map((city) => {
          const state = departmentMap.get(city.departmentId);
          if (!state) return null;
          return {
            city: city.name,
            state,
            country: COUNTRY_NAME,
            label: `${city.name} - ${state} - ${COUNTRY_NAME}`,
          };
        })
        .filter((entry): entry is CityLocation => entry !== null)
        .sort((a, b) => a.label.localeCompare(b.label, 'es'));

      cachedCities = result;
      cacheExpireTime = Date.now() + CACHE_TTL_MS;

      logger.info('API-Colombia cities loaded', {
        count: result.length,
        cacheExpireTime: new Date(cacheExpireTime).toISOString(),
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to fetch cities from API-Colombia', {
        error: errorMessage,
        hasCachedData: cachedCities !== null,
      });

      if (cachedCities) {
        return cachedCities;
      }

      throw error;
    }
  };

  return {
    getCities: async (): Promise<CityLocation[]> => {
      if (isCacheValid() && cachedCities) {
        return cachedCities;
      }
      return fetchCities();
    },
  };
};
