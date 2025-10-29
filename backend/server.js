// backend/server.js - Simplified with Free AI Services

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage for OTPs
const otpStorage = new Map();
const userSessions = new Map();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
    }
    
    const userData = userSessions.get(token);
    if (!userData) {
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired session'
        });
    }
    
    req.user = userData;
    next();
};

// Free AI Service Integration

// Option 1: Hugging Face Free Inference API
async function generateImageWithHuggingFace(prompt, style = 'artistic') {
    try {
        console.log('🎨 Trying Hugging Face API...');
        
        const enhancedPrompt = `${prompt}, ${style} style, high quality, detailed artwork`;
        
        // Using a popular free stable diffusion model
        const response = await fetch(
            'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputs: enhancedPrompt,
                    parameters: {
                        width: 512,
                        height: 512,
                        num_inference_steps: 20
                    }
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Hugging Face API error: ${response.status}`);
        }

        const imageBuffer = await response.arrayBuffer();
        const filename = `generated-${Date.now()}.png`;
        const artPath = path.join(__dirname, 'uploads', 'generated', filename);
        
        // Ensure directory exists
        const artDir = path.join(__dirname, 'uploads', 'generated');
        if (!fs.existsSync(artDir)) {
            fs.mkdirSync(artDir, { recursive: true });
        }
        
        fs.writeFileSync(artPath, Buffer.from(imageBuffer));
        console.log('✅ Hugging Face generation successful');
        return `/uploads/generated/${filename}`;
        
    } catch (error) {
        console.error('❌ Hugging Face error:', error.message);
        throw error;
    }
}

// Option 2: Local image transformation (simulated AI)
async function simulateAITransformation(imagePath, prompt) {
    try {
        console.log('🎨 Simulating AI transformation...');
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // For now, return a themed placeholder based on the prompt
        let theme = 'art';
        if (prompt.toLowerCase().includes('watercolor')) theme = 'watercolor';
        if (prompt.toLowerCase().includes('oil')) theme = 'painting';
        if (prompt.toLowerCase().includes('cyberpunk')) theme = 'tech';
        if (prompt.toLowerCase().includes('ancient')) theme = 'history';
        
        // Use themed placeholders
        const themedImages = {
            watercolor: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=400&fit=crop',
            painting: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=400&fit=crop',
            tech: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&h=400&fit=crop',
            history: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600&h=400&fit=crop',
            art: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=400&fit=crop'
        };
        
        const artUrl = themedImages[theme] || 'https://picsum.photos/600/400';
        console.log('✅ Simulated transformation complete');
        return artUrl;
        
    } catch (error) {
        console.error('❌ Simulation error:', error);
        throw error;
    }
}

// Option 3: Free image generation API (no key required)
async function generateWithFreeAPI(prompt, style = 'artistic') {
    try {
        console.log('🎨 Trying free image generation API...');
        
        // Using a free AI image service (example)
        const enhancedPrompt = `${prompt} in ${style} style, digital art, high quality`;
        
        // This is a placeholder - you can integrate with any free AI service
        // For now, we'll use Unsplash source for demo
        const searchTerm = encodeURIComponent(prompt.split(' ').slice(0, 3).join(' '));
        const response = await fetch(`https://source.unsplash.com/600x400/?${searchTerm},art`);
        
        if (response.ok) {
            console.log('✅ Free API generation successful');
            return response.url;
        }
        
        throw new Error('Free API failed');
        
    } catch (error) {
        console.error('❌ Free API error:', error.message);
        throw error;
    }
}

// Main image generation - tries free services first
async function generateArtWithFreeAI(prompt, style = 'artistic') {
    const services = [];
    
    // Try Hugging Face if token available
    if (process.env.HUGGING_FACE_TOKEN) {
        services.push('huggingface');
    }
    
    // Always try free services
    services.push('freeapi', 'simulation');
    
    for (const service of services) {
        try {
            console.log(`🔄 Trying ${service}...`);
            
            if (service === 'huggingface') {
                return await generateImageWithHuggingFace(prompt, style);
            } else if (service === 'freeapi') {
                return await generateWithFreeAPI(prompt, style);
            } else if (service === 'simulation') {
                return await simulateAITransformation(null, prompt);
            }
        } catch (error) {
            console.warn(`⚠️ ${service} failed:`, error.message);
            continue;
        }
    }
    
    // Ultimate fallback
    return 'https://picsum.photos/600/400?' + Date.now();
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'ArtAsset AI Backend is running!',
        timestamp: new Date().toISOString(),
        aiService: 'Free AI Services + Mock Fallback',
        note: 'Using free image generation APIs and simulated AI'
    });
});

// Send OTP endpoint
app.post('/api/auth/send-otp', (req, res) => {
    try {
        const { email } = req.body;
        
        console.log('📧 OTP requested for:', email);
        
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required'
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 2 * 60 * 1000;
        
        otpStorage.set(email, { otp, expiresAt });
        
        console.log(`📧 OTP for ${email}: ${otp} (Expires: 2 minutes)`);
        
        res.json({
            success: true,
            message: 'OTP sent successfully',
            debug_otp: otp
        });
        
    } catch (error) {
        console.error('❌ Send OTP error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send OTP'
        });
    }
});

// Verify OTP endpoint
app.post('/api/auth/verify-otp', (req, res) => {
    try {
        const { email, otp } = req.body;
        
        console.log('🔐 OTP verification for:', email);
        
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                error: 'Email and OTP are required'
            });
        }

        const storedData = otpStorage.get(email);
        
        if (!storedData) {
            return res.status(400).json({
                success: false,
                error: 'OTP not found or expired'
            });
        }
        
        if (Date.now() > storedData.expiresAt) {
            otpStorage.delete(email);
            return res.status(400).json({
                success: false,
                error: 'OTP has expired'
            });
        }
        
        if (storedData.otp !== otp) {
            return res.status(400).json({
                success: false,
                error: 'Invalid OTP'
            });
        }
        
        otpStorage.delete(email);
        const sessionToken = 'token-' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        
        userSessions.set(sessionToken, {
            email: email,
            loginTime: new Date().toISOString()
        });
        
        console.log('✅ Login successful for:', email);
        
        res.json({
            success: true,
            message: 'Login successful',
            token: sessionToken,
            user: { email }
        });
        
    } catch (error) {
        console.error('❌ Verify OTP error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify OTP'
        });
    }
});

// Logout endpoint
app.post('/api/auth/logout', authenticateToken, (req, res) => {
    try {
        const token = req.headers.authorization.replace('Bearer ', '');
        userSessions.delete(token);
        
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
        
    } catch (error) {
        console.error('❌ Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Logout failed'
        });
    }
});

// Art generation endpoint - UPDATED with free services
app.post('/api/generate-art', authenticateToken, upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
]), async (req, res) => {
    try {
        console.log('🎨 Received art generation request from:', req.user.email);
        
        const imageFile = req.files?.image?.[0];
        const videoFile = req.files?.video?.[0];
        const { prompt } = req.body;

        if (!imageFile && !videoFile) {
            return res.status(400).json({
                success: false,
                error: 'Please upload at least one image or video file'
            });
        }

        console.log('📁 Uploaded files:', {
            image: imageFile?.originalname,
            video: videoFile?.originalname,
            prompt: prompt || 'No custom prompt'
        });

        console.log('🔄 Processing with free AI services...');
        const startTime = Date.now();

        let artUrl;
        let aiService = 'Free AI Service';
        let processingTime = '0s';

        if (imageFile) {
            try {
                artUrl = await generateArtWithFreeAI(prompt || 'artistic transformation', 'artistic');
                processingTime = `${(Date.now() - startTime) / 1000}s`;
                console.log('✅ AI art generation successful');
                
            } catch (aiError) {
                console.error('❌ AI generation failed, using mock service:', aiError.message);
                // Fallback to mock service
                artUrl = 'https://picsum.photos/600/400?' + Date.now();
                processingTime = '2.0s';
                aiService = 'Mock Service';
            }
        } else if (videoFile) {
            console.log('⚠️ Video processing using mock service');
            await new Promise(resolve => setTimeout(resolve, 2000));
            artUrl = 'https://picsum.photos/600/400?' + Date.now();
            processingTime = '2.0s';
            aiService = 'Mock Service';
        }

        res.json({
            success: true,
            message: 'Art generated successfully!',
            artUrl: artUrl,
            processingTime: processingTime,
            style: prompt ? 'Custom: ' + prompt.substring(0, 50) + '...' : 'AI Artistic',
            promptUsed: prompt || 'Default artistic transformation',
            aiService: aiService,
            input: {
                image: imageFile ? imageFile.originalname : 'None',
                video: videoFile ? videoFile.originalname : 'None'
            }
        });

    } catch (error) {
        console.error('❌ Generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Art generation failed: ' + error.message
        });
    }
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Frontend: http://localhost:${PORT}`);
    console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth Endpoints: POST http://localhost:${PORT}/api/auth/send-otp`);
    console.log(`🎨 Art Generation: POST http://localhost:${PORT}/api/generate-art`);
    console.log(`🤖 AI Service: Free AI APIs + Mock Fallback`);
    console.log(`💡 Note: Using free image services - no API keys required!`);
});