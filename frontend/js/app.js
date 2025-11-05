// frontend/js/app.js
class ArtAssetGenerator {
    constructor() {
        this.currentUser = null;
        this.selectedMembership = null;
        this.otpTimer = null;
        this.otpTimeLeft = 120;
        this.currentOTP = null; // Store the generated OTP
        
        // Data management
        this.categories = JSON.parse(localStorage.getItem('artAssetCategories')) || [];
        this.artists = JSON.parse(localStorage.getItem('artAssetArtists')) || [];
        this.following = JSON.parse(localStorage.getItem('artAssetFollowing')) || [];
        this.aiCollections = JSON.parse(localStorage.getItem('artAssetAICollections')) || [];
        
        // Current state
        this.currentCategory = null;
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.uploadQueue = [];
        this.selectedArtwork = null;
        
        this.initializeEventListeners();
        this.checkExistingSession();
    }

    initializeEventListeners() {
        // Membership selection
        document.querySelectorAll('.membership-card').forEach(card => {
            card.addEventListener('click', () => this.selectMembership(card));
        });
        document.getElementById('select-membership-btn').addEventListener('click', () => this.confirmMembership());
        document.getElementById('back-to-membership-btn').addEventListener('click', () => this.backToMembership());

        // Auth related
        document.getElementById('send-otp-btn').addEventListener('click', () => this.sendOTP());
        document.getElementById('verify-otp-btn').addEventListener('click', () => this.verifyOTP());
        document.getElementById('back-to-email-btn').addEventListener('click', () => this.backToEmail());
        document.getElementById('resend-otp-btn').addEventListener('click', () => this.resendOTP());
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());

        // Navigation
        document.getElementById('catalogue-manager-btn').addEventListener('click', () => this.showCatalogueManager());
        document.getElementById('artist-gallery-btn').addEventListener('click', () => this.showArtistGallery());
        document.getElementById('ai-generator-btn').addEventListener('click', () => this.showAIGenerator());
        document.getElementById('artists-browse-btn').addEventListener('click', () => this.showArtistsBrowse());
        document.getElementById('my-following-btn').addEventListener('click', () => this.showFollowing());

        // Catalogue management
        document.getElementById('create-category-btn').addEventListener('click', () => this.showCategoryModal());
        document.getElementById('save-category-btn').addEventListener('click', () => this.saveCategory());
        document.getElementById('upload-pictures-btn').addEventListener('click', () => this.showUploadModal());
        document.getElementById('confirm-upload-btn').addEventListener('click', () => this.confirmUpload());
        
        // Pagination
        document.getElementById('prev-page').addEventListener('click', () => this.previousPage());
        document.getElementById('next-page').addEventListener('click', () => this.nextPage());

        // AI Generation
        document.getElementById('generate-art-btn').addEventListener('click', () => this.generateArt());
        document.getElementById('download-art-btn').addEventListener('click', () => this.downloadArt());
        document.getElementById('regenerate-art-btn').addEventListener('click', () => this.regenerateArt());
        document.getElementById('save-to-collection-btn').addEventListener('click', () => this.saveToCollection());

        // Artist filter
        document.getElementById('artist-filter').addEventListener('change', () => this.filterArtwork());

        // Modal handlers
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
        });

        // Bulk upload
        document.getElementById('bulk-image-upload').addEventListener('change', (e) => this.handleBulkUpload(e));
        this.setupDragAndDrop();

        // Close modals on background click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal(modal);
            });
        });
    }

    // OTP Generation and Management
    generateOTP() {
        // Generate a random 6-digit OTP
        this.currentOTP = Math.floor(100000 + Math.random() * 900000).toString();
        return this.currentOTP;
    }

    showOTPInConsole(email, otp) {
        console.log(`%c🎨 ArtAsset AI Generator - Development OTP`, 'color: #667eea; font-size: 16px; font-weight: bold;');
        console.log(`%c📧 For Email: ${email}`, 'color: #333; font-size: 14px;');
        console.log(`%c🔑 Your OTP Code: ${otp}`, 'color: #11998e; font-size: 18px; font-weight: bold; background: #e8f5e8; padding: 10px; border-radius: 5px;');
        console.log(`%c⏰ This OTP will expire in 2 minutes`, 'color: #666; font-size: 12px;');
        console.log(`%c💡 Copy this code and paste it in the OTP verification field`, 'color: #f5576c; font-size: 12px;');
    }

    // Membership Selection
    selectMembership(card) {
        document.querySelectorAll('.membership-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedMembership = card.dataset.type;
        document.getElementById('select-membership-btn').disabled = false;
    }

    confirmMembership() {
        document.getElementById('membership-step').classList.add('hidden');
        document.getElementById('email-step').classList.remove('hidden');
    }

    backToMembership() {
        document.getElementById('email-step').classList.add('hidden');
        document.getElementById('membership-step').classList.remove('hidden');
        this.selectedMembership = null;
        document.getElementById('select-membership-btn').disabled = true;
    }

    // Auth Methods
    checkExistingSession() {
        const savedUser = localStorage.getItem('artAssetUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.selectedMembership = this.currentUser.membershipType;
            this.showAppSection();
            this.showDefaultSection();
        }
    }

    async sendOTP() {
        const email = document.getElementById('email-input').value.trim();
        
        if (!this.validateEmail(email)) {
            this.showAuthMessage('Please enter a valid email address', 'error');
            return;
        }

        try {
            this.showAuthMessage('Sending OTP...', 'success');
            
            // Generate OTP for development
            const otp = this.generateOTP();
            
            // Show OTP in console for development
            this.showOTPInConsole(email, otp);
            
            // Simulate API delay
            setTimeout(() => {
                document.getElementById('email-step').classList.add('hidden');
                document.getElementById('otp-step').classList.remove('hidden');
                this.startOTPTimer();
                this.showAuthMessage('OTP sent! Check your email (and browser console for development)', 'success');
                
                // Also show a user-friendly message on the page
                const devMessage = document.createElement('div');
                devMessage.className = 'auth-message info';
                devMessage.innerHTML = `
                    <strong>Development Mode:</strong> OTP sent to console. 
                    Press <kbd>F12</kbd> → Console to view your OTP: <strong>${otp}</strong>
                `;
                document.getElementById('auth-message').parentNode.insertBefore(devMessage, document.getElementById('auth-message').nextSibling);
                
            }, 1000);

        } catch (error) {
            this.showAuthMessage('Failed to send OTP. Please try again.', 'error');
        }
    }

    async verifyOTP() {
        const enteredOTP = document.getElementById('otp-input').value.trim();
        
        if (enteredOTP.length !== 6 || !/^\d+$/.test(enteredOTP)) {
            this.showAuthMessage('Please enter a valid 6-digit OTP', 'error');
            return;
        }

        try {
            this.showAuthMessage('Verifying OTP...', 'success');
            
            // Verify the OTP
            if (enteredOTP !== this.currentOTP) {
                throw new Error('Invalid OTP');
            }
            
            setTimeout(() => {
                const email = document.getElementById('email-input').value.trim();
                this.currentUser = { 
                    email, 
                    isVerified: true, 
                    membershipType: this.selectedMembership,
                    userId: Date.now().toString(),
                    joinDate: new Date().toISOString()
                };

                // Initialize user data based on membership type
                this.initializeUserData();
                
                localStorage.setItem('artAssetUser', JSON.stringify(this.currentUser));
                this.showAppSection();
                this.showDefaultSection();
                this.clearOTPTimer();
                
                // Clear the OTP after successful verification
                this.currentOTP = null;
            }, 1000);

        } catch (error) {
            this.showAuthMessage('Invalid OTP. Please try again.', 'error');
        }
    }

    resendOTP() {
        const email = document.getElementById('email-input').value.trim();
        if (!email) {
            this.showAuthMessage('Please enter your email first', 'error');
            return;
        }

        // Generate new OTP
        const newOTP = this.generateOTP();
        this.showOTPInConsole(email, newOTP);
        
        // Restart timer
        this.startOTPTimer();
        document.getElementById('resend-otp-btn').style.display = 'none';
        
        this.showAuthMessage('New OTP sent! Check your browser console.', 'success');
        
        // Update any existing development message
        const existingDevMessage = document.querySelector('.auth-message.info');
        if (existingDevMessage) {
            existingDevMessage.innerHTML = `
                <strong>Development Mode:</strong> New OTP sent to console. 
                Press <kbd>F12</kbd> → Console to view your OTP: <strong>${newOTP}</strong>
            `;
        }
    }

    initializeUserData() {
        if (this.currentUser.membershipType === 'artist') {
            // Check if artist profile exists, if not create one
            const existingArtist = this.artists.find(a => a.userId === this.currentUser.userId);
            if (!existingArtist) {
                const newArtist = {
                    id: this.currentUser.userId,
                    userId: this.currentUser.userId,
                    email: this.currentUser.email,
                    name: this.currentUser.email.split('@')[0],
                    joinDate: this.currentUser.joinDate,
                    followers: 0,
                    totalPictures: 0,
                    publicCategories: []
                };
                this.artists.push(newArtist);
                this.saveArtists();
            }
        }
    }

    showDefaultSection() {
        if (this.currentUser.membershipType === 'artist') {
            this.showCatalogueManager();
        } else {
            this.showAIGenerator();
        }
    }

    showAppSection() {
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('app-section').classList.remove('hidden');
        document.getElementById('user-email').textContent = this.currentUser.email;
        
        // Show membership badge
        const badge = document.getElementById('membership-badge');
        badge.textContent = this.currentUser.membershipType;
        badge.className = `membership-badge ${this.currentUser.membershipType}`;

        // Show appropriate navigation
        if (this.currentUser.membershipType === 'artist') {
            document.getElementById('artist-nav').classList.remove('hidden');
            document.getElementById('innovator-nav').classList.add('hidden');
        } else {
            document.getElementById('innovator-nav').classList.remove('hidden');
            document.getElementById('artist-nav').classList.add('hidden');
        }
    }

    // OTP Timer Methods
    startOTPTimer() {
        this.otpTimeLeft = 120;
        this.updateOTPTimerDisplay();
        
        this.otpTimer = setInterval(() => {
            this.otpTimeLeft--;
            this.updateOTPTimerDisplay();
            
            if (this.otpTimeLeft <= 0) {
                this.clearOTPTimer();
                document.getElementById('resend-otp-btn').style.display = 'inline-block';
                this.currentOTP = null; // Invalidate OTP after expiration
            }
        }, 1000);
    }

    updateOTPTimerDisplay() {
        const minutes = Math.floor(this.otpTimeLeft / 60);
        const seconds = this.otpTimeLeft % 60;
        document.getElementById('otp-timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
        // Change color when time is running out
        const timerElement = document.getElementById('otp-timer');
        if (this.otpTimeLeft <= 30) {
            timerElement.style.color = '#f5576c';
        } else {
            timerElement.style.color = '#666';
        }
    }

    clearOTPTimer() {
        if (this.otpTimer) {
            clearInterval(this.otpTimer);
            this.otpTimer = null;
        }
    }

    backToEmail() {
        document.getElementById('otp-step').classList.add('hidden');
        document.getElementById('email-step').classList.remove('hidden');
        document.getElementById('resend-otp-btn').style.display = 'none';
        this.clearOTPTimer();
        this.showAuthMessage('');
        this.currentOTP = null;
        
        // Remove development messages
        const devMessages = document.querySelectorAll('.auth-message.info');
        devMessages.forEach(msg => msg.remove());
    }

    // Navigation Methods
    showAIGenerator() {
        this.hideAllSections();
        document.getElementById('ai-generator-section').classList.remove('hidden');
        this.loadFollowedArtwork();
    }

    showCatalogueManager() {
        this.hideAllSections();
        document.getElementById('catalogue-manager-section').classList.remove('hidden');
        this.renderCategories();
        this.updateArtistStats();
    }

    showArtistsBrowse() {
        this.hideAllSections();
        document.getElementById('artists-browse-section').classList.remove('hidden');
        this.renderArtistsBrowse();
    }

    showFollowing() {
        this.hideAllSections();
        document.getElementById('following-section').classList.remove('hidden');
        this.renderFollowing();
    }

    showArtistGallery() {
        this.hideAllSections();
        document.getElementById('artist-gallery-section').classList.remove('hidden');
        this.renderArtistGallery();
    }

    hideAllSections() {
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('hidden');
        });
    }

    // AI Innovator Methods
    loadFollowedArtwork() {
        const artistFilter = document.getElementById('artist-filter');
        const artworkGrid = document.getElementById('source-artwork-grid');
        
        // Clear existing
        artistFilter.innerHTML = '<option value="all">All Followed Artists</option>';
        artworkGrid.innerHTML = '';

        // Get followed artists
        const followedArtists = this.artists.filter(artist => 
            this.following.includes(artist.id)
        );

        if (followedArtists.length === 0) {
            artworkGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h4>Not Following Any Artists</h4>
                    <p>Browse artists and follow them to use their artwork for AI generation.</p>
                    <button class="btn btn-primary" onclick="app.showArtistsBrowse()">Browse Artists</button>
                </div>
            `;
            return;
        }

        // Populate artist filter
        followedArtists.forEach(artist => {
            const option = document.createElement('option');
            option.value = artist.id;
            option.textContent = artist.name;
            artistFilter.appendChild(option);
        });

        // Load artwork from all followed artists
        this.filterArtwork();
    }

    filterArtwork() {
        const selectedArtist = document.getElementById('artist-filter').value;
        const artworkGrid = document.getElementById('source-artwork-grid');
        
        let availableArtwork = [];
        
        // Get public pictures from followed artists
        this.categories.forEach(category => {
            if (category.isPublic && this.following.includes(category.owner)) {
                if (selectedArtist === 'all' || category.owner === selectedArtist) {
                    category.pictures.forEach(picture => {
                        const artist = this.artists.find(a => a.id === category.owner);
                        availableArtwork.push({
                            ...picture,
                            categoryName: category.name,
                            artistName: artist.name,
                            artistId: artist.id
                        });
                    });
                }
            }
        });

        if (availableArtwork.length === 0) {
            artworkGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-images"></i>
                    <h4>No Artwork Available</h4>
                    <p>No public artwork available from followed artists.</p>
                </div>
            `;
            document.getElementById('generate-art-btn').disabled = true;
            return;
        }

        // Render artwork grid
        artworkGrid.innerHTML = availableArtwork.map(artwork => `
            <div class="artwork-item ${this.selectedArtwork?.id === artwork.id ? 'selected' : ''}" 
                 onclick="app.selectSourceArtwork('${artwork.id}')">
                <img src="${artwork.url}" alt="${artwork.name}" class="artwork-image">
                <div class="artwork-info">
                    <div class="artwork-name">${artwork.name}</div>
                    <div class="artwork-artist">by ${artwork.artistName}</div>
                    <div class="artwork-category">${artwork.categoryName}</div>
                </div>
            </div>
        `).join('');

        document.getElementById('generate-art-btn').disabled = !this.selectedArtwork;
    }

    selectSourceArtwork(artworkId) {
        const allArtwork = document.querySelectorAll('.artwork-item');
        allArtwork.forEach(item => item.classList.remove('selected'));
        
        // Find the selected artwork
        let selectedArtwork = null;
        this.categories.forEach(category => {
            category.pictures.forEach(picture => {
                if (picture.id === artworkId) {
                    const artist = this.artists.find(a => a.id === category.owner);
                    selectedArtwork = {
                        ...picture,
                        categoryName: category.name,
                        artistName: artist.name,
                        artistId: artist.id
                    };
                }
            });
        });

        if (selectedArtwork) {
            this.selectedArtwork = selectedArtwork;
            const selectedElement = document.querySelector(`[onclick="app.selectSourceArtwork('${artworkId}')"]`);
            selectedElement.classList.add('selected');
            document.getElementById('generate-art-btn').disabled = false;
        }
    }

    async generateArt() {
        if (!this.selectedArtwork) {
            alert('Please select source artwork first!');
            return;
        }

        const prompt = document.getElementById('prompt-input').value.trim();
        if (!prompt) {
            alert('Please enter an AI prompt!');
            return;
        }

        // Show progress bar
        const progressBar = document.getElementById('progress-bar');
        progressBar.style.display = 'block';
        
        // Simulate generation process
        await this.simulateGeneration(prompt);
        
        // Show result
        this.showResult(prompt);
    }

    showResult(prompt) {
        document.getElementById('progress-bar').style.display = 'none';
        
        const resultSection = document.getElementById('result-section');
        resultSection.classList.remove('hidden');
        
        // Set original artwork
        document.getElementById('original-art').src = this.selectedArtwork.url;
        document.getElementById('original-artist').textContent = this.selectedArtwork.artistName;
        
        // Set AI prompt and generate result
        document.getElementById('used-prompt').textContent = prompt;
        this.displayGeneratedArt();
        
        // Scroll to result
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    displayGeneratedArt() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 512;
        
        // Create a more sophisticated AI-generated look
        const gradient = ctx.createLinearGradient(0, 0, 512, 512);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(0.5, '#764ba2');
        gradient.addColorStop(1, '#f093fb');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        
        // Add some AI-style elements
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(256, 256, 100, 0, Math.PI * 2);
        ctx.fill();
        
        // Add some abstract shapes
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(100 + i * 80, 150, 30 + i * 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        document.getElementById('generated-art').src = canvas.toDataURL();
    }

    // Artists Browse and Following
    renderArtistsBrowse() {
        const grid = document.getElementById('artists-grid');
        const currentArtistId = this.currentUser.userId;

        // Filter out current user if they're an artist
        const availableArtists = this.artists.filter(artist => 
            artist.id !== currentArtistId
        );

        if (availableArtists.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h4>No Artists Available</h4>
                    <p>No other artists have joined yet.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = availableArtists.map(artist => {
            const isFollowing = this.following.includes(artist.id);
            const publicPictures = this.categories
                .filter(cat => cat.owner === artist.id && cat.isPublic)
                .reduce((total, cat) => total + cat.pictures.length, 0);

            return `
                <div class="artist-card">
                    <div class="artist-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="artist-name">${artist.name}</div>
                    <div class="artist-stats-small">
                        <div class="artist-stat">
                            <span class="artist-stat-number">${artist.followers}</span>
                            <span class="artist-stat-label">Followers</span>
                        </div>
                        <div class="artist-stat">
                            <span class="artist-stat-number">${publicPictures}</span>
                            <span class="artist-stat-label">Public Pictures</span>
                        </div>
                    </div>
                    <button class="btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}" 
                            onclick="app.toggleFollow('${artist.id}')">
                        <i class="fas fa-${isFollowing ? 'heart' : 'user-plus'}"></i>
                        ${isFollowing ? 'Following' : 'Follow'}
                    </button>
                </div>
            `;
        }).join('');
    }

    toggleFollow(artistId) {
        const index = this.following.indexOf(artistId);
        
        if (index > -1) {
            // Unfollow
            this.following.splice(index, 1);
            // Update artist follower count
            const artist = this.artists.find(a => a.id === artistId);
            if (artist) artist.followers = Math.max(0, artist.followers - 1);
        } else {
            // Follow
            this.following.push(artistId);
            // Update artist follower count
            const artist = this.artists.find(a => a.id === artistId);
            if (artist) artist.followers++;
        }

        this.saveFollowing();
        this.saveArtists();
        
        // Refresh current view
        if (document.getElementById('artists-browse-section').classList.contains('hidden') === false) {
            this.renderArtistsBrowse();
        }
        if (document.getElementById('following-section').classList.contains('hidden') === false) {
            this.renderFollowing();
        }
        if (document.getElementById('ai-generator-section').classList.contains('hidden') === false) {
            this.loadFollowedArtwork();
        }
    }

    renderFollowing() {
        const container = document.getElementById('following-list');
        
        if (this.following.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart"></i>
                    <h4>Not Following Any Artists</h4>
                    <p>Start following artists to see their artwork here.</p>
                    <button class="btn btn-primary" onclick="app.showArtistsBrowse()">Browse Artists</button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.following.map(artistId => {
            const artist = this.artists.find(a => a.id === artistId);
            if (!artist) return '';

            const publicPictures = this.categories
                .filter(cat => cat.owner === artist.id && cat.isPublic)
                .reduce((pics, cat) => pics.concat(cat.pictures.map(pic => ({
                    ...pic,
                    categoryName: cat.name
                }))), []);

            return `
                <div class="following-artist">
                    <div class="following-header">
                        <div class="following-artist-info">
                            <div class="artist-avatar">
                                <i class="fas fa-user"></i>
                            </div>
                            <div>
                                <div class="artist-name">${artist.name}</div>
                                <div class="artist-stats-small">
                                    <span class="artist-stat">
                                        <span class="artist-stat-number">${publicPictures.length}</span>
                                        <span class="artist-stat-label">Public Pictures</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-secondary" onclick="app.toggleFollow('${artist.id}')">
                            <i class="fas fa-times"></i> Unfollow
                        </button>
                    </div>
                    ${publicPictures.length > 0 ? `
                        <div class="following-artwork-grid">
                            ${publicPictures.slice(0, 6).map(pic => `
                                <div class="artwork-item">
                                    <img src="${pic.url}" alt="${pic.name}" class="artwork-image">
                                    <div class="artwork-info">
                                        <div class="artwork-name">${pic.name}</div>
                                        <div class="artwork-category">${pic.categoryName}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <p style="text-align: center; color: #666; padding: 20px;">
                            No public pictures available from this artist.
                        </p>
                    `}
                </div>
            `;
        }).join('');
    }

    // Utility Methods
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showAuthMessage(message, type = '') {
        const messageEl = document.getElementById('auth-message');
        messageEl.textContent = message;
        messageEl.className = 'auth-message';
        if (type) {
            messageEl.classList.add(type);
        }
    }

    logout() {
        this.currentUser = null;
        this.selectedMembership = null;
        this.currentOTP = null;
        localStorage.removeItem('artAssetUser');
        this.showAuthSection();
        this.clearUploads();
    }

    showAuthSection() {
        document.getElementById('app-section').classList.add('hidden');
        document.getElementById('auth-section').classList.remove('hidden');
        this.backToMembership();
        this.showAuthMessage('');
        
        // Clear any development messages
        const devMessages = document.querySelectorAll('.auth-message.info');
        devMessages.forEach(msg => msg.remove());
    }

    // Add these placeholder methods for the catalogue functionality
    setupDragAndDrop() {
        const uploadArea = document.getElementById('bulk-upload-area');
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                const files = Array.from(e.dataTransfer.files);
                this.processBulkFiles(files);
            });

            uploadArea.addEventListener('click', () => {
                document.getElementById('bulk-image-upload').click();
            });
        }
    }

    processBulkFiles(files) {
        // Implementation for processing bulk files
        console.log('Processing bulk files:', files);
    }

    // Placeholder methods for other functionality
    showCategoryModal() {
        document.getElementById('category-modal').classList.remove('hidden');
    }

    saveCategory() {
        // Implementation for saving category
        console.log('Saving category...');
        this.closeModal(document.getElementById('category-modal'));
    }

    showUploadModal() {
        document.getElementById('upload-modal').classList.remove('hidden');
    }

    confirmUpload() {
        // Implementation for confirming upload
        console.log('Confirming upload...');
        this.closeModal(document.getElementById('upload-modal'));
    }

    handleBulkUpload(event) {
        const files = Array.from(event.target.files);
        this.processBulkFiles(files);
    }

    closeModal(modal) {
        modal.classList.add('hidden');
    }

    simulateGeneration(prompt) {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 10;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    resolve();
                }
                this.updateProgress(progress);
            }, 500);
        });
    }

    updateProgress(percentage) {
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${Math.round(percentage)}%`;
    }

    downloadArt() {
        const generatedArt = document.getElementById('generated-art');
        const link = document.createElement('a');
        link.download = `ai-art-${Date.now()}.png`;
        link.href = generatedArt.src;
        link.click();
    }

    regenerateArt() {
        document.getElementById('result-section').classList.add('hidden');
        this.generateArt();
    }

    saveToCollection() {
        // Implementation for saving to collection
        alert('Art saved to your collection!');
    }

    // Data persistence methods
    saveCategories() {
        localStorage.setItem('artAssetCategories', JSON.stringify(this.categories));
    }

    saveArtists() {
        localStorage.setItem('artAssetArtists', JSON.stringify(this.artists));
    }

    saveFollowing() {
        localStorage.setItem('artAssetFollowing', JSON.stringify(this.following));
    }

    saveAICollections() {
        localStorage.setItem('artAssetAICollections', JSON.stringify(this.aiCollections));
    }

    // Add these placeholder methods for rendering
    renderCategories() {
        // Implementation for rendering categories
        console.log('Rendering categories...');
    }

    renderArtistGallery() {
        // Implementation for rendering artist gallery
        console.log('Rendering artist gallery...');
    }

    updateArtistStats() {
        // Implementation for updating artist stats
        console.log('Updating artist stats...');
    }

    previousPage() {
        // Implementation for previous page
        console.log('Previous page...');
    }

    nextPage() {
        // Implementation for next page
        console.log('Next page...');
    }

    clearUploads() {
        // Implementation for clearing uploads
        console.log('Clearing uploads...');
    }
}

// Initialize the application
const app = new ArtAssetGenerator();