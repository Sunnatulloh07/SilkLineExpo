/**
 * SLEX Professional Authentication Routes
 * Enhanced with JWT support and production-ready security
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const AuthControllerClass = require('../controllers/AuthController');
const { rateLimit, optionalAuth } = require('../middleware/auth');
const { optionalAuth: jwtOptionalAuth } = require('../middleware/jwtAuth');

const router = express.Router();

// Create AuthController instance and bind methods
const AuthController = new AuthControllerClass();
const boundAuthMethods = {
  showLoginPage: AuthController.showLoginPage.bind(AuthController),
  showRegisterPage: AuthController.showRegisterPage.bind(AuthController),
  register: AuthController.register.bind(AuthController),
  login: AuthController.login.bind(AuthController),
  adminLogin: AuthController.adminLogin.bind(AuthController),
  logout: AuthController.logout.bind(AuthController),
  checkEmailExists: AuthController.checkEmailExists.bind(AuthController),
  checkTaxNumberExists: AuthController.checkTaxNumberExists.bind(AuthController),
  requestPasswordReset: AuthController.requestPasswordReset.bind(AuthController),
  resetPassword: AuthController.resetPassword.bind(AuthController),
  getStatus: AuthController.getStatus.bind(AuthController)
};

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

// ===== PUBLIC ROUTES =====

/**
 * GET /login - Show login page
 */
router.get('/login', boundAuthMethods.showLoginPage);

/**
 * GET /register - Show registration page
 */
router.get('/register', boundAuthMethods.showRegisterPage);

/**
 * POST /register - User Registration
 */
router.post('/register', 
  rateLimit(3, 15 * 60 * 1000), 
  upload.single('companyLogo'), 
  boundAuthMethods.register
);

/**
 * POST /login - Unified Login (Auto-detects Admin or Company User)
 */
router.post('/login', 
  rateLimit(5, 15 * 60 * 1000), 
  boundAuthMethods.login
);

/**
 * POST /admin/login - Legacy Admin Login (redirects to unified login)
 */
router.post('/admin/login', 
  rateLimit(3, 15 * 60 * 1000), 
  boundAuthMethods.adminLogin
);

// ===== AUTHENTICATED ROUTES =====

/**
 * POST /logout - Handle logout
 */
router.post('/logout', jwtOptionalAuth, boundAuthMethods.logout);

/**
 * GET /logout - Handle logout via GET
 */
router.get('/logout', jwtOptionalAuth, boundAuthMethods.logout);

/**
 * GET /me - Get current user information
 */
router.get('/me', (req, res) => {
  const TokenService = require('../services/TokenService');
  const tokens = TokenService.extractTokensFromRequest(req);
  
  if (!tokens.accessToken) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }
  
  const accessTokenResult = TokenService.verifyAccessToken(tokens.accessToken);
  
  if (!accessTokenResult.valid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  return res.json({
    success: true,
    data: {
      user: {
        id: accessTokenResult.payload.userId,
        name: accessTokenResult.payload.name,
        email: accessTokenResult.payload.email,
        role: accessTokenResult.payload.role,
        userType: accessTokenResult.payload.userType
      }
    }
  });
});

/**
 * POST /refresh-token - Refresh JWT tokens
 */
router.post('/refresh-token', async (req, res) => {
  try {
    console.log('🔄 Refresh token request received');
    const TokenService = require('../services/TokenService');
    const tokens = TokenService.extractTokensFromRequest(req);

    if (!tokens.refreshToken) {
      console.log('❌ Refresh token not found in request');
      return res.status(401).json({
        success: false,
        message: "Refresh token not found",
        code: "NO_REFRESH_TOKEN",
        debug: process.env.NODE_ENV !== 'production' ? {
          cookiesReceived: req.cookies ? Object.keys(req.cookies) : [],
          authHeader: req.headers.authorization ? 'Present' : 'Missing'
        } : undefined
      });
    }

    console.log('🔍 Attempting to refresh with token');
    const refreshResult = await TokenService.refreshAccessToken(
      tokens.refreshToken,
      { 
        User: require('../models/User'), 
        Admin: require('../models/Admin') 
      }
    );

    if (!refreshResult.success) {
      console.log('❌ Token refresh failed:', refreshResult.message || refreshResult.error);
      TokenService.clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        message: refreshResult.message || refreshResult.error || "Token refresh failed",
        code: "REFRESH_FAILED"
      });
    }

    // Set new cookies
    TokenService.setAuthCookies(res, refreshResult.tokens);

    return res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        user: {
          id: refreshResult.user._id,
          name: refreshResult.user.name || refreshResult.user.companyName,
          email: refreshResult.user.email,
          role: refreshResult.user.role,
          userType: refreshResult.user.role ? "admin" : "user"
        },
        sessionId: refreshResult.tokens.sessionId
      }
    });
    
  } catch (error) {
    console.error("Token refresh error:", error);
    return res.status(500).json({
      success: false,
      message: "Token refresh failed"
    });
  }
});

// ===== UTILITY ROUTES =====

/**
 * GET /status - Check authentication status
 */
router.get('/status', jwtOptionalAuth, boundAuthMethods.getStatus);

/**
 * GET /check-email - Check if email exists
 */
router.get('/check-email', boundAuthMethods.checkEmailExists);

/**
 * GET /check-tax-number - Check if tax number exists
 */
router.get('/check-tax-number', boundAuthMethods.checkTaxNumberExists);

/**
 * POST /password-reset - Request password reset
 */
router.post('/password-reset', 
  rateLimit(3, 60 * 60 * 1000), 
  boundAuthMethods.requestPasswordReset
);

/**
 * POST /reset-password - Reset password with token
 */
router.post('/reset-password', boundAuthMethods.resetPassword);

// ===== ERROR HANDLING =====

/**
 * 404 handler for auth routes
 */
router.use('*', (req, res) => {
  if (req.xhr || req.headers.accept?.includes('json')) {
    return res.status(404).json({
      success: false,
      message: 'Authentication endpoint not found'
    });
  }
  
  return res.status(404).render('error/404', {
    title: 'Page Not Found',
    message: 'The authentication page you requested was not found.'
  });
});

/**
 * Error handler
 */
router.use((error, req, res, next) => {
  console.error('Auth route error:', error);
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorMessage = isDevelopment ? error.message : 'Authentication error occurred';
  
  return res.status(500).json({
    success: false,
    message: errorMessage,
    ...(isDevelopment && { stack: error.stack })
  });
});

/**
 * GET /debug/token-status - Debug token status (development only)
 */
router.get('/debug/token-status', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: 'Not found' });
  }

  try {
    const TokenService = require('../services/TokenService');
    const tokens = TokenService.extractTokensFromRequest(req);
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      cookies: req.cookies || {},
      headers: {
        authorization: req.headers.authorization || null,
        'user-agent': req.headers['user-agent'],
        'x-requested-with': req.headers['x-requested-with']
      },
      tokens: {
        hasAccessToken: !!tokens.accessToken,
        hasRefreshToken: !!tokens.refreshToken,
        hasSessionId: !!tokens.sessionId,
        accessTokenPreview: tokens.accessToken ? tokens.accessToken.substring(0, 20) + '...' : null,
        refreshTokenPreview: tokens.refreshToken ? tokens.refreshToken.substring(0, 20) + '...' : null
      }
    };

    // Try to decode access token if present
    if (tokens.accessToken) {
      try {
        const jwt = require('jsonwebtoken');
        const payload = jwt.decode(tokens.accessToken);
        debugInfo.tokenPayload = {
          userId: payload?.userId,
          userType: payload?.userType,
          exp: payload?.exp,
          iat: payload?.iat,
          expiresAt: payload?.exp ? new Date(payload.exp * 1000).toISOString() : null,
          isExpired: payload?.exp ? (payload.exp * 1000) < Date.now() : null
        };
      } catch (decodeError) {
        debugInfo.tokenDecodeError = decodeError.message;
      }
    }

    res.json({
      success: true,
      debug: debugInfo
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;