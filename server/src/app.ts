import express, { Application, Request, Response, NextFunction } from 'express';
import { securityHeaders, corsMiddleware } from './middleware/security';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { healthRoutes } from './modules/health/health.routes';
import { NotFoundError } from './utils/appError';

export const createApp = (): Application => {
  const app = express();

  // 1. Security & Core Middleware
  app.use(securityHeaders);
  app.use(corsMiddleware);
  app.use(requestLogger);

  // 2. Request Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 3. System Endpoints (Root and /api/health)
  app.use('/health', healthRoutes);
  app.use('/api/health', healthRoutes);

  // 4. API v1 Router Mount Point (Future phases will attach domain routers here)
  const apiV1Router = express.Router();
  apiV1Router.use('/health', healthRoutes);
  app.use('/api/v1', apiV1Router);

  // 5. 404 Catch-All Route Handler
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError(`Resource '${req.method} ${req.originalUrl}' was not found`));
  });

  // 6. Centralized Error Handling Middleware (must be registered last)
  app.use(errorHandler);

  return app;
};

export const app = createApp();
