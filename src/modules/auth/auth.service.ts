import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../core/config/env.config';
import { authRepository } from './auth.repository';
import { setOtp, getOtp, deleteOtp } from '../../core/redis/redis.service';
import { eventBus } from '../../core/events/event.bus';
import { DomainEvent } from '../../core/events/event.types';
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  ConflictError,
  ForbiddenError,
} from '../../core/errors/AppError';
import {
  SendOtpDto,
  VerifyOtpDto,
  CompleteRegistrationDto,
  RefreshTokenDto,
  AdminLoginDto,
  CreateAdminDto,
  AuthResult,
  TokenPair,
  JwtPayload,
} from './auth.types';
import { Role } from '../../core/types';
import { User } from '../user/user.model';
import { logger } from '../../core/logger/logger';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function signAccessToken(payload: Omit<JwtPayload, 'type' | 'iat' | 'exp'>, expiry: string): string {
  return jwt.sign({ ...payload, type: 'access' }, env.jwt.secret, {
    expiresIn: expiry as jwt.SignOptions['expiresIn'],
  });
}

function signRefreshToken(payload: Omit<JwtPayload, 'type' | 'iat' | 'exp'>): string {
  return jwt.sign({ ...payload, type: 'refresh' }, env.jwt.secret, {
    expiresIn: env.jwt.refreshExpiry as jwt.SignOptions['expiresIn'],
  });
}

export class AuthService {
  async sendOtp(dto: SendOtpDto): Promise<{ message: string }> {
    const otp = generateOtp();

    // Store OTP in Redis (not DB)
    await setOtp(dto.phone, otp);

    // In production: queue SMS job. For now, log in dev.
    if (env.node.isDev) {
      logger.debug(`[DEV] OTP for ${dto.phone}: ${otp}`);
    }

    eventBus.emit(DomainEvent.OTP_REQUESTED, { phone: dto.phone, otp });

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<AuthResult> {
    const storedOtp = await getOtp(dto.phone);
    if (!storedOtp || storedOtp !== dto.otp) {
      throw new BadRequestError('Invalid or expired OTP', 'INVALID_OTP');
    }

    await deleteOtp(dto.phone);

    let user = await authRepository.findByPhone(dto.phone);
    const isNewUser = !user;

    if (isNewUser) {
      user = await authRepository.createUser({ phone: dto.phone });
    }

    if (!user) throw new NotFoundError('User');

    const deviceId = dto.deviceId ?? crypto.randomUUID();
    const jwtPayload: Omit<JwtPayload, 'type' | 'iat' | 'exp'> = {
      sub: user.id,
      role: user.role,
      ...(user.tenantId ? { tenantId: user.tenantId.toString() } : {}),
    };

    const accessToken = signAccessToken(jwtPayload, env.jwt.accessExpiry);
    const refreshToken = signRefreshToken(jwtPayload);
    const tokenHash = authRepository.hashToken(refreshToken);

    await authRepository.addRefreshToken(
      user._id,
      tokenHash,
      deviceId,
      dto.deviceName,
    );
    await authRepository.clearOtpOnUser(user._id);

    eventBus.emit(
      isNewUser ? DomainEvent.USER_REGISTERED : DomainEvent.USER_LOGGED_IN,
      { userId: user.id, phone: user.phone },
    );

    return {
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        fullName: user.fullName,
        isVerified: true,
        profileCompleted: user.profileCompleted,
        tenantId: user.tenantId?.toString(),
      },
      tokens: { accessToken, refreshToken },
      profileRequired: !user.profileCompleted,
    };
  }

  async completeRegistration(dto: CompleteRegistrationDto): Promise<{ message: string }> {
    const user = await User.findOne({ phone: dto.phone });
    if (!user) throw new NotFoundError('User');

    const emailTaken = dto.email
      ? await User.findOne({ email: dto.email, _id: { $ne: user._id } })
      : null;
    if (emailTaken) throw new ConflictError('Email is already in use');

    await User.updateOne(
      { phone: dto.phone },
      {
        fullName: dto.fullName,
        email: dto.email ?? undefined,
        gender: dto.gender,
        dob: dto.dob ? new Date(dto.dob) : undefined,
        profileCompleted: true,
      },
    );

    return { message: 'Profile completed successfully' };
  }

  async refreshAccessToken(dto: RefreshTokenDto): Promise<TokenPair> {
    let payload: JwtPayload;
    try {
      payload = jwt.verify(dto.refreshToken, env.jwt.secret) as JwtPayload;
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (payload.type !== 'refresh') throw new UnauthorizedError('Invalid token type');

    const user = await authRepository.findById(dto.userId);
    if (!user) throw new NotFoundError('User');

    const tokenHash = authRepository.hashToken(dto.refreshToken);
    const storedToken = user.refreshTokens.find((t) => t.tokenHash === tokenHash);

    if (!storedToken) throw new UnauthorizedError('Refresh token not found or revoked');

    await authRepository.removeRefreshToken(user._id, tokenHash);

    const jwtPayload: Omit<JwtPayload, 'type' | 'iat' | 'exp'> = {
      sub: user.id,
      role: user.role,
      ...(user.tenantId ? { tenantId: user.tenantId.toString() } : {}),
    };

    const accessToken = signAccessToken(jwtPayload, env.jwt.accessExpiry);
    const newRefreshToken = signRefreshToken(jwtPayload);
    const newTokenHash = authRepository.hashToken(newRefreshToken);

    await authRepository.addRefreshToken(
      user._id,
      newTokenHash,
      storedToken.deviceId,
      storedToken.deviceName,
    );

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const user = await authRepository.findById(userId);
    if (!user) return;

    const tokenHash = authRepository.hashToken(refreshToken);
    await authRepository.removeRefreshToken(user._id, tokenHash);
    eventBus.emit(DomainEvent.USER_LOGGED_OUT, { userId });
  }

  async logoutAllDevices(userId: string): Promise<void> {
    const user = await authRepository.findById(userId);
    if (!user) return;

    await authRepository.clearAllRefreshTokens(user._id);
    eventBus.emit(DomainEvent.USER_LOGGED_OUT, { userId });
  }

  async adminLogin(dto: AdminLoginDto): Promise<AuthResult> {
    const query = dto.phone ? { phone: dto.phone } : { email: dto.email };
    const user = await User.findOne(query).select('+password +refreshTokens');

    if (!user) throw new UnauthorizedError('Invalid credentials');
    if (![Role.ADMIN, Role.OPERATOR, Role.SUPER_ADMIN].includes(user.role as Role)) {
      throw new ForbiddenError('Access denied');
    }
    if (!user.isActive) throw new ForbiddenError('Account is suspended');

    const isValid = await user.comparePassword(dto.password);
    if (!isValid) throw new UnauthorizedError('Invalid credentials');

    const jwtPayload: Omit<JwtPayload, 'type' | 'iat' | 'exp'> = {
      sub: user.id,
      role: user.role,
      ...(user.tenantId ? { tenantId: user.tenantId.toString() } : {}),
    };

    const accessToken = signAccessToken(jwtPayload, env.jwt.adminExpiry);
    const refreshToken = signRefreshToken(jwtPayload);
    const tokenHash = authRepository.hashToken(refreshToken);
    const deviceId = crypto.randomUUID();

    await authRepository.addRefreshToken(user._id, tokenHash, deviceId, 'admin-web');

    return {
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        fullName: user.fullName,
        isVerified: user.isVerified,
        profileCompleted: true,
        tenantId: user.tenantId?.toString(),
      },
      tokens: { accessToken, refreshToken },
      profileRequired: false,
    };
  }

  async createAdminUser(dto: CreateAdminDto, createdById: string): Promise<{ message: string }> {
    const existing = await User.findOne({ phone: dto.phone });
    if (existing) throw new ConflictError('User with this phone already exists');

    const user = new User({
      phone: dto.phone,
      email: dto.email,
      fullName: dto.fullName,
      role: dto.role,
      password: dto.password,
      isVerified: true,
      profileCompleted: true,
      createdBy: createdById,
      ...(dto.tenantId ? { tenantId: dto.tenantId } : {}),
    });

    await user.save();
    return { message: `${dto.role} created successfully` };
  }
}

export const authService = new AuthService();
