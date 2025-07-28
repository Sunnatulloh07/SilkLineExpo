/**
 * Admin Routes - Clean Architecture
 * Separated UI and API routes with proper middleware
 */

const express = require('express');
const mongoose = require('mongoose');
const AdminControllerClass = require('../controllers/AdminController');
const { authenticate, adminOnly } = require('../middleware/jwtAuth');

// Create instance of AdminController and bind methods
const AdminController = new AdminControllerClass();

// Bind all methods to preserve 'this' context
const boundMethods = {
  showDashboard: AdminController.showDashboard.bind(AdminController),
  showPendingApprovals: AdminController.showPendingApprovals.bind(AdminController),
  showAnalytics: AdminController.showAnalytics.bind(AdminController),
  getDashboardStats: AdminController.getDashboardStats.bind(AdminController),
  getPendingApprovals: AdminController.getPendingApprovals.bind(AdminController),
  getUserDetails: AdminController.getUserDetails.bind(AdminController),
  approveUser: AdminController.approveUser.bind(AdminController),
  rejectUser: AdminController.rejectUser.bind(AdminController),
  deleteUser: AdminController.deleteUser.bind(AdminController),
  bulkApproveUsers: AdminController.bulkApproveUsers.bind(AdminController),
  bulkRejectUsers: AdminController.bulkRejectUsers.bind(AdminController),
  getMessages: AdminController.getMessages.bind(AdminController),
  getNotifications: AdminController.getNotifications.bind(AdminController),
  markMessageAsRead: AdminController.markMessageAsRead.bind(AdminController),
  markNotificationAsRead: AdminController.markNotificationAsRead.bind(AdminController),
  changeLanguage: AdminController.changeLanguage.bind(AdminController),
  getRecentActivity: AdminController.getRecentActivity.bind(AdminController),
  exportDashboardData: AdminController.exportDashboardData.bind(AdminController),
  getAnalyticsOverview: AdminController.getAnalyticsOverview.bind(AdminController),
  getRevenueAnalytics: AdminController.getRevenueAnalytics.bind(AdminController),
  getUserAnalytics: AdminController.getUserAnalytics.bind(AdminController),
  getProductAnalytics: AdminController.getProductAnalytics.bind(AdminController),
  getGeographicAnalytics: AdminController.getGeographicAnalytics.bind(AdminController),
  getRealtimeAnalytics: AdminController.getRealtimeAnalytics.bind(AdminController),
  showAllUsers: AdminController.showAllUsers.bind(AdminController),
  getAllUsersAPI: AdminController.getAllUsersAPI.bind(AdminController),
  showProducts: AdminController.showProducts.bind(AdminController),
  getAllProductsAPI: AdminController.getAllProductsAPI.bind(AdminController),
  updateProductStatus: AdminController.updateProductStatus.bind(AdminController),
  bulkUpdateProducts: AdminController.bulkUpdateProducts.bind(AdminController),
  exportProducts: AdminController.exportProducts.bind(AdminController),
  showCompanies: AdminController.showCompanies.bind(AdminController),
  getAllCompaniesAPI: AdminController.getAllCompaniesAPI.bind(AdminController),
  blockUser: AdminController.blockUser.bind(AdminController),
  unblockUser: AdminController.unblockUser.bind(AdminController),
  suspendUser: AdminController.suspendUser.bind(AdminController),
  activateUser: AdminController.activateUser.bind(AdminController),
  restoreUser: AdminController.restoreUser.bind(AdminController),
  permanentDeleteUser: AdminController.permanentDeleteUser.bind(AdminController),
  updateUser: AdminController.updateUser.bind(AdminController),
  exportUsers: AdminController.exportUsers.bind(AdminController)
};

const router = express.Router();

// Apply JWT authentication to all admin routes
router.use(authenticate);
router.use(adminOnly);

// ===== UI ROUTES =====
router.get('/dashboard', boundMethods.showDashboard);
router.get('/analytics', boundMethods.showAnalytics);
router.get('/pending-approvals', boundMethods.showPendingApprovals);
router.get('/users', boundMethods.showAllUsers);
router.get('/products', boundMethods.showProducts);
router.get('/companies', boundMethods.showCompanies);
// router.get('/users/:userId', AdminController.showUserDetails); // To be implemented
// router.get('/settings', AdminController.showSettings); // To be implemented

// ===== API ROUTES =====
// Dashboard APIs
router.get('/api/dashboard-stats', boundMethods.getDashboardStats);
router.get('/api/recent-activity', boundMethods.getRecentActivity);
router.post('/api/export-dashboard-data', boundMethods.exportDashboardData);

// Analytics APIs - Real Database Integration
const analyticsRouter = require('./api/analytics');
router.use('/api/analytics', analyticsRouter);

// User Management APIs
router.get('/api/pending-approvals', boundMethods.getPendingApprovals);
router.get('/api/users', boundMethods.getAllUsersAPI);
router.get('/api/products', boundMethods.getAllProductsAPI);
router.post('/api/products/:productId/status', boundMethods.updateProductStatus);
router.post('/api/products/bulk', boundMethods.bulkUpdateProducts);
router.get('/api/products/export', boundMethods.exportProducts);
router.get('/api/users/:userId', boundMethods.getUserDetails);

// Company Management APIs
router.get('/api/companies', boundMethods.getAllCompaniesAPI);

// User Actions APIs (with validation)
router.post('/api/users/:userId/approve', 
  AdminControllerClass.getUserValidationRules(), 
  boundMethods.approveUser
);
router.post('/api/users/:userId/reject', 
  AdminControllerClass.getRejectValidationRules(), 
  boundMethods.rejectUser
);
router.delete('/api/users/:userId/delete', 
  AdminControllerClass.getUserValidationRules(), 
  boundMethods.deleteUser
);
router.get('/api/users/:userId/details', 
  AdminControllerClass.getUserValidationRules(), 
  boundMethods.getUserDetails
);

// Enhanced User Management APIs - CRITICAL MISSING ENDPOINTS
router.post('/api/users/:userId/block', 
  AdminControllerClass.getUserValidationRules(), 
  boundMethods.blockUser
);
router.post('/api/users/:userId/unblock', 
  AdminControllerClass.getUserValidationRules(), 
  boundMethods.unblockUser
);
router.post('/api/users/:userId/suspend', 
  AdminControllerClass.getUserValidationRules(), 
  boundMethods.suspendUser
);
router.post('/api/users/:userId/activate', 
  AdminControllerClass.getUserValidationRules(), 
  boundMethods.activateUser
);
router.post('/api/users/:userId/restore', 
  AdminControllerClass.getUserValidationRules(), 
  boundMethods.restoreUser
);
router.delete('/api/users/:userId/permanent-delete', 
  AdminControllerClass.getUserValidationRules(), 
  boundMethods.permanentDeleteUser
);
router.put('/api/users/:userId/update', 
  AdminControllerClass.getUserUpdateValidationRules(), 
  boundMethods.updateUser
);

// Export APIs
router.get('/api/users/export', boundMethods.exportUsers);

// Activity & Filters APIs (commented out - to be implemented later)
// router.get('/api/recent-activity', AdminController.getRecentActivity);

// Messages & Notifications APIs - Enhanced
router.get('/api/messages', boundMethods.getMessages);
router.get('/api/notifications', boundMethods.getNotifications);
router.get('/api/notifications/check', (req, res) => {
  // Simple endpoint to prevent 404 errors
  res.json({ 
    success: true, 
    hasNew: false, 
    count: 0,
    timestamp: new Date().toISOString()
  });
});

// Data.json endpoint for admin dashboard
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
// router.post('/api/messages/:messageId/read', AdminController.markMessageRead); // To be implemented
// router.post('/api/notifications/:notificationId/read', AdminController.markNotificationRead); // To be implemented
// router.post('/api/messages/mark-all-read', AdminController.markAllMessagesRead); // To be implemented
// router.post('/api/notifications/mark-all-read', AdminController.markAllNotificationsRead); // To be implemented

// Bulk Operations APIs (with validation)
router.post('/api/users/bulk-approve', 
  AdminControllerClass.getBulkValidationRules(), 
  boundMethods.bulkApproveUsers
);
router.post('/api/users/bulk-reject', 
  AdminControllerClass.getBulkValidationRules(), 
  boundMethods.bulkRejectUsers
);

// Language change
router.post('/set-language', (req, res) => {
  const { language, source } = req.body;
  
  // Validate language
  const supportedLanguages = ['uz', 'en', 'ru', 'tr', 'fa', 'zh'];
  if (!supportedLanguages.includes(language)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Unsupported language',
      supported: supportedLanguages 
    });
  }
  
  try {
    // Set i18next language for current request
    if (req.i18n && req.i18n.changeLanguage) {
      req.i18n.changeLanguage(language);
    }
    
    // Set language in session for server-side rendering
    req.session.language = language;
    
    // Set persistent cookie for client-side
    res.cookie('selectedLanguage', language, {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    // Also set i18next cookie for consistency
    res.cookie('i18next', language, {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
      
    res.json({ 
      success: true, 
      language,
      message: `Language successfully changed to ${language}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Language change error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to change language',
      details: error.message 
    });
  }
});

// Super Admin Only APIs (commented out - to be implemented later)
// router.post('/api/users/:userId/suspend', AdminController.suspendUser);
// router.post('/api/users/:userId/reactivate', AdminController.reactivateUser);

module.exports = router;