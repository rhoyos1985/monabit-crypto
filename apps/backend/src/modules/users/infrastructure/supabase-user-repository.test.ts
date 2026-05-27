import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseUserRepository } from './supabase-user-repository.js';
import { HTTPConflict, HTTPBadRequest } from '../../../shared/http-error.js';

interface MockChain {
  from: jest.Mock;
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
}

const buildClient = (): { client: SupabaseClient; chain: MockChain } => {
  const chain: MockChain = {
    from: jest.fn(),
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
  };
  chain.from.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);
  chain.insert.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  return { client: chain as unknown as SupabaseClient, chain };
};

const buildProfileRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'u-1',
  email: 'user@example.com',
  first_name: 'Juan',
  last_name: 'Pérez',
  city: null,
  state: null,
  country: null,
  avatar_url: null,
  auth_provider: 'email',
  role: 'user',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('SupabaseUserRepository', () => {
  describe('findById', () => {
    it('devuelve el usuario mapeado al dominio', async () => {
      const { client, chain } = buildClient();
      chain.single.mockResolvedValue({ data: buildProfileRow(), error: null });

      const repo = createSupabaseUserRepository(client);
      const user = await repo.findById('u-1');

      expect(user?.id).toBe('u-1');
      expect(user?.firstName).toBe('Juan');
      expect(user?.authProvider).toBe('email');
    });

    it('devuelve null si no se encuentra', async () => {
      const { client, chain } = buildClient();
      chain.single.mockResolvedValue({ data: null, error: { message: 'not found' } });

      const repo = createSupabaseUserRepository(client);
      const user = await repo.findById('inexistente');
      expect(user).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('devuelve null si la consulta da error', async () => {
      const { client, chain } = buildClient();
      chain.single.mockResolvedValue({ data: null, error: { message: 'no rows' } });

      const repo = createSupabaseUserRepository(client);
      const user = await repo.findByEmail('x@y.com');
      expect(user).toBeNull();
    });

    it('devuelve el usuario cuando existe', async () => {
      const { client, chain } = buildClient();
      chain.single.mockResolvedValue({ data: buildProfileRow(), error: null });

      const repo = createSupabaseUserRepository(client);
      const user = await repo.findByEmail('user@example.com');
      expect(user?.email).toBe('user@example.com');
    });
  });

  describe('listAll', () => {
    it('devuelve la lista mapeada', async () => {
      const { client, chain } = buildClient();
      chain.select.mockResolvedValue({
        data: [buildProfileRow(), buildProfileRow({ id: 'u-2', email: 'b@b.com' })],
        error: null,
      });

      const repo = createSupabaseUserRepository(client);
      const users = await repo.listAll();
      expect(users).toHaveLength(2);
    });

    it('devuelve arreglo vacío si hay error', async () => {
      const { client, chain } = buildClient();
      chain.select.mockResolvedValue({ data: null, error: { message: 'fail' } });

      const repo = createSupabaseUserRepository(client);
      const users = await repo.listAll();
      expect(users).toEqual([]);
    });
  });

  describe('create', () => {
    let chain: MockChain;
    let repo: ReturnType<typeof createSupabaseUserRepository>;

    beforeEach(() => {
      const built = buildClient();
      chain = built.chain;
      repo = createSupabaseUserRepository(built.client);
    });

    it('crea un usuario y lo devuelve', async () => {
      chain.single.mockResolvedValue({ data: buildProfileRow(), error: null });

      const result = await repo.create({
        id: 'u-1',
        email: 'user@example.com',
        password: 'pwd12345',
        firstName: 'Juan',
        lastName: 'Pérez',
      });

      expect(result.id).toBe('u-1');
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'u-1', email: 'user@example.com', role: 'user' })
      );
    });

    it('lanza HTTPConflict si Supabase reporta duplicado', async () => {
      chain.single.mockResolvedValue({
        data: null,
        error: { message: 'duplicate key value violates unique' },
      });

      await expect(
        repo.create({ id: 'u-1', email: 'x@x.com', password: 'pwd12345' })
      ).rejects.toThrow(HTTPConflict);
    });

    it('lanza HTTPBadRequest en otros errores', async () => {
      chain.single.mockResolvedValue({ data: null, error: { message: 'random failure' } });

      await expect(
        repo.create({ id: 'u-1', email: 'x@x.com', password: 'pwd12345' })
      ).rejects.toThrow(HTTPBadRequest);
    });
  });

  describe('update', () => {
    let chain: MockChain;
    let repo: ReturnType<typeof createSupabaseUserRepository>;

    beforeEach(() => {
      const built = buildClient();
      chain = built.chain;
      repo = createSupabaseUserRepository(built.client);
    });

    it('actualiza firstName, lastName, city y role', async () => {
      chain.single.mockResolvedValue({ data: buildProfileRow({ first_name: 'Nuevo' }), error: null });

      const result = await repo.update('u-1', {
        firstName: 'Nuevo',
        lastName: 'Apellido',
        city: 'Bogotá',
        state: 'Cundinamarca',
        country: 'Colombia',
        role: 'admin',
      });

      expect(result.firstName).toBe('Nuevo');
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: 'Nuevo',
          last_name: 'Apellido',
          city: 'Bogotá',
          role: 'admin',
        })
      );
    });

    it('actualiza isActive a false (desactivación)', async () => {
      chain.single.mockResolvedValue({
        data: buildProfileRow({ is_active: false }),
        error: null,
      });

      const result = await repo.update('u-1', { isActive: false });
      expect(result.isActive).toBe(false);
      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }));
    });

    it('lanza HTTPBadRequest cuando el update falla', async () => {
      chain.single.mockResolvedValue({ data: null, error: { message: 'db error' } });

      await expect(repo.update('u-1', { firstName: 'x' })).rejects.toThrow(HTTPBadRequest);
    });
  });
});
