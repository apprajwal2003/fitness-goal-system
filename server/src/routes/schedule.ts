import { Router } from 'express';
import {
  getDaySchedule,
  updateBusySlots,
  recalculateSchedule,
  markComplete,
  getRange,
  getStats,
  getDashboard,
} from '../controllers/scheduleController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/day', getDaySchedule);
router.get('/range', getRange);
router.get('/stats', getStats);
router.get('/dashboard', getDashboard);
router.put('/busy', updateBusySlots);
router.post('/recalculate', recalculateSchedule);
router.post('/complete', markComplete);

export { router as scheduleRouter };
