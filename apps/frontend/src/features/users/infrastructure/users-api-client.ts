import type { User, CreateUserInput, UpdateUserInput } from '../domain/types.js';
import type { IUserRepository } from '../ports/index.js';
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
    const errorMessage = data.apiMessage || 'Error en la solicitud';
    throw new Error(errorMessage);
  }

  return data.apiData as T;
};

const getToken = (): string => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
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
