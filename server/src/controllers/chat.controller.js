/**
 * Chat Controller
 * Real-time messaging between matched users
 */

import { Chat, Message } from '../models/Chat.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { io } from '../index.js';
import { sendSocketMessage } from '../config/socket.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import sharp from 'sharp';

// ─── Get All Chats for User ───────────────────────────────────────────────────
export const getMyChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({
    participants: req.user._id,
    isActive: true,
  })
    .sort({ lastMessageAt: -1 })
    .populate('participants', 'name avatar avatarUrl lastActiveAt')
    .populate('lastMessage')
    .populate('lostItem',  'title images')
    .populate('foundItem', 'title images')
    .lean();

  res.json(new ApiResponse(200, chats));
});

// ─── Get Messages for a Chat ──────────────────────────────────────────────────
export const getChatMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { page = 1, limit = 30 } = req.query;

  const chat = await Chat.findById(chatId);
  if (!chat) throw new ApiError(404, 'Chat not found.');

  if (!chat.participants.map(p => p.toString()).includes(req.user._id.toString())) {
    throw new ApiError(403, 'You are not a participant of this chat.');
  }

  const [messages, total] = await Promise.all([
    Message.find({ chat: chatId, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('sender', 'name avatar avatarUrl'),
    Message.countDocuments({ chat: chatId, isDeleted: false }),
  ]);

  // Mark all messages as read
  await Message.updateMany(
    {
      chat:   chatId,
      sender: { $ne: req.user._id },
      'readBy.user': { $ne: req.user._id },
    },
    { $addToSet: { readBy: { user: req.user._id, readAt: new Date() } } }
  );

  // Reset unread count
  await Chat.findByIdAndUpdate(chatId, { [`unreadCount.${req.user._id}`]: 0 });

  res.json(new ApiResponse(200, {
    messages: messages.reverse(), // Chronological order
    pagination: { page: parseInt(page), limit: parseInt(limit), total },
  }));
});

// ─── Send Message ─────────────────────────────────────────────────────────────
export const sendMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { content } = req.body;

  const chat = await Chat.findById(chatId).populate('participants', 'name');
  if (!chat) throw new ApiError(404, 'Chat not found.');

  if (!chat.participants.map(p => p._id.toString()).includes(req.user._id.toString())) {
    throw new ApiError(403, 'You are not a participant of this chat.');
  }

  if (!content && !req.file) {
    throw new ApiError(400, 'Message must have content or an image.');
  }

  let imageData = null;
  let messageType = 'text';

  // Handle image upload
  if (req.file) {
    const processed = await sharp(req.file.buffer)
      .resize({ width: 800, height: 800, fit: 'inside' })
      .jpeg({ quality: 80 })
      .toBuffer();

    const result = await uploadToCloudinary(processed, { folder: 'findit/chat-images' });
    imageData = { url: result.secure_url, publicId: result.public_id };
    messageType = content ? 'text' : 'image';
  }

  // Create message
  const message = await Message.create({
    chat:    chatId,
    sender:  req.user._id,
    content: content || '',
    image:   imageData,
    type:    messageType,
    readBy:  [{ user: req.user._id, readAt: new Date() }],
  });

  await message.populate('sender', 'name avatar avatarUrl');

  // Update chat
  const otherParticipants = chat.participants
    .filter(p => p._id.toString() !== req.user._id.toString())
    .map(p => p._id.toString());

  const unreadUpdates = {};
  for (const participantId of otherParticipants) {
    const currentCount = chat.unreadCount?.get(participantId) || 0;
    unreadUpdates[`unreadCount.${participantId}`] = currentCount + 1;
  }

  await Chat.findByIdAndUpdate(chatId, {
    lastMessage:   message._id,
    lastMessageAt: new Date(),
    ...unreadUpdates,
  });

  // Emit via Socket.io
  sendSocketMessage(io, chatId, message);

  res.status(201).json(new ApiResponse(201, message, 'Message sent.'));
});

// ─── Delete Message ───────────────────────────────────────────────────────────
export const deleteMessage = asyncHandler(async (req, res) => {
  const msg = await Message.findById(req.params.messageId);
  if (!msg) throw new ApiError(404, 'Message not found.');

  if (msg.sender.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You can only delete your own messages.');
  }

  msg.isDeleted = true;
  msg.content   = 'This message was deleted.';
  await msg.save();

  io.to(`chat:${msg.chat}`).emit('chat:message:deleted', { messageId: msg._id });

  res.json(new ApiResponse(200, null, 'Message deleted.'));
});
