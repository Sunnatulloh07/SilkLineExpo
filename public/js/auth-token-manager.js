/**
 * JWT Token Manager - Automatic Token Refresh
 * Handles automatic token refresh to prevent 401 errors
 */

class AuthTokenManager {
    constructor() {
        this.refreshInProgress = false;
        this.refreshRetries = 0;
        this.maxRetries = 3;
        
        // Check token every 5 minutes
        this.checkInterval = 5 * 60 * 1000; // 5 minutes
        
        // Refresh when token has 5 minutes left
        this.refreshBuffer = 5 * 60 * 1000; // 5 minutes
        
        this.init();
    }
    
    init() {
        // Start periodic token check
        this.startTokenCheck();
        
        // Set up axios interceptors for automatic retry
        this.setupAxiosInterceptors();
        
        // Handle page visibility changes
        this.handleVisibilityChange();
    }
    
    /**
     * Start periodic token checking
     */
    startTokenCheck() {
        setInterval(() => {
            this.checkAndRefreshToken();
        }, this.checkInterval);
        
        // Also check immediately
        setTimeout(() => this.checkAndRefreshToken(), 1000);
    }
    
    /**
     * Check if token needs refresh and refresh if needed
     */
    async checkAndRefreshToken() {
        if (this.refreshInProgress) return;
        
        try {
            const accessToken = this.getCookie('accessToken');
            if (!accessToken) {
                // No access token found
                return;
            }
            
            // Decode token to check expiry
            const tokenPayload = this.decodeJWT(accessToken);
            if (!tokenPayload) {
                // Invalid token format
                return;
            }
            
            const currentTime = Math.floor(Date.now() / 1000);
            const expiryTime = tokenPayload.exp;
            const timeUntilExpiry = (expiryTime - currentTime) * 1000;
            
            
            // Refresh if token expires in less than buffer time
            if (timeUntilExpiry <= this.refreshBuffer) {
                await this.refreshToken();
            }
        } catch (error) {
            console.error('❌ Token check error:', error);
        }
    }
    
    /**
     * Refresh the access token
     */
    async refreshToken() {
        if (this.refreshInProgress) {
            return false;
        }
        
        this.refreshInProgress = true;
        
        try {
            
            const response = await fetch('/api/auth/refresh-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
            
            if (response.ok) {
                const result = await response.json();
                this.refreshRetries = 0;
                return true;
            } else {
                throw new Error(`Refresh failed: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Token refresh failed:', error);
            this.refreshRetries++;
            
            if (this.refreshRetries >= this.maxRetries) {
                console.log('❌ Max refresh retries reached, redirecting to login');
                this.redirectToLogin();
            }
            return false;
        } finally {
            this.refreshInProgress = false;
        }
    }
    
    /**
     * Set up axios interceptors for automatic 401 handling
     */
    setupAxiosInterceptors() {
        // Only if axios is available
        if (typeof axios !== 'undefined') {
            axios.interceptors.response.use(
                (response) => response,
                async (error) => {
                    if (error.response?.status === 401 && !this.refreshInProgress) {
                        const refreshed = await this.refreshToken();
                        
                        if (refreshed) {
                            // Retry the original request
                            return axios.request(error.config);
                        }
                    }
                    return Promise.reject(error);
                }
            );
        }
    }
    
    /**
     * Handle page visibility changes to check tokens when page becomes visible
     */
    handleVisibilityChange() {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Page became visible, check token
                setTimeout(() => this.checkAndRefreshToken(), 1000);
            }
        });
    }
    
    /**
     * Decode JWT token (simple implementation)
     */
    decodeJWT(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            
            const payload = JSON.parse(atob(parts[1]));
            return payload;
        } catch (error) {
            return null;
        }
    }
    
    /**
     * Get cookie value
     */
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }
    
    /**
     * Redirect to login page
     */
    redirectToLogin() {
        const currentPath = window.location.pathname;
        const returnUrl = encodeURIComponent(currentPath);
        window.location.href = `/auth/login?returnUrl=${returnUrl}&reason=session_expired`;
    }
}

// Initialize token manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on protected pages (not login/register pages)
    if (!window.location.pathname.includes('/auth/')) {
        window.authTokenManager = new AuthTokenManager();
    }
});

// Also expose globally for manual use
window.AuthTokenManager = AuthTokenManager;
