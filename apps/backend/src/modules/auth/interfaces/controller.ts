import { Request, Response, NextFunction } from 'express';
import { AuthCredentials } from '../domain/types.js';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  authResultResponseSchema,
  userResponseSchema,
  ChangePasswordRequest,
} from './schemas.js';
import { IAuthService } from '../application/ports.js';
import { registerUser, loginUser } from '../application/use-cases.js';
import { HTTPBadRequest, HTTPUnauthorized } from '../../../shared/http-error.js';
import { User, AuthToken, UserRole } from '../domain/types.js';
import { createApiResponse } from '../../../shared/api-response.js';
import { HttpStatusCode } from '../../../shared/http-error.js';

interface UserResponse {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  country?: string;
  avatarUrl?: string;
  authProvider: 'email' | 'google';
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthResultResponse {
  user: UserResponse;
  token: AuthToken;
}

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

const buildUserResponse = (user: User): UserResponse => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  city: user.city,
  state: user.state,
  country: user.country,
  avatarUrl: user.avatarUrl,
  authProvider: user.authProvider,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});

const formatAuthResult = (result: { user: User; token: AuthToken }): AuthResultResponse => {
  return authResultResponseSchema.parse({
    user: buildUserResponse(result.user),
    token: result.token,
  });
};

const formatUser = (user: User): UserResponse => {
  return userResponseSchema.parse(buildUserResponse(user));
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

  const changePasswordHandler = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new HTTPUnauthorized('No autenticado');
      }

      const parsed = changePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        const errorMessages = Object.entries(parsed.error.flatten().fieldErrors)
          .map(([field, errors]) => `${field}: ${errors?.join(', ')}`)
          .join('; ');
        throw new HTTPBadRequest(`Datos inválidos: ${errorMessages}`, {
          error: 'Validation failed',
          details: parsed.error.flatten(),
        });
      }

      const input: ChangePasswordRequest = parsed.data;
      await authService.changePassword(
        req.user.id,
        req.user.email,
        input.currentPassword,
        input.newPassword
      );

      res
        .status(200)
        .json(createApiResponse({ success: true }, 'Contraseña actualizada exitosamente', HttpStatusCode.OK));
    } catch (error) {
      next(error);
    }
  };

  return { registerHandler, loginHandler, logoutHandler, getMeHandler, changePasswordHandler };
};
