import http from 'http';
import { app } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';

const startServer = async () => {
  // Initialize Database Connection
  await connectDatabase();

  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Lotus Caterer Backend API Server is running`);
    console.log(`📡 Environment: ${env.NODE_ENV}`);
    console.log(`🌐 Port:        ${env.PORT}`);
    console.log(`🩺 Health URL:  http://localhost:${env.PORT}/api/health`);
    console.log(`====================================================`);
  });

  // Graceful Shutdown Handlers
  const gracefulShutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Initiating graceful shutdown...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      await disconnectDatabase();
      console.log('Graceful shutdown completed. Exiting process.');
      process.exit(0);
    });

    // Fallback: Force shutdown after 10 seconds if hanging
    setTimeout(() => {
      console.error('Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
