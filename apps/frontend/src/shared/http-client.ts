import { API_BASE_URL } from './config.js';
import {
  encryptEnvelope,
  decryptEnvelope,
  getClientKeys,
  getBackendPublicKey,
  isEncryptionEnabled,
  type EncryptedMessage,
} from './crypto.js';

export interface ApiResponse<T> {
  httpStatus: string;
  apiMessage: string;
  apiData: T | null;
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

const SECURE_PREFIXES = ['/auth', '/users'];

const isSecurePath = (path: string): boolean =>
  SECURE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

const hasEncryptedMessage = (value: unknown): value is { message: EncryptedMessage } =>
  typeof value === 'object' &&
  value !== null &&
  'message' in value &&
  typeof (value as { message: unknown }).message === 'string' &&
  ((value as { message: string }).message).length > 0;

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

  const secure = isSecurePath(path) && isEncryptionEnabled();
  let privateKey: CryptoKey | null = null;
  let outgoingBody = body;

  if (secure) {
    const [clientKeys, backendKey] = await Promise.all([getClientKeys(), getBackendPublicKey()]);
    privateKey = clientKeys.privateKey;
    headers['X-Client-Public-Key'] = clientKeys.publicKeyHeader;
    if (body !== undefined) {
      outgoingBody = { message: await encryptEnvelope(body, backendKey) };
    }
  }

  const options: RequestInit = { method, headers };
  if (outgoingBody !== undefined) {
    options.body = JSON.stringify(outgoingBody);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch {
    throw new Error('No hay conexión con el servidor. Verifica tu conexión a Internet.');
  }

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    throw new Error('El servidor devolvió una respuesta inválida. Por favor, intenta de nuevo.');
  }

  const data =
    secure && privateKey && hasEncryptedMessage(raw)
      ? ((await decryptEnvelope(raw.message, privateKey)) as ApiResponse<T>)
      : (raw as ApiResponse<T>);

  if (!response.ok) {
    throw new Error(data.apiMessage || 'Error en la solicitud');
  }

  return data.apiData as T;
};

export const fetchByAuth = <T>(
  method: HttpMethod,
  path: string,
  token: string,
  body?: unknown
): Promise<T> => request<T>(method, path, body, token);

export const fetchNoAuth = <T>(method: HttpMethod, path: string, body?: unknown): Promise<T> =>
  request<T>(method, path, body);

export const getStoredToken = (): string => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
  }
  return token;
};
