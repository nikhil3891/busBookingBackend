import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service';
import { AuthenticatedRequest, Permission } from '../../core/types';

export class UserController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.getProfile((req as AuthenticatedRequest).user.id);
      res.json({ success: true, data: { user } });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.updateProfile(
        (req as AuthenticatedRequest).user.id,
        req.body,
      );
      res.json({ success: true, data: { user } });
    } catch (err) {
      next(err);
    }
  }

  async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const page = parseInt((req.query['page'] as string) ?? '1', 10);
      const limit = parseInt((req.query['limit'] as string) ?? '20', 10);
      const result = await userService.listUsers(authReq.tenantId, page, limit);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async deactivateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      await userService.deactivateUser(req.params['userId']!, authReq.user.id);
      res.json({ success: true, data: { message: 'User deactivated' } });
    } catch (err) {
      next(err);
    }
  }

  async activateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await userService.activateUser(req.params['userId']!);
      res.json({ success: true, data: { message: 'User activated' } });
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();
