// Cloudflare API Client

class CloudflareApiClient {
    constructor() {
        this.baseUrl = CONFIG.CLOUDFLARE_API_URL || '';
    }

    isEnabled() {
        return Boolean(this.baseUrl);
    }

    async request(method, path, body = null) {
        if (!this.isEnabled()) {
            throw new Error('Cloudflare API URL is not configured');
        }

        const url = `${this.baseUrl.replace(/\/$/, '')}${path}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (body !== null) {
            options.body = JSON.stringify(body);
        }

        let response;
        try {
            response = await fetch(url, options);
        } catch (networkError) {
            // The request never reached a server that could respond (offline,
            // DNS failure, CORS, etc.) - this means the backend isn't actually
            // reachable, not that the user's request was invalid.
            const error = new Error('Could not reach the Cloudflare API');
            error.backendUnavailable = true;
            throw error;
        }

        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            // The response wasn't JSON at all (e.g. a 404/501 HTML error page
            // from a misconfigured or undeployed API route). Treat this as
            // "the backend isn't working" rather than a real application error,
            // so callers can fall back instead of showing a raw parse error.
            const error = new Error('The Cloudflare API returned an unexpected response');
            error.backendUnavailable = true;
            throw error;
        }

        if (!response.ok) {
            const message = data?.error || `API request failed with status ${response.status}`;
            throw new Error(message);
        }

        return data;
    }

    async register(email, password, name, userType, roleTier = '') {
        return this.request('POST', '/auth/register', { email, password, name, userType, roleTier });
    }

    async login(email, password) {
        return this.request('POST', '/auth/login', { email, password });
    }

    async getUser(userId) {
        return this.request('GET', `/users/${encodeURIComponent(userId)}`);
    }

    async updateUser(userId, updates) {
        return this.request('PUT', `/users/${encodeURIComponent(userId)}`, updates);
    }

    async deleteUser(userId) {
        return this.request('DELETE', `/users/${encodeURIComponent(userId)}`);
    }

    async getOrganisations(ownerId) {
        return this.request('GET', `/organisations?ownerId=${encodeURIComponent(ownerId)}`);
    }

    async createOrganisation(ownerId, name, licenceLevel, managerEmail = '') {
        return this.request('POST', '/organisations', { ownerId, name, licenceLevel, managerEmail });
    }

    async updateOrganisation(orgId, updates) {
        return this.request('PUT', `/organisations/${encodeURIComponent(orgId)}`, updates);
    }

    async getManagers() {
        return this.request('GET', '/users?role=manager');
    }
}

const cfApi = new CloudflareApiClient();
