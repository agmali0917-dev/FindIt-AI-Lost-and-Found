/**
 * Chat & Message Models
 * Real-time chat between lost item owner and found item reporter
 */

import mongoose from 'mongoose';

// ─── Message Schema ───────────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema(
  {
    chat: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Chat',
      required: true,
      index:    true,
    },
    sender: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    content: {
      type:      String,
      trim:      true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    // Optional image attachment
    image: {
      url:      String,
      publicId: String,
    },
    // Message type
    type: {
      type:    String,
      enum:    ['text', 'image', 'system'],
      default: 'text',
    },
    // Read receipts
    readBy: [{
      user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      readAt: { type: Date, default: Date.now },
    }],
    isDeleted: {
      type:    Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON:  { virtuals: true },
    toObject: { virtuals: true },
  }
);

messageSchema.index({ chat: 1, createdAt: -1 });

// ─── Chat Schema ──────────────────────────────────────────────────────────────
const chatSchema = new mongoose.Schema(
  {
    // Participants (always 2 users for item chats)
    participants: [{
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    }],

    // Associated match
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Match',
    },

    // Associated items
    lostItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'LostItem',
    },
    foundItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'FoundItem',
    },

    // Last message for preview
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Message',
    },
    lastMessageAt: {
      type:    Date,
      default: Date.now,
    },

    // Unread counts per participant
    unreadCount: {
      type: Map,
      of:   Number,
      default: {},
    },

    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON:  { virtuals: true },
    toObject: { virtuals: true },
  }
);

chatSchema.index({ participants: 1 });
chatSchema.index({ lastMessageAt: -1 });
chatSchema.index({ match: 1 });

export const Message = mongoose.model('Message', messageSchema);
export const Chat = mongoose.model('Chat', chatSchema);
