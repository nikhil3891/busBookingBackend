import { z } from 'zod';

export const createDriverSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  licenseNumber: z.string().min(4).max(30),
  licenseExpiry: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export const updateDriverSchema = createDriverSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const listDriversSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  verificationStatus: z
    .enum(['pending', 'assigned', 'in_review', 'active', 'rejected', 'suspended', 'inactive'])
    .optional(),
  assignedToMe: z.enum(['true', 'false']).optional(),
});
