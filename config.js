// Configuration for Sport Manager Application

const CONFIG = {
    // Google Sheets API Configuration
    // Replace these with your actual values from Google Cloud Console
   // GOOGLE_SHEETS_API_KEY: 'AIzaSyCOI82IcTxCSTLKryyCjSlVnEPUROaKH0M',
    GOOGLE_OAUTH_CLIENT_ID: '210134173991-ibl96ui59edrmpanf5nqe4bpcpdotkcf.apps.googleusercontent.com',
    GOOGLE_SHEETS_ID: '1yWZCmJL-_OhXye9mGmL-gN5ci4ZFKBuG--0T_FxzrUg',
    
    // Sheet Names (these should match your Google Sheet tab names)
    SHEETS: {
        USERS: 'Users',
        TEAMS: 'Teams',
        MATCHES: 'Matches',
        UMPIRES: 'Umpires',
        SPORTS: 'Sports',
        GAME_SETUPS: 'GameSetups',
        PLAYER_ASSIGNMENTS: 'PlayerAssignments',
        UMPIRE_ASSIGNMENTS: 'UmpireAssignments'
    },

    // Application Settings
    APP_NAME: 'Sport Manager',
    APP_VERSION: '1.0.0',
    
    // Use '/api' for Cloudflare Pages Functions deployments.
    // Replace with the full Worker URL if you deploy a standalone Worker instead.
    CLOUDFLARE_API_URL: '/api',
    
    // Date/Time Settings
    DATE_FORMAT: 'MMM DD, YYYY',
    TIME_FORMAT: 'hh:mm A',
    
    // User Types
    USER_TYPES: {
        PLAYER: 'player',
        MANAGER: 'manager',
        UMPIRE: 'umpire',
        ADMIN: 'admin',
        OWNER: 'owner',
        SAHA_REPRESENTATIVE: 'saha_representative',
        APPLICATION_MANAGER: 'application_manager'
    },

    ROLE_LABELS: {
        player: 'Player',
        manager: 'Manager',
        umpire: 'Umpire',
        admin: 'Administrator',
        owner: 'Organisation Owner',
        saha_representative: 'SAHA Representative',
        application_manager: 'Application Manager'
    },

    MANAGER_TIERS: {
        TIER_1: 'Tier 1',
        TIER_2: 'Tier 2',
        TIER_3: 'Tier 3'
    },

    OWNER_LICENSE_LEVELS: [
        { id: 'Level 1', sports: 1, teams: 5, description: '1 sport with up to 5 teams' },
        { id: 'Level 2', sports: 5, teams: 5, description: '5 sports with up to 5 teams' },
        { id: 'Level 3', sports: 10, teams: 20, description: '10 sports with up to 20 teams' },
        { id: 'Level 4', sports: 10, teams: 'Unlimited', description: '10 sports with unlimited teams' },
        { id: 'Level 5', sports: 'Unlimited', teams: 'Unlimited', description: 'Unlimited sports and unlimited teams' }
    ],

    // Match Status
    MATCH_STATUS: {
        UPCOMING: 'upcoming',
        ONGOING: 'ongoing',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled'
    },

    // User Ranks
    RANKS: {
        PROFESSIONAL: 'professional',
        ADVANCED: 'advanced',
        BEGINNER: 'beginner'
    },

    // Time Slots
    TIME_SLOTS: {
        MORNING: 'morning',
        AFTERNOON: 'afternoon',
        EVENING: 'evening'
    },

    // Days of Week
    DAYS: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    DAYS_FULL: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

    // Pagination
    ITEMS_PER_PAGE: 10,

    // Cache Configuration
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes in milliseconds

    // Sports Categories
    SPORTS_CATEGORIES: {
        TEAM: 'team',
        INDIVIDUAL: 'individual',
        MIXED: 'mixed'
    }
};

// LocalStorage Keys
const STORAGE_KEYS = {
    CURRENT_USER: 'currentUser',
    AUTH_TOKEN: 'authToken',
    CACHED_DATA: 'cachedData',
    THEME: 'theme'
};

// Initialize the application
function initializeApp() {
    console.log(`Initializing ${CONFIG.APP_NAME} v${CONFIG.APP_VERSION}`);
    
    // Check if user is logged in
    const currentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    
    if (!currentUser && !window.location.pathname.includes('index.html')) {
        // Redirect to login if not authenticated
        window.location.href = 'index.html';
    }
}

// Helper function to get the current user
function getCurrentUser() {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
}

// Helper function to show or hide role-based sidebar links
//
// Sidebar <li> elements can carry a data-roles="admin,manager,..." attribute
// (values match CONFIG.USER_TYPES) listing which roles may see that link.
// A link with no data-roles attribute is always shown to any logged-in user
// (e.g. Dashboard, Matches, Profile). This replaces the old logic, which only
// ever hid the "User Management" and "Owner Portal" links and left every
// other tab (Umpires, Team Registration, Game Setup, Sport Registration,
// Cloudflare Setup) visible to every role, including umpires and players.
function initializeAdminLinks() {
    applyRoleBasedNav();
}

function applyRoleBasedNav() {
    const currentUser = getCurrentUser();
    const restrictedLinks = document.querySelectorAll('.sidebar-nav li[data-roles]');

    restrictedLinks.forEach(li => {
        const allowedRoles = (li.getAttribute('data-roles') || '')
            .split(',')
            .map(role => role.trim())
            .filter(Boolean);
        const canView = Boolean(currentUser && allowedRoles.includes(currentUser.userType));
        li.style.display = canView ? '' : 'none';
    });
}

// Helper function to set the current user
function setCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
}

// Helper function to clear the current user
function clearCurrentUser() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

// Helper function to get authentication token
function getAuthToken() {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
}

// Helper function to set authentication token
function setAuthToken(token) {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
}

// Helper function to clear authentication token
function clearAuthToken() {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
}

// Initialize the app and admin links when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeApp();
        initializeAdminLinks();
    });
} else {
    initializeApp();
    initializeAdminLinks();
}
