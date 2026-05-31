// src/services/authServices.ts
// ===============================================
// Handles authentication logic: OTP sending, OTP verification,
// registration completion, and JWT token generation.
// ===============================================

import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import env from '../config/env';
import User, { IUser } from '../models/usersModel';


// ------------------ CONFIGURABLE OPTIONS --------------------

// Option 1: Keep only latest refresh token
const SINGLE_SESSION_ONLY = false; // set true for single-device login

// Option 2: Allow multiple devices (max limit)
const MAX_REFRESH_TOKENS = 5;

// Option 3: Auto-delete expired tokens (cron handles it too)
const REFRESH_EXPIRES_DAYS = 7;


// ------------------ HELPERS --------------------

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function calcAge(dob: Date): number {
  const diff = Date.now() - dob.getTime();
  const ageDt = new Date(diff);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
}

// ------------------ JWT GENERATORS --------------------

export function generateAccessToken(user: IUser): string {
  let expiresIn: string | number = env.jwtExpiresIn;

  if ((user.role === 'admin' || user.role === 'operator') && env.jwtExpiresInAdmin) {
    expiresIn = env.jwtExpiresInAdmin;
  }

  const options: SignOptions = { expiresIn: expiresIn as any };

  return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, options);
}

export function generateRefreshToken(user: IUser): string {
  const options: SignOptions = { expiresIn: env.refreshTokenExpiresIn as any};
  return jwt.sign({ sub: user.id, type: 'refresh' }, env.jwtSecret, options);
}

// ------------------ TOKEN MANAGEMENT --------------------

async function handleRefreshTokens(user: IUser, newRefreshToken: string) {
  const hash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
  const now = new Date();

  user.refreshTokens = user.refreshTokens || [];

  // ---- AUTO DELETE EXPIRED TOKENS (Option 3) ----
  user.refreshTokens = user.refreshTokens.filter(rt => {
    const expiry = new Date(rt.createdAt);
    expiry.setDate(expiry.getDate() + REFRESH_EXPIRES_DAYS);
    return expiry > now;
  });

   // ---- SINGLE SESSION MODE (Option 1) ----
  if (SINGLE_SESSION_ONLY) {
    user.refreshTokens = [];
  }

  // ---- ADD NEW TOKEN ----
  user.refreshTokens.push({ tokenHash: hash, createdAt: now });

  // ---- MULTI-DEVICE LIMIT (Option 2) ----
  if (user.refreshTokens.length > MAX_REFRESH_TOKENS) {
    user.refreshTokens = user.refreshTokens.slice(-MAX_REFRESH_TOKENS);
  }

  await user.save();
}
// ------------------ OTP HANDLING --------------------

// For Registration - creates new user
export async function sendOtpForRegistration(phone: string) {
  const normalized = phone.replace(/\s+/g, '');
  const existingUser = await User.findOne({ phone: normalized });

  if (existingUser) {
    throw new Error('User already registered with this phone number');
  }

  const user = new User({ phone: normalized, isVerified: false, role: 'user' });
  const otp = generateOtp();
  user.otp = otp;
  user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await user.save();

  console.log(`[DEV OTP] ${normalized} -> ${otp}`);
  return { success: true, message: 'OTP sent for registration', OTP: otp };
}

// For Login - only for existing users
export async function sendOtpForLogin(phone: string) {
  const normalized = phone.replace(/\s+/g, '');
  const user = await User.findOne({ phone: normalized });

  if (!user) {
    throw new Error('User not found. Please register first.');
  }

  const otp = generateOtp();
  user.otp = otp;
  user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await user.save();

  console.log(`[DEV OTP] ${normalized} -> ${otp}`);
  return { success: true, message: 'OTP sent for login', OTP: otp };
}

// Legacy function for backward compatibility
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
  return { success: true, message: 'OTP sent', OTP: otp };
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

  await handleRefreshTokens(user, refresh);

  // const tokenHash = crypto.createHash('sha256').update(refresh).digest('hex');
  // user.refreshTokens = user.refreshTokens || [];
  // user.refreshTokens.push({ tokenHash, createdAt: new Date() });
  // await user.save();

  // omit phone number in response
  const userObj = user.toObject();
  // if ('phone' in userObj) delete userObj.phone;


  return { user:userObj, access, refresh, profileRequired: !user.profileCompleted };
}

// ------------------ COMPLETE REGISTRATION --------------------

export async function completeRegistration(
  userId: string,
  payload: { fullName: string; gender: 'male' | 'female' | 'other'; dob: string; email?: string }
) {
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

  // Don't generate new tokens here - user already has tokens from verifyOtp
  // Just return the updated user info
  const userObj = user.toObject();
  return { user: userObj, message: 'Registration completed successfully' };
}

// ------------------ LOGOUT --------------------

export async function logout(userId: string, refreshToken: string) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.refreshTokens = user.refreshTokens || [];

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  user.refreshTokens = user.refreshTokens.filter(rt => rt.tokenHash !== tokenHash);
  
  // Also clean up expired tokens during logout
  const now = new Date();
  user.refreshTokens = user.refreshTokens.filter(rt => {
    if (!rt.createdAt) return false;
    const expiry = new Date(rt.createdAt);
    expiry.setDate(expiry.getDate() + REFRESH_EXPIRES_DAYS);
    return expiry > now;
  });
  
  await user.save();

  return { success: true, message: 'Logged out successfully' };
}

// Logout from all devices
export async function logoutAllDevices(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.refreshTokens = [];
  await user.save();

  return { success: true, message: 'Logged out from all devices' };
}

export async function  refreshAccessToken(userId: string, refreshToken: string) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.refreshTokens = user.refreshTokens || [];

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const storedToken = user.refreshTokens.find(rt => rt.tokenHash === tokenHash);
  if (!storedToken) throw new Error('Invalid refresh token');

  // Check expiry manually (7 days)
  const expiry = new Date(storedToken.createdAt);
  expiry.setDate(expiry.getDate() + 7);
  if (expiry < new Date()) throw new Error('Refresh token expired');

  // ✅ Generate new tokens
  const newAccess = generateAccessToken(user);
  const newRefresh = generateRefreshToken(user);

  // Replace old one (optional)
  await handleRefreshTokens(user, newRefresh);

  return { access: newAccess, refresh: newRefresh };
}

// ------------------ ADMIN AUTHENTICATION --------------------

// Admin registration (only for super admin to create new admins)
export async function createAdmin(
  adminData: { 
    phone: string; 
    fullName: string; 
    email?: string; 
    role: 'admin' | 'operator';
    createdBy: string; // ID of the admin creating this admin
  }
) {
  const normalized = adminData.phone.replace(/\s+/g, '');
  const existingUser = await User.findOne({ phone: normalized });
  
  if (existingUser) {
    throw new Error('Admin already exists with this phone number');
  }

  const admin = new User({
    phone: normalized,
    fullName: adminData.fullName,
    email: adminData.email,
    role: adminData.role,
    isVerified: true, // Admin is pre-verified
    profileCompleted: true,
    createdBy: adminData.createdBy
  });

  await admin.save();

  const access = generateAccessToken(admin);
  const refresh = generateRefreshToken(admin);
  await handleRefreshTokens(admin, refresh);

  const adminObj = admin.toObject();
  return { admin: adminObj, access, refresh };
}

// Admin login (password-based for admins)
export async function adminLogin(phone: string, password: string) {
  const normalized = phone.replace(/\s+/g, '');
  const admin = await User.findOne({ 
    phone: normalized, 
    role: { $in: ['admin', 'operator'] } 
  });

  if (!admin) {
    throw new Error('Admin not found');
  }

  if (!admin.password) {
    throw new Error('Admin password not set. Please contact super admin.');
  }

  const isPasswordValid = await admin.comparePassword(password);
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  const access = generateAccessToken(admin);
  const refresh = generateRefreshToken(admin);
  await handleRefreshTokens(admin, refresh);

  const adminObj = admin.toObject();
  return { admin: adminObj, access, refresh };
}

// Set admin password (for first-time setup)
export async function setAdminPassword(adminId: string, password: string) {
  const admin = await User.findById(adminId);
  if (!admin) throw new Error('Admin not found');
  
  if (admin.role === 'user') {
    throw new Error('Only admins can set passwords');
  }

  admin.password = password;
  await admin.save();

  return { success: true, message: 'Password set successfully' };
}
