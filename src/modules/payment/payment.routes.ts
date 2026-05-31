import { Router } from 'express';
import { paymentController } from './payment.controller';
import { authenticate, requireRoles } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { initiatePaymentSchema, verifyPaymentSchema, refundSchema } from './payment.validation';
import { Role } from '../../core/types';

const router = Router();

router.use(authenticate);

router.post('/initiate', validate(initiatePaymentSchema), paymentController.initiate.bind(paymentController));
router.post('/verify', validate(verifyPaymentSchema), paymentController.verify.bind(paymentController));
router.get('/:id', paymentController.getPayment.bind(paymentController));
router.post(
  '/:id/refund',
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
  validate(refundSchema),
  paymentController.refund.bind(paymentController),
);

export default router;
