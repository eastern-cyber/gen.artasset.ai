// frontend/js/app.js

// File preview functionality
document.getElementById('image-upload').addEventListener('change', function(e) {
    previewFile(e.target.files[0], 'image');
});

document.getElementById('video-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        // Check file size client-side
        if (file.size > 5 * 1024 * 1024) {
            alert('Video file too large. Please select a video under 5MB.');
            e.target.value = ''; // Clear the input
            return;
        }
        previewFile(file, 'video');
    }
});

function previewFile(file, type) {
    const previewArea = document.getElementById('preview-area');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (type === 'image') {
                previewArea.innerHTML = `
                    <div class="preview-item">
                        <img src="${e.target.result}" alt="Image preview" />
                        <p>Image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)</p>
                    </div>
                `;
            } else if (type === 'video') {
                previewArea.innerHTML = `
                    <div class="preview-item">
                        <video controls>
                            <source src="${e.target.result}" type="${file.type}">
                            Your browser does not support the video tag.
                        </video>
                        <p>Video: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)</p>
                    </div>
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
    
    // Client-side validation
    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
        alert('Image file too large. Maximum size is 5MB.');
        return;
    }
    
    if (videoFile && videoFile.size > 5 * 1024 * 1024) {
        alert('Video file too large. Maximum size is 5MB.');
        return;
    }
    
    const formData = new FormData();
    if (imageFile) formData.append('image', imageFile);
    if (videoFile) formData.append('video', videoFile);
    
    // Show progress
    const progressBar = document.getElementById('progress-bar');
    progressBar.style.display = 'block';
    
    try {
        console.log('📤 Sending files to server...');
        
        const response = await fetch('/api/generate-art', {
            method: 'POST',
            body: formData
        });
        
        // First, check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('❌ Non-JSON response:', text.substring(0, 200));
            throw new Error('Server returned invalid response. Please try again.');
        }
        
        const result = await response.json();
        console.log('📦 Response data:', result);
        
        if (!response.ok) {
            throw new Error(result.error || `Server error: ${response.status}`);
        }
        
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
        console.error('❌ Error generating art:', error);
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