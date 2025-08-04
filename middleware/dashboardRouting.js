/**
 * Professional Dashboard Routing Middleware
 * Senior Software Engineer level implementation
 * Handles secure routing and access control for all dashboard types
 */

const TokenService = require('../services/TokenService');
const MultiDashboardAuthService = require('../services/MultiDashboardAuthService');

class DashboardRoutingMiddleware {
    constructor() {
        this.logger = console;
        
        // Dashboard route mappings with fallback detection
        this.dashboardRoutes = {
            // Admin routes
            'super_admin': '/admin/dashboard',
            'admin': '/admin/dashboard', 
            'moderator': '/admin/dashboard',
            
            // Company routes
            'manufacturer': '/manufacturer/dashboard',
            'distributor': '/distributor/dashboard'
        };

        // Protected route patterns
        this.protectedRoutePatterns = [
            /^\/admin\/.*$/,
            /^\/manufacturer\/.*$/,
            /^\/distributor\/.*$/,
            /^\/dashboard$/
        ];

        // Route access matrix
        this.routeAccessMatrix = {
            '/admin': {
                allowedUserTypes: ['admin'],
                allowedRoles: ['super_admin', 'admin', 'moderator'],
                requiredPermissions: []
            },
            '/manufacturer': {
                allowedUserTypes: ['user', 'admin'], // Admin can access for testing
                allowedRoles: ['company_admin', 'super_admin', 'admin'],
                requiredCompanyTypes: ['manufacturer'],
                requiredPermissions: []
            },
            '/distributor': {
                allowedUserTypes: ['user', 'admin'], // Admin can access for testing
                allowedRoles: ['company_admin', 'super_admin', 'admin'],
                requiredCompanyTypes: ['distributor'],
                requiredPermissions: []
            }
        };
    }

    /**
     * Professional Authentication Guard
     * Ensures all protected routes require valid authentication
     */
    authenticationGuard = async (req, res, next) => {
        try {
            // Skip authentication for public routes
            if (!this.isProtectedRoute(req.path)) {
                return next();
            }

            this.logger.log(`🔒 Auth Guard: ${req.method} ${req.path} from ${req.ip}`);

            // Extract and verify token
            const tokens = TokenService.extractTokensFromRequest(req);
            
            if (!tokens.accessToken) {
                return this.redirectToLogin(req, res, 'Authentication required');
            }

            const verification = TokenService.verifyAccessToken(tokens.accessToken);
            
            if (!verification.valid) {
                this.logger.warn(`⚠️ Auth Guard: Invalid token for ${req.path}`);
                return this.redirectToLogin(req, res, 'Session expired. Please login again.');
            }

            // Attach user info to request with debug logging
            req.user = verification.payload;
            req.user.isAuthenticated = true;
            
            // Debug: Log the JWT payload to see what's missing
            this.logger.log(`🔍 JWT Payload Debug:`, {
                userId: req.user.userId,
                userType: req.user.userType,
                role: req.user.role,
                companyType: req.user.companyType,
                email: req.user.email,
                fullPayload: req.user
            });

            // Validate user still exists and is active
            const userData = await MultiDashboardAuthService.getUserById(
                req.user.userId, 
                req.user.userType
            );

            if (!userData) {
                this.logger.warn(`⚠️ Auth Guard: User ${req.user.userId} no longer exists or inactive`);
                TokenService.clearAuthCookies(res);
                return this.redirectToLogin(req, res, 'Account no longer active');
            }

            this.logger.log(`✅ Auth Guard: User ${req.user.userId} authenticated for ${req.path}`);
            next();

        } catch (error) {
            this.logger.error('❌ Auth Guard error:', error);
            return this.redirectToLogin(req, res, 'Authentication service error');
        }
    };

    /**
     * Dashboard Access Control
     * Ensures users only access their authorized dashboards
     */
    dashboardAccessControl = async (req, res, next) => {
        try {
            if (!req.user) {
                return this.redirectToLogin(req, res, 'Authentication required');
            }

            const requestedDashboard = this.extractDashboardType(req.path);
            
            // Skip dashboard access control for auth routes
            if (requestedDashboard === 'auth' || requestedDashboard === 'api') {
                return next();
            }
            
            if (!requestedDashboard) {
                return next(); // Not a dashboard route
            }

            this.logger.log(`🎛️ Dashboard Access: ${req.user.email} -> ${requestedDashboard}`);

            // Get access rules for this dashboard
            const accessRules = this.routeAccessMatrix[`/${requestedDashboard}`];
            
            if (!accessRules) {
                return this.handleForbidden(req, res, 'Unknown dashboard type');
            }

            // Validate access permissions
            const accessCheck = this.validateDashboardAccess(req.user, accessRules);
            
            if (!accessCheck.allowed) {
                this.logger.warn(`⚠️ Dashboard Access Denied: ${req.user.email} -> ${requestedDashboard} (${accessCheck.reason})`);
                
                // Redirect to user's correct dashboard
                const correctDashboard = this.determineUserDashboard(req.user);
                return this.redirectToDashboard(req, res, correctDashboard, accessCheck.reason);
            }

            this.logger.log(`✅ Dashboard Access Granted: ${req.user.email} -> ${requestedDashboard}`);
            next();

        } catch (error) {
            this.logger.error('❌ Dashboard Access Control error:', error);
            next(); // Continue with request on error
        }
    };

    /**
     * Smart Dashboard Router
     * Routes users to their appropriate dashboard based on authentication
     */
    smartDashboardRouter = async (req, res, next) => {
        try {
            const requestedDashboard = this.extractDashboardType(req.path);
            
            // Skip smart routing for auth routes
            if (requestedDashboard === 'auth' || requestedDashboard === 'api') {
                return next();
            }
            
            // Only route if accessing root dashboard or incorrect dashboard
            if (req.path !== '/dashboard' && !req.path.endsWith('/dashboard')) {
                return next();
            }

            if (!req.user) {
                return this.redirectToLogin(req, res, 'Please login to access dashboard');
            }

            const correctDashboard = this.determineUserDashboard(req.user);
            
            this.logger.log(`🧭 Smart Router: ${req.user.email} -> ${correctDashboard}`);
            
            // If already on correct dashboard, continue
            if (req.path === correctDashboard) {
                return next();
            }

            // Redirect to correct dashboard
            return res.redirect(correctDashboard);

        } catch (error) {
            this.logger.error('❌ Smart Router error:', error);
            next();
        }
    };

    /**
     * Cross-Dashboard Prevention
     * Prevents users from accessing other dashboard types
     */
    crossDashboardPrevention = async (req, res, next) => {
        try {
            if (!req.user) {
                return next();
            }

            const requestedDashboard = this.extractDashboardType(req.path);
            
            // Skip cross-dashboard prevention for auth routes
            if (requestedDashboard === 'auth' || requestedDashboard === 'api') {
                return next();
            }
            
            const userDashboard = this.extractDashboardType(this.determineUserDashboard(req.user));

            if (requestedDashboard && userDashboard && requestedDashboard !== userDashboard) {
                // Allow super_admin to access any dashboard
                if (req.user.role === 'super_admin') {
                    this.logger.log(`🔓 Super Admin Override: ${req.user.email} accessing ${requestedDashboard}`);
                    return next();
                }

                this.logger.warn(`🚫 Cross-Dashboard Access Blocked: ${req.user.email} tried ${requestedDashboard} but belongs to ${userDashboard}`);
                
                const correctDashboard = this.determineUserDashboard(req.user);
                return this.redirectToDashboard(req, res, correctDashboard, 'You can only access your designated dashboard');
            }

            next();

        } catch (error) {
            this.logger.error('❌ Cross-Dashboard Prevention error:', error);
            next();
        }
    };

    /**
     * API Access Control
     * Ensures API endpoints match dashboard access
     */
    apiAccessControl = (requiredDashboard) => {
        return async (req, res, next) => {
            try {
                if (!req.user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Authentication required',
                        code: 'AUTH_REQUIRED'
                    });
                }

                const userDashboard = this.extractDashboardType(this.determineUserDashboard(req.user));
                
                if (requiredDashboard !== userDashboard && req.user.role !== 'super_admin') {
                    return res.status(403).json({
                        success: false,
                        message: `API access denied. This endpoint requires ${requiredDashboard} dashboard access.`,
                        code: 'API_ACCESS_DENIED',
                        userDashboard,
                        requiredDashboard
                    });
                }

                next();

            } catch (error) {
                this.logger.error('❌ API Access Control error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'API security validation failed',
                    code: 'SECURITY_ERROR'
                });
            }
        };
    };

    /**
     * Determine user's dashboard based on role and company type
     */
    determineUserDashboard(user) {
        this.logger.log(`🧭 Determining dashboard for user:`, {
            userId: user.userId,
            userType: user.userType,
            role: user.role,
            companyType: user.companyType
        });

        // Admin users -> Admin dashboard
        if (user.userType === 'admin' || ['super_admin', 'admin', 'moderator'].includes(user.role)) {
            const route = this.dashboardRoutes[user.role] || this.dashboardRoutes['admin'];
            this.logger.log(`✅ Admin user routing to: ${route}`);
            return route;
        }

        // Company users -> Company-specific dashboard
        if (user.companyType && this.dashboardRoutes[user.companyType]) {
            const route = this.dashboardRoutes[user.companyType];
            this.logger.log(`✅ Company user routing to: ${route}`);
            return route;
        }

        // Fallback
        this.logger.warn(`⚠️ Dashboard routing fallback for user:`, {
            userId: user.userId,
            userType: user.userType,
            role: user.role,
            companyType: user.companyType,
            availableRoutes: Object.keys(this.dashboardRoutes)
        });

        return '/auth/login?error=routing_error&message=Unable to determine dashboard';
    }

    /**
     * Validate dashboard access based on rules
     */
    validateDashboardAccess(user, rules) {
        // Debug logging
        this.logger.log(`🔍 Dashboard Access Validation:`, {
            userType: user.userType,
            role: user.role,
            companyType: user.companyType,
            allowedUserTypes: rules.allowedUserTypes,
            allowedRoles: rules.allowedRoles,
            requiredCompanyTypes: rules.requiredCompanyTypes
        });

        // Check user type
        if (!rules.allowedUserTypes.includes(user.userType)) {
            this.logger.warn(`❌ User type check failed: ${user.userType} not in ${JSON.stringify(rules.allowedUserTypes)}`);
            return {
                allowed: false,
                reason: 'Insufficient user type privileges'
            };
        }

        // Check role
        if (!rules.allowedRoles.includes(user.role)) {
            this.logger.warn(`❌ Role check failed: ${user.role} not in ${JSON.stringify(rules.allowedRoles)}`);
            return {
                allowed: false,
                reason: 'Insufficient role privileges'
            };
        }

        // Check company type (if required)
        if (rules.requiredCompanyTypes && 
            !rules.requiredCompanyTypes.includes(user.companyType)) {
            this.logger.warn(`❌ Company type check failed: ${user.companyType} not in ${JSON.stringify(rules.requiredCompanyTypes)}`);
            return {
                allowed: false,
                reason: 'Unauthorized company type'
            };
        }

        // Check permissions (if required)
        if (rules.requiredPermissions && rules.requiredPermissions.length > 0) {
            const userPermissions = user.permissions || [];
            const hasRequiredPermissions = rules.requiredPermissions.every(
                permission => userPermissions.includes(permission)
            );
            
            if (!hasRequiredPermissions) {
                return {
                    allowed: false,
                    reason: 'Insufficient permissions'
                };
            }
        }

        return { allowed: true };
    }

    /**
     * Extract dashboard type from path
     */
    extractDashboardType(path) {
        const matches = path.match(/^\/([^\/]+)/);
        return matches ? matches[1] : null;
    }

    /**
     * Check if route is protected
     */
    isProtectedRoute(path) {
        return this.protectedRoutePatterns.some(pattern => pattern.test(path));
    }

    /**
     * Redirect to login with message
     */
    redirectToLogin(req, res, message) {
        const isAjax = this.isAjaxRequest(req);
        
        if (isAjax) {
            return res.status(401).json({
                success: false,
                message,
                redirectUrl: '/auth/login'
            });
        } else {
            return res.redirect(`/auth/login?error=auth_required&message=${encodeURIComponent(message)}`);
        }
    }

    /**
     * Redirect to correct dashboard with message
     */
    redirectToDashboard(req, res, dashboardUrl, message) {
        const isAjax = this.isAjaxRequest(req);
        
        if (isAjax) {
            return res.json({
                success: false,
                message,
                redirectUrl: dashboardUrl
            });
        } else {
            return res.redirect(`${dashboardUrl}?message=${encodeURIComponent(message)}`);
        }
    }

    /**
     * Handle forbidden access
     */
    handleForbidden(req, res, message) {
        const isAjax = this.isAjaxRequest(req);
        
        if (isAjax) {
            return res.status(403).json({
                success: false,
                message,
                code: 'FORBIDDEN'
            });
        } else {
            return res.redirect(`/auth/login?error=access_denied&message=${encodeURIComponent(message)}`);
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
     * Security headers for dashboard routes
     */
    dashboardSecurityHeaders = (req, res, next) => {
        // Enhanced security headers for dashboard routes
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('X-Dashboard-Security', 'enabled');
        
        if (process.env.NODE_ENV === 'production') {
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        next();
    };

    /**
     * Activity logging for security monitoring
     */
    logSecurityActivity = (eventType, details = {}) => {
        this.logger.log(`🔐 Security Event: ${eventType}`, {
            timestamp: new Date().toISOString(),
            ...details
        });
    };
}

// Create singleton instance
const dashboardRouting = new DashboardRoutingMiddleware();

module.exports = {
    // Core authentication and routing
    authenticationGuard: dashboardRouting.authenticationGuard,
    dashboardAccessControl: dashboardRouting.dashboardAccessControl,
    smartDashboardRouter: dashboardRouting.smartDashboardRouter,
    crossDashboardPrevention: dashboardRouting.crossDashboardPrevention,
    
    // API access controls
    adminApiOnly: dashboardRouting.apiAccessControl('admin'),
    manufacturerApiOnly: dashboardRouting.apiAccessControl('manufacturer'),
    distributorApiOnly: dashboardRouting.apiAccessControl('distributor'),
    
    // Security utilities
    dashboardSecurityHeaders: dashboardRouting.dashboardSecurityHeaders,
    logSecurityActivity: dashboardRouting.logSecurityActivity,
    
    // Utility methods
    determineUserDashboard: (user) => dashboardRouting.determineUserDashboard(user),
    extractDashboardType: (path) => dashboardRouting.extractDashboardType(path)
};