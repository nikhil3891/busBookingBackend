import { z } from 'zod';
import { Plan, IPlan } from './plan.model';
import { NotFoundError, ConflictError } from '../../core/errors/AppError';
import { createPlanSchema, updatePlanSchema } from './plan.validation';

type CreatePlanDto = z.infer<typeof createPlanSchema>;
type UpdatePlanDto = z.infer<typeof updatePlanSchema>;

export class PlanService {
  /** Public — powers the pricing page operators see before subscribing. */
  async listActive(): Promise<IPlan[]> {
    return Plan.find({ isActive: true }).sort({ price: 1 });
  }

  /** super_admin — full list including inactive/retired plans. */
  async listAll(): Promise<IPlan[]> {
    return Plan.find().sort({ cycle: 1, price: 1 });
  }

  async getById(id: string): Promise<IPlan> {
    const plan = await Plan.findById(id);
    if (!plan) throw new NotFoundError('Plan');
    return plan;
  }

  async create(dto: CreatePlanDto): Promise<IPlan> {
    const existing = await Plan.findOne({ name: dto.name, cycle: dto.cycle });
    if (existing) throw new ConflictError('A plan with this name and billing cycle already exists');
    return Plan.create(dto);
  }

  async update(id: string, dto: UpdatePlanDto): Promise<IPlan> {
    const plan = await Plan.findByIdAndUpdate(id, { $set: dto }, { new: true });
    if (!plan) throw new NotFoundError('Plan');
    return plan;
  }

  /** Plans are never hard-deleted — tenants may still reference them.
   * Deactivating hides them from the public pricing page instead. */
  async deactivate(id: string): Promise<IPlan> {
    const plan = await Plan.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!plan) throw new NotFoundError('Plan');
    return plan;
  }
}

export const planService = new PlanService();
