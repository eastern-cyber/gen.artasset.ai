// /api/send-otp.js

// For development/demo - simulates email sending
// For production, uncomment the Resend code

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
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log(`OTP for ${email}: ${otp}`); // Remove in production

    // ===== PRODUCTION: Uncomment this section when you have Resend API key =====
    /*
    const { RESEND_API_KEY } = process.env;
    
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }

    const resend = new Resend(RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: 'ArtAsset AI <onboarding@resend.dev>',
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
      return res.status(500).json({ error: 'Failed to send OTP email: ' + error.message });
    }
    */

    // ===== DEVELOPMENT: Simulate successful email sending =====
    // Simulate delay for email sending
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For development, we'll return the OTP so users can use it
    // In production, remove the otp from the response
    res.status(200).json({ 
      success: true, 
      message: 'OTP sent successfully',
      // DEVELOPMENT ONLY - Remove in production
      otp: otp
    });

  } catch (error) {
    console.error('Error in send-otp:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: 'Check server logs for more information'
    });
  }
}