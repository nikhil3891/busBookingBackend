import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { AuthenticatedRequest } from '../../core/types';
import { UnauthorizedError } from '../../core/errors/AppError';

export class AuthController {
  async sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.sendOtp((((req as Request & { __validated?: Record<string, unknown> }).__validated?.body ?? req.body) as { phone: string }));
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.verifyOtp((((req as Request & { __validated?: Record<string, unknown> }).__validated?.body ?? req.body) as never));
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async completeRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.completeRegistration((((req as Request & { __validated?: Record<string, unknown> }).__validated?.body ?? req.body) as never));
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tokens = await authService.refreshAccessToken((((req as Request & { __validated?: Record<string, unknown> }).__validated?.body ?? req.body) as never));
      res.json({ success: true, data: tokens });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const { refreshToken } = ((((req as Request & { __validated?: Record<string, unknown> }).__validated?.body ?? req.body) as { refreshToken?: string }));
      if (!refreshToken) throw new UnauthorizedError('refreshToken is required');
      await authService.logout(authReq.user.id, refreshToken);
      res.json({ success: true, data: { message: 'Logged out successfully' } });
    } catch (err) {
      next(err);
    }
  }

  async logoutAllDevices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      await authService.logoutAllDevices(authReq.user.id);
      res.json({ success: true, data: { message: 'Logged out from all devices' } });
    } catch (err) {
      next(err);
    }
  }

  async adminLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.adminLogin((((req as Request & { __validated?: Record<string, unknown> }).__validated?.body ?? req.body) as never));
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async createAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const result = await authService.createAdminUser((((req as Request & { __validated?: Record<string, unknown> }).__validated?.body ?? req.body) as never), authReq.user.id);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async operatorLogin(req: Request, res: Response, next: NextFunction): Promise<void>{
    try {
      const result = await authService.operatorLogin((((req as Request & { __validated?: Record<string, unknown> }).__validated?.body ?? req.body) as never));
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
