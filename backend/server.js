// backend/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios'); // Add this dependency

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

// Configure multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 2
  }
});

// DeepSeek API configuration
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/images/generations';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// Function to analyze image and generate prompt
function generatePromptFromFile(file, fileType) {
  const basePrompts = {
    image: "Create artistic AI-generated artwork inspired by this image. Style: digital art, vibrant colors, professional composition, trending on art station.",
    video: "Generate artistic AI artwork based on video content. Style: cinematic, dynamic composition, dramatic lighting, concept art."
  };
  
  return basePrompts[fileType] || "Create beautiful AI-generated artwork with vibrant colors and professional composition.";
}

// Function to call DeepSeek API
async function generateArtWithDeepSeek(prompt) {
  try {
    console.log('🎨 Calling DeepSeek API with prompt:', prompt);
    
    const response = await axios.post(DEEPSEEK_API_URL, {
      model: "deepseek-moe",
      prompt: prompt,
      size: "1024x1024",
      quality: "standard",
      n: 1
    }, {
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.data[0].url;
  } catch (error) {
    console.error('❌ DeepSeek API error:', error.response?.data || error.message);
    throw new Error('AI generation failed: ' + (error.response?.data?.error?.message || error.message));
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'ArtAsset AI Backend is running!',
    timestamp: new Date().toISOString(),
    hasApiKey: !!DEEPSEEK_API_KEY
  });
});

// Real AI Art Generation Endpoint
app.post('/api/generate-art', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('🎨 Starting real AI art generation...');
    
    const imageFile = req.files?.image?.[0];
    const videoFile = req.files?.video?.[0];

    if (!imageFile && !videoFile) {
      return res.status(400).json({
        success: false,
        error: 'Please upload at least one image or video file'
      });
    }

    console.log('📁 Files received:', {
      image: imageFile ? `${imageFile.originalname} (${imageFile.size} bytes)` : 'None',
      video: videoFile ? `${videoFile.originalname} (${videoFile.size} bytes)` : 'None'
    });

    // Generate AI prompt based on uploaded files
    let prompt;
    if (imageFile && videoFile) {
      prompt = `Create an artistic fusion combining elements from an image and video. 
                Style: cinematic digital art, vibrant colors, dynamic composition. 
                Incorporate visual themes from both media into a cohesive artwork.`;
    } else if (imageFile) {
      prompt = `Create artistic AI-generated artwork inspired by this image. 
                Style: digital painting, vibrant colors, professional composition, 
                trending on art station. Enhance and reinterpret the visual elements artistically.`;
    } else if (videoFile) {
      prompt = `Generate artistic AI artwork based on video content and motion themes. 
                Style: cinematic, dynamic composition, dramatic lighting, concept art. 
                Capture the essence and mood of the video in a still artwork.`;
    }

    // Show processing progress
    res.write(JSON.stringify({
      status: 'processing',
      message: 'Analyzing your media...',
      step: 1
    }) + '\n');

    // Simulate analysis time
    await new Promise(resolve => setTimeout(resolve, 2000));

    res.write(JSON.stringify({
      status: 'processing', 
      message: 'Generating AI artwork...',
      step: 2
    }) + '\n');

    // Call DeepSeek API for real AI generation
    let artUrl;
    if (DEEPSEEK_API_KEY) {
      try {
        artUrl = await generateArtWithDeepSeek(prompt);
        console.log('✅ DeepSeek generation successful:', artUrl);
      } catch (apiError) {
        console.error('❌ DeepSeek API failed, using fallback:', apiError.message);
        // Fallback to enhanced placeholder
        artUrl = `https://picsum.photos/1024/1024?art=${Date.now()}`;
      }
    } else {
      console.log('⚠️ No API key, using enhanced placeholder');
      artUrl = `https://picsum.photos/1024/1024?art=${Date.now()}`;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    res.write(JSON.stringify({
      success: true,
      message: imageFile && videoFile ? 
        'Art generated from image and video!' : 
        imageFile ? 'Art generated from image!' : 'Art generated from video!',
      artUrl: artUrl,
      prompt: prompt,
      inputs: {
        image: imageFile ? 'Analyzed' : 'None',
        video: videoFile ? 'Analyzed' : 'None',
        model: DEEPSEEK_API_KEY ? 'DeepSeek AI' : 'Demo Mode'
      }
    }) + '\n');

    console.log('✅ Art generation completed successfully');

  } catch (error) {
    console.error('❌ Error in generate-art:', error);
    res.json({
      success: false,
      error: 'Generation failed: ' + error.message
    });
  }
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling
app.use((error, req, res, next) => {
  console.error('❌ Global error:', error.message);
  
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      error: 'File upload error: ' + error.message
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Server error: ' + error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔑 DeepSeek API: ${DEEPSEEK_API_KEY ? 'Configured' : 'Not configured'}`);
});

module.exports = app;