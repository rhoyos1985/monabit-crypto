import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Email must be valid'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().optional(),
  role: z.enum(['admin', 'user']).optional(),
});

export const updateUserProfileSchema = z.object({
  displayName: z.string().optional(),
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

export const userListResponseSchema = z.array(userResponseSchema);
