// src/controllers/booking.controller.ts
import { Request, Response, NextFunction } from 'express';
import { createBookingAndReserveSeats } from '../services/bookingService';
import { ok, error } from '../utility/response.helper';

export async function createBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user._id;
    const { busId, seats, amount, travelDate } = req.body;
    if (!busId || !seats || !amount || !travelDate) return error(res, 'missing fields', 400);
    const booking = await createBookingAndReserveSeats(busId, seats, userId, amount, travelDate);
    return ok(res, booking);
  } catch (err) { next(err); }
}
