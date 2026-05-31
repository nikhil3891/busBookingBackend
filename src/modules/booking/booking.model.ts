import { Schema, model, Document, Types } from 'mongoose';

export interface IPassenger {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  seatNo: string;
  idType?: 'aadhar' | 'pan' | 'passport' | 'driving_license';
  idNumber?: string;
}

export interface IBooking extends Document {
  _id: Types.ObjectId;
  bookingRef: string;
  userId: Types.ObjectId;
  busId: Types.ObjectId;
  tenantId?: Types.ObjectId;
  bookingAt: Date;
  travelDate: Date;
  from: string;
  to: string;
  passengers: IPassenger[];
  totalFare: number;
  paymentId?: Types.ObjectId;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded' | 'expired';
  cancellationReason?: string;
  cancelledAt?: Date;
  cancelledBy?: Types.ObjectId;
  refundAmount?: number;
  pnrNumber: string;
  ticketUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const passengerSchema = new Schema<IPassenger>(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    seatNo: { type: String, required: true },
    idType: {
      type: String,
      enum: ['aadhar', 'pan', 'passport', 'driving_license'],
    },
    idNumber: String,
  },
  { _id: false },
);

function generatePNR(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

function generateBookingRef(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BB${ts}${rand}`;
}

const bookingSchema = new Schema<IBooking>(
  {
    bookingRef: {
      type: String,
      unique: true,
      default: generateBookingRef,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    busId: { type: Schema.Types.ObjectId, ref: 'Bus', required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant' },
    bookingAt: { type: Date, default: Date.now },
    travelDate: { type: Date, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    passengers: { type: [passengerSchema], required: true },
    totalFare: { type: Number, required: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'refunded', 'expired'],
      default: 'pending',
    },
    cancellationReason: String,
    cancelledAt: Date,
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    refundAmount: Number,
    pnrNumber: { type: String, default: generatePNR, unique: true },
    ticketUrl: String,
  },
  { timestamps: true },
);

bookingSchema.index({ userId: 1 });
bookingSchema.index({ busId: 1 });
bookingSchema.index({ tenantId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ travelDate: 1, status: 1 });

export const Booking = model<IBooking>('Booking', bookingSchema);
