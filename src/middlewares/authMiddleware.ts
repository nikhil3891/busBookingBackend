// src/middlewares/auth.middleware.ts
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
