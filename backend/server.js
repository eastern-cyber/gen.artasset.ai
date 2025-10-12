// backend/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

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

// Configure multer with file filtering
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for both images and videos
    files: 2 // Maximum 2 files
  },
  fileFilter: (req, file, cb) => {
    // Check file types
    if (file.fieldname === 'image') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Please upload only image files for image field'), false);
      }
    } else if (file.fieldname === 'video') {
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Please upload only video files for video field'), false);
      }
    } else {
      cb(new Error('Unexpected field'), false);
    }
  }
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'ArtAsset AI Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// ✅ FIXED: Generate art endpoint with better video handling
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
      image: imageFile ? `${imageFile.originalname} (${imageFile.size} bytes)` : 'None',
      video: videoFile ? `${videoFile.originalname} (${videoFile.size} bytes)` : 'None'
    });

    // Validate file sizes
    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'Image file too large. Maximum size is 5MB.'
      });
    }

    if (videoFile && videoFile.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'Video file too large. Maximum size is 5MB.'
      });
    }

    // Simulate processing time
    console.log('⏳ Processing files...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate result based on input type
    let message = 'Art generated successfully!';
    if (imageFile && videoFile) {
      message = 'Art generated from image and video!';
    } else if (imageFile) {
      message = 'Art generated from image!';
    } else if (videoFile) {
      message = 'Art generated from video!';
    }
    
    const artUrl = `https://picsum.photos/600/400?random=${Date.now()}`;
    
    console.log('✅ Art generation completed');
    
    res.json({
      success: true,
      message: message,
      artUrl: artUrl,
      processingTime: '3.0s',
      inputs: {
        image: imageFile ? 'Uploaded' : 'None',
        video: videoFile ? 'Uploaded' : 'None',
        imageSize: imageFile ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB` : 'None',
        videoSize: videoFile ? `${(videoFile.size / 1024 / 1024).toFixed(2)} MB` : 'None'
      }
    });

  } catch (error) {
    console.error('❌ Error in generate-art:', error);
    res.status(500).json({
      success: false,
      error: 'Generation failed: ' + error.message
    });
  }
});

// ✅ ADD THIS: Special endpoint for video-only processing
app.post('/api/process-video', upload.single('video'), async (req, res) => {
  try {
    const videoFile = req.file;
    
    if (!videoFile) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a video file'
      });
    }

    console.log('🎥 Processing video:', videoFile.originalname);
    
    // Simulate video processing
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    const artUrl = `https://picsum.photos/600/400?grayscale&random=${Date.now()}`;
    
    res.json({
      success: true,
      message: 'Art generated from video clip!',
      artUrl: artUrl,
      videoInfo: {
        name: videoFile.originalname,
        size: `${(videoFile.size / 1024 / 1024).toFixed(2)} MB`,
        type: videoFile.mimetype
      }
    });

  } catch (error) {
    console.error('❌ Video processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Video processing failed: ' + error.message
    });
  }
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ✅ IMPROVED: Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Global error handler:', error.message);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum 2 files allowed.'
      });
    }
  }
  
  // Handle multer file filter errors
  if (error.message.includes('Please upload only')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error: ' + error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;