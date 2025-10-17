// src/models/user.model.ts
// Extended User model supporting OTP login, profile completion, roles, and refresh-token tracking.

import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcrypt';

export type Role = 'user' | 'admin' | 'operator';

export interface IRefreshToken {
  tokenHash: string;
  createdAt: Date;
}

export interface IUser extends Document {
  phone: string;                 // primary identifier for OTP flow
  email?: string;
  fullName?: string;
  gender?: 'male' | 'female' | 'other';
  dob?: Date;
  age?: number;
  password?: string;             // optional if you add password login later
  role: Role;
  isVerified: boolean;           // mobile verified via OTP
  profileCompleted: boolean;     // did user fill fullName/dob/gender/email
  otp?: string;                  // OTP code (for dev). In prod store hash
  otpExpiresAt?: Date;
  refreshTokens?: IRefreshToken[];
  comparePassword(candidate: string): Promise<boolean>;
}

const refreshTokenSchema = new Schema<IRefreshToken>({
  tokenHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const userSchema = new Schema<IUser>({
  phone: { type: String, required: true, unique: true }, // users identified by mobile
  email: { type: String, unique: true, sparse: true, lowercase: true },
  fullName: { type: String },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  dob: { type: Date },
  age: { type: Number },
  password: { type: String }, // optional
  role: { type: String, enum: ['user', 'admin', 'operator'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  profileCompleted: { type: Boolean, default: false },
  otp: { type: String }, // dev-friendly; in prod store hashed and/or ephemeral store
  otpExpiresAt: { type: Date },
  refreshTokens: { type: [refreshTokenSchema], default: [] }
}, { timestamps: true });

// Hash password if set/modified
userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

userSchema.methods.comparePassword = function (candidate: string) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

export default model<IUser>('User', userSchema);
