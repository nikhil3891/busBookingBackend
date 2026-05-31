import { User, IUser } from '../user/user.model';
import { Types } from 'mongoose';
import crypto from 'crypto';

export class AuthRepository {
  async findByPhone(phone: string): Promise<IUser | null> {
    return User.findOne({ phone }).select('+otp +otpExpiresAt +refreshTokens +password');
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async createUser(data: {
    phone: string;
    role?: string;
    tenantId?: Types.ObjectId;
    createdBy?: string;
  }): Promise<IUser> {
    return User.create(data);
  }

  async setOtpOnUser(phone: string, otp: string, expiresAt: Date): Promise<void> {
    await User.updateOne({ phone }, { otp, otpExpiresAt: expiresAt });
  }

  async clearOtpOnUser(userId: Types.ObjectId): Promise<void> {
    await User.updateOne(
      { _id: userId },
      { $unset: { otp: '', otpExpiresAt: '' }, isVerified: true },
    );
  }

  async addRefreshToken(
    userId: Types.ObjectId,
    tokenHash: string,
    deviceId: string,
    deviceName?: string,
  ): Promise<void> {
    await User.updateOne(
      { _id: userId },
      {
        $push: {
          refreshTokens: {
            tokenHash,
            deviceId,
            deviceName,
            createdAt: new Date(),
            lastUsedAt: new Date(),
          },
        },
        lastLoginAt: new Date(),
      },
    );
  }

  async removeRefreshToken(userId: Types.ObjectId, tokenHash: string): Promise<void> {
    await User.updateOne(
      { _id: userId },
      { $pull: { refreshTokens: { tokenHash } } },
    );
  }

  async clearAllRefreshTokens(userId: Types.ObjectId): Promise<void> {
    await User.updateOne({ _id: userId }, { $set: { refreshTokens: [] } });
  }

  async updateRefreshTokenUsage(
    userId: Types.ObjectId,
    tokenHash: string,
  ): Promise<void> {
    await User.updateOne(
      { _id: userId, 'refreshTokens.tokenHash': tokenHash },
      { $set: { 'refreshTokens.$.lastUsedAt': new Date() } },
    );
  }

  async cleanExpiredTokens(before: Date): Promise<number> {
    const result = await User.updateMany(
      {},
      { $pull: { refreshTokens: { createdAt: { $lt: before } } } },
    );
    return result.modifiedCount;
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

export const authRepository = new AuthRepository();
