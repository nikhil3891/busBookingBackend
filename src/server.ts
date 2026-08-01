import 'dotenv/config';
import http from 'http';
import app from './app';
import { env } from './core/config/env.config';
import { connectDB } from './core/config/db.config';
import { connectRedis, disconnectRedis } from './core/redis/redis.client';
import { disconnectDB } from './core/config/db.config';
import { initSocketGateway } from './socket/socket.gateway';
import { startScheduler } from './jobs/scheduler';
import { startEmailWorker } from './jobs/workers/email.worker';
import { startSmsWorker } from './jobs/workers/sms.worker';
import { startInvoiceWorker } from './jobs/workers/invoice.worker';
import { startAnalyticsWorker } from './jobs/workers/analytics.worker';
import { logger } from './core/logger/logger';

async function bootstrap(): Promise<void> {
  await connectDB();
  await connectRedis();

  const server = http.createServer(app);
  initSocketGateway(server);

  startEmailWorker();
  startSmsWorker();
  startInvoiceWorker();
  startAnalyticsWorker();
  startScheduler();

  await new Promise<void>((resolve, reject) => {
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        reject(
          new Error(
            `Port ${env.node.port} is already in use.\n` +
              `  Fix: stop the other process, then restart:\n` +
              `    pnpm free-port\n` +
              `    pnpm dev\n` +
              `  Or change PORT in your .env file.`,
          ),
        );
        return;
      }
      reject(err);
    });

    server.listen(env.node.port, () => {
      logger.info(`Server running on port ${env.node.port} [${env.node.env}]`);
      logger.info(`API:        http://localhost:${env.node.port}/api/health`);
      logger.info(`Swagger:    http://localhost:${env.node.port}/api/docs`);
      logger.info(`Bull Board: http://localhost:${env.node.port}${env.bullBoard.path}`);
      resolve();
    });
  });

  const shutdown = async (signal: string) => {
    logger.info(`[${signal}] Shutting down gracefully...`);
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    try {
      await disconnectRedis();
      await disconnectDB();
    } catch (err) {
      logger.warn('Error during disconnect', { err });
    }
    logger.info('HTTP server closed');
    process.exit(0);
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
  console.error('Failed to bootstrap server:', err instanceof Error ? err.message : err);
  process.exit(1);
});
