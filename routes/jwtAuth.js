/**
 * SLEX JWT Authentication Routes
 * Modern authentication routes with JWT tokens and security features
 */

const express = require('express');
const router = express.Router();
const JWTAuthController = require('../controllers/JWTAuthController');
const { 
    authenticate, 
    optionalAuth, 
    redirectIfAuthenticated, 
    authRateLimit, 
    loginRateLimit, 
    refreshRateLimit,
    securityHeaders 
} = require('../middleware/jwtAuth');

// Apply security headers to all auth routes
router.use(securityHeaders);

// Apply general auth rate limiting
router.use(authRateLimit);

// ===== PUBLIC ROUTES (NO AUTH REQUIRED) =====

/**
 * GET /auth/login
 * Show login page
 */
router.get('/login', 
    redirectIfAuthenticated,
    JWTAuthController.showLoginPage
);

/**
 * POST /auth/login
 * Handle login request
 */
router.post('/login', 
    loginRateLimit,
    redirectIfAuthenticated,
    JWTAuthController.login
);

/**
 * GET /auth/register
 * Show registration page (if needed)
 */
router.get('/register', 
    redirectIfAuthenticated,
    (req, res) => {
        // Generate CSRF token
        const csrfToken = require('crypto').randomBytes(32).toString('hex');
        
        res.render('auth/register', {
            title: req.t('register.title'),
            csrfToken,
            currentLang: req.language || req.cookies.language || 'uz',
            languages: JWTAuthController.getSupportedLanguages(),
            layout: 'layouts/auth'
        });
    }
);

/**
 * POST /auth/register
 * Handle registration request
 */
router.post('/register', 
    authRateLimit,
    redirectIfAuthenticated,
    // Add multer middleware for file uploads
    (() => {
        const multer = require('multer');
        const path = require('path');
        
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
        
        return upload.single('companyLogo');
    })(),
    async (req, res) => {
        try {
            // Import AuthController and create instance
            const AuthControllerClass = require('../controllers/AuthController');
            const authController = new AuthControllerClass();
            
            // Call the register method
            await authController.register(req, res);
        } catch (error) {
            console.error('Registration error in jwtAuth:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Registration failed',
                code: 'REGISTRATION_ERROR'
            });
        }
    }
);

/**
 * GET /auth/forgot-password
 * Show forgot password page
 */
router.get('/forgot-password', 
    redirectIfAuthenticated,
    (req, res) => {
        const csrfToken = require('crypto').randomBytes(32).toString('hex');
        
        res.render('auth/forgot-password', {
            title: req.t('forgot_password.title'),
            csrfToken,
            currentLang: req.language || req.cookies.language || 'uz',
            languages: JWTAuthController.getSupportedLanguages(),
            layout: 'layouts/auth'
        });
    }
);

/**
 * POST /auth/refresh-token
 * Refresh JWT tokens
 */
router.post('/refresh-token', 
    refreshRateLimit,
    JWTAuthController.refreshToken
);

// ===== AUTHENTICATED ROUTES =====

/**
 * POST /auth/logout
 * Handle logout request
 */
router.post('/logout', 
    optionalAuth, // Optional auth since user might already be logged out
    JWTAuthController.logout
);

/**
 * GET /auth/logout
 * Handle logout via GET (for backwards compatibility)
 */
router.get('/logout', 
    optionalAuth,
    JWTAuthController.logout
);

/**
 * GET /auth/me
 * Get current user information
 */
router.get('/me', 
    authenticate,
    JWTAuthController.me
);

/**
 * GET /auth/data.json
 * Static data endpoint for compatibility
 */
router.get('/data.json', (req, res) => {
    try {
        const data = require('../public/data.json');
        res.json(data);
    } catch (error) {
        res.status(404).json({
            success: false,
            message: 'Data not found'
        });
    }
});

/**
 * POST /auth/verify-session
 * Verify current session validity
 */
router.post('/verify-session', 
    authenticate,
    (req, res) => {
        try {
            res.json({
                success: true,
                message: 'Session is valid',
                data: {
                    user: {
                        id: req.user.userId,
                        name: req.user.name,
                        email: req.user.email,
                        role: req.user.role,
                        userType: req.user.userType,
                        sessionId: req.sessionId
                    },
                    expiresIn: req.user.exp - Math.floor(Date.now() / 1000)
                }
            });
        } catch (error) {
            console.error('Session verification error:', error);
            res.status(500).json({
                success: false,
                message: 'Session verification failed'
            });
        }
    }
);

// ===== LANGUAGE MANAGEMENT =====

/**
 * POST /language/change
 * Change user language preference
 */
router.post('/language/change', 
    optionalAuth,
    (req, res) => {
        try {
            const { language } = req.body;
            const supportedLanguages = ['uz', 'en', 'ru', 'tr', 'fa', 'zh'];
            
            if (!language || !supportedLanguages.includes(language)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid language code'
                });
            }
            
            // Set language cookie
            res.cookie('language', language, {
                maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
                httpOnly: false, // Allow client-side access
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });
            
            // Update session language if user is logged in
            if (req.session) {
                req.session.language = language;
            }
            
            res.json({
                success: true,
                message: 'Language changed successfully',
                data: { language }
            });
            
        } catch (error) {
            console.error('Language change error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to change language'
            });
        }
    }
);

/**
 * GET /language/:lang
 * Change language via GET request (for direct links)
 */
router.get('/language/:lang', (req, res) => {
    try {
        const { lang } = req.params;
        const supportedLanguages = ['uz', 'en', 'ru', 'tr', 'fa', 'zh'];
        
        if (supportedLanguages.includes(lang)) {
            res.cookie('language', lang, {
                maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });
            
            if (req.session) {
                req.session.language = lang;
            }
        }
        
        // Redirect back to referring page or home
        const returnTo = req.get('Referer') || '/';
        res.redirect(returnTo);
        
    } catch (error) {
        console.error('Language redirect error:', error);
        res.redirect('/');
    }
});

// ===== SECURITY ENDPOINTS =====

/**
 * POST /auth/check-email
 * Check if email exists (for registration)
 */
router.post('/check-email', 
    authRateLimit,
    async (req, res) => {
        try {
            const { email } = req.body;
            
            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }
            
            // Import models
            const User = require('../models/User');
            const Admin = require('../models/Admin');
            
            // Check in both collections
            const [userExists, adminExists] = await Promise.all([
                User.exists({ email: email.toLowerCase() }),
                Admin.exists({ email: email.toLowerCase() })
            ]);
            
            const exists = userExists || adminExists;
            
            res.json({
                success: true,
                data: { 
                    exists,
                    available: !exists
                }
            });
            
        } catch (error) {
            console.error('Email check error:', error);
            res.status(500).json({
                success: false,
                message: 'Email check failed'
            });
        }
    }
);

/**
 * POST /auth/security-check
 * General security validation endpoint
 */
router.post('/security-check', 
    authRateLimit,
    (req, res) => {
        try {
            const { type, data } = req.body;
            
            switch (type) {
                case 'csrf':
                    // CSRF token validation is handled by the controller
                    res.json({ success: true, valid: true });
                    break;
                    
                case 'session':
                    // Session validation
                    const hasValidSession = req.session && req.session.id;
                    res.json({ success: true, valid: hasValidSession });
                    break;
                    
                case 'rate_limit':
                    // Rate limit status
                    res.json({ 
                        success: true, 
                        rateLimit: {
                            remaining: req.rateLimit?.remaining || 100,
                            reset: req.rateLimit?.reset || Date.now() + 900000,
                            limit: req.rateLimit?.limit || 100
                        }
                    });
                    break;
                    
                default:
                    res.status(400).json({
                        success: false,
                        message: 'Invalid security check type'
                    });
            }
            
        } catch (error) {
            console.error('Security check error:', error);
            res.status(500).json({
                success: false,
                message: 'Security check failed'
            });
        }
    }
);

// ===== ERROR HANDLING =====

/**
 * Handle 404 for auth routes
 */
router.use('*', (req, res) => {
    if (req.xhr || req.headers.accept?.includes('json')) {
        res.status(404).json({
            success: false,
            message: 'Authentication endpoint not found',
            code: 'AUTH_ENDPOINT_NOT_FOUND'
        });
    } else {
        res.status(404).render('error/404', {
            title: 'Page Not Found',
            message: 'The authentication page you requested was not found.',
            layout: 'layouts/error'
        });
    }
});

/**
 * Auth routes error handler
 */
router.use((error, req, res, next) => {
    console.error('Auth route error:', error);
    
    // Don't expose sensitive error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorMessage = isDevelopment ? error.message : 'Authentication error occurred';
    
    // Always return JSON for auth API routes
    res.status(500).json({
        success: false,
        message: errorMessage,
        code: 'AUTH_ERROR',
        ...(isDevelopment && { stack: error.stack })
    });
});

module.exports = router;