/**
 * Global Badge Middleware - Professional Implementation
 * Fetches badge counts for authenticated users and makes them available to all templates
 */

const BuyerService = require('../services/BuyerService');

/**
 * Badge middleware that fetches counts for all pages
 * Only fetches data for authenticated buyers/distributors/customers
 */
const badgeMiddleware = async (req, res, next) => {
    // Silent operation - no logging for production
    
    try {
        // Initialize badge counts to 0
        res.locals.cartItemsCount = 0;
        res.locals.activeOrdersCount = 0;
        res.locals.unreadMessagesCount = 0;
        res.locals.favoritesCount = 0;

        // Check if user is authenticated - try JWT tokens first
        let user = req.user || req.session?.user || res.locals.currentUser;
        
                 // If no user found, try to decode JWT tokens from cookies
         if (!user && req.cookies?.accessToken) {
           try {
             const TokenService = require('../services/TokenService');
             const verification = TokenService.verifyAccessToken(req.cookies.accessToken);
             
             if (verification.valid) {
               const User = require('../models/User');
               user = await User.findById(verification.payload.userId).select('-password');
               
               if (user) {
                 req.user = user;
                 res.locals.currentUser = user;
               }
              } else if (req.cookies?.refreshToken) {
                try {
                  const refreshVerification = TokenService.verifyRefreshToken(req.cookies.refreshToken);
                  if (refreshVerification.valid) {
                    const User = require('../models/User');
                    user = await User.findById(refreshVerification.payload.userId).select('-password');
                    
                    if (user) {
                      req.user = user;
                      res.locals.currentUser = user;
                      
                      // Generate new access token with proper payload
                      const tokenPayload = {
                        userId: user._id.toString(),
                        userType: user.role || 'user',
                        role: user.role,
                        email: user.email,
                        name: user.name || user.companyName,
                        companyType: user.companyType,
                        companyName: user.companyName,
                        companyId: user.companyId,
                        permissions: user.permissions || []
                      };
                      const newAccessToken = TokenService.generateAccessToken(tokenPayload);
                      res.cookie('accessToken', newAccessToken.token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'strict',
                        maxAge: 15 * 60 * 1000 // 15 minutes
                      });
                    }
                  }
                } catch (refreshError) {
                  // Silent error handling
                }
              }
           } catch (error) {
             // Silent error handling
           }
         }
        
                          if (!user || !user._id) {
             return next();
         }

         // Only fetch for buyer-type users (distributor, buyer, customer)
         const allowedCompanyTypes = ['distributor', 'buyer', 'customer'];
         const allowedRoles = ['distributor', 'buyer', 'customer'];
         
         // Check both companyType and role
         const isAllowedUser = allowedCompanyTypes.includes(user.companyType) || 
                              allowedRoles.includes(user.role);
         
         if (!isAllowedUser) {
             return next();
         }

        // Create BuyerService instance
        const buyerService = new BuyerService();
        
        // Fetch all badge counts in parallel for performance
        const [
            cartItemsCount,
            activeOrdersCount, 
            unreadMessagesCount,
            favoriteItems
        ] = await Promise.all([
            buyerService.getCartItemsCount(user._id).catch(() => 0),
            buyerService.getActiveOrdersCount(user._id).catch(() => 0),
            buyerService.getUnreadMessagesCount(user._id).catch(() => 0),
            buyerService.getFavoriteItems(user._id).catch(() => [])
        ]);

        // Set badge counts in res.locals so all templates can access them
        res.locals.cartItemsCount = cartItemsCount || 0;
        res.locals.activeOrdersCount = activeOrdersCount || 0;
        res.locals.unreadMessagesCount = unreadMessagesCount || 0;
        res.locals.favoritesCount = favoriteItems?.length || 0;
        
                 // Badge counts set silently
        
    } catch (error) {
        // Set defaults on error (silent failure)
        res.locals.cartItemsCount = 0;
        res.locals.activeOrdersCount = 0;
        res.locals.unreadMessagesCount = 0;
        res.locals.favoritesCount = 0;
    }
    
    next();
};

module.exports = badgeMiddleware;
