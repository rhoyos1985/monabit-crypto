import { IUserRepository, IAuthProvider } from './ports.js';
import { CreateUserInput, UpdateUserProfileInput, ListUsersInput, DeactivateUserInput, UserDTO } from '../domain/types.js';
import { HTTPForbidden, HTTPConflict, HTTPNotFound } from '../../../shared/http-error.js';

export const listUsers = (userRepository: IUserRepository) => async (input: ListUsersInput): Promise<UserDTO[]> => {
  if (input.requesterRole !== 'admin') {
    throw new HTTPForbidden('Only admins can list users');
  }
  return userRepository.listAll();
};

export const createUser = (userRepository: IUserRepository, authProvider: IAuthProvider) => async (
  input: CreateUserInput & { requesterId: string; requesterRole: 'admin' | 'user' }
): Promise<UserDTO> => {
  if (input.requesterRole !== 'admin') {
    throw new HTTPForbidden('Only admins can create users');
  }

  const existingUser = await userRepository.findByEmail(input.email);
  if (existingUser) {
    throw new HTTPConflict('Email already registered');
  }

  const authResult = await authProvider.registerUser({
    email: input.email,
    password: input.password,
  });

  const role = input.role === 'admin' ? 'admin' : 'user';
  const newUserData: CreateUserInput & { id: string } = {
    id: authResult.user.id,
    email: authResult.user.email,
    password: input.password,
    firstName: input.firstName,
    lastName: input.lastName,
    city: input.city,
    state: input.state,
    country: input.country,
    role,
  };

  return userRepository.create(newUserData);
};

export const updateUserProfile = (userRepository: IUserRepository) => async (
  userId: string,
  requesterId: string,
  requesterRole: 'admin' | 'user',
  input: UpdateUserProfileInput
): Promise<UserDTO> => {
  if (requesterRole !== 'admin' && userId !== requesterId) {
    throw new HTTPForbidden('You can only edit your own profile');
  }

  const user = await userRepository.findById(userId);
  if (!user) {
    throw new HTTPNotFound('User not found');
  }

  return userRepository.update(userId, {
    firstName: input.firstName ?? user.firstName,
    lastName: input.lastName ?? user.lastName,
    city: input.city ?? user.city,
    state: input.state ?? user.state,
    country: input.country ?? user.country,
    updatedAt: new Date(),
  });
};

export const deactivateUser = (userRepository: IUserRepository) => async (input: DeactivateUserInput): Promise<UserDTO> => {
  if (input.requesterRole !== 'admin') {
    throw new HTTPForbidden('Only admins can deactivate users');
  }

  const user = await userRepository.findById(input.userId);
  if (!user) {
    throw new HTTPNotFound('User not found');
  }

  return userRepository.update(input.userId, {
    isActive: false,
    updatedAt: new Date(),
  });
};
