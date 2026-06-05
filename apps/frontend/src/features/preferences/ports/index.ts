import type { UserPreferences, UpdatePreferencesInput } from '../domain/types.js';

export interface IPreferencesRepository {
  getMyPreferences(): Promise<UserPreferences>;
  updateMyPreferences(input: UpdatePreferencesInput): Promise<UserPreferences>;
  toggleFavorite(coinId: string): Promise<UserPreferences>;
}
