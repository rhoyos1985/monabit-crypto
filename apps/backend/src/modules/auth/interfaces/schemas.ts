import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('El email debe ser válido').min(1, 'El email es requerido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  firstName: z.string().min(1, 'El nombre es requerido').max(100),
  lastName: z.string().min(1, 'El apellido es requerido').max(100),
  city: z.string().min(1, 'La ciudad es requerida').max(100),
  state: z.string().min(1, 'El departamento es requerido').max(100),
  country: z.string().min(1, 'El país es requerido').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('El email debe ser válido').min(1, 'El email es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const sessionSchema = z.object({
  accessToken: z.string().min(1, 'El token es requerido'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['newPassword'],
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
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  avatarUrl: z.string().optional(),
  authProvider: z.enum(['email', 'google']),
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
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
export type SessionRequest = z.infer<typeof sessionSchema>;
export type AuthResultResponse = z.infer<typeof authResultResponseSchema>;
