/**
 * Dashboard Security Middleware
 * Enhanced route protection for multi-dashboard system
 * Ensures users can only access their authorized dashboards
 */

const TokenService = require('../services/TokenService');
const MultiDashboardAuthService = require('../services/MultiDashboardAuthService');

class DashboardSecurityMiddleware {
    constructor() {
        this.logger = console;
        
        // Dashboard access rules
        this.accessRules = {
            '/admin': {
                allowedUserTypes: ['admin'],
                allowedRoles: ['super_admin', 'admin', 'moderator'],
                requiredPermissions: []
            },
            '/manufacturer': {
                allowedUserTypes: ['user'],
                allowedRoles: ['company_admin'],
                requiredCompanyTypes: ['manufacturer'],
                requiredPermissions: []
            },
            '/distributor': {
                allowedUserTypes: ['user'],
                allowedRoles: ['company_admin'],
                requiredCompanyTypes: ['distributor'],
                requiredPermissions: []
            }
        };
    }

    /**
     * Enhanced dashboard access control
     * Validates user permissions for specific dashboard access
     */
    validateDashboardAccess = (dashboardType) => {
        return async (req, res, next) => {
            try {
            
                // Extract and verify token
                const tokens = TokenService.extractTokensFromRequest(req);
                
                if (!tokens.accessToken) {
                    return this.handleUnauthorized(req, res, 'Authentication required');
                }

                const verification = TokenService.verifyAccessToken(tokens.accessToken);
                
                if (!verification.valid) {
                    return this.handleUnauthorized(req, res, 'Invalid or expired authentication');
                }

                const { payload } = verification;

                // Get access rules for this dashboard
                const rules = this.accessRules[`/${dashboardType}`];
                if (!rules) {
                    return this.handleForbidden(req, res, 'Unknown dashboard type');
                }

                // Validate user type
                if (!rules.allowedUserTypes.includes(payload.userType)) {
                    return this.handleForbidden(req, res, 'Insufficient user type privileges');
                }

                // Validate role
                if (!rules.allowedRoles.includes(payload.role)) {
                    return this.handleForbidden(req, res, 'Insufficient role privileges');
                }

                // Validate company type (for company admins)
                if (rules.requiredCompanyTypes && 
                    !rules.requiredCompanyTypes.includes(payload.companyType)) {
                    return this.handleForbidden(req, res, 'Unauthorized company type');
                }

                // Validate specific permissions (if required)
                if (rules.requiredPermissions.length > 0) {
                    const userPermissions = payload.permissions || [];
                    const hasRequiredPermissions = rules.requiredPermissions.every(
                        permission => userPermissions.includes(permission)
                    );
                    
                    if (!hasRequiredPermissions) {
                        return this.handleForbidden(req, res, 'Insufficient permissions');
                    }
                }

                // Attach user info to request
                req.user = {
                    userId: payload.userId,
                    userType: payload.userType,
                    role: payload.role,
                    companyType: payload.companyType,
                    email: payload.email,
                    name: payload.name,
                    permissions: payload.permissions || [],
                    sessionId: payload.sessionId
                };

                // Validate user still exists and is active
                const userData = await MultiDashboardAuthService.getUserById(
                    payload.userId, 
                    payload.userType
                );

                if (!userData) {
                    return this.handleUnauthorized(req, res, 'User account no longer exists or is inactive');
                }

                next();

            } catch (error) {
                this.logger.error('❌ Dashboard security error:', error);
                return this.handleServerError(req, res, 'Security validation failed');
            }
        };
    };

    /**
     * Cross-dashboard access prevention
     * Ensures users don't access dashboards they shouldn't
     */
    preventCrossDashboardAccess = async (req, res, next) => {
        try {
            if (!req.user) {
                return next(); // Let other middleware handle auth
            }

            const requestPath = req.path;
            const userDashboardRoute = MultiDashboardAuthService.getDashboardRoute(req.user);
            
            // Check if user is trying to access wrong dashboard
            const dashboardPrefixes = ['/admin', '/manufacturer', '/distributor'];
            const currentDashboardPrefix = dashboardPrefixes.find(prefix => 
                requestPath.startsWith(prefix)
            );

            if (currentDashboardPrefix && !userDashboardRoute.startsWith(currentDashboardPrefix)) {
                this.logger.warn(`⚠️ Cross-dashboard access attempt: User ${req.user.userId} tried to access ${requestPath} but should use ${userDashboardRoute}`);
                
                // Redirect to correct dashboard
                const isAjax = this.isAjaxRequest(req);
                
                if (isAjax) {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied. Redirecting to your dashboard.',
                        redirectUrl: userDashboardRoute,
                        code: 'WRONG_DASHBOARD'
                    });
                } else {
                    return res.redirect(userDashboardRoute);
                }
            }

            next();

        } catch (error) {
            this.logger.error('❌ Cross-dashboard prevention error:', error);
            next(); // Continue with request
        }
    };

    /**
     * API endpoint protection
     * Validates API access based on dashboard context
     */
    validateApiAccess = (requiredDashboard) => {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Authentication required for API access',
                        code: 'AUTH_REQUIRED'
                    });
                }

                // Check if user has access to the required dashboard
                const userDashboardRoute = MultiDashboardAuthService.getDashboardRoute(req.user);
                const expectedRoute = `/${requiredDashboard}/dashboard`;

                if (!userDashboardRoute.startsWith(`/${requiredDashboard}`)) {
                    return res.status(403).json({
                        success: false,
                        message: `API access denied. This endpoint requires ${requiredDashboard} dashboard access.`,
                        code: 'API_ACCESS_DENIED',
                        userDashboard: userDashboardRoute.split('/')[1]
                    });
                }

                next();

            } catch (error) {
                this.logger.error('❌ API access validation error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'API security validation failed',
                    code: 'SECURITY_ERROR'
                });
            }
        };
    };

    /**
     * Session validation
     * Ensures session data matches token data
     */
    validateSession = async (req, res, next) => {
        try {
            if (req.user && req.session) {
                // Check if session matches token
                if (req.session.userId !== req.user.userId ||
                    req.session.userType !== req.user.userType) {
                    
                    this.logger.warn('⚠️ Session-token mismatch detected');
                    
                    // Clear invalid session
                    req.session.destroy();
                    
                    return this.handleUnauthorized(req, res, 'Session validation failed');
                }
            }

            next();

        } catch (error) {
            this.logger.error('❌ Session validation error:', error);
            next(); // Continue with request
        }
    };

    /**
     * Handle unauthorized access
     */
    handleUnauthorized(req, res, message = 'Authentication required') {
        const isAjax = this.isAjaxRequest(req);
        
        if (isAjax) {
            return res.status(401).json({
                success: false,
                message,
                code: 'UNAUTHORIZED',
                redirectUrl: '/auth/login'
            });
        } else {
            return res.redirect(`/auth/login?error=auth_required&message=${encodeURIComponent(message)}`);
        }
    }

    /**
     * Handle forbidden access
     */
    handleForbidden(req, res, message = 'Access denied') {
        const isAjax = this.isAjaxRequest(req);
        
        if (isAjax) {
            return res.status(403).json({
                success: false,
                message,
                code: 'FORBIDDEN'
            });
        } else {
            // Redirect to appropriate dashboard
            const redirectUrl = req.user ? 
                MultiDashboardAuthService.getDashboardRoute(req.user) : 
                '/auth/login';
            
            return res.redirect(`${redirectUrl}?error=access_denied&message=${encodeURIComponent(message)}`);
        }
    }

    /**
     * Handle server errors
     */
    handleServerError(req, res, message = 'Internal server error') {
        const isAjax = this.isAjaxRequest(req);
        
        if (isAjax) {
            return res.status(500).json({
                success: false,
                message,
                code: 'SERVER_ERROR'
            });
        } else {
            return res.redirect(`/auth/login?error=server_error&message=${encodeURIComponent(message)}`);
        }
    }

    /**
     * Check if request is AJAX
     */
    isAjaxRequest(req) {
        return req.get('Content-Type') === 'application/json' ||
               req.get('X-Requested-With') === 'XMLHttpRequest' ||
               req.path.startsWith('/api/');
    }

    /**
     * Security headers middleware
     */
    setSecurityHeaders = (req, res, next) => {
        // Dashboard-specific security headers
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('X-Dashboard-Version', '2.0');
        
        // Dashboard access timestamp
        res.setHeader('X-Access-Time', new Date().toISOString());
        
        if (process.env.NODE_ENV === 'production') {
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        next();
    };

    /**
     * Request logging for security monitoring
     */
    logSecurityEvent = (eventType, details = {}) => {
        this.logger.log(`🔐 Security Event: ${eventType}`, {
            timestamp: new Date().toISOString(),
            ...details
        });
    };
}

// Create singleton instance
const dashboardSecurity = new DashboardSecurityMiddleware();

module.exports = {
    // Dashboard-specific access controls
    adminOnly: dashboardSecurity.validateDashboardAccess('admin'),
    manufacturerOnly: dashboardSecurity.validateDashboardAccess('manufacturer'),
    distributorOnly: dashboardSecurity.validateDashboardAccess('distributor'),
    
    // Cross-dashboard protection
    preventCrossDashboardAccess: dashboardSecurity.preventCrossDashboardAccess,
    
    // API access controls
    validateAdminApiAccess: dashboardSecurity.validateApiAccess('admin'),
    validateManufacturerApiAccess: dashboardSecurity.validateApiAccess('manufacturer'),
    validateDistributorApiAccess: dashboardSecurity.validateApiAccess('distributor'),
    
    // Session and security
    validateSession: dashboardSecurity.validateSession,
    setSecurityHeaders: dashboardSecurity.setSecurityHeaders,
    
    // Utility methods
    logSecurityEvent: dashboardSecurity.logSecurityEvent
};