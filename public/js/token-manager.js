/**
 * SLEX Professional Token Management System
 * Automatic JWT token refresh and management
 * Seamless user experience with background token handling
 */

class TokenManager {
    constructor() {
        // Configuration
        this.config = {
            refreshEndpoint: '/api/auth/refresh-token',
            loginEndpoint: '/auth/login',
            logoutEndpoint: '/auth/logout',
            refreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry (increased for reliability)
            maxRetries: 3,
            retryDelay: 1000,
            debugMode: false // Disable debug mode for production
        };

        // State management
        this.isRefreshing = false;
        this.refreshPromise = null;
        this.retryCount = 0;
        this.refreshTimer = null;
        this.isReady = false;
        
        // Queue for failed requests during refresh
        this.failedQueue = [];
        
        // PERFORMANCE & CIRCUIT BREAKER
        this.circuitBreaker = {
            failures: 0,
            maxFailures: 5,
            resetTimeout: 30000, // 30 seconds
            state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
            lastFailureTime: null
        };
        
        // REQUEST DEDUPLICATION
        this.pendingRequests = new Map();
        this.authCheckCache = {
            result: null,
            timestamp: null,
            ttl: 5000 // 5 seconds cache
        };
        
        this.init();
    }

    /**
     * Initialize token management
     */
    init() {
        // Setup request interceptors
        this.setupRequestInterceptors();
        
        // Start token monitoring
        this.startTokenMonitoring();
        
        // Handle page visibility changes
        this.setupVisibilityHandling();
        
        // Handle beforeunload
        this.setupBeforeUnload();
        
        // Mark as ready and notify waiting systems
        this.isReady = true;
        window.dispatchEvent(new CustomEvent('tokenManagerReady', {
            detail: { tokenManager: this }
        }));
    }

    /**
     * Wait for Token Manager to be ready
     */
    static async waitForReady(timeout = 10000) {
        return new Promise((resolve, reject) => {
            if (window.tokenManager && window.tokenManager.isReady) {
                resolve(window.tokenManager);
                return;
            }
            
            const timeoutId = setTimeout(() => {
                reject(new Error('Token Manager not ready within timeout'));
            }, timeout);
            
            window.addEventListener('tokenManagerReady', (event) => {
                clearTimeout(timeoutId);
                resolve(event.detail.tokenManager);
            }, { once: true });
        });
    }

    /**
     * Setup XMLHttpRequest and Fetch interceptors
     */
    setupRequestInterceptors() {
        // Intercept XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            this._method = method;
            this._url = url;
            return originalXHROpen.apply(this, [method, url, ...args]);
        };
        
        XMLHttpRequest.prototype.send = function(data) {
            // Add token refresh handling for XHR requests
            if (this._url && this.isProtectedRoute(this._url)) {
                this.addEventListener('readystatechange', async () => {
                    if (this.readyState === 4 && this.status === 401) {
                        await tokenManager.handleUnauthorized();
                    }
                });
            }
            return originalXHRSend.apply(this, [data]);
        };

        // Intercept Fetch API
        const originalFetch = window.fetch;
        window.fetch = async (url, options = {}) => {
            try {
                // Check if token needs refresh before request
                if (this.isProtectedRoute(url)) {
                    await this.ensureValidToken();
                }
                
                const response = await originalFetch(url, {
                    ...options,
                    credentials: options.credentials || 'same-origin'
                });
                
                // Handle 401 responses
                if (response.status === 401 && this.isProtectedRoute(url)) {
                    const refreshed = await this.handleUnauthorized();
                    if (refreshed) {
                        // Retry the original request
                        return originalFetch(url, {
                            ...options,
                            credentials: options.credentials || 'same-origin'
                        });
                    }
                }
                
                return response;
                
            } catch (error) {
                this.log('❌ Fetch error:', error);
                throw error;
            }
        };
        
        this.log('✅ Request interceptors setup complete');
    }

    /**
     * Check if route requires authentication
     */
    isProtectedRoute(url) {
        const protectedPaths = ['/admin/', '/api/', '/user/', '/dashboard'];
        const urlPath = typeof url === 'string' ? url : url.pathname || '';
        return protectedPaths.some(path => urlPath.includes(path));
    }

    /**
     * Start monitoring token expiry
     */
    startTokenMonitoring() {
        // Clear existing timer
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        // Check token status every 30 seconds for more frequent monitoring
        this.refreshTimer = setInterval(async () => {
            await this.checkAndRefreshToken();
        }, 30000); // 30 seconds
        
        // Initial check
        setTimeout(() => this.checkAndRefreshToken(), 1000);
        
         }

    /**
     * Check if token needs refresh and refresh if necessary
     */
    async checkAndRefreshToken() {
        try {
            const tokenInfo = this.getTokenInfo();
            
            if (!tokenInfo.hasTokens) {
            
                // Check if user is on a protected page
                const isProtectedPage = this.isProtectedRoute(window.location.pathname);
                if (isProtectedPage && this.shouldRedirectToLogin()) {
                    this.log('⚠️ Protected page without tokens - checking session');
                    // Don't immediately redirect - might be a loading issue
                    setTimeout(() => this.checkAuthenticationState(), 3000);
                }
                return;
            }
            
            const timeUntilExpiry = tokenInfo.expiresAt - Date.now();
            const minutesUntilExpiry = Math.round(timeUntilExpiry / 60000);
            const secondsUntilExpiry = Math.round(timeUntilExpiry / 1000);
            
           
            if (timeUntilExpiry <= this.config.refreshThreshold) {
               await this.refreshToken();
            } else {
                this.log(`✅ Token valid for ${minutesUntilExpiry} minutes`);
            }
            
        } catch (error) {
            this.log('❌ Token check error:', error);
        }
    }

    /**
     * Get token information from cookies - ENHANCED WITH FALLBACK
     */
    getTokenInfo() {
        try {
            // Use enhanced cookie access with fallback methods
            const accessToken = this.getCookieWithFallback('accessToken');
            const refreshToken = this.getCookieWithFallback('refreshToken');
            
            if (!accessToken || !refreshToken) {
                return { hasTokens: false };
            }
            
            // Decode JWT to get expiry
            const payload = this.decodeJWTPayload(accessToken);
            
            return {
                hasTokens: true,
                expiresAt: payload.exp * 1000,
                issuedAt: payload.iat * 1000,
                userId: payload.userId,
                userType: payload.userType
            };
            
        } catch (error) {
            this.log('❌ Error getting token info:', error);
            return { hasTokens: false };
        }
    }

    /**
     * Simple JWT payload decoder (client-side)
     */
    decodeJWTPayload(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            return JSON.parse(jsonPayload);
        } catch (error) {
            throw new Error('Invalid JWT token');
        }
    }

    /**
     * Ensure valid token exists (refresh if needed) - PERFORMANCE OPTIMIZED
     */
    async ensureValidToken() {
        // CIRCUIT BREAKER CHECK
        if (this.isCircuitBreakerOpen()) {
            throw new Error('Circuit breaker open - authentication temporarily unavailable');
        }
        
        const tokenInfo = this.getTokenInfo();
        
        if (!tokenInfo.hasTokens) {
            // RATE LIMITED AUTH CHECK
            const canAttemptAuth = await this.smartAuthenticationCheck();
            if (!canAttemptAuth) {
                this.recordCircuitBreakerFailure();
                throw new Error('No authentication tokens');
            }
            
            // Re-check after auth attempt - with enhanced timeout and multiple attempts
            let attempts = 0;
            const maxAttempts = 3;
            let newTokenInfo;
            
            while (attempts < maxAttempts) {
                newTokenInfo = this.getTokenInfo();
                if (newTokenInfo.hasTokens) {
                    break;
                }
                
                attempts++;
               
                if (attempts < maxAttempts) {
                    // Wait progressively longer between attempts
                    await this.sleep(500 * attempts); // 500ms, 1s, 1.5s
                }
            }
            
            if (!newTokenInfo || !newTokenInfo.hasTokens) {
                this.recordCircuitBreakerFailure();
                this.log('❌ Token validation failed despite valid session - all attempts exhausted');
                throw new Error('Token validation failed');
            }
        }
        
        const timeUntilExpiry = tokenInfo.expiresAt - Date.now();
        
        if (timeUntilExpiry <= this.config.refreshThreshold) {
            await this.refreshToken();
        }
        
        // Reset circuit breaker on success
        this.resetCircuitBreaker();
    }

    /**
     * Refresh authentication tokens
     */
    async refreshToken() {
        // Prevent multiple simultaneous refresh attempts
        if (this.isRefreshing) {
            return this.refreshPromise;
        }
        
        this.isRefreshing = true;
        this.refreshPromise = this.performTokenRefresh();
        
        try {
            const result = await this.refreshPromise;
            this.retryCount = 0; // Reset retry count on success
            return result;
        } finally {
            this.isRefreshing = false;
            this.refreshPromise = null;
        }
    }

    /**
     * Perform the actual token refresh
     */
    async performTokenRefresh() {
        try {
            
            const refreshToken = this.getCookieWithFallback('refreshToken');
           
            if (!refreshToken) {
                   throw new Error('No refresh token available');
            }
            
            const response = await fetch(this.config.refreshEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
                // No body needed - backend extracts from cookies
            });
            
            if (response.ok) {
                const data = await response.json();
               
                // Process queued requests
                this.processFailedQueue(null);
                
                return { success: true, data };
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Refresh failed: ${response.status} - ${errorData.message || 'Unknown error'}`);
            }
            
        } catch (error) {
            
            // Process queued requests with error
            this.processFailedQueue(error);
            
            // Handle refresh failure
            await this.handleRefreshFailure(error);
            
            throw error;
        }
    }

    /**
     * Handle unauthorized responses (401)
     */
    async handleUnauthorized() {
        this.log('🔒 Handling unauthorized response');
        
        try {
            await this.refreshToken();
            return true;
        } catch (error) {
            this.log('❌ Failed to handle unauthorized:', error);
            return false;
        }
    }

    /**
     * Handle refresh token failure - ✅ TUZATILDI: Kamroq aggressive
     */
    async handleRefreshFailure(error) {
        this.retryCount++;
        
        if (this.retryCount < this.config.maxRetries) {
            this.log(`🔄 Retrying refresh (${this.retryCount}/${this.config.maxRetries})`);
            
            // Exponential backoff
            const delay = this.config.retryDelay * Math.pow(2, this.retryCount - 1);
            await this.sleep(delay);
            
            return this.refreshToken();
        } else {
            // ✅ FIXED: Redirectni darhol qilmaslik
            this.log('⚠️ Max retries exceeded - but keeping session active');
            
            // Reset retry count for future attempts
            this.retryCount = 0;
            
            // ✅ FIXED: 5 daqiqadan keyin qayta urinish
            setTimeout(() => {
                this.log('🔄 Attempting token refresh after cooldown period');
                this.checkAndRefreshToken();
            }, 5 * 60 * 1000); // 5 daqiqa
            
            // ✅ Session auth bilan ishlashga ruxsat ber
            this.log('📝 Falling back to session-based authentication');
        }
    }

    /**
     * Process queued failed requests
     */
    processFailedQueue(error) {
        this.failedQueue.forEach(({ resolve, reject }) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
        
        this.failedQueue = [];
    }

    /**
     * Handle page visibility changes
     */
    setupVisibilityHandling() {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.log('📱 Page visible - checking token status');
                this.checkAndRefreshToken();
            }
        });
    }

    /**
     * Setup beforeunload handling
     */
    setupBeforeUnload() {
        window.addEventListener('beforeunload', () => {
            if (this.refreshTimer) {
                clearInterval(this.refreshTimer);
            }
        });
    }

    /**
     * Redirect to login page
     */
    async redirectToLogin() {
        this.log('🔒 Redirecting to login');
        
        // Clear any existing timers
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        // Store current page for redirect after login
        const currentPath = window.location.pathname + window.location.search;
        if (currentPath !== '/auth/login') {
            sessionStorage.setItem('slex_return_to', currentPath);
        }
        
        // Show notification
        this.showNotification('Session expired. Please log in again.', 'warning');
        
        // Redirect after short delay
        setTimeout(() => {
            window.location.href = '/auth/login';
        }, 2000);
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        // Try to use existing notification system
        if (window.showToast) {
            window.showToast(message, type);
        } else if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            // Fallback to simple alert
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    /**
     * Get cookie value
     */
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }
        return null;
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Enhanced logging
     */
    log(...args) {
        // Silent logging for production
    }

    /**
     * Public API for manual token refresh
     */
    async forceRefresh() {
        this.log('🔄 Manual token refresh requested');
        return this.refreshToken();
    }

    /**
     * Get current token status
     */
    getStatus() {
        const tokenInfo = this.getTokenInfo();
        return {
            authenticated: tokenInfo.hasTokens,
            expiresIn: tokenInfo.hasTokens ? tokenInfo.expiresAt - Date.now() : 0,
            isRefreshing: this.isRefreshing,
            userId: tokenInfo.userId,
            userType: tokenInfo.userType
        };
    }

    /**
     * Enable debug mode
     */
    enableDebug() {
        this.config.debugMode = true;
        localStorage.setItem('slex_token_debug', 'true');
        this.log('🐛 Debug mode enabled');
    }

    /**
     * Disable debug mode
     */
    disableDebug() {
        this.config.debugMode = false;
        localStorage.removeItem('slex_token_debug');
    }

    /**
     * Check if should redirect to login
     */
    shouldRedirectToLogin() {
        // Don't redirect immediately - might be loading state
        const hasRecentActivity = sessionStorage.getItem('slex_recent_activity');
        if (hasRecentActivity) {
            const activityTime = parseInt(hasRecentActivity);
            const timeSinceActivity = Date.now() - activityTime;
            return timeSinceActivity > 5 * 60 * 1000; // 5 minutes
        }
        return false;
    }

    /**
     * Check authentication state
     */
    async checkAuthenticationState() {
        try {
            this.log('🔍 Checking authentication state...');
            
            // Try to get current user info
            const response = await fetch('/auth/me', {
                method: 'GET',
                credentials: 'same-origin'
            });
            
            if (response.ok) {
                this.log('✅ User is authenticated');
                // Update activity timestamp
                sessionStorage.setItem('slex_recent_activity', Date.now().toString());
            } else if (response.status === 401) {
                this.log('🔒 User not authenticated');
                // Only redirect if we're sure user needs to login
                if (this.shouldRedirectToLogin()) {
                    await this.redirectToLogin();
                }
            }
        } catch (error) {
            this.log('❌ Authentication check failed:', error);
        }
    }

    /**
     * SMART AUTHENTICATION CHECK - WITH DEDUPLICATION & CACHING
     */
    async smartAuthenticationCheck() {
        const now = Date.now();
        
        // CHECK CACHE FIRST
        if (this.authCheckCache.result !== null && 
            this.authCheckCache.timestamp &&
            (now - this.authCheckCache.timestamp) < this.authCheckCache.ttl) {
            this.log('📋 Using cached auth result');
            return this.authCheckCache.result;
        }
        
        // PREVENT DUPLICATE REQUESTS
        const pendingKey = 'auth_check';
        if (this.pendingRequests.has(pendingKey)) {
            this.log('⏳ Auth check already in progress - waiting');
            return this.pendingRequests.get(pendingKey);
        }
        
        // CREATE PROMISE FOR DEDUPLICATION
        const authPromise = this.performAuthenticationCheck();
        this.pendingRequests.set(pendingKey, authPromise);
        
        try {
            const result = await authPromise;
            
            // CACHE RESULT
            this.authCheckCache = {
                result,
                timestamp: now,
                ttl: result ? 10000 : 2000 // Success: 10s, Failure: 2s
            };
            
            return result;
        } finally {
            this.pendingRequests.delete(pendingKey);
        }
    }

    /**
     * PERFORM SINGLE AUTHENTICATION CHECK
     */
    async performAuthenticationCheck() {
        try {
            this.log('🔍 Performing authentication check...');
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
            
            const response = await fetch('/auth/me', {
                method: 'GET',
                credentials: 'same-origin',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                this.log('✅ Authentication confirmed');
                sessionStorage.setItem('slex_recent_activity', Date.now().toString());
                
                                 // AGGRESSIVE COOKIE RE-READ with multiple attempts
                 await this.waitForCookieAvailability(3000); // Wait up to 3 seconds
                
                return true;
            }
            
            this.log('❌ Authentication check failed:', response.status);
            return false;
            
        } catch (error) {
            if (error.name === 'AbortError') {
                this.log('⏰ Authentication check timeout');
            } else {
                this.log('❌ Authentication check error:', error);
            }
            return false;
        }
    }

    /**
     * CIRCUIT BREAKER IMPLEMENTATION
     */
    isCircuitBreakerOpen() {
        if (this.circuitBreaker.state === 'OPEN') {
            const now = Date.now();
            const timeSinceFailure = now - this.circuitBreaker.lastFailureTime;
            
            if (timeSinceFailure >= this.circuitBreaker.resetTimeout) {
                this.circuitBreaker.state = 'HALF_OPEN';
                this.log('🔄 Circuit breaker HALF_OPEN - attempting recovery');
                return false;
            }
            return true;
        }
        return false;
    }

    recordCircuitBreakerFailure() {
        this.circuitBreaker.failures++;
        this.circuitBreaker.lastFailureTime = Date.now();
        
        if (this.circuitBreaker.failures >= this.circuitBreaker.maxFailures) {
            this.circuitBreaker.state = 'OPEN';
            this.log(`🚫 Circuit breaker OPEN after ${this.circuitBreaker.failures} failures`);
        }
    }

    resetCircuitBreaker() {
        if (this.circuitBreaker.failures > 0) {
            this.circuitBreaker.failures = 0;
            this.circuitBreaker.state = 'CLOSED';
            this.log('✅ Circuit breaker RESET');
        }
    }

    // DUPLICATE METHOD REMOVED - getTokenInfo() consolidated above

    /**
     * ENHANCED COOKIE ACCESS WITH MULTIPLE METHODS AND DEBUGGING
     */
    getCookieWithFallback(name) {
        // Method 1: Standard document.cookie
        let value = this.getCookie(name);
        if (value) {
           return value;
        }
        
        // Method 2: Direct cookie access with different parsing
        try {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                const [cookieName, cookieValue] = cookie.trim().split('=');
                if (cookieName === name && cookieValue) {
                    return decodeURIComponent(cookieValue);
                }
            }
        } catch (error) {
            this.log('❌ Cookie fallback error:', error);
        }
        
        this.log(`❌ Cookie '${name}' not found in any method`);
        return null;
    }

    /**
     * WAIT FOR COOKIES TO BECOME AVAILABLE AFTER AUTHENTICATION
     */
    async waitForCookieAvailability(timeout = 3000) {
        const startTime = Date.now();
        const checkInterval = 100; // Check every 100ms
        
        return new Promise((resolve) => {
            const checkCookies = () => {
                const tokenInfo = this.getTokenInfo();
                
                if (tokenInfo.hasTokens) {
                    this.log('🎉 Tokens now available after auth check');
                    resolve(true);
                    return;
                }
                
                const elapsed = Date.now() - startTime;
                if (elapsed >= timeout) {
                    this.log('⏰ Cookie availability timeout - tokens still not accessible');
                    resolve(false);
                    return;
                }
                
                // Continue checking
                setTimeout(checkCookies, checkInterval);
            };
            
            // Start checking immediately
            checkCookies();
        });
    }

    /**
     * Cleanup resources
     */
    destroy() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        this.failedQueue = [];
        this.pendingRequests.clear();
        this.authCheckCache = { result: null, timestamp: null, ttl: 5000 };
        this.log('🧹 Token Manager destroyed');
    }
}

// Create global instance
const tokenManager = new TokenManager();

// Global API
window.tokenManager = tokenManager;

// IMMEDIATE TOKEN MANAGER READY EVENT
if (typeof window !== 'undefined') {
            // TokenManager ready - dispatching event
    window.dispatchEvent(new CustomEvent('tokenManagerReady', { detail: tokenManager }));
}

// Debug helpers
window.tokenDebug = {
    enable: () => tokenManager.enableDebug(),
    disable: () => tokenManager.disableDebug(),
    status: () => tokenManager.getStatus(),
    refresh: () => tokenManager.forceRefresh(),
    info: () => tokenManager.getTokenInfo()
};

// Auto-enable debug in development
if (window.location.hostname === 'localhost' || window.location.hostname.includes('dev')) {
    tokenManager.enableDebug();
}

// For non-module scripts compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = tokenManager;
} 