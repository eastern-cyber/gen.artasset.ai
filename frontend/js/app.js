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
                previewArea.innerHTML = `<img src="${e.target.result}" style="max-width: 300px; max-height: 200px;" alt="Preview" />`;
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

// Art generation function
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
    progressBar.innerHTML = '<div class="progress-fill">Processing your art... (3-5 seconds)</div>';
    
    try {
        console.log('Sending request to /api/generate-art');
        
        const response = await fetch('/api/generate-art', {
            method: 'POST',
            body: formData
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Success:', result);
        
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
        console.error('Error:', error);
        alert('Error: ' + error.message);
    } finally {
        progressBar.style.display = 'none';
    }
}

function downloadArt() {
    const artUrl = document.getElementById('generated-art').src;
    const link = document.createElement('a');
    link.href = artUrl;
    link.download = 'generated-art.png';
    link.click();
}

// Test backend connection on load
document.addEventListener('DOMContentLoaded', function() {
    // Test the health endpoint
    fetch('/api/health')
        .then(response => {
            if (response.ok) {
                console.log('✅ Backend is connected');
            } else {
                console.log('❌ Backend health check failed');
            }
        })
        .catch(error => {
            console.log('❌ Cannot reach backend:', error.message);
        });
});