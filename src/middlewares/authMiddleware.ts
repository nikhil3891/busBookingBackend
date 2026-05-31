// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import passport from 'passport';

export const jwtAuth = passport.authenticate('jwt', { session: false });

export function requireRole(role: 'admin' | 'operator' | 'user') {
  return (req: any, res: any, next: any) => {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (user.role !== role && role !== 'user') return res.status(403).json({ success: false, message: 'Forbidden' });
    next();
  };
}

// For endpoints requiring a logged-in user
export const isAuth = passport.authenticate('jwt', { session: false });

// role guard factory
export const isRole = (role: 'admin' | 'operator' | 'user') => {
  return (req: Request, res: Response, next: NextFunction) => {
    // passport attaches user to req.user
    const user = req.user as any;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (user.role !== role) return res.status(403).json({ success: false, message: 'Forbidden' });
    next();
  };
};
