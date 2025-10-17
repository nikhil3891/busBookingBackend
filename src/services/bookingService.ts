// src/services/booking.service.ts
import Bus from '../models/busModel';
import Booking from '../models/bookingModel';
import mongoose from 'mongoose';

/**
 * Reserve seats atomically using MongoDB transactions (Atlas supports transactions).
 */
export async function createBookingAndReserveSeats(busId: string, seatNumbers: string[], userId: string, amount: number, travelDate: string) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const bus = await Bus.findById(busId).session(session);
    if (!bus) throw new Error('Bus not found');

    const unavailable = seatNumbers.filter(sn => {
      const s = bus.seats.find(x => x.seatNo === sn);
      return !s || s.isBooked;
    });
    if (unavailable.length) throw new Error(`Seats already booked: ${unavailable.join(',')}`);

    // mark seats booked
    bus.seats.forEach(s => {
      if (seatNumbers.includes(s.seatNo)) s.isBooked = true;
    });
    await bus.save({ session });

    const booking = (await Booking.create([{
      userId,
      busId,
      seats: seatNumbers,
      amount,
      travelDate: new Date(travelDate),
      ticketStatus: 'pending',
      paymentStatus: 'pending'
    }], { session }))[0];

    await session.commitTransaction();
    session.endSession();
    return booking;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}
