import type { User, CreateUserInput, UpdateUserInput } from '../domain/types.js';
import type { IUserRepository } from '../ports/index.js';
import { apiFetch } from '../../../shared/http-client.js';

export const createUserRepository = (): IUserRepository => ({
  async listUsers(): Promise<User[]> {
    return apiFetch<User[]>('GET', '/users');
  },

  async createUser(input: CreateUserInput): Promise<User> {
    return apiFetch<User>('POST', '/users', input);
  },

  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    return apiFetch<User>('PATCH', `/users/${id}`, input);
  },

  async deactivateUser(id: string): Promise<User> {
    return apiFetch<User>('PATCH', `/users/${id}/deactivate`, {});
  },
});
