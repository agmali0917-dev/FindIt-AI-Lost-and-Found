/**
 * Nodemailer Configuration
 * Supports Gmail (SMTP) and other providers
 */

import nodemailer from 'nodemailer';

// ─── Create Transporter ────────────────────────────────────────────────────────
const createTransporter = () => {
  if (process.env.NODE_ENV === 'test') {
    // Use ethereal for testing
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal@test.com',
        pass: 'testpass',
      },
    });
  }

  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const transporter = createTransporter();

// Verify connection
if (process.env.NODE_ENV !== 'test') {
  transporter.verify((error) => {
    if (error) {
      console.error('❌ Email transporter error:', error.message);
    } else {
      console.log('📧 Email transporter ready');
    }
  });
}
