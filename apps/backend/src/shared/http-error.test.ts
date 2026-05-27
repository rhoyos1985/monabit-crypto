import { describe, it, expect } from '@jest/globals';
import {
  AppError,
  HttpStatusCode,
  HTTPBadRequest,
  HTTPUnauthorized,
  HTTPForbidden,
  HTTPNotFound,
  HTTPConflict,
  HTTPServiceUnavailable,
} from './http-error.js';

describe('AppError y subclases', () => {
  it('AppError preserva message, statusCode y errorData', () => {
    const err = new AppError('boom', HttpStatusCode.INTERNAL_SERVER_ERROR, { error: 'kaboom' });
    expect(err.message).toBe('boom');
    expect(err.statusCode).toBe(500);
    expect(err.errorData).toEqual({ error: 'kaboom' });
    expect(err.isOperational).toBe(true);
    expect(err.getStatusMessage()).toContain('Internal Server Error');
  });

  it('AppError usa statusCode por defecto cuando no se especifica', () => {
    const err = new AppError('msg');
    expect(err.statusCode).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR);
  });

  const cases: ReadonlyArray<{
    name: string;
    factory: () => AppError;
    expectedCode: HttpStatusCode;
  }> = [
    { name: 'HTTPBadRequest', factory: () => new HTTPBadRequest(), expectedCode: 400 },
    { name: 'HTTPUnauthorized', factory: () => new HTTPUnauthorized(), expectedCode: 401 },
    { name: 'HTTPForbidden', factory: () => new HTTPForbidden(), expectedCode: 403 },
    { name: 'HTTPNotFound', factory: () => new HTTPNotFound(), expectedCode: 404 },
    { name: 'HTTPConflict', factory: () => new HTTPConflict(), expectedCode: 409 },
    {
      name: 'HTTPServiceUnavailable',
      factory: () => new HTTPServiceUnavailable(),
      expectedCode: 503,
    },
  ];

  it.each(cases)('$name asigna $expectedCode y es instance of AppError', ({ factory, expectedCode }) => {
    const err = factory();
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(expectedCode);
  });

  it('subclases aceptan mensaje y errorData personalizado', () => {
    const err = new HTTPBadRequest('bad input', { error: 'Validation', details: { field: 'x' } });
    expect(err.message).toBe('bad input');
    expect(err.errorData).toEqual({ error: 'Validation', details: { field: 'x' } });
  });
});
