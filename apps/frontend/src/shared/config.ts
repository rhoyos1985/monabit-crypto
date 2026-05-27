// eslint-disable-next-line @typescript-eslint/no-explicit-any
const env = import.meta.env as any;

export const API_BASE_URL = env.VITE_API_BASE_URL || 'http://localhost:8080';
export const SUPABASE_URL = env.VITE_SUPABASE_URL || 'http://localhost:54321';
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || '';
