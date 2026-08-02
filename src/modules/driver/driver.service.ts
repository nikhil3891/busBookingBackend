import { Types } from 'mongoose';
import { z } from 'zod';
import { Driver, IDriver } from './driver.model';
import { User } from '../user/user.model';
import { Role } from '../../core/types';
import { VerificationStatus } from '../verification/verification.types';
import { assignVerificationManager, decideVerification, VerificationDecision } from '../verification/verification.service';
import { VERIFICATION_SLA_DAYS } from '../../core/config/policy.config';
import { BadRequestError, ConflictError, NotFoundError } from '../../core/errors/AppError';
import { eventBus } from '../../core/events/event.bus';
import { DomainEvent } from '../../core/events/event.types';
import { PaginatedResult } from '../../core/types';
import { createDriverSchema, updateDriverSchema, listDriversSchema } from './driver.validation';
import { decideVerificationSchema } from '../tenant/tenant.validation';

type CreateDriverDto = z.infer<typeof createDriverSchema>;
type UpdateDriverDto = z.infer<typeof updateDriverSchema>;
type ListDriversDto = z.infer<typeof listDriversSchema>;
type DecideDto = z.infer<typeof decideVerificationSchema>;

export class DriverService {
  /** Operator/admin adds a driver immediately — it starts in `pending`
   * verification and isn't assignable to a bus for real bookings until a
   * Manager clears it (bus.service.assignDriver checks this). */
  async create(dto: CreateDriverDto, createdById: string, tenantId: string): Promise<IDriver> {
    const existing = await Driver.findOne({ phone: dto.phone, tenantId });
    if (existing) throw new ConflictError('A driver with this phone number already exists for your account');

    const driver = await Driver.create({
      ...dto,
      licenseExpiry: new Date(dto.licenseExpiry),
      tenantId: new Types.ObjectId(tenantId),
      createdBy: new Types.ObjectId(createdById),
    });

    eventBus.emit(DomainEvent.DRIVER_CREATED, { driverId: driver.id, tenantId });
    return driver;
  }

  async getById(id: string): Promise<IDriver> {
    const driver = await Driver.findById(id).populate('verification.assignedManagerId', 'fullName phone');
    if (!driver) throw new NotFoundError('Driver');
    return driver;
  }

  async list(dto: ListDriversDto, tenantId?: string, requesterId?: string): Promise<PaginatedResult<IDriver>> {
    const filter: Record<string, unknown> = {
      ...(tenantId ? { tenantId } : {}),
      ...(dto.verificationStatus ? { 'verification.status': dto.verificationStatus } : {}),
      ...(dto.assignedToMe === 'true' && requesterId
        ? { 'verification.assignedManagerId': new Types.ObjectId(requesterId) }
        : {}),
    };

    const total = await Driver.countDocuments(filter);
    const data = await Driver.find(filter)
      .sort({ createdAt: -1 })
      .skip((dto.page - 1) * dto.limit)
      .limit(dto.limit);

    return {
      data,
      pagination: {
        total,
        page: dto.page,
        limit: dto.limit,
        totalPages: Math.ceil(total / dto.limit),
        hasNext: dto.page * dto.limit < total,
        hasPrev: dto.page > 1,
      },
    };
  }

  async update(id: string, dto: UpdateDriverDto): Promise<IDriver> {
    const update: Record<string, unknown> = { ...dto };
    if (dto.licenseExpiry) update['licenseExpiry'] = new Date(dto.licenseExpiry);
    const driver = await Driver.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!driver) throw new NotFoundError('Driver');
    return driver;
  }

  async assignManager(driverId: string, managerId: string, assignedById: string): Promise<IDriver> {
    const manager = await User.findById(managerId);
    if (!manager || manager.role !== Role.MANAGER) {
      throw new BadRequestError('managerId must belong to a user with the manager role');
    }
    const driver = await assignVerificationManager(Driver, driverId, managerId, assignedById, VERIFICATION_SLA_DAYS.driver);

    eventBus.emit(DomainEvent.VERIFICATION_ASSIGNED, {
      entityType: 'driver',
      entityId: driver.id,
      managerId,
      notifyUserId: driver.createdBy.toString(),
    });

    return driver;
  }

  async decide(driverId: string, decidedById: string, dto: DecideDto): Promise<IDriver> {
    const driver = await decideVerification(Driver, driverId, dto.decision as VerificationDecision, decidedById, {
      inspectionNotes: dto.inspectionNotes,
      decisionReason: dto.decisionReason,
    });

    eventBus.emit(DomainEvent.VERIFICATION_DECIDED, {
      entityType: 'driver',
      entityId: driver.id,
      decision: dto.decision,
      notifyUserId: driver.createdBy.toString(),
    });

    return driver;
  }

  /** Only a fully-verified (`active`) driver can be attached to a bus. */
  async assertBookable(driverId: string): Promise<void> {
    const driver = await Driver.findById(driverId, 'verification.status isActive');
    if (!driver) throw new NotFoundError('Driver');
    if (driver.verification.status !== VerificationStatus.ACTIVE || !driver.isActive) {
      throw new BadRequestError('Driver has not completed verification yet');
    }
  }
}

export const driverService = new DriverService();
