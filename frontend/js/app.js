// frontend/js/app.js
class ArtAssetGenerator {
    constructor() {
        this.currentUser = null;
        this.selectedMembership = null;
        this.otpTimer = null;
        this.otpTimeLeft = 120;
        
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
            
            setTimeout(() => {
                document.getElementById('email-step').classList.add('hidden');
                document.getElementById('otp-step').classList.remove('hidden');
                this.startOTPTimer();
                this.showAuthMessage('OTP sent to your email!', 'success');
            }, 1000);

        } catch (error) {
            this.showAuthMessage('Failed to send OTP. Please try again.', 'error');
        }
    }

    async verifyOTP() {
        const otp = document.getElementById('otp-input').value.trim();
        
        if (otp.length !== 6 || !/^\d+$/.test(otp)) {
            this.showAuthMessage('Please enter a valid 6-digit OTP', 'error');
            return;
        }

        try {
            this.showAuthMessage('Verifying OTP...', 'success');
            
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
            }, 1000);

        } catch (error) {
            this.showAuthMessage('Invalid OTP. Please try again.', 'error');
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

    // Artist Catalogue Management (Similar to previous implementation)
    showCategoryModal() {
        document.getElementById('category-modal').classList.remove('hidden');
    }

    saveCategory() {
        const name = document.getElementById('category-name').value.trim();
        const description = document.getElementById('category-description').value.trim();
        const isPublic = document.getElementById('category-public').checked;

        if (!name) {
            alert('Please enter a category name');
            return;
        }

        const newCategory = {
            id: Date.now().toString(),
            name,
            description,
            isPublic,
            owner: this.currentUser.userId,
            created: new Date().toISOString(),
            pictureCount: 0,
            pictures: []
        };

        this.categories.push(newCategory);
        this.saveCategories();
        this.closeModal(document.getElementById('category-modal'));
        this.renderCategories();
        
        // Clear form
        document.getElementById('category-name').value = '';
        document.getElementById('category-description').value = '';
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
                        <i class="fas fa-${isFollowing ? 'heart' : 'heart'}"></i>
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
    updateArtistStats() {
        if (this.currentUser.membershipType !== 'artist') return;

        const totalPictures = this.categories
            .filter(cat => cat.owner === this.currentUser.userId)
            .reduce((total, cat) => total + cat.pictures.length, 0);

        const artist = this.artists.find(a => a.id === this.currentUser.userId);
        const totalFollowers = artist ? artist.followers : 0;

        document.getElementById('total-pictures').textContent = totalPictures;
        document.getElementById('total-followers').textContent = totalFollowers;
    }

    // ... (Include all other utility methods from previous implementation like:
    // setupDragAndDrop, handleBulkUpload, renderCategories, renderPicturesGrid, etc.)

    // Save data methods
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

    // ... (Include all other methods from previous implementation)
}

// Initialize the application
const app = new ArtAssetGenerator();