import { Schema, model, Document, Types } from 'mongoose';

export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  CANCELLED = 'cancelled',
}

export interface ITenant extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  status: TenantStatus;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  ownerId: Types.ObjectId;
  settings: {
    allowedOrigins: string[];
    maxOperators: number;
    maxBuses: number;
    features: {
      smsEnabled: boolean;
      whatsappEnabled: boolean;
      analyticsEnabled: boolean;
      pdfInvoiceEnabled: boolean;
    };
  };
  contact: {
    email: string;
    phone?: string;
    address?: string;
  };
  branding: {
    logoUrl?: string;
    primaryColor?: string;
    appName?: string;
  };
  trialEndsAt?: Date;
  suspendedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const tenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: {
      type: String,
      enum: Object.values(TenantStatus),
      default: TenantStatus.TRIAL,
    },
    plan: {
      type: String,
      enum: ['free', 'starter', 'pro', 'enterprise'],
      default: 'free',
    },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    settings: {
      allowedOrigins: { type: [String], default: ['*'] },
      maxOperators: { type: Number, default: 5 },
      maxBuses: { type: Number, default: 20 },
      features: {
        smsEnabled: { type: Boolean, default: false },
        whatsappEnabled: { type: Boolean, default: false },
        analyticsEnabled: { type: Boolean, default: true },
        pdfInvoiceEnabled: { type: Boolean, default: true },
      },
    },
    contact: {
      email: { type: String, required: true },
      phone: String,
      address: String,
    },
    branding: {
      logoUrl: String,
      primaryColor: { type: String, default: '#3B82F6' },
      appName: String,
    },
    trialEndsAt: Date,
    suspendedAt: Date,
  },
  { timestamps: true },
);

tenantSchema.index({ slug: 1 }, { unique: true });
tenantSchema.index({ ownerId: 1 });
tenantSchema.index({ status: 1 });

export const Tenant = model<ITenant>('Tenant', tenantSchema);
