/**
 * Professional Admin Controller
 * Handles HTTP requests for admin panel with security, validation, and monitoring
 * Implements clean architecture, proper error handling, and logging
 */

const AdminService = require('../services/AdminService');
const { body, query, param, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

class AdminController {
  constructor() {
    this.logger = console; // In production, use proper logging service
    
    // Rate limiting for sensitive operations
    this.approvalRateLimit = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 20, // 20 approvals per minute
      message: { success: false, message: 'Too many approval requests. Please slow down.' }
    });
  }

  // ===============================================
  // VIEW RENDERING METHODS
  // ===============================================

  /**
   * Render admin dashboard with real-time data
   */
  async showDashboard(req, res) {
    try {
      const adminId = req.user.userId;
      const period = req.query.period || '90';
      
      this.logger.log(`📊 Dashboard request from admin: ${adminId}`);
      
      // Get language preference
      const lng = this.getLanguagePreference(req);
      
      // Get dashboard statistics from database
      const stats = await AdminService.getDashboardStats(adminId, period);
      
      // Render with comprehensive context
      res.render('admin/dashboard/index', {
        title: req.t('admin.dashboard') || 'Admin Dashboard',
        stats,
        admin: req.user,
        user: req.user, // Template compatibility
        currentLang: lng,
        lng,
        t: req.t || ((key) => key),
        currentPage: 'dashboard',
        period,
        refreshTime: new Date().toISOString()
      });

      this.logger.log(`✅ Dashboard rendered successfully for admin: ${adminId}`);

    } catch (error) {
      this.logger.error('❌ Dashboard render error:', error);
      this.renderError(res, req, error, 'Failed to load dashboard');
    }
  }

  /**
   * Show pending approvals page with advanced filtering
   */
  async showPendingApprovals(req, res) {
    try {
      const adminId = req.user.userId;
      const filters = this.extractFilters(req.query);
      
      this.logger.log(`📋 Pending approvals request from admin: ${adminId}`, filters);

      const result = await AdminService.getPendingApprovals(adminId, filters);

      res.render('admin/users/pending-approvals', {
        title: req.t('admin.pendingApprovals') || 'Pending Approvals',
        pendingUsers: result.pendingUsers,
        total: result.total,
        filters: result.filters,
        admin: req.user,
        lng: this.getLanguagePreference(req),
        t: req.t || ((key) => key),
        currentPage: 'pending-approvals'
      });

    } catch (error) {
      this.logger.error('❌ Pending approvals render error:', error);
      this.renderError(res, req, error, 'Failed to load pending approvals');
    }
  }

  /**
   * API: Get dashboard statistics
   */
  async getDashboardStats(req, res) {
    try {
      const adminId = req.user.userId;
      const period = req.query.period || '90';
      
      this.logger.log(`📊 Dashboard stats API request from admin: ${adminId}`);
      
      // Validate period parameter
      const validPeriods = ['7', '30', '90', '180', '365'];
      if (!validPeriods.includes(period)) {
        return this.sendError(res, 'Invalid period parameter', 400);
      }
      
      const stats = await AdminService.getDashboardStats(adminId, period);
      
      this.sendSuccess(res, stats, 'Dashboard statistics retrieved successfully');

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to get dashboard statistics');
    }
  }

  /**
   * API: Get pending approvals with pagination and filtering
   */
  async getPendingApprovals(req, res) {
    try {
      const adminId = req.user.userId;
      const filters = this.extractFilters(req.query);
      
      this.logger.log(`📋 Pending approvals API request from admin: ${adminId}`, filters);
      
      const result = await AdminService.getPendingApprovals(adminId, filters);
      
      this.sendSuccess(res, result.pendingUsers, 'Pending approvals retrieved successfully', {
        total: result.total,
        filters: result.filters,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to get pending approvals');
    }
  }

  /**
   * API: Get user details
   */
  async getUserDetails(req, res) {
    try {
      const adminId = req.user.userId;
      const { userId } = req.params;
      
      this.logger.log(`👤 User details API request: ${userId} from admin: ${adminId}`);
      
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }
      
      const result = await AdminService.getUserDetails(userId, adminId);
      
      this.sendSuccess(res, result, 'User details retrieved successfully');

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to get user details');
    }
  }

  /**
   * API: Approve user account
   */
  async approveUser(req, res) {
    try {
      const adminId = req.user.userId;
      const { userId } = req.params;
      const { notes = '' } = req.body;
      
      this.logger.log(`✅ User approval request: ${userId} from admin: ${adminId}`);
      
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }
      
      const result = await AdminService.approveUser(userId, adminId, notes);
      
      this.sendSuccess(res, result, req.t('admin.userApproved') || 'User approved successfully');

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to approve user');
    }
  }

  /**
   * API: Reject user account
   */
  async rejectUser(req, res) {
    try {
      const adminId = req.user.userId;
      const { userId } = req.params;
      const { reason } = req.body;
      
      this.logger.log(`❌ User rejection request: ${userId} from admin: ${adminId}`);
      
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }
      
      if (!reason || reason.trim().length < 10) {
        return this.sendError(res, 'Rejection reason must be at least 10 characters long', 400);
      }
      
      const result = await AdminService.rejectUser(userId, adminId, reason);
      
      this.sendSuccess(res, result, req.t('admin.userRejected') || 'User rejected successfully');

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to reject user');
    }
  }

  /**
   * API: Delete user request
   */
  async deleteUser(req, res) {
    try {
      const adminId = req.user.userId;
      const { userId } = req.params;
      
      this.logger.log(`🗑️ User deletion request: ${userId} from admin: ${adminId}`);
      
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }
      
      const result = await AdminService.deleteUserRequest(userId, adminId);
      
      this.sendSuccess(res, result, 'User request deleted successfully');

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to delete user request');
    }
  }

  /**
   * API: Bulk approve users
   */
  async bulkApproveUsers(req, res) {
    try {
      const adminId = req.user.userId;
      const { userIds } = req.body;
      
      this.logger.log(`📦 Bulk approval request from admin: ${adminId}`, { count: userIds?.length });
      
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return this.sendError(res, 'User IDs array is required', 400);
      }
      
      if (userIds.length > 50) {
        return this.sendError(res, 'Cannot approve more than 50 users at once', 400);
      }
      
      const result = await AdminService.bulkApproveUsers(userIds, adminId);
      
      this.sendSuccess(res, result, 
        req.t('admin.bulkApprovalCompleted') || `${result.successful} users approved successfully`
      );

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to bulk approve users');
    }
  }

  /**
   * API: Bulk reject users
   */
  async bulkRejectUsers(req, res) {
    try {
      const adminId = req.user.userId;
      const { userIds, reason } = req.body;
      
      this.logger.log(`📦 Bulk rejection request from admin: ${adminId}`, { count: userIds?.length });
      
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return this.sendError(res, 'User IDs array is required', 400);
      }
      
      if (userIds.length > 50) {
        return this.sendError(res, 'Cannot reject more than 50 users at once', 400);
      }
      
      if (!reason || reason.trim().length < 10) {
        return this.sendError(res, 'Rejection reason must be at least 10 characters long', 400);
      }
      
      const result = await AdminService.bulkRejectUsers(userIds, adminId, reason);
      
      this.sendSuccess(res, result, 
        req.t('admin.bulkRejectionCompleted') || `${result.successful} users rejected successfully`
      );

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to bulk reject users');
    }
  }

  /**
   * API: Get admin messages
   */
  async getMessages(req, res) {
    try {
      const adminId = req.user.userId;
      const { limit = 10, unreadOnly = false } = req.query;
      
      this.logger.log(`📧 Messages API request from admin: ${adminId}`);
      
      const messages = await AdminService.getMessages(adminId, {
        limit: Math.min(parseInt(limit), 100), // Cap at 100
        unreadOnly: unreadOnly === 'true'
      });
      
      this.sendSuccess(res, messages, 'Messages retrieved successfully');

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to get messages');
    }
  }

  /**
   * API: Get admin notifications
   */
  async getNotifications(req, res) {
    try {
      const adminId = req.user.userId;
      const { limit = 10, unreadOnly = false } = req.query;
      
      this.logger.log(`🔔 Notifications API request from admin: ${adminId}`);
      
      const notifications = await AdminService.getNotifications(adminId, {
        limit: Math.min(parseInt(limit), 100), // Cap at 100
        unreadOnly: unreadOnly === 'true'
      });
      
      this.sendSuccess(res, notifications, 'Notifications retrieved successfully');

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to get notifications');
    }
  }

  /**
   * API: Mark message as read
   */
  async markMessageAsRead(req, res) {
    try {
      const adminId = req.user.userId;
      const { messageId } = req.params;
      
      this.logger.log(`💬 Mark message as read: ${messageId} by admin: ${adminId}`);
      
      await AdminService.markMessageAsRead(adminId, messageId);
      
      this.sendSuccess(res, null, 'Message marked as read');

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to mark message as read');
    }
  }

  /**
   * API: Mark notification as read
   */
  async markNotificationAsRead(req, res) {
    try {
      const adminId = req.user.userId;
      const { notificationId } = req.params;
      
      this.logger.log(`🔔 Mark notification as read: ${notificationId} by admin: ${adminId}`);
      
      await AdminService.markNotificationAsRead(adminId, notificationId);
      
      this.sendSuccess(res, null, 'Notification marked as read');

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to mark notification as read');
    }
  }

  /**
   * API: Change admin language
   */
  async changeLanguage(req, res) {
    try {
      const adminId = req.user.userId;
      const { language } = req.body;
      
      this.logger.log(`🌐 Language change request: ${language} by admin: ${adminId}`);
      
      // Validate language code
      const validLanguages = ['uz', 'en', 'ru', 'tr', 'fa', 'zh'];
      if (!validLanguages.includes(language)) {
        return this.sendError(res, 'Invalid language code', 400);
      }
      
      // Set language cookie (same as public pages)
      res.cookie('i18next', language, {
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      this.sendSuccess(res, { language }, `Language changed to ${language}`);

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to change language');
    }
  }

  /**
   * Show user details for approval review
   */
  async showUserDetails(req, res) {
    try {
      const adminId = req.user.userId;
      const userId = req.params.userId;

      const result = await AdminService.getUserDetails(userId, adminId);

      res.render('admin/user-details', {
        title: req.t('admin.userDetails'),
        user: result.user,
        statistics: result.statistics,
        admin: req.user
      });

    } catch (error) {
      console.error('Show user details error:', error);
      res.status(500).render('admin/error', {
        title: 'Error',
        message: error.message
      });
    }
  }

  /**
   * Show all users page
   */
  /**
   * Render products management page
   */
  async showProducts(req, res) {
    try {
      const adminId = req.user.userId;
      this.logger.log(`📦 Products page request from admin: ${adminId}`);
      
      // Get language preference
      const lng = this.getLanguagePreference(req);
      
      // Get products statistics for initial page load
      const options = {
        page: 1,
        pageSize: 25
      };
      
      const result = await AdminService.getAllProducts(adminId, options);
      
      res.render('admin/products/index', {
        title: req.t('admin.products') || 'Products Management',
        statistics: result.statistics,
        admin: req.user,
        user: req.user, // Template compatibility
        currentLang: lng,
        lng,
        csrfToken: req.csrfToken?.() || '',
        breadcrumb: [
          { title: 'Dashboard', url: '/admin' },
          { title: 'Products' }
        ]
      });
    } catch (error) {
      this.logger.error('❌ Error in showProducts:', error);
      this.handleError(res, error, 'Failed to load products page');
    }
  }

  /**
   * Get all products via API with advanced filtering
   */
  async getAllProductsAPI(req, res) {
    try {
      const adminId = req.user.userId;
      
      // Extract query parameters with defaults
      const options = {
        page: parseInt(req.query.page) || 1,
        pageSize: parseInt(req.query.pageSize) || 25,
        status: req.query.status || '',
        category: req.query.category || '',
        manufacturerId: req.query.manufacturerId || '',
        country: req.query.country || '',
        priceRange: req.query.priceRange || '',
        stockStatus: req.query.stockStatus || '',
        search: req.query.search || '',
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc',
        dateRange: req.query.dateRange || '',
        isPromoted: req.query.isPromoted || '',
        isFeatured: req.query.isFeatured || '',
        visibility: req.query.visibility || ''
      };

      this.logger.log(`📦 Products API request from admin: ${adminId}`, options);

      const result = await AdminService.getAllProducts(adminId, options);

      this.sendSuccess(res, result, 'Products retrieved successfully');
    } catch (error) {
      this.logger.error('❌ Error in getAllProductsAPI:', error);
      this.sendError(res, error, 'Failed to retrieve products');
    }
  }

  /**
   * Update product status
   */
  async updateProductStatus(req, res) {
    try {
      const adminId = req.user.userId;
      const { productId } = req.params;
      const { status, reason = '' } = req.body;

      this.logger.log(`📦 Product status update: ${productId} -> ${status} by admin: ${adminId}`);

      const result = await AdminService.updateProductStatus(productId, status, adminId, reason);

      this.sendSuccess(res, result, `Product ${status} successfully`);
    } catch (error) {
      this.logger.error('❌ Error in updateProductStatus:', error);
      this.sendError(res, error, 'Failed to update product status');
    }
  }

  /**
   * Bulk update products
   */
  async bulkUpdateProducts(req, res) {
    try {
      const adminId = req.user.userId;
      const { productIds, action, actionData = {} } = req.body;

      // Validation
      if (!Array.isArray(productIds) || productIds.length === 0) {
        return this.sendError(res, new Error('Product IDs are required'), 'Product IDs are required');
      }

      this.logger.log(`📦 Bulk product action: ${action} on ${productIds.length} products by admin: ${adminId}`);

      let result;
      switch (action) {
        case 'activate':
          result = await AdminService.bulkUpdateProductStatus(productIds, 'active', adminId);
          break;
        case 'deactivate':
          result = await AdminService.bulkUpdateProductStatus(productIds, 'inactive', adminId);
          break;
        case 'promote':
          result = await AdminService.bulkPromoteProducts(productIds, adminId);
          break;
        case 'unpromote':
          result = await AdminService.bulkUnpromoteProducts(productIds, adminId);
          break;
        case 'feature':
          result = await AdminService.bulkFeatureProducts(productIds, adminId);
          break;
        case 'unfeature':
          result = await AdminService.bulkUnfeatureProducts(productIds, adminId);
          break;
        case 'delete':
          result = await AdminService.bulkDeleteProducts(productIds, adminId, actionData.reason);
          break;
        default:
          throw new Error('Invalid bulk action');
      }

      this.sendSuccess(res, result, `Bulk ${action} completed successfully`);
    } catch (error) {
      this.logger.error('❌ Error in bulkUpdateProducts:', error);
      this.sendError(res, error, 'Failed to perform bulk action');
    }
  }

  /**
   * Export products data
   */
  async exportProducts(req, res) {
    try {
      const adminId = req.user.userId;
      const format = req.query.format || 'csv';
      
      this.logger.log(`📊 Products export request from admin: ${adminId}, format: ${format}`);

      // Get filters from query
      const filters = {
        status: req.query.status,
        category: req.query.category,
        country: req.query.country,
        dateRange: req.query.dateRange
      };

      const exportData = await AdminService.exportProducts(adminId, { format, filters });

      // Set appropriate headers
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `products_export_${timestamp}.${format}`;

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      } else if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      }

      res.send(exportData);
    } catch (error) {
      this.logger.error('❌ Error in exportProducts:', error);
      this.sendError(res, error, 'Failed to export products');
    }
  }

  async showAllUsers(req, res) {
    try {
      const adminId = req.user.userId;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        status: req.query.status,
        country: req.query.country,
        activityType: req.query.activityType,
        search: req.query.search,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await AdminService.getAllUsers(adminId, options);

      // Get language preference
      const lng = this.getLanguagePreference(req);
      
      res.render('admin/users/index', {
        title: req.t('admin.allUsers') || 'All Users',
        users: result.users,
        pagination: result.pagination,
        filters: result.filters,
        sorting: result.sorting,
        statistics: result.statistics,
        admin: req.user,
        user: req.user, // Template compatibility
        currentLang: lng,
        lng,
        t: req.t || ((key) => key),
        currentPage: 'users'
      });

    } catch (error) {
      console.error('Show all users error:', error);
      res.status(500).render('admin/error', {
        title: 'Error',
        message: error.message
      });
    }
  }

  /**
   * API: Get all users with filtering and pagination
   */
  async getAllUsersAPI(req, res) {
    try {
      const adminId = req.user.userId;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        status: req.query.status,
        country: req.query.country,
        activityType: req.query.activityType,
        companyType: req.query.companyType,
        search: req.query.search,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc',
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        emailVerified: req.query.emailVerified,
        profileCompleted: req.query.profileCompleted
      };
      
      this.logger.log(`👥 Users API request from admin: ${adminId}`, options);
      
      const result = await AdminService.getAllUsers(adminId, options);
      
      this.sendSuccess(res, result, 'Users retrieved successfully');

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to get users');
    }
  }

  /**
   * Show companies page with comprehensive business management
   */
  async showCompanies(req, res) {
    try {
      const adminId = req.user.userId;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        status: req.query.status,
        companyType: req.query.companyType,
        country: req.query.country,
        activityType: req.query.activityType,
        search: req.query.search,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc',
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        minEmployees: req.query.minEmployees,
        minRevenue: req.query.minRevenue,
        emailVerified: req.query.emailVerified,
        hasProducts: req.query.hasProducts
      };

      this.logger.log(`🏢 Companies page request from admin: ${adminId}`, options);

      const result = await AdminService.getAllCompanies(adminId, options);

      // Get language preference
      const lng = this.getLanguagePreference(req);
      
      res.render('admin/companies/index', {
        title: req.t('admin.companies') || 'Company Management',
        companies: result.companies,
        pagination: result.pagination,
        filters: result.filters,
        sorting: result.sorting,
        statistics: result.statistics,
        analytics: result.analytics,
        admin: req.user,
        user: req.user, // Template compatibility
        currentLang: lng,
        lng,
        t: req.t || ((key) => key),
        currentPage: 'companies',
        // Statistics for template
        activeCompanies: result.statistics.byStatus?.find(s => s.label === 'active')?.count || 0,
        pendingApprovals: result.statistics.byStatus?.find(s => s.label === 'pending')?.count || 0,
        manufacturers: result.analytics.manufacturers || 0,
        distributors: result.analytics.distributors || 0
      });

    } catch (error) {
      console.error('Show companies error:', error);
      this.renderError(res, req, error, 'Failed to load companies');
    }
  }

  /**
   * API: Get all companies with filtering and analytics
   */
  async getAllCompaniesAPI(req, res) {
    try {
      const adminId = req.user.userId;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        status: req.query.status,
        companyType: req.query.companyType,
        country: req.query.country,
        activityType: req.query.activityType,
        search: req.query.search,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc',
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        minEmployees: req.query.minEmployees,
        minRevenue: req.query.minRevenue,
        emailVerified: req.query.emailVerified,
        hasProducts: req.query.hasProducts
      };
      
      this.logger.log(`🏢 Companies API request from admin: ${adminId}`, options);
      
      const result = await AdminService.getAllCompanies(adminId, options);
      
      this.sendSuccess(res, result, 'Companies retrieved successfully');

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to get companies');
    }
  }

  /**
   * Show admin settings page
   */
  async showSettings(req, res) {
    try {
      res.render('admin/settings', {
        title: req.t('admin.settings'),
        admin: req.user
      });

    } catch (error) {
      console.error('Show settings error:', error);
      res.status(500).render('admin/error', {
        title: 'Error',
        message: error.message
      });
    }
  }



  // ===============================================
  // Extended API Methods for New Features
  // ===============================================



  /**
   * Get recent activity with filters
   */
  async getRecentActivity(req, res) {
    try {
      const { filter = 'all' } = req.query;
      const adminId = req.user.userId;

      const activities = await AdminService.getRecentActivity(adminId, filter);

      res.json({
        success: true,
        data: activities,
        filter: filter
      });

    } catch (error) {
      console.error('Get recent activity error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }



  /**
   * Check for new notifications
   */
  async checkNewNotifications(req, res) {
    try {
      const adminId = req.user.userId;
      const { lastCheck } = req.query;

      const result = await AdminService.checkNewNotifications(adminId, lastCheck);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Check notifications error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Mark message as read
   */
  async markMessageRead(req, res) {
    try {
      const { messageId } = req.params;
      const adminId = req.user.userId;

      await AdminService.markMessageRead(messageId, adminId);

      res.json({
        success: true,
        message: 'Message marked as read'
      });

    } catch (error) {
      console.error('Mark message read error:', error);
      res.status(400).json({
          success: false,
        error: error.message
      });
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(req, res) {
    try {
      const { notificationId } = req.params;
      const adminId = req.user.userId;

      await AdminService.markNotificationRead(notificationId, adminId);

      res.json({
        success: true,
        message: 'Notification marked as read'
      });

    } catch (error) {
      console.error('Mark notification read error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Mark all messages as read
   */
  async markAllMessagesRead(req, res) {
    try {
      const adminId = req.user.userId;

      const result = await AdminService.markAllMessagesRead(adminId);

      res.json({
        success: true,
        message: `${result.modifiedCount} messages marked as read`
      });

    } catch (error) {
      console.error('Mark all messages read error:', error);
      res.status(400).json({
          success: false,
        error: error.message
      });
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsRead(req, res) {
    try {
      const adminId = req.user.userId;

      const result = await AdminService.markAllNotificationsRead(adminId);

      res.json({
        success: true,
        message: `${result.modifiedCount} notifications marked as read`
      });

    } catch (error) {
      console.error('Mark all notifications read error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // ===============================================
  // Analytics Methods
  // ===============================================

  /**
   * Show analytics dashboard
   */
  async showAnalytics(req, res) {
    try {
      const adminId = req.user.userId;
      
      // Get language from multiple sources (priority order)
      const lng = req.session.language || 
                  req.cookies.selectedLanguage || 
                  req.cookies.i18next ||
                  req.query.lng || 
                  'uz';
      
      // Get analytics data - NO MOCK FALLBACKS
      let analyticsData = {};
      let dataLoadError = null;
      
      try {
        analyticsData = await AdminService.getAnalyticsData(adminId);
      } catch (analyticsError) {
        this.logger.error('❌ Analytics data loading failed:', analyticsError);
        dataLoadError = analyticsError.message;
        // Return empty structure - no fake data
        analyticsData = {
          overview: {},
          revenueData: [],
          userActivity: {},
          topProducts: [],
          geographicData: [],
          realtimeActivities: [],
          error: dataLoadError
        };
      }

      res.render('admin/analytics/index', {
        title: req.t('admin.analytics') || 'Analytics Dashboard',
        analytics: analyticsData,
        admin: req.user,
        user: req.user, // For template compatibility
        currentLang: lng,
        lng: lng,
        t: req.t || ((key) => key)
      });

    } catch (error) {
      console.error('Show analytics error:', error);
      res.status(500).render('admin/error', {
        title: 'Error',
        message: error.message,
        user: req.user,
        currentLang: req.session.language || 'uz'
      });
    }
  }

  /**
   * Get analytics overview data
   */
  async getAnalyticsOverview(req, res) {
    try {
      const adminId = req.user.userId;
      const timeRange = req.query.timeRange || '30d';

      const overviewData = await AdminService.getAnalyticsOverview(adminId, timeRange);

      res.json({
        success: true,
        data: overviewData,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Get analytics overview error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get revenue analytics data
   */
  async getRevenueAnalytics(req, res) {
    try {
      const adminId = req.user.userId;
      const timeRange = req.query.timeRange || '30d';
      const filter = req.query.filter || 'revenue';
      
      const revenueData = await AdminService.getRevenueAnalytics(adminId, timeRange, filter);

      res.json({
        success: true,
        data: revenueData,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Get revenue analytics error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get user analytics data
   */
  async getUserAnalytics(req, res) {
    try {
      const adminId = req.user.userId;
      const timeRange = req.query.timeRange || '30d';
      
      const userAnalytics = await AdminService.getUserAnalytics(adminId, timeRange);

      res.json({
        success: true,
        data: userAnalytics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Get user analytics error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get product analytics data
   */
  async getProductAnalytics(req, res) {
    try {
      const adminId = req.user.userId;
      const timeRange = req.query.timeRange || '30d';
      
      const productAnalytics = await AdminService.getProductAnalytics(adminId, timeRange);

      res.json({
        success: true,
        data: productAnalytics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Get product analytics error:', error);
      res.status(400).json({
          success: false,
        error: error.message
      });
    }
  }

  /**
   * Get geographic analytics data
   */
  async getGeographicAnalytics(req, res) {
    try {
      const adminId = req.user.userId;
      const timeRange = req.query.timeRange || '30d';
      
      const geographicData = await AdminService.getGeographicAnalytics(adminId, timeRange);

      res.json({
        success: true,
        data: geographicData,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Get geographic analytics error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get real-time analytics data
   */
  async getRealtimeAnalytics(req, res) {
    try {
      const adminId = req.user.userId;
      
      const realtimeData = await AdminService.getRealtimeAnalytics(adminId);

      res.json({
        success: true,
        data: realtimeData,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Get realtime analytics error:', error);
      res.status(400).json({
          success: false,
        error: error.message
      });
    }
  }

  /**
   * Export dashboard data to CSV/Excel
   */
  async exportDashboardData(req, res) {
    try {
      const adminId = req.user.userId;
      const { format = 'csv', dateRange = 'last-30-days' } = req.body;

      this.logger.log(`📊 Dashboard export request from admin: ${adminId}, format: ${format}`);

      const exportData = await AdminService.exportDashboardData(adminId, { format, dateRange });

      // Set appropriate headers for file download
      const filename = `dashboard-export-${new Date().toISOString().split('T')[0]}.${format}`;
      
      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      res.send(exportData);

    } catch (error) {
      console.error('Export dashboard data error:', error);
      res.status(500).json({
          success: false,
        error: error.message
      });
    }
  }

  // ===============================================
  // VALIDATION RULES
  // ===============================================

  /**
   * Validation rules for user operations
   */
  static getUserValidationRules() {
    return [
      param('userId').isMongoId().withMessage('Invalid user ID format')
    ];
  }

  /**
   * Validation rules for bulk operations
   */
  static getBulkValidationRules() {
    return [
      body('userIds').isArray({ min: 1, max: 50 }).withMessage('UserIds must be an array with 1-50 items'),
      body('userIds.*').isMongoId().withMessage('Each user ID must be valid')
    ];
  }

  /**
   * Validation rules for rejection
   */
  static getRejectValidationRules() {
    return [
      ...AdminController.getUserValidationRules(),
      body('reason').isLength({ min: 10, max: 500 }).trim().withMessage('Reason must be 10-500 characters')
    ];
  }

  // ===============================================
  // UTILITY METHODS
  // ===============================================

  /**
   * Extract and validate filters from query parameters
   */
  extractFilters(query) {
    const filters = {};
    
    if (query.country) {
      filters.country = query.country.trim();
    }
    
    if (query.activityType) {
      filters.activityType = query.activityType.trim();
    }
    
    if (query.dateFrom) {
      const date = new Date(query.dateFrom);
      if (!isNaN(date.getTime())) {
        filters.dateFrom = date;
      }
    }
    
    if (query.dateTo) {
      const date = new Date(query.dateTo);
      if (!isNaN(date.getTime())) {
        filters.dateTo = date;
      }
    }
    
    return filters;
  }

  /**
   * Get language preference from request
   * Uses the same priority as i18n middleware for consistency
   */
  getLanguagePreference(req) {
    // Priority order matching i18n middleware:
    // 1. Query string parameter
    // 2. i18next cookie (standard cookie name)
    // 3. Session (for persistence)
    // 4. Default language
    return req.query.lng || 
           req.cookies.i18next ||
           req.session.language || 
           req.cookies.selectedLanguage || // Legacy support
           'uz';
  }

  /**
   * Send success response
   */
  sendSuccess(res, data, message = 'Success', meta = {}) {
      res.json({
        success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      ...meta
    });
  }

  /**
   * Send error response
   */
  sendError(res, message, statusCode = 400, details = null) {
    const response = {
        success: false,
      message,
      timestamp: new Date().toISOString()
    };
    
    if (details) {
      response.details = details;
    }
    
    res.status(statusCode).json(response);
  }

  /**
   * Send validation error response
   */
  sendValidationError(res, errors) {
    this.sendError(res, 'Validation failed', 400, {
      errors: errors.array()
    });
  }

  /**
   * Handle API errors with proper logging and response
   */
  handleAPIError(res, error, defaultMessage) {
    this.logger.error(`❌ API Error: ${defaultMessage}`, error);
    
    let statusCode = 500;
    let message = defaultMessage;
    
    if (error.message.includes('not found')) {
      statusCode = 404;
      message = error.message;
    } else if (error.message.includes('permission') || error.message.includes('access')) {
      statusCode = 403;
      message = error.message;
    } else if (error.message.includes('validation') || error.message.includes('Invalid')) {
      statusCode = 400;
      message = error.message;
    }
    
    this.sendError(res, message, statusCode);
  }

  /**
   * Render error page with proper context
   */
  renderError(res, req, error, defaultMessage) {
    const lng = this.getLanguagePreference(req);
    
    res.status(500).render('pages/error', {
        title: 'Error',
      message: error.message || defaultMessage,
      error: error, // Pass the full error object for template access
      user: req.user,
      admin: req.user,
      lng,
      currentLang: lng,
      t: req.t || ((key) => key),
      currentPage: 'error'
    });
  }

  // ===============================================
  // CRITICAL MISSING USER MANAGEMENT METHODS
  // ===============================================

  /**
   * API: Block user account
   */
  async blockUser(req, res) {
    try {
      const adminId = req.user.userId;
      const { userId } = req.params;
      const { reason = '' } = req.body;
      
      this.logger.log(`🚫 User block request: ${userId} from admin: ${adminId}`);
      
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }
      
      const result = await AdminService.blockUser(userId, adminId, reason);
      
      this.sendSuccess(res, result, req.t('admin.userBlocked') || 'User blocked successfully');

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to block user');
    }
  }

  /**
   * API: Unblock user account
   */
  async unblockUser(req, res) {
    try {
      const adminId = req.user.userId;
      const { userId } = req.params;
      const { notes = '' } = req.body;
      
      this.logger.log(`✅ User unblock request: ${userId} from admin: ${adminId}`);
      
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }
      
      const result = await AdminService.unblockUser(userId, adminId, notes);
      
      this.sendSuccess(res, result, req.t('admin.userUnblocked') || 'User unblocked successfully');

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to unblock user');
    }
  }

  /**
   * API: Suspend user account
   */
  async suspendUser(req, res) {
    try {
      const adminId = req.user.userId;
      const { userId } = req.params;
      const { reason, duration } = req.body;
      
      this.logger.log(`⏸️ User suspend request: ${userId} from admin: ${adminId}`);
      
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }
      
      if (!reason || reason.trim().length < 10) {
        return this.sendError(res, 'Suspension reason must be at least 10 characters long', 400);
      }
      
      const result = await AdminService.suspendUser(userId, adminId, reason, duration);
      
      this.sendSuccess(res, result, req.t('admin.userSuspended') || 'User suspended successfully');

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to suspend user');
    }
  }

  /**
   * API: Activate user account
   */
  async activateUser(req, res) {
    try {
      const adminId = req.user.userId;
      const { userId } = req.params;
      const { notes = '' } = req.body;
      
      this.logger.log(`🟢 User activate request: ${userId} from admin: ${adminId}`);
      
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }
      
      const result = await AdminService.activateUser(userId, adminId, notes);
      
      this.sendSuccess(res, result, req.t('admin.userActivated') || 'User activated successfully');

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to activate user');
    }
  }

  /**
   * API: Restore deleted user
   */
  async restoreUser(req, res) {
    try {
      const adminId = req.user.userId;
      const { userId } = req.params;
      const { notes = '' } = req.body;
      
      this.logger.log(`🔄 User restore request: ${userId} from admin: ${adminId}`);
      
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }
      
      const result = await AdminService.restoreUser(userId, adminId, notes);
      
      this.sendSuccess(res, result, req.t('admin.userRestored') || 'User restored successfully');

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to restore user');
    }
  }

  /**
   * API: Permanently delete user
   */
  async permanentDeleteUser(req, res) {
    try {
      const adminId = req.user.userId;
      const { userId } = req.params;
      const { confirmPassword } = req.body;
      
      this.logger.log(`⚠️ PERMANENT user deletion request: ${userId} from admin: ${adminId}`);
      
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }
      
      // Additional security check for permanent deletion
      if (!confirmPassword) {
        return this.sendError(res, 'Admin password confirmation required for permanent deletion', 400);
      }
      
      const result = await AdminService.permanentDeleteUser(userId, adminId, confirmPassword);
      
      this.sendSuccess(res, result, req.t('admin.userPermanentlyDeleted') || 'User permanently deleted');

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to permanently delete user');
    }
  }

  /**
   * API: Update user information
   */
  async updateUser(req, res) {
    try {
      const adminId = req.user.userId;
      const { userId } = req.params;
      const updateData = req.body;
      
      this.logger.log(`📝 User update request: ${userId} from admin: ${adminId}`);
      
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }
      
      const result = await AdminService.updateUser(userId, adminId, updateData);
      
      this.sendSuccess(res, result, req.t('admin.userUpdated') || 'User updated successfully');

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to update user');
    }
  }

  /**
   * API: Export users data
   */
  async exportUsers(req, res) {
    try {
      const adminId = req.user.userId;
      const { format = 'csv', filters = {} } = req.query;
      
      this.logger.log(`📊 Users export request from admin: ${adminId}, format: ${format}`);
      
      // Validate format
      const validFormats = ['csv', 'excel', 'json'];
      if (!validFormats.includes(format)) {
        return this.sendError(res, 'Invalid export format. Supported: csv, excel, json', 400);
      }
      
      const exportData = await AdminService.exportUsers(adminId, { format, filters });
      
      // Set appropriate headers for file download
      const filename = `users-export-${new Date().toISOString().split('T')[0]}.${format}`;
      
      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.json(exportData);
      } else {
        res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(exportData);
      }

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to export users');
    }
  }

  // ===============================================
  // ENHANCED VALIDATION RULES
  // ===============================================

  /**
   * Validation rules for user update operations
   */
  static getUserUpdateValidationRules() {
    return [
      param('userId').isMongoId().withMessage('Invalid user ID format'),
      body('companyName').optional().isLength({ min: 2, max: 100 }).trim(),
      body('email').optional().isEmail().normalizeEmail(),
      body('phone').optional().isMobilePhone(),
      body('status').optional().isIn(['active', 'pending', 'blocked', 'suspended', 'rejected']),
      body('activityType').optional().isIn(['textiles_clothing', 'food_beverages', 'electronics', 'agriculture', 'other'])
    ];
  }
}

module.exports = AdminController;