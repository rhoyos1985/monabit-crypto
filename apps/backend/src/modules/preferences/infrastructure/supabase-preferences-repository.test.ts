import { describe, it, expect, jest } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabasePreferencesRepository } from './supabase-preferences-repository.js';
import { HTTPBadRequest } from '../../../shared/http-error.js';

interface MockChain {
  from: jest.Mock;
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  eq: jest.Mock;
  maybeSingle: jest.Mock;
  single: jest.Mock;
}

const buildMockClient = (): { client: SupabaseClient; chain: MockChain } => {
  const chain: MockChain = {
    from: jest.fn(),
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    eq: jest.fn(),
    maybeSingle: jest.fn(),
    single: jest.fn(),
  };
  chain.from.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);
  chain.insert.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);

  const client = chain as unknown as SupabaseClient;
  return { client, chain };
};

const buildPrefsRow = (overrides: Record<string, unknown> = {}) => ({
  user_id: 'u-1',
  theme: 'light',
  favorite_coins: ['bitcoin'],
  updated_at: '2026-05-27T00:00:00Z',
  ...overrides,
});

describe('SupabasePreferencesRepository', () => {
  describe('getByUserId', () => {
    it('devuelve las preferencias existentes mapeadas al dominio', async () => {
      const { client, chain } = buildMockClient();
      chain.maybeSingle.mockResolvedValue({ data: buildPrefsRow(), error: null });

      const repo = createSupabasePreferencesRepository(client);
      const result = await repo.getByUserId('u-1');

      expect(result.userId).toBe('u-1');
      expect(result.theme).toBe('light');
      expect(result.favoriteCoins).toEqual(['bitcoin']);
      expect(chain.from).toHaveBeenCalledWith('user_preferences');
    });

    it('crea preferencias por defecto si el usuario no las tiene', async () => {
      const { client, chain } = buildMockClient();
      chain.maybeSingle.mockResolvedValue({ data: null, error: null });
      chain.single.mockResolvedValue({
        data: buildPrefsRow({ user_id: 'new-user', favorite_coins: [] }),
        error: null,
      });

      const repo = createSupabasePreferencesRepository(client);
      const result = await repo.getByUserId('new-user');

      expect(result.userId).toBe('new-user');
      expect(result.theme).toBe('light');
      expect(result.favoriteCoins).toEqual([]);
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'new-user', theme: 'light' })
      );
    });

    it('lanza HTTPBadRequest cuando el query falla', async () => {
      const { client, chain } = buildMockClient();
      chain.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'connection lost', code: '08000' },
      });

      const repo = createSupabasePreferencesRepository(client);
      await expect(repo.getByUserId('u-1')).rejects.toThrow(HTTPBadRequest);
    });
  });

  describe('update', () => {
    it('actualiza el tema y devuelve las preferencias resultantes', async () => {
      const { client, chain } = buildMockClient();
      chain.single.mockResolvedValue({
        data: buildPrefsRow({ theme: 'dark' }),
        error: null,
      });

      const repo = createSupabasePreferencesRepository(client);
      const result = await repo.update('u-1', { theme: 'dark' });

      expect(result.theme).toBe('dark');
      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ theme: 'dark' }));
    });

    it('actualiza favoriteCoins reemplazando el arreglo completo', async () => {
      const { client, chain } = buildMockClient();
      chain.single.mockResolvedValue({
        data: buildPrefsRow({ favorite_coins: ['ethereum', 'solana'] }),
        error: null,
      });

      const repo = createSupabasePreferencesRepository(client);
      const result = await repo.update('u-1', { favoriteCoins: ['ethereum', 'solana'] });

      expect(result.favoriteCoins).toEqual(['ethereum', 'solana']);
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ favorite_coins: ['ethereum', 'solana'] })
      );
    });
  });
});
