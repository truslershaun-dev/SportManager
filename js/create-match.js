// Create Match Module

class CreateMatchManager {
    constructor() {
        this.currentUser = getCurrentUser();
        this.teams = [];
        this.sports = [];
        this.umpires = [];
        this.selectedUmpires = [];
    }

    /**
     * Initialize create match manager
     */
    async init() {
        if (!this.currentUser) {
            window.location.href = 'index.html';
            return;
        }

        if (!isAdminUser(this.currentUser) && this.currentUser.userType !== CONFIG.USER_TYPES.MANAGER) {
            showToast('Only team managers and administrators can create matches.', 'error');
            window.location.href = 'matches.html';
            return;
        }

        this.setupUI();
        await this.loadData();
        this.setupEventListeners();
    }

    /**
     * Setup UI
     */
    setupUI() {
        const userName = document.getElementById('userDisplay');
        if (userName) userName.textContent = this.currentUser.name;
    }

    /**
     * Load data
     */
    async loadData() {
        try {
            // Load teams
            let teamsData = [];
            if (typeof sheetsAPI !== 'undefined' && sheetsAPI) {
                teamsData = await sheetsAPI.readSheet(CONFIG.SHEETS.TEAMS);
            } else {
                teamsData = JSON.parse(localStorage.getItem('sheet_' + (CONFIG.SHEETS.TEAMS || 'TEAMS')) || '[]');
            }
            this.processTeams(teamsData);
            this.filterTeamsByRegion();

            // Load sports
            let sportsData = [];
            if (typeof sheetsAPI !== 'undefined' && sheetsAPI) {
                sportsData = await sheetsAPI.readSheet(CONFIG.SHEETS.SPORTS);
            } else {
                sportsData = JSON.parse(localStorage.getItem('sheet_' + (CONFIG.SHEETS.SPORTS || 'SPORTS')) || '[]');
            }
            this.processSports(sportsData);

            // Load umpires
            let umpiresData = [];
            if (typeof sheetsAPI !== 'undefined' && sheetsAPI) {
                umpiresData = await sheetsAPI.readSheet(CONFIG.SHEETS.UMPIRES);
            } else {
                umpiresData = JSON.parse(localStorage.getItem('sheet_' + (CONFIG.SHEETS.UMPIRES || 'UMPIRES')) || '[]');
            }
            this.processUmpires(umpiresData);

            this.updateSelects();
            this.renderUmpiresList();
        } catch (error) {
            console.error('Error loading data:', error);
            showToast('Error loading data', 'error');
        }
    }

    /**
     * Process teams
     */
    processTeams(data) {
        if (!data || data.length <= 1) return;
        this.teams = data.slice(1).map(row => ({
            id: row[0],
            name: row[1],
            sport: row[2],
            location: row[3]
        }));
    }

    filterTeamsByRegion() {
        if (!this.currentUser || !this.currentUser.location) {
            return;
        }

        const region = this.currentUser.location.toLowerCase().trim();
        if (!region) return;

        this.teams = this.teams.filter(team => {
            const teamLocation = team.location ? team.location.toLowerCase() : '';
            return teamLocation === region || teamLocation.includes(region) || region.includes(teamLocation);
        });
    }

    /**
     * Process sports
     */
    processSports(data) {
        if (!data || data.length <= 1) return;
        this.sports = data.slice(1).map(row => ({
            id: row[0],
            name: row[1],
            category: row[2]
        }));
    }

    /**
     * Process umpires
     */
    processUmpires(data) {
        if (!data || data.length <= 1) return;
        this.umpires = data.slice(1).map(row => ({
            id: row[0],
            name: row[1],
            email: row[2],
            rank: row[3],
            location: row[4],
            region: row[5],
            sports: row[6] ? row[6].split(',').map(s => s.trim()) : [],
            availableDays: row[7] ? row[7].split(',').map(d => d.trim()) : [],
            preferredTimes: row[8] ? row[8].split(',').map(t => t.trim()) : [],
            age: row[9]
        }));
    }

    /**
     * Update select dropdowns
     */
    updateSelects() {
        // Update sport select
        const sportSelect = document.getElementById('matchSport');
        if (sportSelect) {
            sportSelect.innerHTML = '<option value="">Select Sport</option>';
            this.sports.forEach(sport => {
                const option = document.createElement('option');
                option.value = sport.name;
                option.textContent = sport.name;
                sportSelect.appendChild(option);
            });
        }

        // Update team selects
        const homeTeamSelect = document.getElementById('homeTeam');
        const awayTeamSelect = document.getElementById('awayTeam');

        [homeTeamSelect, awayTeamSelect].forEach(select => {
            if (select) {
                select.innerHTML = '<option value="">Select Team</option>';
                this.teams.forEach(team => {
                    const option = document.createElement('option');
                    option.value = team.name;
                    option.textContent = `${team.name} (${team.sport})`;
                    select.appendChild(option);
                });
            }
        });
    }

    /**
     * Render umpires list with checkboxes
     */
    renderUmpiresList(filtered = null) {
        const umpiresList = document.getElementById('umpiresList');
        if (!umpiresList) return;

        const umpiresData = filtered || this.umpires;

        if (umpiresData.length === 0) {
            umpiresList.innerHTML = '<div class="no-results">No umpires found</div>';
            return;
        }

        umpiresList.innerHTML = umpiresData.map(umpire => `
            <div class="umpire-item">
                <div class="umpire-checkbox">
                    <input 
                        type="checkbox" 
                        id="umpire_${umpire.id}" 
                        value="${umpire.id}"
                        ${this.selectedUmpires.includes(umpire.id) ? 'checked' : ''}
                        onchange="createMatchManager.toggleUmpire('${umpire.id}', '${umpire.name}')"
                    >
                </div>
                <div class="umpire-info">
                    <div class="umpire-header">
                        <label for="umpire_${umpire.id}" class="umpire-name">${umpire.name}</label>
                        <span class="umpire-badge ${umpire.rank}">${umpire.rank}</span>
                    </div>
                    <div class="umpire-details">
                        <span>📍 ${umpire.location}</span>
                        <span>🏆 ${umpire.region}</span>
                        ${umpire.age ? `<span>📅 Age: ${umpire.age}</span>` : ''}
                    </div>
                    <div class="umpire-sports">
                        <strong>Sports:</strong> ${umpire.sports.length > 0 ? umpire.sports.join(', ') : 'Not specified'}
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Toggle umpire selection
     */
    toggleUmpire(umpireId, umpireName) {
        const checkbox = document.getElementById(`umpire_${umpireId}`);
        
        if (checkbox.checked) {
            if (!this.selectedUmpires.includes(umpireId)) {
                this.selectedUmpires.push(umpireId);
            }
        } else {
            this.selectedUmpires = this.selectedUmpires.filter(id => id !== umpireId);
        }

        this.updateSelectedUmpiresList();
    }

    /**
     * Update selected umpires display
     */
    updateSelectedUmpiresList() {
        const selectedCount = document.getElementById('selectedCount');
        const selectedList = document.getElementById('selectedUmpiresList');

        if (selectedCount) {
            selectedCount.textContent = this.selectedUmpires.length;
        }

        if (selectedList) {
            if (this.selectedUmpires.length === 0) {
                selectedList.innerHTML = '<p class="no-selection">No umpires selected</p>';
            } else {
                selectedList.innerHTML = this.selectedUmpires.map(umpireId => {
                    const umpire = this.umpires.find(u => u.id === umpireId);
                    return umpire ? `
                        <div class="selected-item">
                            <span>${umpire.name} <small>(${umpire.rank})</small></span>
                            <button 
                                type="button" 
                                class="btn-remove" 
                                onclick="createMatchManager.toggleUmpire('${umpire.id}', '${umpire.name}')"
                            >✕</button>
                        </div>
                    ` : '';
                }).join('');
            }
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search
        const searchInput = document.getElementById('umpireSearch');
        if (searchInput) {
            searchInput.addEventListener('keyup', (e) => this.searchUmpires(e.target.value));
        }

        // Rank filter
        const rankFilter = document.getElementById('umpireRankFilter');
        if (rankFilter) {
            rankFilter.addEventListener('change', (e) => this.filterByRank(e.target.value));
        }
    }

    /**
     * Search umpires
     */
    searchUmpires(query) {
        if (!query) {
            this.renderUmpiresList();
            return;
        }

        const filtered = this.umpires.filter(umpire =>
            umpire.name.toLowerCase().includes(query.toLowerCase()) ||
            umpire.location.toLowerCase().includes(query.toLowerCase()) ||
            umpire.sports.some(sport => sport.toLowerCase().includes(query.toLowerCase()))
        );

        this.renderUmpiresList(filtered);
    }

    /**
     * Filter umpires by rank
     */
    filterByRank(rank) {
        const filtered = rank ? this.umpires.filter(u => u.rank === rank) : this.umpires;
        this.renderUmpiresList(filtered);
    }

    /**
     * Handle create match
     */
    async handleCreateMatch(e) {
        e.preventDefault();

        const formData = {
            id: generateId(),
            date: document.getElementById('matchDate').value,
            time: document.getElementById('matchTime').value,
            sport: document.getElementById('matchSport').value,
            homeTeam: document.getElementById('homeTeam').value,
            awayTeam: document.getElementById('awayTeam').value,
            location: document.getElementById('matchLocation').value,
            status: CONFIG.MATCH_STATUS.UPCOMING,
            homeScore: '-',
            awayScore: '-',
            umpires: this.selectedUmpires.join(','),
            notes: ''
        };

        try {
            showLoading();

            if (typeof sheetsAPI !== 'undefined' && sheetsAPI) {
                await sheetsAPI.appendSheet(CONFIG.SHEETS.MATCHES, [
                    formData.id,
                    formData.date,
                    formData.time,
                    formData.sport,
                    formData.homeTeam,
                    formData.awayTeam,
                    formData.location,
                    formData.status,
                    formData.homeScore,
                    formData.awayScore,
                    formData.umpires,
                    formData.notes
                ]);
            } else {
                const key = 'sheet_' + (CONFIG.SHEETS.MATCHES || 'MATCHES');
                const existing = JSON.parse(localStorage.getItem(key) || '[]');
                existing.push([
                    formData.id,
                    formData.date,
                    formData.time,
                    formData.sport,
                    formData.homeTeam,
                    formData.awayTeam,
                    formData.location,
                    formData.status,
                    formData.homeScore,
                    formData.awayScore,
                    formData.umpires,
                    formData.notes
                ]);
                localStorage.setItem(key, JSON.stringify(existing));
            }

            showToast('Match created successfully!', 'success');
            
            setTimeout(() => {
                window.location.href = 'matches.html';
            }, 1000);
        } catch (error) {
            console.error('Error creating match:', error);
            showToast('Error creating match', 'error');
        } finally {
            hideLoading();
        }
    }
}

// Create manager instance
const createMatchManager = new CreateMatchManager();

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => createMatchManager.init());
} else {
    createMatchManager.init();
}

// Form submission
const matchForm = document.getElementById('matchForm');
if (matchForm) {
    matchForm.addEventListener('submit', (e) => createMatchManager.handleCreateMatch(e));
}

// Cancel button
function cancelCreateMatch() {
    window.location.href = 'matches.html';
}

// Global access
window.createMatchManager = createMatchManager;
window.cancelCreateMatch = cancelCreateMatch;
