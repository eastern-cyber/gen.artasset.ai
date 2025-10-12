// frontend/js/app.js

// File preview functionality
document.getElementById('image-upload').addEventListener('change', function(e) {
    previewFile(e.target.files[0], 'image');
});

document.getElementById('video-upload').addEventListener('change', function(e) {
    previewFile(e.target.files[0], 'video');
});

function previewFile(file, type) {
    const previewArea = document.getElementById('preview-area');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (type === 'image') {
                previewArea.innerHTML = `<img src="${e.target.result}" style="max-width: 300px; max-height: 200px;" />`;
            } else if (type === 'video') {
                previewArea.innerHTML = `
                    <video controls style="max-width: 300px; max-height: 200px;">
                        <source src="${e.target.result}" type="${file.type}">
                        Your browser does not support the video tag.
                    </video>
                    <p>Video selected: ${file.name}</p>
                `;
            }
        };
        reader.readAsDataURL(file);
    }
}

// Main art generation function
async function generateArt() {
    const imageFile = document.getElementById('image-upload').files[0];
    const videoFile = document.getElementById('video-upload').files[0];
    
    if (!imageFile && !videoFile) {
        alert('Please upload at least one image or video file');
        return;
    }
    
    const formData = new FormData();
    if (imageFile) formData.append('image', imageFile);
    if (videoFile) formData.append('video', videoFile);
    
    // Show progress
    const progressBar = document.getElementById('progress-bar');
    progressBar.style.display = 'block';
    progressBar.innerHTML = '<div class="progress-fill">Processing...</div>';
    
    try {
        // ✅ FIXED: Use environment-aware API URL
        const API_BASE_URL = getApiBaseUrl();
        console.log('Sending request to:', `${API_BASE_URL}/generate-art`);
        
        const response = await fetch(`${API_BASE_URL}/generate-art`, {
            method: 'POST',
            body: formData
            // Note: Don't set Content-Type header for FormData - let browser set it automatically
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server response:', errorText);
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Generation result:', result);
        
        if (result.success) {
            document.getElementById('generated-art').src = result.artUrl;
            document.getElementById('result-section').style.display = 'block';
            
            // Scroll to result
            document.getElementById('result-section').scrollIntoView({ 
                behavior: 'smooth' 
            });
        } else {
            throw new Error(result.error || 'Generation failed');
        }
        
    } catch (error) {
        console.error('Error generating art:', error);
        alert('Error generating art: ' + error.message);
    } finally {
        progressBar.style.display = 'none';
    }
}

// ✅ NEW: Smart API URL detection
function getApiBaseUrl() {
    // If we're in development (localhost)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3001/api'; // Your local backend port
    }
    
    // If we're on your Vercel frontend
    if (window.location.hostname === 'gen-artasset-ai.vercel.app') {
        // Replace with your actual backend Vercel URL
        return 'https://artasset-ai-backend.vercel.app/api';
    }
    
    // Default: relative path (if backend is on same domain)
    return '/api';
}

// Download functionality
function downloadArt() {
    const artUrl = document.getElementById('generated-art').src;
    
    if (!artUrl || artUrl === '') {
        alert('No art to download');
        return;
    }
    
    const link = document.createElement('a');
    link.href = artUrl;
    link.download = 'generated-art-' + Date.now() + '.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ✅ NEW: Add loading state improvement
function updateProgressBar(percentage, message = '') {
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
        progressFill.style.width = percentage + '%';
        if (message) {
            progressFill.textContent = message;
        }
    }
}