// src/models/booking.model.ts
import { Schema, model, Document } from 'mongoose';

export interface IBooking extends Document {
  userId: Schema.Types.ObjectId;
  busId: Schema.Types.ObjectId;
  seats: string[];
  passengerDetails?: { name: string; age?: number; gender?: string }[];
  amount: number;
  bookingTime: Date;
  travelDate: Date;
  ticketStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentProvider?: string;
  paymentRef?: string;
  operatorSnapshot?: any;
}

const bookingSchema = new Schema<IBooking>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  busId: { type: Schema.Types.ObjectId, ref: 'Bus', required: true },
  seats: [{ type: String, required: true }],
  passengerDetails: [{ name: String, age: Number, gender: String }],
  amount: { type: Number, required: true },
  bookingTime: { type: Date, default: Date.now },
  travelDate: { type: Date, required: true },
  ticketStatus: { type: String, enum: ['pending','confirmed','cancelled','completed'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending','paid','failed','refunded'], default: 'pending' },
  paymentProvider: { type: String },
  paymentRef: { type: String },
  operatorSnapshot: { type: Schema.Types.Mixed }
}, { timestamps: true });

bookingSchema.index({ userId: 1, travelDate: 1 });

export default model<IBooking>('Booking', bookingSchema);
