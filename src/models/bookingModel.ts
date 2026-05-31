// src/models/booking.model.ts
import { Schema, model, Types } from 'mongoose';

const passengerSchema = new Schema({
  name: { type: String, required: true },
  age: { type: Number },
  gender: { type: String, enum: ['male','female','other'] },
  seatNo: { type: String, required: true }
}, { _id: false });

const bookingSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  busId: { type: Types.ObjectId, ref: 'Bus', required: true },
  bookingAt: { type: Date, default: Date.now },
  travelDate: { type: Date, required: true },
  from: { type: String, required: true }, // boarding stop
  to: { type: String, required: true },   // drop stop
  passengers: { type: [passengerSchema], required: true },
  totalFare: { type: Number, required: true },
  paymentId: { type: Types.ObjectId, ref: 'Payment' },
  status: { type: String, enum: ['pending','confirmed','cancelled','refunded'], default: 'pending' },
  notes: { type: String }
}, { timestamps: true });

bookingSchema.index({ userId: 1, travelDate: -1 });

export default model('Booking', bookingSchema);
