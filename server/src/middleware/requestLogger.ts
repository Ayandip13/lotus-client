import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const color = statusCode >= 500 ? '31' : statusCode >= 400 ? '33' : statusCode >= 300 ? '36' : '32';
    console.log(`[HTTP] \x1b[${color}m${statusCode}\x1b[0m ${method} ${originalUrl} - ${duration}ms`);
  });

  next();
};
