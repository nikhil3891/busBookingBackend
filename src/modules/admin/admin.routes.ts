import { Router } from 'express';
import { adminController } from './admin.controller';
import { validate } from '../../core/middlewares/validate.middleware';
import { authenticate, requireRoles } from '../../core/middlewares/auth.middleware';
import { updateDriverVerificationStatusSchema } from './admin.validation';
import { Role } from '../../core/types';

const router = Router();

// Admin actions
router.post(
	'/drivers/verify',
	authenticate,
	requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.Manager),
	validate(updateDriverVerificationStatusSchema),
	adminController.updateDriverVerificationStatus.bind(adminController),
);

export default router;
