/**
 * User Controller – Profile management
 */
import sharp from 'sharp';
import User from '../models/User.js';
import LostItem from '../models/LostItem.js';
import FoundItem from '../models/FoundItem.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id || req.user._id);
  if (!user) throw new ApiError(404, 'User not found.');
  res.json(new ApiResponse(200, user.toPublicJSON()));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, bio, phone, locationCity, locationState, locationCountry } = req.body;

  const updates = {};
  if (name) updates.name = name;
  if (bio !== undefined)  updates.bio = bio;
  if (phone) updates.phone = phone;
  if (locationCity || locationState || locationCountry) {
    updates.location = { city: locationCity, state: locationState, country: locationCountry };
  }

  // Avatar upload
  if (req.file) {
    const processed = await sharp(req.file.buffer)
      .resize(200, 200, { fit: 'cover' })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Delete old avatar
    if (req.user.avatar?.publicId) {
      await deleteFromCloudinary(req.user.avatar.publicId);
    }

    const result = await uploadToCloudinary(processed, { folder: 'findit/avatars' });
    updates.avatar = { url: result.secure_url, publicId: result.public_id };
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json(new ApiResponse(200, user.toPublicJSON(), 'Profile updated.'));
});

export const updateSettings = asyncHandler(async (req, res) => {
  const { emailNotifications, pushNotifications, matchAlerts, profileVisibility } = req.body;
  const updates = {};
  if (emailNotifications !== undefined) updates['settings.emailNotifications'] = emailNotifications;
  if (pushNotifications  !== undefined) updates['settings.pushNotifications']  = pushNotifications;
  if (matchAlerts        !== undefined) updates['settings.matchAlerts']        = matchAlerts;
  if (profileVisibility)               updates['settings.profileVisibility']  = profileVisibility;

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
  res.json(new ApiResponse(200, user.toPublicJSON(), 'Settings updated.'));
});

export const getUserActivity = asyncHandler(async (req, res) => {
  const userId = req.params.id || req.user._id;
  const [lostItems, foundItems] = await Promise.all([
    LostItem.find({ reportedBy: userId }).sort({ createdAt: -1 }).limit(5).lean(),
    FoundItem.find({ reportedBy: userId }).sort({ createdAt: -1 }).limit(5).lean(),
  ]);
  res.json(new ApiResponse(200, { lostItems, foundItems }));
});
