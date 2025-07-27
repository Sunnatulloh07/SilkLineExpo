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
  getAnalyticsOverview: AdminController.getAnalyticsOverview.bind(AdminController),
  getRevenueAnalytics: AdminController.getRevenueAnalytics.bind(AdminController),
  getUserAnalytics: AdminController.getUserAnalytics.bind(AdminController),
  getProductAnalytics: AdminController.getProductAnalytics.bind(AdminController),
  getGeographicAnalytics: AdminController.getGeographicAnalytics.bind(AdminController),
  getRealtimeAnalytics: AdminController.getRealtimeAnalytics.bind(AdminController)
};

const router = express.Router();

// Apply JWT authentication to all admin routes
router.use(authenticate);
router.use(adminOnly);

// ===== UI ROUTES =====
router.get('/dashboard', boundMethods.showDashboard);
router.get('/analytics', boundMethods.showAnalytics);
router.get('/pending-approvals', boundMethods.showPendingApprovals);
// router.get('/users', AdminController.showAllUsers); // To be implemented
// router.get('/users/:userId', AdminController.showUserDetails); // To be implemented
// router.get('/settings', AdminController.showSettings); // To be implemented

// ===== API ROUTES =====
// Dashboard APIs
router.get('/api/dashboard-stats', boundMethods.getDashboardStats);

// Analytics APIs
router.get('/api/analytics/overview', boundMethods.getAnalyticsOverview);
router.get('/api/analytics/revenue', boundMethods.getRevenueAnalytics);
router.get('/api/analytics/users', boundMethods.getUserAnalytics);
router.get('/api/analytics/products', boundMethods.getProductAnalytics);
router.get('/api/analytics/geographic', boundMethods.getGeographicAnalytics);
router.get('/api/analytics/realtime', boundMethods.getRealtimeAnalytics);

// User Management APIs
router.get('/api/pending-approvals', boundMethods.getPendingApprovals);
// router.get('/api/users', AdminController.getAllUsers); // To be implemented
router.get('/api/users/:userId', boundMethods.getUserDetails);

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