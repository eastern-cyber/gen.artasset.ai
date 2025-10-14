// /api/verify-otp.js

// Simple in-memory storage for OTPs (reset on server restart)
// In production, use a proper database like Redis or Vercel KV
const otpStorage = new Map();

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // In development, accept any valid 6-digit OTP
    // In production, verify against stored OTP
    const isValid = /^\d{6}$/.test(otp);

    if (isValid) {
      res.status(200).json({ 
        success: true, 
        message: 'OTP verified successfully' 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid OTP format. Please enter a 6-digit number.' 
      });
    }

  } catch (error) {
    console.error('Error in verify-otp:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}