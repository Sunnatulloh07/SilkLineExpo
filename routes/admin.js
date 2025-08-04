/**
 * Admin Routes - Clean Architecture
 * Separated UI and API routes with proper middleware
 */

const express = require('express');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const AdminControllerClass = require('../controllers/AdminController');
const CategoryControllerClass = require('../controllers/CategoryController');
const { authenticate, adminOnly } = require('../middleware/jwtAuth');
const { 
    adminOnly: enhancedAdminOnly, 
    preventCrossDashboardAccess,
    validateAdminApiAccess,
    setSecurityHeaders 
} = require('../middleware/dashboardSecurity');

// Validation error handling middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      })),
      timestamp: new Date().toISOString()
    });
  }
  next();
};

// Create instance of AdminController and bind methods
const AdminController = new AdminControllerClass();
const CategoryController = new CategoryControllerClass();

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
  bulkBlockUsers: AdminController.bulkBlockUsers.bind(AdminController),
  bulkSuspendUsers: AdminController.bulkSuspendUsers.bind(AdminController),
  bulkActivateUsers: AdminController.bulkActivateUsers.bind(AdminController),
  bulkDeleteUsers: AdminController.bulkDeleteUsers.bind(AdminController),
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
  exportUsers: AdminController.exportUsers.bind(AdminController),
  getProductStatistics: AdminController.getProductStatistics.bind(AdminController),
  
  // Category Management Methods
  showCategories: CategoryController.showCategories.bind(CategoryController),
  getAllCategoriesAPI: CategoryController.getAllCategoriesAPI.bind(CategoryController),
  getCategoryStatistics: CategoryController.getCategoryStatistics.bind(CategoryController),
  createCategory: CategoryController.createCategory.bind(CategoryController),
  updateCategory: CategoryController.updateCategory.bind(CategoryController),
  deleteCategory: CategoryController.deleteCategory.bind(CategoryController),
  getCategoryHierarchy: CategoryController.getCategoryHierarchy.bind(CategoryController),
  bulkUpdateCategories: CategoryController.bulkUpdateCategories.bind(CategoryController),
  exportCategories: CategoryController.exportCategories.bind(CategoryController),
  getCategoryAnalytics: CategoryController.getCategoryAnalytics.bind(CategoryController),

  // Orders Management Methods
  showOrders: AdminController.showOrders.bind(AdminController),
  getOrdersAPI: AdminController.getOrdersAPI.bind(AdminController),
  getOrdersStatisticsAPI: AdminController.getOrdersStatisticsAPI.bind(AdminController),
  getOrderDetailsAPI: AdminController.getOrderDetailsAPI.bind(AdminController),
  updateOrderStatusAPI: AdminController.updateOrderStatusAPI.bind(AdminController),
  bulkOrderActionAPI: AdminController.bulkOrderActionAPI.bind(AdminController),
  exportOrdersAPI: AdminController.exportOrdersAPI.bind(AdminController),

  // Settings Management Methods
  showSettings: AdminController.showSettings.bind(AdminController),
  getSettingsAPI: AdminController.getSettingsAPI.bind(AdminController),
  updateSettingAPI: AdminController.updateSettingAPI.bind(AdminController),
  bulkUpdateSettingsAPI: AdminController.bulkUpdateSettingsAPI.bind(AdminController),
  resetSettingAPI: AdminController.resetSettingAPI.bind(AdminController),
  getSettingHistoryAPI: AdminController.getSettingHistoryAPI.bind(AdminController),
  exportSettingsAPI: AdminController.exportSettingsAPI.bind(AdminController),
  initializeDefaultSettingsAPI: AdminController.initializeDefaultSettingsAPI.bind(AdminController),
  validateSettingAPI: AdminController.validateSettingAPI.bind(AdminController),
  
  // Profile Management Methods
  showProfile: AdminController.showProfile.bind(AdminController),
  getAdminProfile: AdminController.getAdminProfile.bind(AdminController),
  updateAdminProfile: AdminController.updateAdminProfile.bind(AdminController),
  changeAdminPassword: AdminController.changeAdminPassword.bind(AdminController),
  changeAdminPicture: AdminController.changeAdminPicture.bind(AdminController),
  getAdminStats: AdminController.getAdminStats.bind(AdminController),
  getAdminActivity: AdminController.getAdminActivity.bind(AdminController),
  getAdminSessions: AdminController.getAdminSessions.bind(AdminController),
  terminateAdminSession: AdminController.terminateAdminSession.bind(AdminController),
  getAdminSecurity: AdminController.getAdminSecurity.bind(AdminController),
  setupAdmin2FA: AdminController.setupAdmin2FA.bind(AdminController),
  verifyAdmin2FA: AdminController.verifyAdmin2FA.bind(AdminController),
  toggleAdmin2FA: AdminController.toggleAdmin2FA.bind(AdminController),
  exportAdminProfile: AdminController.exportAdminProfile.bind(AdminController),
  updateAdminPreferences: AdminController.updateAdminPreferences.bind(AdminController)
};

const router = express.Router();

// Apply JWT authentication to all admin routes
// Enhanced security middleware for admin dashboard
router.use(setSecurityHeaders);
router.use(enhancedAdminOnly);
router.use(preventCrossDashboardAccess);

// Backward compatibility middleware
router.use(authenticate);
router.use(adminOnly);

// ===== UI ROUTES =====
router.get('/dashboard', boundMethods.showDashboard);
router.get('/analytics', boundMethods.showAnalytics);
router.get('/pending-approvals', boundMethods.showPendingApprovals);
router.get('/users', boundMethods.showAllUsers);
router.get('/products', boundMethods.showProducts);
router.get('/orders', boundMethods.showOrders);
router.get('/companies', boundMethods.showCompanies);
router.get('/categories', boundMethods.showCategories);
router.get('/settings', boundMethods.showSettings);
router.get('/profile', boundMethods.showProfile);
// router.get('/users/:userId', AdminController.showUserDetails); // To be implemented

// ===== API ROUTES =====

// Profile Management API Routes
router.get('/api/profile', authenticate, adminOnly, enhancedAdminOnly, boundMethods.getAdminProfile);

router.put('/api/profile', authenticate, adminOnly, enhancedAdminOnly, boundMethods.updateAdminProfile);

router.post('/api/profile/change-password', authenticate, adminOnly, enhancedAdminOnly, boundMethods.changeAdminPassword);

router.post('/api/profile/change-picture', authenticate, adminOnly, enhancedAdminOnly, boundMethods.changeAdminPicture);

router.get('/api/profile/stats', authenticate, adminOnly, enhancedAdminOnly, boundMethods.getAdminStats);

router.get('/api/profile/activity', authenticate, adminOnly, enhancedAdminOnly, boundMethods.getAdminActivity);

router.get('/api/profile/sessions', authenticate, adminOnly, enhancedAdminOnly, boundMethods.getAdminSessions);

router.delete('/api/profile/sessions/:sessionId', authenticate, adminOnly, enhancedAdminOnly, boundMethods.terminateAdminSession);

router.get('/api/profile/security', authenticate, adminOnly, enhancedAdminOnly, boundMethods.getAdminSecurity);

router.post('/api/profile/setup-2fa', authenticate, adminOnly, enhancedAdminOnly, boundMethods.setupAdmin2FA);

router.post('/api/profile/verify-2fa', authenticate, adminOnly, enhancedAdminOnly, boundMethods.verifyAdmin2FA);

router.post('/api/profile/toggle-2fa', authenticate, adminOnly, enhancedAdminOnly, boundMethods.toggleAdmin2FA);

router.get('/api/profile/export', authenticate, adminOnly, enhancedAdminOnly, boundMethods.exportAdminProfile);
router.post('/api/profile/preferences', authenticate, adminOnly, enhancedAdminOnly, boundMethods.updateAdminPreferences);
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
// Products Management APIs with validation
router.get('/api/products', boundMethods.getAllProductsAPI);
router.get('/api/products/statistics', boundMethods.getProductStatistics);
router.post('/api/products/:productId/status', 
  AdminControllerClass.getProductValidationRules(), 
  boundMethods.updateProductStatus
);
router.post('/api/products/bulk', 
  AdminControllerClass.getBulkProductValidationRules(), 
  boundMethods.bulkUpdateProducts
);
router.get('/api/products/export', boundMethods.exportProducts);
router.get('/api/users/:userId', boundMethods.getUserDetails);

// Orders Management APIs with validation
router.get('/api/orders', boundMethods.getOrdersAPI);
router.get('/api/orders/statistics', boundMethods.getOrdersStatisticsAPI);
router.get('/api/orders/:orderId', 
  AdminControllerClass.getOrderDetailsValidationRules(), 
  handleValidationErrors,
  boundMethods.getOrderDetailsAPI
);
router.patch('/api/orders/:orderId/status', 
  AdminControllerClass.getOrderStatusUpdateValidationRules(), 
  handleValidationErrors,
  boundMethods.updateOrderStatusAPI
);
router.post('/api/orders/bulk', 
  AdminControllerClass.getBulkOrderValidationRules(), 
  handleValidationErrors,
  boundMethods.bulkOrderActionAPI
);
router.get('/api/orders/export', boundMethods.exportOrdersAPI);

// Company Management APIs
router.get('/api/companies', boundMethods.getAllCompaniesAPI);

// Category Management APIs with validation
router.get('/api/categories', boundMethods.getAllCategoriesAPI);
router.get('/api/categories/statistics', boundMethods.getCategoryStatistics);
router.get('/api/categories/hierarchy', boundMethods.getCategoryHierarchy);
router.post('/api/categories', 
  CategoryControllerClass.getCreateCategoryValidationRules(), 
  handleValidationErrors,
  boundMethods.createCategory
);
router.put('/api/categories/:categoryId', 
  CategoryControllerClass.getUpdateCategoryValidationRules(), 
  handleValidationErrors,
  boundMethods.updateCategory
);
router.delete('/api/categories/:categoryId', 
  CategoryControllerClass.getCategoryValidationRules(), 
  handleValidationErrors,
  boundMethods.deleteCategory
);
router.post('/api/categories/bulk', 
  CategoryControllerClass.getBulkCategoryValidationRules(), 
  handleValidationErrors,
  boundMethods.bulkUpdateCategories
);
router.get('/api/categories/export', boundMethods.exportCategories);
router.get('/api/categories/:categoryId/analytics', 
  CategoryControllerClass.getCategoryValidationRules(), 
  handleValidationErrors,
  boundMethods.getCategoryAnalytics
);

// Settings Management APIs with validation
router.get('/api/settings', boundMethods.getSettingsAPI);
router.post('/api/settings/update', 
  AdminControllerClass.getUpdateSettingValidationRules(), 
  handleValidationErrors,
  boundMethods.updateSettingAPI
);
router.post('/api/settings/bulk-update', 
  AdminControllerClass.getBulkUpdateSettingsValidationRules(), 
  handleValidationErrors,
  boundMethods.bulkUpdateSettingsAPI
);
router.post('/api/settings/reset', 
  AdminControllerClass.getResetSettingValidationRules(), 
  handleValidationErrors,
  boundMethods.resetSettingAPI
);
router.get('/api/settings/history', 
  AdminControllerClass.getSettingHistoryValidationRules(), 
  handleValidationErrors,
  boundMethods.getSettingHistoryAPI
);
router.get('/api/settings/export', boundMethods.exportSettingsAPI);
router.post('/api/settings/initialize-defaults', boundMethods.initializeDefaultSettingsAPI);
router.post('/api/settings/validate', 
  AdminControllerClass.getUpdateSettingValidationRules(), 
  handleValidationErrors,
  boundMethods.validateSettingAPI
);

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

// Test endpoint for debugging users API
router.get('/api/test-users', async (req, res) => {
  try {
    console.log('🧪 Test users endpoint called');
    console.log('🧪 User:', req.user);
    
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    const sampleUsers = await User.find().limit(5).lean();
    
    res.json({
      success: true,
      message: 'Test endpoint working',
      userCount,
      sampleUsers: sampleUsers.map(u => ({
        id: u._id,
        companyName: u.companyName,
        email: u.email,
        status: u.status
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('🧪 Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});
// router.post('/api/messages/:messageId/read', AdminController.markMessageRead); // To be implemented
router.post('/api/notifications/:notificationId/read', boundMethods.markNotificationAsRead);
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
router.post('/api/users/bulk-block', 
  AdminControllerClass.getBulkBlockValidationRules(), 
  boundMethods.bulkBlockUsers
);
router.post('/api/users/bulk-suspend', 
  AdminControllerClass.getBulkSuspendValidationRules(), 
  boundMethods.bulkSuspendUsers
);
router.post('/api/users/bulk-activate', 
  AdminControllerClass.getBulkValidationRules(), 
  boundMethods.bulkActivateUsers
);
router.post('/api/users/bulk-delete', 
  AdminControllerClass.getBulkDeleteValidationRules(), 
  boundMethods.bulkDeleteUsers
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