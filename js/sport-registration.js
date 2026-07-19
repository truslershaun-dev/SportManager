// Sport Registration Module

class SportRegistrationManager {
    constructor() {
        this.currentUser = getCurrentUser();
        this.sports = [];
        this.allSports = [];
    }

    async init() {
        if (!this.currentUser) {
            window.location.href = 'index.html';
            return;
        }

        await this.loadData();
        this.loadSports();
        this.setupEventListeners();
    }

    async loadData() {
        try {
            let sportsData = [];
            if (typeof sheetsAPI !== 'undefined' && sheetsAPI) {
                sportsData = await sheetsAPI.readSheet(CONFIG.SHEETS.SPORTS);
            } else {
                sportsData = JSON.parse(localStorage.getItem('sheet_' + (CONFIG.SHEETS.SPORTS || 'SPORTS')) || '[]');
            }
            this.processSports(sportsData);
        } catch (error) {
            console.error('Error loading sports data:', error);
            showToast('Error loading sports', 'error');
        }
    }

    processSports(data) {
        if (!data || data.length <= 1) return;

        this.sports = data.slice(1).map(row => ({
            id: row[0],
            name: row[1],
            category: row[2],
            description: row[3] || '',
            teamSize: parseInt(row[4]) || 0,
            duration: parseInt(row[5]) || 0,
            requiredUmpires: parseInt(row[6]) || 0,
            winPoints: parseInt(row[7]) || 0,
            drawPoints: parseInt(row[8]) || 0,
            lossPoints: parseInt(row[9]) || 0,
            minAge: parseInt(row[10]) || 0,
            maxAge: parseInt(row[11]) || 0,
            regions: row[12] ? row[12].split(',').map(r => r.trim()) : []
        }));

        this.allSports = [...this.sports];
    }

    setupEventListeners() {
        const sportForm = document.getElementById('sportForm');
        if (sportForm) {
            sportForm.addEventListener('submit', (e) => this.handleRegisterSport(e));
        }
    }

    loadSports() {
        const list = document.getElementById('sportsList');
        if (!list) return;

        if (this.sports.length === 0) {
            list.innerHTML = '<div class="loading">No sports registered yet</div>';
            return;
        }

        list.innerHTML = this.sports.map(sport => `
            <div class="card" onclick="sportRegistrationManager.showSportDetails('${sport.id}')">
                <h3>${sport.name}</h3>
                <p><strong>Category:</strong> <span style="text-transform: capitalize;">${sport.category}</span></p>
                <p><strong>Team Size:</strong> ${sport.teamSize} per team</p>
                <p><strong>Duration:</strong> ${sport.duration} minutes</p>
                <p><strong>Required Umpires:</strong> ${sport.requiredUmpires}</p>
                <p><strong>Age Range:</strong> ${sport.minAge} - ${sport.maxAge || 'No Limit'}</p>
                <p>${sport.description}</p>
                <div class="card-footer">
                    <button class="btn-primary" onclick="event.stopPropagation(); sportRegistrationManager.showSportDetails('${sport.id}')">View Details</button>
                    <button class="btn-secondary" onclick="event.stopPropagation(); sportRegistrationManager.editSport('${sport.id}')">Edit</button>
                </div>
            </div>
        `).join('');
    }

    showSportDetails(sportId) {
        const sport = this.sports.find(s => s.id === sportId);
        if (!sport) return;

        const modal = document.getElementById('sportDetailsModal');
        const content = document.getElementById('sportDetailsContent');

        if (!content) return;

        content.innerHTML = `
            <div style="padding: 20px 0;">
                <h2>${sport.name}</h2>
                <p><strong>Category:</strong> <span style="text-transform: capitalize;">${sport.category}</span></p>
                <p><strong>Description:</strong></p>
                <p>${sport.description}</p>
                
                <h3>Game Configuration</h3>
                <p><strong>Standard Team Size:</strong> ${sport.teamSize} players</p>
                <p><strong>Game Duration:</strong> ${sport.duration} minutes</p>
                <p><strong>Required Umpires:</strong> ${sport.requiredUmpires}</p>
                
                <h3>Scoring System</h3>
                <p>Win: <strong>${sport.winPoints}pts</strong> | Draw: <strong>${sport.drawPoints}pts</strong> | Loss: <strong>${sport.lossPoints}pts</strong></p>
                
                <h3>League Rules</h3>
                <p><strong>Age Range:</strong> ${sport.minAge} years old ${sport.maxAge ? `to ${sport.maxAge}` : ''}</p>
                <p><strong>Available Regions:</strong> ${sport.regions.join(', ') || 'All regions'}</p>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button class="btn-secondary" onclick="sportRegistrationManager.editSport('${sport.id}')">Edit Sport</button>
                <button class="btn-danger" onclick="sportRegistrationManager.deleteSport('${sport.id}')">Delete Sport</button>
            </div>
        `;

        openModal('sportDetailsModal');
    }

    async handleRegisterSport(e) {
        e.preventDefault();

        const formData = {
            id: generateId(),
            name: document.getElementById('sportName').value,
            category: document.getElementById('sportCategory').value,
            description: document.getElementById('sportDescription').value,
            teamSize: document.getElementById('sportTeamSize').value,
            duration: document.getElementById('sportDuration').value,
            requiredUmpires: document.getElementById('sportUmpires').value,
            winPoints: document.getElementById('sportWinPoints').value,
            drawPoints: document.getElementById('sportDrawPoints').value,
            lossPoints: document.getElementById('sportLossPoints').value,
            minAge: document.getElementById('sportMinAge').value,
            maxAge: document.getElementById('sportMaxAge').value,
            regions: document.getElementById('sportRegions').value
        };

        try {
            showLoading();


            if (typeof sheetsAPI !== 'undefined' && sheetsAPI) {
                await sheetsAPI.appendSheet(CONFIG.SHEETS.SPORTS, [
                    formData.id,
                    formData.name,
                    formData.category,
                    formData.description,
                    formData.teamSize,
                    formData.duration,
                    formData.requiredUmpires,
                    formData.winPoints,
                    formData.drawPoints,
                    formData.lossPoints,
                    formData.minAge,
                    formData.maxAge,
                    formData.regions
                ]);
            } else {
                const key = 'sheet_' + (CONFIG.SHEETS.SPORTS || 'SPORTS');
                const existing = JSON.parse(localStorage.getItem(key) || '[]');
                existing.push([
                    formData.id,
                    formData.name,
                    formData.category,
                    formData.description,
                    formData.teamSize,
                    formData.duration,
                    formData.requiredUmpires,
                    formData.winPoints,
                    formData.drawPoints,
                    formData.lossPoints,
                    formData.minAge,
                    formData.maxAge,
                    formData.regions
                ]);
                localStorage.setItem(key, JSON.stringify(existing));
            }

            this.sports.push(formData);
            this.allSports.push(formData);

            showToast('Sport registered successfully!', 'success');
            closeModal('sportModal');
            this.loadSports();

            document.getElementById('sportForm').reset();
        } catch (error) {
            console.error('Error registering sport:', error);
            showToast('Error registering sport', 'error');
        } finally {
            hideLoading();
        }
    }

    editSport(sportId) {
        const sport = this.sports.find(s => s.id === sportId);
        if (!sport) return;

        document.getElementById('sportName').value = sport.name;
        document.getElementById('sportCategory').value = sport.category;
        document.getElementById('sportDescription').value = sport.description;
        document.getElementById('sportTeamSize').value = sport.teamSize;
        document.getElementById('sportDuration').value = sport.duration;
        document.getElementById('sportUmpires').value = sport.requiredUmpires;
        document.getElementById('sportWinPoints').value = sport.winPoints;
        document.getElementById('sportDrawPoints').value = sport.drawPoints;
        document.getElementById('sportLossPoints').value = sport.lossPoints;
        document.getElementById('sportMinAge').value = sport.minAge;
        document.getElementById('sportMaxAge').value = sport.maxAge;
        document.getElementById('sportRegions').value = sport.regions.join(', ');

        openModal('sportModal');
    }

    async deleteSport(sportId) {
        if (!confirm('Are you sure you want to delete this sport?')) return;

        try {
            this.sports = this.sports.filter(s => s.id !== sportId);
            this.allSports = this.allSports.filter(s => s.id !== sportId);
            closeModal('sportDetailsModal');
            this.loadSports();
            showToast('Sport deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting sport:', error);
            showToast('Error deleting sport', 'error');
        }
    }

    searchSports() {
        const query = document.getElementById('searchSports')?.value || '';
        
        if (!query) {
            this.sports = [...this.allSports];
        } else {
            const lowerQuery = query.toLowerCase();
            this.sports = this.allSports.filter(sport =>
                sport.name.toLowerCase().includes(lowerQuery) ||
                sport.category.toLowerCase().includes(lowerQuery) ||
                sport.description.toLowerCase().includes(lowerQuery)
            );
        }

        this.loadSports();
    }
}

const sportRegistrationManager = new SportRegistrationManager();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => sportRegistrationManager.init());
} else {
    sportRegistrationManager.init();
}

function openSportModal() {
    document.getElementById('sportForm').reset();
    openModal('sportModal');
}

function closeSportModal() {
    closeModal('sportModal');
}

function closeSportDetailsModal() {
    closeModal('sportDetailsModal');
}

function searchSports() {
    sportRegistrationManager.searchSports();
}

window.sportRegistrationManager = sportRegistrationManager;
window.openSportModal = openSportModal;
window.closeSportModal = closeSportModal;
window.closeSportDetailsModal = closeSportDetailsModal;
window.searchSports = searchSports;
