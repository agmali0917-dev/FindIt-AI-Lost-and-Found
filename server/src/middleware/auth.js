/**
 * Authentication Middleware
 * Verifies JWT access token and attaches user to request
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Protect routes – requires valid JWT
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check Authorization header
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new ApiError(401, 'Access token required. Please log in.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = await User.findById(decoded.id).select('-password -refreshToken');

    if (!req.user) {
      throw new ApiError(401, 'User not found. Token may be invalid.');
    }

    if (req.user.isBanned) {
      throw new ApiError(403, 'Your account has been suspended. Contact support.');
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Access token expired. Please refresh your token.');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, 'Invalid access token.');
    }
    throw error;
  }
});

/**
 * Restrict to specific roles
 * @param {...string} roles - Allowed roles
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, `Access denied. Required role: ${roles.join(' or ')}`);
    }
    next();
  };
};

/**
 * Optional auth – attaches user if token is present but doesn't require it
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      req.user = await User.findById(decoded.id).select('-password -refreshToken');
    } catch {
      // Token invalid but optional, continue without user
    }
  }

  next();
});
