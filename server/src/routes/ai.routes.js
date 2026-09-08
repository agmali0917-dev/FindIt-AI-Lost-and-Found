import { Router } from 'express';
import { autoFillDetails } from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/multer.js';
import { itemCreateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// /api/ai/auto-fill
router.post('/auto-fill', protect, itemCreateLimiter, uploadSingle, autoFillDetails);

export default router;
