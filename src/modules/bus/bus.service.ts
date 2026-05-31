import { Bus, IBus, ISeat } from './bus.model';
import { NotFoundError, BadRequestError, ConflictError } from '../../core/errors/AppError';
import { cacheGet, cacheSet, cacheDel, cacheDelPattern } from '../../core/redis/redis.service';
import { eventBus } from '../../core/events/event.bus';
import { DomainEvent } from '../../core/events/event.types';
import { PaginatedResult } from '../../core/types';
import { z } from 'zod';
import { createBusSchema, updateBusSchema, searchBusSchema } from './bus.validation';
import { Types } from 'mongoose';

type CreateBusDto = z.infer<typeof createBusSchema>;
type UpdateBusDto = z.infer<typeof updateBusSchema>;
type SearchBusDto = z.infer<typeof searchBusSchema>;

const BUS_CACHE_TTL = 300;

export class BusService {
  async search(dto: SearchBusDto, tenantId?: string): Promise<PaginatedResult<IBus>> {
    const cacheKey = `bus:search:${JSON.stringify(dto)}:${tenantId ?? 'global'}`;
    const cached = await cacheGet<PaginatedResult<IBus>>(cacheKey);
    if (cached) return cached;

    const startOfDay = new Date(dto.date);
    const endOfDay = new Date(dto.date);
    endOfDay.setHours(23, 59, 59, 999);

    const filter: Record<string, unknown> = {
      'route.from': new RegExp(dto.from, 'i'),
      'route.to': new RegExp(dto.to, 'i'),
      departAt: { $gte: startOfDay, $lte: endOfDay },
      status: 'active',
      ...(dto.vehicleType ? { vehicleType: dto.vehicleType } : {}),
      ...(tenantId ? { tenantId } : {}),
    };

    const total = await Bus.countDocuments(filter);
    const data = await Bus.find(filter)
      .skip((dto.page - 1) * dto.limit)
      .limit(dto.limit)
      .sort({ departAt: 1 });

    const result: PaginatedResult<IBus> = {
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

    await cacheSet(cacheKey, result, BUS_CACHE_TTL);
    return result;
  }

  async getById(id: string): Promise<IBus> {
    const cacheKey = `bus:${id}`;
    const cached = await cacheGet<IBus>(cacheKey);
    if (cached) return cached;

    const bus = await Bus.findById(id).populate('operatorId', 'fullName phone email');
    if (!bus) throw new NotFoundError('Bus');

    await cacheSet(cacheKey, bus.toObject(), BUS_CACHE_TTL);
    return bus;
  }

  async create(dto: CreateBusDto, operatorId: string, tenantId?: string): Promise<IBus> {
    if (new Date(dto.departAt) >= new Date(dto.arriveAt)) {
      throw new BadRequestError('departAt must be before arriveAt');
    }

    const seats: ISeat[] = dto.seats?.length
      ? (dto.seats as ISeat[])
      : Array.from({ length: dto.totalSeats }, (_, i) => ({
          seatNo: (i + 1).toString().padStart(2, '0'),
          status: 'available' as const,
          fare: dto.baseFare,
        }));

    const bus = await Bus.create({
      ...dto,
      operatorId: new Types.ObjectId(operatorId),
      seats,
      ...(tenantId ? { tenantId: new Types.ObjectId(tenantId) } : {}),
    });

    await cacheDelPattern('bus:search:*');
    eventBus.emit(DomainEvent.BUS_CREATED, { busId: bus.id, tenantId });
    return bus;
  }

  async update(id: string, dto: UpdateBusDto, operatorId: string): Promise<IBus> {
    const bus = await Bus.findById(id);
    if (!bus) throw new NotFoundError('Bus');

    if (
      bus.operatorId.toString() !== operatorId &&
      !dto.status
    ) {
      throw new BadRequestError('Not authorized to update this bus');
    }

    const updated = await Bus.findByIdAndUpdate(id, { $set: dto }, { new: true });
    if (!updated) throw new NotFoundError('Bus');

    await cacheDel(`bus:${id}`);
    await cacheDelPattern('bus:search:*');
    eventBus.emit(DomainEvent.BUS_UPDATED, { busId: id });
    return updated;
  }

  async remove(id: string): Promise<void> {
    const bus = await Bus.findByIdAndDelete(id);
    if (!bus) throw new NotFoundError('Bus');
    await cacheDel(`bus:${id}`);
    await cacheDelPattern('bus:search:*');
  }

  async getAvailableSeats(busId: string): Promise<ISeat[]> {
    const bus = await Bus.findById(busId, 'seats');
    if (!bus) throw new NotFoundError('Bus');
    return bus.seats.filter((s) => s.status === 'available');
  }
}

export const busService = new BusService();
