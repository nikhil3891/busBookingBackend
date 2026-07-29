import { z } from 'zod';
import {
  sendOtpSchema,
  verifyOtpSchema,
  completeRegistrationSchema,
  refreshTokenSchema,
  adminLoginSchema,
  createAdminSchema,
} from './auth.validation';

export type SendOtpDto = z.infer<typeof sendOtpSchema>;
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;
export type CompleteRegistrationDto = z.infer<typeof completeRegistrationSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
export type AdminLoginDto = z.infer<typeof adminLoginSchema>;
export type CreateAdminDto = z.infer<typeof createAdminSchema>;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: {
    id: string;
    phone: string;
    role: string;
    fullName?: string;
    isVerified: boolean;
    profileCompleted: boolean;
    tenantId?: string;
  };
  tokens: TokenPair;
  profileRequired: boolean;
}

export interface JwtPayload {
  sub: string;
  role: string;
  tenantId?: string;
  type?: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}
