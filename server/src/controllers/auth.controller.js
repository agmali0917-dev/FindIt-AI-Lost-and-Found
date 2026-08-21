/**
 * Auth Controller
 * Handles: register, login, logout, email verification,
 *          forgot/reset password, refresh token
 */

import crypto from 'crypto';
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

// ─── Register ─────────────────────────────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  // Generate email verification token
  const verificationToken = generateSecureToken();
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    phone,
    emailVerificationToken: hashToken(verificationToken),
    emailVerificationExpires: verificationExpires,
  });

  // Send verification email (don't block response on email failure)
  sendVerificationEmail(user, verificationToken).catch((err) => {
    console.error('Failed to send verification email:', err.message);
  });

  res.status(201).json(
    new ApiResponse(201, {
      user: user.toPublicJSON(),
      message: 'Verification email sent',
    }, 'Account created! Please check your email to verify your account.')
  );
});

// ─── Verify Email ─────────────────────────────────────────────────────────────
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    emailVerificationToken:   hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, 'Email verification token is invalid or has expired.');
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  // Send welcome email
  sendWelcomeEmail(user).catch(console.error);

  res.json(new ApiResponse(200, null, 'Email verified successfully! You can now log in.'));
});

// ─── Resend Verification Email ────────────────────────────────────────────────
export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email }).select('+emailVerificationToken');

  if (!user) throw new ApiError(404, 'No account found with this email.');
  if (user.isEmailVerified) throw new ApiError(400, 'Email is already verified.');

  const verificationToken = generateSecureToken();
  user.emailVerificationToken = hashToken(verificationToken);
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  await sendVerificationEmail(user, verificationToken);
  res.json(new ApiResponse(200, null, 'Verification email resent.'));
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
    throw new ApiError(403, 'Please verify your email before logging in.', [{
      field: 'email',
      message: 'Email not verified',
    }]);
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
