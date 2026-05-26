import { Request, Response, NextFunction } from 'express';
import { IUserRepository, IAuthProvider } from './ports.js';
import { listUsers, createUser, updateUserProfile, deactivateUser } from './use-cases.js';
import { createUserSchema, updateUserProfileSchema, userResponseSchema, userListResponseSchema } from '../interfaces/schemas.js';
import { HTTPBadRequest } from '../../../shared/http-error.js';
import { createApiResponse } from '../../../shared/api-response.js';
import { HttpStatusCode } from '../../../shared/http-error.js';
import { User } from '../../auth/domain/types.js';

interface UserRequest extends Request {
  user?: User;
}

const validateCreateUserInput = (data: unknown) => {
  const parsed = createUserSchema.safeParse(data);
  if (!parsed.success) {
    throw new HTTPBadRequest('Validation failed', {
      error: 'Validation failed',
      details: parsed.error.flatten(),
    });
  }
  return parsed.data;
};

const validateUpdateUserInput = (data: unknown) => {
  const parsed = updateUserProfileSchema.safeParse(data);
  if (!parsed.success) {
    throw new HTTPBadRequest('Validation failed', {
      error: 'Validation failed',
      details: parsed.error.flatten(),
    });
  }
  return parsed.data;
};

const formatUser = (user: any) => {
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

export const createUsersController = (userRepository: IUserRepository, authProvider: IAuthProvider) => {
  const listUsersHandler = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doListUsers = listUsers(userRepository);
      const users = await doListUsers({
        requesterId: req.user?.id || '',
        requesterRole: req.user?.role || 'user',
      });
      const formatted = userListResponseSchema.parse(
        users.map((u) =>
          userResponseSchema.parse({
            id: u.id,
            email: u.email,
            displayName: u.displayName,
            role: u.role,
            isActive: u.isActive,
            createdAt: u.createdAt.toISOString(),
            updatedAt: u.updatedAt.toISOString(),
          })
        )
      );
      res.status(200).json(createApiResponse(formatted, 'Users retrieved successfully', HttpStatusCode.OK));
    } catch (error) {
      next(error);
    }
  };

  const createUserHandler = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = validateCreateUserInput(req.body);
      const doCreateUser = createUser(userRepository, authProvider);
      const requesterId = req.user?.id ?? '';
      const requesterRole = req.user?.role ?? 'user';
      const user = await doCreateUser({
        email: input.email,
        password: input.password,
        displayName: input.displayName,
        role: input.role,
        requesterId,
        requesterRole,
      });
      const formatted = formatUser(user);
      res.status(201).json(createApiResponse(formatted, 'User created successfully', HttpStatusCode.CREATED));
    } catch (error) {
      next(error);
    }
  };

  const updateUserHandler = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = validateUpdateUserInput(req.body);
      const doUpdateUserProfile = updateUserProfile(userRepository);
      const userId = req.params.id ?? '';
      const requesterId = req.user?.id ?? '';
      const requesterRole = req.user?.role ?? 'user';
      const user = await doUpdateUserProfile(userId, requesterId, requesterRole, input);
      const formatted = formatUser(user);
      res.status(200).json(createApiResponse(formatted, 'User updated successfully', HttpStatusCode.OK));
    } catch (error) {
      next(error);
    }
  };

  const deactivateUserHandler = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doDeactivateUser = deactivateUser(userRepository);
      const userId = req.params.id ?? '';
      const requesterId = req.user?.id ?? '';
      const requesterRole = req.user?.role ?? 'user';
      const user = await doDeactivateUser({
        userId,
        requesterId,
        requesterRole,
      });
      const formatted = formatUser(user);
      res.status(200).json(createApiResponse(formatted, 'User deactivated successfully', HttpStatusCode.OK));
    } catch (error) {
      next(error);
    }
  };

  return { listUsersHandler, createUserHandler, updateUserHandler, deactivateUserHandler };
};
