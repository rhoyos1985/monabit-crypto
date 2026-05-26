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
