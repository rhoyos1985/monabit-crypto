export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Llave publica RSA del backend (PEM SPKI). Se embebe en el bundle en build time
// via --build-arg VITE_CRYPTO_PUBLIC_KEY; nunca se obtiene del backend en runtime.
export const CRYPTO_PUBLIC_KEY = (import.meta.env.VITE_CRYPTO_PUBLIC_KEY || '').replace(
  /\\n/g,
  '\n'
);
