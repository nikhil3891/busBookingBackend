import { Types } from 'mongoose';
import { Booking, IBooking } from './booking.model';
import { Bus } from '../bus/bus.model';
import { Payment } from '../payment/payment.model';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from '../../core/errors/AppError';
import { lockSeats, unlockSeats } from '../../core/redis/redis.service';
import { eventBus } from '../../core/events/event.bus';
import { DomainEvent } from '../../core/events/event.types';
import { PaginatedResult } from '../../core/types';
import { z } from 'zod';
import { createBookingSchema, listBookingSchema } from './booking.validation';
import { emailQueue } from '../../jobs/queues/email.queue';

type CreateBookingDto = z.infer<typeof createBookingSchema>;
type ListBookingDto = z.infer<typeof listBookingSchema>;

function toObjectId(value?: string | Types.ObjectId | null): Types.ObjectId | undefined {
  if (!value) return undefined;
  if (value instanceof Types.ObjectId) return value;
  if (typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
    return new Types.ObjectId(value);
  }
  return undefined;
}

export class BookingService {
  async createBooking(
    dto: CreateBookingDto,
    userId: string,
    tenantId?: string,
  ): Promise<IBooking> {
    const bus = await Bus.findById(dto.busId);
    if (!bus) throw new NotFoundError('Bus');
    if (bus.status !== 'active') throw new BadRequestError('Bus is not available for booking');

    const bookingUserId = toObjectId(userId);
    const bookingBusId = toObjectId(dto.busId);
    const bookingTenantId = toObjectId(tenantId);

    if (!bookingUserId || !bookingBusId) {
      throw new BadRequestError('Invalid booking identifiers');
    }

    const requestedSeats = dto.passengers.map((p) => p.seatNo);
    const uniqueSeats = [...new Set(requestedSeats)];
    if (uniqueSeats.length !== requestedSeats.length) {
      throw new BadRequestError('Duplicate seat numbers in request');
    }

    // Validate seats exist and are available
    const unavailableSeats: string[] = [];
    let totalFare = 0;

    for (const seatNo of uniqueSeats) {
      const seat = bus.seats.find((s) => s.seatNo === seatNo);
      if (!seat) throw new BadRequestError(`Seat ${seatNo} does not exist`);
      if (seat.status !== 'available') {
        unavailableSeats.push(seatNo);
      }
      totalFare += seat.fare;
    }

    if (unavailableSeats.length > 0) {
      throw new ConflictError(`Seats unavailable: ${unavailableSeats.join(', ')}`);
    }

    // Lock seats in Redis to prevent double-booking during payment
    const locked = await lockSeats(dto.busId, uniqueSeats, userId);
    if (!locked) {
      throw new ConflictError('Seats are being booked by another user. Please try again.');
    }

    let booking: IBooking;

    try {
      // Mark seats as locked in DB
      await Bus.updateOne(
        { _id: dto.busId },
        {
          $set: uniqueSeats.reduce(
            (acc, seatNo) => {
              const idx = bus.seats.findIndex((s) => s.seatNo === seatNo);
              acc[`seats.${idx}.status`] = 'locked';
              acc[`seats.${idx}.bookedByUserId`] = bookingUserId;
              return acc;
            },
            {} as Record<string, unknown>,
          ),
        },
      );

      booking = await Booking.create([
        {
          userId: bookingUserId,
          busId: bookingBusId,
          travelDate: new Date(dto.travelDate),
          from: dto.from,
          to: dto.to,
          passengers: dto.passengers,
          totalFare,
          status: 'pending',
          ...(bookingTenantId ? { tenantId: bookingTenantId } : {}),
        },
      ]).then((docs) => docs[0]!);
    } catch (err) {
      await unlockSeats(dto.busId, uniqueSeats);
      throw err;
    }

    eventBus.emit(DomainEvent.BOOKING_CREATED, {
      bookingId: booking.id,
      userId,
      busId: dto.busId,
      totalFare,
      tenantId,
    });

    // Queue booking confirmation email
    await emailQueue.add('booking_created', {
      type: 'booking_created',
      userId,
      bookingId: booking.id,
      bookingRef: booking.bookingRef,
      amount: totalFare,
    });

    return booking;
  }

  async confirmBooking(bookingId: string, paymentId: string): Promise<IBooking> {
    let booking: IBooking | null;

    try {
      booking = await Booking.findById(bookingId);
      if (!booking) throw new NotFoundError('Booking');
      if (booking.status !== 'pending') {
        throw new BadRequestError(`Cannot confirm booking with status: ${booking.status}`);
      }

      const seatNos = booking.passengers.map((p) => p.seatNo);
      const bus = await Bus.findById(booking.busId);
      if (!bus) throw new NotFoundError('Bus');

      // Mark seats as booked
      await Bus.updateOne(
        { _id: booking.busId },
        {
          $set: seatNos.reduce(
            (acc, seatNo) => {
              const idx = bus.seats.findIndex((s) => s.seatNo === seatNo);
              if (idx !== -1) acc[`seats.${idx}.status`] = 'booked';
              return acc;
            },
            {} as Record<string, unknown>,
          ),
        },
      );

      booking = await Booking.findByIdAndUpdate(
        bookingId,
        { status: 'confirmed', paymentId: new Types.ObjectId(paymentId) },
        { new: true },
      );
    } catch (err) {
      throw err;
    }

    if (!booking) throw new NotFoundError('Booking');

    // Remove Redis seat lock
    await unlockSeats(booking.busId.toString(), booking.passengers.map((p) => p.seatNo));

    eventBus.emit(DomainEvent.BOOKING_CONFIRMED, {
      bookingId,
      userId: booking.userId.toString(),
      paymentId,
    });

    // Queue ticket email
    await emailQueue.add('booking_confirmed', {
      type: 'booking_confirmed',
      bookingId,
      userId: booking.userId.toString(),
    });

    return booking;
  }

  async cancelBooking(
    bookingId: string,
    userId: string,
    reason?: string,
    isAdmin = false,
  ): Promise<IBooking> {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking');

    if (!isAdmin && booking.userId.toString() !== userId) {
      throw new NotFoundError('Booking');
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      throw new BadRequestError(`Cannot cancel booking with status: ${booking.status}`);
    }

    let updated: IBooking | null;

    try {
      const seatNos = booking.passengers.map((p) => p.seatNo);
      await Bus.updateOne(
        { _id: booking.busId },
        { $set: seatNos.reduce((acc, seatNo, i) => {
          const bus = acc;
          return { ...bus, [`seats.${i}.status`]: 'available', [`seats.${i}.bookedByUserId`]: null };
        }, {} as Record<string, unknown>) },
      );

      updated = await Booking.findByIdAndUpdate(
        bookingId,
        {
          status: 'cancelled',
          cancellationReason: reason,
          cancelledAt: new Date(),
          cancelledBy: new Types.ObjectId(userId),
        },
        { new: true },
      );
    } catch (err) {
      throw err;
    }

    if (!updated) throw new NotFoundError('Booking');

    await unlockSeats(booking.busId.toString(), booking.passengers.map((p) => p.seatNo));
    eventBus.emit(DomainEvent.BOOKING_CANCELLED, {
      bookingId,
      userId,
      reason,
    });

    return updated;
  }

  async getBooking(bookingId: string, userId: string, isAdmin = false): Promise<IBooking> {
    const query = isAdmin ? { _id: bookingId } : { _id: bookingId, userId };
    const booking = await Booking.findOne(query)
      .populate('busId', 'busNo vehicleType route departAt arriveAt')
      .populate('paymentId', 'status amount method');
    if (!booking) throw new NotFoundError('Booking');
    return booking;
  }

  async listUserBookings(
    userId: string,
    dto: ListBookingDto,
  ): Promise<PaginatedResult<IBooking>> {
    const filter: Record<string, unknown> = { userId };

    if (dto.status) filter['status'] = dto.status;
    if (dto.upcoming === 'true') {
      filter['travelDate'] = { $gte: new Date() };
      filter['status'] = { $in: ['pending', 'confirmed'] };
    }

    const total = await Booking.countDocuments(filter);
    const data = await Booking.find(filter)
      .populate('busId', 'busNo vehicleType route departAt arriveAt')
      .skip((dto.page - 1) * dto.limit)
      .limit(dto.limit)
      .sort({ bookingAt: -1 });

    return {
      data,
      pagination: {
        total,
        page: dto.page,
        limit: dto.limit,
        totalPages: Math.ceil(total / dto.limit),
        hasNext: dto.page * dto.limit < total,
        hasPrev: dto.page > 1,
      },
    };
  }

  async listAllBookings(
    dto: ListBookingDto,
    tenantId?: string,
  ): Promise<PaginatedResult<IBooking>> {
    const filter: Record<string, unknown> = {};
    if (tenantId) filter['tenantId'] = tenantId;
    if (dto.status) filter['status'] = dto.status;

    const total = await Booking.countDocuments(filter);
    const data = await Booking.find(filter)
      .populate('userId', 'fullName phone email')
      .populate('busId', 'busNo vehicleType route departAt')
      .skip((dto.page - 1) * dto.limit)
      .limit(dto.limit)
      .sort({ bookingAt: -1 });

    return {
      data,
      pagination: {
        total,
        page: dto.page,
        limit: dto.limit,
        totalPages: Math.ceil(total / dto.limit),
        hasNext: dto.page * dto.limit < total,
        hasPrev: dto.page > 1,
      },
    };
  }
}

export const bookingService = new BookingService();
