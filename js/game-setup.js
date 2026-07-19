// Game Setup Module

class GameSetupManager {
    constructor() {
        this.currentUser = getCurrentUser();
        this.gameSetups = [];
        this.allGameSetups = [];
        this.sports = [];
    }

    async init() {
        if (!this.currentUser) {
            window.location.href = 'index.html';
            return;
        }

        await this.loadData();
        this.loadGameSetups();
        this.setupEventListeners();
    }

    async loadData() {
        try {
            let setupsData = [];
            if (typeof sheetsAPI !== 'undefined' && sheetsAPI) {
                setupsData = await sheetsAPI.readSheet(CONFIG.SHEETS.GAME_SETUPS);
            } else {
                setupsData = JSON.parse(localStorage.getItem('sheet_' + (CONFIG.SHEETS.GAME_SETUPS || 'GAME_SETUPS')) || '[]');
            }
            this.processGameSetups(setupsData);

            let sportsData = [];
            if (typeof sheetsAPI !== 'undefined' && sheetsAPI) {
                sportsData = await sheetsAPI.readSheet(CONFIG.SHEETS.SPORTS);
            } else {
                sportsData = JSON.parse(localStorage.getItem('sheet_' + (CONFIG.SHEETS.SPORTS || 'SPORTS')) || '[]');
            }
            this.processSports(sportsData);

            this.updateSportFilters();
        } catch (error) {
            console.error('Error loading game setups:', error);
            showToast('Error loading game setups', 'error');
        }
    }

    processGameSetups(data) {
        if (!data || data.length <= 1) return;

        this.gameSetups = data.slice(1).map(row => ({
            id: row[0],
            name: row[1],
            sport: row[2],
            teamSize: parseInt(row[3]) || 0,
            duration: parseInt(row[4]) || 0,
            halves: parseInt(row[5]) || 0,
            substitutes: parseInt(row[6]) || 0,
            requiredUmpires: parseInt(row[7]) || 0,
            rules: row[8] || '',
            winPoints: parseInt(row[9]) || 0,
            drawPoints: parseInt(row[10]) || 0,
            lossPoints: parseInt(row[11]) || 0
        }));

        this.allGameSetups = [...this.gameSetups];
    }

    processSports(data) {
        if (!data || data.length <= 1) return;

        this.sports = data.slice(1).map(row => ({
            name: row[1]
        }));
    }

    updateSportFilters() {
        const sportSelect = document.getElementById('gsSport');
        if (sportSelect) {
            sportSelect.innerHTML = '<option value="">Select Sport</option>';
            this.sports.forEach(sport => {
                const option = document.createElement('option');
                option.value = sport.name;
                option.textContent = sport.name;
                sportSelect.appendChild(option);
            });
        }

        const filterSport = document.getElementById('filterSport');
        if (filterSport) {
            filterSport.innerHTML = '<option value="">All Sports</option>';
            this.sports.forEach(sport => {
                const option = document.createElement('option');
                option.value = sport.name;
                option.textContent = sport.name;
                filterSport.appendChild(option);
            });
        }
    }

    setupEventListeners() {
        const gameSetupForm = document.getElementById('gameSetupForm');
        if (gameSetupForm) {
            gameSetupForm.addEventListener('submit', (e) => this.handleCreateSetup(e));
        }
    }

    loadGameSetups() {
        const list = document.getElementById('gameSetupsList');
        if (!list) return;

        if (this.gameSetups.length === 0) {
            list.innerHTML = '<div class="loading">No game setups created yet</div>';
            return;
        }

        list.innerHTML = this.gameSetups.map(setup => `
            <div class="card">
                <h3>${setup.name}</h3>
                <p><strong>Sport:</strong> ${setup.sport}</p>
                <p><strong>Team Size:</strong> ${setup.teamSize} players</p>
                <p><strong>Duration:</strong> ${setup.duration} minutes</p>
                <p><strong>Periods/Halves:</strong> ${setup.halves}</p>
                <p><strong>Required Umpires:</strong> ${setup.requiredUmpires}</p>
                <p><strong>Scoring:</strong> Win=${setup.winPoints}pts, Draw=${setup.drawPoints}pts, Loss=${setup.lossPoints}pts</p>
                <div class="card-footer">
                    <button class="btn-primary" onclick="gameSetupManager.editSetup('${setup.id}')">Edit</button>
                    <button class="btn-danger" onclick="gameSetupManager.deleteSetup('${setup.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    async handleCreateSetup(e) {
        e.preventDefault();

        const formData = {
            id: generateId(),
            name: document.getElementById('gsName').value,
            sport: document.getElementById('gsSport').value,
            teamSize: document.getElementById('gsTeamSize').value,
            duration: document.getElementById('gsDuration').value,
            halves: document.getElementById('gsHalves').value,
            substitutes: document.getElementById('gsSubstitutes').value,
            requiredUmpires: document.getElementById('gsRequiredUmpires').value,
            rules: document.getElementById('gsRules').value,
            winPoints: document.getElementById('gsWinPoints').value,
            drawPoints: document.getElementById('gsDrawPoints').value,
            lossPoints: document.getElementById('gsLossPoints').value
        };

        try {
            showLoading();


            if (typeof sheetsAPI !== 'undefined' && sheetsAPI) {
                await sheetsAPI.appendSheet(CONFIG.SHEETS.GAME_SETUPS, [
                    formData.id,
                    formData.name,
                    formData.sport,
                    formData.teamSize,
                    formData.duration,
                    formData.halves,
                    formData.substitutes,
                    formData.requiredUmpires,
                    formData.rules,
                    formData.winPoints,
                    formData.drawPoints,
                    formData.lossPoints
                ]);
            } else {
                const key = 'sheet_' + (CONFIG.SHEETS.GAME_SETUPS || 'GAME_SETUPS');
                const existing = JSON.parse(localStorage.getItem(key) || '[]');
                existing.push([
                    formData.id,
                    formData.name,
                    formData.sport,
                    formData.teamSize,
                    formData.duration,
                    formData.halves,
                    formData.substitutes,
                    formData.requiredUmpires,
                    formData.rules,
                    formData.winPoints,
                    formData.drawPoints,
                    formData.lossPoints
                ]);
                localStorage.setItem(key, JSON.stringify(existing));
            }

            this.gameSetups.push(formData);
            this.allGameSetups.push(formData);

            showToast('Game setup created successfully!', 'success');
            closeModal('gameSetupModal');
            this.loadGameSetups();

            document.getElementById('gameSetupForm').reset();
        } catch (error) {
            console.error('Error creating game setup:', error);
            showToast('Error creating game setup', 'error');
        } finally {
            hideLoading();
        }
    }

    editSetup(setupId) {
        const setup = this.gameSetups.find(s => s.id === setupId);
        if (!setup) return;

        document.getElementById('gsName').value = setup.name;
        document.getElementById('gsSport').value = setup.sport;
        document.getElementById('gsTeamSize').value = setup.teamSize;
        document.getElementById('gsDuration').value = setup.duration;
        document.getElementById('gsHalves').value = setup.halves;
        document.getElementById('gsSubstitutes').value = setup.substitutes;
        document.getElementById('gsRequiredUmpires').value = setup.requiredUmpires;
        document.getElementById('gsRules').value = setup.rules;
        document.getElementById('gsWinPoints').value = setup.winPoints;
        document.getElementById('gsDrawPoints').value = setup.drawPoints;
        document.getElementById('gsLossPoints').value = setup.lossPoints;

        openModal('gameSetupModal');
    }

    async deleteSetup(setupId) {
        if (!confirm('Are you sure you want to delete this game setup?')) return;

        try {
            this.gameSetups = this.gameSetups.filter(s => s.id !== setupId);
            this.allGameSetups = this.allGameSetups.filter(s => s.id !== setupId);
            this.loadGameSetups();
            showToast('Game setup deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting game setup:', error);
            showToast('Error deleting game setup', 'error');
        }
    }

    filterGameSetups() {
        const sportFilter = document.getElementById('filterSport')?.value || '';
        
        if (!sportFilter) {
            this.gameSetups = [...this.allGameSetups];
        } else {
            this.gameSetups = this.allGameSetups.filter(setup => setup.sport === sportFilter);
        }

        this.loadGameSetups();
    }

    searchGameSetups() {
        const query = document.getElementById('searchGames')?.value || '';
        
        if (!query) {
            this.gameSetups = [...this.allGameSetups];
        } else {
            const lowerQuery = query.toLowerCase();
            this.gameSetups = this.allGameSetups.filter(setup =>
                setup.name.toLowerCase().includes(lowerQuery) ||
                setup.sport.toLowerCase().includes(lowerQuery)
            );
        }

        this.loadGameSetups();
    }
}

const gameSetupManager = new GameSetupManager();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => gameSetupManager.init());
} else {
    gameSetupManager.init();
}

function openGameSetupModal() {
    document.getElementById('gameSetupForm').reset();
    openModal('gameSetupModal');
}

function closeGameSetupModal() {
    closeModal('gameSetupModal');
}

function loadGameRules() {
    // Auto-populate rules based on selected sport
    const sport = document.getElementById('gsSport').value;
    const rulesEl = document.getElementById('gsRules');
    
    const defaultRules = {
        'Football': 'Standard 11v11 rules with FIFA regulations',
        'Basketball': 'FIBA regulations with 5v5 standard rules',
        'Volleyball': 'FIVB official rules and regulations',
        'Cricket': 'ICC cricket match format rules'
    };

    if (rulesEl && defaultRules[sport]) {
        rulesEl.value = defaultRules[sport];
    }
}

function filterGameSetups() {
    gameSetupManager.filterGameSetups();
}

function searchGameSetups() {
    gameSetupManager.searchGameSetups();
}

window.gameSetupManager = gameSetupManager;
window.openGameSetupModal = openGameSetupModal;
window.closeGameSetupModal = closeGameSetupModal;
window.loadGameRules = loadGameRules;
window.filterGameSetups = filterGameSetups;
window.searchGameSetups = searchGameSetups;
