import { Router } from 'express';
import {
  createSquad,
  joinSquad,
  joinSquadByCode,
  getMySquad,
  getLeaderboard,
} from '../controllers/squadsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.post('/', createSquad);
router.get('/me', getMySquad);
router.post('/join-by-code', joinSquadByCode);
router.post('/:squadId/join', joinSquad);
router.get('/leaderboard', getLeaderboard);

export { router as squadsRouter };
