/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */

const AuthService = require('../services/AuthService');
const FileService = require('../services/FileService');

class AuthController {
  /**
   * Show registration page
   */
  async showRegisterPage(req, res) {
    try {
      res.render('pages/register', {
        title: req.t('register.title'),
        error: null,
        formData: {}
      });
    } catch (error) {
      console.error('Show register page error:', error);
      res.status(500).render('pages/error', {
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
        title: t('login.title'),
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

      // Register user through service
      const result = await AuthService.registerCompanyAdmin(userData, logoFile);

      // Success response
      res.status(201).json({
        success: true,
        message: req.t('register.success'),
        data: {
          userId: result.userId,
          companyName: result.companyName,
          email: result.email,
          status: result.status
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific error types
      let statusCode = 400;
      let message = error.message;

      if (error.code === 11000) {
        // MongoDB duplicate key error
        if (error.keyPattern?.email) {
          message = req.t('register.errors.emailExists');
        } else if (error.keyPattern?.taxNumber) {
          message = req.t('register.errors.taxNumberExists');
        } else {
          message = req.t('register.errors.duplicateData');
        }
      } else if (error.name === 'ValidationError') {
        // Mongoose validation error
        const validationErrors = Object.values(error.errors).map(err => err.message);
        message = validationErrors.join(', ');
      } else if (error.message.includes('file') || error.message.includes('upload')) {
        // File upload error
        statusCode = 413; // Payload too large
      }

      res.status(statusCode).json({
        success: false,
        message: message,
        errors: error.errors || null
      });
    }
  }

  /**
   * Unified Login Handler - Detects user type automatically
   */
  async login(req, res) {
    try {
      const {email, identifier, password, rememberMe, csrfToken } = req.body;

      // Validate CSRF token
      if (csrfToken && req.session.csrfToken && req.session.csrfToken !== csrfToken) {
        return this.sendError(res, 403, 'Invalid security token. Please refresh the page.');
      }

      // Clear CSRF token after validation
      if (req.session.csrfToken) {
        delete req.session.csrfToken;
      }

      // Validate input
      if (!identifier || !password) {
        const t = req.t || ((key) => key);
        return this.sendError(res, 400, t('login.errors.requiredFields'));
      }

      // Auto-detect user type and login through service
      const result = await AuthService.unifiedLogin(identifier, password, rememberMe);

      // Set session based on detected user type
      this.setUserSession(req, result, result.userType);

      // Set remember me cookie if requested
      if (rememberMe) {
        this.setRememberMeCookie(res, result.userId);
      }

      // Determine redirect URL based on role
      const redirectUrl = this.getRedirectUrl(result.userType, result.role);

      // Success response
      const t = req.t || ((key) => key);
      
      res.json({
        success: true,
        message: t('login.success'),
        data: {
          userId: result.userId,
          name: result.name,
          email: result.email,
          role: result.role,
          userType: result.userType,
          status: result.status,
          redirectUrl: redirectUrl
        }
      });

    } catch (error) {
      this.handleLoginError(error, req, res);
    }
  }

  /**
   * Legacy admin login (for backward compatibility)
   */
  async adminLogin(req, res) {
    // Redirect to unified login
    req.body.identifier = req.body.email;
    return this.login(req, res);
  }

  /**
   * Handle user logout
   */
  async logout(req, res) {
    try {
      const userId = req.session.userId;
      const userType = req.session.userType || 'user';

      if (userId) {
        await AuthService.logout(userId, userType);
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

      // Check if it's an AJAX/API request
      const isApiRequest = req.xhr || req.headers.accept?.includes('application/json') || req.path.startsWith('/api/');
      
      if (isApiRequest) {
        return res.json({
          success: true,
          message: req.t('auth.logoutSuccess'),
          redirectUrl: '/login'
        });
      }

      // For regular browser requests, redirect directly
      return res.redirect('/login?message=logged_out');

    } catch (error) {
      console.error('Logout error:', error);
      
      const isApiRequest = req.xhr || req.headers.accept?.includes('application/json') || req.path.startsWith('/api/');
      
      if (isApiRequest) {
        return res.status(500).json({
          success: false,
          message: req.t('auth.logoutError')
        });
      }
      
      return res.redirect('/login?error=logout_failed');
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

  getRedirectUrl(userType, role) {
    if (userType === 'admin') {
      return '/admin/dashboard';
    } else {
      // Company admin users go to user dashboard
      return '/user/dashboard';
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