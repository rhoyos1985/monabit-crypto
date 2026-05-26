import type { User, CreateUserInput, UpdateUserInput } from '../domain/types.js';
import type { IUserRepository } from '../ports/index.js';

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
  body?: unknown,
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

const getToken = (): string => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return token;
};

export const createUserRepository = (): IUserRepository => ({
  async listUsers(): Promise<User[]> {
    const token = getToken();
    return makeRequest<User[]>('GET', '/users', undefined, token);
  },

  async createUser(input: CreateUserInput): Promise<User> {
    const token = getToken();
    return makeRequest<User>('POST', '/users', input, token);
  },

  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    const token = getToken();
    return makeRequest<User>('PATCH', `/users/${id}`, input, token);
  },

  async deactivateUser(id: string): Promise<User> {
    const token = getToken();
    return makeRequest<User>('PATCH', `/users/${id}/deactivate`, {}, token);
  },
});
