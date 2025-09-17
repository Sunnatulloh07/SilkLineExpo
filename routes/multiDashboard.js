/**
 * Multi-Dashboard Authentication Routes
 * Professional routing for role-based dashboard access
 * Handles authentication and redirects users to appropriate dashboards
 */

const express = require('express');
const MultiDashboardAuthController = require('../controllers/MultiDashboardAuthController');
const AuthControllerClass = require('../controllers/AuthController');
const multer = require('multer');
const path = require('path');
const { 
    redirectIfAuthenticated, 
    securityHeaders, 
    loginRateLimit,
    authRateLimit
} = require('../middleware/jwtAuth');
const { rateLimit } = require('../middleware/auth');

// Create AuthController instance for register functionality
const AuthController = new AuthControllerClass();

// Multer configuration for file uploads
const upload = multer({
  dest: path.join(__dirname, '../temp/'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    allowedTypes.includes(file.mimetype) 
      ? cb(null, true) 
      : cb(new Error('Only JPG and PNG files allowed'), false);
  }
});

const router = express.Router();

// Apply security headers to all routes
router.use(securityHeaders);

// ===== AUTHENTICATION ROUTES =====

/**
 * GET /auth/login - Show login page
 * Supports different login types via query parameter ?type=admin|manufacturer|distributor
 */
router.get('/login', 
    redirectIfAuthenticated,
    MultiDashboardAuthController.showLogin
);

/**
 * GET /auth/register - Show registration page
 */
router.get('/register', 
    redirectIfAuthenticated,
    AuthController.showRegisterPage.bind(AuthController)
);

/**
 * POST /auth/register - Process registration
 */
router.post('/register', 
    rateLimit(3, 15 * 60 * 1000), // 3 attempts per 15 minutes
    upload.single('companyLogo'),
    AuthController.register.bind(AuthController)
);

/**
 * POST /auth/login - Process login
 * Unified login endpoint for all user types
 * Automatically routes to appropriate dashboard based on role/company type
 */
router.post('/login', 
    loginRateLimit,
    MultiDashboardAuthController.login
);

/**
 * POST /auth/logout - Logout user
 * Clears all authentication tokens and sessions
 */
router.post('/logout', 
    MultiDashboardAuthController.logout
);

/**
 * GET /auth/logout - Logout via GET (for convenience)
 */
router.get('/logout', 
    MultiDashboardAuthController.logout
);

/**
 * GET /auth/me - Get current user information
 * Returns authenticated user's profile data
 */
router.get('/me', 
    authRateLimit,
    async (req, res) => {
        try {
            const TokenService = require('../services/TokenService');
            const tokens = TokenService.extractTokensFromRequest(req);
            
            if (!tokens.accessToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authenticated',
                    error: 'NO_TOKEN'
                });
            }
            
            const accessTokenResult = TokenService.verifyAccessToken(tokens.accessToken);
            
            if (!accessTokenResult.valid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or expired token',
                    error: 'INVALID_TOKEN'
                });
            }
            
            const { payload } = accessTokenResult;
            
            return res.json({
                success: true,
                data: {
                    user: {
                        id: payload.userId,
                        name: payload.name,
                        email: payload.email,
                        role: payload.role,
                        userType: payload.userType,
                        permissions: payload.permissions || [],
                        companyName: payload.companyName,
                        companyType: payload.companyType,
                        isActive: payload.isActive !== false
                    },
                    token: {
                        expiresAt: payload.exp,
                        issuedAt: payload.iat
                    }
                }
            });
            
        } catch (error) {
            console.error('❌ /auth/me error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: 'SERVER_ERROR'
            });
        }
    }
);

/**
 * GET /auth/check - Check authentication status
 * Returns current user info and appropriate dashboard route
 */
router.get('/check', 
    authRateLimit,
    MultiDashboardAuthController.checkAuth
);

// ===== LEGACY REDIRECT ROUTES =====

/**
 * Legacy admin login redirect
 * Redirects old admin login URLs to unified login with admin type
 */
router.get('/admin/login', (req, res) => {
    res.redirect('/auth/login?type=admin');
});

/**
 * Legacy manufacturer login redirect
 */
router.get('/manufacturer/login', (req, res) => {
    res.redirect('/auth/login?type=manufacturer');
});

/**
 * Legacy distributor login redirect
 */
router.get('/distributor/login', (req, res) => {
    res.redirect('/auth/login?type=distributor&redirect=/buyer/profile');
});

// ===== DASHBOARD ACCESS VALIDATION =====

/**
 * GET /auth/validate/:dashboardType - Validate dashboard access
 * Checks if current user has access to specific dashboard type
 */
router.get('/validate/:dashboardType', 
    authRateLimit,
    async (req, res) => {
        try {
            const { dashboardType } = req.params;
            const validDashboards = ['admin', 'manufacturer', 'distributor'];
            
            if (!validDashboards.includes(dashboardType)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid dashboard type'
                });
            }

            // Extract user info from token
            const TokenService = require('../services/TokenService');
            const tokens = TokenService.extractTokensFromRequest(req);
            
            if (!tokens.accessToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const verification = TokenService.verifyAccessToken(tokens.accessToken);
            
            if (!verification.valid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or expired token'
                });
            }

            const { payload } = verification;
            
            // Check dashboard access permission
            let hasAccess = false;
            
            if (dashboardType === 'admin') {
                hasAccess = payload.userType === 'admin' && 
                           ['super_admin', 'admin', 'moderator'].includes(payload.role);
            } else if (dashboardType === 'manufacturer') {
                hasAccess = payload.userType === 'user' && 
                           payload.role === 'company_admin' && 
                           payload.companyType === 'manufacturer';
            } else if (dashboardType === 'distributor') {
                hasAccess = payload.userType === 'user' && 
                           payload.role === 'company_admin' && 
                           payload.companyType === 'distributor';
            }

            if (hasAccess) {
                return res.json({
                    success: true,
                    message: 'Access granted',
                    dashboardType,
                    user: {
                        userId: payload.userId,
                        userType: payload.userType,
                        role: payload.role,
                        companyType: payload.companyType,
                        name: payload.name,
                        email: payload.email,
                        companyType: payload.companyType
                    }
                });
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this dashboard'
                });
            }

        } catch (error) {
            console.error('❌ Dashboard validation error:', error);
            return res.status(500).json({
                success: false,
                message: 'Validation service error'
            });
        }
    }
);

// ===== ROUTE DISCOVERY =====

/**
 * GET /auth/routes - Get available routes for current user
 * Returns dashboard routes and permissions based on user role
 */
router.get('/routes', 
    authRateLimit,
    async (req, res) => {
        try {
            const TokenService = require('../services/TokenService');
            const MultiDashboardAuthService = require('../services/MultiDashboardAuthService');
            
            const tokens = TokenService.extractTokensFromRequest(req);
            
            if (!tokens.accessToken) {
                return res.json({
                    authenticated: false,
                    routes: {
                        public: ['/auth/login', '/register', '/'],
                        protected: []
                    }
                });
            }

            const verification = TokenService.verifyAccessToken(tokens.accessToken);
            
            if (!verification.valid) {
                return res.json({
                    authenticated: false,
                    routes: {
                        public: ['/auth/login', '/register', '/'],
                        protected: []
                    }
                });
            }

            const { payload } = verification;
            const dashboardConfig = MultiDashboardAuthService.getDashboardConfig(payload, payload.userType);
            
            // Build route structure
            const routes = {
                public: ['/auth/login', '/auth/logout', '/register', '/'],
                protected: [dashboardConfig.dashboardRoute],
                permissions: payload.permissions || [],
                features: dashboardConfig.features || []
            };

            // Add role-specific routes
            if (payload.userType === 'admin') {
                routes.protected.push(
                    '/admin/users',
                    '/admin/analytics',
                    '/admin/settings',
                    '/admin/reports'
                );
            } else if (payload.companyType === 'manufacturer') {
                routes.protected.push(
                    '/manufacturer/production',
                    '/manufacturer/products',
                    '/manufacturer/distribution',
                    '/manufacturer/sales',
                    '/manufacturer/operations',
                    '/manufacturer/analytics'
                );
            } else if (payload.companyType === 'distributor') {
                routes.protected.push(
                    '/buyer/profile',
                    '/buyer/orders',
                    '/buyer/messages',
                    '/buyer/favorites',
                    '/buyer/settings'
                );
            }

            return res.json({
                authenticated: true,
                user: {
                    userId: payload.userId,
                    userType: payload.userType,
                    role: payload.role,
                    companyType: payload.companyType,
                        name: payload.name,
                    companyType: payload.companyType
                },
                routes,
                dashboardConfig
            });

        } catch (error) {
            console.error('❌ Route discovery error:', error);
            return res.status(500).json({
                success: false,
                message: 'Route discovery failed'
            });
        }
    }
);

// ===== HEALTH CHECK =====

/**
 * GET /auth/health - Authentication service health check
 */
router.get('/health', (req, res) => {
    res.json({
        service: 'Multi-Dashboard Authentication',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        features: [
            'unified_login',
            'role_based_routing',
            'jwt_authentication',
            'rate_limiting',
            'csrf_protection',
            'session_management'
        ]
    });
});

// ===== ERROR HANDLING =====

/**
 * Error handling middleware for authentication routes
 */
router.use((error, req, res, next) => {
    console.error('❌ Multi-dashboard auth route error:', error);
    
    const isAjax = req.get('Content-Type') === 'application/json' ||
                   req.get('X-Requested-With') === 'XMLHttpRequest';
    
    if (isAjax) {
        return res.status(500).json({
            success: false,
            message: 'Authentication service error',
            code: 'SERVICE_ERROR',
            timestamp: new Date().toISOString()
        });
    } else {
        return res.redirect('/auth/login?error=service_error');
    }
});

module.exports = router;