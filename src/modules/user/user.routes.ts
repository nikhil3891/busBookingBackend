import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate, authorize, requireRoles } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { updateProfileSchema } from './user.validation';
import { Permission, Role } from '../../core/types';

const router = Router();

router.use(authenticate);

router.get('/me', userController.getProfile.bind(userController));
router.put('/me', validate(updateProfileSchema), userController.updateProfile.bind(userController));

// Admin only
router.get('/', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), userController.listUsers.bind(userController));
router.patch('/:userId/deactivate', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), userController.deactivateUser.bind(userController));
router.patch('/:userId/activate', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), userController.activateUser.bind(userController));

export default router;
