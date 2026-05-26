import { Request, Response, NextFunction } from 'express';
import { AuthCredentials } from '../domain/types.js';
import { registerSchema, loginSchema, authResultResponseSchema, userResponseSchema } from '../interfaces/schemas.js';
import { IAuthService } from './ports.js';
import { registerUser, loginUser } from './use-cases.js';
import { HTTPBadRequest, HTTPUnauthorized } from '../../../shared/http-error.js';
import { User } from '../domain/types.js';
import { createApiResponse } from '../../../shared/api-response.js';
import { HttpStatusCode } from '../../../shared/http-error.js';

interface AuthRequest extends Request {
  user?: User;
  token?: string;
}

const validateInput = <T>(schema: typeof registerSchema | typeof loginSchema, data: unknown): T => {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const errorMessages = Object.entries(parsed.error.flatten().fieldErrors)
      .map(([field, errors]) => `${field}: ${errors?.join(', ')}`)
      .join('; ');
    throw new HTTPBadRequest(`Datos inválidos: ${errorMessages}`, {
      error: 'Validation failed',
      details: parsed.error.flatten(),
    });
  }
  return parsed.data as T;
};

const formatAuthResult = (result: { user: User; token: { access_token: string; refresh_token?: string; expires_in: number; token_type: string } }) => {
  return authResultResponseSchema.parse({
    user: {
      ...result.user,
      createdAt: result.user.createdAt.toISOString(),
      updatedAt: result.user.updatedAt.toISOString(),
    },
    token: result.token,
  });
};

const formatUser = (user: User) => {
  return userResponseSchema.parse({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  });
};

export const createAuthController = (authService: IAuthService) => {
  const registerHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const credentials = validateInput<AuthCredentials>(registerSchema, req.body);
      const result = await registerUser(authService)(credentials);
      const formatted = formatAuthResult(result);
      res.status(201).json(createApiResponse(formatted, 'Usuario registrado exitosamente', HttpStatusCode.CREATED));
    } catch (error) {
      next(error);
    }
  };

  const loginHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const credentials = validateInput<AuthCredentials>(loginSchema, req.body);
      const result = await loginUser(authService)(credentials);
      const formatted = formatAuthResult(result);
      res.status(200).json(createApiResponse(formatted, 'Sesión iniciada exitosamente', HttpStatusCode.OK));
    } catch (error) {
      next(error);
    }
  };

  const logoutHandler = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await authService.logoutUser();
      res.status(200).json(createApiResponse({ message: 'Sesión cerrada' }, 'Sesión cerrada exitosamente', HttpStatusCode.OK));
    } catch (error) {
      next(error);
    }
  };

  const getMeHandler = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new HTTPUnauthorized('No autenticado');
      }
      const formatted = formatUser(req.user);
      res.status(200).json(createApiResponse(formatted, 'Datos de usuario obtenidos', HttpStatusCode.OK));
    } catch (error) {
      next(error);
    }
  };

  return { registerHandler, loginHandler, logoutHandler, getMeHandler };
};
