/**
 * Multi-Dashboard Authentication Controller
 * Professional controller for handling role-based authentication
 * Routes users to appropriate dashboards based on their roles
 * Senior Software Engineer level implementation
 */

const MultiDashboardAuthService = require('../services/MultiDashboardAuthService');
const TokenService = require('../services/TokenService');
const crypto = require('crypto');

class MultiDashboardAuthController {
    constructor() {
        this.logger = console;
        this.loginAttempts = new Map();
        this.rateLimitWindow = 15 * 60 * 1000; // 15 minutes
        this.maxAttemptsPerIP = 10;
        
        // Dashboard redirect configurations
        this.redirectConfigs = {
            success: {
                'super_admin': '/admin/dashboard',
                'admin': '/admin/dashboard',
                'moderator': '/admin/dashboard',
                'manufacturer': '/manufacturer/dashboard',
                'distributor': '/buyer/profile'  // Redirect to buyer profile instead of dashboard
            },
            failure: {
                default: '/login?error=1',
                blocked: '/login?error=blocked',
                locked: '/login?error=locked',
                pending: '/login?error=pending',
                suspended: '/login?error=suspended'
            }
        };
    }

    /**
     * Show enhanced login page with role-based messaging
     */
    showLogin = async (req, res) => {
        try {
            // Extract query parameters for user feedback
            const { error, message, type } = req.query;
            
            // Generate CSRF token for security
            const csrfToken = this.generateCSRFToken();
            req.session.csrfToken = csrfToken;

            // Prepare error messages based on query parameters
            let errorMessage = null;
            let errorType = null;

            if (error) {
                const errorMessages = {
                    '1': 'Invalid email or password. Please try again.',
                    'blocked': 'Your account has been blocked. Please contact support.',
                    'locked': 'Account temporarily locked due to multiple failed attempts.',
                    'pending': 'Your account is pending approval. Please wait for admin approval.',
                    'suspended': 'Your account has been suspended. Please contact support.',
                    'rate_limited': 'Too many login attempts. Please try again later.',
                    'session_expired': 'Your session has expired. Please login again.',
                    'access_denied': 'Access denied. Please login with appropriate credentials.'
                };
                
                errorMessage = errorMessages[error] || 'Login failed. Please try again.';
                errorType = error;
            }

            if (message) {
                const successMessages = {
                    'logout': 'You have been successfully logged out.',
                    'registered': 'Registration successful. Please wait for account approval.',
                    'password_reset': 'Password reset successful. Please login with your new password.'
                };
                
                if (successMessages[message]) {
                    errorMessage = successMessages[message];
                    errorType = 'success';
                }
            }

            // Determine login type for UI customization
            const loginType = type || 'general';
            const loginConfigs = {
                'admin': {
                    title: 'Admin Login',
                    subtitle: 'Access administrative dashboard',
                    primaryColor: '#7c3aed'
                },
                'manufacturer': {
                    title: 'Manufacturer Login',
                    subtitle: 'Access your manufacturing dashboard',
                    primaryColor: '#7c3aed'
                },
                'distributor': {
                    title: 'Distributor Login',
                    subtitle: 'Access your distribution dashboard',
                    primaryColor: '#06b6d4'
                },
                'general': {
                    title: 'Login to SLEX',
                    subtitle: 'Access your business dashboard',
                    primaryColor: '#7c3aed'
                }
            };

            const config = loginConfigs[loginType] || loginConfigs.general;

            // Render login page with enhanced data
            res.render('pages/login', {
                title: config.title,
                subtitle: config.subtitle,
                csrfToken,
                errorMessage,
                errorType,
                loginType,
                config,
                currentUrl: req.originalUrl,
                userAgent: req.get('User-Agent'),
                layout: false // Use login-specific layout
            });

        } catch (error) {
            this.logger.error('❌ Show login error:', error);
            res.status(500).render('pages/error', {
                title: 'Login Error',
                message: 'Unable to load login page. Please try again.',
                error: process.env.NODE_ENV === 'development' ? error : {},
                user: req.user,
                admin: req.user,
                lng: req.query.lng || 'uz',
                currentLang: req.query.lng || 'uz'
            });
        }
    }

    /**
     * Enhanced login handler with multi-dashboard routing
     */
    login = async (req, res) => {
        const startTime = Date.now();
        
        try {
            const { email, identifier, password, rememberMe, csrfToken } = req.body;
            const clientIP = this.getClientIP(req);
            const userAgent = req.get('User-Agent');
            
            // Use email or identifier for backward compatibility
            const loginEmail = (email || identifier || '').toLowerCase().trim();
            
            this.logger.log(`🔐 Multi-dashboard login attempt: ${loginEmail} from ${clientIP}`);

            // Enhanced input validation
            const validation = this.validateLoginInput({
                email: loginEmail,
                password,
                csrfToken,
                session: req.session
            });

            if (!validation.valid) {
                return this.handleLoginError(req, res, validation.message, 'VALIDATION_ERROR');
            }

            // Rate limiting check
            if (this.isRateLimited(clientIP)) {
                return this.handleLoginError(req, res, 
                    'Too many login attempts from this location. Please try again later.', 
                    'RATE_LIMITED');
            }

            // Authenticate using MultiDashboardAuthService
            const authResult = await MultiDashboardAuthService.authenticate(
                loginEmail, 
                password, 
                clientIP
            );

            // Debug logging
            this.logger.log(`🔍 Auth Result Debug:`, {
                success: authResult.success,
                userType: authResult.userType,
                role: authResult.user?.role,
                companyType: authResult.user?.companyType,
                dashboardRoute: authResult.dashboardRoute,
                message: authResult.message
            });

            // Handle authentication failure
            if (!authResult.success) {
                this.recordFailedAttempt(clientIP, loginEmail);
                return this.handleLoginError(req, res, authResult.message, authResult.code);
            }

            // Clear failed attempts on success
            this.clearFailedAttempts(clientIP);

            // Set authentication cookies
            TokenService.setAuthCookies(res, authResult.tokens);

            // Set legacy session for backward compatibility
            this.setUserSession(req, authResult);

            // Set remember me cookie if requested
            if (rememberMe === 'on' || rememberMe === true) {
                this.setRememberMeCookie(res, authResult.user._id, authResult.userType);
            }

            // Log successful authentication
            const loginDuration = Date.now() - startTime;
            this.logger.log(`✅ Multi-dashboard login successful: ${loginEmail} -> ${authResult.dashboardRoute} (${loginDuration}ms)`);

            // Determine response based on request type
            const isAjax = this.isAjaxRequest(req);
            
            if (isAjax) {
                // JSON response for AJAX requests
                return res.json({
                    success: true,
                    message: 'Login successful',
                    redirectUrl: authResult.dashboardRoute,
                    userType: authResult.userType,
                    role: authResult.role,
                    companyType: authResult.companyType,
                    dashboardConfig: MultiDashboardAuthService.getDashboardConfig(
                        authResult.user, 
                        authResult.userType
                    ),
                    timestamp: new Date().toISOString()
                });
            } else {
                // Redirect for form submissions
                return res.redirect(authResult.dashboardRoute);
            }

        } catch (error) {
            this.logger.error('❌ Multi-dashboard login error:', error);
            
            const isAjax = this.isAjaxRequest(req);
            
            if (isAjax) {
                return res.status(500).json({
                    success: false,
                    message: 'Authentication service temporarily unavailable',
                    code: 'SERVICE_ERROR',
                    timestamp: new Date().toISOString()
                });
            } else {
                return res.redirect('/login?error=service_error');
            }
        }
    }

    /**
     * Enhanced logout with proper cleanup
     */
    logout = async (req, res) => {
        try {
            const clientIP = this.getClientIP(req);
            const userId = req.user?.userId;
            const userType = req.user?.userType;

            this.logger.log(`🔓 Logout request: ${userId} (${userType}) from ${clientIP}`);

            // Extract tokens from request
            const tokens = TokenService.extractTokensFromRequest(req);

            // Blacklist current tokens
            if (tokens.accessToken) {
                TokenService.blacklistToken(tokens.accessToken);
            }
            if (tokens.refreshToken) {
                TokenService.blacklistToken(tokens.refreshToken);
            }

            // Clear authentication cookies
            TokenService.clearAuthCookies(res);

            // Clear session data
            if (req.session) {
                req.session.destroy((err) => {
                    if (err) {
                        this.logger.error('❌ Session destroy error:', err);
                    }
                });
            }

            // Clear remember me cookie
            res.clearCookie('rememberMe');

            this.logger.log(`✅ Logout successful: ${userId}`);

            // Determine response based on request type
            const isAjax = this.isAjaxRequest(req);

            if (isAjax) {
                return res.json({
                    success: true,
                    message: 'Logged out successfully',
                    redirectUrl: '/login?message=logout'
                });
            } else {
                return res.redirect('/login?message=logout');
            }

        } catch (error) {
            this.logger.error('❌ Logout error:', error);
            
            const isAjax = this.isAjaxRequest(req);
            
            if (isAjax) {
                return res.status(500).json({
                    success: false,
                    message: 'Logout failed'
                });
            } else {
                return res.redirect('/login?error=logout_failed');
            }
        }
    }

    /**
     * Check authentication status and redirect appropriately
     */
    checkAuth = async (req, res) => {
        try {
            const tokens = TokenService.extractTokensFromRequest(req);
            
            if (!tokens.accessToken) {
                return res.json({ authenticated: false });
            }

            const verification = TokenService.verifyAccessToken(tokens.accessToken);
            
            if (!verification.valid) {
                return res.json({ authenticated: false });
            }

            const dashboardRoute = MultiDashboardAuthService.getDashboardRoute({
                role: verification.payload.role,
                companyType: verification.payload.companyType
            });

            return res.json({
                authenticated: true,
                user: {
                    userId: verification.payload.userId,
                    userType: verification.payload.userType,
                    role: verification.payload.role,
                    companyType: verification.payload.companyType,
                    name: verification.payload.name,
                    email: verification.payload.email
                },
                dashboardRoute,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error('❌ Check auth error:', error);
            return res.json({ authenticated: false });
        }
    }

    /**
     * Handle login errors with appropriate response
     */
    handleLoginError = (req, res, message, code) => {
        const isAjax = this.isAjaxRequest(req);
        
        this.logger.warn(`⚠️ Login error: ${message} (${code})`);

        if (isAjax) {
            const statusCode = this.getStatusCodeForError(code);
            return res.status(statusCode).json({
                success: false,
                message,
                code,
                timestamp: new Date().toISOString()
            });
        } else {
            const errorParam = this.getErrorParamForCode(code);
            return res.redirect(`/login?error=${errorParam}`);
        }
    }

    /**
     * Validate login input parameters
     */
    validateLoginInput = ({ email, password, csrfToken, session }) => {
        if (!email || !password) {
            return {
                valid: false,
                message: 'Email and password are required'
            };
        }

        if (!this.isValidEmail(email)) {
            return {
                valid: false,
                message: 'Please enter a valid email address'
            };
        }

        if (password.length < 6) {
            return {
                valid: false,
                message: 'Password must be at least 6 characters long'
            };
        }

        // CSRF validation (temporarily relaxed for development)
        if (process.env.NODE_ENV === 'production' && csrfToken && session?.csrfToken) {
            if (csrfToken !== session.csrfToken) {
                return {
                    valid: false,
                    message: 'Invalid security token. Please refresh the page.'
                };
            }
        }

        return { valid: true };
    }

    /**
     * Set user session data
     */
    setUserSession = (req, authResult) => {
        req.session.userId = authResult.user._id;
        req.session.userType = authResult.userType;
        req.session.role = authResult.role;
        req.session.email = authResult.user.email;
        req.session.name = authResult.user.name || authResult.user.companyName;
        req.session.companyType = authResult.companyType;
        req.session.loginTime = new Date();
        req.session.dashboardRoute = authResult.dashboardRoute;
    }

    /**
     * Set remember me cookie
     */
    setRememberMeCookie = (res, userId, userType) => {
        const rememberToken = crypto.randomBytes(32).toString('hex');
        
        // Store remember token in database (implementation needed)
        // For now, just set a cookie with user info
        const cookieData = {
            userId,
            userType,
            token: rememberToken,
            created: Date.now()
        };

        res.cookie('rememberMe', JSON.stringify(cookieData), {
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
    }

    /**
     * Check if IP is rate limited
     */
    isRateLimited = (clientIP) => {
        const now = Date.now();
        const attempts = this.loginAttempts.get(clientIP) || [];
        
        const recentAttempts = attempts.filter(attempt => 
            now - attempt.timestamp < this.rateLimitWindow
        );

        return recentAttempts.length >= this.maxAttemptsPerIP;
    }

    /**
     * Record failed login attempt
     */
    recordFailedAttempt = (clientIP, email) => {
        const now = Date.now();
        const attempts = this.loginAttempts.get(clientIP) || [];
        
        attempts.push({ timestamp: now, email });
        this.loginAttempts.set(clientIP, attempts);
    }

    /**
     * Clear failed attempts for IP
     */
    clearFailedAttempts = (clientIP) => {
        this.loginAttempts.delete(clientIP);
    }

    /**
     * Generate CSRF token
     */
    generateCSRFToken = () => {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Get client IP address
     */
    getClientIP = (req) => {
        return req.ip || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress ||
               (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
               '127.0.0.1';
    }

    /**
     * Check if request is AJAX
     */
    isAjaxRequest = (req) => {
        return req.get('Content-Type') === 'application/json' ||
               req.get('X-Requested-With') === 'XMLHttpRequest' ||
               req.path.startsWith('/api/');
    }

    /**
     * Validate email format
     */
    isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Get HTTP status code for error type
     */
    getStatusCodeForError = (code) => {
        const statusCodes = {
            'VALIDATION_ERROR': 400,
            'INVALID_CREDENTIALS': 401,
            'ACCOUNT_INACTIVE': 403,
            'ACCOUNT_LOCKED': 423,
            'RATE_LIMITED': 429,
            'SERVICE_ERROR': 500
        };
        return statusCodes[code] || 400;
    }

    /**
     * Get error parameter for redirect
     */
    getErrorParamForCode = (code) => {
        const errorParams = {
            'VALIDATION_ERROR': '1',
            'INVALID_CREDENTIALS': '1',
            'ACCOUNT_INACTIVE': 'blocked',
            'ACCOUNT_LOCKED': 'locked',
            'ACCOUNT_PENDING': 'pending',
            'ACCOUNT_SUSPENDED': 'suspended',
            'RATE_LIMITED': 'rate_limited',
            'SERVICE_ERROR': 'service_error'
        };
        return errorParams[code] || '1';
    }
}

module.exports = new MultiDashboardAuthController();