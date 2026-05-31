// src/models/notificationModel.ts 
import { Schema, model, Types } from 'mongoose';

const notificationSchema = new Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  target: { type: String, enum: ['all','users','bus','custom'], default: 'all' },
  targetIds: { type: [Types.ObjectId], default: [] }, // users or bus ids to target (if applicable)
  metadata: { type: Schema.Types.Mixed }, // e.g., { discountCode: 'NEW10', expiresAt: Date }
  createdBy: { type: Types.ObjectId, ref: 'User' },
  expiresAt: { type: Date },
  readBy: { type: [Types.ObjectId], ref: 'User', default: [] }
}, { timestamps: true });

notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // optional TTL
export default model('Notification', notificationSchema);
