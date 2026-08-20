/**
 * QR Code Generator Utility
 * Generates QR codes for lost/found items as base64 data URLs
 */

import QRCode from 'qrcode';

const BASE_URL = process.env.CLIENT_URL || 'http://localhost:3000';

/**
 * Generate a QR code for an item
 * @param {string} itemId - MongoDB item ID
 * @param {'lost' | 'found'} itemType - Type of item
 * @returns {Promise<string>} Base64 data URL of QR code
 */
export const generateItemQR = async (itemId, itemType) => {
  const url = `${BASE_URL}/items/${itemType}/${itemId}`;

  const qrDataUrl = await QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    type:                 'image/png',
    width:                400,
    margin:               2,
    color: {
      dark:  '#4f46e5',
      light: '#ffffff',
    },
  });

  return {
    url:       url,
    qrDataUrl: qrDataUrl,
  };
};

/**
 * Generate a QR code as SVG string
 */
export const generateItemQRSVG = async (itemId, itemType) => {
  const url = `${BASE_URL}/items/${itemType}/${itemId}`;
  const svg = await QRCode.toString(url, {
    type:                 'svg',
    errorCorrectionLevel: 'H',
  });
  return svg;
};
