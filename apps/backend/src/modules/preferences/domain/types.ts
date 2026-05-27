export type ThemeMode = 'light' | 'dark';

export interface UserPreferences {
  userId: string;
  theme: ThemeMode;
  favoriteCoins: string[];
  updatedAt: Date;
}

export interface UpdatePreferencesInput {
  theme?: ThemeMode;
  favoriteCoins?: string[];
}
