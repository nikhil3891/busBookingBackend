import { User, IUser } from './user.model';
import { NotFoundError, ConflictError, BadRequestError } from '../../core/errors/AppError';
import { z } from 'zod';
import { updateProfileSchema } from './user.validation';
import { PaginatedResult } from '../../core/types';

type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

export class UserService {
  async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId).select(
      '-otp -otpExpiresAt -refreshTokens -password',
    );
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<IUser> {
    if (dto.email) {
      const emailInUse = await User.findOne({
        email: dto.email,
        _id: { $ne: userId },
      });
      if (emailInUse) throw new ConflictError('Email already in use');
    }

    const updates: Partial<IUser> = {
      ...(dto.fullName !== undefined && { fullName: dto.fullName }),
      ...(dto.email !== undefined && { email: dto.email || undefined }),
      ...(dto.gender !== undefined && { gender: dto.gender }),
      ...(dto.dob !== undefined && { dob: new Date(dto.dob) }),
      ...(dto.address !== undefined && { address: dto.address }),
      ...(dto.pin !== undefined && { pin: dto.pin }),
    };

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true },
    ).select('-otp -otpExpiresAt -refreshTokens -password');

    if (!user) throw new NotFoundError('User');
    return user;
  }

  async listUsers(
    tenantId: string | undefined,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<IUser>> {
    const filter = tenantId ? { tenantId } : {};
    const total = await User.countDocuments(filter);
    const data = await User.find(filter)
      .select('-otp -otpExpiresAt -refreshTokens -password')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async deactivateUser(userId: string, requestingUserId: string): Promise<void> {
    if (userId === requestingUserId) {
      throw new BadRequestError('Cannot deactivate your own account');
    }
    const user = await User.findByIdAndUpdate(userId, { isActive: false });
    if (!user) throw new NotFoundError('User');
  }

  async activateUser(userId: string): Promise<void> {
    const user = await User.findByIdAndUpdate(userId, { isActive: true });
    if (!user) throw new NotFoundError('User');
  }
}

export const userService = new UserService();
