import { SupabaseClient } from '@supabase/supabase-js';
import { IPreferencesRepository } from '../application/ports.js';
import { UserPreferences, UpdatePreferencesInput, ThemeMode } from '../domain/types.js';
import { HTTPBadRequest, HTTPNotFound } from '../../../shared/http-error.js';

interface PreferencesRow {
  user_id: string;
  theme: string;
  favorite_coins: string[] | null;
  updated_at: string;
}

const mapRowToPreferences = (row: PreferencesRow): UserPreferences => ({
  userId: row.user_id,
  theme: (row.theme === 'dark' ? 'dark' : 'light') as ThemeMode,
  favoriteCoins: row.favorite_coins ?? [],
  updatedAt: new Date(row.updated_at),
});

export const createSupabasePreferencesRepository = (
  supabase: SupabaseClient
): IPreferencesRepository => {
  const getByUserId = async (userId: string): Promise<UserPreferences> => {
    const result = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle<PreferencesRow>();

    if (result.error) {
      throw new HTTPBadRequest(`Error al obtener preferencias: ${result.error.message}`);
    }

    if (result.data) {
      return mapRowToPreferences(result.data);
    }

    const insertResult = await supabase
      .from('user_preferences')
      .insert({ user_id: userId, theme: 'light', favorite_coins: [] })
      .select()
      .single<PreferencesRow>();

    if (insertResult.error || !insertResult.data) {
      throw new HTTPBadRequest(
        `Error al crear preferencias: ${insertResult.error?.message ?? 'desconocido'}`
      );
    }

    return mapRowToPreferences(insertResult.data);
  };

  const update = async (
    userId: string,
    input: UpdatePreferencesInput
  ): Promise<UserPreferences> => {
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.theme !== undefined) {
      updatePayload.theme = input.theme;
    }
    if (input.favoriteCoins !== undefined) {
      updatePayload.favorite_coins = input.favoriteCoins;
    }

    const result = await supabase
      .from('user_preferences')
      .update(updatePayload)
      .eq('user_id', userId)
      .select()
      .single<PreferencesRow>();

    if (result.error || !result.data) {
      if (result.error?.code === 'PGRST116') {
        throw new HTTPNotFound('Preferencias no encontradas para este usuario');
      }
      throw new HTTPBadRequest(
        `Error al actualizar preferencias: ${result.error?.message ?? 'desconocido'}`
      );
    }

    return mapRowToPreferences(result.data);
  };

  return { getByUserId, update };
};
