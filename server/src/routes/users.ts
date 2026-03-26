import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/usersController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

export { router as usersRouter };
