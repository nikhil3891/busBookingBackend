import { adminRepository } from './admin.repository';
import { Role } from '../../core/types';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../core/errors/AppError';
import { UpdateDriverVerificationStatusDto } from './admin.types';

export class AdminService {
  async updateDriverVerificationStatus(
    dto: UpdateDriverVerificationStatusDto,
    reviewedById: string,
  ): Promise<{ message: string }> {
    const reviewer = await adminRepository.findById(reviewedById);
    if (!reviewer) throw new NotFoundError('Reviewer');
    if (![Role.ADMIN, Role.SUPER_ADMIN, Role.Manager].includes(reviewer.role as Role)) {
      throw new ForbiddenError('Only admin, super admin, or manager can review drivers');
    }

    const user = await adminRepository.findById(dto.userId);
    if (!user) throw new NotFoundError('User');
    if (user.role !== Role.Driver) {
      throw new BadRequestError('Only driver accounts can be reviewed');
    }

    user.verificationStatus = dto.status;
    user.verifiedBy = reviewer._id;
    user.isVerified = dto.status === 'approved';

    await adminRepository.save(user);

    return { message: `Driver ${dto.status} successfully` };
  }
}

export const adminService = new AdminService();
