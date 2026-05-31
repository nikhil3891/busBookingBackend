import { z } from 'zod';

const passengerSchema = z.object({
  name: z.string().min(2).max(100),
  age: z.number().int().min(1).max(120),
  gender: z.enum(['male', 'female', 'other']),
  seatNo: z.string().min(1),
  idType: z.enum(['aadhar', 'pan', 'passport', 'driving_license']).optional(),
  idNumber: z.string().optional(),
});

export const createBookingSchema = z.object({
  busId: z.string().min(1, 'busId is required'),
  travelDate: z.string().datetime(),
  from: z.string().min(1),
  to: z.string().min(1),
  passengers: z.array(passengerSchema).min(1).max(10),
});

export const cancelBookingSchema = z.object({
  reason: z.string().min(3).max(500).optional(),
});

export const listBookingSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'refunded', 'expired']).optional(),
  upcoming: z.enum(['true', 'false']).optional(),
});
