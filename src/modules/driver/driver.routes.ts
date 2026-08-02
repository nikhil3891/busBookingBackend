import { Router } from 'express';
import { driverController } from './driver.controller';
import { authenticate, authorize, requireRoles } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { createDriverSchema, updateDriverSchema, listDriversSchema } from './driver.validation';
import { decideVerificationSchema, assignManagerSchema } from '../tenant/tenant.validation';
import { Permission, Role } from '../../core/types';

const router = Router();

router.get(
  '/',
  authenticate,
  requireRoles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER),
  validate(listDriversSchema, 'query'),
  driverController.list.bind(driverController),
);

router.get('/:id', authenticate, driverController.getById.bind(driverController));

router.post(
  '/',
  authenticate,
  requireRoles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN),
  validate(createDriverSchema),
  driverController.create.bind(driverController),
);

router.put(
  '/:id',
  authenticate,
  requireRoles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN),
  validate(updateDriverSchema),
  driverController.update.bind(driverController),
);

router.post(
  '/:id/assign-manager',
  authenticate,
  authorize(Permission.ASSIGN_VERIFICATION_MANAGER),
  validate(assignManagerSchema),
  driverController.assignManager.bind(driverController),
);

router.post(
  '/:id/decide',
  authenticate,
  authorize(Permission.REVIEW_VERIFICATION),
  validate(decideVerificationSchema),
  driverController.decide.bind(driverController),
);

export default router;
