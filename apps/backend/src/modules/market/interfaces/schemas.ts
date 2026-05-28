import { z } from 'zod';

const cryptoDataSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  image: z.string(),
  currentPrice: z.number(),
  marketCap: z.number().nullable(),
  marketCapRank: z.number().nullable(),
  totalVolume: z.number().nullable(),
  changePercent24h: z.number().nullable(),
  lastUpdated: z.string(),
});

const marketKpisSchema = z.object({
  totalMarketCap: z.number(),
  totalVolume: z.number(),
  btcDominance: z.number(),
  ethereumDominance: z.number(),
  lastUpdated: z.string(),
});

export const marketOverviewResponseSchema = z.object({
  topCryptos: z.array(cryptoDataSchema),
  marketKpis: marketKpisSchema,
  lastFetched: z.string(),
});

export type MarketOverviewResponse = z.infer<typeof marketOverviewResponseSchema>;

export const coinChartRangeSchema = z.enum(['day', 'week']).default('day');

const coinChartPointSchema = z.object({
  timestamp: z.number(),
  price: z.number(),
});

export const coinChartResponseSchema = z.object({
  id: z.string(),
  range: z.enum(['day', 'week']),
  points: z.array(coinChartPointSchema),
});

export type CoinChartResponse = z.infer<typeof coinChartResponseSchema>;
