import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/apiResponse';
import { getDatabaseStatus } from '../../config/database';
import { env } from '../../config/env';

export const getHealth = (_req: Request, res: Response): Response => {
  const dbStatus = getDatabaseStatus();

  const healthData = {
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: '1.0.0',
    database: {
      status: dbStatus.stateText,
      connected: dbStatus.isConnected,
    },
  };

  return sendSuccess(res, healthData, 'Lotus Caterer API service is operational');
};
