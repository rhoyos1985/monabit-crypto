import { describe, it, expect } from '@jest/globals';
import { createApiResponse, createErrorResponse } from './api-response.js';
import { HttpStatusCode } from './http-error.js';

describe('api-response helpers', () => {
  it('createApiResponse devuelve estructura estándar con OK por defecto', () => {
    const result = createApiResponse({ id: '1' }, 'ok');

    expect(result.apiData).toEqual({ id: '1' });
    expect(result.apiMessage).toBe('ok');
    expect(result.httpStatus).toContain('200');
  });

  it('createApiResponse acepta statusCode personalizado', () => {
    const result = createApiResponse(null, 'created', HttpStatusCode.CREATED);
    expect(result.httpStatus).toContain('201');
  });

  it('createErrorResponse devuelve apiData null por defecto INTERNAL_SERVER_ERROR', () => {
    const result = createErrorResponse('something failed');
    expect(result.apiData).toBeNull();
    expect(result.httpStatus).toContain('500');
    expect(result.errorDetails).toBeUndefined();
  });

  it('createErrorResponse incluye errorDetails cuando se pasan', () => {
    const result = createErrorResponse('bad', HttpStatusCode.BAD_REQUEST, { error: 'oops' });
    expect(result.errorDetails).toEqual({ error: 'oops' });
    expect(result.httpStatus).toContain('400');
  });
});
