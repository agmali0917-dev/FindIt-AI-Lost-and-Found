/**
 * Admin Controller
 * Dashboard, user management, item management, analytics
 */

import User from '../models/User.js';
import LostItem from '../models/LostItem.js';
import FoundItem from '../models/FoundItem.js';
import Match from '../models/Match.js';
import Notification from '../models/Notification.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers, newUsersThisMonth,
    totalLostItems, activeLostItems,
    totalFoundItems, activeFoundItems,
    totalMatches, confirmedMatches,
    successRate,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
    LostItem.countDocuments(),
    LostItem.countDocuments({ status: 'active' }),
    FoundItem.countDocuments(),
    FoundItem.countDocuments({ status: 'active' }),
    Match.countDocuments(),
    Match.countDocuments({ status: 'confirmed' }),
    Match.countDocuments({ status: 'returned' }),
  ]);

  // Monthly trend (last 6 months)
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end   = new Date(d.getFullYear(), d.getMonth() + 1, 1);

    const [lost, found, matches] = await Promise.all([
      LostItem.countDocuments({ createdAt: { $gte: start, $lt: end } }),
      FoundItem.countDocuments({ createdAt: { $gte: start, $lt: end } }),
      Match.countDocuments({ createdAt: { $gte: start, $lt: end } }),
    ]);

    months.push({
      month:   start.toLocaleString('default', { month: 'short' }),
      lost, found, matches,
    });
  }

  // Category breakdown
  const categoryBreakdown = await LostItem.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort:  { count: -1 } },
    { $limit: 8 },
  ]);

  res.json(new ApiResponse(200, {
    overview: {
      totalUsers, newUsersThisMonth,
      totalLostItems, activeLostItems,
      totalFoundItems, activeFoundItems,
      totalMatches, confirmedMatches,
      returnedItems: successRate,
      successRate: totalMatches > 0 ? ((successRate / totalMatches) * 100).toFixed(1) : 0,
    },
    monthlyTrend:      months,
    categoryBreakdown: categoryBreakdown.map(c => ({ category: c._id, count: c.count })),
  }, 'Admin dashboard stats'));
});

// ─── Manage Users ─────────────────────────────────────────────────────────────
export const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, role, isBanned } = req.query;
  const query = {};
  if (search)   query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
  if (role)     query.role = role;
  if (isBanned !== undefined) query.isBanned = isBanned === 'true';

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit)),
    User.countDocuments(query),
  ]);

  res.json(new ApiResponse(200, {
    users,
    pagination: { page: parseInt(page), limit: parseInt(limit), total },
  }));
});

export const banUser = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { isBanned: true, banReason: reason }, { new: true });
  if (!user) throw new ApiError(404, 'User not found.');
  res.json(new ApiResponse(200, user, 'User banned.'));
});

export const unbanUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isBanned: false, $unset: { banReason: '' } }, { new: true });
  if (!user) throw new ApiError(404, 'User not found.');
  res.json(new ApiResponse(200, user, 'User unbanned.'));
});

export const promoteToAdmin = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { role: 'admin' }, { new: true });
  if (!user) throw new ApiError(404, 'User not found.');
  res.json(new ApiResponse(200, user, 'User promoted to admin.'));
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  res.json(new ApiResponse(200, null, 'User deleted.'));
});

// ─── Manage Items ─────────────────────────────────────────────────────────────
export const getAllItems = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type = 'lost', status, category } = req.query;
  const Model = type === 'found' ? FoundItem : LostItem;
  const query = {};
  if (status)   query.status   = status;
  if (category) query.category = category;

  const [items, total] = await Promise.all([
    Model.find(query).sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('reportedBy', 'name email avatar'),
    Model.countDocuments(query),
  ]);

  res.json(new ApiResponse(200, { items, pagination: { page: parseInt(page), limit: parseInt(limit), total } }));
});

export const verifyItem = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const Model = type === 'found' ? FoundItem : LostItem;
  const item = await Model.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true });
  if (!item) throw new ApiError(404, 'Item not found.');
  res.json(new ApiResponse(200, item, 'Item verified.'));
});

export const deleteItem = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const Model = type === 'found' ? FoundItem : LostItem;
  const item = await Model.findByIdAndDelete(req.params.id);
  if (!item) throw new ApiError(404, 'Item not found.');
  res.json(new ApiResponse(200, null, 'Item deleted.'));
});

export const featureItem = asyncHandler(async (req, res) => {
  const item = await LostItem.findByIdAndUpdate(req.params.id, { isFeatured: true }, { new: true });
  if (!item) throw new ApiError(404, 'Item not found.');
  res.json(new ApiResponse(200, item, 'Item featured.'));
});
