// Team Registration Module

class TeamRegistrationManager {
    constructor() {
        this.currentUser = getCurrentUser();
        this.teams = [];
        this.allTeams = [];
        this.sports = [];
    }

    async init() {
        if (!this.currentUser) {
            window.location.href = 'index.html';
            return;
        }

        await this.loadData();
        this.configureTeamRegistration();
        this.loadTeams();
        this.setupEventListeners();
    }

    async loadData() {
        try {
            const teamsData = await sheetsAPI.readSheet(CONFIG.SHEETS.TEAMS);
            this.processTeams(teamsData);

            const sportsData = await sheetsAPI.readSheet(CONFIG.SHEETS.SPORTS);
            this.processSports(sportsData);

            this.updateSportFilters();
        } catch (error) {
            console.error('Error loading teams data:', error);
            showToast('Error loading teams', 'error');
        }
    }

    processTeams(data) {
        if (!data || data.length <= 1) return;

        this.teams = data.slice(1).map(row => ({
            id: row[0],
            name: row[1],
            sport: row[2],
            location: row[3],
            manager: row[4],
            managerEmail: row[5],
            managerPhone: row[6],
            playerCount: parseInt(row[7]) || 0,
            description: row[8] || ''
        }));

        this.allTeams = [...this.teams];
    }

    processSports(data) {
        if (!data || data.length <= 1) return;

        this.sports = data.slice(1).map(row => ({
            name: row[1]
        }));
    }

    updateSportFilters() {
        const sportSelect = document.getElementById('teamSport');
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

    configureTeamRegistration() {
        const createTeamButton = document.getElementById('createTeamButton');
        const teamManagerInput = document.getElementById('teamManager');
        const teamManagerEmailInput = document.getElementById('teamManagerEmail');
        const teamLocationInput = document.getElementById('teamLocation');

        if (!isAdminUser(this.currentUser) && this.currentUser.userType !== CONFIG.USER_TYPES.MANAGER) {
            if (createTeamButton) {
                createTeamButton.style.display = 'none';
            }
            return;
        }

        if (teamManagerInput) {
            teamManagerInput.value = this.currentUser.name;
            teamManagerInput.readOnly = true;
        }

        if (teamManagerEmailInput) {
            teamManagerEmailInput.value = this.currentUser.email;
            teamManagerEmailInput.readOnly = true;
        }

        if (teamLocationInput && this.currentUser.location) {
            teamLocationInput.value = this.currentUser.location;
        }
    }

    setupEventListeners() {
        const teamForm = document.getElementById('teamForm');
        if (teamForm) {
            teamForm.addEventListener('submit', (e) => this.handleRegisterTeam(e));
        }
    }

    loadTeams() {
        const list = document.getElementById('teamsList');
        if (!list) return;

        if (this.teams.length === 0) {
            list.innerHTML = '<div class="loading">No teams registered yet</div>';
            return;
        }

        list.innerHTML = this.teams.map(team => `
            <div class="card" onclick="teamRegistrationManager.showTeamDetails('${team.id}')">
                <h3>${team.name}</h3>
                <p><strong>Sport:</strong> ${team.sport}</p>
                <p><strong>Location:</strong> ${team.location}</p>
                <p><strong>Manager:</strong> ${team.manager}</p>
                <p><strong>Players:</strong> ${team.playerCount}</p>
                <p>${team.description}</p>
                <div class="card-footer">
                    <button class="btn-primary" onclick="event.stopPropagation(); teamRegistrationManager.showTeamDetails('${team.id}')">View Details</button>
                    <button class="btn-secondary" onclick="event.stopPropagation(); teamRegistrationManager.editTeam('${team.id}')">Edit</button>
                </div>
            </div>
        `).join('');
    }

    showTeamDetails(teamId) {
        const team = this.teams.find(t => t.id === teamId);
        if (!team) return;

        const modal = document.getElementById('teamDetailsModal');
        const content = document.getElementById('teamDetailsContent');

        if (!content) return;

        content.innerHTML = `
            <h2>${team.name}</h2>
            <div style="padding: 20px 0;">
                <p><strong>Sport:</strong> ${team.sport}</p>
                <p><strong>Location:</strong> ${team.location}</p>
                <p><strong>Manager:</strong> ${team.manager}</p>
                <p><strong>Manager Email:</strong> ${team.managerEmail}</p>
                <p><strong>Manager Phone:</strong> ${team.managerPhone}</p>
                <p><strong>Number of Players:</strong> ${team.playerCount}</p>
                <p><strong>Description:</strong></p>
                <p>${team.description}</p>
            </div>
            <div style="display: flex; gap: 10px;">
                <button class="btn-secondary" onclick="teamRegistrationManager.editTeam('${team.id}')">Edit Team</button>
                <button class="btn-danger" onclick="teamRegistrationManager.deleteTeam('${team.id}')">Delete Team</button>
            </div>
        `;

        openModal('teamDetailsModal');
    }

    async handleRegisterTeam(e) {
        e.preventDefault();

        if (!isAdminUser(this.currentUser) && this.currentUser.userType !== CONFIG.USER_TYPES.MANAGER) {
            showToast('Only team managers and administrators can register new teams.', 'error');
            return;
        }

        const formData = {
            id: generateId(),
            name: document.getElementById('teamName').value,
            sport: document.getElementById('teamSport').value,
            location: document.getElementById('teamLocation').value,
            manager: this.currentUser.name,
            managerEmail: this.currentUser.email,
            managerPhone: document.getElementById('teamManagerPhone').value,
            playerCount: document.getElementById('teamPlayers').value,
            description: document.getElementById('teamDescription').value
        };

        try {
            showLoading();

            await sheetsAPI.appendSheet(CONFIG.SHEETS.TEAMS, [
                formData.id,
                formData.name,
                formData.sport,
                formData.location,
                formData.manager,
                formData.managerEmail,
                formData.managerPhone,
                formData.playerCount,
                formData.description
            ]);

            this.teams.push(formData);
            this.allTeams.push(formData);

            showToast('Team registered successfully!', 'success');
            closeModal('teamModal');
            this.loadTeams();

            document.getElementById('teamForm').reset();
        } catch (error) {
            console.error('Error registering team:', error);
            showToast('Error registering team', 'error');
        } finally {
            hideLoading();
        }
    }

    editTeam(teamId) {
        const team = this.teams.find(t => t.id === teamId);
        if (!team) return;

        document.getElementById('teamName').value = team.name;
        document.getElementById('teamSport').value = team.sport;
        document.getElementById('teamLocation').value = team.location;
        document.getElementById('teamManager').value = team.manager;
        document.getElementById('teamManagerEmail').value = team.managerEmail;
        document.getElementById('teamManagerPhone').value = team.managerPhone;
        document.getElementById('teamPlayers').value = team.playerCount;
        document.getElementById('teamDescription').value = team.description;

        openModal('teamModal');
    }

    async deleteTeam(teamId) {
        if (!confirm('Are you sure you want to delete this team?')) return;

        try {
            this.teams = this.teams.filter(t => t.id !== teamId);
            this.allTeams = this.allTeams.filter(t => t.id !== teamId);
            closeModal('teamDetailsModal');
            this.loadTeams();
            showToast('Team deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting team:', error);
            showToast('Error deleting team', 'error');
        }
    }

    filterTeams() {
        const sportFilter = document.getElementById('filterSport')?.value || '';
        
        if (!sportFilter) {
            this.teams = [...this.allTeams];
        } else {
            this.teams = this.allTeams.filter(team => team.sport === sportFilter);
        }

        this.loadTeams();
    }

    searchTeams() {
        const query = document.getElementById('searchTeams')?.value || '';
        
        if (!query) {
            this.teams = [...this.allTeams];
        } else {
            const lowerQuery = query.toLowerCase();
            this.teams = this.allTeams.filter(team =>
                team.name.toLowerCase().includes(lowerQuery) ||
                team.location.toLowerCase().includes(lowerQuery) ||
                team.manager.toLowerCase().includes(lowerQuery)
            );
        }

        this.loadTeams();
    }
}

const teamRegistrationManager = new TeamRegistrationManager();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => teamRegistrationManager.init());
} else {
    teamRegistrationManager.init();
}

function openTeamModal() {
    document.getElementById('teamForm').reset();
    openModal('teamModal');
}

function closeTeamModal() {
    closeModal('teamModal');
}

function closeTeamDetailsModal() {
    closeModal('teamDetailsModal');
}

function filterTeams() {
    teamRegistrationManager.filterTeams();
}

function searchTeams() {
    teamRegistrationManager.searchTeams();
}

window.teamRegistrationManager = teamRegistrationManager;
window.openTeamModal = openTeamModal;
window.closeTeamModal = closeTeamModal;
window.closeTeamDetailsModal = closeTeamDetailsModal;
window.filterTeams = filterTeams;
window.searchTeams = searchTeams;
