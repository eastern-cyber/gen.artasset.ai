// /api/send-otp.js

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    // Store OTP in serverless database or Redis (for production)
    // For demo, we'll just send the email

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'ArtAsset AI <noreply@yourdomain.com>',
      to: [email],
      subject: 'Your ArtAsset AI Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">ArtAsset AI Generator</h2>
          <p>Your verification code is:</p>
          <div style="font-size: 32px; font-weight: bold; color: #007bff; text-align: center; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 2 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">ArtAsset AI Generator Team</p>
        </div>
      `
    });

    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ error: 'Failed to send OTP email' });
    }

    // In production, store the OTP hash in a database
    console.log(`OTP for ${email}: ${otp}`); // Remove in production

    res.status(200).json({ 
      success: true, 
      message: 'OTP sent successfully',
      // In production, don't send OTP back to client
      otp: otp // Remove this in production
    });

  } catch (error) {
    console.error('Error in send-otp:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}