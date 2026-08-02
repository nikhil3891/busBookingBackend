import { z } from 'zod';

export const createPlanSchema = z.object({
  name: z.string().min(2).max(100),
  price: z.number().min(0),
  currency: z.string().default('INR'),
  cycle: z.enum(['monthly', 'quarterly', 'half_yearly', 'annual']),
  maxBuses: z.number().int().min(1),
  maxOperators: z.number().int().min(1),
  features: z
    .object({
      analyticsEnabled: z.boolean().default(true),
      whatsappEnabled: z.boolean().default(false),
      geoTrackingEnabled: z.boolean().default(false),
    })
    .default({ analyticsEnabled: true, whatsappEnabled: false, geoTrackingEnabled: false }),
});

export const updatePlanSchema = createPlanSchema.partial().extend({
  isActive: z.boolean().optional(),
});
