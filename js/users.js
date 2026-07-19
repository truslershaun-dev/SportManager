// User Management Page Logic

async function initUsersPage() {
    const currentUser = getCurrentUser();

    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    await authManager.init();

    if (!isAdminUser(currentUser)) {
        showToast('Access denied. Admins only.', 'error');
        window.location.href = 'dashboard.html';
        return;
    }

    const userManagementUser = document.getElementById('userManagementUser');
    if (userManagementUser) {
        userManagementUser.textContent = currentUser.name;
    }

    await loadExistingUsers();
    attachCreateUserHandler();
}

async function loadExistingUsers() {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;

    const users = authManager.users || [];
    if (users.length === 0) {
        usersList.innerHTML = '<div class="loading">No users found.</div>';
        return;
    }

    usersList.innerHTML = users.map((user, index) => `
        <div class="admin-sheet-row">
            <strong>${index + 1}. ${user.name || 'Unknown'}</strong>
            <span>Email: ${user.email || 'N/A'}</span>
            <span>Role: ${user.userType || 'N/A'}</span>
            <span>Created: ${user.createdAt ? formatDate(user.createdAt) : 'N/A'}</span>
        </div>
    `).join('');
}

function attachCreateUserHandler() {
    const form = document.getElementById('createUserForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('newUserName').value.trim();
        const email = document.getElementById('newUserEmail').value.trim();
        const password = document.getElementById('newUserPassword').value;
        const userType = document.getElementById('newUserType').value;

        try {
            showLoading();
            await authManager.createUserAdmin(email, password, name, userType);
            showToast('User created successfully.', 'success');
            clearForm('createUserForm');
            await loadExistingUsers();
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            hideLoading();
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUsersPage);
} else {
    initUsersPage();
}
