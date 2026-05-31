import { Router } from 'express';
import { bookingController } from './booking.controller';
import { authenticate, requireRoles } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { createBookingSchema, cancelBookingSchema, listBookingSchema } from './booking.validation';
import { Role } from '../../core/types';

const router = Router();

router.use(authenticate);

router.post('/', validate(createBookingSchema), bookingController.create.bind(bookingController));
router.get('/my', validate(listBookingSchema, 'query'), bookingController.getMyBookings.bind(bookingController));
router.get('/:id', bookingController.getBooking.bind(bookingController));
router.patch('/:id/cancel', validate(cancelBookingSchema), bookingController.cancel.bind(bookingController));

// Admin/Operator
router.get(
  '/',
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.OPERATOR),
  validate(listBookingSchema, 'query'),
  bookingController.listAll.bind(bookingController),
);

export default router;
