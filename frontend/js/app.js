// frontend/js/app.js

// Authentication state
let authToken = null;
let currentUser = null;
let otpTimer = null;

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
const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const generateArtBtn = document.getElementById('generate-art-btn');
const downloadArtBtn = document.getElementById('download-art-btn');
const regenerateArtBtn = document.getElementById('regenerate-art-btn');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Check for existing session
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('userEmail');
    
    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = savedUser;
        showAppSection();
    }
    
    // Event listeners
    sendOtpBtn.addEventListener('click', sendOtp);
    verifyOtpBtn.addEventListener('click', verifyOtp);
    backToEmailBtn.addEventListener('click', backToEmail);
    resendOtpBtn.addEventListener('click', sendOtp);
    logoutBtn.addEventListener('click', logout);
    generateArtBtn.addEventListener('click', generateArt);
    downloadArtBtn.addEventListener('click', downloadArt);
    regenerateArtBtn.addEventListener('click', generateArt);
    
    // File preview listeners
    document.getElementById('image-upload').addEventListener('change', handleFilePreview);
    document.getElementById('video-upload').addEventListener('change', handleFilePreview);
});

// Authentication functions
async function sendOtp() {
    const email = emailInput.value.trim();
    
    console.log('🔍 Debug: Send OTP clicked with email:', email);
    
    if (!email) {
        showAuthMessage('Please enter your email address', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showAuthMessage('Please enter a valid email address', 'error');
        return;
    }
    
    try {
        sendOtpBtn.disabled = true;
        sendOtpBtn.textContent = 'Sending...';
        showAuthMessage('Sending OTP...', 'info');
        
        console.log('🔍 Making OTP request to /api/auth/send-otp');
        
        const response = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });
        
        console.log('🔍 Response status:', response.status);
        console.log('🔍 Response ok:', response.ok);
        
        const responseText = await response.text();
        console.log('🔍 Raw response:', responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('🔍 JSON parse error:', parseError);
            throw new Error('Invalid server response');
        }
        
        console.log('🔍 Parsed response data:', data);
        
        if (data.success) {
            showAuthMessage('OTP sent to your email! Check your inbox.', 'success');
            showOtpStep();
            startOtpTimer();
            // For development, show OTP in console and alert
            if (data.debug_otp) {
                console.log('📧 Development OTP:', data.debug_otp);
                // Optional: show in alert for easy testing
                setTimeout(() => {
                    alert(`Development OTP: ${data.debug_otp}\n\nFor testing purposes only.`);
                }, 500);
            }
        } else {
            showAuthMessage(data.error || 'Failed to send OTP', 'error');
        }
        
    } catch (error) {
        console.error('❌ Send OTP error:', error);
        console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack
        });
        showAuthMessage('Network error: ' + error.message, 'error');
    } finally {
        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = 'Send OTP';
    }
}

async function verifyOtp() {
    const email = emailInput.value.trim();
    const otp = otpInput.value.trim();
    
    if (!otp || otp.length !== 6) {
        showAuthMessage('Please enter the 6-digit OTP', 'error');
        return;
    }
    
    try {
        verifyOtpBtn.disabled = true;
        verifyOtpBtn.textContent = 'Verifying...';
        showAuthMessage('Verifying OTP...', 'info');
        
        const response = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, otp })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAuthMessage('Login successful!', 'success');
            authToken = data.token;
            currentUser = email;
            
            // Save to localStorage
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('userEmail', currentUser);
            
            // Show main app
            setTimeout(() => {
                showAppSection();
            }, 1000);
            
        } else {
            showAuthMessage(data.error || 'Invalid OTP', 'error');
        }
        
    } catch (error) {
        console.error('Verify OTP error:', error);
        showAuthMessage('Network error. Please try again.', 'error');
    } finally {
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.textContent = 'Verify OTP';
    }
}

function backToEmail() {
    otpStep.classList.add('hidden');
    emailStep.classList.remove('hidden');
    clearOtpTimer();
    otpInput.value = '';
    showAuthMessage('', '');
}

function logout() {
    // Call logout API
    fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        }
    }).catch(console.error);
    
    // Clear local state
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    
    // Show auth section
    showAuthSection();
}

// UI Management
function showAuthSection() {
    authSection.style.display = 'block';
    appSection.style.display = 'none';
    backToEmail();
}

function showAppSection() {
    authSection.style.display = 'none';
    appSection.style.display = 'block';
    userEmailSpan.textContent = currentUser;
    clearUploads();
}

function showOtpStep() {
    emailStep.classList.add('hidden');
    otpStep.classList.remove('hidden');
    otpInput.focus();
}

function showAuthMessage(message, type) {
    authMessage.textContent = message;
    authMessage.className = `auth-message ${type}`;
}

function startOtpTimer() {
    let timeLeft = 120; // 2 minutes in seconds
    const timerElement = document.getElementById('otp-timer');
    resendOtpBtn.style.display = 'none';
    
    clearOtpTimer();
    
    otpTimer = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearOtpTimer();
            resendOtpBtn.style.display = 'inline-block';
            showAuthMessage('OTP has expired. Please request a new one.', 'error');
        }
        
        timeLeft--;
    }, 1000);
}

function clearOtpTimer() {
    if (otpTimer) {
        clearInterval(otpTimer);
        otpTimer = null;
    }
}

// File handling
function handleFilePreview(event) {
    const file = event.target.files[0];
    const previewArea = document.getElementById('preview-area');
    
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        if (file.type.startsWith('image/')) {
            previewArea.innerHTML = `
                <div class="file-preview">
                    <img src="${e.target.result}" alt="Preview">
                    <p>${file.name} (${formatFileSize(file.size)})</p>
                </div>
            `;
        } else if (file.type.startsWith('video/')) {
            previewArea.innerHTML = `
                <div class="file-preview">
                    <video controls>
                        <source src="${e.target.result}" type="${file.type}">
                        Your browser does not support the video tag.
                    </video>
                    <p>${file.name} (${formatFileSize(file.size)})</p>
                </div>
            `;
        }
    };
    reader.readAsDataURL(file);
}

// Art generation
async function generateArt() {
    const imageFile = document.getElementById('image-upload').files[0];
    const videoFile = document.getElementById('video-upload').files[0];
    const prompt = document.getElementById('prompt-input').value.trim();
    
    if (!imageFile && !videoFile) {
        alert('Please upload at least one image or video file');
        return;
    }
    
    const formData = new FormData();
    if (imageFile) formData.append('image', imageFile);
    if (videoFile) formData.append('video', videoFile);
    if (prompt) formData.append('prompt', prompt);
    
    // Show progress
    const progressBar = document.getElementById('progress-bar');
    const progressFill = progressBar.querySelector('.progress-fill');
    const progressText = progressBar.querySelector('.progress-text');
    
    progressBar.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = '0%';
    
    generateArtBtn.disabled = true;
    
    try {
        // Simulate progress
        simulateProgress(progressFill, progressText);
        
        const response = await fetch('/api/generate-art', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                logout();
                throw new Error('Session expired. Please login again.');
            }
            throw new Error(`Server error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Complete progress
            progressFill.style.width = '100%';
            progressText.textContent = '100%';
            
            // Show result
            document.getElementById('generated-art').src = result.artUrl;
            document.getElementById('used-prompt').textContent = result.promptUsed;
            document.getElementById('art-style').textContent = result.style;
            document.getElementById('result-section').style.display = 'block';
            
            // Scroll to result
            setTimeout(() => {
                document.getElementById('result-section').scrollIntoView({ behavior: 'smooth' });
            }, 500);
            
        } else {
            throw new Error(result.error || 'Generation failed');
        }
        
    } catch (error) {
        console.error('Error generating art:', error);
        alert('Error generating art: ' + error.message);
    } finally {
        generateArtBtn.disabled = false;
        setTimeout(() => {
            progressBar.style.display = 'none';
        }, 1000);
    }
}

function simulateProgress(progressFill, progressText) {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 90) {
            progress = 90;
            clearInterval(interval);
        }
        progressFill.style.width = progress + '%';
        progressText.textContent = Math.round(progress) + '%';
    }, 200);
}

function downloadArt() {
    const artUrl = document.getElementById('generated-art').src;
    const link = document.createElement('a');
    link.href = artUrl;
    link.download = `artasset-ai-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function clearUploads() {
    document.getElementById('image-upload').value = '';
    document.getElementById('video-upload').value = '';
    document.getElementById('prompt-input').value = '';
    document.getElementById('preview-area').innerHTML = '<p>Uploaded files and preview will appear here</p>';
    document.getElementById('result-section').style.display = 'none';
}

// Utility functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}