import { Router } from 'express';
import { busController } from './bus.controller';
import { authenticate, authorize, requireRoles } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { createBusSchema, updateBusSchema, searchBusSchema } from './bus.validation';
import { Permission, Role } from '../../core/types';

const router = Router();

// Public routes
router.get('/', validate(searchBusSchema, 'query'), busController.search.bind(busController));
router.get('/:id', busController.getById.bind(busController));
router.get('/:id/seats', busController.getAvailableSeats.bind(busController));

// Authenticated operator/admin routes
router.post(
  '/',
  authenticate,
  requireRoles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN),
  validate(createBusSchema),
  busController.create.bind(busController),
);

router.put(
  '/:id',
  authenticate,
  requireRoles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN),
  validate(updateBusSchema),
  busController.update.bind(busController),
);

router.delete(
  '/:id',
  authenticate,
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
  busController.remove.bind(busController),
);

export default router;
