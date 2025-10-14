// /api/verify-otp.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // In production, verify against stored OTP in database
    // For demo, we'll accept any 6-digit OTP
    const isValid = /^\d{6}$/.test(otp);

    if (isValid) {
      res.status(200).json({ 
        success: true, 
        message: 'OTP verified successfully' 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid OTP' 
      });
    }

  } catch (error) {
    console.error('Error in verify-otp:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}