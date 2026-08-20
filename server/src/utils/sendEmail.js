/**
 * Email Sending Utilities
 * Sends verification, password reset, and match notification emails
 */

import { transporter } from '../config/nodemailer.js';

const FROM = process.env.EMAIL_FROM || 'FindIt <noreply@findit.app>';
const BASE_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// ─── Email Templates ──────────────────────────────────────────────────────────

const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>FindIt</title>
  <style>
    body { margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; background:#0f172a; }
    .container { max-width:600px; margin:40px auto; background:#1e293b; border-radius:16px; overflow:hidden; border:1px solid rgba(99,102,241,0.2); }
    .header { background:linear-gradient(135deg,#4f46e5,#0891b2); padding:32px; text-align:center; }
    .header h1 { color:#fff; margin:0; font-size:28px; font-weight:800; letter-spacing:-0.5px; }
    .header p { color:rgba(255,255,255,0.8); margin:8px 0 0; }
    .body { padding:32px; color:#e2e8f0; }
    .body p { line-height:1.7; color:#94a3b8; }
    .btn { display:inline-block; background:linear-gradient(135deg,#4f46e5,#7c3aed); color:#fff !important; text-decoration:none; padding:14px 32px; border-radius:12px; font-weight:600; font-size:16px; margin:24px 0; }
    .code { background:#0f172a; border:1px solid rgba(99,102,241,0.3); border-radius:12px; padding:20px; text-align:center; font-size:32px; font-weight:700; letter-spacing:8px; color:#6366f1; margin:24px 0; }
    .footer { padding:24px 32px; border-top:1px solid rgba(255,255,255,0.05); color:#475569; font-size:13px; text-align:center; }
    .badge { display:inline-block; background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.3); color:#818cf8; padding:4px 12px; border-radius:100px; font-size:12px; font-weight:600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔍 FindIt</h1>
      <p>AI-Powered Lost & Found Platform</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} FindIt. All rights reserved.</p>
      <p>You received this email because you registered on FindIt.</p>
    </div>
  </div>
</body>
</html>
`;

// ─── Send Functions ────────────────────────────────────────────────────────────

export const sendVerificationEmail = async (user, token) => {
  const url = `${BASE_URL}/verify-email/${token}`;
  await transporter.sendMail({
    from: FROM,
    to: user.email,
    subject: 'Verify your FindIt account',
    html: baseTemplate(`
      <h2 style="color:#e2e8f0; margin-top:0;">Welcome to FindIt, ${user.name}! 👋</h2>
      <p>Thanks for signing up. Please verify your email address to get started.</p>
      <div style="text-align:center">
        <a href="${url}" class="btn">Verify Email Address</a>
      </div>
      <p style="font-size:13px; color:#475569;">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
    `),
  });
};

export const sendPasswordResetEmail = async (user, token) => {
  const url = `${BASE_URL}/reset-password/${token}`;
  await transporter.sendMail({
    from: FROM,
    to: user.email,
    subject: 'Reset your FindIt password',
    html: baseTemplate(`
      <h2 style="color:#e2e8f0; margin-top:0;">Password Reset Request</h2>
      <p>Hi ${user.name}, we received a request to reset your password.</p>
      <div style="text-align:center">
        <a href="${url}" class="btn">Reset Password</a>
      </div>
      <p style="font-size:13px; color:#475569;">This link expires in 1 hour. If you didn't request this, please ignore this email and your password will remain unchanged.</p>
    `),
  });
};

export const sendMatchNotificationEmail = async (user, foundItem, lostItem, score) => {
  const url = `${BASE_URL}/items/lost/${lostItem._id}`;
  const percent = Math.round(score * 100);
  await transporter.sendMail({
    from: FROM,
    to: user.email,
    subject: `🎉 Potential match found for "${lostItem.title}"`,
    html: baseTemplate(`
      <h2 style="color:#e2e8f0; margin-top:0;">We found a potential match! 🎉</h2>
      <p>Hi ${user.name}, our AI has found a potential match for your lost item.</p>
      <div style="background:#0f172a; border-radius:12px; padding:20px; margin:20px 0;">
        <p style="margin:0; font-size:13px; color:#64748b;">YOUR LOST ITEM</p>
        <p style="margin:4px 0 16px; font-size:18px; font-weight:700; color:#e2e8f0;">${lostItem.title}</p>
        <p style="margin:0; font-size:13px; color:#64748b;">MATCHED WITH</p>
        <p style="margin:4px 0 16px; font-size:18px; font-weight:700; color:#e2e8f0;">${foundItem.title}</p>
        <div style="text-align:center;">
          <span class="badge">AI Confidence: ${percent}%</span>
        </div>
      </div>
      <div style="text-align:center">
        <a href="${url}" class="btn">View Match Details</a>
      </div>
    `),
  });
};

export const sendWelcomeEmail = async (user) => {
  await transporter.sendMail({
    from: FROM,
    to: user.email,
    subject: 'Welcome to FindIt! 🔍',
    html: baseTemplate(`
      <h2 style="color:#e2e8f0; margin-top:0;">Your account is verified! 🎉</h2>
      <p>Hi ${user.name}, your email has been verified and your FindIt account is ready.</p>
      <p>Here's what you can do:</p>
      <ul style="color:#94a3b8; line-height:2;">
        <li>📦 Report a lost or found item</li>
        <li>🤖 Let AI match your items automatically</li>
        <li>💬 Chat with item finders directly</li>
        <li>🗺️ Browse items on an interactive map</li>
      </ul>
      <div style="text-align:center">
        <a href="${BASE_URL}/dashboard" class="btn">Go to Dashboard</a>
      </div>
    `),
  });
};
