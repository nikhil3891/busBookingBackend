// src/models/bus.model.ts
import { Schema, model, Types } from 'mongoose';

export type SeatStatus = 'available' | 'booked' | 'blocked';

const seatSchema = new Schema({
  seatNo: { type: String, required: true },
  status: { type: String, enum: ['available','booked','blocked'], default: 'available' },
  fare: { type: Number, required: true } // seat specific fare if needed
}, { _id: false });

const routeStopSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String }, // optional short code
  order: { type: Number, required: true }
}, { _id: false });

const busSchema = new Schema({
  busNo: { type: String, required: true }, // bus registration
  operatorId: { type: Types.ObjectId, ref: 'User', required: true }, // who created this run
  vehicleType: { type: String }, // e.g., 'sleeper', 'seater'
  route: {
    from: { type: String, required: true },
    to: { type: String, required: true },
    stops: { type: [routeStopSchema], default: [] } // ordered stops
  },
  departAt: { type: Date, required: true },
  arriveAt: { type: Date, required: true },
  totalSeats: { type: Number, required: true },
  seats: { type: [seatSchema], default: [] }, // seat map for this scheduled run
  baseFare: { type: Number, required: true }, // base fare per route segment (fallback)
  status: { type: String, enum: ['active','cancelled','delayed','completed'], default: 'active' },
  meta: { type: Schema.Types.Mixed } // for additional info (driver name, driverContact etc.)
}, { timestamps: true });

busSchema.index({ 'route.from': 1, 'route.to': 1, departAt: 1 });

export default model('Bus', busSchema);
