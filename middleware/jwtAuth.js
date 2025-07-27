/**
 * SLEX JWT Authentication Middleware
 * Professional JWT-based authentication and authorization
 * Role-based access control with automatic token refresh
 */

const TokenService = require('../services/TokenService');
const User = require('../models/User');
const Admin = require('../models/Admin');
const rateLimit = require('express-rate-limit');

class JWTAuthMiddleware {
    constructor() {
        this.models = { User, Admin };
        this.initializeRateLimiters();
    }

    /**
     * Initialize rate limiters for different operations
     */
    initializeRateLimiters() {
        // General authentication rate limiter
        this.authRateLimit = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // Limit each IP to 100 requests per windowMs
            message: {
                success: false,
                message: 'Too many authentication requests. Please try again later.',
                code: 'RATE_LIMIT_EXCEEDED'
            },
            standardHeaders: true,
            legacyHeaders: false,
            skip: (req) => {
                // Skip rate limiting for static assets
                return req.path.includes('/assets/') || req.path.includes('/public/');
            }
        });

        // Strict rate limiter for login attempts
        this.loginRateLimit = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // Limit each IP to 5 login attempts per windowMs
            message: {
                success: false,
                message: 'Too many login attempts. Please try again after 15 minutes.',
                code: 'LOGIN_RATE_LIMIT_EXCEEDED'
            },
            skipSuccessfulRequests: true
        });

        // Token refresh rate limiter
        this.refreshRateLimit = rateLimit({
            windowMs: 5 * 60 * 1000, // 5 minutes
            max: 10, // Limit each IP to 10 refresh requests per 5 minutes
            message: {
                success: false,
                message: 'Too many token refresh requests. Please try again later.',
                code: 'REFRESH_RATE_LIMIT_EXCEEDED'
            }
        });
    }

    /**
     * Main authentication middleware with enhanced error handling
     */
    authenticate = async (req, res, next) => {
        try {
            // Extract tokens from request
            const tokens = TokenService.extractTokensFromRequest(req);
            
            // No tokens available - redirect to login
            if (!tokens.accessToken && !tokens.refreshToken) {
                console.log(`🔒 No tokens found for ${req.method} ${req.path}`);
                return this.handleUnauthenticated(req, res);
            }

            // Try to verify access token first
            let accessTokenResult = null;
            if (tokens.accessToken) {
                try {
                    accessTokenResult = TokenService.verifyAccessToken(tokens.accessToken);
                } catch (tokenError) {
                    console.log(`🔒 Access token verification failed: ${tokenError.message}`);
                    accessTokenResult = { valid: false, expired: true };
                }
            }
            
            if (accessTokenResult && accessTokenResult.valid) {
                // Access token is valid, set user data and continue
                req.user = accessTokenResult.payload;
                req.sessionId = tokens.sessionId;
                
                // Update last activity for security monitoring
                if (req.user && req.user.userId) {
                    req.user.lastActivity = new Date();
                }
                
                return next();
            }

            // Access token is invalid/expired, try refresh token
            if (tokens.refreshToken && (!accessTokenResult || accessTokenResult.expired)) {
                console.log(`🔄 Attempting token refresh for user session`);
                
                try {
                    const refreshResult = await this.refreshTokens(req, res, tokens.refreshToken);
                    
                    if (refreshResult.success) {
                        req.user = refreshResult.user;
                        req.sessionId = refreshResult.sessionId;
                        
                        console.log(`✅ Token refresh successful for user: ${req.user.userId}`);
                        return next();
                    } else {
                        console.log(`❌ Token refresh failed: ${refreshResult.error}`);
                    }
                } catch (refreshError) {
                    console.error(`❌ Token refresh error: ${refreshError.message}`);
                }
            }

            // Both tokens are invalid, clear cookies and redirect to login
            console.log(`🔒 Authentication failed - redirecting to login`);
            return this.handleUnauthenticated(req, res);

        } catch (error) {
            console.error(`❌ Authentication middleware error for ${req.method} ${req.path}:`, error);
            
            // Ensure cookies are cleared on any error
            try {
                TokenService.clearAuthCookies(res);
            } catch (clearError) {
                console.error('Error clearing cookies:', clearError);
            }
            
            return this.handleUnauthenticated(req, res);
        }
    };

    /**
     * Optional authentication middleware (for public routes with optional user context)
     */
    optionalAuth = async (req, res, next) => {
        try {
            const tokens = TokenService.extractTokensFromRequest(req);
            
            if (tokens.accessToken) {
                const accessTokenResult = TokenService.verifyAccessToken(tokens.accessToken);
                
                if (accessTokenResult.valid) {
                    req.user = accessTokenResult.payload;
                    req.sessionId = tokens.sessionId;
                } else if (accessTokenResult.expired && tokens.refreshToken) {
                    const refreshResult = await this.refreshTokens(req, res, tokens.refreshToken);
                    if (refreshResult.success) {
                        req.user = refreshResult.user;
                        req.sessionId = refreshResult.sessionId;
                    }
                }
            }
            
            next();
        } catch (error) {
            console.error('Optional authentication error:', error);
            next(); // Continue without authentication
        }
    };

    /**
     * Role-based authorization middleware
     */
    authorize = (allowedRoles = []) => {
        return (req, res, next) => {
            try {
                if (!req.user) {
                    return this.handleUnauthorized(req, res, 'Authentication required');
                }

                // Check if user has required role
                if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
                    return this.handleForbidden(req, res, 'Insufficient permissions');
                }

                // Check user type specific permissions
                if (req.user.userType === 'admin') {
                    return this.authorizeAdmin(req, res, next, allowedRoles);
                } else if (req.user.userType === 'user') {
                    return this.authorizeUser(req, res, next, allowedRoles);
                }

                return this.handleForbidden(req, res, 'Invalid user type');
            } catch (error) {
                console.error('Authorization error:', error);
                return this.handleUnauthorized(req, res, 'Authorization failed');
            }
        };
    };

    /**
     * Admin-specific authorization
     */
    authorizeAdmin = (req, res, next, allowedRoles) => {
        const adminRoles = ['super_admin', 'admin', 'moderator'];
        
        if (!adminRoles.includes(req.user.role)) {
            return this.handleForbidden(req, res, 'Admin role required');
        }

        // Super admin has access to everything
        if (req.user.role === 'super_admin') {
            return next();
        }

        // Check specific admin permissions
        if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
            return this.handleForbidden(req, res, 'Insufficient admin permissions');
        }

        next();
    };

    /**
     * User-specific authorization
     */
    authorizeUser = (req, res, next, allowedRoles) => {
        // Check if user account is active
        if (req.user.accountStatus && req.user.accountStatus !== 'active') {
            return this.handleForbidden(req, res, 'Account is not active');
        }

        // For company admin users, check if they're accessing their own data
        if (req.params.userId && req.params.userId !== req.user.userId) {
            return this.handleForbidden(req, res, 'Access denied to other user data');
        }

        next();
    };

    /**
     * Permission-based authorization
     */
    requirePermission = (permission) => {
        return (req, res, next) => {
            try {
                if (!req.user) {
                    return this.handleUnauthorized(req, res, 'Authentication required');
                }

                const userPermissions = req.user.permissions || [];
                
                if (!userPermissions.includes(permission)) {
                    return this.handleForbidden(req, res, `Permission '${permission}' required`);
                }

                next();
            } catch (error) {
                console.error('Permission check error:', error);
                return this.handleUnauthorized(req, res, 'Permission check failed');
            }
        };
    };

    /**
     * Admin-only middleware
     */
    adminOnly = this.authorize(['super_admin', 'admin', 'moderator']);

    /**
     * Super admin only middleware
     */
    superAdminOnly = this.authorize(['super_admin']);

    /**
     * Company admin only middleware
     */
    companyAdminOnly = (req, res, next) => {
        if (!req.user || req.user.userType !== 'user') {
            return this.handleForbidden(req, res, 'Company admin access required');
        }
        next();
    };

    /**
     * Refresh tokens and update cookies with enhanced error handling
     */
    async refreshTokens(req, res, refreshToken) {
        try {
            if (!refreshToken) {
                throw new Error('Refresh token is required');
            }

            // Apply rate limiting for refresh attempts
            try {
                await new Promise((resolve, reject) => {
                    this.refreshRateLimit(req, res, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            } catch (rateLimitError) {
                return { 
                    success: false, 
                    error: 'Too many refresh attempts. Please try again later.',
                    rateLimited: true 
                };
            }

            console.log(`🔄 Processing token refresh request`);
            
            const refreshResult = await TokenService.refreshAccessToken(refreshToken, this.models);
            
            if (refreshResult.success) {
                // Set new cookies with enhanced security
                TokenService.setAuthCookies(res, refreshResult.tokens);
                
                // Prepare user object with proper structure
                const userPayload = {
                    userId: refreshResult.user._id.toString(),
                    userType: refreshResult.user.role ? 'admin' : 'user',
                    role: refreshResult.user.role || 'company_admin',
                    email: refreshResult.user.email,
                    name: refreshResult.user.name || refreshResult.user.fullName,
                    permissions: refreshResult.user.permissions || [],
                    accountStatus: refreshResult.user.accountStatus || 'active',
                    lastActivity: new Date()
                };

                console.log(`✅ Token refresh successful for user: ${userPayload.userId} (${userPayload.userType})`);
                
                return {
                    success: true,
                    user: userPayload,
                    sessionId: refreshResult.tokens.sessionId,
                    refreshedAt: new Date()
                };
            }
            
            console.log(`❌ Token refresh failed: ${refreshResult.error}`);
            return { 
                success: false, 
                error: refreshResult.error || 'Token refresh failed',
                clearCookies: true 
            };
            
        } catch (error) {
            console.error('❌ Token refresh method error:', error);
            
            // Ensure invalid cookies are cleared
            try {
                TokenService.clearAuthCookies(res);
            } catch (clearError) {
                console.error('Error clearing cookies during refresh error:', clearError);
            }
            
            return { 
                success: false, 
                error: 'Token refresh failed due to server error',
                clearCookies: true 
            };
        }
    }

    /**
     * Handle unauthenticated requests
     */
    handleUnauthenticated(req, res) {
        // Clear any invalid cookies
        TokenService.clearAuthCookies(res);
        
        // Check if it's an API request
        if (req.xhr || req.headers.accept?.includes('json') || req.path.startsWith('/api/')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                code: 'UNAUTHENTICATED',
                redirectTo: '/auth/login'
            });
        }
        
        // Store the intended URL for redirect after login
        if (req.method === 'GET' && !req.path.startsWith('/auth/')) {
            req.session.returnTo = req.originalUrl;
        }
        
        // Redirect to login page
        return res.redirect('/auth/login');
    }

    /**
     * Handle unauthorized requests (authenticated but no permission)
     */
    handleUnauthorized(req, res, message = 'Unauthorized') {
        if (req.xhr || req.headers.accept?.includes('json') || req.path.startsWith('/api/')) {
            return res.status(401).json({
                success: false,
                message,
                code: 'UNAUTHORIZED'
            });
        }
        
        return res.redirect('/auth/login');
    }

    /**
     * Handle forbidden requests (authenticated but insufficient permissions)
     */
    handleForbidden(req, res, message = 'Access denied') {
        if (req.xhr || req.headers.accept?.includes('json') || req.path.startsWith('/api/')) {
            return res.status(403).json({
                success: false,
                message,
                code: 'FORBIDDEN'
            });
        }
        
        // Redirect to appropriate dashboard based on user type
        const redirectPath = req.user?.userType === 'admin' ? '/admin/dashboard' : '/dashboard';
        return res.redirect(redirectPath);
    }

    /**
     * Logout middleware
     */
    logout = async (req, res) => {
        try {
            const tokens = TokenService.extractTokensFromRequest(req);
            
            // Blacklist current tokens
            if (tokens.accessToken) {
                TokenService.blacklistToken(tokens.accessToken);
            }
            if (tokens.refreshToken) {
                TokenService.blacklistToken(tokens.refreshToken);
            }
            
            // Clear cookies
            TokenService.clearAuthCookies(res);
            
            // Clear session data
            if (req.session) {
                req.session.destroy();
            }
            
            if (req.xhr || req.headers.accept?.includes('json') || req.path.startsWith('/api/')) {
                return res.json({
                    success: true,
                    message: 'Logged out successfully'
                });
            }
            
            return res.redirect('/auth/login?message=logged_out');
        } catch (error) {
            console.error('Logout error:', error);
            
            if (req.xhr || req.headers.accept?.includes('json')) {
                return res.status(500).json({
                    success: false,
                    message: 'Logout failed'
                });
            }
            
            return res.redirect('/auth/login');
        }
    };

    /**
     * Middleware to check if user is already logged in
     */
    redirectIfAuthenticated = async (req, res, next) => {
        try {
            const tokens = TokenService.extractTokensFromRequest(req);
            
            if (tokens.accessToken) {
                const accessTokenResult = TokenService.verifyAccessToken(tokens.accessToken);
                
                if (accessTokenResult.valid) {
                    const userType = accessTokenResult.payload.userType;
                    const redirectPath = userType === 'admin' ? '/admin/dashboard' : '/dashboard';
                    return res.redirect(redirectPath);
                }
            }
            
            next();
        } catch (error) {
            console.error('Redirect check error:', error);
            next();
        }
    };

    /**
     * Security headers middleware
     */
    securityHeaders = (req, res, next) => {
        // Set security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        if (process.env.NODE_ENV === 'production') {
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }
        
        next();
    };
}

// Create and export instance
const jwtAuth = new JWTAuthMiddleware();

module.exports = {
    authenticate: jwtAuth.authenticate,
    optionalAuth: jwtAuth.optionalAuth,
    authorize: jwtAuth.authorize,
    requirePermission: jwtAuth.requirePermission,
    adminOnly: jwtAuth.adminOnly,
    superAdminOnly: jwtAuth.superAdminOnly,
    companyAdminOnly: jwtAuth.companyAdminOnly,
    logout: jwtAuth.logout,
    redirectIfAuthenticated: jwtAuth.redirectIfAuthenticated,
    securityHeaders: jwtAuth.securityHeaders,
    authRateLimit: jwtAuth.authRateLimit,
    loginRateLimit: jwtAuth.loginRateLimit,
    refreshRateLimit: jwtAuth.refreshRateLimit
};