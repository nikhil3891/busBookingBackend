import { Schema, model, Document, Types } from 'mongoose';

export type NotificationTarget = 'all' | 'users' | 'operators' | 'bus' | 'custom';
export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push' | 'whatsapp';

export interface INotification extends Document {
  _id: Types.ObjectId;
  tenantId?: Types.ObjectId;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'promo';
  target: NotificationTarget;
  targetIds: Types.ObjectId[];
  channels: NotificationChannel[];
  metadata?: Record<string, unknown>;
  createdBy: Types.ObjectId;
  expiresAt?: Date;
  readBy: Types.ObjectId[];
  deliveredTo: Types.ObjectId[];
  isPersistent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant' },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: {
      type: String,
      enum: ['info', 'warning', 'success', 'error', 'promo'],
      default: 'info',
    },
    target: {
      type: String,
      enum: ['all', 'users', 'operators', 'bus', 'custom'],
      required: true,
    },
    targetIds: [{ type: Schema.Types.ObjectId }],
    channels: {
      type: [String],
      enum: ['in_app', 'email', 'sms', 'push', 'whatsapp'],
      default: ['in_app'],
    },
    metadata: { type: Schema.Types.Mixed },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, index: { expireAfterSeconds: 0 } },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    deliveredTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isPersistent: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ tenantId: 1 });
notificationSchema.index({ target: 1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);
