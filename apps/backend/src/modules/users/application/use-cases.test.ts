import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { listUsers, createUser, updateUserProfile, deactivateUser } from './use-cases.js';
import { IUserRepository, IAuthProvider } from './ports.js';
import { UserDTO } from '../domain/types.js';
import { HTTPForbidden, HTTPConflict, HTTPNotFound } from '../../../shared/http-error.js';

const buildUser = (overrides: Partial<UserDTO> = {}): UserDTO => ({
  id: 'user-1',
  email: 'user@example.com',
  firstName: 'Ana',
  lastName: 'García',
  authProvider: 'email',
  role: 'user',
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

const createMockRepository = (): jest.Mocked<IUserRepository> => ({
  findById: jest.fn(),
  findByEmail: jest.fn(),
  listAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
});

const createMockAuthProvider = (): jest.Mocked<IAuthProvider> => ({
  registerUser: jest.fn(),
});

describe('users use-cases', () => {
  describe('listUsers', () => {
    it('lanza HTTPForbidden si el solicitante no es admin', async () => {
      const repo = createMockRepository();
      const handler = listUsers(repo);

      await expect(
        handler({ requesterId: 'u-1', requesterRole: 'user' })
      ).rejects.toThrow(HTTPForbidden);
      expect(repo.listAll).not.toHaveBeenCalled();
    });

    it('devuelve la lista cuando el solicitante es admin', async () => {
      const repo = createMockRepository();
      const users = [buildUser(), buildUser({ id: 'u-2', email: 'b@b.com' })];
      repo.listAll.mockResolvedValue(users);

      const handler = listUsers(repo);
      const result = await handler({ requesterId: 'admin-1', requesterRole: 'admin' });

      expect(result).toEqual(users);
      expect(repo.listAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('createUser', () => {
    let repo: jest.Mocked<IUserRepository>;
    let auth: jest.Mocked<IAuthProvider>;

    beforeEach(() => {
      repo = createMockRepository();
      auth = createMockAuthProvider();
    });

    it('lanza HTTPForbidden si el solicitante no es admin', async () => {
      const handler = createUser(repo, auth);
      await expect(
        handler({
          email: 'new@b.com',
          password: 'pwd12345',
          requesterId: 'u-1',
          requesterRole: 'user',
        })
      ).rejects.toThrow(HTTPForbidden);
    });

    it('lanza HTTPConflict si el email ya está registrado', async () => {
      repo.findByEmail.mockResolvedValue(buildUser());
      const handler = createUser(repo, auth);

      await expect(
        handler({
          email: 'user@example.com',
          password: 'pwd12345',
          requesterId: 'admin-1',
          requesterRole: 'admin',
        })
      ).rejects.toThrow(HTTPConflict);
      expect(auth.registerUser).not.toHaveBeenCalled();
    });

    it('crea el usuario con rol "user" cuando admin no especifica rol', async () => {
      repo.findByEmail.mockResolvedValue(null);
      auth.registerUser.mockResolvedValue({
        user: buildUser({ id: 'new-id', email: 'new@b.com' }),
        token: { access_token: 't', expires_in: 3600, token_type: 'Bearer' },
      });
      const created = buildUser({ id: 'new-id', email: 'new@b.com' });
      repo.create.mockResolvedValue(created);

      const handler = createUser(repo, auth);
      const result = await handler({
        email: 'new@b.com',
        password: 'pwd12345',
        firstName: 'Test',
        lastName: 'User',
        requesterId: 'admin-1',
        requesterRole: 'admin',
      });

      expect(result).toBe(created);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'user', email: 'new@b.com', firstName: 'Test' })
      );
    });

    it('crea el usuario con rol "admin" cuando admin lo solicita explícitamente', async () => {
      repo.findByEmail.mockResolvedValue(null);
      auth.registerUser.mockResolvedValue({
        user: buildUser({ id: 'a-id' }),
        token: { access_token: 't', expires_in: 3600, token_type: 'Bearer' },
      });
      repo.create.mockResolvedValue(buildUser({ id: 'a-id', role: 'admin' }));

      const handler = createUser(repo, auth);
      await handler({
        email: 'admin2@b.com',
        password: 'pwd12345',
        role: 'admin',
        requesterId: 'admin-1',
        requesterRole: 'admin',
      });

      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'admin' }));
    });
  });

  describe('updateUserProfile', () => {
    let repo: jest.Mocked<IUserRepository>;

    beforeEach(() => {
      repo = createMockRepository();
    });

    it('permite que un usuario edite su propio perfil', async () => {
      const existing = buildUser({ id: 'u-1' });
      repo.findById.mockResolvedValue(existing);
      repo.update.mockResolvedValue(buildUser({ id: 'u-1', firstName: 'Nuevo' }));

      const handler = updateUserProfile(repo);
      await handler('u-1', 'u-1', 'user', { firstName: 'Nuevo' });

      expect(repo.update).toHaveBeenCalledWith(
        'u-1',
        expect.objectContaining({ firstName: 'Nuevo' })
      );
    });

    it('lanza HTTPForbidden cuando un usuario intenta editar otro perfil', async () => {
      const handler = updateUserProfile(repo);
      await expect(
        handler('u-2', 'u-1', 'user', { firstName: 'X' })
      ).rejects.toThrow(HTTPForbidden);
    });

    it('lanza HTTPForbidden si un usuario no-admin intenta cambiar el rol', async () => {
      const handler = updateUserProfile(repo);
      await expect(
        handler('u-1', 'u-1', 'user', { role: 'admin' })
      ).rejects.toThrow(HTTPForbidden);
    });

    it('admin puede cambiar el rol de cualquier usuario', async () => {
      repo.findById.mockResolvedValue(buildUser({ id: 'u-2' }));
      repo.update.mockResolvedValue(buildUser({ id: 'u-2', role: 'admin' }));

      const handler = updateUserProfile(repo);
      await handler('u-2', 'admin-1', 'admin', { role: 'admin' });

      expect(repo.update).toHaveBeenCalledWith(
        'u-2',
        expect.objectContaining({ role: 'admin' })
      );
    });

    it('lanza HTTPNotFound si el usuario no existe', async () => {
      repo.findById.mockResolvedValue(null);
      const handler = updateUserProfile(repo);

      await expect(
        handler('inexistente', 'admin-1', 'admin', { firstName: 'X' })
      ).rejects.toThrow(HTTPNotFound);
    });
  });

  describe('deactivateUser', () => {
    let repo: jest.Mocked<IUserRepository>;

    beforeEach(() => {
      repo = createMockRepository();
    });

    it('lanza HTTPForbidden si el solicitante no es admin', async () => {
      const handler = deactivateUser(repo);
      await expect(
        handler({ userId: 'u-1', requesterId: 'u-2', requesterRole: 'user' })
      ).rejects.toThrow(HTTPForbidden);
    });

    it('admin desactiva un usuario existente', async () => {
      repo.findById.mockResolvedValue(buildUser({ id: 'u-1' }));
      repo.update.mockResolvedValue(buildUser({ id: 'u-1', isActive: false }));

      const handler = deactivateUser(repo);
      const result = await handler({
        userId: 'u-1',
        requesterId: 'admin-1',
        requesterRole: 'admin',
      });

      expect(result.isActive).toBe(false);
      expect(repo.update).toHaveBeenCalledWith('u-1', expect.objectContaining({ isActive: false }));
    });

    it('lanza HTTPNotFound si el usuario a desactivar no existe', async () => {
      repo.findById.mockResolvedValue(null);
      const handler = deactivateUser(repo);

      await expect(
        handler({ userId: 'inexistente', requesterId: 'admin-1', requesterRole: 'admin' })
      ).rejects.toThrow(HTTPNotFound);
    });
  });
});
