import { User } from '../../user/user.model';
import { adminService } from '../admin.service';

describe('AdminService', () => {
  describe('updateDriverVerificationStatus()', () => {
    it('approves a driver account for privileged roles', async () => {
      const reviewer = await User.create({
        phone: '9876543215',
        password: 'correct_password',
        role: 'admin',
        isVerified: true,
        profileCompleted: true,
      });
      const driver = await User.create({
        phone: '9876543216',
        role: 'driver',
        isVerified: true,
        profileCompleted: true,
      });

      const result = await adminService.updateDriverVerificationStatus(
        { userId: driver.id, status: 'approved' },
        reviewer.id,
      );

      expect(result.message).toContain('approved');
      const updatedDriver = await User.findById(driver.id);
      expect(updatedDriver?.verificationStatus).toBe('approved');
      expect(updatedDriver?.verifiedBy?.toString()).toBe(reviewer.id);
    });
  });
});
