import { ICoinGeckoClient } from '../application/ports.js';
import {
  MarketOverview,
  CryptoData,
  MarketKPIs,
  CoinChart,
  CoinChartPoint,
  ChartRange,
} from '../domain/types.js';
import logger from '../../../shared/logger.js';
import { AppError, HttpStatusCode } from '../../../shared/http-error.js';

interface CoinGeckoCrypto {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  total_volume: number | null;
  price_change_percentage_24h: number | null;
  last_updated: string;
}

interface CoinGeckoGlobalData {
  data: {
    total_market_cap: { usd: number };
    total_volume: { usd: number };
    market_cap_percentage: { btc: number; eth: number };
    updated_at: number;
  };
}

interface CoinGeckoMarketChart {
  prices: [number, number][];
}

const CACHE_TTL_MS = 60000;

const mapCryptoData = (crypto: CoinGeckoCrypto): CryptoData => ({
  id: crypto.id,
  symbol: crypto.symbol.toUpperCase(),
  name: crypto.name,
  image: crypto.image,
  currentPrice: crypto.current_price || 0,
  marketCap: crypto.market_cap,
  marketCapRank: crypto.market_cap_rank,
  totalVolume: crypto.total_volume,
  changePercent24h: crypto.price_change_percentage_24h,
  lastUpdated: crypto.last_updated,
});

const mapGlobalData = (global: CoinGeckoGlobalData): MarketKPIs => ({
  totalMarketCap: global.data.total_market_cap.usd,
  totalVolume: global.data.total_volume.usd,
  btcDominance: global.data.market_cap_percentage.btc,
  ethereumDominance: global.data.market_cap_percentage.eth,
  lastUpdated: new Date(global.data.updated_at * 1000).toISOString(),
});

export const createCoinGeckoClient = (apiBaseUrl: string): ICoinGeckoClient => {
  let cachedOverview: MarketOverview | null = null;
  let cacheExpireTime = 0;
  const chartCache = new Map<string, { data: CoinChart; expire: number }>();

  const isCacheValid = (): boolean => {
    return cachedOverview !== null && Date.now() < cacheExpireTime;
  };

  const fetchFromApi = async (): Promise<MarketOverview> => {
    try {
      const [cryptosResponse, globalResponse] = await Promise.all([
        fetch(
          `${apiBaseUrl}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false`
        ),
        fetch(`${apiBaseUrl}/global`),
      ]);

      if (!cryptosResponse.ok || !globalResponse.ok) {
        throw new AppError(
          'No se pudo obtener datos de precios de criptomonedas. Por favor, intenta de nuevo más tarde.',
          HttpStatusCode.SERVICE_UNAVAILABLE
        );
      }

      const cryptosData = (await cryptosResponse.json()) as CoinGeckoCrypto[];
      const globalData = (await globalResponse.json()) as CoinGeckoGlobalData;

      const topCryptos = cryptosData.map(mapCryptoData);
      const marketKpis = mapGlobalData(globalData);
      const now = new Date().toISOString();

      const overview: MarketOverview = {
        topCryptos,
        marketKpis,
        lastFetched: now,
      };

      cachedOverview = overview;
      cacheExpireTime = Date.now() + CACHE_TTL_MS;

      logger.info('CoinGecko API fetched successfully', {
        cryptoCount: topCryptos.length,
        cacheExpireTime: new Date(cacheExpireTime).toISOString(),
      });

      return overview;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('CoinGecko API fetch failed', {
        error: errorMessage,
        hasCachedData: cachedOverview !== null,
      });

      if (cachedOverview) {
        logger.info('Returning stale cached data');
        return cachedOverview;
      }

      throw error;
    }
  };

  const getCoinChart = async (id: string, range: ChartRange): Promise<CoinChart> => {
    const cacheKey = `${id}:${range}`;
    const cached = chartCache.get(cacheKey);
    if (cached && Date.now() < cached.expire) {
      return cached.data;
    }

    const days = range === 'week' ? 7 : 1;

    try {
      const response = await fetch(
        `${apiBaseUrl}/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${days}`
      );

      if (!response.ok) {
        throw new AppError(
          'No se pudo obtener el historial de precios de la criptomoneda. Por favor, intenta de nuevo más tarde.',
          HttpStatusCode.SERVICE_UNAVAILABLE
        );
      }

      const data = (await response.json()) as CoinGeckoMarketChart;
      const points: CoinChartPoint[] = data.prices.map((p) => ({
        timestamp: p[0],
        price: p[1],
      }));
      const chart: CoinChart = { id, range, points };

      chartCache.set(cacheKey, { data: chart, expire: Date.now() + CACHE_TTL_MS });

      return chart;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('CoinGecko chart fetch failed', { coinId: id, range, error: errorMessage });

      if (cached) {
        return cached.data;
      }

      throw error;
    }
  };

  return {
    getMarketOverview: async (): Promise<MarketOverview> => {
      if (isCacheValid()) {
        logger.debug('Returning cached market overview');
        return cachedOverview!;
      }

      return fetchFromApi();
    },
    getCoinChart,
  };
};
