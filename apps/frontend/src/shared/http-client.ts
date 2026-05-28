import { API_BASE_URL } from './config.js';

export interface ApiResponse<T> {
  httpStatus: string;
  apiMessage: string;
  apiData: T | null;
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

const request = async <T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  token?: string
): Promise<T> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const options: RequestInit = { method, headers };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch {
    throw new Error('No hay conexión con el servidor. Verifica tu conexión a Internet.');
  }

  let data: ApiResponse<T>;
  try {
    data = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error('El servidor devolvió una respuesta inválida. Por favor, intenta de nuevo.');
  }

  if (!response.ok) {
    throw new Error(data.apiMessage || 'Error en la solicitud');
  }

  return data.apiData as T;
};

/**
 * Petición HTTP autenticada: adjunta el header Authorization: Bearer <token>.
 */
export const fetchByAuth = <T>(
  method: HttpMethod,
  path: string,
  token: string,
  body?: unknown
): Promise<T> => request<T>(method, path, body, token);

/**
 * Petición HTTP pública: sin header de autorización.
 */
export const fetchNoAuth = <T>(
  method: HttpMethod,
  path: string,
  body?: unknown
): Promise<T> => request<T>(method, path, body);

/**
 * Lee el token persistido en localStorage. Lanza error si no hay sesión.
 * Útil para repositorios cuyo caller no recibe el token explícitamente.
 */
export const getStoredToken = (): string => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
  }
  return token;
};
