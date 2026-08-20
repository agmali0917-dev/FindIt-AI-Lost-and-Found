/**
 * FindIt Server – Main Entry Point
 * Express.js + Socket.io + MongoDB
 */

import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import 'dotenv/config';

import connectDB from './config/database.js';
import { configureCloudinary } from './config/cloudinary.js';
import { configureSocket } from './config/socket.js';
import { errorHandler } from './middleware/errorHandler.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import { ApiResponse } from './utils/ApiResponse.js';

// ─── Route Imports ────────────────────────────────────────────────────────────
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import lostItemRoutes from './routes/lostItem.routes.js';
import foundItemRoutes from './routes/foundItem.routes.js';
import matchRoutes from './routes/match.routes.js';
import chatRoutes from './routes/chat.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import adminRoutes from './routes/admin.routes.js';
import searchRoutes from './routes/search.routes.js';

// ─── App Setup ────────────────────────────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);

// Socket.io
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: [process.env.CLIENT_URL || 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
});

// ─── Database & Services ──────────────────────────────────────────────────────
await connectDB();
configureCloudinary();
configureSocket(io);

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitize());          // Prevent NoSQL injection
app.use(globalRateLimiter);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json(new ApiResponse(200, {
    status: 'ok',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  }, 'FindIt API is running'));
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/lost-items',    lostItemRoutes);
app.use('/api/found-items',   foundItemRoutes);
app.use('/api/matches',       matchRoutes);
app.use('/api/chats',         chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/search',        searchRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json(new ApiResponse(404, null, `Route ${req.originalUrl} not found`));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 FindIt Server running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Client URL:  ${process.env.CLIENT_URL}`);
  console.log(`🤖 AI Service:  ${process.env.AI_SERVICE_URL}\n`); 
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

export default app;
