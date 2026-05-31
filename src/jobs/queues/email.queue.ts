import { Queue } from 'bullmq';
import { getBullMQConnection } from '../../core/redis/bull-connection';

export interface EmailJobData {
  type:
    | 'booking_created'
    | 'booking_confirmed'
    | 'booking_cancelled'
    | 'payment_success'
    | 'payment_failed'
    | 'otp'
    | 'welcome'
    | 'password_reset';
  userId: string;
  to?: string;
  subject?: string;
  templateData?: Record<string, unknown>;
  bookingId?: string;
  bookingRef?: string;
  paymentId?: string;
  amount?: number;
}

export type EmailJobName = EmailJobData['type'];

export const emailQueue = new Queue<EmailJobData, void, EmailJobName>('email', {
  connection: getBullMQConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});
