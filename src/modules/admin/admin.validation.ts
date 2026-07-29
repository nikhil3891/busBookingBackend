import { z } from 'zod';

export const updateDriverVerificationStatusSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  status: z.enum(['pending', 'approved', 'rejected']),
});
