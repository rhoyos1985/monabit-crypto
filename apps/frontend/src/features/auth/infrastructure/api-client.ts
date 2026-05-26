import type { AuthResult, LoginInput, RegisterInput, User } from '../domain/types.js';
import type { IAuthRepository } from '../ports/index.js';
import { API_BASE_URL } from '../../../shared/config.js';

interface ApiResponse<T> {
  httpStatus: string;
  apiMessage: string;
  apiData: T | null;
}

const makeRequest = async <T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string
): Promise<T> => {
  const url = `${API_BASE_URL}${path}`;
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

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    throw new Error(data.apiMessage || 'Request failed');
  }

  return data.apiData as T;
};

export const createAuthRepository = (): IAuthRepository => ({
  async register(input: RegisterInput): Promise<AuthResult> {
    return makeRequest<AuthResult>('POST', '/auth/register', input);
  },

  async login(input: LoginInput): Promise<AuthResult> {
    return makeRequest<AuthResult>('POST', '/auth/login', input);
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem('auth_token');
    if (token) {
      await makeRequest<void>('POST', '/auth/logout', {}, token);
    }
  },

  async getCurrentUser(token: string): Promise<User> {
    return makeRequest<User>('GET', '/auth/me', undefined, token);
  },
});
