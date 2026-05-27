import { z } from 'zod';

export const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark']).optional(),
  favoriteCoins: z.array(z.string().min(1).max(50)).max(100).optional(),
});

export const toggleFavoriteSchema = z.object({
  coinId: z.string().min(1).max(50),
});

export const preferencesResponseSchema = z.object({
  userId: z.string(),
  theme: z.enum(['light', 'dark']),
  favoriteCoins: z.array(z.string()),
  updatedAt: z.string(),
});

export type UpdatePreferencesRequest = z.infer<typeof updatePreferencesSchema>;
export type ToggleFavoriteRequest = z.infer<typeof toggleFavoriteSchema>;
