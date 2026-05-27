export interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;
  marketCap: number | null;
  marketCapRank: number | null;
  totalVolume: number | null;
  changePercent24h: number | null;
  lastUpdated: string;
}

export interface MarketKPIs {
  totalMarketCap: number;
  totalVolume: number;
  btcDominance: number;
  ethereumDominance: number;
  lastUpdated: string;
}

export interface MarketOverview {
  topCryptos: CryptoData[];
  marketKpis: MarketKPIs;
  lastFetched: string;
}

import type { UserRole } from '../../auth/domain/types.js';

export interface GetMarketOverviewInput {
  requesterId: string;
  requesterRole: UserRole;
}
