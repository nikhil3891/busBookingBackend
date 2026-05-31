import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../core/middlewares/validate.middleware';
import { authenticate, requireRoles } from '../../core/middlewares/auth.middleware';
import { authRateLimiter, strictRateLimiter } from '../../core/middlewares/rate-limit.middleware';
import {
  sendOtpSchema,
  verifyOtpSchema,
  completeRegistrationSchema,
  refreshTokenSchema,
  adminLoginSchema,
  createAdminSchema,
} from './auth.validation';
import { Role } from '../../core/types';

const router = Router();

// ─── Public ────────────────────────────────────────────────────────────────
router.post('/send-otp', authRateLimiter, validate(sendOtpSchema), authController.sendOtp.bind(authController));
router.post('/verify-otp', authRateLimiter, validate(verifyOtpSchema), authController.verifyOtp.bind(authController));
router.post('/complete-registration', validate(completeRegistrationSchema), authController.completeRegistration.bind(authController));
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken.bind(authController));

// ─── Authenticated ─────────────────────────────────────────────────────────
router.post('/logout', authenticate, authController.logout.bind(authController));
router.post('/logout-all', authenticate, authController.logoutAllDevices.bind(authController));

// ─── Admin Panel ───────────────────────────────────────────────────────────
router.post('/admin/login', strictRateLimiter, validate(adminLoginSchema), authController.adminLogin.bind(authController));
router.post(
  '/admin/create',
  authenticate,
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
  validate(createAdminSchema),
  authController.createAdmin.bind(authController),
);

export default router;
