import { Types } from 'mongoose';
import { z } from 'zod';
import { Grievance, IGrievance } from './grievance.model';
import { NotFoundError, ForbiddenError } from '../../core/errors/AppError';
import { eventBus } from '../../core/events/event.bus';
import { DomainEvent } from '../../core/events/event.types';
import { PaginatedResult } from '../../core/types';
import { createGrievanceSchema, listGrievancesSchema } from './grievance.validation';

type CreateGrievanceDto = z.infer<typeof createGrievanceSchema>;
type ListGrievancesDto = z.infer<typeof listGrievancesSchema>;

export class GrievanceService {
  async create(dto: CreateGrievanceDto, userId: string, tenantId?: string): Promise<IGrievance> {
    const grievance = await Grievance.create({
      userId: new Types.ObjectId(userId),
      ...(dto.bookingId ? { bookingId: new Types.ObjectId(dto.bookingId) } : {}),
      ...(tenantId ? { tenantId: new Types.ObjectId(tenantId) } : {}),
      category: dto.category,
      description: dto.description,
    });

    eventBus.emit(DomainEvent.GRIEVANCE_CREATED, { grievanceId: grievance.id, userId, tenantId });
    return grievance;
  }

  /** A passenger sees only their own tickets; operator/admin/manager staff
   * see everything for their tenant (or globally, for super_admin). */
  async listMine(userId: string, dto: ListGrievancesDto): Promise<PaginatedResult<IGrievance>> {
    return this.paginate({ userId: new Types.ObjectId(userId), ...(dto.status ? { status: dto.status } : {}) }, dto);
  }

  async listForStaff(tenantId: string | undefined, dto: ListGrievancesDto): Promise<PaginatedResult<IGrievance>> {
    return this.paginate(
      { ...(tenantId ? { tenantId } : {}), ...(dto.status ? { status: dto.status } : {}) },
      dto,
    );
  }

  private async paginate(
    filter: Record<string, unknown>,
    dto: ListGrievancesDto,
  ): Promise<PaginatedResult<IGrievance>> {
    const total = await Grievance.countDocuments(filter);
    const data = await Grievance.find(filter)
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

  async getById(id: string, requesterId: string, requesterRole: string): Promise<IGrievance> {
    const grievance = await Grievance.findById(id);
    if (!grievance) throw new NotFoundError('Grievance');
    if (requesterRole === 'user' && grievance.userId.toString() !== requesterId) {
      throw new NotFoundError('Grievance');
    }
    return grievance;
  }

  async addMessage(id: string, senderId: string, senderRole: string, message: string): Promise<IGrievance> {
    const grievance = await Grievance.findById(id);
    if (!grievance) throw new NotFoundError('Grievance');
    if (senderRole === 'user' && grievance.userId.toString() !== senderId) {
      throw new ForbiddenError('Not your grievance');
    }

    grievance.messages.push({
      senderId: new Types.ObjectId(senderId),
      senderRole,
      message,
      createdAt: new Date(),
    });
    // A staff reply on an open ticket moves it forward automatically.
    if (senderRole !== 'user' && grievance.status === 'open') grievance.status = 'in_progress';
    await grievance.save();

    eventBus.emit(DomainEvent.GRIEVANCE_UPDATED, {
      grievanceId: grievance.id,
      userId: grievance.userId.toString(),
      status: grievance.status,
    });

    return grievance;
  }

  async updateStatus(id: string, status: IGrievance['status']): Promise<IGrievance> {
    const grievance = await Grievance.findByIdAndUpdate(id, { status }, { new: true });
    if (!grievance) throw new NotFoundError('Grievance');

    eventBus.emit(DomainEvent.GRIEVANCE_UPDATED, {
      grievanceId: grievance.id,
      userId: grievance.userId.toString(),
      status: grievance.status,
    });

    return grievance;
  }
}

export const grievanceService = new GrievanceService();
