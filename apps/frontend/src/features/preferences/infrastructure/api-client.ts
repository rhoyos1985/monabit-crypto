import type { UserPreferences, UpdatePreferencesInput } from '../domain/types.js';
import type { IPreferencesRepository } from '../ports/index.js';
import { apiFetch } from '../../../shared/http-client.js';

export const createPreferencesRepository = (): IPreferencesRepository => ({
  async getMyPreferences(): Promise<UserPreferences> {
    return apiFetch<UserPreferences>('GET', '/preferences/me');
  },

  async updateMyPreferences(input: UpdatePreferencesInput): Promise<UserPreferences> {
    return apiFetch<UserPreferences>('PATCH', '/preferences/me', input);
  },

  async toggleFavorite(coinId: string): Promise<UserPreferences> {
    return apiFetch<UserPreferences>('POST', '/preferences/me/favorites', { coinId });
  },
});
