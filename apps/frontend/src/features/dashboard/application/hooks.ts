import { useQuery } from '@tanstack/react-query';
import { createMarketRepository } from '../infrastructure/market-api-client.js';
import type { MarketOverview, CoinChart, ChartRange } from '../domain/types.js';

const marketRepository = createMarketRepository();

export const useMarketOverview = () => {
  return useQuery<MarketOverview, Error>({
    queryKey: ['marketOverview'],
    queryFn: () => marketRepository.getMarketOverview(),
    staleTime: 40000,
    refetchInterval: 70000,
    refetchOnWindowFocus: true,
    retry: 2,
  });
};

export const useCoinChart = (id: string | null, range: ChartRange) => {
  return useQuery<CoinChart, Error>({
    queryKey: ['coinChart', id, range],
    queryFn: () => marketRepository.getCoinChart(id ?? '', range),
    enabled: id !== null,
    staleTime: 60000,
    retry: 1,
  });
};
