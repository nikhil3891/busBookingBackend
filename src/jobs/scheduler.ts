import cron from 'node-cron';
import { analyticsQueue } from './queues/analytics.queue';
import { authRepository } from '../modules/auth/auth.repository';
import { logger } from '../core/logger/logger';

export function startScheduler(): void {
  // Daily analytics at midnight
  cron.schedule('0 0 * * *', async () => {
    logger.info('[Scheduler] Queuing daily analytics');
    await analyticsQueue.add('daily_analytics', {
      type: 'daily_analytics',
      date: new Date().toISOString().split('T')[0],
    });
  });

  // Clean expired refresh tokens daily at 1 AM
  cron.schedule('0 1 * * *', async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const count = await authRepository.cleanExpiredTokens(sevenDaysAgo);
    logger.info(`[Scheduler] Cleaned ${count} expired refresh tokens`);
  });

  logger.info('[Scheduler] Cron jobs started');
}
