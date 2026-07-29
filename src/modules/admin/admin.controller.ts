import { Request, Response, NextFunction } from 'express';
import { authService } from '../auth/auth.service';
import { AuthenticatedRequest } from '../../core/types';

export class AdminController {
  async updateDriverVerificationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { userId, status } = req.body as { userId: string; status: 'pending' | 'approved' | 'rejected' };
      const result = await authService.updateVerificationStatus(userId, status, authReq.user.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
