/**
 * Notification Model
 * In-app notifications for matches, messages, and system events
 */

import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    // ─── Recipient ─────────────────────────────────────────────────────────
    recipient: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    // ─── Type & Content ───────────────────────────────────────────────────
    type: {
      type:     String,
      required: true,
      enum: [
        'match_found',        // AI found a match
        'match_confirmed',    // Match was confirmed by user
        'match_rejected',     // Match was rejected
        'item_returned',      // Item successfully returned
        'new_message',        // New chat message
        'item_verified',      // Admin verified the item
        'item_expired',       // Item auto-expired
        'new_found_nearby',   // New found item reported near a lost item
        'system',             // System notification
      ],
    },
    title: {
      type:     String,
      required: true,
    },
    message: {
      type:     String,
      required: true,
    },

    // ─── References ───────────────────────────────────────────────────────
    // What this notification is about
    data: {
      lostItemId:  { type: mongoose.Schema.Types.ObjectId, ref: 'LostItem' },
      foundItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoundItem' },
      matchId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
      chatId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
      userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      url:         String,
    },

    // ─── Status ───────────────────────────────────────────────────────────
    isRead: {
      type:    Boolean,
      default: false,
      index:   true,
    },
    readAt: Date,

    // ─── Icon / Priority ──────────────────────────────────────────────────
    icon:     String,
    priority: {
      type:    String,
      enum:    ['low', 'normal', 'high'],
      default: 'normal',
    },
  },
  {
    timestamps: true,
    toJSON:  { virtuals: true },
    toObject: { virtuals: true },
  }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // TTL: 30 days

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
