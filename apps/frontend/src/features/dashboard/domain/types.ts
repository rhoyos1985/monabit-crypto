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

export type ChartRange = 'day' | 'week';

export interface CoinChartPoint {
  timestamp: number;
  price: number;
}

export interface CoinChart {
  id: string;
  range: ChartRange;
  points: CoinChartPoint[];
}
