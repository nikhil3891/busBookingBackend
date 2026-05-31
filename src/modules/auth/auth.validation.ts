import { z } from 'zod';

export const sendOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  purpose: z.enum(['register', 'login']).optional(),
});

export const verifyOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must be numeric'),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
});

export const completeRegistrationSchema = z.object({
  phone: z.string().trim().regex(/^[6-9]\d{9}$/),
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dob: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
});

export const refreshTokenSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  refreshToken: z.string().min(1, 'refreshToken is required'),
  deviceId: z.string().optional(),
});

export const adminLoginSchema = z.object({
  phone: z.string().trim().regex(/^[6-9]\d{9}$/).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((d) => d.phone ?? d.email, {
  message: 'Provide phone or email',
});

export const createAdminSchema = z.object({
  phone: z.string().trim().regex(/^[6-9]\d{9}$/),
  email: z.string().email().optional(),
  fullName: z.string().min(2).max(100),
  role: z.enum(['admin', 'operator']),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  tenantId: z.string().optional(),
});

export const setPasswordSchema = z.object({
  phone: z.string().trim().regex(/^[6-9]\d{9}$/),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
