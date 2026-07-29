import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service';
import { AuthenticatedRequest } from '../../core/types';
import { UpdateDriverVerificationStatusDto } from './admin.types';

export class AdminController {
  async updateDriverVerificationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const dto = req.body as UpdateDriverVerificationStatusDto;
      const result = await adminService.updateDriverVerificationStatus(dto, authReq.user.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
