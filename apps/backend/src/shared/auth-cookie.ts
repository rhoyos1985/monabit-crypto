import { CookieOptions, Response } from 'express';

// Nombre de la cookie httpOnly que transporta el access_token de Supabase.
// El JWT vive solo en esta cookie (httpOnly): el JS del navegador nunca lo lee,
// lo que neutraliza el robo de token por XSS.
export const AUTH_COOKIE_NAME = 'access_token';

// TTL por defecto (segundos) cuando no se conoce la expiracion del token
// (p.ej. el flujo de Google, donde la sesion la materializa Supabase en el
// cliente). Coincide con la duracion estandar del access_token de Supabase.
export const DEFAULT_SESSION_MAX_AGE = 3600;

const isProduction = (): boolean => process.env.NODE_ENV === 'production';

// SameSite=Lax es seguro porque frontend y backend se sirven en el mismo origen
// (nginx hace de reverse proxy hacia /api), evitando cookies de terceros y
// mitigando CSRF. `secure` solo en produccion para permitir HTTP en local.
const baseCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: isProduction(),
  sameSite: 'lax',
  path: '/',
});

export const setAuthCookie = (res: Response, token: string, maxAgeSeconds: number): void => {
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...baseCookieOptions(),
    maxAge: maxAgeSeconds * 1000,
  });
};

export const clearAuthCookie = (res: Response): void => {
  res.clearCookie(AUTH_COOKIE_NAME, baseCookieOptions());
};
