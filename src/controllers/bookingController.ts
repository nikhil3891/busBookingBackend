// src/controllers/bookingController.ts
import { Request, Response, NextFunction } from 'express';
import Booking from '../models/bookingModel';
import Bus from '../models/busModel';
import Payment from '../models/paymentModel';
import { ok, error } from '../utility/response.helper';
import * as bookingService from '../services/bookingService';

// create booking: user chooses busId, from, to, passengers[]
export async function createBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as any;
    if (!user) return error(res, 'Unauthorized', 401);

    const { busId, from, to, passengers } = req.body;
    const bus = await Bus.findById(busId);
    if (!bus) return error(res, 'Bus not found', 404);

    // calculate fare
    const farePerPassenger = bookingService.calculateFare(bus, from, to);
    const totalFare = farePerPassenger * passengers.length;

    // allocate seats (simple)
    const seats = await bookingService.allocateSeats(busId, passengers.length);

    // populate passenger seatNos
    const passengersWithSeats = passengers.map((p: any, i: number) => ({ ...p, seatNo: seats[i] }));

    // create booking
    const booking = await Booking.create({
      userId: user._id,
      busId,
      travelDate: bus.departAt,
      from, to,
      passengers: passengersWithSeats,
      totalFare,
      status: 'pending'
    });

    // Create payment entry (initiated)
    const payment = await Payment.create({
      userId: user._id,
      bookingId: booking._id,
      amount: totalFare,
      method: 'upi',
      status: 'initiated'
    });

    // booking.paymentId = payment._id;
    await booking.save();

    return ok(res, { booking, payment });
  } catch (err) { next(err); }
}

// get user bookings - upcoming or history
export async function getUserBookings(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as any;
    if (!user) return error(res, 'Unauthorized', 401);

    const { upcoming } = req.query;
    const q: any = { userId: user._id };
    if (upcoming === 'true') {
      q.travelDate = { $gte: new Date() };
    }
    const bookings = await Booking.find(q).sort({ travelDate: -1 });
    return ok(res, bookings);
  } catch (err) { next(err); }
}

// get booking details
export async function getBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as any;
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return error(res, 'Booking not found', 404);
    // either owner or admin/operator can fetch
    if (booking.userId.toString() !== (user && user._id?.toString()) && user.role !== 'admin') {
      return error(res, 'Forbidden', 403);
    }
    return ok(res, booking);
  } catch (err) { next(err); }
}
// cancel booking
export async function cancelBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as any;
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return error(res, 'Booking not found', 404);
    // only owner can cancel
    if (booking.userId.toString() !== (user && user._id?.toString())) {
      return error(res, 'Forbidden', 403);
    }
    if (booking.status === 'cancelled') {
      return error(res, 'Booking already cancelled', 400);
    }
    booking.status = 'cancelled';
    await booking.save();
    return ok(res, { message: 'Booking cancelled' });
  } catch (err) { next(err); }
}