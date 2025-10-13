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
    
    const formData = new FormData();
    if (imageFile) formData.append('image', imageFile);
    if (videoFile) formData.append('video', videoFile);
    
    // Show progress
    const progressBar = document.getElementById('progress-bar');
    progressBar.style.display = 'block';
    progressBar.innerHTML = `
        <div class="progress-fill" style="width: 0%">
            <div class="progress-text">Initializing...</div>
        </div>
    `;
    
    try {
        console.log('🚀 Starting real AI generation...');
        
        const response = await fetch('/api/generate-art', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    console.log('📦 Progress update:', data);
                    
                    if (data.status === 'processing') {
                        // Update progress bar
                        const progressFill = document.querySelector('.progress-fill');
                        const progressText = document.querySelector('.progress-text');
                        const width = data.step === 1 ? '30%' : '70%';
                        
                        progressFill.style.width = width;
                        progressText.textContent = data.message;
                    }
                    
                    if (data.success) {
                        // Final result
                        document.getElementById('generated-art').src = data.artUrl;
                        document.getElementById('result-section').style.display = 'block';
                        
                        // Add prompt info
                        const resultSection = document.getElementById('result-section');
                        if (!document.getElementById('prompt-info')) {
                            const promptInfo = document.createElement('div');
                            promptInfo.id = 'prompt-info';
                            promptInfo.style.marginTop = '10px';
                            promptInfo.style.fontSize = '14px';
                            promptInfo.style.color = '#666';
                            promptInfo.innerHTML = `<strong>AI Prompt:</strong> ${data.prompt}`;
                            resultSection.appendChild(promptInfo);
                        }
                        
                        // Scroll to result
                        resultSection.scrollIntoView({ behavior: 'smooth' });
                    }
                    
                    if (data.error) {
                        throw new Error(data.error);
                    }
                    
                } catch (parseError) {
                    console.error('Error parsing JSON:', parseError, 'Raw:', line);
                }
            }
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