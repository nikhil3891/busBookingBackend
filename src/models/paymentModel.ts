// src/models/payment.model.ts
import { Schema, model, Document } from 'mongoose';

export interface IPayment extends Document {
  bookingId: Schema.Types.ObjectId;
  amount: number;
  method: string;
  provider: string;
  providerRef?: string;
  status: 'initiated' | 'success' | 'failed' | 'refunded';
  meta?: any;
}

const paymentSchema = new Schema<IPayment>({
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  amount: { type: Number, required: true },
  method: { type: String, required: true },
  provider: { type: String, required: true },
  providerRef: { type: String },
  status: { type: String, enum: ['initiated','success','failed','refunded'], default: 'initiated' },
  meta: { type: Schema.Types.Mixed }
}, { timestamps: true });

export default model<IPayment>('Payment', paymentSchema);
