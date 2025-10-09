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
app.post('/api/generate-art', (req, res) => {
    console.log('📨 Received art generation request');
    
    // Simulate processing time
    setTimeout(() => {
        res.json({
            success: true,
            message: 'Art generated successfully!',
            artUrl: '/mock-art.png', // This should be a real image URL in production
            note: 'This is a mock response. Connect to DeepSeek API for real generation.'
        });
    }, 2000);
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