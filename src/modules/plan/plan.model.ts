import { Schema, model, Document } from 'mongoose';

export type PlanCycle = 'monthly' | 'quarterly' | 'half_yearly' | 'annual';

export interface IPlan extends Document {
  name: string;
  price: number;
  currency: string;
  cycle: PlanCycle;
  maxBuses: number;
  maxOperators: number;
  features: {
    analyticsEnabled: boolean;
    whatsappEnabled: boolean;
    geoTrackingEnabled: boolean; // the paid geo-map add-on
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const planSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    cycle: {
      type: String,
      enum: ['monthly', 'quarterly', 'half_yearly', 'annual'],
      required: true,
    },
    maxBuses: { type: Number, required: true, default: 20 },
    maxOperators: { type: Number, required: true, default: 5 },
    features: {
      analyticsEnabled: { type: Boolean, default: true },
      whatsappEnabled: { type: Boolean, default: false },
      geoTrackingEnabled: { type: Boolean, default: false },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

planSchema.index({ isActive: 1, cycle: 1 });

export const Plan = model<IPlan>('Plan', planSchema);
