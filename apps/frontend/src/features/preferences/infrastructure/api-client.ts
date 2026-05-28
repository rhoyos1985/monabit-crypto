import type { UserPreferences, UpdatePreferencesInput } from '../domain/types.js';
import type { IPreferencesRepository } from '../ports/index.js';
import { fetchByAuth } from '../../../shared/http-client.js';

export const createPreferencesRepository = (): IPreferencesRepository => ({
  async getMyPreferences(token: string): Promise<UserPreferences> {
    return fetchByAuth<UserPreferences>('GET', '/preferences/me', token);
  },

  async updateMyPreferences(input: UpdatePreferencesInput, token: string): Promise<UserPreferences> {
    return fetchByAuth<UserPreferences>('PATCH', '/preferences/me', token, input);
  },

  async toggleFavorite(coinId: string, token: string): Promise<UserPreferences> {
    return fetchByAuth<UserPreferences>('POST', '/preferences/me/favorites', token, { coinId });
  },
});
