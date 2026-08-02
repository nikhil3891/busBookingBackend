import { Router } from 'express';
import { grievanceController } from './grievance.controller';
import { authenticate, authorize, requireRoles } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import {
  createGrievanceSchema,
  addMessageSchema,
  updateGrievanceStatusSchema,
  listGrievancesSchema,
} from './grievance.validation';
import { Permission, Role } from '../../core/types';

const router = Router();

// Passenger — raise a ticket (optionally linked to a booking) and track it
router.post('/', authenticate, validate(createGrievanceSchema), grievanceController.create.bind(grievanceController));
router.get('/mine', authenticate, validate(listGrievancesSchema, 'query'), grievanceController.listMine.bind(grievanceController));

// Staff — the queue (operator/admin/manager/super_admin), gated by permission
router.get(
  '/',
  authenticate,
  authorize(Permission.READ_ALL_GRIEVANCES),
  validate(listGrievancesSchema, 'query'),
  grievanceController.listForStaff.bind(grievanceController),
);

router.get('/:id', authenticate, grievanceController.getById.bind(grievanceController));
router.post('/:id/messages', authenticate, validate(addMessageSchema), grievanceController.addMessage.bind(grievanceController));

router.patch(
  '/:id/status',
  authenticate,
  authorize(Permission.RESOLVE_GRIEVANCE),
  validate(updateGrievanceStatusSchema),
  grievanceController.updateStatus.bind(grievanceController),
);

export default router;
