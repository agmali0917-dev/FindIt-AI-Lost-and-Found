/**
 * Found Item Controller
 * CRUD + Cloudinary upload + QR + AI matching trigger
 */

import sharp from 'sharp';
import axios from 'axios';
import FoundItem from '../models/FoundItem.js';
import LostItem from '../models/LostItem.js';
import Match from '../models/Match.js';
import Notification from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import { generateItemQR } from '../utils/generateQR.js';
import { sendMatchNotificationEmail } from '../utils/sendEmail.js';
import { io } from '../index.js';
import { sendSocketNotification } from '../config/socket.js';

// ─── Image Processing ──────────────────────────────────────────────────────────
const processAndUploadImages = async (files, folder = 'findit/found-items') => {
  const uploadedImages = [];
  for (const file of files) {
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

// ─── AI Matching Trigger ──────────────────────────────────────────────────────
/**
 * Triggers AI matching in the background after a found item is created.
 * Fetches all active lost items in the same category and sends them to the AI service.
 */
const triggerAIMatching = async (foundItem) => {
  try {
    console.log(`🤖 Starting AI matching for found item: ${foundItem._id}`);

    await FoundItem.findByIdAndUpdate(foundItem._id, { aiMatchingStatus: 'processing' });

    // Fetch candidate lost items (same category, active, within last 90 days)
    const candidates = await LostItem.find({
      category: foundItem.category,
      status:   'active',
      lostDate: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
    }).populate('reportedBy', 'name email settings').lean();

    if (!candidates.length) {
      console.log('No candidates found for matching.');
      await FoundItem.findByIdAndUpdate(foundItem._id, {
        aiMatchingStatus:       'completed',
        aiMatchingCompletedAt:  new Date(),
      });
      return;
    }

    // Build AI service request
    const aiRequest = {
      found_item_id:         foundItem._id.toString(),
      found_image_urls:      foundItem.images.map(img => img.url),
      found_title:           foundItem.title,
      found_category:        foundItem.category,
      found_brand:           foundItem.brand || '',
      found_color:           foundItem.color || '',
      found_description:     foundItem.description,
      lost_item_candidates: candidates.map(c => ({
        item_id:    c._id.toString(),
        image_urls: c.images.map(img => img.url),
        title:      c.title,
        category:   c.category,
        brand:      c.brand || '',
        color:      c.color || '',
        description: c.description,
      })),
      threshold: parseFloat(process.env.AI_MATCH_THRESHOLD) || 0.85,
    };

    // Call AI service
    const response = await axios.post(
      `${process.env.AI_SERVICE_URL}/match`,
      aiRequest,
      { timeout: 120000 } // 2 min timeout
    );

    const { matches } = response.data;
    const confirmedMatches = matches.filter(m => m.is_match);

    console.log(`✅ AI matching complete: ${confirmedMatches.length} matches found`);

    // Create Match records and notify users
    const candidateMap = Object.fromEntries(candidates.map(c => [c._id.toString(), c]));

    for (const matchResult of confirmedMatches) {
      const lostItem = candidateMap[matchResult.item_id];
      if (!lostItem) continue;

      // Check if match already exists
      const existingMatch = await Match.findOne({
        lostItem:  lostItem._id,
        foundItem: foundItem._id,
      });
      if (existingMatch) continue;

      // Create match
      const match = await Match.create({
        lostItem:       lostItem._id,
        foundItem:      foundItem._id,
        lostItemOwner:  lostItem.reportedBy._id,
        foundItemOwner: foundItem.reportedBy,
        similarityScore: matchResult.similarity_score,
      });

      // Create in-app notification
      const notification = await Notification.create({
        recipient: lostItem.reportedBy._id,
        type:      'match_found',
        title:     '🎉 Potential match found!',
        message:   `AI found a ${Math.round(matchResult.similarity_score * 100)}% match for "${lostItem.title}"`,
        data: {
          lostItemId:  lostItem._id,
          foundItemId: foundItem._id,
          matchId:     match._id,
          url:         `/matches/${match._id}`,
        },
        priority: 'high',
      });

      // Send real-time notification via Socket.io
      sendSocketNotification(io, lostItem.reportedBy._id.toString(), notification);

      // Send email notification if enabled
      if (lostItem.reportedBy.settings?.emailNotifications !== false) {
        sendMatchNotificationEmail(
          lostItem.reportedBy,
          foundItem,
          lostItem,
          matchResult.similarity_score
        ).catch(console.error);
      }

      await Match.findByIdAndUpdate(match._id, {
        notificationSent: { email: true, inApp: true },
      });
    }

    // Update LostItem status if high-confidence match
    for (const matchResult of confirmedMatches) {
      if (matchResult.similarity_score >= 0.95) {
        await LostItem.findByIdAndUpdate(matchResult.item_id, { status: 'matched' });
      }
    }

    // Mark matching as complete
    await FoundItem.findByIdAndUpdate(foundItem._id, {
      aiMatchingStatus:       'completed',
      aiMatchingCompletedAt:  new Date(),
    });

  } catch (error) {
    console.error('❌ AI matching failed:', error.message);
    await FoundItem.findByIdAndUpdate(foundItem._id, { aiMatchingStatus: 'failed' });
  }
};

// ─── Create Found Item ────────────────────────────────────────────────────────
export const createFoundItem = asyncHandler(async (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) {
    throw new ApiError(400, 'At least one image is required.');
  }

  const {
    title, category, brand, color, description, foundDate,
    locationLat, locationLng, locationAddress, locationCity,
    locationState, locationCountry, handoverLocation, contactPreference,
  } = req.body;

  const images = await processAndUploadImages(files);

  const foundItem = await FoundItem.create({
    reportedBy: req.user._id,
    title, category, brand, color, description,
    foundDate: new Date(foundDate),
    images,
    location: {
      type:        'Point',
      coordinates: [parseFloat(locationLng), parseFloat(locationLat)],
      address:     locationAddress,
      city:        locationCity,
      state:       locationState,
      country:     locationCountry,
    },
    handoverLocation,
    contactPreference,
  });

  // Generate QR
  const { url, qrDataUrl } = await generateItemQR(foundItem._id, 'found');
  foundItem.qrCode = { url, dataUrl: qrDataUrl };
  await foundItem.save({ validateBeforeSave: false });

  // Update user stats
  await req.user.updateOne({ $inc: { 'stats.foundItemsReported': 1 } });

  // 🤖 Trigger AI matching ASYNCHRONOUSLY (don't block response)
  setImmediate(() => triggerAIMatching(foundItem));

  await foundItem.populate('reportedBy', 'name avatar avatarUrl');

  res.status(201).json(new ApiResponse(201, foundItem,
    'Found item reported! AI matching started. You\'ll be notified of any matches.'
  ));
});

// ─── Get All Found Items ──────────────────────────────────────────────────────
export const getFoundItems = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 12,
    category, color, brand, status = 'active',
    startDate, endDate,
    lat, lng, maxDistance,
    sortBy = 'createdAt', order = 'desc',
  } = req.query;

  const query = {};
  if (category) query.category = category;
  if (color)    query.color    = { $regex: color, $options: 'i' };
  if (brand)    query.brand    = { $regex: brand, $options: 'i' };
  if (status)   query.status   = status;

  if (startDate || endDate) {
    query.foundDate = {};
    if (startDate) query.foundDate.$gte = new Date(startDate);
    if (endDate)   query.foundDate.$lte = new Date(endDate);
  }

  if (lat && lng) {
    const distance = parseFloat(maxDistance) || 50;
    query.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: distance * 1000,
      },
    };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: order === 'asc' ? 1 : -1 };

  const [items, total] = await Promise.all([
    FoundItem.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('reportedBy', 'name avatar avatarUrl')
      .lean(),
    FoundItem.countDocuments(query),
  ]);

  res.json(new ApiResponse(200, {
    items,
    pagination: {
      page: parseInt(page), limit: parseInt(limit), total,
      totalPages: Math.ceil(total / parseInt(limit)),
      hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
      hasPrev: parseInt(page) > 1,
    },
  }));
});

// ─── Get Single Found Item ────────────────────────────────────────────────────
export const getFoundItemById = asyncHandler(async (req, res) => {
  const item = await FoundItem.findById(req.params.id)
    .populate('reportedBy', 'name avatar avatarUrl bio stats');

  if (!item) throw new ApiError(404, 'Found item not found.');
  await FoundItem.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

  res.json(new ApiResponse(200, item));
});

// ─── Update Found Item ────────────────────────────────────────────────────────
export const updateFoundItem = asyncHandler(async (req, res) => {
  const item = await FoundItem.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Found item not found.');

  if (item.reportedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'You can only update your own found items.');
  }

  const allowedUpdates = ['title', 'category', 'brand', 'color', 'description', 'foundDate', 'status', 'handoverLocation', 'contactPreference'];
  const updates = {};
  for (const key of allowedUpdates) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (req.files?.length) {
    const newImages = await processAndUploadImages(req.files);
    updates.$push = { images: { $each: newImages } };
  }

  const updated = await FoundItem.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
    .populate('reportedBy', 'name avatar avatarUrl');

  res.json(new ApiResponse(200, updated, 'Found item updated.'));
});

// ─── Delete Found Item ────────────────────────────────────────────────────────
export const deleteFoundItem = asyncHandler(async (req, res) => {
  const item = await FoundItem.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Found item not found.');

  if (item.reportedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'Unauthorized.');
  }

  for (const img of item.images) await deleteFromCloudinary(img.publicId);
  await FoundItem.findByIdAndDelete(req.params.id);
  await req.user.updateOne({ $inc: { 'stats.foundItemsReported': -1 } });

  res.json(new ApiResponse(200, null, 'Found item deleted.'));
});

// ─── Get My Found Items ───────────────────────────────────────────────────────
export const getMyFoundItems = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const query = { reportedBy: req.user._id };
  if (status) query.status = status;

  const [items, total] = await Promise.all([
    FoundItem.find(query).sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit)),
    FoundItem.countDocuments(query),
  ]);

  res.json(new ApiResponse(200, { items, pagination: { page: parseInt(page), limit: parseInt(limit), total } }));
});
