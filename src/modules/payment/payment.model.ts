import { Schema, model, Document, Types } from 'mongoose';

export type PaymentStatus = 'initiated' | 'processing' | 'success' | 'failed' | 'refunded' | 'partially_refunded';
export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | 'cash' | 'other';
export type PaymentProvider = 'razorpay' | 'stripe' | 'payu' | 'manual' | 'other';

export interface IRefundEntry {
  amount: number;
  reason: string;
  refundedAt: Date;
  refundRef?: string;
}

export interface IPayment extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  bookingId: Types.ObjectId;
  tenantId?: Types.ObjectId;
  amount: number;
  currency: string;
  method: PaymentMethod;
  provider: PaymentProvider;
  providerReference?: string;
  gatewayOrderId?: string;
  status: PaymentStatus;
  refunds: IRefundEntry[];
  totalRefunded: number;
  metadata?: Record<string, unknown>;
  failureReason?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const refundSchema = new Schema<IRefundEntry>(
  {
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    refundedAt: { type: Date, default: Date.now },
    refundRef: String,
  },
  { _id: false },
);

const paymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    method: {
      type: String,
      enum: ['upi', 'card', 'netbanking', 'wallet', 'cash', 'other'],
      required: true,
    },
    provider: {
      type: String,
      enum: ['razorpay', 'stripe', 'payu', 'manual', 'other'],
      default: 'manual',
    },
    providerReference: String,
    gatewayOrderId: String,
    status: {
      type: String,
      enum: ['initiated', 'processing', 'success', 'failed', 'refunded', 'partially_refunded'],
      default: 'initiated',
    },
    refunds: { type: [refundSchema], default: [] },
    totalRefunded: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed },
    failureReason: String,
    paidAt: Date,
  },
  { timestamps: true },
);

paymentSchema.index({ userId: 1 });
paymentSchema.index({ bookingId: 1 }, { unique: true });
paymentSchema.index({ tenantId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ providerReference: 1 }, { sparse: true });

export const Payment = model<IPayment>('Payment', paymentSchema);
