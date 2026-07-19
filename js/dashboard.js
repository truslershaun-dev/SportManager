// Dashboard Module

class Dashboard {
    constructor() {
        this.currentUser = getCurrentUser();
        this.upcomingMatches = [];
        this.stats = {
            totalMatches: 0,
            upcomingCount: 0,
            registeredTeams: 0,
            availableUmpires: 0
        };
    }

    /**
     * Initialize dashboard
     */
    async init() {
        if (!this.currentUser) {
            showToast('Please log in first.', 'error');
            window.location.href = 'index.html';
            return;
        }

        const allowedRoles = [
            CONFIG.USER_TYPES.UMPIRE,
            CONFIG.USER_TYPES.MANAGER,
            CONFIG.USER_TYPES.OWNER,
            CONFIG.USER_TYPES.SAHA_REPRESENTATIVE,
            CONFIG.USER_TYPES.APPLICATION_MANAGER,
            CONFIG.USER_TYPES.ADMIN
        ];

        if (!isAdminUser(this.currentUser) && !allowedRoles.includes(this.currentUser.userType)) {
            showToast('Access denied for this role.', 'error');
            window.location.href = 'index.html';
            return;
        }

        this.setupUI();
        await this.loadData();
        this.renderDashboard();
    }

    /**
     * Setup dashboard UI
     */
    setupUI() {
        const userName = document.getElementById('userName');
        const userDisplay = document.getElementById('userDisplay');
        const userRoleBadge = document.getElementById('userRoleBadge');
        const welcomeMessage = document.getElementById('welcomeMessage');
        const profileName = document.getElementById('profileName');

        if (userName) userName.textContent = this.currentUser.name;
        if (userDisplay) userDisplay.textContent = this.currentUser.name;
        if (userRoleBadge) {
            const roleLabel = CONFIG.ROLE_LABELS[this.currentUser.userType] || this.currentUser.userType;
            userRoleBadge.textContent = roleLabel;
        }
        if (profileName) profileName.textContent = this.currentUser.name;

        // Show/hide role-specific sections
        if (isAdminUser(this.currentUser)) {
            const managerSection = document.getElementById('managerStatsSection');
            if (managerSection) managerSection.style.display = 'block';
            
            const adminSection = document.getElementById('adminSection');
            if (adminSection) adminSection.style.display = 'block';

            if (welcomeMessage) {
                welcomeMessage.textContent = `Welcome, ${this.currentUser.name}! System Administrator Dashboard.`;
            }

            this.initAdminSheetTestControls();
        } else if (this.currentUser.userType === CONFIG.USER_TYPES.MANAGER) {
            const managerSection = document.getElementById('managerStatsSection');
            if (managerSection) managerSection.style.display = 'block';

            if (welcomeMessage) {
                welcomeMessage.textContent = `Welcome, ${this.currentUser.name}! Here's an overview of your sport management.`;
            }
        } else {
            if (welcomeMessage) {
                welcomeMessage.textContent = `Welcome, ${this.currentUser.name}! Here are your upcoming matches.`;
            }
        }
    }

    /**
     * Load dashboard data
     */
    async loadData() {
        try {
            // Load matches (use Sheets if available)
            let matchesData = [];
            if (typeof sheetsAPI !== 'undefined' && sheetsAPI) {
                matchesData = await sheetsAPI.readSheet(CONFIG.SHEETS.MATCHES);
            }
            await this.processMatches(matchesData);

            // Load stats for managers and admins
            if (this.currentUser.userType === CONFIG.USER_TYPES.MANAGER) {
                await this.loadManagerStats();
            } else if (isAdminUser(this.currentUser)) {
                await this.loadAdminStats();
            }

            // Load recent activity
            await this.loadRecentActivity();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            showToast('Error loading dashboard data', 'error');
        }
    }

    /**
     * Process matches data
     */
    async processMatches(matchesData) {
        if (!matchesData || matchesData.length <= 1) return;

        const matches = matchesData.slice(1).map(row => ({
            id: row[0],
            date: row[1],
            time: row[2],
            sport: row[3],
            homeTeam: row[4],
            awayTeam: row[5],
            location: row[6],
            status: row[7],
            homeScore: row[8] || '-',
            awayScore: row[9] || '-'
        }));

        // Filter for current user
        const today = getCurrentDate();
        const upcomingMatches = matches.filter(match => {
            const isUpcoming = match.date >= today && match.status === CONFIG.MATCH_STATUS.UPCOMING;
            
            if (this.currentUser.userType === CONFIG.USER_TYPES.PLAYER) {
                // Check if player is assigned to match
                return isUpcoming;
            } else {
                // For managers, show all matches in their sport
                return isUpcoming;
            }
        });

        // Get next 4 matches
        this.upcomingMatches = upcomingMatches
            .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
            .slice(0, 4);

        this.stats.totalMatches = matches.length;
        this.stats.upcomingCount = upcomingMatches.length;
    }

    /**
     * Load manager statistics
     */
    async loadManagerStats() {
        try {
            // Load teams
            let teamsData = [];
            if (typeof sheetsAPI !== 'undefined' && sheetsAPI) {
                teamsData = await sheetsAPI.readSheet(CONFIG.SHEETS.TEAMS);
            }
            if (teamsData && teamsData.length > 1) {
                this.stats.registeredTeams = teamsData.length - 1;
            }

            // Load umpires
            let umpiresData = [];
            if (typeof sheetsAPI !== 'undefined' && sheetsAPI) {
                umpiresData = await sheetsAPI.readSheet(CONFIG.SHEETS.UMPIRES);
            }
            if (umpiresData && umpiresData.length > 1) {
                this.stats.availableUmpires = umpiresData.length - 1;
            }

            this.updateStats();
        } catch (error) {
            console.error('Error loading manager stats:', error);
        }
    }

    /**
     * Load admin statistics (teams and umpires view)
     */
    async loadAdminStats() {
        try {
            // Load teams
            let teamsData = [];
            if (typeof sheetsAPI !== 'undefined' && sheetsAPI) {
                teamsData = await sheetsAPI.readSheet(CONFIG.SHEETS.TEAMS);
            }
            if (teamsData && teamsData.length > 1) {
                this.stats.registeredTeams = teamsData.length - 1;
                this.renderAdminTeamsSection(teamsData.slice(1));
            }

            // Load umpires
            let umpiresData = [];
            if (typeof sheetsAPI !== 'undefined' && sheetsAPI) {
                umpiresData = await sheetsAPI.readSheet(CONFIG.SHEETS.UMPIRES);
            }
            if (umpiresData && umpiresData.length > 1) {
                this.stats.availableUmpires = umpiresData.length - 1;
                this.renderAdminUmpiresSection(umpiresData.slice(1));
            }

            this.updateStats();
        } catch (error) {
            console.error('Error loading admin stats:', error);
        }
    }

    /**
     * Render admin teams section
     */
    renderAdminTeamsSection(teamsData) {
        const adminTeamsContainer = document.getElementById('adminTeamsContainer');
        if (!adminTeamsContainer) return;

        const teamsHTML = teamsData.map((row, index) => `
            <div class="admin-sheet-row">
                <strong>${index + 1}. Team: ${row[1] || 'N/A'}</strong>
                <span>Sport: ${row[2] || 'N/A'}</span>
                <span>Location: ${row[3] || 'N/A'}</span>
                <span>Manager: ${row[4] || 'N/A'}</span>
                <span>Players: ${row[6] || 'N/A'}</span>
            </div>
        `).join('');

        adminTeamsContainer.innerHTML = `
            <div class="admin-sheet-view">
                <h3>📋 Teams Registry (${teamsData.length})</h3>
                <div class="admin-sheet-list">
                    ${teamsHTML}
                </div>
            </div>
        `;
    }

    /**
     * Render admin umpires section
     */
    renderAdminUmpiresSection(umpiresData) {
        const adminUmpiresContainer = document.getElementById('adminUmpiresContainer');
        if (!adminUmpiresContainer) return;

        const umpiresHTML = umpiresData.map((row, index) => `
            <div class="admin-sheet-row">
                <strong>${index + 1}. ${row[1] || 'N/A'}</strong>
                <span>Rank: ${row[2] || 'N/A'}</span>
                <span>Location: ${row[3] || 'N/A'}</span>
                <span>Region: ${row[4] || 'N/A'}</span>
                <span>Phone: ${row[5] || 'N/A'}</span>
                <span>Sports: ${row[6] || 'N/A'}</span>
            </div>
        `).join('');

        adminUmpiresContainer.innerHTML = `
            <div class="admin-sheet-view">
                <h3>👨‍⚖️ Umpires Registry (${umpiresData.length})</h3>
                <div class="admin-sheet-list">
                    ${umpiresHTML}
                </div>
            </div>
        `;
    }

    /**
     * Initialize admin sheet test controls
     */
    initAdminSheetTestControls() {
        if (!isAdminUser(this.currentUser)) return;

        const outputContainer = document.getElementById('sheetTestOutput');
        if (outputContainer) {
            outputContainer.textContent = 'Use these buttons to test Google Sheets connectivity and operations.';
        }
    }

    /**
     * Render test output
     */
    renderSheetTestOutput(result) {
        const outputContainer = document.getElementById('sheetTestOutput');
        if (!outputContainer) return;

        if (typeof result === 'string') {
            outputContainer.textContent = result;
            return;
        }

        outputContainer.textContent = JSON.stringify(result, null, 2);
    }

    async runSheetMetadataTest() {
        try {
            this.renderSheetTestOutput('Testing Google Sheets connection...');
            if (!sheetsAPI.accessToken) await sheetsAPI.requestAccessToken(true);
            const metadata = await sheetsAPI.getSheetMetadata();
            this.renderSheetTestOutput({ success: true, message: 'Connection successful', metadata });
        } catch (error) {
            this.renderSheetTestOutput({ success: false, error: error.message || error.toString() });
        }
    }

    async runSheetReadTest() {
        try {
            this.renderSheetTestOutput('Reading Users sheet...');
            if (!sheetsAPI.accessToken) await sheetsAPI.requestAccessToken(true);
            const values = await sheetsAPI.readSheet(CONFIG.SHEETS.USERS, 'A1:G20');
            this.renderSheetTestOutput({ success: true, rows: values.length, values });
        } catch (error) {
            this.renderSheetTestOutput({ success: false, error: error.message || error.toString() });
        }
    }

    async runSheetAppendTest() {
        try {
            const row = [
                `admin-test-${Date.now()}`,
                'admin@sportmanager.com',
                'Admin Test',
                CONFIG.USER_TYPES.ADMIN,
                '000-000-0000',
                'Test Location',
                new Date().toISOString()
            ];

            this.renderSheetTestOutput('Appending test row to Users sheet...');
            if (!sheetsAPI.accessToken) await sheetsAPI.requestAccessToken(true);
            const result = await sheetsAPI.appendSheet(CONFIG.SHEETS.USERS, row);
            this.renderSheetTestOutput({ success: true, action: 'append', result });
        } catch (error) {
            this.renderSheetTestOutput({ success: false, error: error.message || error.toString() });
        }
    }

    clearSheetTestOutput() {
        const outputContainer = document.getElementById('sheetTestOutput');
        if (outputContainer) {
            outputContainer.textContent = 'Use these buttons to test Google Sheets connectivity and operations.';
        }
    }

    /**
     * Update stats display
     */
    updateStats() {
        const totalMatchesEl = document.getElementById('totalMatches');
        const upcomingCountEl = document.getElementById('upcomingCount');
        const registeredTeamsEl = document.getElementById('registeredTeams');
        const availableUmpiresEl = document.getElementById('availableUmpires');

        if (totalMatchesEl) totalMatchesEl.textContent = this.stats.totalMatches;
        if (upcomingCountEl) upcomingCountEl.textContent = this.stats.upcomingCount;
        if (registeredTeamsEl) registeredTeamsEl.textContent = this.stats.registeredTeams;
        if (availableUmpiresEl) availableUmpiresEl.textContent = this.stats.availableUmpires;
    }

    /**
     * Load recent activity
     */
    async loadRecentActivity() {
        // For now, generate mock activity
        const activities = [
            {
                type: 'match',
                title: 'Match Created',
                description: 'Football match scheduled',
                time: 'Today'
            },
            {
                type: 'team',
                title: 'Team Registered',
                description: 'New team registered',
                time: '2 days ago'
            },
            {
                type: 'umpire',
                title: 'Umpire Assigned',
                description: 'Umpire assigned to match',
                time: '3 days ago'
            }
        ];

        const activityContainer = document.getElementById('recentActivityContainer');
        if (!activityContainer) return;

        activityContainer.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    ${activity.type === 'match' ? '⚽' : activity.type === 'team' ? '👥' : '👨‍⚖️'}
                </div>
                <div class="activity-content">
                    <h4>${activity.title}</h4>
                    <p>${activity.description}</p>
                    <span class="activity-time">${activity.time}</span>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render dashboard
     */
    renderDashboard() {
        const container = document.getElementById('upcomingMatchesContainer');
        if (!container) return;

        if (this.upcomingMatches.length === 0) {
            container.innerHTML = '<div class="loading">No upcoming matches</div>';
            return;
        }

        container.innerHTML = this.upcomingMatches.map(match => `
            <div class="card match-card" onclick="viewMatch('${match.id}')">
                <div class="match-header">
                    <span class="match-sport">${match.sport}</span>
                    <span class="match-status status-upcoming">Upcoming</span>
                </div>

                <div class="match-teams">
                    <div class="team-row">
                        <div class="team-name">${match.homeTeam}</div>
                        <div class="team-badge">Home</div>
                    </div>
                    <div class="team-row">
                        <div class="team-name">${match.awayTeam}</div>
                        <div class="team-badge">Away</div>
                    </div>
                </div>

                <div class="match-details">
                    <div>📅 ${formatDate(match.date)}</div>
                    <div>⏰ ${match.time}</div>
                    <div>📍 ${match.location}</div>
                </div>

                <div class="match-footer">
                    <button class="btn-view-match" onclick="event.stopPropagation(); viewMatch('${match.id}')">
                        View Details
                    </button>
                </div>
            </div>
        `).join('');
    }
}

// Create dashboard instance
const dashboard = new Dashboard();

// Initialize dashboard when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => dashboard.init());
} else {
    dashboard.init();
}

// View match details
function viewMatch(matchId) {
    showToast('Navigating to match details...', 'info');
    // Would navigate to matches page with selected match
    // window.location.href = `matches.html?id=${matchId}`;
}

// Make functions globally available
window.viewMatch = viewMatch;
