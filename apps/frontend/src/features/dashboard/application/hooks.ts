import { useQuery } from '@tanstack/react-query';
import { createMarketRepository } from '../infrastructure/market-api-client.js';
import type { MarketOverview } from '../domain/types.js';

const marketRepository = createMarketRepository();

export const useMarketOverview = () => {
  return useQuery<MarketOverview, Error>({
    queryKey: ['marketOverview'],
    queryFn: () => marketRepository.getMarketOverview(),
    staleTime: 40000, // 30 seconds
    refetchInterval: 70000, // 60 seconds
    refetchOnWindowFocus: true,
    retry: 2,
  });
};
