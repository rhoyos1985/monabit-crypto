import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createUserRepository } from './users-api-client.js';

const apiResponse = <T>(data: T, ok = true, message = 'ok'): Response =>
  ({
    ok,
    status: ok ? 200 : 400,
    json: async () => ({ httpStatus: '200', apiMessage: message, apiData: data }),
  }) as Response;

describe('UsersRepository (api-client)', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('listUsers hace GET a /users enviando la cookie de sesión (credentials: include)', async () => {
    fetchSpy.mockResolvedValueOnce(apiResponse([{ id: 'u-1' }]));
    const repo = createUserRepository();
    const users = await repo.listUsers();
    expect(users).toHaveLength(1);
    const [, init] = fetchSpy.mock.calls[0]!;
    expect((init as RequestInit).credentials).toBe('include');
  });

  it('createUser hace POST con body JSON', async () => {
    fetchSpy.mockResolvedValueOnce(apiResponse({ id: 'new-id', email: 'new@b.com' }));
    const repo = createUserRepository();
    await repo.createUser({ email: 'new@b.com', password: 'pwd12345' });
    const [, init] = fetchSpy.mock.calls[0]!;
    expect((init as RequestInit).method).toBe('POST');
  });

  it('updateUser hace PATCH con id en el path', async () => {
    fetchSpy.mockResolvedValueOnce(apiResponse({ id: 'u-1', firstName: 'Nuevo' }));
    const repo = createUserRepository();
    await repo.updateUser('u-1', { firstName: 'Nuevo' });
    const [url] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toContain('/users/u-1');
  });

  it('deactivateUser hace PATCH a /users/:id/deactivate', async () => {
    fetchSpy.mockResolvedValueOnce(apiResponse({ id: 'u-1', isActive: false }));
    const repo = createUserRepository();
    await repo.deactivateUser('u-1');
    const [url] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toContain('/users/u-1/deactivate');
  });

  it('lanza Error con apiMessage cuando el response no es ok', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ httpStatus: '403', apiMessage: 'Forbidden', apiData: null }),
    } as Response);
    const repo = createUserRepository();
    await expect(repo.listUsers()).rejects.toThrow('Forbidden');
  });

  it('lanza error de conexión cuando fetch falla', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network'));
    const repo = createUserRepository();
    await expect(repo.listUsers()).rejects.toThrow(/conexión/i);
  });

  it('lanza error si el response no es JSON válido', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('invalid json');
      },
    } as unknown as Response);
    const repo = createUserRepository();
    await expect(repo.listUsers()).rejects.toThrow(/respuesta inválida/i);
  });
});
