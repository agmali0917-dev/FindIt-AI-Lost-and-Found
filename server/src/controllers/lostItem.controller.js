/**
 * Lost Item Controller
 * CRUD + image upload + QR generation + AI matching trigger
 */

import sharp from 'sharp';
import LostItem from '../models/LostItem.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import { generateItemQR } from '../utils/generateQR.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Process and upload images to Cloudinary
 */
const processAndUploadImages = async (files, folder = 'findit/lost-items') => {
  const uploadedImages = [];

  for (const file of files) {
    // Compress & resize with Sharp
    const processed = await sharp(file.buffer)
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    const result = await uploadToCloudinary(processed, { folder });

    uploadedImages.push({
      url:      result.secure_url,
      publicId: result.public_id,
      width:    result.width,
      height:   result.height,
    });
  }

  return uploadedImages;
};

// ─── Create Lost Item ─────────────────────────────────────────────────────────
export const createLostItem = asyncHandler(async (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) {
    throw new ApiError(400, 'At least one image is required.');
  }

  const {
    title, category, brand, color, description,
    lostDate, lostTime,
    locationLat, locationLng, locationAddress, locationCity, locationState, locationCountry,
    rewardOffered, rewardAmount, rewardCurrency,
  } = req.body;

  // Upload images to Cloudinary
  const images = await processAndUploadImages(files);

  // Create item
  const lostItem = await LostItem.create({
    reportedBy: req.user._id,
    title, category, brand, color, description,
    lostDate: new Date(lostDate),
    lostTime,
    images,
    location: {
      type:        'Point',
      coordinates: [parseFloat(locationLng), parseFloat(locationLat)],
      address:     locationAddress,
      city:        locationCity,
      state:       locationState,
      country:     locationCountry,
    },
    reward: {
      offered:  rewardOffered === 'true',
      amount:   parseFloat(rewardAmount) || 0,
      currency: rewardCurrency || 'USD',
    },
  });

  // Generate QR code
  const { url, qrDataUrl } = await generateItemQR(lostItem._id, 'lost');
  lostItem.qrCode = { url, dataUrl: qrDataUrl };
  await lostItem.save({ validateBeforeSave: false });

  // Update user stats
  req.user.stats.lostItemsReported += 1;
  await req.user.save({ validateBeforeSave: false });

  await lostItem.populate('reportedBy', 'name avatar avatarUrl');

  res.status(201).json(new ApiResponse(201, lostItem, 'Lost item reported successfully.'));
});

// ─── Get All Lost Items (with pagination & filters) ───────────────────────────
export const getLostItems = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 12,
    category, color, brand, status = 'active',
    startDate, endDate,
    lat, lng, maxDistance, // km
    sortBy = 'createdAt', order = 'desc',
  } = req.query;

  const query = {};

  // Filters
  if (category) query.category = category;
  if (color)    query.color    = { $regex: color, $options: 'i' };
  if (brand)    query.brand    = { $regex: brand, $options: 'i' };
  if (status)   query.status   = status;

  if (startDate || endDate) {
    query.lostDate = {};
    if (startDate) query.lostDate.$gte = new Date(startDate);
    if (endDate)   query.lostDate.$lte = new Date(endDate);
  }

  // Geo query
  if (lat && lng) {
    const distance = parseFloat(maxDistance) || 50; // default 50km
    query.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: distance * 1000, // convert to meters
      },
    };
  }

  const skip  = (parseInt(page) - 1) * parseInt(limit);
  const sort  = { [sortBy]: order === 'asc' ? 1 : -1 };

  const [items, total] = await Promise.all([
    LostItem.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('reportedBy', 'name avatar avatarUrl')
      .lean(),
    LostItem.countDocuments(query),
  ]);

  res.json(new ApiResponse(200, {
    items,
    pagination: {
      page:       parseInt(page),
      limit:      parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      hasNext:    parseInt(page) < Math.ceil(total / parseInt(limit)),
      hasPrev:    parseInt(page) > 1,
    },
  }, 'Lost items retrieved.'));
});

// ─── Get Single Lost Item ─────────────────────────────────────────────────────
export const getLostItemById = asyncHandler(async (req, res) => {
  const item = await LostItem.findById(req.params.id)
    .populate('reportedBy', 'name avatar avatarUrl bio stats');

  if (!item) throw new ApiError(404, 'Lost item not found.');

  // Increment view count
  await LostItem.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

  res.json(new ApiResponse(200, item, 'Lost item retrieved.'));
});

// ─── Update Lost Item ─────────────────────────────────────────────────────────
export const updateLostItem = asyncHandler(async (req, res) => {
  const item = await LostItem.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Lost item not found.');

  // Authorization check
  if (item.reportedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'You can only update your own lost items.');
  }

  const allowedUpdates = [
    'title', 'category', 'brand', 'color', 'description',
    'lostDate', 'lostTime', 'status',
    'reward.offered', 'reward.amount',
  ];

  const updates = {};
  for (const key of allowedUpdates) {
    const val = key.includes('.') ? req.body[key.split('.')[1]] : req.body[key];
    if (val !== undefined) updates[key] = val;
  }

  // Handle new image uploads
  if (req.files?.length) {
    const newImages = await processAndUploadImages(req.files);
    updates.$push = { images: { $each: newImages } };
  }

  const updated = await LostItem.findByIdAndUpdate(
    req.params.id, updates, { new: true, runValidators: true }
  ).populate('reportedBy', 'name avatar avatarUrl');

  res.json(new ApiResponse(200, updated, 'Lost item updated.'));
});

// ─── Delete Lost Item ─────────────────────────────────────────────────────────
export const deleteLostItem = asyncHandler(async (req, res) => {
  const item = await LostItem.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Lost item not found.');

  if (item.reportedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'You can only delete your own lost items.');
  }

  // Delete images from Cloudinary
  for (const img of item.images) {
    await deleteFromCloudinary(img.publicId);
  }

  await LostItem.findByIdAndDelete(req.params.id);

  // Update user stats
  await req.user.updateOne({ $inc: { 'stats.lostItemsReported': -1 } });

  res.json(new ApiResponse(200, null, 'Lost item deleted.'));
});

// ─── Get My Lost Items ─────────────────────────────────────────────────────────
export const getMyLostItems = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const query = { reportedBy: req.user._id };
  if (status) query.status = status;

  const [items, total] = await Promise.all([
    LostItem.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit)),
    LostItem.countDocuments(query),
  ]);

  res.json(new ApiResponse(200, {
    items,
    pagination: { page: parseInt(page), limit: parseInt(limit), total },
  }));
});

// ─── Delete Image from Lost Item ──────────────────────────────────────────────
export const deleteLostItemImage = asyncHandler(async (req, res) => {
  const { id, imagePublicId } = req.params;
  const item = await LostItem.findById(id);
  if (!item) throw new ApiError(404, 'Lost item not found.');

  if (item.reportedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Unauthorized');
  }

  if (item.images.length <= 1) {
    throw new ApiError(400, 'Cannot delete the last image. Add a new image first.');
  }

  await deleteFromCloudinary(decodeURIComponent(imagePublicId));
  item.images = item.images.filter(img => img.publicId !== decodeURIComponent(imagePublicId));
  await item.save();

  res.json(new ApiResponse(200, item, 'Image deleted.'));
});
