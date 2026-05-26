import type { User, CreateUserInput, UpdateUserInput } from '../domain/types.js';

export interface IUserRepository {
  listUsers(): Promise<User[]>;
  createUser(input: CreateUserInput): Promise<User>;
  updateUser(id: string, input: UpdateUserInput): Promise<User>;
  deactivateUser(id: string): Promise<User>;
}
