/**
 * Optional JWT Authentication Middleware
 * Sets currentUser if authenticated, but doesn't block if not authenticated
 * Used for public pages that need to show user state
 */

const TokenService = require('../services/TokenService');
const User = require('../models/User');
const Admin = require('../models/Admin');

class OptionalJWTAuthMiddleware {
    constructor() {

    }

    /**
     * Optional authentication middleware
     * Checks for JWT tokens and sets req.user and res.locals.currentUser if valid
     * Continues regardless of authentication status
     */
    async optionalAuth(req, res, next) {
        try {
            // Extract tokens from request
            const tokens = TokenService.extractTokensFromRequest(req);
          
            
            if (!tokens.accessToken) {
                // No token, continue as anonymous user
                req.user = null;
                res.locals.currentUser = null;
                res.locals.currentUserRole = null;
                return next();
            }

            // Verify access token
            const verification = TokenService.verifyAccessToken(tokens.accessToken);
             
            if (!verification.valid) {
               // Token invalid, try refresh if available
                if (tokens.refreshToken) {
                    try {
                        const refreshResult = await this.tryRefreshToken(req, res, tokens.refreshToken);
                        if (refreshResult.success) {
                            req.user = refreshResult.user;
                            res.locals.currentUser = refreshResult.user;
                            res.locals.currentUserRole = this.getUserRole(refreshResult.user);
                           return next();
                        }
                    } catch (refreshError) {
                        console.log('❌ Refresh error:', refreshError.message);
                    }
                } else {
                    console.log('❌ No refresh token available');
                }
                
                // Clear invalid cookies
                TokenService.clearAuthCookies(res);
                req.user = null;
                res.locals.currentUser = null;
                res.locals.currentUserRole = null;
                return next();
            }

            // Token is valid, get user data
            try {
                 const userData = await this.getUserFromPayload(verification.payload);
                
                if (userData) {
                    // Set user data in request and response locals
                    req.user = userData;
                    res.locals.currentUser = userData;
                    res.locals.currentUserRole = this.getUserRole(userData);
                  
                } else {
                    // User not found in database
                    TokenService.clearAuthCookies(res);
                    req.user = null;
                    res.locals.currentUser = null;
                    res.locals.currentUserRole = null;
                }
            } catch (userError) {
               req.user = null;
                res.locals.currentUser = null;
                res.locals.currentUserRole = null;
            }

            next();

        } catch (error) {
           
            // On any error, continue as anonymous user
            req.user = null;
            res.locals.currentUser = null;
            res.locals.currentUserRole = null;
            next();
        }
    }

    /**
     * Try to refresh tokens
     */
    async tryRefreshToken(req, res, refreshToken) {
        try {
            const refreshResult = await TokenService.refreshAccessToken(refreshToken, { User, Admin });
            
            if (refreshResult.success) {
                // Set new cookies
                TokenService.setAuthCookies(res, refreshResult.tokens);
                
                return {
                    success: true,
                    user: refreshResult.user
                };
            }
            
            return { success: false };
        } catch (error) {
            console.error('❌ Token refresh error in optional auth:', error);
            return { success: false };
        }
    }

    /**
     * Get user data from JWT payload
     */
    async getUserFromPayload(payload) {
        try {
            let userData;
            
            if (payload.userType === 'admin') {
                userData = await Admin.findById(payload.userId)
                    .select('-password -__v')
                    .lean();
            } else {
                userData = await User.findById(payload.userId)
                    .select('-password -__v')
                    .lean();
            }

            if (!userData) {
                return null;
            }

            // Check if user is active
            if (userData.status !== 'active') {
                return null;
            }

            // Enhance user data with JWT payload info
            userData.userType = payload.userType;
            userData.role = payload.role || userData.role;
            userData.companyType = payload.companyType || userData.companyType;
            userData.permissions = payload.permissions || userData.permissions || [];
            
            // Ensure userId field exists for consistency
            userData.userId = userData._id;

            return userData;

        } catch (error) {
            console.error('❌ Error getting user from payload:', error);
            return null;
        }
    }

    /**
     * Determine user role for template logic
     */
    getUserRole(user) {
        if (!user) return null;
        
        if (user.userType === 'admin') {
            return user.role; // 'super_admin', 'admin', 'moderator'
        }
        
        if (user.companyType === 'manufacturer') {
            return 'manufacturer';
        }
        
        return 'buyer'; // distributor, importer, etc.
    }
}

const middleware = new OptionalJWTAuthMiddleware();
module.exports = {
    optionalAuth: middleware.optionalAuth.bind(middleware)
};
