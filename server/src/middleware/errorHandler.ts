import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/appError';
import { sendError } from '../utils/apiResponse';
import { env } from '../config/env';
import { ApiErrorDetail } from '../types/api.types';

export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // 1. Handled Operational Application Errors
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.errorCode, err.details);
    return;
  }

  // 2. Direct Zod Validation Error (if not pre-wrapped)
  if (err instanceof ZodError) {
    const details: ApiErrorDetail[] = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    sendError(res, 'Request validation failed', 400, 'VALIDATION_ERROR', details);
    return;
  }

  // 3. Mongoose Cast Error (e.g. invalid ObjectId format)
  if (err.name === 'CastError' && 'path' in err) {
    const castErr = err as any;
    sendError(
      res,
      `Invalid resource identifier for ${castErr.path}`,
      400,
      'INVALID_IDENTIFIER',
      [{ field: castErr.path, message: `Invalid identifier value '${castErr.value}'` }]
    );
    return;
  }

  // 4. Mongoose Validation Error
  if (err.name === 'ValidationError' && 'errors' in err) {
    const mongooseErr = err as any;
    const details: ApiErrorDetail[] = Object.keys(mongooseErr.errors).map((key) => ({
      field: key,
      message: mongooseErr.errors[key].message,
    }));
    sendError(res, 'Database validation failed', 400, 'DATABASE_VALIDATION_ERROR', details);
    return;
  }

  // 5. MongoDB Duplicate Key Error (code 11000)
  if ('code' in err && (err as any).code === 11000) {
    const dupErr = err as any;
    const fields = Object.keys(dupErr.keyPattern || {});
    const fieldName = fields[0] || 'field';
    sendError(
      res,
      `A record with this ${fieldName} already exists`,
      409,
      'DUPLICATE_KEY_ERROR',
      [{ field: fieldName, message: `${fieldName} must be unique` }]
    );
    return;
  }

  // 6. JSON Parse / Syntax Error
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400 && 'body' in err) {
    sendError(res, 'Malformed JSON payload in request body', 400, 'MALFORMED_JSON');
    return;
  }

  // 7. Unknown / Uncaught Internal Server Error
  console.error('💥 Unhandled Exception:', err);
  const message = env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Internal server error';

  sendError(
    res,
    message,
    500,
    'INTERNAL_SERVER_ERROR'
  );
};
