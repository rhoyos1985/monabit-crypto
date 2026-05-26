import type { MarketOverview } from '../domain/types.js';
import type { IMarketRepository } from '../ports/index.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const env = import.meta.env as any;

const getApiBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    return 'http://localhost:8080';
  }
  return env.VITE_API_BASE_URL || 'http://localhost:8080';
};

interface ApiResponse<T> {
  httpStatus: string;
  apiMessage: string;
  apiData: T | null;
}

const makeRequest = async <T>(
  method: string,
  path: string,
  token?: string
): Promise<T> => {
  const url = `${getApiBaseUrl()}${path}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  let response: Response;
  try {
    response = await fetch(url, options);
  } catch (err) {
    throw new Error('No hay conexión con el servidor. Verifica tu conexión a Internet.');
  }

  let data: ApiResponse<T>;
  try {
    data = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error('El servidor devolvió una respuesta inválida. Por favor, intenta de nuevo.');
  }

  if (!response.ok) {
    const errorMessage = data.apiMessage || 'Error al cargar los datos';
    throw new Error(errorMessage);
  }

  return data.apiData as T;
};

export const createMarketRepository = (): IMarketRepository => ({
  async getMarketOverview(): Promise<MarketOverview> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    }
    return makeRequest<MarketOverview>('GET', '/market/overview', token);
  },
});
