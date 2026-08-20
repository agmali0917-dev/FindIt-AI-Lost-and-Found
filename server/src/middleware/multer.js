/**
 * Multer Middleware for File Uploads
 * Memory storage → processed by Sharp → uploaded to Cloudinary
 */

import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

// Use memory storage – we process with Sharp before uploading to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `File type ${file.mimetype} is not allowed. Use JPEG, PNG, or WebP.`), false);
  }
};

const limits = {
  fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  files:    parseInt(process.env.MAX_FILES) || 5,
};

export const upload = multer({ storage, fileFilter, limits });

// Convenient presets
export const uploadSingle = upload.single('image');
export const uploadMultiple = upload.array('images', limits.files);
export const uploadFields = upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'avatar', maxCount: 1 },
]);
