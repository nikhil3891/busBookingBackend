import { Router } from 'express';
import { notificationController } from './notification.controller';
import { authenticate, requireRoles } from '../../core/middlewares/auth.middleware';
import { Role } from '../../core/types';

const router = Router();

router.use(authenticate);

router.get('/', notificationController.list.bind(notificationController));
router.patch('/:id/read', notificationController.markAsRead.bind(notificationController));

// Admin/Operator
router.post(
  '/',
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.OPERATOR),
  notificationController.create.bind(notificationController),
);
router.delete(
  '/:id',
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
  notificationController.delete.bind(notificationController),
);

export default router;
