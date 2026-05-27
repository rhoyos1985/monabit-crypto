import type { UserPreferences, UpdatePreferencesInput } from '../domain/types.js';

export interface IPreferencesRepository {
  getMyPreferences(token: string): Promise<UserPreferences>;
  updateMyPreferences(input: UpdatePreferencesInput, token: string): Promise<UserPreferences>;
  toggleFavorite(coinId: string, token: string): Promise<UserPreferences>;
}
