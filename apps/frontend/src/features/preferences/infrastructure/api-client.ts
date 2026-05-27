import type { UserPreferences, UpdatePreferencesInput } from '../domain/types.js';
import type { IPreferencesRepository } from '../ports/index.js';
import { API_BASE_URL } from '../../../shared/config.js';

interface ApiResponse<T> {
  httpStatus: string;
  apiMessage: string;
  apiData: T | null;
}

const makeRequest = async <T>(
  method: string,
  path: string,
  body: unknown | undefined,
  token: string
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: ApiResponse<T>;
  try {
    data = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error('El servidor devolvió una respuesta inválida');
  }

  if (!response.ok) {
    throw new Error(data.apiMessage || 'Error en la solicitud');
  }

  return data.apiData as T;
};

export const createPreferencesRepository = (): IPreferencesRepository => ({
  async getMyPreferences(token: string): Promise<UserPreferences> {
    return makeRequest<UserPreferences>('GET', '/preferences/me', undefined, token);
  },

  async updateMyPreferences(input: UpdatePreferencesInput, token: string): Promise<UserPreferences> {
    return makeRequest<UserPreferences>('PATCH', '/preferences/me', input, token);
  },

  async toggleFavorite(coinId: string, token: string): Promise<UserPreferences> {
    return makeRequest<UserPreferences>('POST', '/preferences/me/favorites', { coinId }, token);
  },
});
