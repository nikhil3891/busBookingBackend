import { z } from 'zod';

const stopSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  order: z.number().int().min(0),
  arrivalTime: z.string().datetime().optional(),
  departureTime: z.string().datetime().optional(),
  fareFromOrigin: z.number().min(0).default(0),
});

const seatSchema = z.object({
  seatNo: z.string().min(1),
  status: z.enum(['available', 'booked', 'locked', 'disabled']).default('available'),
  fare: z.number().min(0),
});

export const createBusSchema = z.object({
  busNo: z.string().min(1).max(20),
  vehicleType: z.enum(['seater', 'sleeper', 'ac_seater', 'ac_sleeper', 'luxury']),
  route: z.object({
    from: z.string().min(1),
    to: z.string().min(1),
    stops: z.array(stopSchema).default([]),
  }),
  departAt: z.string().datetime(),
  arriveAt: z.string().datetime(),
  totalSeats: z.number().int().min(1).max(60),
  seats: z.array(seatSchema).optional(),
  baseFare: z.number().min(0),
  amenities: z.array(z.string()).default([]),
});

export const updateBusSchema = createBusSchema.partial().extend({
  status: z.enum(['active', 'cancelled', 'delayed', 'completed', 'boarding']).optional(),
});

export const searchBusSchema = z.object({
  from: z.string().min(1, 'from is required'),
  to: z.string().min(1, 'to is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  vehicleType: z.enum(['seater', 'sleeper', 'ac_seater', 'ac_sleeper', 'luxury']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
