import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('El email debe ser válido').min(1, 'El email es requerido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  // Ignorar cualquier campo 'role' que venga en el body
});

export const loginSchema = z.object({
  email: z.string().email('El email debe ser válido').min(1, 'El email es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const authTokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  expires_in: z.number(),
  token_type: z.string(),
});

export const userResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string().optional(),
  role: z.enum(['admin', 'user']),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const authResultResponseSchema = z.object({
  user: userResponseSchema,
  token: authTokenResponseSchema,
});

export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type AuthResultResponse = z.infer<typeof authResultResponseSchema>;
