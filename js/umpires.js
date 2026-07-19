// Umpires Module

class UmpiresManager {
    constructor() {
        this.currentUser = getCurrentUser();
        this.umpires = [];
        this.allUmpires = [];
        this.regions = new Set();
        this.sports = [];
        this.currentFilters = {};
    }

    /**
     * Initialize umpires manager
     */
    async init() {
        if (!this.currentUser) {
            window.location.href = 'index.html';
            return;
        }

        await this.loadData();
        this.setupEventListeners();
        this.loadUmpires();
    }

    /**
     * Load data
     */
    async loadData() {
        try {
            let umpiresData = [];
            if (typeof sheetsAPI !== 'undefined' && sheetsAPI) {
                umpiresData = await sheetsAPI.readSheet(CONFIG.SHEETS.UMPIRES);
            } else {
                umpiresData = JSON.parse(localStorage.getItem('sheet_' + (CONFIG.SHEETS.UMPIRES || 'UMPIRES')) || '[]');
            }
            this.processUmpires(umpiresData);

            let sportsData = [];
            if (typeof sheetsAPI !== 'undefined' && sheetsAPI) {
                sportsData = await sheetsAPI.readSheet(CONFIG.SHEETS.SPORTS);
            } else {
                sportsData = JSON.parse(localStorage.getItem('sheet_' + (CONFIG.SHEETS.SPORTS || 'SPORTS')) || '[]');
            }
            this.processSports(sportsData);

            this.updateFilters();
        } catch (error) {
            console.error('Error loading umpires data:', error);
            showToast('Error loading umpires', 'error');
        }
    }

    /**
     * Process umpires data
     */
    processUmpires(data) {
        if (!data || data.length <= 1) return;

        this.umpires = data.slice(1).map(row => ({
            id: row[0],
            name: row[1],
            email: row[2],
            phone: row[3],
            age: parseInt(row[4]) || 0,
            rank: row[5],
            location: row[6],
            region: row[7],
            sports: row[8] ? row[8].split(',').map(s => s.trim()) : [],
            availableDays: row[9] ? row[9].split(',').map(d => d.trim()) : [],
            preferredTimes: row[10] ? row[10].split(',').map(t => t.trim()) : [],
            rating: parseFloat(row[11]) || 0
        }));

        this.allUmpires = [...this.umpires];

        // Collect regions
        this.umpires.forEach(umpire => {
            if (umpire.region) this.regions.add(umpire.region);
        });
    }

    /**
     * Process sports data
     */
    processSports(data) {
        if (!data || data.length <= 1) return;

        this.sports = data.slice(1).map(row => ({
            name: row[1]
        }));
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const umpireForm = document.getElementById('umpireForm');
        if (umpireForm) {
            umpireForm.addEventListener('submit', (e) => this.handleAddUmpire(e));
        }

        const regionFilter = document.getElementById('regionFilter');
        if (regionFilter) {
            this.regions.forEach(region => {
                const option = document.createElement('option');
                option.value = region;
                option.textContent = region;
                regionFilter.appendChild(option);
            });
        }

        const sportsCheckboxes = document.getElementById('sportsList');
        if (sportsCheckboxes) {
            this.sports.forEach(sport => {
                const label = document.createElement('label');
                label.innerHTML = `<input type="checkbox" name="sports" value="${sport.name}"> ${sport.name}`;
                sportsCheckboxes.appendChild(label);
            });
        }
    }

    /**
     * Update filter options
     */
    updateFilters() {
        // Setup sport filter in match creation
        const sportSelects = document.querySelectorAll('#gsSport, #sportSport');
        sportSelects.forEach(select => {
            this.sports.forEach(sport => {
                const option = document.createElement('option');
                option.value = sport.name;
                option.textContent = sport.name;
                select.appendChild(option);
            });
        });
    }

    /**
     * Load and display umpires
     */
    loadUmpires() {
        const list = document.getElementById('umpiresList');
        if (!list) return;

        if (this.umpires.length === 0) {
            list.innerHTML = '<div class="loading">No umpires found</div>';
            return;
        }

        list.innerHTML = this.umpires.map(umpire => this.createUmpireCard(umpire)).join('');
    }

    /**
     * Create umpire card
     */
    createUmpireCard(umpire) {
        const initials = getInitials(umpire.name);
        const rankColor = umpire.rank === 'professional' ? 'professional' 
                        : umpire.rank === 'advanced' ? 'advanced' 
                        : 'beginner';

        return `
            <div class="umpire-card" onclick="umpiresManager.showUmpireProfile('${umpire.id}')">
                <div class="umpire-card-header">
                    <div class="umpire-avatar" style="background-color: ${getRandomColor()}">${initials}</div>
                    <h3 class="umpire-name">${umpire.name}</h3>
                    <p class="umpire-rank">${umpire.rank}</p>
                </div>

                <div class="umpire-card-body">
                    <div class="umpire-detail">
                        <span class="umpire-detail-label">Age:</span>
                        <span class="umpire-detail-value">${umpire.age}</span>
                    </div>
                    <div class="umpire-detail">
                        <span class="umpire-detail-label">Location:</span>
                        <span class="umpire-detail-value">${umpire.location}</span>
                    </div>
                    <div class="umpire-detail">
                        <span class="umpire-detail-label">Region:</span>
                        <span class="umpire-detail-value">${umpire.region}</span>
                    </div>
                    <div class="umpire-detail">
                        <span class="umpire-detail-label">Sports:</span>
                        <span class="umpire-detail-value">
                            ${umpire.sports.slice(0, 2).map(s => `<span class="sport-chip">${s}</span>`).join('')}
                            ${umpire.sports.length > 2 ? `<span class="sport-chip">+${umpire.sports.length - 2}</span>` : ''}
                        </span>
                    </div>
                </div>

                <div class="umpire-card-footer">
                    <button class="btn-view-profile" onclick="event.stopPropagation(); umpiresManager.showUmpireProfile('${umpire.id}')">
                        View Profile
                    </button>
                    ${this.currentUser.userType === CONFIG.USER_TYPES.MANAGER ? `
                        <button class="btn-select-umpire" onclick="event.stopPropagation(); umpiresManager.selectUmpire('${umpire.id}')">
                            Select
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Show umpire profile
     */
    showUmpireProfile(umpireId) {
        const umpire = this.umpires.find(u => u.id === umpireId);
        if (!umpire) return;

        const modal = document.getElementById('umpireProfileModal');
        const content = document.getElementById('umpireProfileContent');

        if (!content) return;

        const initials = getInitials(umpire.name);

        content.innerHTML = `
            <div class="umpire-profile-content">
                <div class="profile-header-section">
                    <div class="profile-avatar-large" style="background: linear-gradient(135deg, ${getRandomColor()} 0%, ${getRandomColor()} 100%)">
                        ${initials}
                    </div>
                    <div class="profile-info-large">
                        <h2>${umpire.name}</h2>
                        <div class="profile-rank">
                            <span class="umpire-badge ${umpire.rank}">${umpire.rank}</span>
                        </div>
                        <div class="profile-meta">
                            <div>📧 ${umpire.email}</div>
                            <div>📞 ${umpire.phone}</div>
                            <div>🎂 ${umpire.age} years old</div>
                            <div>⭐ ${umpire.rating}/5.0</div>
                        </div>
                    </div>
                </div>

                <div class="profile-section">
                    <h3>Location & Coverage</h3>
                    <div class="profile-section-content">
                        <div class="profile-item">
                            <div class="profile-item-label">Location</div>
                            <div class="profile-item-value">${umpire.location}</div>
                        </div>
                        <div class="profile-item">
                            <div class="profile-item-label">Region</div>
                            <div class="profile-item-value">${umpire.region}</div>
                        </div>
                    </div>
                </div>

                <div class="profile-section">
                    <h3>Sports Expertise</h3>
                    <div class="profile-section-content">
                        ${umpire.sports.map(sport => `
                            <div class="profile-item">
                                <div class="profile-item-label">${sport}</div>
                                <div class="profile-item-value">Certified</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="profile-section">
                    <h3>Availability</h3>
                    <div class="availability-grid">
                        ${CONFIG.DAYS_FULL.map(day => `
                            <div class="day-badge ${umpire.availableDays.some(d => d.toLowerCase() === day.toLowerCase()) ? 'available' : ''}">
                                ${day.substring(0, 3)}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="profile-section">
                    <h3>Preferred Times</h3>
                    <div class="profile-section-content">
                        ${umpire.preferredTimes.map(time => `
                            <div class="profile-item">
                                <div class="profile-item-label">${time}</div>
                                <div class="profile-item-value">Available</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        openModal('umpireProfileModal');
    }

    /**
     * Apply filters
     */
    applyFilters() {
        const rank = document.getElementById('rankFilter')?.value || '';
        const ageMin = parseInt(document.getElementById('ageMin')?.value) || 0;
        const ageMax = parseInt(document.getElementById('ageMax')?.value) || 100;
        const location = document.getElementById('locationFilter')?.value || '';
        const region = document.getElementById('regionFilter')?.value || '';
        const availability = document.getElementById('availabilityFilter')?.value || '';
        const timePreference = document.getElementById('timeFilter')?.value || '';

        this.currentFilters = {
            rank, ageMin, ageMax, location, region, availability, timePreference
        };

        this.umpires = this.allUmpires.filter(umpire => {
            if (rank && umpire.rank !== rank) return false;
            if (umpire.age < ageMin || umpire.age > ageMax) return false;
            if (location && !umpire.location.toLowerCase().includes(location.toLowerCase())) return false;
            if (region && umpire.region !== region) return false;
            if (availability && !umpire.availableDays.some(d => d.toLowerCase() === availability.toLowerCase())) return false;
            if (timePreference && !umpire.preferredTimes.includes(timePreference)) return false;
            return true;
        });

        this.loadUmpires();
    }

    /**
     * Clear filters
     */
    clearFilters() {
        document.getElementById('rankFilter').value = '';
        document.getElementById('ageMin').value = '';
        document.getElementById('ageMax').value = '';
        document.getElementById('locationFilter').value = '';
        document.getElementById('regionFilter').value = '';
        document.getElementById('availabilityFilter').value = '';
        document.getElementById('timeFilter').value = '';

        this.umpires = [...this.allUmpires];
        this.currentFilters = {};
        this.loadUmpires();
    }

    /**
     * Search umpires
     */
    searchUmpires(query = '') {
        const searchInput = document.getElementById('umpireSearch')?.value || query;
        
        if (!searchInput) {
            this.umpires = [...this.allUmpires];
        } else {
            const lowerQuery = searchInput.toLowerCase();
            this.umpires = this.allUmpires.filter(umpire =>
                umpire.name.toLowerCase().includes(lowerQuery) ||
                umpire.location.toLowerCase().includes(lowerQuery) ||
                umpire.sports.some(s => s.toLowerCase().includes(lowerQuery))
            );
        }

        this.loadUmpires();
    }

    /**
     * Select umpire for match
     */
    selectUmpire(umpireId) {
        const button = event.target;
        const umpire = this.umpires.find(u => u.id === umpireId);
        
        if (!umpire) return;

        if (button.classList.contains('selected')) {
            // Deselect
            button.classList.remove('selected');
            const index = matchesManager.selectedUmpires.indexOf(umpireId);
            if (index > -1) {
                matchesManager.selectedUmpires.splice(index, 1);
            }
        } else {
            // Select
            button.classList.add('selected');
            if (!matchesManager.selectedUmpires.includes(umpireId)) {
                matchesManager.selectedUmpires.push(umpireId);
            }
        }

        this.updateAssignedUmpiresList();
    }

    /**
     * Update assigned umpires list
     */
    updateAssignedUmpiresList() {
        const assignedList = document.getElementById('assignedUmpiresList');
        if (!assignedList) return;

        if (matchesManager.selectedUmpires.length === 0) {
            assignedList.innerHTML = '<p style="color: #cbd5e1;">No umpires selected yet</p>';
            return;
        }

        assignedList.innerHTML = matchesManager.selectedUmpires.map(umpireId => {
            const umpire = this.umpires.find(u => u.id === umpireId);
            return umpire ? `
                <div class="assigned-umpire">
                    <span>${umpire.name} (${umpire.rank})</span>
                    <button type="button" onclick="event.preventDefault(); matchesManager.selectedUmpires = matchesManager.selectedUmpires.filter(id => id !== '${umpireId}'); umpiresManager.updateAssignedUmpiresList();">×</button>
                </div>
            ` : '';
        }).join('');
    }

    /**
     * Handle add umpire
     */
    async handleAddUmpire(e) {
        e.preventDefault();

        const formData = {
            id: generateId(),
            name: document.getElementById('umpireName').value,
            email: document.getElementById('umpireEmail').value,
            phone: document.getElementById('umpirePhone').value,
            age: document.getElementById('umpireAge').value,
            rank: document.getElementById('umpireRank').value,
            location: document.getElementById('umpireLocation').value,
            region: document.getElementById('umpireRegion').value,
            sports: Array.from(document.querySelectorAll('input[name="sports"]:checked')).map(cb => cb.value),
            availableDays: Array.from(document.querySelectorAll('input[name="availableDays"]:checked')).map(cb => cb.value),
            preferredTimes: Array.from(document.querySelectorAll('input[name="preferredTime"]:checked')).map(cb => cb.value),
            rating: 0
        };

        try {
            showLoading();

            if (typeof sheetsAPI !== 'undefined' && sheetsAPI) {
                await sheetsAPI.appendSheet(CONFIG.SHEETS.UMPIRES, [
                    formData.id,
                    formData.name,
                    formData.email,
                    formData.phone,
                    formData.age,
                    formData.rank,
                    formData.location,
                    formData.region,
                    formData.sports.join(','),
                    formData.availableDays.join(','),
                    formData.preferredTimes.join(','),
                    formData.rating
                ]);
            } else {
                const key = 'sheet_' + (CONFIG.SHEETS.UMPIRES || 'UMPIRES');
                const existing = JSON.parse(localStorage.getItem(key) || '[]');
                existing.push([
                    formData.id,
                    formData.name,
                    formData.email,
                    formData.phone,
                    formData.age,
                    formData.rank,
                    formData.location,
                    formData.region,
                    formData.sports.join(','),
                    formData.availableDays.join(','),
                    formData.preferredTimes.join(','),
                    formData.rating
                ]);
                localStorage.setItem(key, JSON.stringify(existing));
            }

            this.umpires.push(formData);
            this.allUmpires.push(formData);

            showToast('Umpire added successfully!', 'success');
            closeModal('umpireModal');
            this.loadUmpires();

            document.getElementById('umpireForm').reset();
        } catch (error) {
            console.error('Error adding umpire:', error);
            showToast('Error adding umpire', 'error');
        } finally {
            hideLoading();
        }
    }
}

// Create umpires manager instance
const umpiresManager = new UmpiresManager();

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => umpiresManager.init());
} else {
    umpiresManager.init();
}

// Open add umpire modal
function openAddUmpireModal() {
    document.getElementById('umpireForm').reset();
    openModal('umpireModal');
}

function closeAddUmpireModal() {
    closeModal('umpireModal');
}

function closeUmpireProfile() {
    closeModal('umpireProfileModal');
}

// Make functions globally available
window.umpiresManager = umpiresManager;
window.openAddUmpireModal = openAddUmpireModal;
window.closeAddUmpireModal = closeAddUmpireModal;
window.closeUmpireProfile = closeUmpireProfile;
window.applyFilters = () => umpiresManager.applyFilters();
window.clearFilters = () => umpiresManager.clearFilters();
window.searchUmpires = () => umpiresManager.searchUmpires();
