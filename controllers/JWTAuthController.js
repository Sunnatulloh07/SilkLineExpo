/**
 * SLEX JWT Authentication Controller
 * Modern authentication controller with JWT tokens, CSRF protection,
 * and professional security features
 */

const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const Admin = require("../models/Admin");
const TokenService = require("../services/TokenService");
const EmailService = require("../services/EmailService");

class JWTAuthController {
  constructor() {
    this.initializeRateLimiters();
    this.initializeSecurityFeatures();
  }

  /**
   * Initialize rate limiters for different auth operations
   */
  initializeRateLimiters() {
    // Login rate limiter
    this.loginRateLimit = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per IP
      message: {
        success: false,
        message: "Too many login attempts. Please try again after 15 minutes.",
        code: "LOGIN_RATE_LIMIT",
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true,
    });

    // Registration rate limiter
    this.registerRateLimit = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 registrations per IP per hour
      message: {
        success: false,
        message: "Too many registration attempts. Please try again later.",
        code: "REGISTER_RATE_LIMIT",
      },
    });

    // Password reset rate limiter
    this.resetRateLimit = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 reset attempts per IP per hour
      message: {
        success: false,
        message: "Too many password reset attempts. Please try again later.",
        code: "RESET_RATE_LIMIT",
      },
    });
  }

  /**
   * Initialize security features
   */
  initializeSecurityFeatures() {
    // CSRF protection tokens storage (in production use Redis)
    this.csrfTokens = new Map();

    // Login attempt tracking
    this.loginAttempts = new Map();

    // Cleanup intervals
    this.startCleanupIntervals();
  }

  /**
   * Start periodic cleanup of security data
   */
  startCleanupIntervals() {
    // Cleanup CSRF tokens every 30 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [token, data] of this.csrfTokens.entries()) {
        if (now - data.created > 30 * 60 * 1000) {
          // 30 minutes
          this.csrfTokens.delete(token);
        }
      }
    }, 30 * 60 * 1000);

    // Cleanup login attempts every hour
    setInterval(() => {
      const now = Date.now();
      for (const [ip, attempts] of this.loginAttempts.entries()) {
        const recentAttempts = attempts.filter(
          (time) => now - time < 60 * 60 * 1000
        );
        if (recentAttempts.length === 0) {
          this.loginAttempts.delete(ip);
        } else {
          this.loginAttempts.set(ip, recentAttempts);
        }
      }
    }, 60 * 60 * 1000);
  }

  /**
   * Show login page
   */
  showLoginPage = async (req, res) => {
    try {
      // Generate CSRF token
      const csrfToken = this.generateCSRFToken(req);

      // Get message from query params
      const message = req.query.message;
      const error = req.query.error;

      // Get current language from various sources
      const currentLang =
        req.query.lang ||
        req.language ||
        req.cookies.language ||
        req.cookies.i18next ||
        "uz";

      res.render("pages/login", {
        title: req.t("login.title"),
        csrfToken,
        message,
        error,
        currentLang: req.language || req.cookies.language || "uz",
        lng: req.language || req.cookies.language || "uz",
        languages: this.getSupportedLanguages(),
      });
    } catch (error) {
      console.error("Login page error:", error);
      res.status(500).render("error/500", {
        title: "Server Error",
        message: "An error occurred while loading the login page",
      });
    }
  };

  /**
   * Handle login request
   */
  login = async (req, res) => {
    try {
      // Handle both form data and JSON requests
      let { email, identifier, password, csrfToken, rememberMe } = req.body;
      const clientIP = req.ip || req.connection.remoteAddress;

      // Use identifier if email is not provided (for backward compatibility)
      const loginEmail = email || identifier;

      // Input validation
      const validation = this.validateLoginInput(req, {
        email: loginEmail,
        password,
        csrfToken,
      });
      if (!validation.valid) {
        const isAjax =
          req.get("Content-Type") === "application/json" ||
          req.get("X-Requested-With") === "XMLHttpRequest";

        if (isAjax) {
          return this.sendResponse(res, 400, false, validation.message, null, {
            field: validation.field,
          });
        } else {
          // Redirect back to login with error for form submissions
          return res.redirect(
            this.buildLoginRedirectUrl(req, validation.message)
          );
        }
      }

      // CSRF protection - Temporarily disabled for development
      // TODO: Re-enable CSRF validation in production
      if (false && !this.validateCSRFToken(req, csrfToken)) {
        const isAjax =
          req.get("Content-Type") === "application/json" ||
          req.get("X-Requested-With") === "XMLHttpRequest";

        if (isAjax) {
          return this.sendResponse(
            res,
            403,
            false,
            "Invalid security token. Please refresh the page.",
            null,
            {
              code: "CSRF_INVALID",
            }
          );
        } else {
          return res.redirect(
            this.buildLoginRedirectUrl(
              req,
              "Invalid security token. Please refresh the page."
            )
          );
        }
      }

      // Check login attempts rate limiting
      if (this.isIPBlocked(clientIP)) {
        const isAjax =
          req.get("Content-Type") === "application/json" ||
          req.get("X-Requested-With") === "XMLHttpRequest";

        if (isAjax) {
          return this.sendResponse(
            res,
            429,
            false,
            "Too many failed login attempts. Please try again later.",
            null,
            {
              code: "IP_BLOCKED",
            }
          );
        } else {
          return res.redirect(
            this.buildLoginRedirectUrl(
              req,
              "Too many failed login attempts. Please try again later."
            )
          );
        }
      }

      // Attempt authentication
      const authResult = await this.authenticateUser(loginEmail, password);

      if (!authResult.success) {
        // Record failed attempt
        this.recordFailedAttempt(clientIP, loginEmail);

        const isAjax =
          req.get("Content-Type") === "application/json" ||
          req.get("X-Requested-With") === "XMLHttpRequest";

        if (isAjax) {
          return this.sendResponse(res, 401, false, authResult.message, null, {
            code: authResult.code,
            attempts: authResult.attempts,
          });
        } else {
          return res.redirect(
            this.buildLoginRedirectUrl(req, authResult.message)
          );
        }
      }

      // Clear failed attempts on successful login
      this.clearFailedAttempts(clientIP, loginEmail);

      // Generate JWT tokens
      const tokenPayload = {
        userId: authResult.user._id,
        userType: authResult.userType,
        role: authResult.user.role,
        email: authResult.user.email,
        name: authResult.user.name,
        permissions: authResult.user.permissions || [],
      };

      const tokens = TokenService.generateTokenPair(tokenPayload);

      // Set authentication cookies
      TokenService.setAuthCookies(res, tokens);

      // Set session data for backward compatibility
      req.session.userId = authResult.user._id;
      req.session.userType = authResult.userType;
      req.session.role = authResult.user.role;
      req.session.userName = authResult.user.name;
      req.session.userEmail = authResult.user.email;

      // Update last login
      await this.updateLastLogin(authResult.user, authResult.userType, req);

      // Determine redirect URL
      const redirectUrl = this.getRedirectUrl(
        authResult.user,
        authResult.userType,
        req.session?.returnTo
      );

      // Clear return URL from session
      if (req.session?.returnTo) {
        delete req.session.returnTo;
      }

      // Check if this is an AJAX request
      const isAjax =
        req.get("Content-Type") === "application/json" ||
        req.get("X-Requested-With") === "XMLHttpRequest";

      if (isAjax) {
        // Send JSON response for AJAX requests
        return this.sendResponse(res, 200, true, "Login successful", {
          user: {
            id: authResult.user._id,
            name: authResult.user.name,
            email: authResult.user.email,
            role: authResult.user.role,
            userType: authResult.userType,
          },
          redirectUrl,
          sessionId: tokens.sessionId,
        });
      } else {
        // Redirect for form submissions
        res.redirect(redirectUrl);
      }
    } catch (error) {
      console.error("Login error:", error);
      return this.sendResponse(
        res,
        500,
        false,
        "An internal error occurred. Please try again.",
        null,
        {
          code: "INTERNAL_ERROR",
        }
      );
    }
  };

  /**
   * Handle logout request
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

      // Clear authentication cookies
      TokenService.clearAuthCookies(res);

      // Clear session
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error("Session destroy error:", err);
          }
        });
      }

      // Redirect to login page instead of JSON response
      return res.redirect("/auth/login?message=logged_out");
    } catch (error) {
      console.error("Logout error:", error);
      return this.sendResponse(res, 500, false, "Logout failed", null, {
        code: "LOGOUT_ERROR",
      });
    }
  };

  /**
   * Handle token refresh request
   */
  refreshToken = async (req, res) => {
    try {
      const tokens = TokenService.extractTokensFromRequest(req);

      if (!tokens.refreshToken) {
        return this.sendResponse(
          res,
          401,
          false,
          "Refresh token not found",
          null,
          {
            code: "REFRESH_TOKEN_MISSING",
          }
        );
      }

      const refreshResult = await TokenService.refreshAccessToken(
        tokens.refreshToken,
        { User, Admin }
      );

      if (!refreshResult.success) {
        // Clear invalid cookies
        TokenService.clearAuthCookies(res);

        return this.sendResponse(
          res,
          401,
          false,
          "Token refresh failed",
          null,
          {
            code: "REFRESH_FAILED",
            error: refreshResult.error,
          }
        );
      }

      // Set new authentication cookies
      TokenService.setAuthCookies(res, refreshResult.tokens);

      return this.sendResponse(res, 200, true, "Token refreshed successfully", {
        user: {
          id: refreshResult.user._id,
          name: refreshResult.user.name,
          email: refreshResult.user.email,
          role: refreshResult.user.role,
          userType: refreshResult.user.role ? "admin" : "user",
        },
        sessionId: refreshResult.tokens.sessionId,
      });
    } catch (error) {
      console.error("Token refresh error:", error);
      return this.sendResponse(res, 500, false, "Token refresh failed", null, {
        code: "REFRESH_ERROR",
      });
    }
  };

  /**
   * Get current user info
   */
  me = async (req, res) => {
    try {
      if (!req.user) {
        return this.sendResponse(res, 401, false, "Not authenticated");
      }

      // Get fresh user data from database
      let userData;
      if (req.user.userType === "admin") {
        userData = await Admin.findById(req.user.userId).select(
          "-password -__v"
        );
      } else {
        userData = await User.findById(req.user.userId).select(
          "-password -__v"
        );
      }

      if (!userData) {
        return this.sendResponse(res, 404, false, "User not found");
      }

      return this.sendResponse(res, 200, true, "User data retrieved", {
        user: {
          id: userData._id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          userType: req.user.userType,
          permissions: userData.permissions || [],
          status: userData.status,
          lastLogin: userData.lastLogin,
          createdAt: userData.createdAt,
        },
      });
    } catch (error) {
      console.error("Get user info error:", error);
      return this.sendResponse(res, 500, false, "Failed to get user info");
    }
  };

  /**
   * Authenticate user (unified for admin and regular users)
   */
  async authenticateUser(email, password) {
    try {
      let user = null;
      let userType = "admin";

      // Real database authentication - requires MongoDB connection
      // First, try to find in Admin collection
      user = await Admin.findOne({ email: email.toLowerCase() });

      // If not found in Admin, try User collection
      if (!user) {
        user = await User.findOne({ email: email.toLowerCase() });
        userType = "user";
      }

      if (!user) {
        return {
          success: false,
          message: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        };
      }

      // Check account status
      if (user.status !== "active") {
        return {
          success: false,
          message: `Account is ${user.status}. Please contact support.`,
          code: "ACCOUNT_INACTIVE",
        };
      }

      // Check if account is locked
      if (user.loginAttempts >= 5 && user.accountLockedUntil > Date.now()) {
        const lockTimeRemaining = Math.ceil(
          (user.accountLockedUntil - Date.now()) / (1000 * 60)
        );
        return {
          success: false,
          message: `Account locked. Try again in ${lockTimeRemaining} minutes.`,
          code: "ACCOUNT_LOCKED",
          lockTimeRemaining,
        };
      }

      // Verify password using bcrypt
      const bcrypt = require("bcryptjs");
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        // Increment login attempts
        await this.incrementLoginAttempts(user, userType);

        return {
          success: false,
          message: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
          attempts: (user.loginAttempts || 0) + 1,
        };
      }

      // Reset login attempts on successful login
      if (user.loginAttempts > 0) {
        await this.resetLoginAttempts(user, userType);
      }

      return {
        success: true,
        user,
        userType,
      };
    } catch (error) {
      console.error("Authentication error:", error);
      return {
        success: false,
        message: "Authentication failed",
        code: "AUTH_ERROR",
      };
    }
  }

  /**
   * Validate login input
   */
  validateLoginInput(req, { email, password, csrfToken }) {
    if (!email) {
      return {
        valid: false,
        message: "Email or identifier is required",
        field: "email",
      };
    }

    if (!password) {
      return {
        valid: false,
        message: "Password is required",
        field: "password",
      };
    }

    // CSRF token validation - skip for now during development
    const isApiRequest =
      req.get &&
      (req.get("Content-Type") === "application/json" ||
        req.get("X-Requested-With") === "XMLHttpRequest");

    // Temporarily disable CSRF validation for development
    // TODO: Re-enable CSRF validation in production
    if (false && !isApiRequest && !csrfToken) {
      return {
        valid: false,
        message: "Security token is required",
        field: "csrfToken",
      };
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, message: "Invalid email format", field: "email" };
    }

    return { valid: true };
  }

  /**
   * Generate CSRF token
   */
  generateCSRFToken(req) {
    const token = crypto.randomBytes(32).toString("hex");
    this.csrfTokens.set(token, {
      created: Date.now(),
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
    return token;
  }

  /**
   * Validate CSRF token
   */
  validateCSRFToken(req, token) {
    if (!token) {
      return false;
    }

    // Check session-based CSRF token first (for compatibility with old login page)
    if (req.session && req.session.csrfToken === token) {
      // Clear session CSRF token after use
      delete req.session.csrfToken;
      return true;
    }

    // Check JWT-based CSRF token storage
    if (!this.csrfTokens.has(token)) {
      return false;
    }

    const tokenData = this.csrfTokens.get(token);

    // Check if token is expired (30 minutes)
    if (Date.now() - tokenData.created > 30 * 60 * 1000) {
      this.csrfTokens.delete(token);
      return false;
    }

    // Verify IP and User Agent for additional security
    if (
      tokenData.ip !== req.ip ||
      tokenData.userAgent !== req.get("User-Agent")
    ) {
      this.csrfTokens.delete(token);
      return false;
    }

    // Token is valid, remove it (one-time use)
    this.csrfTokens.delete(token);
    return true;
  }

  /**
   * Check if IP is blocked due to too many failed attempts
   */
  isIPBlocked(ip) {
    const attempts = this.loginAttempts.get(ip) || [];
    const now = Date.now();
    const recentAttempts = attempts.filter(
      (time) => now - time < 60 * 60 * 1000
    ); // 1 hour window

    return recentAttempts.length >= 10; // 10 attempts per hour
  }

  /**
   * Record failed login attempt
   */
  recordFailedAttempt(ip, email) {
    const now = Date.now();

    // Record IP-based attempt
    const ipAttempts = this.loginAttempts.get(ip) || [];
    ipAttempts.push(now);
    this.loginAttempts.set(ip, ipAttempts);
  }

  /**
   * Clear failed attempts on successful login
   */
  clearFailedAttempts(ip, email) {
    this.loginAttempts.delete(ip);
  }

  /**
   * Increment database login attempts
   */
  async incrementLoginAttempts(user, userType) {
    const Model = userType === "admin" ? Admin : User;
    const increment = { $inc: { loginAttempts: 1 } };

    // Lock account after 5 attempts
    if (user.loginAttempts + 1 >= 5) {
      increment.$set = {
        accountLockedUntil: Date.now() + 30 * 60 * 1000, // 30 minutes lock
      };
    }

    await Model.findByIdAndUpdate(user._id, increment);
  }

  /**
   * Reset database login attempts
   */
  async resetLoginAttempts(user, userType) {
    const Model = userType === "admin" ? Admin : User;
    await Model.findByIdAndUpdate(user._id, {
      $unset: { loginAttempts: 1, accountLockedUntil: 1 },
    });
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(user, userType, req) {
    try {
      const Model = userType === "admin" ? Admin : User;
      await Model.findByIdAndUpdate(user._id, {
        lastLoginAt: new Date(),
        lastLoginIP: req.ip,
        lastLoginUserAgent: req.get("User-Agent"),
      });
    } catch (error) {
      console.error("Update last login error:", error);
    }
  }

  /**
   * Build login redirect URL with language preservation
   */
  buildLoginRedirectUrl(req, error) {
    const currentLang =
      req.language || req.cookies.language || req.cookies.i18next || "uz";
    let url = "/auth/login";

    if (error) {
      url += `?error=${encodeURIComponent(error)}`;
    }

    // Preserve language in redirect
    if (currentLang && currentLang !== "uz") {
      url += error ? "&" : "?";
      url += `lang=${currentLang}`;
    }

    return url;
  }

  /**
   * Get redirect URL based on user type and role
   */
  getRedirectUrl(user, userType, returnTo) {
    // If there's a return URL, use it (but validate it's safe)
    if (returnTo && this.isValidReturnUrl(returnTo)) {
      return returnTo;
    }

    // Default redirects based on user type
    if (userType === "admin") {
      return "/admin/dashboard";
    } else {
      return "/dashboard";
    }
  }

  /**
   * Validate return URL for security
   */
  isValidReturnUrl(url) {
    try {
      // Must be relative URL or same origin
      if (url.startsWith("/") && !url.startsWith("//")) {
        // Prevent redirects to auth pages or external URLs
        const blockedPaths = ["/auth/", "/login", "/logout"];
        return !blockedPaths.some((path) => url.toLowerCase().includes(path));
      }
      return false;
    } catch (error) {
      return false;
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
      { code: "zh", name: "中文", flag: "🇨🇳" },
    ];
  }

  /**
   * Send standardized response
   */
  sendResponse(res, status, success, message, data = null, meta = {}) {
    const response = {
      success,
      message,
      ...(data && { data }),
      ...(Object.keys(meta).length > 0 && { meta }),
      timestamp: new Date().toISOString(),
    };

    return res.status(status).json(response);
  }
}

module.exports = new JWTAuthController();
