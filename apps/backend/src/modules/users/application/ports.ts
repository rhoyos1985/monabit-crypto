import { UserDTO, CreateUserInput, AuthCredentials, AuthResult } from '../domain/types.js';

export interface IUserRepository {
  findById(id: string): Promise<UserDTO | null>;
  findByEmail(email: string): Promise<UserDTO | null>;
  listAll(): Promise<UserDTO[]>;
  create(user: CreateUserInput & { id: string }): Promise<UserDTO>;
  update(id: string, data: Partial<UserDTO>): Promise<UserDTO>;
}

export interface IAuthProvider {
  registerUser(credentials: AuthCredentials): Promise<AuthResult>;
}
