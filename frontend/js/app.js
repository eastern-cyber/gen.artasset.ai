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
// In frontend/js/app.js - UPDATE THE generateArt FUNCTION:

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
    progressBar.innerHTML = '<div style="width: 0%; height: 100%; background: #007bff; border-radius: 10px; transition: width 0.3s;"></div>';
    
    try {
        // ✅ CHANGED: Use relative URL instead of localhost:3000
        const response = await fetch('/api/generate-art', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('generated-art').src = result.artUrl;
            document.getElementById('result-section').style.display = 'block';
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

// Download functionality
function downloadArt() {
    const artUrl = document.getElementById('generated-art').src;
    const link = document.createElement('a');
    link.href = artUrl;
    link.download = 'generated-art.png';
    link.click();
}