import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import { RequestHandler } from 'express';
import { env } from '../config/env';

export const securityHeaders: RequestHandler = helmet({
  contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
});

const configuredOrigins = env.CLIENT_URL.split(',').map((u) => u.trim().replace(/\/$/, ''));

const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];

const allowedOrigins = Array.from(new Set([...configuredOrigins, ...defaultOrigins]));

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    const cleanOrigin = origin.replace(/\/$/, '');
    const isExplicitlyAllowed = allowedOrigins.some((allowed) => allowed === cleanOrigin);

    if (
      isExplicitlyAllowed ||
      env.NODE_ENV !== 'production' ||
      cleanOrigin.startsWith('http://localhost:') ||
      cleanOrigin.startsWith('http://127.0.0.1:') ||
      cleanOrigin.endsWith('.vercel.app')
    ) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Idempotency-Key',
    'idempotency-key',
    'X-Idempotency-Key',
    'x-idempotency-key',
  ],
  maxAge: 86400, // 24 hours
};

export const corsMiddleware: RequestHandler = cors(corsOptions);
