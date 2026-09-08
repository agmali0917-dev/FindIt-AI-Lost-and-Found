/**
 * User Model
 * Supports roles: guest, user, admin
 * JWT refresh tokens, email verification, password reset
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    // ─── Basic Info ─────────────────────────────────────────────────────────
    name: {
      type:      String,
      required:  [true, 'Name is required'],
      trim:      true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type:      String,
      required:  function() { return this.authProvider === 'local'; },
      minlength: [8, 'Password must be at least 8 characters'],
      select:    false, // Never return in queries by default
    },
    phone: {
      type:  String,
      trim:  true,
    },

    // ─── Role & Status ──────────────────────────────────────────────────────
    role: {
      type:    String,
      enum:    ['user', 'admin'],
      default: 'user',
    },
    authProvider: {
      type:    String,
      enum:    ['local', 'google'],
      default: 'local',
    },
    googleId: {
      type:    String,
      unique:  true,
      sparse:  true,
    },
    isEmailVerified: {
      type:    Boolean,
      default: false,
    },
    isBanned: {
      type:    Boolean,
      default: false,
    },
    banReason: String,

    // ─── Profile ─────────────────────────────────────────────────────────────
    avatar: {
      url:      { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    bio: {
      type:      String,
      maxlength: [200, 'Bio cannot exceed 200 characters'],
    },
    location: {
      city:    String,
      state:   String,
      country: String,
    },

    // ─── Auth Tokens ──────────────────────────────────────────────────────────
    refreshToken: {
      type:   String,
      select: false,
    },
    verificationOtpHash: {
      type:   String,
      select: false,
    },
    verificationOtpExpiresAt: {
      type:   Date,
      select: false,
    },
    verificationOtpLastSentAt: {
      type:   Date,
      select: false,
    },
    verificationOtpAttempts: {
      type:   Number,
      default: 0,
    },
    passwordResetToken: {
      type:   String,
      select: false,
    },
    passwordResetExpires: {
      type:   Date,
      select: false,
    },

    // ─── Stats ───────────────────────────────────────────────────────────────
    stats: {
      lostItemsReported:  { type: Number, default: 0 },
      foundItemsReported: { type: Number, default: 0 },
      successfulMatches:  { type: Number, default: 0 },
    },

    // ─── Settings ─────────────────────────────────────────────────────────────
    settings: {
      emailNotifications:    { type: Boolean, default: true },
      pushNotifications:     { type: Boolean, default: true },
      matchAlerts:           { type: Boolean, default: true },
      profileVisibility:     { type: String, enum: ['public', 'private'], default: 'public' },
    },

    // ─── Activity ─────────────────────────────────────────────────────────────
    lastActiveAt: {
      type:    Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON:  { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1 });

// ─── Virtuals ─────────────────────────────────────────────────────────────────
userSchema.virtual('avatarUrl').get(function () {
  return this.avatar?.url || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(this.name)}&backgroundColor=4f46e5&textColor=ffffff`;
});

// ─── Pre-save Hook: Hash Password ─────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Methods ──────────────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.verificationOtpHash;
  delete obj.verificationOtpExpiresAt;
  delete obj.verificationOtpLastSentAt;
  delete obj.verificationOtpAttempts;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.googleId;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
