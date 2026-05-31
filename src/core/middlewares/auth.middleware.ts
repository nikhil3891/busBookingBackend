import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { ForbiddenError, UnauthorizedError } from '../errors/AppError';
import { Permission, ROLE_PERMISSIONS, Role, AuthenticatedRequest } from '../types';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  passport.authenticate(
    'jwt',
    { session: false },
    (err: Error | null, user: AuthenticatedRequest['user'] | false) => {
      if (err) return next(err);
      if (!user) return next(new UnauthorizedError('Invalid or expired token'));
      req.user = user as AuthenticatedRequest['user'];
      next();
    },
  )(req, res, next);
}

export function authorize(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return next(new UnauthorizedError());

    const userPermissions = ROLE_PERMISSIONS[user.role as Role] ?? [];
    const hasAll = permissions.every((p) => userPermissions.includes(p));

    if (!hasAll) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
}

export function requireRoles(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return next(new UnauthorizedError());
    if (!roles.includes(user.role as Role)) {
      return next(new ForbiddenError('Role not allowed'));
    }
    next();
  };
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  passport.authenticate('jwt', { session: false }, (_err: Error | null, user: AuthenticatedRequest['user'] | false) => {
    if (user) req.user = user as AuthenticatedRequest['user'];
    next();
  })(req, res, next);
}
