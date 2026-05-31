// src/routes/bus.routes.ts
import { Router } from 'express';
import * as busCtrl from '../controllers/busController';
import { isAuth, isRole } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', busCtrl.listBuses); // public: list/search by date/from/to
router.get('/:id', busCtrl.getBus);

// admin/operator protected CRUD
router.post('/add-bus',
    //  isAuth, isRole('admin'),
      busCtrl.createBus);
router.put('/:id', isAuth, isRole('admin'), busCtrl.updateBus);
router.delete('/:id', isAuth, isRole('admin'), busCtrl.deleteBus);

export default router;
