/**
 * Cloudinary Configuration
 * Used for image uploads (lost items, found items, profile pictures)
 */

import { v2 as cloudinary } from 'cloudinary';

export const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:     true,
  });

  console.log('☁️  Cloudinary configured');
};

/**
 * Upload a buffer to Cloudinary
 * @param {Buffer} buffer - Image buffer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
export const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      folder:            'findit',
      resource_type:     'image',
      allowed_formats:   ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      transformation:    [{ quality: 'auto', fetch_format: 'auto' }],
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      defaultOptions,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Delete an image from Cloudinary by public_id
 * @param {string} publicId - Cloudinary public ID
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};

export default cloudinary;
