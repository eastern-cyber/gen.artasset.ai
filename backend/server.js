require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ ADD THIS: Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Created uploads directory');
}

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// ✅ ADD THIS: API routes should come before the static serving catch-all
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'DeepSeek Art API',
        port: PORT
    });
});

// Mock generate art endpoint
// Simple working version - use online placeholder
app.post('/api/generate-art', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
]), async (req, res) => {
    try {
        console.log('🎨 Processing art generation request...');
        
        const imageFile = req.files?.image?.[0];
        const videoFile = req.files?.video?.[0];

        // Simulate AI processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Use a reliable online placeholder
        const artUrl = 'https://picsum.photos/600/400'; // Random image each time
        
        res.json({
            success: true,
            message: 'Art generated successfully!',
            artUrl: artUrl,
            processingTime: '2.1s',
            style: 'AI Artistic',
            note: 'This is a mock response. Connect DeepSeek API for real AI art generation.'
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: 'Generation failed: ' + error.message
        });
    }
});

// ✅ ADD THIS: Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Frontend: http://localhost:${PORT}`);
    console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
    console.log(`🎨 Art Generation: http://localhost:${PORT}/api/generate-art (POST)`);
});