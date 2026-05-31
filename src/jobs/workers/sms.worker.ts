import { Worker, Job } from 'bullmq';
import { getBullMQConnection } from '../../core/redis/bull-connection';
import { env } from '../../core/config/env.config';
import { logger } from '../../core/logger/logger';
import { SmsJobData } from '../queues/sms.queue';

async function sendSms(phone: string, message: string): Promise<void> {
  if (!env.sms.apiKey) {
    logger.debug(`[SmsWorker][DEV] SMS to ${phone}: ${message}`);
    return;
  }
  // Integrate with SMS provider (Twilio, MSG91, etc.) here
  logger.info(`[SmsWorker] SMS sent to ${phone}`);
}

export function startSmsWorker(): Worker<SmsJobData> {
  const worker = new Worker<SmsJobData>(
    'sms',
    async (job) => {
      const { data } = job;
      let message = data.message ?? '';

      if (!message) {
        switch (data.type) {
          case 'otp':
            message = `Your OTP is ${data.templateData?.['otp'] ?? ''}. Valid for 5 minutes.`;
            break;
          case 'booking_confirmed':
            message = `Your booking is confirmed! PNR: ${data.templateData?.['pnr'] ?? ''}`;
            break;
          default:
            message = 'Notification from BusBooking App';
        }
      }

      await sendSms(data.phone, message);
    },
    { connection: getBullMQConnection(), concurrency: 10 },
  );

  worker.on('failed', (job, err) => {
    logger.error(`[SmsWorker] Job ${job?.id} failed`, { err });
  });

  return worker;
}
