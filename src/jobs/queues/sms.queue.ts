import { Queue } from 'bullmq';
import { getBullMQConnection } from '../../core/redis/bull-connection';

export interface SmsJobData {
  type: 'otp' | 'booking_confirmed' | 'booking_cancelled' | 'payment_success' | 'custom';
  phone: string;
  message?: string;
  templateId?: string;
  templateData?: Record<string, string>;
}

export type SmsJobName = SmsJobData['type'];

export const smsQueue = new Queue<SmsJobData, void, SmsJobName>('sms', {
  connection: getBullMQConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});
