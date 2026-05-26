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

  const response = await fetch(url, options);
  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    throw new Error(data.apiMessage || 'Request failed');
  }

  return data.apiData as T;
};

export const createMarketRepository = (): IMarketRepository => ({
  async getMarketOverview(): Promise<MarketOverview> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return makeRequest<MarketOverview>('GET', '/market/overview', token);
  },
});
