// Authentication Module

class AuthManager {
    constructor() {
        this.users = [];
        this.currentUser = getCurrentUser();
        
        // Seed the initial admin account for the Cloudflare deployment
        const adminPassword = this.hashPassword('Admin@12345');
        this.users.push({
            id: 'admin-001',
            email: 'admin@sportmanager.com',
            password: adminPassword,
            name: 'Administrator',
            userType: CONFIG.USER_TYPES.ADMIN,
            phone: '',
            location: '',
            createdAt: new Date().toISOString()
        });
    }

    /**
     * Initialize authentication
     */
    async init() {
        // Load users from sheets
        try {
            const usersData = await sheetsAPI.readSheet(CONFIG.SHEETS.USERS);
            if (usersData && usersData.length > 1) {
                // Skip header row - but preserve admin account
                const sheetUsers = usersData.slice(1).map(row => ({
                    id: row[0],
                    email: row[1],
                    name: row[2],
                    userType: row[3],
                    phone: row[4],
                    location: row[5],
                    createdAt: row[6]
                }));
                
                // Merge sheet users with seeded admin account
                const adminUser = this.users.find(u => u.email === 'admin@sportmanager.com');
                this.users = [...sheetUsers];
                if (adminUser) {
                    this.users.unshift(adminUser);
                }
            }
        } catch (error) {
            console.error('Error loading users:', error);
            // If sheet loading fails, at least keep the admin account
        }
    }

    /**
     * Register new user
     */
    async register(email, password, name, userType, roleTier = '') {
        return this.createUser(email, password, name, userType, false, roleTier);
    }

    async createUser(email, password, name, userType, allowAdmin = false, roleTier = '') {
        // Validate inputs
        if (!validateEmail(email)) {
            throw new Error('Invalid email address');
        }

        if (!validatePassword(password)) {
            throw new Error('Password must be at least 8 characters with uppercase, lowercase, and number');
        }

        if (!name || !userType) {
            throw new Error('Name and user type are required');
        }

        if ((userType === CONFIG.USER_TYPES.ADMIN || userType === CONFIG.USER_TYPES.APPLICATION_MANAGER) && !allowAdmin) {
            throw new Error('This role can only be created by an application manager');
        }

        // Check if user already exists
        if (this.users.some(user => user.email === email)) {
            throw new Error('User with this email already exists');
        }

        // Create new user
        const userId = generateId();
        const newUser = {
            id: userId,
            email: email,
            password: this.hashPassword(password), // In production, this should be done on server
            name: name,
            userType: userType,
            phone: '',
            location: '',
            createdAt: new Date().toISOString(),
            roleTier: roleTier || ''
        };

        // Save to sheets
        try {
            await sheetsAPI.appendSheet(CONFIG.SHEETS.USERS, [
                userId,
                email,
                name,
                userType,
                '',
                '',
                new Date().toISOString(),
                roleTier || ''
            ]);

            this.users.push(newUser);
            return { success: true, user: newUser };
        } catch (error) {
            console.error('Error creating user:', error);
            throw new Error('Failed to create user');
        }
    }

    async createUserAdmin(email, password, name, userType, roleTier = '') {
        return this.createUser(email, password, name, userType, true, roleTier);
    }

    /**
     * Login user
     */
    async login(email, password, userType) {
        // Validate inputs
        if (!validateEmail(email)) {
            throw new Error('Invalid email address');
        }

        if (!password) {
            throw new Error('Password is required');
        }

        // Find user by email and derive the role from the stored account
        const user = this.users.find(u => u.email === email);

        if (!user) {
            throw new Error('Invalid email');
        }

        // Check password (in production, this should be verified on server)
        if (user.password !== this.hashPassword(password)) {
            throw new Error('Invalid password');
        }

        // Set current user
        this.currentUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            userType: user.userType,
            phone: user.phone,
            location: user.location
        };

        setCurrentUser(this.currentUser);
        setAuthToken(generateId()); // In production, use real JWT

        return { success: true, user: this.currentUser };
    }

    /**
     * Logout user
     */
    logout() {
        this.currentUser = null;
        clearCurrentUser();
        clearAuthToken();
    }

    /**
     * Hash password (simple hash for demo - use bcrypt in production)
     */
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser || getCurrentUser();
    }

    /**
     * Update user profile
     */
    async updateProfile(userId, updates) {
        try {
            // Update in memory
            const userIndex = this.users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                this.users[userIndex] = { ...this.users[userIndex], ...updates };
            }

            // Update current user
            if (this.currentUser && this.currentUser.id === userId) {
                this.currentUser = { ...this.currentUser, ...updates };
                setCurrentUser(this.currentUser);
            }

            // In a real application, you would update this in the Google Sheet
            // For now, we'll just update localStorage
            localStorage.setItem(`user_${userId}`, JSON.stringify(this.users[userIndex]));

            return { success: true };
        } catch (error) {
            console.error('Error updating profile:', error);
            throw new Error('Failed to update profile');
        }
    }

    /**
     * Change password
     */
    async changePassword(userId, oldPassword, newPassword) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            throw new Error('User not found');
        }

        if (user.password !== this.hashPassword(oldPassword)) {
            throw new Error('Current password is incorrect');
        }

        if (!validatePassword(newPassword)) {
            throw new Error('New password must be at least 8 characters with uppercase, lowercase, and number');
        }

        user.password = this.hashPassword(newPassword);
        localStorage.setItem(`user_${userId}`, JSON.stringify(user));

        return { success: true };
    }

    /**
     * Delete account
     */
    async deleteAccount(userId) {
        try {
            this.users = this.users.filter(u => u.id !== userId);
            localStorage.removeItem(`user_${userId}`);
            return { success: true };
        } catch (error) {
            console.error('Error deleting account:', error);
            throw new Error('Failed to delete account');
        }
    }
}

// Create global auth manager instance
const authManager = new AuthManager();

// Initialize auth manager
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => authManager.init());
} else {
    authManager.init();
}

// Login form handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            showLoading();
            if (cfApi.isEnabled()) {
                const result = await cfApi.login(email, password);
                const user = result.user;
                setCurrentUser(user);
                setAuthToken(generateId());
            } else {
                await authManager.login(email, password);
            }
            showToast('Login successful!', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            hideLoading();
        }
    });
}

// Signup form handler
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const userType = document.getElementById('signupUserType').value;
        const roleTier = '';

        if (userType !== CONFIG.USER_TYPES.UMPIRE) {
            showToast('Only umpires may self-register. All other accounts must be created by an owner.', 'error');
            hideLoading();
            return;
        }

        try {
            showLoading();
            if (cfApi.isEnabled()) {
                await cfApi.register(email, password, name, userType, roleTier);
            } else {
                await authManager.register(email, password, name, userType, roleTier);
            }
            showToast('Account created successfully! Please log in.', 'success');
            
            // Switch to login form
            setTimeout(() => {
                toggleSignup();
                document.getElementById('loginForm').reset();
            }, 1500);
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            hideLoading();
        }
    });
}

// Toggle signup form
function toggleSignup() {
    const loginBox = document.querySelector('.login-box');
    const signupBox = document.getElementById('signupBox');

    if (loginBox && signupBox) {
        if (signupBox.style.display === 'none') {
            loginBox.style.display = 'none';
            signupBox.style.display = 'block';
        } else {
            loginBox.style.display = 'block';
            signupBox.style.display = 'none';
        }
    }
}

// Make auth functions globally available
window.toggleSignup = toggleSignup;
