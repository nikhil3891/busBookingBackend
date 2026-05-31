//src/utils/tokenManager.ts
import crypto from 'crypto';
import { IUser } from '../models/usersModel';

// configurable constants (optional import)
const REFRESH_EXPIRES_DAYS = 7;
const MAX_REFRESH_TOKENS = 5;
const SINGLE_SESSION_ONLY = false;

export async function handleRefreshTokens(user: IUser, newRefreshToken: string) {
  const hash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
  const now = new Date();

  // initialize if undefined
  user.refreshTokens = user.refreshTokens || [];

  // 1️⃣ Auto-remove expired tokens
  user.refreshTokens = user.refreshTokens.filter(rt => {
    if (!rt.createdAt) return false;
    const expiry = new Date(rt.createdAt);
    expiry.setDate(expiry.getDate() + REFRESH_EXPIRES_DAYS);
    return expiry > now;
  });

  // 2️⃣ If single-session mode
  if (SINGLE_SESSION_ONLY) user.refreshTokens = [];

  // 3️⃣ Add new one
  user.refreshTokens.push({ tokenHash: hash, createdAt: now });

  // 4️⃣ Limit number of refresh tokens
  if (user.refreshTokens.length > MAX_REFRESH_TOKENS) {
    user.refreshTokens = user.refreshTokens.slice(-MAX_REFRESH_TOKENS);
  }

  await user.save();
}
