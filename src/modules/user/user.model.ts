import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcrypt';
import { Role } from '../../core/types';

export interface IRefreshToken {
  tokenHash: string;
  deviceId: string;
  deviceName?: string;
  createdAt: Date;
  lastUsedAt: Date;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  id: string;
  phone: string;
  email?: string;
  fullName?: string;
  gender?: 'male' | 'female' | 'other';
  dob?: Date;
  age?: number;
  password?: string;
  address?: string;
  pin?: number;
  role: Role;
  tenantId?: Types.ObjectId;
  isVerified: boolean;
  profileCompleted: boolean;
  otp?: string;
  otpExpiresAt?: Date;
  refreshTokens: IRefreshToken[];
  createdBy?: string;
  lastLoginAt?: Date;
  isActive: boolean;
  comparePassword(candidate: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    tokenHash: { type: String, required: true },
    deviceId: { type: String, required: true },
    deviceName: String,
    createdAt: { type: Date, default: Date.now },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, sparse: true, lowercase: true, trim: true },
    fullName: { type: String, trim: true },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    dob: Date,
    age: Number,
    password: { type: String, select: false },
    address: String,
    pin: Number,
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.USER,
    },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant' },
    isVerified: { type: Boolean, default: false },
    profileCompleted: { type: Boolean, default: false },
    otp: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
    refreshTokens: { type: [refreshTokenSchema], default: [], select: false },
    createdBy: String,
    lastLoginAt: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userSchema.index({ tenantId: 1 });
userSchema.index({ role: 1 });

userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

userSchema.methods.comparePassword = async function (
  candidate: string,
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export const User = model<IUser>('User', userSchema);
