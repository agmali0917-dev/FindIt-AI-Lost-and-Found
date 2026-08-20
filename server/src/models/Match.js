/**
 * Match Model
 * Records AI-generated matches between lost and found items
 * Similarity score from CLIP embeddings
 */

import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema(
  {
    // ─── Items ────────────────────────────────────────────────────────────────
    lostItem: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'LostItem',
      required: true,
      index:    true,
    },
    foundItem: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'FoundItem',
      required: true,
      index:    true,
    },

    // ─── Owners ───────────────────────────────────────────────────────────────
    lostItemOwner: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    foundItemOwner: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    // ─── AI Score ─────────────────────────────────────────────────────────────
    similarityScore: {
      type:    Number,
      min:     0,
      max:     1,
      required: true,
    },
    // Confidence category based on score
    confidence: {
      type: String,
      enum: ['low', 'medium', 'high', 'very_high'],
    },

    // ─── Status & Workflow ────────────────────────────────────────────────────
    status: {
      type:    String,
      enum:    ['pending', 'confirmed', 'rejected', 'returned'],
      default: 'pending',
      index:   true,
    },

    // ─── Review ───────────────────────────────────────────────────────────────
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
    },
    reviewedAt:   Date,
    reviewNotes:  String,

    // ─── Notification Tracking ────────────────────────────────────────────────
    notificationSent: {
      email:  { type: Boolean, default: false },
      inApp:  { type: Boolean, default: false },
    },

    // ─── Chat ────────────────────────────────────────────────────────────────
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Chat',
    },
  },
  {
    timestamps: true,
    toJSON:  { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
matchSchema.index({ lostItem: 1, foundItem: 1 }, { unique: true });
matchSchema.index({ lostItemOwner: 1 });
matchSchema.index({ foundItemOwner: 1 });
matchSchema.index({ similarityScore: -1 });
matchSchema.index({ createdAt: -1 });

// ─── Pre-save: Set Confidence ─────────────────────────────────────────────────
matchSchema.pre('save', function (next) {
  if (this.isModified('similarityScore')) {
    const score = this.similarityScore;
    if (score >= 0.95)      this.confidence = 'very_high';
    else if (score >= 0.90) this.confidence = 'high';
    else if (score >= 0.85) this.confidence = 'medium';
    else                    this.confidence = 'low';
  }
  next();
});

const Match = mongoose.model('Match', matchSchema);
export default Match;
