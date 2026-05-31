import 'dotenv/config';
import http from 'http';
import app from './app';
import { env } from './core/config/env.config';
import { connectDB } from './core/config/db.config';
import { connectRedis } from './core/redis/redis.client';
import { initSocketGateway } from './socket/socket.gateway';
import { startScheduler } from './jobs/scheduler';
import { startEmailWorker } from './jobs/workers/email.worker';
import { startSmsWorker } from './jobs/workers/sms.worker';
import { startInvoiceWorker } from './jobs/workers/invoice.worker';
import { startAnalyticsWorker } from './jobs/workers/analytics.worker';
import { logger } from './core/logger/logger';

async function bootstrap(): Promise<void> {
  // 1. Connect database and cache before serving traffic
  await connectDB();
  await connectRedis();

  // 2. Create HTTP server and attach Socket.IO
  const server = http.createServer(app);
  initSocketGateway(server);

  // 3. Start background job workers
  startEmailWorker();
  startSmsWorker();
  startInvoiceWorker();
  startAnalyticsWorker();

  // 4. Start cron scheduler
  startScheduler();

  // 5. Listen
  server.listen(env.node.port, () => {
    logger.info(`Server running on port ${env.node.port} [${env.node.env}]`);
    logger.info(`Bull Board: http://localhost:${env.node.port}${env.bullBoard.path}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`[${signal}] Shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason });
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { err });
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to bootstrap server:', err);
  process.exit(1);
});
