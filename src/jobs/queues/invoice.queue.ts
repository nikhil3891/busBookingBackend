import { Queue } from 'bullmq';
import { getBullMQConnection } from '../../core/redis/bull-connection';

export interface InvoiceJobData {
  paymentId: string;
  bookingId: string;
  userId: string;
}

export type InvoiceJobName = 'generate-invoice';

export const invoiceQueue = new Queue<InvoiceJobData, void, InvoiceJobName>('invoice', {
  connection: getBullMQConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 50,
    removeOnFail: 100,
  },
});
