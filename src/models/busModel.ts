// src/models/bus.model.ts
import { Schema, model, Document } from 'mongoose';

export interface ISeat {
  seatNo: string;
  isBooked: boolean;
  fare?: number;
  passengerName?: string;
}

export interface IRoute {
  from: string;
  to: string;
  via?: string[];
}

export interface IBus extends Document {
  operatorId: Schema.Types.ObjectId;
  busNo: string;
  name?: string;
  route: IRoute;
  departAt: Date;
  arriveAt: Date;
  totalSeats: number;
  seats: ISeat[];
  fare: number;
  amenities?: string[];
  status: 'active' | 'inactive' | 'maintenance';
}

const seatSchema = new Schema<ISeat>({
  seatNo: { type: String, required: true },
  isBooked: { type: Boolean, default: false },
  fare: { type: Number },
  passengerName: { type: String }
}, { _id: false });

const routeSchema = new Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  via: [{ type: String }]
}, { _id: false });

const busSchema = new Schema<IBus>({
  operatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  busNo: { type: String, required: true, unique: true },
  name: { type: String },
  route: { type: routeSchema, required: true },
  departAt: { type: Date, required: true },
  arriveAt: { type: Date, required: true },
  totalSeats: { type: Number, required: true },
  seats: [seatSchema],
  fare: { type: Number, required: true },
  amenities: [{ type: String }],
  status: { type: String, enum: ['active', 'inactive', 'maintenance'], default: 'active' }
}, { timestamps: true });

busSchema.index({ 'route.from': 1, 'route.to': 1, departAt: 1 });

export default model<IBus>('Bus', busSchema);
