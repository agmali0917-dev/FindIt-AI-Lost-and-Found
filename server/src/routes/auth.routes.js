/**
 * Auth Routes
 * POST /api/auth/register
 * POST /api/auth/login
 * POST /api/auth/logout
 * GET  /api/auth/verify-email/:token
 * POST /api/auth/resend-verification
 * POST /api/auth/forgot-password
 * POST /api/auth/reset-password/:token
 * POST /api/auth/refresh-token
 * GET  /api/auth/me
 * PUT  /api/auth/change-password
 */

import { Router } from 'express';
import {
  register,
  verifyEmail,
  resendVerificationEmail,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  changePassword,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public routes (rate limited)
router.post('/register',            authRateLimiter, register);
router.post('/login',               authRateLimiter, login);
router.get('/verify-email/:token',                   verifyEmail);
router.post('/resend-verification', authRateLimiter, resendVerificationEmail);
router.post('/forgot-password',     authRateLimiter, forgotPassword);
router.post('/reset-password/:token',                resetPassword);
router.post('/refresh-token',                        refreshToken);

// Protected routes
router.post('/logout',         protect, logout);
router.get('/me',              protect, getMe);
router.put('/change-password', protect, changePassword);

export default router;
