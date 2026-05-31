import { z } from 'zod';

export const initiatePaymentSchema = z.object({
  bookingId: z.string().min(1, 'bookingId is required'),
  method: z.enum(['upi', 'card', 'netbanking', 'wallet', 'cash']),
  provider: z.enum(['razorpay', 'stripe', 'payu', 'manual', 'other']).optional(),
  upiId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const verifyPaymentSchema = z.object({
  paymentId: z.string().min(1),
  providerReference: z.string().min(1),
  signature: z.string().optional(),
});

export const refundSchema = z.object({
  amount: z.number().min(1),
  reason: z.string().min(3).max(500),
});
