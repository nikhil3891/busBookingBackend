import { Payment, IPayment } from './payment.model';
import { Booking } from '../booking/booking.model';
import { bookingService } from '../booking/booking.service';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from '../../core/errors/AppError';
import { eventBus } from '../../core/events/event.bus';
import { DomainEvent } from '../../core/events/event.types';
import { Types } from 'mongoose';
import { z } from 'zod';
import { initiatePaymentSchema, verifyPaymentSchema, refundSchema } from './payment.validation';
import { invoiceQueue } from '../../jobs/queues/invoice.queue';
import { emailQueue } from '../../jobs/queues/email.queue';

type InitiatePaymentDto = z.infer<typeof initiatePaymentSchema>;
type VerifyPaymentDto = z.infer<typeof verifyPaymentSchema>;
type RefundDto = z.infer<typeof refundSchema>;

export class PaymentService {
  async initiatePayment(dto: InitiatePaymentDto, userId: string, tenantId?: string): Promise<IPayment> {
    const booking = await Booking.findById(dto.bookingId);
    if (!booking) throw new NotFoundError('Booking');
    if (booking.userId.toString() !== userId) throw new NotFoundError('Booking');
    if (booking.status !== 'pending') {
      throw new BadRequestError(`Booking is already ${booking.status}`);
    }

    const existingPayment = await Payment.findOne({ bookingId: dto.bookingId, status: { $in: ['initiated', 'processing', 'success'] } });
    if (existingPayment) throw new ConflictError('Payment already initiated for this booking');

    const payment = await Payment.create({
      userId: new Types.ObjectId(userId),
      bookingId: new Types.ObjectId(dto.bookingId),
      amount: booking.totalFare,
      method: dto.method,
      provider: dto.provider ?? 'manual',
      metadata: dto.metadata,
      status: 'initiated',
      ...(tenantId ? { tenantId: new Types.ObjectId(tenantId) } : {}),
    });

    eventBus.emit(DomainEvent.PAYMENT_INITIATED, {
      paymentId: payment.id,
      bookingId: dto.bookingId,
      amount: booking.totalFare,
    });

    return payment;
  }

  async verifyPayment(dto: VerifyPaymentDto, userId: string): Promise<IPayment> {
    const payment = await Payment.findById(dto.paymentId);
    if (!payment) throw new NotFoundError('Payment');
    if (payment.userId.toString() !== userId) throw new NotFoundError('Payment');
    if (payment.status === 'success') throw new ConflictError('Payment already verified');

    // In production: verify signature with payment provider
    // For now, simulate success
    const isSuccess = true;

    if (isSuccess) {
      payment.status = 'success';
      payment.providerReference = dto.providerReference;
      payment.paidAt = new Date();
      await payment.save();

      // Confirm booking (sets status=confirmed, marks seats=booked)
      await bookingService.confirmBooking(payment.bookingId.toString(), payment.id);

      eventBus.emit(DomainEvent.PAYMENT_SUCCESS, {
        paymentId: payment.id,
        bookingId: payment.bookingId.toString(),
        amount: payment.amount,
      });

      // Queue invoice PDF generation
      await invoiceQueue.add('generate-invoice' as 'generate-invoice', {
        paymentId: payment.id,
        bookingId: payment.bookingId.toString(),
        userId,
      });

      // Queue payment receipt email
      await emailQueue.add('payment_success', {
        type: 'payment_success',
        userId,
        paymentId: payment.id,
        amount: payment.amount,
      });
    } else {
      payment.status = 'failed';
      payment.failureReason = 'Payment verification failed';
      await payment.save();

      eventBus.emit(DomainEvent.PAYMENT_FAILED, {
        paymentId: payment.id,
        bookingId: payment.bookingId.toString(),
        reason: 'verification_failed',
      });
    }

    return payment;
  }

  async initiateRefund(paymentId: string, dto: RefundDto, requesterId: string): Promise<IPayment> {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new NotFoundError('Payment');
    if (payment.status !== 'success') {
      throw new BadRequestError('Can only refund successful payments');
    }

    const remainingRefundable = payment.amount - payment.totalRefunded;
    if (dto.amount > remainingRefundable) {
      throw new BadRequestError(`Max refundable amount is ${remainingRefundable}`);
    }

    payment.refunds.push({
      amount: dto.amount,
      reason: dto.reason,
      refundedAt: new Date(),
      refundRef: `REF-${Date.now()}`,
    });
    payment.totalRefunded += dto.amount;
    payment.status =
      payment.totalRefunded >= payment.amount ? 'refunded' : 'partially_refunded';

    await payment.save();

    eventBus.emit(DomainEvent.REFUND_INITIATED, {
      paymentId,
      bookingId: payment.bookingId.toString(),
      amount: dto.amount,
    });

    return payment;
  }

  async getPayment(paymentId: string, userId: string, isAdmin = false): Promise<IPayment> {
    const query = isAdmin ? { _id: paymentId } : { _id: paymentId, userId };
    const payment = await Payment.findOne(query).populate('bookingId', 'bookingRef status pnrNumber');
    if (!payment) throw new NotFoundError('Payment');
    return payment;
  }
}

export const paymentService = new PaymentService();
