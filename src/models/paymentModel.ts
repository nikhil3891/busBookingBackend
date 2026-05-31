// src/models/payment.model.ts
import { Schema, model, Types } from 'mongoose';

const paymentSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  bookingId: { type: Types.ObjectId, ref: 'Booking' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  method: { type: String, enum: ['upi','card','wallet','other'], default: 'upi' },
  provider: { type: String },
  providerReference: { type: String }, // provider txn id
  status: { type: String, enum: ['initiated','success','failed','refunded'], default: 'initiated' },
  metadata: { type: Schema.Types.Mixed }
}, { timestamps: true });

export default model('Payment', paymentSchema);
