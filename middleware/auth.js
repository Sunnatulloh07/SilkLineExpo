/**
 * Authentication Middleware
 * Handles authentication and authorization for routes
 */

const User = require('../models/User');
const Admin = require('../models/Admin');

/**
 * Check if user is authenticated
 */
const isAuthenticated = (userType = 'user') => {
  return async (req, res, next) => {
    try {
      const userId = req.session.userId;
      const sessionUserType = req.session.userType || 'user';

      // Check if session exists
      if (!userId) {
        return handleUnauthenticated(req, res, userType);
      }

      // Check if user type matches
      if (sessionUserType !== userType) {
        return handleUnauthenticated(req, res, userType);
      }

      let user;
      
      if (userType === 'admin') {
        user = await Admin.findById(userId).select('-password');
        
        // Verify session token for admins
        if (req.session.sessionToken && user && !user.isValidSession(req.session.sessionToken)) {
          req.session.destroy();
          return handleUnauthenticated(req, res, userType);
        }
      } else {
        user = await User.findById(userId).select('-password');
      }

      if (!user) {
        req.session.destroy();
        return handleUnauthenticated(req, res, userType);
      }

      // Check account status
      if (userType === 'admin' && user.status !== 'active') {
        req.session.destroy();
        return handleUnauthenticated(req, res, userType, 'Account is inactive');
      }

      if (userType === 'user' && user.status !== 'active') {
        return handleAccountBlocked(req, res, user);
      }

      // Update last activity
      user.lastActivityAt = Date.now();
      await user.save();

      // Attach user to request
      req.user = user;
      req.userId = userId;
      req.userType = userType;

      next();

    } catch (error) {
      console.error('Authentication middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authentication error'
      });
    }
  };
};

/**
 * Check if user has specific permission (for admins)
 */
const hasPermission = (permission) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user || req.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied - Admin required'
        });
      }

      if (!user.hasPermission(permission)) {
        return res.status(403).json({
          success: false,
          message: `Access denied - ${permission} permission required`
        });
      }

      next();

    } catch (error) {
      console.error('Permission middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check error'
      });
    }
  };
};

/**
 * Check if user has specific role (for admins)
 */
const hasRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user || req.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied - Admin required'
        });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied - Required roles: ${allowedRoles.join(', ')}`
        });
      }

      next();

    } catch (error) {
      console.error('Role middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Role check error'
      });
    }
  };
};

/**
 * Optional authentication - doesn't block if not authenticated
 */
const optionalAuth = (userType = 'user') => {
  return async (req, res, next) => {
    try {
      const userId = req.session.userId;
      const sessionUserType = req.session.userType || 'user';

      if (userId && sessionUserType === userType) {
        let user;
        
        if (userType === 'admin') {
          user = await Admin.findById(userId).select('-password');
        } else {
          user = await User.findById(userId).select('-password');
        }

        if (user && (userType === 'admin' ? user.status === 'active' : user.status === 'active')) {
          req.user = user;
          req.userId = userId;
          req.userType = userType;
        }
      }

      next();

    } catch (error) {
      console.error('Optional auth middleware error:', error);
      next(); // Continue even if error
    }
  };
};

/**
 * Rate limiting middleware
 */
const rateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const key = req.ip + (req.session.userId || '');
    const now = Date.now();
    
    // Clean old entries
    for (const [k, v] of attempts.entries()) {
      if (now - v.firstAttempt > windowMs) {
        attempts.delete(k);
      }
    }
    
    const userAttempts = attempts.get(key);
    
    if (!userAttempts) {
      attempts.set(key, { count: 1, firstAttempt: now });
      return next();
    }
    
    if (userAttempts.count >= maxAttempts) {
      const timeLeft = Math.ceil((windowMs - (now - userAttempts.firstAttempt)) / 1000 / 60);
      return res.status(429).json({
        success: false,
        message: `Too many attempts. Try again in ${timeLeft} minutes.`,
        retryAfter: timeLeft
      });
    }
    
    userAttempts.count++;
    next();
  };
};

/**
 * Handle unauthenticated requests
 */
function handleUnauthenticated(req, res, userType, message = null) {
  const isApiRequest = req.path.startsWith('/api/') || req.xhr || req.headers.accept?.includes('application/json');
  
  if (isApiRequest) {
    return res.status(401).json({
      success: false,
      message: message || 'Authentication required',
      redirectUrl: '/login' // Unified login page
    });
  }
  
  // Redirect to unified login page
  return res.redirect('/login');
}

/**
 * Handle blocked account
 */
function handleAccountBlocked(req, res, user) {
  const isApiRequest = req.path.startsWith('/api/') || req.xhr || req.headers.accept?.includes('application/json');
  
  const blockInfo = {
    status: user.status,
    registrationDate: user.createdAt,
    message: getBlockMessage(user.status)
  };
  
  if (isApiRequest) {
    return res.status(403).json({
      success: false,
      message: blockInfo.message,
      errorType: 'blocked',
      data: blockInfo
    });
  }
  
  return res.render('pages/account-blocked', {
    title: 'Account Status',
    user,
    blockInfo
  });
}

/**
 * Get block message based on status
 */
function getBlockMessage(status) {
  const messages = {
    'blocked': 'Your account is pending admin approval. Please wait for approval.',
    'suspended': 'Your account has been suspended. Please contact support.',
    'rejected': 'Your account registration was rejected. Please contact support.'
  };
  
  return messages[status] || 'Account access restricted';
}

module.exports = {
  isAuthenticated,
  hasPermission,
  hasRole,
  optionalAuth,
  rateLimit
};