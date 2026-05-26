import { HttpStatusCode, httpStatusMessages, type ErrorDetails } from './http-error.js';

export interface ApiResponse<T = unknown> {
  httpStatus: string;
  apiMessage: string;
  apiData: T | null;
  errorDetails?: ErrorDetails;
}

export const createApiResponse = <T>(
  data: T,
  message: string,
  statusCode: HttpStatusCode = HttpStatusCode.OK
): ApiResponse<T> => ({
  httpStatus: `${statusCode} - ${httpStatusMessages[statusCode]}`,
  apiMessage: message,
  apiData: data,
});

export const createErrorResponse = (
  message: string,
  statusCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
  errorDetails?: ErrorDetails
): ApiResponse<null> => ({
  httpStatus: `${statusCode} - ${httpStatusMessages[statusCode]}`,
  apiMessage: message,
  apiData: null,
  ...(errorDetails && { errorDetails }),
});
