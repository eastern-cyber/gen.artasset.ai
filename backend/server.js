// backend/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer'); // ✅ ADD THIS

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadsDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// CORS configuration - ✅ IMPROVED
app.use(cors({
    origin: [
        'https://gen-artasset-ai.vercel.app',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Created uploads directory');
}

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// ✅ API routes
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'DeepSeek Art API',
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
    });
});

// ✅ FIXED: Generate art endpoint with proper upload middleware
app.post('/api/generate-art', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
]), async (req, res) => {
    try {
        console.log('🎨 Processing art generation request...');
        console.log('Files received:', {
            image: req.files?.image?.[0]?.filename,
            video: req.files?.video?.[0]?.filename
        });
        
        const imageFile = req.files?.image?.[0];
        const videoFile = req.files?.video?.[0];

        if (!imageFile && !videoFile) {
            return res.status(400).json({
                success: false,
                error: 'Please upload at least one image or video file'
            });
        }

        // Simulate AI processing
        console.log('⏳ Simulating AI processing...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Use a reliable online placeholder
        const artUrl = 'https://picsum.photos/600/400'; // Random image each time
        
        console.log('✅ Art generation completed');
        
        res.json({
            success: true,
            message: 'Art generated successfully!',
            artUrl: artUrl,
            processingTime: '2.1s',
            inputs: {
                image: imageFile ? imageFile.filename : 'None',
                video: videoFile ? videoFile.filename : 'None'
            },
            note: 'This is a mock response. Connect DeepSeek API for real AI art generation.'
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({
            success: false,
            error: 'Generation failed: ' + error.message
        });
    }
});

// ✅ Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File too large. Maximum size is 10MB.'
            });
        }
    }
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Frontend: http://localhost:${PORT}`);
    console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
    console.log(`🎨 Art Generation: http://localhost:${PORT}/api/generate-art (POST)`);
    console.log(`📁 Uploads directory: ${uploadsDir}`);
});