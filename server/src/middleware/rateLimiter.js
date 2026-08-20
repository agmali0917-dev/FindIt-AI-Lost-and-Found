/**
 * Rate Limiter Middleware
 * Protects against brute force and DoS attacks
 */

import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/ApiError.js';

const createLimiter = (options) => rateLimit({
  windowMs:          options.windowMs || 15 * 60 * 1000, // 15 min
  max:               options.max || 100,
  message:           options.message || 'Too many requests, please try again later.',
  standardHeaders:   true,
  legacyHeaders:     false,
  handler: (req, res, next, options) => {
    throw new ApiError(429, options.message);
  },
  ...options,
});

// Global limiter for all routes
export const globalRateLimiter = createLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX) || 200,
  message:  'Too many requests from this IP, please try again later.',
});

// Strict limiter for auth routes
export const authRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  'Too many authentication attempts. Please wait 15 minutes.',
});

// Item creation limiter
export const itemCreateLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max:      20,
  message:  'Too many items created. Please wait before creating more.',
});

// Search limiter
export const searchRateLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 minute
  max:      30,
  message:  'Too many search requests. Please slow down.',
});
