import { Response } from 'express';
import { ApiResponse, ApiErrorDetail } from '../types/api.types';

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200
): Response => {
  const responseBody: ApiResponse<T> = {
    success: true,
    ...(message ? { message } : {}),
    ...(data !== undefined ? { data } : {}),
  };

  return res.status(statusCode).json(responseBody);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  errorCode = 'INTERNAL_SERVER_ERROR',
  details?: ApiErrorDetail[]
): Response => {
  const responseBody: ApiResponse = {
    success: false,
    message,
    error: {
      code: errorCode,
      ...(details && details.length > 0 ? { details } : {}),
    },
  };

  return res.status(statusCode).json(responseBody);
};
