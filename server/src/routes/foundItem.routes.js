/**
 * Found Item Routes
 */
import { Router } from 'express';
import {
  createFoundItem, getFoundItems, getFoundItemById,
  updateFoundItem, deleteFoundItem, getMyFoundItems,
} from '../controllers/foundItem.controller.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { uploadMultiple } from '../middleware/multer.js';
import { itemCreateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/',       optionalAuth, getFoundItems);
router.get('/my',     protect,      getMyFoundItems);
router.get('/:id',    optionalAuth, getFoundItemById);
router.post('/',      protect, itemCreateLimiter, uploadMultiple, createFoundItem);
router.put('/:id',    protect, uploadMultiple, updateFoundItem);
router.delete('/:id', protect, deleteFoundItem);

export default router;
