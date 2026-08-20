import { Router } from 'express';
import {
  getDashboardStats, getUsers, banUser, unbanUser, promoteToAdmin, deleteUser,
  getAllItems, verifyItem, deleteItem, featureItem,
} from '../controllers/admin.controller.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = Router();
router.use(protect, restrictTo('admin'));

// Dashboard
router.get('/stats', getDashboardStats);

// Users
router.get('/users',              getUsers);
router.put('/users/:id/ban',      banUser);
router.put('/users/:id/unban',    unbanUser);
router.put('/users/:id/promote',  promoteToAdmin);
router.delete('/users/:id',       deleteUser);

// Items
router.get('/items',              getAllItems);
router.put('/items/:id/verify',   verifyItem);
router.put('/items/:id/feature',  featureItem);
router.delete('/items/:id',       deleteItem);

export default router;
