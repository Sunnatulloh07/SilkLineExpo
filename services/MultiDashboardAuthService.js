/**
 * Multi-Dashboard Authentication Service
 * Professional role-based authentication and routing system
 * Handles Admin (Super Admin/Admin) and User (Manufacturer/Distributor) authentication
 * Senior Software Engineer level implementation
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const TokenService = require('./TokenService');

class MultiDashboardAuthService {
    constructor() {
        this.logger = console;
        this.maxLoginAttempts = 5;
        this.lockTime = 15 * 60 * 1000; // 15 minutes
        this.rateLimitWindow = 15 * 60 * 1000; // 15 minutes
        this.maxAttemptsPerIP = 10;
        this.ipAttempts = new Map();
        
        // Dashboard routing configuration
        this.dashboardRoutes = {
            // Admin roles -> Super Admin Dashboard
            'super_admin': '/admin/dashboard',
            'admin': '/admin/dashboard',
            'moderator': '/admin/dashboard',
            
            // User roles with company type -> Specific Dashboards
            'manufacturer': '/manufacturer/dashboard',
            'distributor': '/distributor/dashboard'
        };

        // Initialize cleanup interval for IP attempts
        this.startCleanupInterval();
    }

    /**
     * Unified authentication for both Admin and User models
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {string} clientIP - Client IP address
     * @returns {Object} Authentication result with dashboard routing info
     */
    async authenticate(email, password, clientIP = '127.0.0.1') {
        try {
            this.logger.log(`🔐 Multi-dashboard auth attempt: ${email} from IP: ${clientIP}`);

            // Input validation
            const validation = this.validateInput(email, password);
            if (!validation.valid) {
                throw new Error(validation.message);
            }

            // Rate limiting check
            if (this.isIPRateLimited(clientIP)) {
                throw new Error('Too many authentication attempts from this IP. Please try again later.');
            }

            // Attempt authentication in both Admin and User collections
            const authResult = await this.attemptAuthentication(email, password);

            if (!authResult.success) {
                this.recordFailedAttempt(clientIP);
                throw new Error(authResult.message);
            }

            // Clear failed attempts on success
            this.clearIPAttempts(clientIP);

            // Determine dashboard route based on user type and role
            const dashboardRoute = this.getDashboardRoute(authResult.userData);

            // Generate authentication tokens
            const tokenPayload = this.createTokenPayload(authResult.userData, authResult.userType);
            const tokens = TokenService.generateTokenPair(tokenPayload);

            // Update last login information
            await this.updateLastLogin(authResult.userData, authResult.userType, clientIP);

            this.logger.log(`✅ Authentication successful: ${email} -> ${dashboardRoute}`);

            return {
                success: true,
                user: authResult.userData,
                userType: authResult.userType,
                role: authResult.userData.role,
                companyType: authResult.userData.companyType || null,
                dashboardRoute,
                tokens,
                message: 'Authentication successful'
            };

        } catch (error) {
            this.logger.error(`❌ Authentication failed for ${email}:`, error.message);
            return {
                success: false,
                message: error.message,
                code: this.getErrorCode(error.message)
            };
        }
    }

    /**
     * Validate input parameters
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Object} Validation result
     */
    validateInput(email, password) {
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

        return { valid: true };
    }

    /**
     * Attempt authentication in both Admin and User collections
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Object} Authentication result
     */
    async attemptAuthentication(email, password) {
        const normalizedEmail = email.toLowerCase().trim();
        
        try {
            // Priority 1: Check Admin collection first (Super Admin, Admin, Moderator)
            const adminResult = await this.authenticateAdmin(normalizedEmail, password);
            if (adminResult.success) {
                return adminResult;
            }

            // Priority 2: Check User collection (Company Admins - Manufacturer/Distributor)
            const userResult = await this.authenticateUser(normalizedEmail, password);
            if (userResult.success) {
                return userResult;
            }

            // If both fail, return generic error
            return {
                success: false,
                message: 'Invalid email or password'
            };

        } catch (error) {
            this.logger.error('❌ Authentication attempt error:', error);
            return {
                success: false,
                message: 'Authentication service temporarily unavailable'
            };
        }
    }

    /**
     * Authenticate against Admin collection
     * @param {string} email - Admin email
     * @param {string} password - Admin password
     * @returns {Object} Admin authentication result
     */
    async authenticateAdmin(email, password) {
        try {
            const admin = await Admin.findOne({ email }).select('+password');
            
            if (!admin) {
                return { success: false, message: 'Admin not found' };
            }

            // Check account status
            if (admin.status !== 'active') {
                let message;
                if (admin.status === 'pending') {
                    message = 'Admin hisobingiz hali tasdiqlanmagan. Super admin bilan bog\'laning.';
                } else if (admin.status === 'blocked') {
                    message = 'Admin hisobingiz bloklangan. Super admin bilan bog\'laning.';
                } else if (admin.status === 'suspended') {
                    message = 'Admin hisobingiz vaqtincha to\'xtatilgan. Super admin bilan bog\'laning.';
                } else {
                    message = `Admin hisobingiz holati: ${admin.status}. Super admin bilan bog'laning.`;
                }
                
                this.logger.warn(`🚫 Admin login blocked: ${email} - Status: ${admin.status}`);
                
                return {
                    success: false,
                    message,
                    code: 'ACCOUNT_INACTIVE',
                    status: admin.status
                };
            }

            // Check account lock
            if (this.isAccountLocked(admin)) {
                const lockTimeRemaining = Math.ceil((admin.accountLockedUntil - Date.now()) / (1000 * 60));
                return {
                    success: false,
                    message: `Admin account locked. Try again in ${lockTimeRemaining} minutes.`,
                    code: 'ACCOUNT_LOCKED'
                };
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, admin.password);
            if (!isPasswordValid) {
                await this.incrementLoginAttempts(admin, 'admin');
                return {
                    success: false,
                    message: 'Invalid email or password',
                    attempts: (admin.loginAttempts || 0) + 1
                };
            }

            // Reset login attempts on successful login
            if (admin.loginAttempts > 0) {
                await this.resetLoginAttempts(admin, 'admin');
            }

            this.logger.log(`✅ Admin authentication successful: ${email} (${admin.role})`);

            return {
                success: true,
                userData: admin.toObject(),
                userType: 'admin'
            };

        } catch (error) {
            this.logger.error('❌ Admin authentication error:', error);
            return {
                success: false,
                message: 'Admin authentication failed'
            };
        }
    }

    /**
     * Authenticate against User collection
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Object} User authentication result
     */
    async authenticateUser(email, password) {
        try {
            const user = await User.findOne({ email }).select('+password');
            
            if (!user) {
                return { success: false, message: 'User not found' };
            }

            // Check account status
            if (user.status !== 'active') {
                let message;
                if (user.status === 'pending') {
                    message = 'Hisobingiz hali tasdiqlanmagan. Admin tasdiqlashini kuting.';
                } else if (user.status === 'blocked') {
                    message = 'Hisobingiz bloklangan. Yordam uchun admin bilan bog\'laning.';
                } else if (user.status === 'suspended') {
                    message = 'Hisobingiz vaqtincha to\'xtatilgan. Yordam uchun admin bilan bog\'laning.';
                } else {
                    message = `Hisobingiz holati: ${user.status}. Admin bilan bog'laning.`;
                }
                
                this.logger.warn(`🚫 User login blocked: ${email} - Status: ${user.status}`);
                
                return {
                    success: false,
                    message,
                    code: `ACCOUNT_${user.status.toUpperCase()}`,
                    status: user.status
                };
            }

            // Check account lock
            if (this.isAccountLocked(user)) {
                const lockTimeRemaining = Math.ceil((user.accountLockedUntil - Date.now()) / (1000 * 60));
                return {
                    success: false,
                    message: `Account locked due to multiple failed attempts. Try again in ${lockTimeRemaining} minutes.`,
                    code: 'ACCOUNT_LOCKED'
                };
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                await this.incrementLoginAttempts(user, 'user');
                return {
                    success: false,
                    message: 'Invalid email or password',
                    attempts: (user.loginAttempts || 0) + 1
                };
            }

            // Reset login attempts on successful login
            if (user.loginAttempts > 0) {
                await this.resetLoginAttempts(user, 'user');
            }

            this.logger.log(`✅ User authentication successful: ${email} (${user.companyType})`);

            return {
                success: true,
                userData: user.toObject(),
                userType: 'user'
            };

        } catch (error) {
            this.logger.error('❌ User authentication error:', error);
            return {
                success: false,
                message: 'User authentication failed'
            };
        }
    }

    /**
     * Determine dashboard route based on user type and role
     * @param {Object} userData - User data object
     * @returns {string} Dashboard route path
     */
    getDashboardRoute(userData) {
        // For admin users: route based on role
        if (userData.role && ['super_admin', 'admin', 'moderator'].includes(userData.role)) {
            return this.dashboardRoutes[userData.role];
        }

        // For company admin users: route based on company type
        if (userData.companyType && ['manufacturer', 'distributor'].includes(userData.companyType)) {
            return this.dashboardRoutes[userData.companyType];
        }

        // Fallback to general user dashboard
        this.logger.warn(`⚠️ Unknown user type/role for routing: ${JSON.stringify({
            role: userData.role,
            companyType: userData.companyType
        })}`);
        
        return '/dashboard'; // Generic fallback
    }

    /**
     * Create JWT token payload
     * @param {Object} userData - User data
     * @param {string} userType - 'admin' or 'user'
     * @returns {Object} Token payload
     */
    createTokenPayload(userData, userType) {
        const basePayload = {
            userId: userData._id.toString(),
            userType,
            role: userData.role,
            email: userData.email,
            name: userData.name || userData.companyName,
            permissions: userData.permissions || []
        };

        // Add additional fields for company users
        if (userType === 'user') {
            basePayload.companyType = userData.companyType;
            basePayload.companyName = userData.companyName;
            basePayload.companyId = userData._id.toString();
        }

        return basePayload;
    }

    /**
     * Update last login information
     * @param {Object} userData - User data
     * @param {string} userType - 'admin' or 'user'
     * @param {string} clientIP - Client IP address
     */
    async updateLastLogin(userData, userType, clientIP) {
        try {
            const updateData = {
                lastLoginAt: new Date(),
                lastLoginIP: clientIP,
                $inc: { 'activity.totalLogins': 1 }
            };

            if (userType === 'admin') {
                await Admin.findByIdAndUpdate(userData._id, updateData);
            } else {
                await User.findByIdAndUpdate(userData._id, updateData);
            }
        } catch (error) {
            this.logger.error('❌ Update last login error:', error);
            // Don't throw error for login tracking failure
        }
    }

    /**
     * Check if account is locked
     * @param {Object} user - User or Admin object
     * @returns {boolean} Is account locked
     */
    isAccountLocked(user) {
        return user.loginAttempts >= this.maxLoginAttempts && 
               user.accountLockedUntil && 
               user.accountLockedUntil > Date.now();
    }

    /**
     * Increment login attempts and lock account if necessary
     * @param {Object} user - User or Admin object
     * @param {string} userType - 'admin' or 'user'
     */
    async incrementLoginAttempts(user, userType) {
        try {
            const updates = {
                $inc: { loginAttempts: 1 }
            };

            // Lock account if max attempts reached
            if (user.loginAttempts + 1 >= this.maxLoginAttempts) {
                updates.accountLockedUntil = Date.now() + this.lockTime;
            }

            if (userType === 'admin') {
                await Admin.findByIdAndUpdate(user._id, updates);
            } else {
                await User.findByIdAndUpdate(user._id, updates);
            }
        } catch (error) {
            this.logger.error('❌ Increment login attempts error:', error);
        }
    }

    /**
     * Reset login attempts
     * @param {Object} user - User or Admin object
     * @param {string} userType - 'admin' or 'user'
     */
    async resetLoginAttempts(user, userType) {
        try {
            const updates = {
                $unset: {
                    loginAttempts: 1,
                    accountLockedUntil: 1
                }
            };

            if (userType === 'admin') {
                await Admin.findByIdAndUpdate(user._id, updates);
            } else {
                await User.findByIdAndUpdate(user._id, updates);
            }
        } catch (error) {
            this.logger.error('❌ Reset login attempts error:', error);
        }
    }

    /**
     * IP-based rate limiting
     * @param {string} clientIP - Client IP address
     * @returns {boolean} Is IP rate limited
     */
    isIPRateLimited(clientIP) {
        const now = Date.now();
        const attempts = this.ipAttempts.get(clientIP) || [];
        
        // Filter attempts within rate limit window
        const recentAttempts = attempts.filter(attempt => 
            now - attempt < this.rateLimitWindow
        );

        return recentAttempts.length >= this.maxAttemptsPerIP;
    }

    /**
     * Record failed attempt for IP
     * @param {string} clientIP - Client IP address
     */
    recordFailedAttempt(clientIP) {
        const now = Date.now();
        const attempts = this.ipAttempts.get(clientIP) || [];
        
        attempts.push(now);
        this.ipAttempts.set(clientIP, attempts);
    }

    /**
     * Clear IP attempts
     * @param {string} clientIP - Client IP address
     */
    clearIPAttempts(clientIP) {
        this.ipAttempts.delete(clientIP);
    }

    /**
     * Start cleanup interval for IP attempts
     */
    startCleanupInterval() {
        setInterval(() => {
            const now = Date.now();
            for (const [ip, attempts] of this.ipAttempts.entries()) {
                const recentAttempts = attempts.filter(attempt => 
                    now - attempt < this.rateLimitWindow
                );
                
                if (recentAttempts.length === 0) {
                    this.ipAttempts.delete(ip);
                } else {
                    this.ipAttempts.set(ip, recentAttempts);
                }
            }
        }, 5 * 60 * 1000); // Cleanup every 5 minutes
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} Is valid email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Get error code based on error message
     * @param {string} message - Error message
     * @returns {string} Error code
     */
    getErrorCode(message) {
        if (message.includes('rate limit') || message.includes('too many')) {
            return 'RATE_LIMITED';
        }
        if (message.includes('locked')) {
            return 'ACCOUNT_LOCKED';
        }
        if (message.includes('inactive') || message.includes('suspended') || message.includes('blocked')) {
            return 'ACCOUNT_INACTIVE';
        }
        if (message.includes('pending')) {
            return 'ACCOUNT_PENDING';
        }
        if (message.includes('invalid') || message.includes('not found')) {
            return 'INVALID_CREDENTIALS';
        }
        return 'AUTHENTICATION_FAILED';
    }

    /**
     * Get user info by ID for token refresh
     * @param {string} userId - User ID
     * @param {string} userType - 'admin' or 'user'
     * @returns {Object} User data
     */
    async getUserById(userId, userType) {
        try {
            let user;
            if (userType === 'admin') {
                user = await Admin.findById(userId).select('-password');
            } else {
                user = await User.findById(userId).select('-password');
            }

            if (!user || user.status !== 'active') {
                return null;
            }

            return user;
        } catch (error) {
            this.logger.error('❌ Get user by ID error:', error);
            return null;
        }
    }

    /**
     * Get dashboard configuration for user
     * @param {Object} userData - User data
     * @param {string} userType - 'admin' or 'user'
     * @returns {Object} Dashboard configuration
     */
    getDashboardConfig(userData, userType) {
        const config = {
            dashboardRoute: this.getDashboardRoute(userData),
            userType,
            role: userData.role,
            permissions: userData.permissions || [],
            features: []
        };

        // Add type-specific configurations
        if (userType === 'admin') {
            config.features = [
                'user_management',
                'admin_management',
                'reports',
                'system_settings',
                'content_management'
            ];
        } else if (userData.companyType === 'manufacturer') {
            config.features = [
                'production_management',
                'product_development',
                'distribution_network',
                'sales_analytics',
                'operations_management'
            ];
            config.companyType = userData.companyType;
            config.companyName = userData.companyName;
        } else if (userData.companyType === 'distributor') {
            config.features = [
                'inventory_management',
                'supplier_network',
                'sales_channels',
                'order_management',
                'market_analytics'
            ];
            config.companyType = userData.companyType;
            config.companyName = userData.companyName;
        }

        return config;
    }
}

// Export singleton instance
module.exports = new MultiDashboardAuthService();