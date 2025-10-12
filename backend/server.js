// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['https://gen-artasset-ai.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Use memory storage for Vercel

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'ArtAsset AI Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ FIXED: Generate art endpoint - simplified for Vercel
app.post('/api/generate-art', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('🎨 Received art generation request');
    
    const imageFile = req.files?.image?.[0];
    const videoFile = req.files?.video?.[0];

    if (!imageFile && !videoFile) {
      return res.status(400).json({
        success: false,
        error: 'Please upload at least one image or video file'
      });
    }

    console.log('Files received:', {
      image: imageFile ? `Size: ${imageFile.size} bytes` : 'None',
      video: videoFile ? `Size: ${videoFile.size} bytes` : 'None'
    });

    // Simulate processing time (2-3 seconds)
    console.log('⏳ Simulating AI processing...');
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Generate a unique placeholder image
    const artUrl = `https://picsum.photos/600/400?random=${Date.now()}`;
    
    console.log('✅ Art generation completed');
    
    res.json({
      success: true,
      message: 'Art generated successfully!',
      artUrl: artUrl,
      processingTime: '2.5s',
      inputs: {
        image: imageFile ? `Uploaded (${imageFile.size} bytes)` : 'None',
        video: videoFile ? `Uploaded (${videoFile.size} bytes)` : 'None'
      },
      note: 'Mock response - Connect DeepSeek API for real AI generation'
    });

  } catch (error) {
    console.error('❌ Error in generate-art:', error);
    res.status(500).json({
      success: false,
      error: 'Generation failed: ' + error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Global error handler:', error);
  
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      error: `File upload error: ${error.message}`
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Health: http://localhost:${PORT}/api/health`);
  console.log(`🎨 Generate: http://localhost:${PORT}/api/generate-art`);
});

module.exports = app;