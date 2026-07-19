// Owner Portal Script

class OwnerManager {
    constructor() {
        this.currentUser = getCurrentUser();
        this.orgs = [];
        this.managers = [];
    }

    async init() {
        if (!this.currentUser || !canAccessOwnerPortal(this.currentUser)) {
            showToast('Access denied. Owners and administrators only.', 'error');
            window.location.href = 'index.html';
            return;
        }

        this.setupUI();
        await this.loadData();
        this.setupEventListeners();
    }

    setupUI() {
        const userName = document.getElementById('userName');
        const display = document.getElementById('ownerName');
        if (userName) userName.textContent = this.currentUser.name;
        if (display) display.textContent = this.currentUser.name;
    }

    async loadData() {
        try {
            if (!cfApi.isEnabled()) {
                showToast('Cloudflare API not configured for owner operations.', 'error');
                return;
            }

            const orgResponse = await cfApi.getOrganisations(this.currentUser.id);
            this.orgs = orgResponse.organisations || [];

            const managerResponse = await cfApi.getManagers();
            this.managers = managerResponse.users || [];

            this.renderOrganisations();
            this.renderManagerOptions();
        } catch (error) {
            console.error(error);
            showToast('Failed to load owner data.', 'error');
        }
    }

    setupEventListeners() {
        const form = document.getElementById('organisationForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleCreateOrganisation(e));
        }
    }

    renderOrganisations() {
        const container = document.getElementById('organisationList');
        if (!container) return;

        if (this.orgs.length === 0) {
            container.innerHTML = '<div class="loading">No organisations found.</div>';
            return;
        }

        container.innerHTML = this.orgs.map(org => `
            <div class="organisation-card">
                <h3>${org.name}</h3>
                <p>Licence: ${org.licence_level}</p>
                <p>Manager: ${org.manager_email || 'None assigned'}</p>
            </div>
        `).join('');
    }

    renderManagerOptions() {
        const select = document.getElementById('organisationManager');
        if (!select) return;
        select.innerHTML = '<option value="">Select manager</option>' + this.managers.map(manager => `
            <option value="${manager.email}">${manager.name} (${manager.email})</option>
        `).join('');
    }

    async handleCreateOrganisation(event) {
        event.preventDefault();

        const name = document.getElementById('organisationName').value;
        const licenceLevel = document.getElementById('organisationLicence').value;
        const managerEmail = document.getElementById('organisationManager').value;

        if (!name || !licenceLevel) {
            showToast('Name and licence level are required.', 'error');
            return;
        }

        try {
            showLoading();
            await cfApi.createOrganisation(this.currentUser.id, name, licenceLevel, managerEmail);
            showToast('Organisation created successfully!', 'success');
            await this.loadData();
            document.getElementById('organisationForm').reset();
        } catch (error) {
            console.error(error);
            showToast('Failed to create organisation.', 'error');
        } finally {
            hideLoading();
        }
    }
}

const ownerManager = new OwnerManager();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ownerManager.init());
} else {
    ownerManager.init();
}
