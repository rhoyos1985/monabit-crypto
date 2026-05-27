import { UserPreferences, UpdatePreferencesInput } from '../domain/types.js';

export interface IPreferencesRepository {
  getByUserId(userId: string): Promise<UserPreferences>;
  update(userId: string, input: UpdatePreferencesInput): Promise<UserPreferences>;
}
