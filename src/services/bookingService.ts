// src/services/booking.service.ts
import Bus from '../models/busModel';
import Booking from '../models/bookingModel';
import Payment from '../models/paymentModel';
import { Types } from 'mongoose';

// compute fare between two stops:
// simple algorithm: assume route.stops has ordered stops; fare proportional to number of segments * baseFare
export function calculateFare(bus: any, from: string, to: string): number {
  const stops = bus.route.stops || [];
  // if no stops provided, fallback to baseFare
  if (!stops.length) return bus.baseFare;

  // find order index by stop name
  const idxFrom = stops.findIndex((s: any) => s.name === from);
  const idxTo = stops.findIndex((s: any) => s.name === to);
  if (idxFrom === -1 || idxTo === -1 || idxTo <= idxFrom) return bus.baseFare;

  const segments = idxTo - idxFrom;
  return segments * (bus.baseFare || 1);
}

// simple seat allocation: pick first N available seats and mark them booked (atomicity caveat - see notes)
export async function allocateSeats(busId: string, count: number): Promise<string[]> {
  const bus = await Bus.findById(busId);
  if (!bus) throw new Error('Bus not found');
  bus.seats = bus.seats || [];
  const available = bus.seats.filter((s: any) => s.status === 'available');
  if (available.length < count) throw new Error('Not enough seats');

  const chosen = available.slice(0, count);
  chosen.forEach((s: any) => s.status = 'booked');
  await bus.save();
  return chosen.map((s: any) => s.seatNo);
}
// Note: In a real-world app, the above allocation should be done in a transaction or with proper locking
// to avoid race conditions.

// create booking
export async function createBooking(userId: string, busId: string, travelDate: Date, from: string, to: string, passengers: any[]): Promise<any> {
  const bus = await Bus.findById(busId);
  if (!bus) throw new Error('Bus not found');
  const seatNos = await allocateSeats(busId, passengers.length);
  const totalFare = calculateFare(bus, from, to) * passengers.length; // total fare for all passengers

  // assign seat numbers to passengers
  passengers.forEach((p, idx) => p.seatNo = seatNos[idx]);    
  const booking = new Booking({
    userId: new Types.ObjectId(userId),
    busId: new Types.ObjectId(busId),
    travelDate,
    from,
    to,
    passengers,
    totalFare,
    status: 'confirmed' // directly confirmed for simplicity
  });
  await booking.save();
  return booking;
}