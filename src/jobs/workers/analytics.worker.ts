import { Worker } from 'bullmq';
import { getBullMQConnection } from '../../core/redis/bull-connection';
import { logger } from '../../core/logger/logger';
import { Booking } from '../../modules/booking/booking.model';
import { Payment } from '../../modules/payment/payment.model';
import { cacheSet } from '../../core/redis/redis.service';
import { AnalyticsJobData } from '../queues/analytics.queue';

async function computeDailyAnalytics(tenantId?: string, date?: string): Promise<void> {
  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

  const matchFilter: Record<string, unknown> = {
    createdAt: { $gte: startOfDay, $lte: endOfDay },
    ...(tenantId ? { tenantId } : {}),
  };

  const [bookingStats, paymentStats] = await Promise.all([
    Booking.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalFare: { $sum: '$totalFare' },
        },
      },
    ]),
    Payment.aggregate([
      { $match: { ...matchFilter, status: 'success' } },
      {
        $group: {
          _id: '$method',
          count: { $sum: 1 },
          total: { $sum: '$amount' },
        },
      },
    ]),
  ]);

  const analytics = {
    date: startOfDay.toISOString().split('T')[0],
    tenantId,
    bookings: bookingStats,
    payments: paymentStats,
    generatedAt: new Date(),
  };

  const cacheKey = `analytics:daily:${tenantId ?? 'global'}:${analytics.date}`;
  await cacheSet(cacheKey, analytics, 86400 * 7);

  logger.info(`[AnalyticsWorker] Daily analytics computed for ${analytics.date}`);
}

export function startAnalyticsWorker(): Worker<AnalyticsJobData> {
  const worker = new Worker<AnalyticsJobData>(
    'analytics',
    async (job) => {
      const { type, tenantId, date } = job.data;
      switch (type) {
        case 'daily_analytics':
          await computeDailyAnalytics(tenantId, date);
          break;
        default:
          logger.warn(`[AnalyticsWorker] Unknown job type: ${type}`);
      }
    },
    { connection: getBullMQConnection(), concurrency: 1 },
  );

  worker.on('failed', (job, err) => {
    logger.error(`[AnalyticsWorker] Job ${job?.id} failed`, { err });
  });

  return worker;
}
