import { Worker } from 'bullmq';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { getBullMQConnection } from '../../core/redis/bull-connection';
import { logger } from '../../core/logger/logger';
import { Booking } from '../../modules/booking/booking.model';
import { Payment } from '../../modules/payment/payment.model';
import { User } from '../../modules/user/user.model';
import { InvoiceJobData } from '../queues/invoice.queue';

const INVOICE_DIR = path.join(process.cwd(), 'uploads', 'invoices');

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function startInvoiceWorker(): Worker<InvoiceJobData> {
  const worker = new Worker<InvoiceJobData>(
    'invoice',
    async (job) => {
      const { paymentId, bookingId, userId } = job.data;

      const [booking, payment, user] = await Promise.all([
        Booking.findById(bookingId).populate('busId', 'busNo vehicleType route departAt arriveAt'),
        Payment.findById(paymentId),
        User.findById(userId).select('fullName phone email'),
      ]);

      if (!booking || !payment || !user) {
        logger.warn(`[InvoiceWorker] Missing data for job ${job.id}`);
        return;
      }

      ensureDir(INVOICE_DIR);
      const filePath = path.join(INVOICE_DIR, `invoice-${booking.bookingRef}.pdf`);

      await new Promise<void>((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        doc.fontSize(20).text('BusBooking - Invoice', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Booking Ref: ${booking.bookingRef}`);
        doc.text(`PNR: ${booking.pnrNumber}`);
        doc.text(`Passenger: ${user.fullName ?? user.phone}`);
        doc.text(`From: ${booking.from} → To: ${booking.to}`);
        doc.text(`Travel Date: ${booking.travelDate.toLocaleDateString()}`);
        doc.moveDown();
        doc.text('Passengers:');
        booking.passengers.forEach((p, i) => {
          doc.text(`  ${i + 1}. ${p.name} (${p.gender}, ${p.age}yr) - Seat ${p.seatNo}`);
        });
        doc.moveDown();
        doc.text(`Total Fare: ₹${booking.totalFare}`);
        doc.text(`Payment Method: ${payment.method.toUpperCase()}`);
        doc.text(`Payment Status: ${payment.status}`);
        doc.text(`Paid At: ${payment.paidAt?.toLocaleString() ?? 'N/A'}`);

        doc.end();
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      // Save ticket URL to booking
      await Booking.findByIdAndUpdate(bookingId, {
        ticketUrl: `/uploads/invoices/invoice-${booking.bookingRef}.pdf`,
      });

      logger.info(`[InvoiceWorker] Invoice generated: ${filePath}`);
    },
    { connection: getBullMQConnection(), concurrency: 2 },
  );

  worker.on('failed', (job, err) => {
    logger.error(`[InvoiceWorker] Job ${job?.id} failed`, { err });
  });

  return worker;
}
