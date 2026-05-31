import { Schema, model, Document, Types } from 'mongoose';

export type SeatStatus = 'available' | 'booked' | 'locked' | 'disabled';

export interface ISeat {
  seatNo: string;
  status: SeatStatus;
  fare: number;
  bookedByUserId?: Types.ObjectId;
}

export interface IStop {
  name: string;
  code: string;
  order: number;
  arrivalTime?: Date;
  departureTime?: Date;
  fareFromOrigin: number;
}

export interface IBus extends Document {
  _id: Types.ObjectId;
  busNo: string;
  operatorId: Types.ObjectId;
  tenantId?: Types.ObjectId;
  vehicleType: 'seater' | 'sleeper' | 'ac_seater' | 'ac_sleeper' | 'luxury';
  route: {
    from: string;
    to: string;
    stops: IStop[];
  };
  departAt: Date;
  arriveAt: Date;
  totalSeats: number;
  seats: ISeat[];
  baseFare: number;
  amenities: string[];
  status: 'active' | 'cancelled' | 'delayed' | 'completed' | 'boarding';
  meta?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const seatSchema = new Schema<ISeat>(
  {
    seatNo: { type: String, required: true },
    status: {
      type: String,
      enum: ['available', 'booked', 'locked', 'disabled'],
      default: 'available',
    },
    fare: { type: Number, required: true },
    bookedByUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false },
);

const stopSchema = new Schema<IStop>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true },
    order: { type: Number, required: true },
    arrivalTime: Date,
    departureTime: Date,
    fareFromOrigin: { type: Number, default: 0 },
  },
  { _id: false },
);

const busSchema = new Schema<IBus>(
  {
    busNo: { type: String, required: true, trim: true },
    operatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant' },
    vehicleType: {
      type: String,
      enum: ['seater', 'sleeper', 'ac_seater', 'ac_sleeper', 'luxury'],
      required: true,
    },
    route: {
      from: { type: String, required: true },
      to: { type: String, required: true },
      stops: { type: [stopSchema], default: [] },
    },
    departAt: { type: Date, required: true },
    arriveAt: { type: Date, required: true },
    totalSeats: { type: Number, required: true },
    seats: { type: [seatSchema], default: [] },
    baseFare: { type: Number, required: true },
    amenities: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'delayed', 'completed', 'boarding'],
      default: 'active',
    },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

busSchema.index({ 'route.from': 1, 'route.to': 1, departAt: 1 });
busSchema.index({ operatorId: 1 });
busSchema.index({ tenantId: 1 });
busSchema.index({ status: 1 });

export const Bus = model<IBus>('Bus', busSchema);
