import { Queue } from 'bullmq';
import { getBullMQConnection } from '../../core/redis/bull-connection';

export interface AnalyticsJobData {
  type: 'daily_analytics' | 'reconciliation' | 'report';
  tenantId?: string;
  date?: string;
  reportType?: string;
}

export type AnalyticsJobName = AnalyticsJobData['type'];

export const analyticsQueue = (process.env.NODE_ENV === 'test'
  ? ({ add: async () => undefined } as unknown as Queue<AnalyticsJobData, void, AnalyticsJobName>)
  : new Queue<AnalyticsJobData, void, AnalyticsJobName>('analytics', {
      connection: getBullMQConnection(),
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'fixed', delay: 10000 },
        removeOnComplete: 20,
        removeOnFail: 50,
      },
    }));
