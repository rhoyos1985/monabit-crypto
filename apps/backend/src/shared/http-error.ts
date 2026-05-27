export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

export const httpStatusMessages: Record<HttpStatusCode, string> = {
  [HttpStatusCode.OK]: 'OK',
  [HttpStatusCode.CREATED]: 'Created',
  [HttpStatusCode.NO_CONTENT]: 'No Content',
  [HttpStatusCode.BAD_REQUEST]: 'Bad Request',
  [HttpStatusCode.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatusCode.FORBIDDEN]: 'Forbidden',
  [HttpStatusCode.NOT_FOUND]: 'Not Found',
  [HttpStatusCode.CONFLICT]: 'Conflict',
  [HttpStatusCode.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
  [HttpStatusCode.SERVICE_UNAVAILABLE]: 'Service Unavailable',
};

export interface ErrorDetails {
  error?: string;
  details?: unknown;
  [key: string]: unknown;
}

export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly isOperational: boolean;
  public readonly errorData?: ErrorDetails;

  constructor(
    message: string,
    statusCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
    errorData?: ErrorDetails
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errorData = errorData;

    Error.captureStackTrace(this, this.constructor);
  }

  getStatusMessage(): string {
    return `${this.statusCode} - ${httpStatusMessages[this.statusCode]}`;
  }
}

export class HTTPBadRequest extends AppError {
  constructor(message: string = 'Bad Request', errorData?: ErrorDetails) {
    super(message, HttpStatusCode.BAD_REQUEST, errorData);
    Object.setPrototypeOf(this, HTTPBadRequest.prototype);
  }
}

export class HTTPUnauthorized extends AppError {
  constructor(message: string = 'Unauthorized', errorData?: ErrorDetails) {
    super(message, HttpStatusCode.UNAUTHORIZED, errorData);
    Object.setPrototypeOf(this, HTTPUnauthorized.prototype);
  }
}

export class HTTPForbidden extends AppError {
  constructor(message: string = 'Forbidden', errorData?: ErrorDetails) {
    super(message, HttpStatusCode.FORBIDDEN, errorData);
    Object.setPrototypeOf(this, HTTPForbidden.prototype);
  }
}

export class HTTPNotFound extends AppError {
  constructor(message: string = 'Not Found', errorData?: ErrorDetails) {
    super(message, HttpStatusCode.NOT_FOUND, errorData);
    Object.setPrototypeOf(this, HTTPNotFound.prototype);
  }
}

export class HTTPConflict extends AppError {
  constructor(message: string = 'Conflict', errorData?: ErrorDetails) {
    super(message, HttpStatusCode.CONFLICT, errorData);
    Object.setPrototypeOf(this, HTTPConflict.prototype);
  }
}

export class HTTPServiceUnavailable extends AppError {
  constructor(message: string = 'Service Unavailable', errorData?: ErrorDetails) {
    super(message, HttpStatusCode.SERVICE_UNAVAILABLE, errorData);
    Object.setPrototypeOf(this, HTTPServiceUnavailable.prototype);
  }
}
