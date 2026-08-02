import { Model, Types, Document } from 'mongoose';
import { BadRequestError, NotFoundError } from '../../core/errors/AppError';
import { VerificationStatus, IVerification } from './verification.types';
import { addDays } from '../../core/config/policy.config';

interface HasVerification extends Document {
  verification: IVerification;
}

/**
 * Assigns a Manager to review a pending Tenant/Bus/Driver application.
 * Only called from routes gated to Role.ADMIN / Role.SUPER_ADMIN (enforced
 * by Permission.ASSIGN_VERIFICATION_MANAGER at the route layer) — this
 * function doesn't re-check the caller's role, just records who assigned it.
 */
export async function assignVerificationManager<T extends HasVerification>(
  model: Model<T>,
  entityId: string,
  managerId: string,
  assignedById: string,
  slaDays: number,
): Promise<T> {
  const entity = await model.findById(entityId);
  if (!entity) throw new NotFoundError('Record');

  if (
    entity.verification.status !== VerificationStatus.PENDING &&
    entity.verification.status !== VerificationStatus.REJECTED
  ) {
    throw new BadRequestError(
      `Cannot assign a manager while status is ${entity.verification.status}`,
    );
  }

  const now = new Date();
  entity.verification.status = VerificationStatus.ASSIGNED;
  entity.verification.assignedManagerId = new Types.ObjectId(managerId);
  entity.verification.assignedBy = new Types.ObjectId(assignedById);
  entity.verification.assignedAt = now;
  entity.verification.dueAt = addDays(entity.verification.submittedAt ?? now, slaDays);

  await entity.save();
  return entity;
}

export type VerificationDecision = 'active' | 'rejected' | 'suspended' | 'inactive';

/**
 * Manager (or admin/super_admin) records the outcome of a review — document
 * checks + physical inspection notes — and moves the record to its final
 * status. `decisionReason` is required for anything other than approving.
 */
export async function decideVerification<T extends HasVerification>(
  model: Model<T>,
  entityId: string,
  decision: VerificationDecision,
  decidedById: string,
  opts: { inspectionNotes?: string; decisionReason?: string } = {},
): Promise<T> {
  const entity = await model.findById(entityId);
  if (!entity) throw new NotFoundError('Record');

  if (decision !== 'active' && !opts.decisionReason) {
    throw new BadRequestError('decisionReason is required when not approving');
  }

  const statusMap: Record<VerificationDecision, VerificationStatus> = {
    active: VerificationStatus.ACTIVE,
    rejected: VerificationStatus.REJECTED,
    suspended: VerificationStatus.SUSPENDED,
    inactive: VerificationStatus.INACTIVE,
  };

  entity.verification.status = statusMap[decision];
  entity.verification.decidedAt = new Date();
  entity.verification.decidedBy = new Types.ObjectId(decidedById);
  if (opts.inspectionNotes) {
    entity.verification.inspectionNotes = opts.inspectionNotes;
    entity.verification.inspectedAt = new Date();
  }
  if (opts.decisionReason) entity.verification.decisionReason = opts.decisionReason;

  await entity.save();
  return entity;
}
