import { Router } from 'express';
import { getProfile, updateProfile, updateSettings, getUserActivity } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/multer.js';

const router = Router();
router.get('/me',              protect, getProfile);
router.put('/me',              protect, uploadSingle, updateProfile);
router.put('/me/settings',     protect, updateSettings);
router.get('/me/activity',     protect, getUserActivity);
router.get('/:id',             getProfile);
router.get('/:id/activity',    getUserActivity);
export default router;
