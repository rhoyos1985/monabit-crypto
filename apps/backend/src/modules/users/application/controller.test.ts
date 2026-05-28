import { describe, it, expect, jest } from '@jest/globals';
import express, { Express } from 'express';
import request from 'supertest';
import 'express-async-errors';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createUsersRouter } from '../interfaces/router.js';
import { errorHandler } from '../../../shared/error-handler.js';

const buildAuthUser = (id = 'admin-1') => ({ id, email: 'admin@example.com' });

const buildProfileRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'admin-1',
  email: 'admin@example.com',
  first_name: 'Admin',
  last_name: 'Root',
  city: null,
  state: null,
  country: null,
  avatar_url: null,
  auth_provider: 'email',
  role: 'admin',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

const buildMockSupabase = (config: {
  authUserId?: string;
  callerProfile?: ReturnType<typeof buildProfileRow>;
  fromHandlers?: Record<string, () => unknown>;
}): jest.Mocked<SupabaseClient> => {
  const callerProfile = config.callerProfile ?? buildProfileRow();

  // Cada llamada a from() devuelve una nueva chain
  const fromMock = jest.fn((table: string) => {
    const handler = config.fromHandlers?.[table];
    return handler ? handler() : buildPassthroughChain();
  });

  // Chain por defecto para auth middleware (single para profile lookup)
  const buildPassthroughChain = () => {
    const c = {
      select: jest.fn(),
      eq: jest.fn(),
      single: jest.fn().mockResolvedValue({ data: callerProfile, error: null }),
      insert: jest.fn(),
      update: jest.fn(),
    };
    c.select.mockReturnValue(c);
    c.eq.mockReturnValue(c);
    c.insert.mockReturnValue(c);
    c.update.mockReturnValue(c);
    return c;
  };

  const mock = {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      getUser: jest
        .fn()
        .mockResolvedValue({ data: { user: buildAuthUser(config.authUserId ?? 'admin-1') }, error: null }),
      admin: { updateUserById: jest.fn() },
    },
    from: fromMock,
  };
  return mock as unknown as jest.Mocked<SupabaseClient>;
};

const buildApp = (supabase: jest.Mocked<SupabaseClient>): Express => {
  const app = express();
  app.use(express.json());
  app.use('/users', createUsersRouter(supabase));
  app.use(errorHandler);
  return app;
};

describe('Users router (integración)', () => {
  describe('GET /users', () => {
    it('devuelve 403 cuando el solicitante no es admin', async () => {
      const supabase = buildMockSupabase({
        callerProfile: buildProfileRow({ id: 'u-1', role: 'user' }),
        authUserId: 'u-1',
      });
      const app = buildApp(supabase);

      const res = await request(app).get('/users').set('Authorization', 'Bearer token');
      expect(res.status).toBe(403);
    });

    it('devuelve la lista cuando es admin', async () => {
      const supabase = buildMockSupabase({
        fromHandlers: {
          profiles: () => {
            // Primera llamada: middleware (single). Las siguientes (select sin eq) devuelven array.
            let callCount = 0;
            const chain = {
              select: jest.fn(),
              eq: jest.fn(),
              single: jest.fn().mockResolvedValue({ data: buildProfileRow(), error: null }),
            };
            chain.select.mockImplementation(() => {
              callCount += 1;
              if (callCount === 1) return chain;
              // segunda llamada select('*') de listAll devuelve promise con array
              return Promise.resolve({
                data: [buildProfileRow(), buildProfileRow({ id: 'u-2', email: 'b@b.com' })],
                error: null,
              });
            });
            chain.eq.mockReturnValue(chain);
            return chain;
          },
        },
      });

      const app = buildApp(supabase);
      const res = await request(app).get('/users').set('Authorization', 'Bearer token');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.apiData)).toBe(true);
    });
  });

  describe('PATCH /users/me', () => {
    it('actualiza el propio perfil sin requerir rol admin', async () => {
      const supabase = buildMockSupabase({
        authUserId: 'u-1',
        callerProfile: buildProfileRow({ id: 'u-1', role: 'user' }),
        fromHandlers: {
          profiles: () => {
            let call = 0;
            const chain = {
              select: jest.fn(),
              eq: jest.fn(),
              update: jest.fn(),
              single: jest.fn().mockImplementation(() => {
                call += 1;
                // 1: middleware, 2: findById, 3: update.select.single
                if (call === 1) {
                  return Promise.resolve({
                    data: buildProfileRow({ id: 'u-1', role: 'user' }),
                    error: null,
                  });
                }
                if (call === 2) {
                  return Promise.resolve({
                    data: buildProfileRow({ id: 'u-1', role: 'user' }),
                    error: null,
                  });
                }
                return Promise.resolve({
                  data: buildProfileRow({ id: 'u-1', first_name: 'Nuevo', role: 'user' }),
                  error: null,
                });
              }),
            };
            chain.select.mockReturnValue(chain);
            chain.eq.mockReturnValue(chain);
            chain.update.mockReturnValue(chain);
            return chain;
          },
        },
      });

      const app = buildApp(supabase);
      const res = await request(app)
        .patch('/users/me')
        .set('Authorization', 'Bearer token')
        .send({ firstName: 'Nuevo' });

      expect(res.status).toBe(200);
    });
  });
});

describe('createUsersController error paths', () => {
  it('devuelve 400 cuando el body de createUser es inválido', async () => {
    const supabase = buildMockSupabase({ callerProfile: buildProfileRow() });
    const app = buildApp(supabase);

    const res = await request(app)
      .post('/users')
      .set('Authorization', 'Bearer token')
      .send({ email: 'invalid' });

    expect(res.status).toBe(400);
  });

  it('devuelve 400 cuando el body de updateUser es inválido', async () => {
    const supabase = buildMockSupabase({ callerProfile: buildProfileRow() });
    const app = buildApp(supabase);

    const res = await request(app)
      .patch('/users/some-id')
      .set('Authorization', 'Bearer token')
      .send({ firstName: '' });

    expect(res.status).toBe(400);
  });
});
