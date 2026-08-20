/**
 * Lost Item Routes
 */
import { Router } from 'express';
import {
  createLostItem, getLostItems, getLostItemById,
  updateLostItem, deleteLostItem, getMyLostItems, deleteLostItemImage,
} from '../controllers/lostItem.controller.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { uploadMultiple } from '../middleware/multer.js';
import { itemCreateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/',           optionalAuth, getLostItems);
router.get('/my',         protect,      getMyLostItems);
router.get('/:id',        optionalAuth, getLostItemById);
router.post('/',          protect, itemCreateLimiter, uploadMultiple, createLostItem);
router.put('/:id',        protect, uploadMultiple, updateLostItem);
router.delete('/:id',     protect, deleteLostItem);
router.delete('/:id/images/:imagePublicId', protect, deleteLostItemImage);

export default router;
