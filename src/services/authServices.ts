// src/services/auth.service.ts
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import User, { IUser } from '../models/usersModel';

// generate 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function calcAge(dob: Date) {
  const diff = Date.now() - dob.getTime();
  const ageDt = new Date(diff);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
}

export function generateAccessToken(user: IUser) {
  let expiresIn = env.jwtExpiresIn;
  if ((user.role === 'admin' || user.role === 'operator') && env.jwtExpiresInAdmin) {
    expiresIn = env.jwtExpiresInAdmin;
  }
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn });
}

export function generateRefreshToken(user: IUser) {
  return jwt.sign({ sub: user.id, type: 'refresh' }, env.jwtSecret, { expiresIn: env.refreshTokenExpiresIn });
}

export async function sendOtp(phone: string) {
  const normalized = phone.replace(/\s+/g, '');
  let user = await User.findOne({ phone: normalized });
  if (!user) {
    user = new User({ phone: normalized, isVerified: false, role: 'user' });
  }
  const otp = generateOtp();
  user.otp = otp;
  user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await user.save();
  console.log(`[DEV OTP] ${normalized} -> ${otp}`);
  return { success: true, message: 'OTP sent' };
}

export async function verifyOtp(phone: string, otp: string) {
  const normalized = phone.replace(/\s+/g, '');
  const user = await User.findOne({ phone: normalized });
  if (!user) throw new Error('User not found');
  if (!user.otp || !user.otpExpiresAt) throw new Error('No OTP requested');
  if (new Date() > user.otpExpiresAt) throw new Error('OTP expired');
  if (user.otp !== otp) throw new Error('Invalid OTP');
  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiresAt = undefined;
  await user.save();

  const access = generateAccessToken(user);
  const refresh = generateRefreshToken(user);
  const tokenHash = crypto.createHash('sha256').update(refresh).digest('hex');
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push({ tokenHash, createdAt: new Date() });
  await user.save();

  return { user, access, refresh, profileRequired: !user.profileCompleted };
}

export async function completeRegistration(userId: string, payload: { fullName: string; gender: 'male'|'female'|'other'; dob: string; email?: string }) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  const dob = new Date(payload.dob);
  if (isNaN(dob.getTime())) throw new Error('Invalid dob');
  user.fullName = payload.fullName;
  user.gender = payload.gender;
  user.dob = dob;
  user.age = calcAge(dob);
  if (payload.email) user.email = payload.email;
  user.profileCompleted = true;
  await user.save();

  const access = generateAccessToken(user);
  const refresh = generateRefreshToken(user);
  const tokenHash = crypto.createHash('sha256').update(refresh).digest('hex');
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push({ tokenHash, createdAt: new Date() });
  await user.save();

  return { user, access, refresh };
}
