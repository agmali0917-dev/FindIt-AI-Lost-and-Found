/**
 * LostItem Model
 * Stores all details about a reported lost item
 * GeoJSON location for geo-spatial queries
 */

import mongoose from 'mongoose';

// ─── Shared Sub-schemas ────────────────────────────────────────────────────────
const imageSchema = new mongoose.Schema({
  url:      { type: String, required: true },
  publicId: { type: String, required: true },
  width:    Number,
  height:   Number,
}, { _id: false });

const locationSchema = new mongoose.Schema({
  type: {
    type:    String,
    enum:    ['Point'],
    default: 'Point',
  },
  coordinates: {
    type:     [Number], // [longitude, latitude]
    required: true,
  },
  address: String,
  city:    String,
  state:   String,
  country: String,
  placeId: String,    // For future Google Maps integration
}, { _id: false });

// ─── Main Schema ──────────────────────────────────────────────────────────────
const lostItemSchema = new mongoose.Schema(
  {
    // ─── Owner ───────────────────────────────────────────────────────────────
    reportedBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    // ─── Core Details ─────────────────────────────────────────────────────────
    title: {
      type:      String,
      required:  [true, 'Title is required'],
      trim:      true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    category: {
      type:     String,
      required: [true, 'Category is required'],
      enum: [
        'Electronics', 'Clothing', 'Accessories', 'Bags & Wallets',
        'Keys', 'Documents', 'Jewelry', 'Sports & Outdoors',
        'Books & Stationery', 'Toys & Games', 'Musical Instruments',
        'Vehicles', 'Pets', 'Other',
      ],
    },
    brand: {
      type:      String,
      trim:      true,
      maxlength: [50, 'Brand cannot exceed 50 characters'],
    },
    color: {
      type:  String,
      trim:  true,
    },
    description: {
      type:      String,
      required:  [true, 'Description is required'],
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },

    // ─── Date & Time ─────────────────────────────────────────────────────────
    lostDate: {
      type:     Date,
      required: [true, 'Lost date is required'],
    },
    lostTime: String, // e.g. "14:30"

    // ─── Images ──────────────────────────────────────────────────────────────
    images: {
      type:     [imageSchema],
      validate: {
        validator: (v) => v.length > 0,
        message:   'At least one image is required',
      },
    },

    // ─── Location ─────────────────────────────────────────────────────────────
    location: {
      type:     locationSchema,
      required: [true, 'Location is required'],
    },

    // ─── Reward ──────────────────────────────────────────────────────────────
    reward: {
      offered:  { type: Boolean, default: false },
      amount:   { type: Number, min: 0, default: 0 },
      currency: { type: String, default: 'USD' },
    },

    // ─── Status & Workflow ────────────────────────────────────────────────────
    status: {
      type:    String,
      enum:    ['active', 'matched', 'returned', 'expired', 'deleted'],
      default: 'active',
      index:   true,
    },
    isVerified: {
      type:    Boolean,
      default: false,
    },
    isFeatured: {
      type:    Boolean,
      default: false,
    },

    // ─── QR Code ─────────────────────────────────────────────────────────────
    qrCode: {
      url:      String,
      dataUrl:  String,
    },

    // ─── AI Data ──────────────────────────────────────────────────────────────
    aiEmbedding: {
      type:   [Number],  // CLIP embedding vector (512 dims for ViT-B/32)
      select: false,      // Don't return in regular queries
    },

    // ─── Engagement ─────────────────────────────────────────────────────────
    views: {
      type:    Number,
      default: 0,
    },
    expiresAt: {
      type:  Date,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON:  { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
lostItemSchema.index({ location: '2dsphere' });
lostItemSchema.index({ category: 1, status: 1 });
lostItemSchema.index({ reportedBy: 1, status: 1 });
lostItemSchema.index({ createdAt: -1 });
lostItemSchema.index({ lostDate: -1 });
lostItemSchema.index(
  { title: 'text', description: 'text', brand: 'text', color: 'text' },
  { name: 'lost_item_text_search', weights: { title: 10, brand: 5, description: 3, color: 2 } }
);

// ─── Pre-save: Set expiry ─────────────────────────────────────────────────────
lostItemSchema.pre('save', function (next) {
  if (!this.expiresAt) {
    // Auto-expire after 90 days
    const expiry = new Date(this.lostDate || this.createdAt);
    expiry.setDate(expiry.getDate() + 90);
    this.expiresAt = expiry;
  }
  next();
});

// ─── Virtual: thumbnail ───────────────────────────────────────────────────────
lostItemSchema.virtual('thumbnail').get(function () {
  return this.images?.[0]?.url || null;
});

const LostItem = mongoose.model('LostItem', lostItemSchema);
export default LostItem;
