/**
 * Auth Controller
 * Handles: register, login, logout, email verification,
 *          forgot/reset password, refresh token
 */

import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  generateAccessToken,
  generateRefreshToken,
  generateSecureToken,
  hashToken,
  setTokenCookies,
  clearTokenCookies,
} from '../utils/generateToken.js';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from '../utils/sendEmail.js';
import jwt from 'jsonwebtoken';

// ─── Google Auth ──────────────────────────────────────────────────────────────
export const googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  if (!credential) throw new ApiError(400, 'Google credential is required.');

  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  
  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (error) {
    throw new ApiError(401, 'Invalid Google token.');
  }

  const { sub: googleId, email, name, picture } = payload;
  if (!email) throw new ApiError(400, 'Google account has no email associated.');

  const normalizedEmail = email.toLowerCase().trim();
  let user = await User.findOne({ email: normalizedEmail }).select('+refreshToken');

  if (user) {
    // Check ban
    if (user.isBanned) {
      throw new ApiError(403, `Account suspended. ${user.banReason || 'Contact support.'}`);
    }
    
    // Link google account if not linked
    if (!user.googleId) {
      user.googleId = googleId;
      user.isEmailVerified = true;
      await user.save({ validateBeforeSave: false });
    } else if (user.googleId !== googleId) {
      throw new ApiError(400, 'This email is already linked to a different Google account.');
    }
  } else {
    // Create new user
    user = await User.create({
      name,
      email: normalizedEmail,
      googleId,
      authProvider: 'google',
      isEmailVerified: true,
      avatar: { url: picture, publicId: '' }
    });
  }

  // Generate tokens
  const accessToken  = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = hashToken(refreshToken);
  user.lastActiveAt = new Date();
  await user.save({ validateBeforeSave: false });

  setTokenCookies(res, accessToken, refreshToken);

  res.json(new ApiResponse(200, {
    user:         user.toPublicJSON(),
    accessToken,
    refreshToken,
  }, 'Logged in with Google successfully.'));
});

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required.');
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Find user with password
  const user = await User.findOne({ email: normalizedEmail }).select('+password +refreshToken');

  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  // Check ban
  if (user.isBanned) {
    throw new ApiError(403, `Account suspended. ${user.banReason || 'Contact support.'}`);
  }

  // Check email verification
  if (!user.isEmailVerified) {
    return res.status(403).json(new ApiResponse(403, { 
      requiresVerification: true,
      email: user.email 
    }, 'Please verify your email before logging in.'));
  }

  // Generate tokens
  const accessToken  = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save hashed refresh token
  user.refreshToken = hashToken(refreshToken);
  user.lastActiveAt = new Date();
  await user.save({ validateBeforeSave: false });

  // Set cookies
  setTokenCookies(res, accessToken, refreshToken);

  res.json(new ApiResponse(200, {
    user:         user.toPublicJSON(),
    accessToken,
    refreshToken,
  }, 'Logged in successfully.'));
});

// ─── Refresh Token ────────────────────────────────────────────────────────────
export const refreshToken = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingToken) {
    throw new ApiError(401, 'Refresh token required.');
  }

  let decoded;
  try {
    decoded = jwt.verify(incomingToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token. Please log in again.');
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user) throw new ApiError(401, 'User not found.');

  // Verify stored refresh token
  const hashedIncoming = hashToken(incomingToken);
  if (user.refreshToken !== hashedIncoming) {
    throw new ApiError(401, 'Refresh token reuse detected. Please log in again.');
  }

  // Rotate tokens
  const newAccessToken  = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshToken = hashToken(newRefreshToken);
  await user.save({ validateBeforeSave: false });

  setTokenCookies(res, newAccessToken, newRefreshToken);

  res.json(new ApiResponse(200, {
    accessToken:  newAccessToken,
    refreshToken: newRefreshToken,
  }, 'Tokens refreshed successfully.'));
});

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logout = asyncHandler(async (req, res) => {
  // Clear refresh token from DB
  await User.findByIdAndUpdate(req.user._id, {
    $unset: { refreshToken: '' },
  });

  clearTokenCookies(res);
  res.json(new ApiResponse(200, null, 'Logged out successfully.'));
});

// ─── Forgot Password ──────────────────────────────────────────────────────────
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond with success to prevent email enumeration
  if (!user) {
    return res.json(new ApiResponse(200, null, 'If an account exists with this email, a reset link has been sent.'));
  }

  const resetToken = generateSecureToken();
  user.passwordResetToken   = hashToken(resetToken);
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save({ validateBeforeSave: false });

  await sendPasswordResetEmail(user, resetToken);

  res.json(new ApiResponse(200, null, 'Password reset link sent to your email.'));
});

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPassword = asyncHandler(async (req, res) => {
  const { token }    = req.params;
  const { password } = req.body;

  const hashedToken = hashToken(token);
  const user = await User.findOne({
    passwordResetToken:   hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, 'Password reset token is invalid or has expired.');
  }

  user.password             = password;
  user.passwordResetToken   = undefined;
  user.passwordResetExpires = undefined;
  user.refreshToken         = undefined;
  await user.save();

  clearTokenCookies(res);
  res.json(new ApiResponse(200, null, 'Password reset successfully. Please log in with your new password.'));
});

// ─── Get Current User ─────────────────────────────────────────────────────────
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json(new ApiResponse(200, user.toPublicJSON(), 'Current user'));
});

// ─── Change Password (authenticated) ─────────────────────────────────────────
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const isValid = await user.comparePassword(currentPassword);
  if (!isValid) throw new ApiError(401, 'Current password is incorrect.');

  user.password = newPassword;
  await user.save();

  res.json(new ApiResponse(200, null, 'Password changed successfully.'));
});
