import { Worker, Job } from 'bullmq';
import nodemailer from 'nodemailer';
import { getBullMQConnection } from '../../core/redis/bull-connection';
import { env } from '../../core/config/env.config';
import { logger } from '../../core/logger/logger';
import { User } from '../../modules/user/user.model';
import { Booking } from '../../modules/booking/booking.model';
import { Payment } from '../../modules/payment/payment.model';
import { EmailJobData } from '../queues/email.queue';

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.port === 465,
  auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
});

async function buildEmailContent(job: Job<EmailJobData>): Promise<{
  to: string;
  subject: string;
  html: string;
} | null> {
  const { data } = job;

  const user = await User.findById(data.userId).select('email fullName phone');
  if (!user?.email) return null;

  switch (data.type) {
    case 'booking_created': {
      return {
        to: user.email,
        subject: `Booking Received - ${data.bookingRef ?? ''}`,
        html: `
          <h2>Booking Received</h2>
          <p>Hi ${user.fullName ?? user.phone},</p>
          <p>Your booking <strong>${data.bookingRef}</strong> has been received.</p>
          <p>Total Fare: <strong>₹${data.amount}</strong></p>
          <p>Please complete the payment to confirm your booking.</p>
        `,
      };
    }
    case 'booking_confirmed': {
      const booking = await Booking.findById(data.bookingId).populate('busId', 'busNo route departAt');
      return {
        to: user.email,
        subject: `Booking Confirmed! PNR: ${booking?.pnrNumber}`,
        html: `
          <h2>🎉 Booking Confirmed!</h2>
          <p>Hi ${user.fullName ?? user.phone},</p>
          <p>Your booking is confirmed. PNR: <strong>${booking?.pnrNumber}</strong></p>
        `,
      };
    }
    case 'payment_success': {
      return {
        to: user.email,
        subject: `Payment Successful - ₹${data.amount}`,
        html: `
          <h2>Payment Successful</h2>
          <p>Hi ${user.fullName ?? user.phone},</p>
          <p>We received your payment of <strong>₹${data.amount}</strong>.</p>
        `,
      };
    }
    default:
      return null;
  }
}

export function startEmailWorker(): Worker<EmailJobData> {
  const worker = new Worker<EmailJobData>(
    'email',
    async (job) => {
      const content = await buildEmailContent(job);
      if (!content) {
        logger.warn(`[EmailWorker] No email content for job ${job.id}, type: ${job.data.type}`);
        return;
      }

      if (!env.smtp.host) {
        logger.debug(`[EmailWorker][DEV] Would send email to ${content.to}: ${content.subject}`);
        return;
      }

      await transporter.sendMail({
        from: env.smtp.from,
        ...content,
      });

      logger.info(`[EmailWorker] Email sent to ${content.to} [${job.data.type}]`);
    },
    {
      connection: getBullMQConnection(),
      concurrency: 5,
    },
  );

  worker.on('failed', (job, err) => {
    logger.error(`[EmailWorker] Job ${job?.id} failed`, { err });
  });

  return worker;
}
