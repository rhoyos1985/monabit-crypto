import type { User, CreateUserInput, UpdateUserInput } from '../domain/types.js';
import type { IUserRepository } from '../ports/index.js';
import { fetchByAuth, getStoredToken } from '../../../shared/http-client.js';

export const createUserRepository = (): IUserRepository => ({
  async listUsers(): Promise<User[]> {
    return fetchByAuth<User[]>('GET', '/users', getStoredToken());
  },

  async createUser(input: CreateUserInput): Promise<User> {
    return fetchByAuth<User>('POST', '/users', getStoredToken(), input);
  },

  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    return fetchByAuth<User>('PATCH', `/users/${id}`, getStoredToken(), input);
  },

  async deactivateUser(id: string): Promise<User> {
    return fetchByAuth<User>('PATCH', `/users/${id}/deactivate`, getStoredToken(), {});
  },
});
