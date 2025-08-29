/**
 * SLEX Token Service - JWT Token Management
 * Professional JWT-based authentication with access and refresh tokens
 * Secure cookie handling and token validation
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class TokenService {
    constructor() {
        // JWT Secrets from environment variables
        this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || this.generateSecureSecret();
        this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || this.generateSecureSecret();
        
        // Token expiration times - FIXED: Professional token lifecycle
        this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '1h'; // 1 hour for better UX
        this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '30d'; // 30 days for better UX
        
        // Cookie settings
        this.cookieOptions = {
            httpOnly: false, // Allow JavaScript access for API calls
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined,
            // Add maxAge for token cookies - FIXED: Mos holatda
            maxAge: {
                access: 60 * 60 * 1000, // 1 hour 
                refresh: 30 * 24 * 60 * 60 * 1000, // 30 days
                session: 30 * 24 * 60 * 60 * 1000  // 30 days
            }
        };
        
        // Token blacklist for logout (in production use Redis)
        this.tokenBlacklist = new Set();
        
        // Rate limiting for token generation
        this.tokenGenerationAttempts = new Map();
        this.maxTokenAttempts = 5;
        this.tokenAttemptWindow = 15 * 60 * 1000; // 15 minutes
    }

    /**
     * Generate secure random secret
     */
    generateSecureSecret() {
        return crypto.randomBytes(64).toString('hex');
    }

    /**
     * Generate access token
     */
    generateAccessToken(payload) {
        try {
            // Validate payload
            if (!payload || !payload.userId || !payload.userType) {
                throw new Error('Invalid token payload');
            }

            // Check rate limiting
            this.checkTokenGenerationRateLimit(payload.userId);

            // Create access token payload with all user fields
            const accessPayload = {
                userId: payload.userId,
                userType: payload.userType, // 'admin' or 'user'
                role: payload.role,
                email: payload.email,
                name: payload.name,
                permissions: payload.permissions || [],
                
                // Company-specific fields (for company users)
                companyType: payload.companyType,
                companyName: payload.companyName,
                companyId: payload.companyId,
                
                // JWT standard fields
                sessionId: this.generateSessionId(),
                iat: Math.floor(Date.now() / 1000),
                tokenType: 'access'
            };

           
            // Generate token
            const token = jwt.sign(accessPayload, this.accessTokenSecret, {
                expiresIn: this.accessTokenExpiry,
                issuer: 'slex-platform',
                audience: 'slex-users'
            });

            return {
                token,
                expiresIn: this.accessTokenExpiry,
                sessionId: accessPayload.sessionId
            };
        } catch (error) {
            throw new Error(`Access token generation failed: ${error.message}`);
        }
    }

    /**
     * Generate refresh token
     */
    generateRefreshToken(payload) {
        try {
            // Validate payload
            if (!payload || !payload.userId || !payload.userType) {
                throw new Error('Invalid token payload');
            }

            // Create refresh token payload
            const refreshPayload = {
                userId: payload.userId,
                userType: payload.userType,
                sessionId: payload.sessionId || this.generateSessionId(),
                iat: Math.floor(Date.now() / 1000),
                tokenType: 'refresh',
                tokenVersion: payload.tokenVersion || 1 // For token invalidation
            };

            // Generate token
            const token = jwt.sign(refreshPayload, this.refreshTokenSecret, {
                expiresIn: this.refreshTokenExpiry,
                issuer: 'slex-platform',
                audience: 'slex-users'
            });

            return {
                token,
                expiresIn: this.refreshTokenExpiry,
                sessionId: refreshPayload.sessionId
            };
        } catch (error) {
            throw new Error(`Refresh token generation failed: ${error.message}`);
        }
    }

    /**
     * Generate both access and refresh tokens
     */
    generateTokenPair(payload) {
        try {
            const sessionId = this.generateSessionId();
            const tokenPayload = { ...payload, sessionId };

            const accessToken = this.generateAccessToken(tokenPayload);
            const refreshToken = this.generateRefreshToken({
                ...tokenPayload,
                sessionId: accessToken.sessionId
            });

            return {
                accessToken: accessToken.token,
                refreshToken: refreshToken.token,
                sessionId: accessToken.sessionId,
                expiresIn: {
                    access: this.accessTokenExpiry,
                    refresh: this.refreshTokenExpiry
                }
            };
        } catch (error) {
            throw new Error(`Token pair generation failed: ${error.message}`);
        }
    }

    /**
     * Verify access token
     */
    verifyAccessToken(token) {
        try {
            if (!token) {
                throw new Error('Token is required');
            }

            // Check if token is blacklisted
            if (this.isTokenBlacklisted(token)) {
                throw new Error('Token has been invalidated');
            }

            // Verify token
            const decoded = jwt.verify(token, this.accessTokenSecret, {
                issuer: 'slex-platform',
                audience: 'slex-users'
            });

            // Validate token type
            if (decoded.tokenType !== 'access') {
                throw new Error('Invalid token type');
            }

            return {
                valid: true,
                payload: decoded,
                expired: false
            };
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return {
                    valid: false,
                    payload: null,
                    expired: true,
                    error: 'Token expired'
                };
            }

            return {
                valid: false,
                payload: null,
                expired: false,
                error: error.message
            };
        }
    }

    /**
     * Verify refresh token
     */
    verifyRefreshToken(token) {
        try {
            if (!token) {
                throw new Error('Refresh token is required');
            }

            // Check if token is blacklisted
            if (this.isTokenBlacklisted(token)) {
                throw new Error('Refresh token has been invalidated');
            }

            // Verify token
            const decoded = jwt.verify(token, this.refreshTokenSecret, {
                issuer: 'slex-platform',
                audience: 'slex-users'
            });

            // Validate token type
            if (decoded.tokenType !== 'refresh') {
                throw new Error('Invalid token type');
            }

            return {
                valid: true,
                payload: decoded,
                expired: false
            };
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return {
                    valid: false,
                    payload: null,
                    expired: true,
                    error: 'Refresh token expired'
                };
            }

            return {
                valid: false,
                payload: null,
                expired: false,
                error: error.message
            };
        }
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(refreshToken, userModel) {
        try {
            // Verify refresh token
            const refreshResult = this.verifyRefreshToken(refreshToken);
            
            if (!refreshResult.valid) {
                throw new Error(`Invalid refresh token: ${refreshResult.error}`);
            }

            const { payload } = refreshResult;

            // Get fresh user data from database
            let userData;
            if (payload.userType === 'admin') {
                userData = await userModel.Admin.findById(payload.userId).select('-password');
            } else {
                userData = await userModel.User.findById(payload.userId).select('-password');
            }

            if (!userData) {
                throw new Error('User not found');
            }

            // Check if user is still active
            if (userData.status !== 'active') {
                throw new Error('User account is not active');
            }

            // Generate new token pair with complete payload
            const tokenPayload = {
                userId: userData._id,
                userType: payload.userType,
                role: userData.role,
                email: userData.email,
                name: userData.name || userData.companyName,
                permissions: userData.permissions || []
            };

            // CRITICAL: Add company-specific fields for company users
            if (payload.userType === 'user') {
                tokenPayload.companyType = userData.companyType;
                tokenPayload.companyName = userData.companyName;
                tokenPayload.companyId = userData._id.toString();
            }

            const newTokens = this.generateTokenPair(tokenPayload);

            // Blacklist old refresh token
            this.blacklistToken(refreshToken);

            return {
                success: true,
                tokens: newTokens,
                user: userData,
                userType: payload.userType // Return original userType from token
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
                error: error.message
            };
        }
    }

    /**
     * Set authentication cookies
     */
    setAuthCookies(res, tokens) {
        try {
                       
            // Access token cookie - JWT expiry bilan mos kelishi uchun
            res.cookie('accessToken', tokens.accessToken, {
                ...this.cookieOptions,
                maxAge: this.cookieOptions.maxAge.access // ✅ 1 soat
            });

            // Refresh token cookie - JWT expiry bilan mos kelishi uchun
            res.cookie('refreshToken', tokens.refreshToken, {
                ...this.cookieOptions,
                maxAge: this.cookieOptions.maxAge.refresh // ✅ 30 kun
            });

            // Session ID cookie - refresh token bilan bir xil
            res.cookie('sessionId', tokens.sessionId, {
                ...this.cookieOptions,
                maxAge: this.cookieOptions.maxAge.session // ✅ 30 kun
            });

             return true;
        } catch (error) {
            throw new Error(`Failed to set auth cookies: ${error.message}`);
        }
    }

    /**
     * Clear authentication cookies
     */
    clearAuthCookies(res) {
        try {
            // For clearCookie, we only need path and domain, not maxAge
            const clearOptions = {
                httpOnly: this.cookieOptions.httpOnly,
                secure: this.cookieOptions.secure,
                sameSite: this.cookieOptions.sameSite,
                path: this.cookieOptions.path || '/'
            };
            
            res.clearCookie('accessToken', clearOptions);
            res.clearCookie('refreshToken', clearOptions);
            res.clearCookie('sessionId', clearOptions);
            return true;
        } catch (error) {
            throw new Error(`Failed to clear auth cookies: ${error.message}`);
        }
    }

    /**
     * Extract tokens from request - Enhanced with debugging
     */
    extractTokensFromRequest(req) {
        const tokens = {
            accessToken: req.cookies?.accessToken || 
                        req.headers.authorization?.replace('Bearer ', ''),
            refreshToken: req.cookies?.refreshToken,
            sessionId: req.cookies?.sessionId
        };
        

        
        return tokens;
    }

    /**
     * Blacklist token (for logout)
     */
    blacklistToken(token) {
        try {
            // In production, use Redis for token blacklisting
            this.tokenBlacklist.add(token);
            
            // Auto-cleanup after token expiry (7 days for refresh tokens)
            setTimeout(() => {
                this.tokenBlacklist.delete(token);
            }, 7 * 24 * 60 * 60 * 1000);
            
            return true;
        } catch (error) {
            throw new Error(`Failed to blacklist token: ${error.message}`);
        }
    }

    /**
     * Check if token is blacklisted
     */
    isTokenBlacklisted(token) {
        return this.tokenBlacklist.has(token);
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Check rate limiting for token generation
     */
    checkTokenGenerationRateLimit(userId) {
        const now = Date.now();
        const attempts = this.tokenGenerationAttempts.get(userId) || [];
        
        // Remove old attempts
        const recentAttempts = attempts.filter(time => now - time < this.tokenAttemptWindow);
        
        if (recentAttempts.length >= this.maxTokenAttempts) {
            throw new Error('Too many token generation attempts. Please try again later.');
        }
        
        // Add current attempt
        recentAttempts.push(now);
        this.tokenGenerationAttempts.set(userId, recentAttempts);
    }

    /**
     * Validate token payload structure
     */
    validateTokenPayload(payload) {
        const requiredFields = ['userId', 'userType'];
        const validUserTypes = ['admin', 'user'];
        
        for (const field of requiredFields) {
            if (!payload[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        if (!validUserTypes.includes(payload.userType)) {
            throw new Error(`Invalid user type: ${payload.userType}`);
        }
        
        return true;
    }

    /**
     * Get token information without verification
     */
    decodeToken(token) {
        try {
            return jwt.decode(token);
        } catch (error) {
            return null;
        }
    }

    /**
     * Clean up expired token attempts
     */
    cleanupTokenAttempts() {
        const now = Date.now();
        
        for (const [userId, attempts] of this.tokenGenerationAttempts.entries()) {
            const recentAttempts = attempts.filter(time => now - time < this.tokenAttemptWindow);
            
            if (recentAttempts.length === 0) {
                this.tokenGenerationAttempts.delete(userId);
            } else {
                this.tokenGenerationAttempts.set(userId, recentAttempts);
            }
        }
    }

    /**
     * Initialize periodic cleanup
     */
    startCleanupInterval() {
        // Cleanup every 15 minutes
        setInterval(() => {
            this.cleanupTokenAttempts();
        }, 15 * 60 * 1000);
    }
}

module.exports = new TokenService();