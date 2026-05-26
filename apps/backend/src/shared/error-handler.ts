import { Request, Response, NextFunction } from 'express';
import { AppError, HttpStatusCode } from './http-error.js';
import { createErrorResponse } from './api-response.js';
import logger from './logger.js';

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (err instanceof AppError) {
    logger.warn(`[${err.statusCode}] ${err.message}`);

    res.status(err.statusCode).json(
      createErrorResponse(
        err.message,
        err.statusCode as HttpStatusCode,
        err.errorData
      )
    );
    return;
  }

  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });

  const errorResponse = createErrorResponse(
    isDevelopment ? err.message : 'Internal server error',
    HttpStatusCode.INTERNAL_SERVER_ERROR
  );

  res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(errorResponse);
};
