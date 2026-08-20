/**
 * Match Controller
 * View, confirm, reject matches between lost and found items
 */

import Match from '../models/Match.js';
import Notification from '../models/Notification.js';
import { Chat } from '../models/Chat.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { io } from '../index.js';
import { sendSocketNotification } from '../config/socket.js';

// ─── Get Matches for Current User ─────────────────────────────────────────────
export const getMyMatches = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const query = {
    $or: [{ lostItemOwner: req.user._id }, { foundItemOwner: req.user._id }],
  };
  if (status) query.status = status;

  const [matches, total] = await Promise.all([
    Match.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('lostItem',       'title images location category')
      .populate('foundItem',      'title images location category')
      .populate('lostItemOwner',  'name avatar avatarUrl')
      .populate('foundItemOwner', 'name avatar avatarUrl'),
    Match.countDocuments(query),
  ]);

  res.json(new ApiResponse(200, {
    matches,
    pagination: { page: parseInt(page), limit: parseInt(limit), total },
  }));
});

// ─── Get Single Match ─────────────────────────────────────────────────────────
export const getMatchById = asyncHandler(async (req, res) => {
  const match = await Match.findById(req.params.id)
    .populate('lostItem')
    .populate('foundItem')
    .populate('lostItemOwner',  'name avatar avatarUrl phone')
    .populate('foundItemOwner', 'name avatar avatarUrl phone')
    .populate('chat');

  if (!match) throw new ApiError(404, 'Match not found.');

  // Authorization: only involved users or admin can view
  const isInvolved =
    match.lostItemOwner._id.toString() === req.user._id.toString() ||
    match.foundItemOwner._id.toString() === req.user._id.toString();

  if (!isInvolved && req.user.role !== 'admin') {
    throw new ApiError(403, 'You are not authorized to view this match.');
  }

  res.json(new ApiResponse(200, match));
});

// ─── Confirm Match ────────────────────────────────────────────────────────────
export const confirmMatch = asyncHandler(async (req, res) => {
  const match = await Match.findById(req.params.id)
    .populate('lostItemOwner',  'name settings')
    .populate('foundItemOwner', 'name settings');

  if (!match) throw new ApiError(404, 'Match not found.');
  if (match.status !== 'pending') throw new ApiError(400, 'This match has already been reviewed.');

  // Only the lost item owner can confirm
  if (match.lostItemOwner._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Only the lost item owner can confirm a match.');
  }

  match.status     = 'confirmed';
  match.reviewedBy = req.user._id;
  match.reviewedAt = new Date();
  match.reviewNotes = req.body.notes || '';

  // Create a chat for the two users if none exists
  let chat = await Chat.findOne({
    participants: { $all: [match.lostItemOwner._id, match.foundItemOwner._id] },
    match:        match._id,
  });

  if (!chat) {
    chat = await Chat.create({
      participants: [match.lostItemOwner._id, match.foundItemOwner._id],
      match:        match._id,
      lostItem:     match.lostItem,
      foundItem:    match.foundItem,
    });
  }

  match.chat = chat._id;
  await match.save();

  // Notify found item owner
  const notification = await Notification.create({
    recipient: match.foundItemOwner._id,
    type:      'match_confirmed',
    title:     '✅ Match confirmed!',
    message:   `${match.lostItemOwner.name} confirmed your match. You can now chat!`,
    data: {
      matchId: match._id,
      chatId:  chat._id,
      url:     `/chats/${chat._id}`,
    },
    priority: 'high',
  });

  sendSocketNotification(io, match.foundItemOwner._id.toString(), notification);

  res.json(new ApiResponse(200, { match, chatId: chat._id }, 'Match confirmed! Chat started.'));
});

// ─── Reject Match ─────────────────────────────────────────────────────────────
export const rejectMatch = asyncHandler(async (req, res) => {
  const match = await Match.findById(req.params.id)
    .populate('foundItemOwner', 'name settings');

  if (!match) throw new ApiError(404, 'Match not found.');
  if (match.status !== 'pending') throw new ApiError(400, 'Match already reviewed.');

  if (match.lostItemOwner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Only the lost item owner can reject a match.');
  }

  match.status      = 'rejected';
  match.reviewedBy  = req.user._id;
  match.reviewedAt  = new Date();
  match.reviewNotes = req.body.reason || '';
  await match.save();

  const notification = await Notification.create({
    recipient: match.foundItemOwner._id,
    type:      'match_rejected',
    title:     '❌ Match not a fit',
    message:   'The item owner reviewed your found item report and it wasn\'t a match.',
    data:      { matchId: match._id },
  });

  sendSocketNotification(io, match.foundItemOwner._id.toString(), notification);

  res.json(new ApiResponse(200, match, 'Match rejected.'));
});

export default { getMyMatches, getMatchById, confirmMatch, rejectMatch };
