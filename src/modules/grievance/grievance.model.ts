import { Schema, model, Document, Types } from 'mongoose';

export type GrievanceStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type GrievanceCategory = 'refund' | 'driver_behavior' | 'bus_condition' | 'payment_issue' | 'other';

export interface IGrievanceMessage {
  senderId: Types.ObjectId;
  senderRole: string;
  message: string;
  createdAt: Date;
}

export interface IGrievance extends Document {
  userId: Types.ObjectId;
  tenantId?: Types.ObjectId;
  bookingId?: Types.ObjectId;
  category: GrievanceCategory;
  description: string;
  status: GrievanceStatus;
  assignedTo?: Types.ObjectId;
  messages: IGrievanceMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IGrievanceMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, required: true },
    message: { type: String, required: true, maxlength: 2000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const grievanceSchema = new Schema<IGrievance>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant' },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    category: {
      type: String,
      enum: ['refund', 'driver_behavior', 'bus_condition', 'payment_issue', 'other'],
      required: true,
    },
    description: { type: String, required: true, maxlength: 2000 },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true },
);

grievanceSchema.index({ userId: 1 });
grievanceSchema.index({ tenantId: 1 });
grievanceSchema.index({ status: 1 });
grievanceSchema.index({ bookingId: 1 });

export const Grievance = model<IGrievance>('Grievance', grievanceSchema);
