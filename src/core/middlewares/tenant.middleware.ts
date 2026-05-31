import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

/**
 * Extracts tenantId from:
 * 1. Subdomain: tenant1.busbooking.com → tenant1
 * 2. Header: X-Tenant-Id
 * 3. JWT payload (set after auth middleware)
 * 4. Query param (dev only)
 */
export function tenantMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authReq = req as AuthenticatedRequest;

  // From authenticated user's tenantId
  if (authReq.user?.tenantId) {
    authReq.tenantId = authReq.user.tenantId;
    return next();
  }

  // From custom header
  const headerTenant = req.headers['x-tenant-id'] as string | undefined;
  if (headerTenant) {
    authReq.tenantId = headerTenant;
    return next();
  }

  // From subdomain (host: tenant.yourdomain.com)
  const host = req.hostname;
  const parts = host.split('.');
  if (parts.length >= 3) {
    authReq.tenantId = parts[0];
    return next();
  }

  // From query param (development convenience only)
  if (process.env.NODE_ENV !== 'production' && req.query['tenantId']) {
    authReq.tenantId = req.query['tenantId'] as string;
  }

  next();
}
