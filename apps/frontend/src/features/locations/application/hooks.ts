import { useQuery } from '@tanstack/react-query';
import type { CityLocation } from '../domain/types.js';
import { createLocationsRepository } from '../infrastructure/api-client.js';

const locationsRepository = createLocationsRepository();

export const useCities = () => {
  return useQuery<CityLocation[], Error>({
    queryKey: ['cities'],
    queryFn: () => locationsRepository.getCities(),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
  });
};
