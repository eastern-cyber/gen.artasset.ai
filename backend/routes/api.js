const express = require('express');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const router = express.Router();

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
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// Art generation endpoint
router.post('/generate-art', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 }
]), async (req, res) => {
    try {
        console.log('Received art generation request');
        
        const imageFile = req.files?.image?.[0];
        const videoFile = req.files?.video?.[0];

        if (!imageFile && !videoFile) {
            return res.status(400).json({
                success: false,
                error: 'No image or video file provided'
            });
        }

        // Call DeepSeek AI API
        const artResult = await callDeepSeekAI(imageFile, videoFile);
        
        res.json({
            success: true,
            artUrl: `${req.protocol}://${req.get('host')}/${artResult.filename}`,
            message: 'Art generated successfully'
        });

    } catch (error) {
        console.error('Error in generate-art:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Art generation failed'
        });
    }
});

// Mock DeepSeek AI integration (Replace with actual API call)
async function callDeepSeekAI(imageFile, videoFile) {
    // This is a mock implementation - replace with actual DeepSeek API call
    console.log('Processing files with DeepSeek AI:');
    if (imageFile) console.log('Image:', imageFile.filename);
    if (videoFile) console.log('Video:', videoFile.filename);
    
    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // For demo purposes, return a placeholder image
    // In reality, you would:
    // 1. Prepare the files for DeepSeek API
    // 2. Send request to DeepSeek
    // 3. Process the response
    // 4. Save the generated art
    
    const mockArtFilename = 'mock-generated-art.png';
    const mockArtPath = path.join('uploads', mockArtFilename);
    
    // Create a mock generated art file (in real implementation, this comes from DeepSeek API)
    if (!fs.existsSync(mockArtPath)) {
        // You can place a placeholder image here for demo
        console.log('Mock art file created');
    }
    
    return {
        filename: mockArtFilename,
        style: 'artistic',
        processingTime: '3s'
    };
}

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'DeepSeek Art API is running' });
});

module.exports = router;