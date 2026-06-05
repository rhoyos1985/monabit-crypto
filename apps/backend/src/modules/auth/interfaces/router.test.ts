import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import 'express-async-errors';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAuthRouter } from './router.js';
import { errorHandler } from '../../../shared/error-handler.js';

const buildAuthUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
  email: 'user@example.com',
  ...overrides,
});

const buildProfileRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
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

const buildSession = () => ({
  access_token: 'token-abc',
  refresh_token: 'refresh-abc',
  expires_in: 3600,
});

const buildSupabaseMock = (config: {
  signUpResult?: unknown;
  signInResult?: unknown;
  getUserResult?: unknown;
  profileRow?: ReturnType<typeof buildProfileRow> | null;
  profileError?: unknown;
}): jest.Mocked<SupabaseClient> => {
  const queryChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: config.profileRow ?? null, error: config.profileError ?? null }),
  };

  const mock = {
    auth: {
      signUp: jest.fn().mockResolvedValue(config.signUpResult ?? { data: null, error: null }),
      signInWithPassword: jest.fn().mockResolvedValue(config.signInResult ?? { data: null, error: null }),
      getUser: jest.fn().mockResolvedValue(config.getUserResult ?? { data: { user: null }, error: null }),
      admin: { updateUserById: jest.fn() },
    },
    from: jest.fn().mockReturnValue(queryChain),
  };

  return mock as unknown as jest.Mocked<SupabaseClient>;
};

const buildApp = (supabase: jest.Mocked<SupabaseClient>): Express => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/auth', createAuthRouter(supabase));
  app.use(errorHandler);
  return app;
};

describe('Auth router (integración)', () => {
  describe('POST /auth/register', () => {
    let supabase: jest.Mocked<SupabaseClient>;

    beforeEach(() => {
      supabase = buildSupabaseMock({
        signUpResult: {
          data: { user: buildAuthUser(), session: buildSession() },
          error: null,
        },
        getUserResult: { data: { user: buildAuthUser() }, error: null },
        profileRow: buildProfileRow(),
      });
    });

    it('rechaza body inválido con 400', async () => {
      const app = buildApp(supabase);
      const res = await request(app).post('/auth/register').send({ email: 'invalido' });

      expect(res.status).toBe(400);
    });

    it('registra usuario y devuelve user + token', async () => {
      const app = buildApp(supabase);
      const res = await request(app).post('/auth/register').send({
        email: 'user@example.com',
        password: 'secret123',
        firstName: 'Juan',
        lastName: 'Pérez',
        city: 'Bogotá',
        state: 'Cundinamarca',
        country: 'Colombia',
      });

      expect(res.status).toBe(201);
      expect(res.body.apiData.user.email).toBe('user@example.com');
      expect(res.body.apiData.token.access_token).toBe('token-abc');
    });
  });

  describe('POST /auth/login', () => {
    it('devuelve 401 cuando las credenciales son incorrectas', async () => {
      const supabase = buildSupabaseMock({
        signInResult: { data: null, error: { message: 'Invalid' } },
      });
      const app = buildApp(supabase);

      const res = await request(app).post('/auth/login').send({
        email: 'user@example.com',
        password: 'wrong',
      });

      expect(res.status).toBe(401);
    });

    it('devuelve 200 y datos de sesión con credenciales válidas', async () => {
      const supabase = buildSupabaseMock({
        signInResult: {
          data: { user: buildAuthUser(), session: buildSession() },
          error: null,
        },
        getUserResult: { data: { user: buildAuthUser() }, error: null },
        profileRow: buildProfileRow(),
      });
      const app = buildApp(supabase);

      const res = await request(app).post('/auth/login').send({
        email: 'user@example.com',
        password: 'secret123',
      });

      expect(res.status).toBe(200);
      expect(res.body.apiData.user.role).toBe('user');
    });

    it('setea la cookie httpOnly access_token al iniciar sesión', async () => {
      const supabase = buildSupabaseMock({
        signInResult: {
          data: { user: buildAuthUser(), session: buildSession() },
          error: null,
        },
        getUserResult: { data: { user: buildAuthUser() }, error: null },
        profileRow: buildProfileRow(),
      });
      const app = buildApp(supabase);

      const res = await request(app).post('/auth/login').send({
        email: 'user@example.com',
        password: 'secret123',
      });

      const cookies = res.headers['set-cookie'] as unknown as string[];
      const authCookie = cookies.find((c) => c.startsWith('access_token='));
      expect(authCookie).toBeDefined();
      expect(authCookie).toContain('access_token=token-abc');
      expect(authCookie).toContain('HttpOnly');
      expect(authCookie).toContain('SameSite=Lax');
    });
  });

  describe('POST /auth/session', () => {
    it('intercambia un token de Supabase por la cookie httpOnly (200)', async () => {
      const supabase = buildSupabaseMock({
        getUserResult: { data: { user: buildAuthUser() }, error: null },
        profileRow: buildProfileRow(),
      });
      const app = buildApp(supabase);

      const res = await request(app).post('/auth/session').send({ accessToken: 'supabase-token' });

      expect(res.status).toBe(200);
      expect(res.body.apiData.email).toBe('user@example.com');
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c) => c.startsWith('access_token=') && c.includes('HttpOnly'))).toBe(true);
    });

    it('rechaza con 400 si falta accessToken', async () => {
      const supabase = buildSupabaseMock({});
      const app = buildApp(supabase);

      const res = await request(app).post('/auth/session').send({});
      expect(res.status).toBe(400);
    });

    it('devuelve 401 si el token de Supabase es inválido', async () => {
      const supabase = buildSupabaseMock({
        getUserResult: { data: { user: null }, error: { message: 'invalid' } },
      });
      const app = buildApp(supabase);

      const res = await request(app).post('/auth/session').send({ accessToken: 'bad-token' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /auth/me', () => {
    it('devuelve 401 sin cookie ni Authorization header', async () => {
      const supabase = buildSupabaseMock({});
      const app = buildApp(supabase);

      const res = await request(app).get('/auth/me');
      expect(res.status).toBe(401);
    });

    it('autentica usando la cookie httpOnly access_token', async () => {
      const supabase = buildSupabaseMock({
        getUserResult: { data: { user: buildAuthUser() }, error: null },
        profileRow: buildProfileRow(),
      });
      const app = buildApp(supabase);

      const res = await request(app).get('/auth/me').set('Cookie', 'access_token=valid-token');

      expect(res.status).toBe(200);
      expect(res.body.apiData.email).toBe('user@example.com');
    });

    it('devuelve 200 con un token válido', async () => {
      const supabase = buildSupabaseMock({
        getUserResult: { data: { user: buildAuthUser() }, error: null },
        profileRow: buildProfileRow(),
      });
      const app = buildApp(supabase);

      const res = await request(app).get('/auth/me').set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.apiData.email).toBe('user@example.com');
    });
  });

  describe('POST /auth/change-password', () => {
    it('rechaza usuario con auth_provider=google con 400', async () => {
      const supabase = buildSupabaseMock({
        getUserResult: { data: { user: buildAuthUser() }, error: null },
        profileRow: buildProfileRow({ auth_provider: 'google' }),
      });

      const app = buildApp(supabase);
      const res = await request(app)
        .post('/auth/change-password')
        .set('Authorization', 'Bearer valid-token')
        .send({ currentPassword: 'old12345', newPassword: 'new12345' });

      expect(res.status).toBe(400);
    });
  });
});
