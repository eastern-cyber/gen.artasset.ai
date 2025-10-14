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
const resendOtpBtn = document.getElementById('resend-otp-btn');
const authMessage = document.getElementById('auth-message');
const logoutBtn = document.getElementById('logout-btn');
const userEmailSpan = document.getElementById('user-email');
const otpTimer = document.getElementById('otp-timer');

// State variables
let currentEmail = '';
let otpExpiryTime = null;
let otpTimerInterval = null;
let isLoggedIn = false;

// Check if user is already logged in
function checkLoginStatus() {
    const savedLogin = localStorage.getItem('artAssetLoggedIn');
    const savedEmail = localStorage.getItem('artAssetUserEmail');
    
    if (savedLogin === 'true' && savedEmail) {
        isLoggedIn = true;
        currentEmail = savedEmail;
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

// Start OTP timer (2 minutes)
function startOtpTimer() {
    let timeLeft = 120; // 2 minutes in seconds
    
    // Clear existing timer
    if (otpTimerInterval) {
        clearInterval(otpTimerInterval);
    }
    
    otpTimerInterval = setInterval(() => {
        timeLeft--;
        
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        otpTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(otpTimerInterval);
            otpTimer.textContent = '00:00';
            resendOtpBtn.style.display = 'block';
            showAuthMessage('OTP has expired. Please request a new one.', 'error');
        }
        
        if (timeLeft === 30) {
            showAuthMessage('OTP will expire in 30 seconds!', 'error');
        }
    }, 1000);
}

// Real OTP sending using Vercel serverless function
// Real OTP sending using Vercel serverless function
async function sendOTP(email) {
    try {
        const response = await fetch('/api/send-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response:', text.substring(0, 200));
            throw new Error('Server returned an invalid response. Please check if the API endpoint exists.');
        }

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `Server error: ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('Error sending OTP:', error);
        
        // More specific error messages
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Cannot connect to server. Please check your internet connection and try again.');
        } else if (error.message.includes('invalid response')) {
            throw new Error('Server configuration error. Please contact support.');
        }
        
        throw error;
    }
}

// Real OTP verification using Vercel serverless function
async function verifyOTP(email, otp) {
    try {
        const response = await fetch('/api/verify-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, otp })
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response:', text.substring(0, 200));
            throw new Error('Server returned an invalid response. Please check if the API endpoint exists.');
        }

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `Server error: ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('Error verifying OTP:', error);
        
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Cannot connect to server. Please check your internet connection.');
        }
        
        throw error;
    }
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
    sendOtpBtn.classList.add('loading');
    sendOtpBtn.disabled = true;
    showAuthMessage('');
    
    try {
        const result = await sendOTP(email);
        
        if (result.success) {
            currentEmail = email;
            emailStep.classList.add('hidden');
            otpStep.classList.remove('hidden');
            resendOtpBtn.style.display = 'none';
            
            // Start OTP timer
            startOtpTimer();
            
            showAuthMessage(`OTP sent to ${email}. Please check your inbox (and spam folder).`, 'success');
        } else {
            showAuthMessage('Failed to send OTP. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error sending OTP:', error);
        showAuthMessage(error.message || 'An error occurred. Please try again.', 'error');
    } finally {
        sendOtpBtn.textContent = 'Send OTP';
        sendOtpBtn.classList.remove('loading');
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
    verifyOtpBtn.classList.add('loading');
    verifyOtpBtn.disabled = true;
    showAuthMessage('');
    
    try {
        const result = await verifyOTP(currentEmail, otp);
        
        if (result.success) {
            isLoggedIn = true;
            localStorage.setItem('artAssetLoggedIn', 'true');
            localStorage.setItem('artAssetUserEmail', currentEmail);
            
            // Clear timer
            if (otpTimerInterval) {
                clearInterval(otpTimerInterval);
            }
            
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
        showAuthMessage(error.message || 'An error occurred. Please try again.', 'error');
    } finally {
        verifyOtpBtn.textContent = 'Verify OTP';
        verifyOtpBtn.classList.remove('loading');
        verifyOtpBtn.disabled = false;
    }
});

// Handle Resend OTP button click
resendOtpBtn.addEventListener('click', async () => {
    if (!currentEmail) return;
    
    resendOtpBtn.textContent = 'Resending...';
    resendOtpBtn.disabled = true;
    showAuthMessage('');
    
    try {
        const result = await sendOTP(currentEmail);
        
        if (result.success) {
            resendOtpBtn.style.display = 'none';
            otpInput.value = '';
            
            // Restart timer
            startOtpTimer();
            
            showAuthMessage('New OTP sent successfully!', 'success');
        } else {
            showAuthMessage('Failed to resend OTP. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error resending OTP:', error);
        showAuthMessage(error.message || 'An error occurred. Please try again.', 'error');
    } finally {
        resendOtpBtn.textContent = 'Resend OTP';
        resendOtpBtn.disabled = false;
    }
});

// Handle Back to Email button click
backToEmailBtn.addEventListener('click', () => {
    otpStep.classList.add('hidden');
    emailStep.classList.remove('hidden');
    otpInput.value = '';
    resendOtpBtn.style.display = 'none';
    
    // Clear timer
    if (otpTimerInterval) {
        clearInterval(otpTimerInterval);
    }
    
    showAuthMessage('');
});

// Handle Logout button click
logoutBtn.addEventListener('click', () => {
    isLoggedIn = false;
    localStorage.removeItem('artAssetLoggedIn');
    localStorage.removeItem('artAssetUserEmail');
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
    resendOtpBtn.style.display = 'none';
    
    // Clear timer
    if (otpTimerInterval) {
        clearInterval(otpTimerInterval);
    }
    
    showAuthMessage('');
}

// Show the main app section
function showApp() {
    authSection.style.display = 'none';
    appSection.style.display = 'block';
    userEmailSpan.textContent = currentEmail;
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
        if (file.size > 5 * 1024 * 1024) {
            alert('Video file too large. Please select a video under 5MB.');
            e.target.value = '';
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
        console.log('🚀 Starting AI generation...');
        
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
                        const width = data.step === 1 ? '30%' : '70%';
                        progressFill.style.width = width;
                        progressText.textContent = data.message;
                    }
                    
                    if (data.success) {
                        document.getElementById('generated-art').src = data.artUrl;
                        document.getElementById('result-section').style.display = 'block';
                        document.getElementById('used-prompt').textContent = data.prompt || promptInput || 'AI Artistic Transformation';
                        document.getElementById('art-style').textContent = data.style || 'AI-Generated Art';
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
    document.getElementById('result-section').style.display = 'none';
    document.getElementById('generated-art').src = '';
    generateArt();
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const generateBtn = document.getElementById('generate-art-btn');
    const downloadBtn = document.getElementById('download-art-btn');
    const regenerateBtn = document.getElementById('regenerate-art-btn');
    
    if (generateBtn) generateBtn.addEventListener('click', generateArt);
    if (downloadBtn) downloadBtn.addEventListener('click', downloadArt);
    if (regenerateBtn) regenerateBtn.addEventListener('click', regenerateArt);
});

// Initialize the app
checkLoginStatus();