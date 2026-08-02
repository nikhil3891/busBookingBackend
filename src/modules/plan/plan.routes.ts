import { Router } from 'express';
import { planController } from './plan.controller';
import { authenticate, requireRoles } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { createPlanSchema, updatePlanSchema } from './plan.validation';
import { Role } from '../../core/types';

const router = Router();

// Public — the pricing page (1/3/6/12-month options) reads from here
router.get('/', planController.listActive.bind(planController));
router.get('/:id', planController.getById.bind(planController));

// super_admin — sets/edits what each plan costs and includes
router.get('/admin/all', authenticate, requireRoles(Role.SUPER_ADMIN), planController.listAll.bind(planController));
router.post('/', authenticate, requireRoles(Role.SUPER_ADMIN), validate(createPlanSchema), planController.create.bind(planController));
router.put('/:id', authenticate, requireRoles(Role.SUPER_ADMIN), validate(updatePlanSchema), planController.update.bind(planController));
router.delete('/:id', authenticate, requireRoles(Role.SUPER_ADMIN), planController.deactivate.bind(planController));

export default router;
