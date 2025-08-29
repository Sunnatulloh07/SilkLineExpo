/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */

const AuthService = require('../services/AuthService');
const FileService = require('../services/FileService');

class AuthController {
  constructor() {
    // Initialize rate limiters
    this.loginAttempts = new Map();
    this.maxAttempts = 5;
    this.windowMs = 15 * 60 * 1000; // 15 minutes
  }
  /**
   * Show registration page
   */
  async showRegisterPage(req, res) {
    try {
      const csrfToken = require('crypto').randomBytes(32).toString('hex');
      req.session.csrfToken = csrfToken;
      
      res.render('pages/register', {
        title: req.t('register.title') || 'Register',
        currentLang: req.language || req.cookies.language || 'uz',
        csrfToken: csrfToken,
        languages: this.getSupportedLanguages(),
        error: req.query.error || null,
        formData: {}
      });
    } catch (error) {
      console.error('Show register page error:', error);
      res.status(500).render('error/500', {
        title: 'Error',
        message: 'Unable to load registration page'
      });
    }
  }

  /**
   * Show login page
   */
  async showLoginPage(req, res) {
    try {
      // Generate CSRF token for security
      const csrfToken = require('crypto').randomBytes(32).toString('hex');
      
      // Store token in session for verification
      req.session.csrfToken = csrfToken;
      
      const t = req.t || ((key) => key);
      
      res.render('pages/login', {
        title: t('login.title') || 'Login',
        currentLang: req.language || req.cookies.language || 'uz',
        languages: this.getSupportedLanguages(),
        error: req.query.error || null,
        message: req.query.message || null,
        formData: {},
        csrfToken: csrfToken
      });
    } catch (error) {
      console.error('Show login page error:', error);
      res.status(500).render('pages/error', {
        title: 'Error',
        message: 'Unable to load login page'
      });
    }
  }

  /**
   * Handle company admin registration
   */
  async register(req, res) {
    try {
      // Validate request
      if (!req.body) {
        return res.status(400).json({
          success: false,
          message: 'Registration data is required'
        });
      }

      // Extract form data
      const userData = {
        companyName: req.body.companyName,
        email: req.body.email,
        phone: req.body.phone,
        taxNumber: req.body.taxNumber,
        activityType: req.body.activityType,
        companyType: req.body.companyType,
        country: req.body.country,
        city: req.body.city,
        address: req.body.address,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        agreeTerms: req.body.agreeTerms,
        preferredLanguage: req.language || 'uz'
      };

      // Get uploaded logo file
      const logoFile = req.file;

      // Validate logo file is required
      if (!logoFile) {
        return res.status(400).json({
          success: false,
          message: req.t('register.errors.logoRequired') || 'Company logo is required',
          code: 'LOGO_REQUIRED'
        });
      }

      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(logoFile.mimetype)) {
        return res.status(400).json({
          success: false,
          message: req.t('register.errors.invalidFile') || 'Invalid file format. Only JPG and PNG files are allowed',
          code: 'INVALID_FILE_TYPE'
        });
      }

      if (logoFile.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: req.t('register.errors.invalidFile') || 'File size must be less than 5MB',
          code: 'FILE_TOO_LARGE'
        });
      }

      // Register user through service
      const result = await AuthService.registerCompanyAdmin(userData, logoFile);

      // Success response
      res.status(201).json({
        success: true,
        message: req.t('register.success') || 'Registration successful. Awaiting admin approval.',
        data: {
          userId: result.userId,
          companyName: result.companyName,
          email: result.email,
          status: result.status
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific error types with enhanced error handling
      let statusCode = 400;
      let message = error.message;
      let errorCode = 'VALIDATION_ERROR';

      if (error.code === 11000) {
        // MongoDB duplicate key error
        errorCode = 'DUPLICATE_DATA';
        if (error.keyPattern?.email) {
          message = req.t('register.errors.emailExists') || 'Email already exists';
        } else if (error.keyPattern?.taxNumber) {
          message = req.t('register.errors.taxNumberExists') || 'Tax number already exists';
        } else {
          message = req.t('register.errors.duplicateData') || 'Duplicate data found';
        }
      } else if (error.name === 'ValidationError') {
        // Mongoose validation error with detailed field mapping
        errorCode = 'VALIDATION_ERROR';
        const validationErrors = Object.values(error.errors).map(err => {
          // Map field names to user-friendly messages
          const fieldMap = {
            'companyLogo.url': 'Company logo',
            'companyLogo.filename': 'Company logo filename',
            'companyLogo.originalName': 'Company logo name',
            'companyLogo.mimeType': 'Company logo type',
            'companyLogo.size': 'Company logo size'
          };
          const fieldName = fieldMap[err.path] || err.path;
          return `${fieldName}: ${err.message}`;
        });
        message = validationErrors.join(', ');
      } else if (error.message.includes('Logo processing failed')) {
        errorCode = 'LOGO_PROCESSING_ERROR';
        statusCode = 422; // Unprocessable Entity
      } else if (error.message.includes('Company logo is required')) {
        errorCode = 'LOGO_REQUIRED';
        statusCode = 400;
      } else if (error.message.includes('file') || error.message.includes('upload')) {
        errorCode = 'FILE_UPLOAD_ERROR';
        statusCode = 413; // Payload too large
      }

      res.status(statusCode).json({
        success: false,
        message: message,
        code: errorCode,
        errors: error.errors || null,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }
  }

  /**
   * Professional Unified Login Handler - Enhanced with JWT and better security
   */
  async login(req, res) {
    try {
      const { email, identifier, password, rememberMe, csrfToken } = req.body;
      const clientIP = req.ip || req.connection.remoteAddress;
      
      // Use email as identifier if identifier is not provided
      const loginIdentifier = (identifier || email || "").toLowerCase().trim();
      
      console.log(`🔐 Login attempt for: ${loginIdentifier} from IP: ${clientIP}`);

      // Input validation
      if (!loginIdentifier || !password) {
        const t = req.t || ((key) => key);
        return this.sendError(res, 400, t('login.errors.requiredFields'));
      }

      // Email format validation
      if (!this.isValidEmail(loginIdentifier)) {
        return this.sendError(res, 400, "Invalid email format");
      }

      // CSRF token validation - Check if this is an API request
      const isApiRequest = req.get('Content-Type') === 'application/json' || 
                          req.get('X-Requested-With') === 'XMLHttpRequest';
      
      // For API requests, CSRF token is optional
      if (!isApiRequest && csrfToken && req.session.csrfToken && req.session.csrfToken !== csrfToken) {
        return this.sendError(res, 403, 'Invalid security token. Please refresh the page.');
      }

      // Clear CSRF token after validation
      if (req.session.csrfToken) {
        delete req.session.csrfToken;
      }

      // Rate limiting check
      if (this.isRateLimited(clientIP)) {
        return this.sendError(res, 429, "Too many login attempts. Please try again later.");
      }

      // Use AuthService for unified authentication
      let authResult;
      try {
        authResult = await AuthService.unifiedLogin(loginIdentifier, password, rememberMe);
      } catch (serviceError) {
        // Record failed attempt
        this.recordFailedAttempt(clientIP);
        
        // Handle specific AuthService errors
        let statusCode = 401;
        let code = 'INVALID_CREDENTIALS';
        
        if (serviceError.type === 'blocked') {
          statusCode = 403;
          code = 'ACCOUNT_BLOCKED';
        } else if (serviceError.type === 'locked') {
          statusCode = 423;
          code = 'ACCOUNT_LOCKED';
        } else if (serviceError.type === 'suspended') {
          statusCode = 403;
          code = 'ACCOUNT_SUSPENDED';
        }
        
        return this.sendError(res, statusCode, serviceError.message, code);
      }

      // Clear failed attempts on success
      this.clearFailedAttempts(clientIP);

      // Generate JWT tokens for modern authentication
      const tokenPayload = {
        userId: authResult.userId.toString(),
        userType: authResult.userType,
        role: authResult.role || 'company_admin',
        email: authResult.email,
        name: authResult.name,
        permissions: [], // Add permissions if needed
        
        // CRITICAL: Add company-specific fields for proper dashboard routing
        companyType: authResult.companyType,
        companyName: authResult.companyName,
        companyId: authResult.userId.toString() // Company users use userId as companyId
      };

      // Generate tokens using TokenService
      const TokenService = require('../services/TokenService');
      const tokens = TokenService.generateTokenPair(tokenPayload);

      // Set secure cookies
      TokenService.setAuthCookies(res, tokens);

      // Also set legacy session for backward compatibility
      this.setUserSession(req, {
        userId: authResult.userId,
        name: authResult.name,
        email: authResult.email,
        role: authResult.role,
        userType: authResult.userType,
        status: authResult.status
      }, authResult.userType);

      // Set remember me cookie if requested
      if (rememberMe) {
        this.setRememberMeCookie(res, authResult.userId);
      }

      // Update last login through helper method
      await this.updateLastLoginByType(authResult.userId, authResult.userType, req);

      // Determine redirect URL based on role and company type
      const redirectUrl = this.getRedirectUrl(authResult.userType, authResult.role, authResult.companyType);

      // Success response
      const t = req.t || ((key) => key);
      
      res.json({
        success: true,
        message: t('login.success') || 'Login successful',
        data: {
          userId: authResult.userId,
          name: authResult.name,
          email: authResult.email,
          role: authResult.role,
          userType: authResult.userType,
          status: authResult.status,
          redirectUrl: redirectUrl,
          sessionId: tokens.sessionId,
          // Add company information for proper localStorage
          companyType: authResult.companyType,
          companyName: authResult.companyName
        }
      });

    } catch (error) {
      console.error('🔥 Login error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        type: error.type
      });
      this.handleLoginError(error, req, res);
    }
  }

  /**
   * Legacy admin login (for backward compatibility)
   */
  async adminLogin(req, res) {
    try {
      // Extract identifier from email field for backward compatibility
      if (req.body.email && !req.body.identifier) {
        req.body.identifier = req.body.email;
      }
      return await this.login(req, res);
    } catch (error) {
      console.error('🔥 Admin login error:', error);
      return this.sendError(res, 500, 'Admin login failed: ' + error.message);
    }
  }

  /**
   * Enhanced logout with JWT token blacklisting
   */
  async logout(req, res) {
    try {
      const userId = req.session.userId;
      const userType = req.session.userType || 'user';

      // Get TokenService for JWT handling
      const TokenService = require('../services/TokenService');
      const tokens = TokenService.extractTokensFromRequest(req);

      // Blacklist current tokens
      if (tokens.accessToken) {
        TokenService.blacklistToken(tokens.accessToken);
      }
      if (tokens.refreshToken) {
        TokenService.blacklistToken(tokens.refreshToken);
      }

      // Clear JWT cookies
      TokenService.clearAuthCookies(res);

      // Legacy service logout if available
      if (userId) {
        try {
          await AuthService.logout(userId, userType);
        } catch (serviceError) {
          console.warn('AuthService logout error:', serviceError);
        }
      }

      // Clear session
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
        }
      });

      // Clear remember me cookie
      res.clearCookie('rememberMe');
      res.clearCookie('connect.sid');

      console.log("🔓 User logged out successfully");

      // Check if it's an AJAX/API request
      const isApiRequest = req.xhr || req.headers.accept?.includes('application/json') || req.path.startsWith('/api/');
      
      if (isApiRequest) {
        return res.json({
          success: true,
          message: req.t('auth.logoutSuccess') || 'Logged out successfully',
          redirectUrl: '/auth/login'
        });
      }

      // For regular browser requests, redirect directly
      return res.redirect('/auth/login?message=logged_out');

    } catch (error) {
      console.error('Logout error:', error);
      
      const isApiRequest = req.xhr || req.headers.accept?.includes('application/json') || req.path.startsWith('/api/');
      
      if (isApiRequest) {
        return res.status(500).json({
          success: false,
          message: req.t('auth.logoutError') || 'Logout failed'
        });
      }
      
      return res.redirect('/auth/login?error=logout_failed');
    }
  }

  /**
   * Get current user status
   */
  async getStatus(req, res) {
    try {
      const userId = req.session.userId;
      const userType = req.session.userType || 'user';

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated',
          authenticated: false
        });
      }

      const result = await AuthService.getUserStatus(userId, userType);

      res.json({
        success: true,
        authenticated: true,
        data: {
          user: result.user,
          type: result.type,
          sessionValid: true
        }
      });

    } catch (error) {
      console.error('Get status error:', error);
      
      // Clear invalid session
      req.session.destroy();
      
      res.status(401).json({
        success: false,
        message: 'Session invalid',
        authenticated: false
      });
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(req, res) {
    try {
      const { email, userType = 'user' } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: req.t('auth.errors.emailRequired')
        });
      }

      const result = await AuthService.requestPasswordReset(email, userType);

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({
        success: false,
        message: req.t('auth.errors.passwordResetFailed')
      });
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(req, res) {
    try {
      const { token, password, confirmPassword, userType = 'user' } = req.body;

      // Validate required fields
      if (!token || !password || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: req.t('auth.errors.requiredFields')
        });
      }

      // Validate password confirmation
      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: req.t('auth.errors.passwordMismatch')
        });
      }

      // Validate password strength
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: req.t('auth.errors.passwordTooShort')
        });
      }

      const result = await AuthService.resetPassword(token, password, userType);

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error('Password reset error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Show password reset form
   */
  async showPasswordResetForm(req, res) {
    try {
      const { token, type = 'user' } = req.query;

      if (!token) {
        return res.status(400).render('pages/error', {
          title: 'Error',
          message: 'Invalid password reset link'
        });
      }

      res.render('pages/reset-password', {
        title: req.t('auth.resetPassword'),
        token,
        userType: type,
        error: null
      });

    } catch (error) {
      console.error('Show password reset form error:', error);
      res.status(500).render('pages/error', {
        title: 'Error',
        message: 'Unable to load password reset form'
      });
    }
  }

  /**
   * Check if email exists (for frontend validation)
   */
  async checkEmailExists(req, res) {
    try {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const User = require('../models/User');
      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });

      res.json({
        success: true,
        exists: !!existingUser
      });

    } catch (error) {
      console.error('Check email exists error:', error);
      res.status(500).json({
        success: false,
        message: 'Unable to check email'
      });
    }
  }

  /**
   * Check if tax number exists (for frontend validation)
   */
  async checkTaxNumberExists(req, res) {
    try {
      const { taxNumber } = req.query;

      if (!taxNumber) {
        return res.status(400).json({
          success: false,
          message: 'Tax number is required'
        });
      }

      const User = require('../models/User');
      const existingUser = await User.findOne({ taxNumber: taxNumber.trim() });

      res.json({
        success: true,
        exists: !!existingUser
      });

    } catch (error) {
      console.error('Check tax number exists error:', error);
      res.status(500).json({
        success: false,
        message: 'Unable to check tax number'
      });
    }
  }

  /**
   * Update last login by user type
   */
  async updateLastLoginByType(userId, userType, req) {
    try {
      const Admin = require('../models/Admin');
      const User = require('../models/User');
      const Model = userType === "admin" ? Admin : User;
      await Model.findByIdAndUpdate(userId, {
        lastLoginAt: new Date(),
        lastLoginIP: req.ip,
        lastLoginUserAgent: req.get("User-Agent")
      });
    } catch (error) {
      console.error("Update last login error:", error);
    }
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return [
      { code: "uz", name: "O'zbekcha", flag: "🇺🇿" },
      { code: "en", name: "English", flag: "🇺🇸" },
      { code: "ru", name: "Русский", flag: "🇷🇺" },
      { code: "tr", name: "Türkçe", flag: "🇹🇷" },
      { code: "fa", name: "فارسی", flag: "🇮🇷" },
      { code: "zh", name: "中文", flag: "🇨🇳" }
    ];
  }

  /**
   * Rate limiting functions
   */

  isRateLimited(ip) {
    const now = Date.now();
    const attempts = this.loginAttempts.get(ip) || [];
    
    // Remove old attempts
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    this.loginAttempts.set(ip, recentAttempts);
    
    return recentAttempts.length >= this.maxAttempts;
  }

  recordFailedAttempt(ip) {
    const attempts = this.loginAttempts.get(ip) || [];
    attempts.push(Date.now());
    this.loginAttempts.set(ip, attempts);
  }

  clearFailedAttempts(ip) {
    this.loginAttempts.delete(ip);
  }

  /**
   * Increment login attempts in database
   */
  async incrementLoginAttempts(user, userType) {
    try {
      const Admin = require('../models/Admin');
      const User = require('../models/User');
      const Model = userType === "admin" ? Admin : User;
      const increment = { $inc: { loginAttempts: 1 } };

      // Lock account after 5 attempts for 30 minutes
      if ((user.loginAttempts || 0) + 1 >= 5) {
        increment.$set = {
          accountLockedUntil: Date.now() + 30 * 60 * 1000
        };
      }

      await Model.findByIdAndUpdate(user._id, increment);
    } catch (error) {
      console.error("Increment login attempts error:", error);
    }
  }

  /**
   * Reset login attempts in database
   */
  async resetLoginAttempts(user, userType) {
    try {
      const Admin = require('../models/Admin');
      const User = require('../models/User');
      const Model = userType === "admin" ? Admin : User;
      await Model.findByIdAndUpdate(user._id, {
        $unset: { loginAttempts: 1, accountLockedUntil: 1 }
      });
    } catch (error) {
      console.error("Reset login attempts error:", error);
    }
  }

  /**
   * Update last login information
   */
  async updateLastLogin(user, userType, req) {
    try {
      const Admin = require('../models/Admin');
      const User = require('../models/User');
      const Model = userType === "admin" ? Admin : User;
      await Model.findByIdAndUpdate(user._id, {
        lastLoginAt: new Date(),
        lastLoginIP: req.ip,
        lastLoginUserAgent: req.get("User-Agent")
      });
    } catch (error) {
      console.error("Update last login error:", error);
    }
  }

  /**
   * Email validation utility
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Helper Methods
  setUserSession(req, result, userType) {
    req.session.userId = result.userId;
    req.session.userType = userType;
    req.session.role = result.role;
    req.session.userName = result.name;
    req.session.userEmail = result.email;
    
    if (result.sessionToken) {
      req.session.sessionToken = result.sessionToken;
    }
  }

  getRedirectUrl(userType, role, companyType) {
    if (userType === 'admin') {
      return '/admin/dashboard';
    } else {
      // For company users, redirect based on company type
      if (companyType === 'manufacturer') {
        return '/manufacturer/dashboard';
      } else if (companyType === 'distributor') {
        // Redirect distributors to buyer profile page
        return '/buyer/profile';
      } else {
        return '/user/dashboard';
      }
    }
  }

  setRememberMeCookie(res, userId) {
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    res.cookie('rememberMe', userId, { 
      maxAge, 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production' 
    });
  }

  sendError(res, statusCode, message, errorType = 'general', data = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errorType,
      data
    });
  }

  handleLoginError(error, req, res) {
    console.error('Login error:', error);
    
    let statusCode = 401;
    let message = error.message;
    let errorType = 'general';

    // Safe translation function fallback
    const t = req.t || ((key) => key);

    // Handle specific error types
    if (error.type === 'blocked') {
      statusCode = 403;
      errorType = 'blocked';
      message = t('login.errors.accountBlocked');
    } else if (error.type === 'suspended') {
      statusCode = 403;
      errorType = 'suspended';
      message = t('login.errors.accountSuspended');
    } else if (error.message.includes('locked')) {
      statusCode = 423;
      errorType = 'locked';
      message = t('login.errors.accountLocked');
    } else if (error.message.includes('attempts')) {
      errorType = 'attempts';
      message = error.message;
    }

    this.sendError(res, statusCode, message, errorType, error.data);
  }
}

module.exports = AuthController;