import { Router } from 'express';
import { getMyMatches, getMatchById, confirmMatch, rejectMatch } from '../controllers/match.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);
router.get('/',        getMyMatches);
router.get('/:id',     getMatchById);
router.post('/:id/confirm', confirmMatch);
router.post('/:id/reject',  rejectMatch);
export default router;
