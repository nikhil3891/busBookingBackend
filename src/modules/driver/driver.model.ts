import { Schema, model, Document, Types } from 'mongoose';
import { verificationSchema, IVerification, VerificationStatus } from '../verification/verification.types';

export interface IDriver extends Document {
  fullName: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: Date;
  tenantId: Types.ObjectId;
  createdBy: Types.ObjectId; // the operator/admin who added this driver
  isActive: boolean;
  verification: IVerification;
  createdAt: Date;
  updatedAt: Date;
}

const driverSchema = new Schema<IDriver>(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    licenseNumber: { type: String, required: true, trim: true },
    licenseExpiry: { type: Date, required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
    verification: {
      type: verificationSchema,
      default: () => ({ status: VerificationStatus.PENDING, submittedAt: new Date(), documents: [] }),
    },
  },
  { timestamps: true },
);

driverSchema.index({ tenantId: 1 });
driverSchema.index({ phone: 1, tenantId: 1 }, { unique: true });
driverSchema.index({ 'verification.status': 1 });
driverSchema.index({ 'verification.assignedManagerId': 1 });

export const Driver = model<IDriver>('Driver', driverSchema);
