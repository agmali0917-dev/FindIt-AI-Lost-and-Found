/**
 * Socket.io Configuration
 * Handles real-time chat, notifications, and typing indicators
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Track online users: userId -> Set of socketIds
const onlineUsers = new Map();

export const configureSocket = (io) => {
  // ─── Authentication Middleware ─────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token ||
                    socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        // Allow unauthenticated connections for public features
        socket.userId = null;
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.id).select('_id name avatar');

      if (!user) return next(new Error('User not found'));

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  // ─── Connection Handler ────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.userId;

    if (userId) {
      // Add to online users
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId).add(socket.id);

      // Join personal room for direct notifications
      socket.join(`user:${userId}`);

      // Broadcast online status
      io.emit('user:online', { userId, online: true });

      console.log(`🔗 Socket connected: ${socket.id} (User: ${userId})`);
    }

    // ─── Chat Events ──────────────────────────────────────────────────────
    socket.on('chat:join', (chatId) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on('chat:leave', (chatId) => {
      socket.leave(`chat:${chatId}`);
    });

    socket.on('chat:typing', ({ chatId, isTyping }) => {
      socket.to(`chat:${chatId}`).emit('chat:typing', {
        userId,
        chatId,
        isTyping,
      });
    });

    socket.on('chat:message:seen', ({ chatId, messageId }) => {
      socket.to(`chat:${chatId}`).emit('chat:message:seen', {
        messageId,
        seenBy: userId,
        seenAt: new Date(),
      });
    });

    // ─── Disconnection ────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      if (userId) {
        const sockets = onlineUsers.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            onlineUsers.delete(userId);
            io.emit('user:online', { userId, online: false });
          }
        }
        console.log(`🔌 Socket disconnected: ${socket.id} (User: ${userId})`);
      }
    });
  });

  console.log('🔌 Socket.io configured');
};

/**
 * Send a real-time notification to a specific user
 */
export const sendSocketNotification = (io, userId, notification) => {
  io.to(`user:${userId}`).emit('notification:new', notification);
};

/**
 * Send a chat message via socket
 */
export const sendSocketMessage = (io, chatId, message) => {
  io.to(`chat:${chatId}`).emit('chat:message:new', message);
};

/**
 * Check if a user is currently online
 */
export const isUserOnline = (userId) => {
  return onlineUsers.has(userId.toString());
};

export const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};
