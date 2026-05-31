import { Router } from 'express';
import * as notifyCtrl from '../controllers/notificationController';
import { isAuth, isRole } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', isAuth, notifyCtrl.getNotifications);
router.post('/', isAuth, isRole('admin'), notifyCtrl.createNotification);

export default router;
