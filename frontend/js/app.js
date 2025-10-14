// frontend/js/app.js

// ==================== AUTHENTICATION SYSTEM ====================

// DOM Elements
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const emailStep = document.getElementById('email-step');
const otpStep = document.getElementById('otp-step');
const emailInput = document.getElementById('email-input');
const otpInput = document.getElementById('otp-input');
const sendOtpBtn = document.getElementById('send-otp-btn');
const verifyOtpBtn = document.getElementById('verify-otp-btn');
const backToEmailBtn = document.getElementById('back-to-email-btn');
const authMessage = document.getElementById('auth-message');
const logoutBtn = document.getElementById('logout-btn');

// State variables
let currentEmail = '';
let generatedOtp = '';
let isLoggedIn = false;

// Check if user is already logged in (from localStorage)
function checkLoginStatus() {
    const savedLogin = localStorage.getItem('artAssetLoggedIn');
    if (savedLogin === 'true') {
        isLoggedIn = true;
        showApp();
    }
}

// Show authentication message
function showAuthMessage(message, type) {
    authMessage.textContent = message;
    authMessage.className = 'auth-message';
    if (type) {
        authMessage.classList.add(type);
    }
}

// Generate a random 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Simulate sending OTP to email (in a real app, this would call a backend API)
function sendOTP(email) {
    // In a real application, you would:
    // 1. Call a serverless function on Vercel that sends the OTP via email
    // 2. Use a service like SendGrid, Resend, or AWS SES
    // 3. Store the OTP in a secure way (like a server-side session or database)
    
    // For this demo, we'll simulate the process
    generatedOtp = generateOTP();
    console.log(`OTP for ${email}: ${generatedOtp}`); // In production, remove this line
    
    // Simulate API call delay
    return new Promise((resolve) => {
        setTimeout(() => {
            // In a real app, this would be the response from your backend
            resolve({ success: true });
        }, 1500);
    });
}

// Verify OTP (in a real app, this would call a backend API)
function verifyOTP(email, otp) {
    // In a real application, you would:
    // 1. Call a serverless function on Vercel that verifies the OTP
    // 2. Compare with the stored OTP for that email
    // 3. Create a session or JWT token for the user
    
    // For this demo, we'll simulate the process
    return new Promise((resolve) => {
        setTimeout(() => {
            // In a real app, this would be the response from your backend
            const isValid = otp === generatedOtp;
            resolve({ success: isValid });
        }, 1500);
    });
}

// Handle Send OTP button click
sendOtpBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    
    if (!email) {
        showAuthMessage('Please enter your email address', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showAuthMessage('Please enter a valid email address', 'error');
        return;
    }
    
    // Show loading state
    sendOtpBtn.textContent = 'Sending...';
    sendOtpBtn.disabled = true;
    showAuthMessage('');
    
    try {
        const result = await sendOTP(email);
        
        if (result.success) {
            currentEmail = email;
            emailStep.classList.add('hidden');
            otpStep.classList.remove('hidden');
            showAuthMessage(`OTP sent to ${email}. Please check your inbox.`, 'success');
        } else {
            showAuthMessage('Failed to send OTP. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error sending OTP:', error);
        showAuthMessage('An error occurred. Please try again.', 'error');
    } finally {
        sendOtpBtn.textContent = 'Send OTP';
        sendOtpBtn.disabled = false;
    }
});

// Handle Verify OTP button click
verifyOtpBtn.addEventListener('click', async () => {
    const otp = otpInput.value.trim();
    
    if (!otp || otp.length !== 6) {
        showAuthMessage('Please enter a valid 6-digit OTP', 'error');
        return;
    }
    
    // Show loading state
    verifyOtpBtn.textContent = 'Verifying...';
    verifyOtpBtn.disabled = true;
    showAuthMessage('');
    
    try {
        const result = await verifyOTP(currentEmail, otp);
        
        if (result.success) {
            isLoggedIn = true;
            localStorage.setItem('artAssetLoggedIn', 'true');
            showAuthMessage('Login successful!', 'success');
            
            // Transition to app after a brief delay
            setTimeout(() => {
                showApp();
            }, 1000);
        } else {
            showAuthMessage('Invalid OTP. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        showAuthMessage('An error occurred. Please try again.', 'error');
    } finally {
        verifyOtpBtn.textContent = 'Verify OTP';
        verifyOtpBtn.disabled = false;
    }
});

// Handle Back to Email button click
backToEmailBtn.addEventListener('click', () => {
    otpStep.classList.add('hidden');
    emailStep.classList.remove('hidden');
    otpInput.value = '';
    showAuthMessage('');
});

// Handle Logout button click
logoutBtn.addEventListener('click', () => {
    isLoggedIn = false;
    localStorage.removeItem('artAssetLoggedIn');
    showAuth();
});

// Show the authentication section
function showAuth() {
    authSection.style.display = 'block';
    appSection.style.display = 'none';
    
    // Reset form
    emailInput.value = '';
    otpInput.value = '';
    emailStep.classList.remove('hidden');
    otpStep.classList.add('hidden');
    showAuthMessage('');
}

// Show the main app section
function showApp() {
    authSection.style.display = 'none';
    appSection.style.display = 'block';
}

// Simple email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ==================== EXISTING ArtGeneration FUNCTIONALITY ====================

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
    // Check if user is logged in
    if (!isLoggedIn) {
        alert('Please log in to generate art');
        showAuth();
        return;
    }
    
    const imageFile = document.getElementById('image-upload').files[0];
    const videoFile = document.getElementById('video-upload').files[0];
    const promptInput = document.getElementById('prompt-input').value;
    
    if (!imageFile && !videoFile) {
        alert('Please upload at least one image or video file');
        return;
    }
    
    const formData = new FormData();
    if (imageFile) formData.append('image', imageFile);
    if (videoFile) formData.append('video', videoFile);
    if (promptInput) formData.append('prompt', promptInput);
    
    // Show progress
    const progressBar = document.getElementById('progress-bar');
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    
    progressBar.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = 'Initializing...';
    
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
                        const width = data.step === 1 ? '30%' : '70%';
                        
                        progressFill.style.width = width;
                        progressText.textContent = data.message;
                    }
                    
                    if (data.success) {
                        // Final result
                        document.getElementById('generated-art').src = data.artUrl;
                        document.getElementById('result-section').style.display = 'block';
                        
                        // Update prompt info
                        document.getElementById('used-prompt').textContent = data.prompt || promptInput || 'AI Artistic Transformation';
                        document.getElementById('art-style').textContent = data.style || 'AI-Generated Art';
                        
                        // Scroll to result
                        document.getElementById('result-section').scrollIntoView({ behavior: 'smooth' });
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
    if (!artUrl || artUrl.includes('undefined')) {
        alert('No generated art available to download');
        return;
    }
    
    const link = document.createElement('a');
    link.href = artUrl;
    link.download = 'generated-art.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function regenerateArt() {
    // Clear previous result
    document.getElementById('result-section').style.display = 'none';
    document.getElementById('generated-art').src = '';
    
    // Regenerate with current inputs
    generateArt();
}

// ==================== EVENT LISTENERS ====================

// Add event listeners for the generate, download, and regenerate buttons
document.addEventListener('DOMContentLoaded', function() {
    // Only add these if the elements exist (when user is logged in)
    const generateBtn = document.getElementById('generate-art-btn');
    const downloadBtn = document.getElementById('download-art-btn');
    const regenerateBtn = document.getElementById('regenerate-art-btn');
    
    if (generateBtn) {
        generateBtn.addEventListener('click', generateArt);
    }
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadArt);
    }
    
    if (regenerateBtn) {
        regenerateBtn.addEventListener('click', regenerateArt);
    }
});

// Initialize the app
checkLoginStatus();