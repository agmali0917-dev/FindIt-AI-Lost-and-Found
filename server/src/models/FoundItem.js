/**
 * FoundItem Model
 * Stores all details about a reported found item
 * Triggers AI matching when created
 */

import mongoose from 'mongoose';

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
}, { _id: false });

const foundItemSchema = new mongoose.Schema(
  {
    // ─── Reporter ────────────────────────────────────────────────────────────
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
    color:       { type: String, trim: true },
    description: {
      type:      String,
      required:  [true, 'Description is required'],
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },

    // ─── Date ────────────────────────────────────────────────────────────────
    foundDate: {
      type:     Date,
      required: [true, 'Found date is required'],
    },

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

    // ─── Handover Details ─────────────────────────────────────────────────────
    handoverLocation: String,
    contactPreference: {
      type:    String,
      enum:    ['chat', 'email', 'phone'],
      default: 'chat',
    },

    // ─── Status ───────────────────────────────────────────────────────────────
    status: {
      type:    String,
      enum:    ['active', 'matched', 'returned', 'expired'],
      default: 'active',
      index:   true,
    },
    isVerified: {
      type:    Boolean,
      default: false,
    },

    // ─── QR Code ─────────────────────────────────────────────────────────────
    qrCode: {
      url:     String,
      dataUrl: String,
    },

    // ─── AI ──────────────────────────────────────────────────────────────────
    aiMatchingStatus: {
      type:    String,
      enum:    ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    aiMatchingCompletedAt: Date,

    // ─── Engagement ─────────────────────────────────────────────────────────
    views: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject:  { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
foundItemSchema.index({ location: '2dsphere' });
foundItemSchema.index({ category: 1, status: 1 });
foundItemSchema.index({ reportedBy: 1, status: 1 });
foundItemSchema.index({ createdAt: -1 });
foundItemSchema.index(
  { title: 'text', description: 'text', brand: 'text', color: 'text' },
  { name: 'found_item_text_search', weights: { title: 10, brand: 5, description: 3, color: 2 } }
);

foundItemSchema.virtual('thumbnail').get(function () {
  return this.images?.[0]?.url || null;
});

const FoundItem = mongoose.model('FoundItem', foundItemSchema);
export default FoundItem;
