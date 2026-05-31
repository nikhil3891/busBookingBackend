import jwt from 'jsonwebtoken';
import { User } from '../../src/modules/user/user.model';
import { Role } from '../../src/core/types';
import { Types } from 'mongoose';

export async function createTestUser(overrides: Partial<{
  phone: string;
  role: Role;
  fullName: string;
  isVerified: boolean;
  profileCompleted: boolean;
}> = {}) {
  const user = await User.create({
    phone: overrides.phone ?? `9${Math.floor(Math.random() * 1_000_000_000).toString().padStart(9, '0')}`,
    role: overrides.role ?? Role.USER,
    fullName: overrides.fullName ?? 'Test User',
    isVerified: overrides.isVerified ?? true,
    profileCompleted: overrides.profileCompleted ?? true,
  });
  return user;
}

export function generateToken(userId: string, role: Role, secret = 'test_secret_key_for_testing'): string {
  return jwt.sign(
    { sub: userId, role, type: 'access' },
    secret,
    { expiresIn: '15m' },
  );
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
