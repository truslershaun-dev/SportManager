// Profile Module

class ProfileManager {
    constructor() {
        this.currentUser = getCurrentUser();
        this.editMode = false;
        this.sports = [];
        this.teams = [];
    }

    async init() {
        if (!this.currentUser) {
            showToast('Please log in first.', 'error');
            window.location.href = 'index.html';
            return;
        }

        this.loadUserProfile();
        await this.loadData();
        this.setupEventListeners();
    }

    loadUserProfile() {
        const name = this.currentUser.name || 'User';
        const role = CONFIG.ROLE_LABELS[this.currentUser.userType] || this.currentUser.userType;

        document.getElementById('profileName').textContent = name;
        document.getElementById('profileRole').textContent = role;
        document.getElementById('firstName').value = name.split(' ')[0];
        document.getElementById('lastName').value = name.split(' ').slice(1).join(' ');
        document.getElementById('email').value = this.currentUser.email;
        document.getElementById('phone').value = this.currentUser.phone || '';
        document.getElementById('location').value = this.currentUser.location || '';

        document.getElementById('playerFields').style.display = 'none';
        document.getElementById('umpireFields').style.display = 'none';
        document.getElementById('managerFields').style.display = 'none';

        if (this.currentUser.userType === CONFIG.USER_TYPES.PLAYER) {
            document.getElementById('playerFields').style.display = 'block';
        } else if (this.currentUser.userType === CONFIG.USER_TYPES.UMPIRE) {
            document.getElementById('umpireFields').style.display = 'block';
        } else if (isAdminUser(this.currentUser) || this.currentUser.userType === CONFIG.USER_TYPES.MANAGER || this.currentUser.userType === CONFIG.USER_TYPES.OWNER || this.currentUser.userType === CONFIG.USER_TYPES.SAHA_REPRESENTATIVE || this.currentUser.userType === CONFIG.USER_TYPES.APPLICATION_MANAGER) {
            document.getElementById('managerFields').style.display = 'block';
        }

        document.getElementById('preferredLocation').value = this.currentUser.preferredLocation || '';
        document.getElementById('preferredMonths').value = this.currentUser.preferredMonths || '';
        document.getElementById('preferredDays').value = this.currentUser.preferredDays || '';
        document.getElementById('preferredTimes').value = this.currentUser.preferredTimes || '';
        document.getElementById('preferredTeams').value = this.currentUser.preferredTeams || '';
        document.getElementById('sahaLevel').value = this.currentUser.sahaLevel || '';
        document.getElementById('managerTier').value = this.currentUser.roleTier || '';
    }

    async loadData() {
        try {
            const sportsData = await sheetsAPI.readSheet(CONFIG.SHEETS.SPORTS);
            this.processSports(sportsData);

            const teamsData = await sheetsAPI.readSheet(CONFIG.SHEETS.TEAMS);
            this.processTeams(teamsData);

            this.updateTeamSelects();
        } catch (error) {
            console.error('Error loading profile data:', error);
        }
    }

    processSports(data) {
        if (!data || data.length <= 1) return;

        this.sports = data.slice(1).map(row => ({
            name: row[1]
        }));

        this.populateSportCheckboxes();
    }

    processTeams(data) {
        if (!data || data.length <= 1) return;

        this.teams = data.slice(1).map(row => ({
            id: row[0],
            name: row[1]
        }));
    }

    populateSportCheckboxes() {
        const playerSportsList = document.getElementById('playerSportsList');
        const managerSportsList = document.getElementById('managerSportsList');

        if (playerSportsList) {
            playerSportsList.innerHTML = this.sports.map(sport => `
                <label>
                    <input type="checkbox" name="sports" value="${sport.name}" disabled>
                    ${sport.name}
                </label>
            `).join('');
        }

        if (managerSportsList) {
            managerSportsList.innerHTML = this.sports.map(sport => `
                <label>
                    <input type="checkbox" name="sports" value="${sport.name}" disabled>
                    ${sport.name}
                </label>
            `).join('');
        }
    }

    updateTeamSelects() {
        const playerTeamSelect = document.getElementById('playerTeam');
        const managerTeamSelect = document.getElementById('managerTeam');

        if (playerTeamSelect) {
            playerTeamSelect.innerHTML = '<option value="">Select Team</option>' + 
                this.teams.map(team => `<option value="${team.id}">${team.name}</option>`).join('');
        }

        if (managerTeamSelect) {
            managerTeamSelect.innerHTML = '<option value="">Select Team</option>' + 
                this.teams.map(team => `<option value="${team.id}">${team.name}</option>`).join('');
        }
    }

    setupEventListeners() {
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }

        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', (e) => this.handleChangePassword(e));
        }
    }

    enableEditMode() {
        this.editMode = true;
        const inputs = document.querySelectorAll('#profileForm input, #profileForm select, #profileForm textarea');
        inputs.forEach(input => input.disabled = false);

        const formActions = document.getElementById('formActions');
        if (formActions) formActions.style.display = 'flex';

        const editButton = document.querySelector('[onclick="enableEditMode()"]');
        if (editButton) editButton.style.display = 'none';
    }

    cancelEdit() {
        this.editMode = false;
        this.loadUserProfile();

        const inputs = document.querySelectorAll('#profileForm input, #profileForm select, #profileForm textarea');
        inputs.forEach(input => input.disabled = true);

        const formActions = document.getElementById('formActions');
        if (formActions) formActions.style.display = 'none';

        const editButton = document.querySelector('[onclick="enableEditMode()"]');
        if (editButton) editButton.style.display = 'block';
    }

    async handleProfileUpdate(e) {
        e.preventDefault();

        const updates = {
            name: `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`,
            phone: document.getElementById('phone').value,
            location: document.getElementById('location').value,
            preferredLocation: document.getElementById('preferredLocation').value,
            preferredMonths: document.getElementById('preferredMonths').value,
            preferredDays: document.getElementById('preferredDays').value,
            preferredTimes: document.getElementById('preferredTimes').value,
            preferredTeams: document.getElementById('preferredTeams').value,
            roleTier: document.getElementById('managerTier').value,
            sahaLevel: document.getElementById('sahaLevel').value
        };

        try {
            showLoading();

            await authManager.updateProfile(this.currentUser.id, updates);

            this.currentUser = { ...this.currentUser, ...updates };
            setCurrentUser(this.currentUser);

            showToast('Profile updated successfully!', 'success');
            this.editMode = false;
            this.loadUserProfile();

            const inputs = document.querySelectorAll('#profileForm input, #profileForm select, #profileForm textarea');
            inputs.forEach(input => input.disabled = true);

            const formActions = document.getElementById('formActions');
            if (formActions) formActions.style.display = 'none';

            const editButton = document.querySelector('[onclick="enableEditMode()"]');
            if (editButton) editButton.style.display = 'block';
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast('Error updating profile', 'error');
        } finally {
            hideLoading();
        }
    }

    switchTab(tabName) {
        // Hide all tabs
        document.getElementById('personalTab').style.display = 'none';
        document.getElementById('statsTab').style.display = 'none';
        document.getElementById('preferencesTab').style.display = 'none';

        // Remove active class from all buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

        // Show selected tab
        document.getElementById(`${tabName}Tab`).style.display = 'block';

        // Add active class to clicked button
        event.target.classList.add('active');

        // Load tab-specific content
        if (tabName === 'stats') {
            this.loadStatistics();
        }
    }

    loadStatistics() {
        const statsContainer = document.getElementById('statsContainer');
        if (!statsContainer) return;

        const stats = [
            { label: 'Matches Played', value: 12 },
            { label: 'Wins', value: 8 },
            { label: 'Draws', value: 2 },
            { label: 'Losses', value: 2 },
            { label: 'Win Rate', value: '66.7%' },
            { label: 'Points Scored', value: 45 }
        ];

        statsContainer.innerHTML = stats.map(stat => `
            <div class="stat-card">
                <div class="stat-number">${stat.value}</div>
                <div class="stat-label">${stat.label}</div>
            </div>
        `).join('');
    }

    async handleChangePassword(e) {
        e.preventDefault();

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match!', 'error');
            return;
        }

        try {
            showLoading();

            await authManager.changePassword(this.currentUser.id, currentPassword, newPassword);

            showToast('Password changed successfully!', 'success');
            this.closeChangePasswordModal();
            document.getElementById('changePasswordForm').reset();
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            hideLoading();
        }
    }

    changeAvatar() {
        showToast('Avatar upload coming soon!', 'info');
    }

    confirmDeleteAccount() {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            if (confirm('This is your final warning. All your data will be permanently deleted.')) {
                this.deleteAccount();
            }
        }
    }

    async deleteAccount() {
        try {
            showLoading();

            await authManager.deleteAccount(this.currentUser.id);

            showToast('Account deleted successfully!', 'success');
            setTimeout(() => {
                logout();
            }, 1500);
        } catch (error) {
            console.error('Error deleting account:', error);
            showToast('Error deleting account', 'error');
        } finally {
            hideLoading();
        }
    }

    openChangePasswordModal() {
        openModal('changePasswordModal');
    }

    closeChangePasswordModal() {
        closeModal('changePasswordModal');
    }
}

const profileManager = new ProfileManager();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => profileManager.init());
} else {
    profileManager.init();
}

function enableEditMode() {
    profileManager.enableEditMode();
}

function cancelEdit() {
    profileManager.cancelEdit();
}

function switchTab(tabName) {
    profileManager.switchTab(tabName);
}

function changeAvatar() {
    profileManager.changeAvatar();
}

function openChangePasswordModal() {
    profileManager.openChangePasswordModal();
}

function closeChangePasswordModal() {
    profileManager.closeChangePasswordModal();
}

function confirmDeleteAccount() {
    profileManager.confirmDeleteAccount();
}

window.profileManager = profileManager;
window.enableEditMode = enableEditMode;
window.cancelEdit = cancelEdit;
window.switchTab = switchTab;
window.changeAvatar = changeAvatar;
window.openChangePasswordModal = openChangePasswordModal;
window.closeChangePasswordModal = closeChangePasswordModal;
window.confirmDeleteAccount = confirmDeleteAccount;
