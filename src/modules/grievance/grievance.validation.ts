import { z } from 'zod';

export const createGrievanceSchema = z.object({
  bookingId: z.string().optional(),
  category: z.enum(['refund', 'driver_behavior', 'bus_condition', 'payment_issue', 'other']),
  description: z.string().min(5).max(2000),
});

export const addMessageSchema = z.object({
  message: z.string().min(1).max(2000),
});

export const updateGrievanceStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
});

export const listGrievancesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
});
