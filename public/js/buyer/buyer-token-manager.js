/**
 * SLEX Buyer Token Manager - Professional JWT Management
 * Handles access/refresh token lifecycle for buyer dashboard
 * Automatic token refresh before expiration
 * Senior Software Engineer Implementation
 */

class BuyerTokenManager {
    constructor() {
        // Configuration
        this.config = {
            refreshBuffer: 5 * 60 * 1000, // Refresh 5 minutes before expiry
            checkInterval: 60 * 1000, // Check every minute
            maxRetries: 3,
            retryDelay: 1000,
            debug: true
        };

        // LocalStorage keys for state management
        this.storageKeys = {
            USER_DATA: 'slex_buyer_user_data',
            USER_COMPANY_LOGO: 'slex_buyer_company_logo',
            USER_PREFERENCES: 'slex_buyer_preferences',
            LAST_REFRESH: 'slex_buyer_last_refresh'
        };

        // State management
        this.isRefreshing = false;
        this.refreshPromise = null;
        this.checkTimer = null;
        this.retryCount = 0;
        
        // Cookies cache
        this.tokenCache = {
            accessToken: null,
            refreshToken: null,
            lastCheck: 0
        };

        // Event emitter for token events
        this.eventListeners = {
            'token-refreshed': [],
            'token-expired': [],
            'auth-error': []
        };

        this.init();
    }

    /**
     * Initialize token manager
     */
    init() {

        
        // Start token monitoring
        this.startTokenMonitoring();
        
        // Setup page visibility listener
        this.setupVisibilityListener();
        
        // Setup beforeunload to cleanup
        window.addEventListener('beforeunload', () => this.cleanup());
        
        // Load user data from localStorage
        this.loadUserDataFromStorage();
        
        // Check token status immediately
        this.checkAndRefreshToken();
        

    }

    /**
     * Load user data from localStorage
     */
    loadUserDataFromStorage() {
        try {
            const userData = localStorage.getItem(this.storageKeys.USER_DATA);
            if (userData) {
                this.currentUser = JSON.parse(userData);

            }
        } catch (error) {
            // this.log('⚠️ Failed to load user data from localStorage:', error);
            this.clearUserStorage();
        }
    }

    /**
     * Save user data to localStorage
     */
    saveUserDataToStorage(userData) {
        try {
            localStorage.setItem(this.storageKeys.USER_DATA, JSON.stringify(userData));
            localStorage.setItem(this.storageKeys.LAST_REFRESH, Date.now().toString());
            
            // Save specific fields for quick access
            if (userData.companyLogo?.url) {
                localStorage.setItem(this.storageKeys.USER_COMPANY_LOGO, userData.companyLogo.url);
            }
            if (userData.preferences) {
                localStorage.setItem(this.storageKeys.USER_PREFERENCES, JSON.stringify(userData.preferences));
            }
            
            this.currentUser = userData;
            // this.log('💾 User data saved to localStorage');
            
            // Update UI with new data
            this.updateUserInterface(userData);
        } catch (error) {
            // this.log('⚠️ Failed to save user data to localStorage:', error);
        }
    }

    /**
     * Clear user data from localStorage
     */
    clearUserStorage() {
        try {
            Object.values(this.storageKeys).forEach(key => {
                localStorage.removeItem(key);
            });
            this.currentUser = null;
            // this.log('🗑️ User storage cleared');
        } catch (error) {
            // this.log('⚠️ Failed to clear user storage:', error);
        }
    }

    /**
     * Update user interface with new data
     */
    updateUserInterface(userData) {
        try {
            // Update header avatar
            const headerAvatars = document.querySelectorAll('.user-avatar img, .user-avatar');
            headerAvatars.forEach(avatar => {
                if (avatar.tagName === 'IMG') {
                    if (userData.companyLogo?.url) {
                        avatar.src = userData.companyLogo.url;
                        avatar.style.display = 'block';
                        // Hide text fallback if exists
                        const textFallback = avatar.nextElementSibling;
                        if (textFallback && textFallback.classList.contains('user-avatar-text')) {
                            textFallback.style.display = 'none';
                        }
                    }
                }
            });

            // Update profile avatar if on profile page
            const profileAvatar = document.getElementById('profileAvatar');
            if (profileAvatar && userData.companyLogo?.url) {
                profileAvatar.src = userData.companyLogo.url;
            }

            // Update user info in dropdown
            const userDetailsElements = document.querySelectorAll('.user-details h4');
            userDetailsElements.forEach(element => {
                if (userData.companyName) {
                    element.textContent = userData.companyName;
                }
            });

            // this.log('🎨 User interface updated with new data');
        } catch (error) {
            // this.log('⚠️ Failed to update user interface:', error);
        }
    }

    /**
     * Start automatic token monitoring
     */
    startTokenMonitoring() {
        // Initial check
        this.checkAndRefreshToken();
        
        // Setup periodic checks
        this.checkTimer = setInterval(() => {
            this.checkAndRefreshToken();
        }, this.config.checkInterval);
        
        // this.log(`📊 Token monitoring started (check interval: ${this.config.checkInterval}ms)`);
    }

    /**
     * Setup page visibility listener for efficient token management
     */
    setupVisibilityListener() {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Page became visible, check tokens immediately
                // this.log('👁️ Page visible, checking tokens...');
                this.checkAndRefreshToken();
            }
        });
    }

    /**
     * Main token check and refresh logic
     */
    async checkAndRefreshToken() {
        if (this.isRefreshing) {
            // this.log('🔄 Token refresh already in progress, waiting...');
            return this.refreshPromise;
        }

        try {
            const tokenInfo = this.getTokenInfo();
            
            if (!tokenInfo.hasTokens) {
                // this.log('🔍 No tokens found');
                this.emit('auth-error', { reason: 'no-tokens' });
                return false;
            }

            const currentTime = Date.now();
            const timeUntilExpiry = tokenInfo.expiresAt - currentTime;
            
            // this.log(`⏰ Token expires in: ${Math.round(timeUntilExpiry / 60000)} minutes`);

            // Check if token needs refresh
            if (timeUntilExpiry <= this.config.refreshBuffer) {
                // this.log('🔄 Token needs refresh, initiating refresh...');
                return await this.refreshToken();
            }

            // Token is still valid
            this.retryCount = 0; // Reset retry count on successful check
            return true;

        } catch (error) {
            // this.log('❌ Token check error:', error);
            this.emit('auth-error', { reason: 'check-failed', error });
            return false;
        }
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshToken() {
        if (this.isRefreshing) {
            return this.refreshPromise;
        }

        this.isRefreshing = true;
        this.refreshPromise = this._performTokenRefresh();

        try {
            const result = await this.refreshPromise;
            return result;
        } finally {
            this.isRefreshing = false;
            this.refreshPromise = null;
        }
    }

    /**
     * Perform the actual token refresh
     */
    async _performTokenRefresh() {
        try {
            // this.log('🔄 Sending refresh token request...');

            const response = await fetch('/api/auth/refresh-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include' // Include cookies
            });

            if (!response.ok) {
                throw new Error(`Refresh failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                // this.log('✅ Token refresh successful');
                this.retryCount = 0;
                this.clearTokenCache(); // Clear cache to force re-read
                
                // Save user data to localStorage
                if (data.data && data.data.user) {
                    this.saveUserDataToStorage(data.data.user);
                }
                
                this.emit('token-refreshed', data);
                return true;
            } else {
                throw new Error(data.message || 'Token refresh failed');
            }

        } catch (error) {
            // this.log('❌ Token refresh failed:', error);
            
            this.retryCount++;
            if (this.retryCount < this.config.maxRetries) {
                // this.log(`🔄 Retrying refresh (${this.retryCount}/${this.config.maxRetries})`);
                await this.sleep(this.config.retryDelay * this.retryCount);
                return this._performTokenRefresh();
            }

            // Max retries reached, emit error
            this.emit('auth-error', { reason: 'refresh-failed', error });
            this.handleAuthFailure();
            return false;
        }
    }

    /**
     * Get token information from cookies
     */
    getTokenInfo() {
        try {
            const currentTime = Date.now();
            
            // Use cache if recent
            if (currentTime - this.tokenCache.lastCheck < 5000 && this.tokenCache.accessToken) {
                return this.tokenCache;
            }

            const accessToken = this.getCookie('accessToken');
            const refreshToken = this.getCookie('refreshToken');
            
            if (!accessToken || !refreshToken) {
                return { hasTokens: false };
            }
            
            // Decode JWT to get expiry
            const payload = this.decodeJWTPayload(accessToken);
            
            const tokenInfo = {
                hasTokens: true,
                expiresAt: payload.exp * 1000,
                issuedAt: payload.iat * 1000,
                userId: payload.userId,
                userType: payload.userType
            };

            // Update cache
            this.tokenCache = {
                ...tokenInfo,
                accessToken,
                refreshToken,
                lastCheck: currentTime
            };
            
            return tokenInfo;
            
        } catch (error) {
            // this.log('❌ Error getting token info:', error);
            return { hasTokens: false };
        }
    }

    /**
     * Get cookie value with enhanced fallback
     */
    getCookie(name) {
        try {
            // Method 1: Standard document.cookie
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) {
                const cookieValue = parts.pop().split(';').shift();
                if (cookieValue && cookieValue !== 'undefined') {
                    return decodeURIComponent(cookieValue);
                }
            }

            // Method 2: Alternative parsing
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                const [cookieName, cookieValue] = cookie.trim().split('=');
                if (cookieName === name && cookieValue && cookieValue !== 'undefined') {
                    return decodeURIComponent(cookieValue);
                }
            }

            return null;
        } catch (error) {
            // this.log(`❌ Error reading cookie ${name}:`, error);
            return null;
        }
    }

    /**
     * Simple JWT payload decoder (client-side)
     */
    decodeJWTPayload(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            // this.log('❌ JWT decode error:', error);
            return null;
        }
    }

    /**
     * Handle authentication failure
     */
    handleAuthFailure() {
        // this.log('🔒 Authentication failed, redirecting to login...');
        
        // Clear user data from localStorage
        this.clearUserStorage();
        
        this.cleanup();
        
        // Store current URL for redirect after login
        sessionStorage.setItem('returnUrl', window.location.pathname);
        
        // Redirect to login
        window.location.href = '/auth/login';
    }

    /**
     * Logout user and clear all data
     */
    async logout() {
        try {
            // this.log('🚪 Logging out user...');
            
            // Clear user data from localStorage
            this.clearUserStorage();
            
            // Send logout request to server
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include'
            });
            
            // Cleanup and redirect
            this.cleanup();
            window.location.href = '/auth/login';
        } catch (error) {
            // this.log('⚠️ Logout error:', error);
            // Even if server logout fails, clear local data and redirect
            this.clearUserStorage();
            this.cleanup();
            window.location.href = '/auth/login';
        }
    }

    /**
     * Clear token cache
     */
    clearTokenCache() {
        this.tokenCache = {
            accessToken: null,
            refreshToken: null,
            lastCheck: 0
        };
    }

    /**
     * Event system
     */
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    // this.log('❌ Event listener error:', error);
                }
            });
        }
    }

    /**
     * Utility: Sleep function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Logging utility
     */
    log(...args) {
        if (this.config.debug) {
            console.log('[BuyerTokenManager]', ...args);
        }
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.checkTimer) {
            clearInterval(this.checkTimer);
            this.checkTimer = null;
        }
        this.isRefreshing = false;
        this.refreshPromise = null;
        // this.log('🧹 Buyer Token Manager cleaned up');
    }

    /**
     * Manual token refresh trigger
     */
    async forceRefresh() {
        // this.log('🔄 Force refresh requested');
        return await this.refreshToken();
    }

    /**
     * Get current token status
     */
    getStatus() {
        const tokenInfo = this.getTokenInfo();
        const currentTime = Date.now();
        
        return {
            hasTokens: tokenInfo.hasTokens,
            isExpired: tokenInfo.hasTokens && tokenInfo.expiresAt < currentTime,
            expiresIn: tokenInfo.hasTokens ? tokenInfo.expiresAt - currentTime : 0,
            isRefreshing: this.isRefreshing,
            retryCount: this.retryCount
        };
    }
}

// Global instance
window.buyerTokenManager = new BuyerTokenManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BuyerTokenManager;
}
