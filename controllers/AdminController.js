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
      const statistics = await AdminService.getProductStatistics(adminId);
      
      res.render('admin/products/index', {
        title: req.t('admin.products') || 'Products Management',
        statistics,
        admin: req.user,
        user: req.user, // Template compatibility
        currentLang: lng,
        lng,
        currentPage: 'products',
        csrfToken: req.csrfToken?.() || '',
        breadcrumb: [
          { title: 'Dashboard', url: '/admin' },
          { title: 'Products' }
        ]
      });
    } catch (error) {
      this.logger.error('❌ Error in showProducts:', error);
      this.renderError(res, req, error, 'Failed to load products page');
    }
  }

  /**
   * Get all products via API with advanced filtering
   */
  async getAllProductsAPI(req, res) {
    try {
      const adminId = req.user.userId;
      
      // Extract and validate query parameters with defaults
      const options = {
        page: Math.max(1, parseInt(req.query.page) || 1),
        pageSize: Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 25)),
        status: req.query.status || '',
        category: req.query.category || '',
        manufacturerId: req.query.manufacturerId || '',
        country: req.query.country || '',
        priceRange: req.query.priceRange || '',
        stockStatus: req.query.stockStatus || '',
        search: (req.query.search || '').trim(),
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: ['asc', 'desc'].includes(req.query.sortOrder) ? req.query.sortOrder : 'desc',
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
      this.handleAPIError(res, error, 'Failed to retrieve products');
    }
  }

  /**
   * Get product statistics
   */
  async getProductStatistics(req, res) {
    try {
      const adminId = req.user.userId;
      
      this.logger.log(`📊 Products statistics request from admin: ${adminId}`);

      const statistics = await AdminService.getProductStatistics(adminId);

      this.sendSuccess(res, statistics, 'Product statistics retrieved successfully');
    } catch (error) {
      this.logger.error('❌ Error in getProductStatistics:', error);
      this.handleAPIError(res, error, 'Failed to retrieve product statistics');
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

      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }

      // Fix parameter order - AdminService expects (productId, adminId, status, notes)
      const result = await AdminService.updateProductStatus(productId, adminId, status, reason);

      this.sendSuccess(res, result, `Product ${status} successfully`);
    } catch (error) {
      this.logger.error('❌ Error in updateProductStatus:', error);
      this.handleAPIError(res, error, 'Failed to update product status');
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

  // showSettings method moved to line 1985 with full implementation



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
        currentPage: 'analytics',
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

  /**
   * Validation rules for product operations
   */
  static getProductValidationRules() {
    return [
      param('productId').isMongoId().withMessage('Invalid product ID format')
    ];
  }

  /**
   * Validation rules for bulk product operations
   */
  static getBulkProductValidationRules() {
    return [
      body('productIds').isArray({ min: 1, max: 100 }).withMessage('ProductIds must be an array with 1-100 items'),
      body('productIds.*').isMongoId().withMessage('Each product ID must be valid'),
      body('action').isIn(['activate', 'deactivate', 'promote', 'unpromote', 'feature', 'unfeature', 'delete']).withMessage('Invalid action')
    ];
  }

  // ===============================================
  // ORDERS MANAGEMENT - REAL IMPLEMENTATION
  // ===============================================

  /**
   * Show orders management page
   */
  async showOrders(req, res) {
    try {
      const adminId = req.user.userId;
      
      // Get language preference
      const lng = this.getLanguagePreference(req);
      
      // Get orders statistics for page load
      let statistics;
      try {
        statistics = await AdminService.getOrdersStatistics(adminId);
      } catch (error) {
        this.logger.error('Failed to load orders statistics:', error);
        // Fallback statistics if database fails
        statistics = {
          total: 0,
          totalRevenue: 0,
          statusCounts: {
            pending: 0,
            confirmed: 0,
            processing: 0,
            shipped: 0,
            completed: 0,
            cancelled: 0,
            total: 0
          }
        };
      }
      
      // Render orders management page
      res.render('admin/orders/index', {
        title: 'Orders Management - SLEX Admin Dashboard',
        admin: req.user,
        user: req.user, // Template compatibility
        currentLang: lng,
        lng,
        currentPage: 'orders',
        statistics,
        stats: statistics, // Additional compatibility
        csrfToken: req.csrfToken ? req.csrfToken() : ''
      });

    } catch (error) {
      this.logger.error('❌ Show orders page error:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to load orders page',
        error: process.env.NODE_ENV === 'development' ? error : {}
      });
    }
  }

  /**
   * API: Get orders with filtering and pagination - REAL DATABASE
   */
  async getOrdersAPI(req, res) {
    try {
      const adminId = req.user.userId;
      
      this.logger.log(`📋 Orders API request from admin: ${adminId}`);
      
      // Extract filters and pagination from query
      const filters = {
        status: req.query.status,
        search: req.query.search,
        countryFilter: req.query.countryFilter,
        valueRangeFilter: req.query.valueRangeFilter,
        paymentStatusFilter: req.query.paymentStatusFilter,
        dateRangeFilter: req.query.dateRangeFilter,
        shippingFilter: req.query.shippingFilter
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
      };

      // Get orders from service
      const result = await AdminService.getOrdersWithFilters(filters, pagination, adminId);
      
      this.sendSuccess(res, result, 'Orders loaded successfully');

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to load orders');
    }
  }

  /**
   * API: Get orders statistics - REAL DATABASE
   */
  async getOrdersStatisticsAPI(req, res) {
    try {
      const adminId = req.user.userId;
      
      this.logger.log(`📊 Orders statistics API request from admin: ${adminId}`);
      
      const statistics = await AdminService.getOrdersStatistics(adminId);
      
      this.sendSuccess(res, statistics, 'Statistics loaded successfully');

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to load statistics');
    }
  }

  /**
   * API: Get single order details - REAL DATABASE
   */
  async getOrderDetailsAPI(req, res) {
    try {
      const adminId = req.user.userId;
      const { orderId } = req.params;
      
      this.logger.log(`📋 Order details API request: ${orderId} from admin: ${adminId}`);
      
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }
      
      const orderDetails = await AdminService.getOrderDetails(orderId, adminId);
      
      this.sendSuccess(res, orderDetails, 'Order details loaded successfully');

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to load order details');
    }
  }

  /**
   * API: Update order status - REAL DATABASE
   */
  async updateOrderStatusAPI(req, res) {
    try {
      const adminId = req.user.userId;
      const { orderId } = req.params;
      const { status, notes } = req.body;
      
      this.logger.log(`🔄 Order status update: ${orderId} -> ${status} from admin: ${adminId}`);
      
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }
      
      const updatedOrder = await AdminService.updateOrderStatus(orderId, status, notes, adminId);
      
      this.sendSuccess(res, updatedOrder, 'Order status updated successfully');

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to update order status');
    }
  }

  /**
   * API: Bulk order actions - REAL DATABASE
   */
  async bulkOrderActionAPI(req, res) {
    try {
      const adminId = req.user.userId;
      const { orderIds, action } = req.body;
      
      this.logger.log(`🔄 Bulk order action: ${action} on ${orderIds?.length} orders from admin: ${adminId}`);
      
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }
      
      const results = await AdminService.bulkOrderAction(orderIds, action, adminId);
      
      this.sendSuccess(res, results, `Bulk ${action} completed successfully`);

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to perform bulk action');
    }
  }

  /**
   * API: Export orders - REAL DATABASE
   */
  async exportOrdersAPI(req, res) {
    try {
      const adminId = req.user.userId;
      
      this.logger.log(`📥 Orders export request from admin: ${adminId}`);
      
      // Extract filters if provided
      const filters = {
        status: req.query.status,
        search: req.query.search,
        countryFilter: req.query.countryFilter,
        valueRangeFilter: req.query.valueRangeFilter,
        paymentStatusFilter: req.query.paymentStatusFilter,
        dateRangeFilter: req.query.dateRangeFilter,
        shippingFilter: req.query.shippingFilter,
        orderIds: req.query.orderIds // For bulk export
      };

      // If specific order IDs provided (bulk export)
      if (filters.orderIds) {
        filters.orderIds = filters.orderIds.split(',');
      }

      // Get all matching orders (no pagination for export)
      const pagination = {
        page: 1,
        limit: 10000, // Large limit for export
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      const result = await AdminService.getOrdersWithFilters(filters, pagination, adminId);
      
      // For now, return JSON data (Excel implementation can be added later)
      const exportData = result.orders.map(order => ({
        orderNumber: order.orderNumber,
        status: order.status,
        buyer: order.buyer?.companyName || 'N/A',
        seller: order.seller?.companyName || 'N/A',
        buyerCountry: order.buyer?.country || 'N/A',
        totalAmount: order.totalAmount,
        currency: order.currency,
        paymentStatus: order.payment?.status || 'pending',
        paymentMethod: order.payment?.method || 'N/A',
        itemsCount: order.items?.length || 0,
        createdDate: order.createdAt,
        lastUpdated: order.updatedAt
      }));

      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=orders-export-${new Date().toISOString().split('T')[0]}.json`);
      
      res.json({
        success: true,
        data: exportData,
        metadata: {
          totalRecords: exportData.length,
          exportDate: new Date(),
          filters
        }
      });

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to export orders');
    }
  }

  // ===============================================
  // ORDERS VALIDATION RULES
  // ===============================================

  /**
   * Validation rules for order details request
   */
  static getOrderDetailsValidationRules() {
    return [
      param('orderId').isMongoId().withMessage('Invalid order ID format')
    ];
  }

  /**
   * Validation rules for order status update
   */
  static getOrderStatusUpdateValidationRules() {
    return [
      param('orderId').isMongoId().withMessage('Invalid order ID format'),
      body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled']).withMessage('Invalid status value'),
      body('notes').optional().isLength({ min: 3, max: 500 }).withMessage('Notes must be between 3-500 characters')
    ];
  }

  /**
   * Validation rules for bulk order operations
   */
  static getBulkOrderValidationRules() {
    return [
      body('orderIds').isArray({ min: 1, max: 100 }).withMessage('OrderIds must be an array with 1-100 items'),
      body('orderIds.*').isMongoId().withMessage('Each order ID must be valid'),
      body('action').isIn(['confirm', 'ship', 'cancel']).withMessage('Invalid bulk action')
    ];
  }

  // ===============================================
  // SETTINGS MANAGEMENT METHODS
  // ===============================================

  /**
   * Show Settings page with organized settings by category
   */
  async showSettings(req, res) {
    try {
      const adminId = req.user.userId;
      const lng = this.getLanguagePreference(req);
      
      this.logger.log(`⚙️ Settings page request from admin: ${adminId}`);

      // Get all settings organized by category and statistics
      const [settingsData, statistics] = await Promise.all([
        AdminService.getSettings(adminId),
        AdminService.getSettingsStatistics(adminId)
      ]);

      // Initialize default settings if none exist
      if (statistics.total === 0) {
        await AdminService.initializeDefaultSettings(adminId);
        // Reload settings after initialization
        const updatedData = await AdminService.getSettings(adminId);
        settingsData.settings = updatedData.settings;
        settingsData.statistics = updatedData.statistics;
      }

      res.render('admin/system/settings', {
        title: 'System Settings',
        settings: settingsData.settings,
        statistics: settingsData.statistics,
        categories: Object.keys(settingsData.settings),
        admin: req.user,
        user: req.user,
        currentLang: lng,
        lng,
        currentPage: 'settings',
        breadcrumb: [
          { title: 'System', url: '/admin' },
          { title: 'Settings' }
        ]
      });

    } catch (error) {
      this.logger.error('❌ Settings page error:', error);
      this.renderError(res, req, error, 'Failed to load settings page');
    }
  }

  /**
   * Show admin profile page - FIXED with complete profile data
   */
  async showProfile(req, res) {
    const adminId = req.user.userId;
    const lng = this.getLanguagePreference(req);
    
    try {
      this.logger.log(`👤 Profile page request from admin: ${adminId}`);

      // Load complete admin profile data from database
      const adminProfileData = await AdminService.getAdminProfile(adminId);
      const adminProfile = adminProfileData.profile;

      this.logger.log(`✅ Loaded complete admin profile: ${adminProfile.firstName} ${adminProfile.lastName}`);

      res.render('admin/profile/index', {
        title: req.t('admin.profile') || 'Admin Profile',
        admin: adminProfile, // Complete admin profile data
        user: adminProfile, // Template compatibility
        adminProfileData: adminProfileData, // Full profile response including stats
        currentLang: lng,
        lng,
        currentPage: 'profile',
        breadcrumb: [
          { title: 'Dashboard', url: '/admin' },
          { title: 'Profile' }
        ]
      });

    } catch (error) {
      this.logger.error('❌ Profile page error:', error);
      
      // Fallback to basic user data if profile loading fails - FIXED lng variable
      res.render('admin/profile/index', {
        title: req.t('admin.profile') || 'Admin Profile',
        admin: req.user,
        user: req.user,
        adminProfileData: null,
        currentLang: lng,
        lng,
        currentPage: 'profile',
        breadcrumb: [
          { title: 'Dashboard', url: '/admin' },
          { title: 'Profile' }
        ],
        profileError: error.message
      });
    }
  }

  /**
   * API endpoint to get settings by category
   */
  async getSettingsAPI(req, res) {
    try {
      const adminId = req.user.userId;
      const { category } = req.query;

      this.logger.log(`⚙️ Settings API request from admin: ${adminId}, category: ${category}`);

      let settingsData;
      if (category) {
        settingsData = await AdminService.getSettingsByCategory(category, adminId);
      } else {
        settingsData = await AdminService.getSettings(adminId);
      }

      res.json({
        success: true,
        ...settingsData,
        timestamp: new Date()
      });

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to get settings');
    }
  }

  /**
   * API endpoint to update single setting
   */
  async updateSettingAPI(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const adminId = req.user.userId;
      const { category, key, value, reason } = req.body;

      this.logger.log(`⚙️ Setting update request: ${category}.${key} by admin: ${adminId}`);

      const result = await AdminService.updateSetting(category, key, value, adminId, reason);

      res.json({
        success: true,
        message: result.message,
        setting: result.setting,
        timestamp: new Date()
      });

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to update setting');
    }
  }

  /**
   * API endpoint for bulk settings update
   */
  async bulkUpdateSettingsAPI(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const adminId = req.user.userId;
      const { updates, reason } = req.body;

      this.logger.log(`⚙️ Bulk settings update request: ${updates.length} settings by admin: ${adminId}`);

      const result = await AdminService.bulkUpdateSettings(updates, adminId, reason);

      res.json({
        success: true,
        message: result.message,
        results: result.results,
        timestamp: new Date()
      });

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to bulk update settings');
    }
  }

  /**
   * API endpoint to reset setting to default value
   */
  async resetSettingAPI(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const adminId = req.user.userId;
      const { category, key } = req.body;

      this.logger.log(`🔄 Setting reset request: ${category}.${key} by admin: ${adminId}`);

      const result = await AdminService.resetSetting(category, key, adminId);

      res.json({
        success: true,
        message: `Setting ${result.setting.displayName} reset to default value`,
        setting: result.setting,
        timestamp: new Date()
      });

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to reset setting');
    }
  }

  /**
   * API endpoint to get setting change history
   */
  async getSettingHistoryAPI(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const adminId = req.user.userId;
      const { category, key } = req.query;

      this.logger.log(`📜 Setting history request: ${category}.${key} by admin: ${adminId}`);

      const history = await AdminService.getSettingHistory(category, key, adminId);

      res.json({
        success: true,
        history,
        timestamp: new Date()
      });

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to get setting history');
    }
  }

  /**
   * API endpoint to export settings configuration
   */
  async exportSettingsAPI(req, res) {
    try {
      const adminId = req.user.userId;
      const { categories, includeHistory, format } = req.query;

      this.logger.log(`📤 Settings export request by admin: ${adminId}`);

      const exportOptions = {
        categories: categories ? categories.split(',') : null,
        includeHistory: includeHistory === 'true',
        format: format || 'json'
      };

      const exportData = await AdminService.exportSettings(adminId, exportOptions);

      // Set headers for file download
      const filename = `settings-export-${new Date().toISOString().split('T')[0]}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

      res.json(exportData);

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to export settings');
    }
  }

  /**
   * API endpoint to initialize default settings
   */
  async initializeDefaultSettingsAPI(req, res) {
    try {
      const adminId = req.user.userId;

      this.logger.log(`🚀 Initialize default settings request by admin: ${adminId}`);

      const result = await AdminService.initializeDefaultSettings(adminId);

      res.json({
        success: true,
        message: result.message,
        totalSettings: result.totalSettings,
        timestamp: new Date()
      });

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to initialize default settings');
    }
  }

  /**
   * API endpoint to validate single setting value
   */
  async validateSettingAPI(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { category, key, value } = req.body;
      const adminId = req.user.userId;

      // Get setting configuration
      const setting = await AdminService.getSettingConfig(category, key, adminId);
      if (!setting) {
        return res.json({
          valid: false,
          error: 'Setting not found'
        });
      }

      // Validate using AdminService
      const validationResult = AdminService.validateSettingValue(setting, value);
      
      res.json({
        valid: validationResult.valid,
        error: validationResult.error || null
      });

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to validate setting');
    }
  }

  // ===============================================
  // SETTINGS VALIDATION RULES
  // ===============================================

  /**
   * Validation rules for updating single setting
   */
  static getUpdateSettingValidationRules() {
    return [
      body('category').isLength({ min: 2, max: 50 }).withMessage('Category must be 2-50 characters'),
      body('key').isLength({ min: 2, max: 100 }).withMessage('Key must be 2-100 characters'),
      body('value').exists().withMessage('Value is required'),
      body('reason').optional().isLength({ min: 3, max: 200 }).withMessage('Reason must be 3-200 characters')
    ];
  }

  /**
   * Validation rules for bulk settings update
   */
  static getBulkUpdateSettingsValidationRules() {
    return [
      body('updates').isArray({ min: 1, max: 50 }).withMessage('Updates must be an array with 1-50 items'),
      body('updates.*.category').isLength({ min: 2, max: 50 }).withMessage('Each category must be 2-50 characters'),
      body('updates.*.key').isLength({ min: 2, max: 100 }).withMessage('Each key must be 2-100 characters'),
      body('updates.*.value').exists().withMessage('Each value is required'),
      body('reason').optional().isLength({ min: 3, max: 200 }).withMessage('Reason must be 3-200 characters')
    ];
  }

  /**
   * Validation rules for reset setting
   */
  static getResetSettingValidationRules() {
    return [
      body('category').isLength({ min: 2, max: 50 }).withMessage('Category must be 2-50 characters'),
      body('key').isLength({ min: 2, max: 100 }).withMessage('Key must be 2-100 characters')
    ];
  }

  /**
   * Validation rules for getting setting history
   */
  static getSettingHistoryValidationRules() {
    return [
      query('category').isLength({ min: 2, max: 50 }).withMessage('Category must be 2-50 characters'),
      query('key').isLength({ min: 2, max: 100 }).withMessage('Key must be 2-100 characters')
    ];
  }

  // ===============================================
  // MISSING BULK OPERATIONS - TASK 1.1 IMPLEMENTATION
  // ===============================================

  /**
   * API: Bulk block users
   */
  async bulkBlockUsers(req, res) {
    try {
      const adminId = req.user.userId;
      const { userIds, reason } = req.body;
      
      this.logger.log(`🚫 Bulk block request from admin: ${adminId}`, { count: userIds?.length });
      
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return this.sendError(res, 'User IDs array is required', 400);
      }
      
      if (userIds.length > 50) {
        return this.sendError(res, 'Cannot block more than 50 users at once', 400);
      }
      
      if (!reason || reason.trim().length < 10) {
        return this.sendError(res, 'Block reason must be at least 10 characters long', 400);
      }
      
      const result = await AdminService.bulkBlockUsers(userIds, adminId, reason);
      
      this.sendSuccess(res, result, 
        req.t('admin.bulkBlockCompleted') || `${result.successful} users blocked successfully`
      );

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to bulk block users');
    }
  }

  /**
   * API: Bulk suspend users
   */
  async bulkSuspendUsers(req, res) {
    try {
      const adminId = req.user.userId;
      const { userIds, reason, duration = '30' } = req.body;
      
      this.logger.log(`⏸️ Bulk suspend request from admin: ${adminId}`, { count: userIds?.length });
      
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return this.sendError(res, 'User IDs array is required', 400);
      }
      
      if (userIds.length > 50) {
        return this.sendError(res, 'Cannot suspend more than 50 users at once', 400);
      }
      
      if (!reason || reason.trim().length < 10) {
        return this.sendError(res, 'Suspension reason must be at least 10 characters long', 400);
      }
      
      // Validate duration
      const validDurations = ['7', '14', '30', '60', '90', 'permanent'];
      if (!validDurations.includes(duration)) {
        return this.sendError(res, 'Invalid suspension duration', 400);
      }
      
      const result = await AdminService.bulkSuspendUsers(userIds, adminId, reason, duration);
      
      this.sendSuccess(res, result, 
        req.t('admin.bulkSuspendCompleted') || `${result.successful} users suspended successfully`
      );

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to bulk suspend users');
    }
  }

  /**
   * API: Bulk activate users
   */
  async bulkActivateUsers(req, res) {
    try {
      const adminId = req.user.userId;
      const { userIds, notes = '' } = req.body;
      
      this.logger.log(`✅ Bulk activate request from admin: ${adminId}`, { count: userIds?.length });
      
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return this.sendError(res, 'User IDs array is required', 400);
      }
      
      if (userIds.length > 50) {
        return this.sendError(res, 'Cannot activate more than 50 users at once', 400);
      }
      
      const result = await AdminService.bulkActivateUsers(userIds, adminId, notes);
      
      this.sendSuccess(res, result, 
        req.t('admin.bulkActivateCompleted') || `${result.successful} users activated successfully`
      );

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to bulk activate users');
    }
  }

  /**
   * API: Bulk delete users (soft delete)
   */
  async bulkDeleteUsers(req, res) {
    try {
      const adminId = req.user.userId;
      const { userIds, reason, confirmAction = false } = req.body;
      
      this.logger.log(`🗑️ Bulk delete request from admin: ${adminId}`, { count: userIds?.length });
      
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.sendValidationError(res, errors);
      }
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return this.sendError(res, 'User IDs array is required', 400);
      }
      
      if (userIds.length > 50) {
        return this.sendError(res, 'Cannot delete more than 50 users at once', 400);
      }
      
      if (!reason || reason.trim().length < 10) {
        return this.sendError(res, 'Deletion reason must be at least 10 characters long', 400);
      }
      
      if (!confirmAction) {
        return this.sendError(res, 'Deletion confirmation is required', 400);
      }
      
      const result = await AdminService.bulkDeleteUsers(userIds, adminId, reason);
      
      this.sendSuccess(res, result, 
        req.t('admin.bulkDeleteCompleted') || `${result.successful} users deleted successfully`
      );

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to bulk delete users');
    }
  }

  /**
   * API: Export users data
   */
  async exportUsers(req, res) {
    try {
      const adminId = req.user.userId;
      const format = req.query.format || 'csv';
      
      this.logger.log(`📊 Users export request from admin: ${adminId}, format: ${format}`);

      // Get filters from query
      const filters = {
        status: req.query.status,
        country: req.query.country,
        companyType: req.query.companyType,
        activityType: req.query.activityType,
        dateRange: req.query.dateRange,
        emailVerified: req.query.emailVerified
      };

      const exportData = await AdminService.exportUsers(adminId, { format, filters });

      // Set appropriate headers
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `users_export_${timestamp}.${format}`;

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      } else if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      }

      res.send(exportData);
    } catch (error) {
      this.logger.error('❌ Error in exportUsers:', error);
      this.sendError(res, error, 'Failed to export users');
    }
  }

  // ===============================================
  // ENHANCED VALIDATION RULES FOR BULK OPERATIONS
  // ===============================================

  /**
   * Validation rules for bulk block operations
   */
  static getBulkBlockValidationRules() {
    return [
      ...AdminController.getBulkValidationRules(),
      body('reason').isLength({ min: 10, max: 500 }).trim().withMessage('Block reason must be 10-500 characters')
    ];
  }

  /**
   * Validation rules for bulk suspend operations
   */
  static getBulkSuspendValidationRules() {
    return [
      ...AdminController.getBulkValidationRules(),
      body('reason').isLength({ min: 10, max: 500 }).trim().withMessage('Suspension reason must be 10-500 characters'),
      body('duration').optional().isIn(['7', '14', '30', '60', '90', 'permanent']).withMessage('Invalid suspension duration')
    ];
  }

  /**
   * Validation rules for bulk delete operations
   */
  static getBulkDeleteValidationRules() {
    return [
      ...AdminController.getBulkValidationRules(),
      body('reason').isLength({ min: 10, max: 500 }).trim().withMessage('Deletion reason must be 10-500 characters'),
      body('confirmAction').isBoolean().withMessage('Confirmation is required').custom(value => {
        if (!value) {
          throw new Error('Deletion must be confirmed');
        }
        return true;
      })
    ];
  }

  // ===============================================
  // ADMIN PROFILE API METHODS
  // ===============================================

  /**
   * Get admin profile data
   */
  async getAdminProfile(req, res) {
    try {
      const adminId = req.user.userId;
      this.logger.log(`👤 Admin profile API request from: ${adminId}`);

      // Get admin profile data
      const profileData = await AdminService.getAdminProfile(adminId);

      res.json({
        success: true,
        data: profileData,
        timestamp: new Date()
      });

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to get admin profile');
    }
  }

  /**
   * Update admin profile
   */
  async updateAdminProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const adminId = req.user.userId;
      const updateData = req.body;

      this.logger.log(`👤 Admin profile update request from: ${adminId}`);

      // Update admin profile
      const updatedProfile = await AdminService.updateAdminProfile(adminId, updateData);

      res.json({
        success: true,
        data: updatedProfile,
        message: 'Profile updated successfully'
      });

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to update admin profile');
    }
  }

  /**
   * Change admin password
   */
  async changeAdminPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const adminId = req.user.userId;
      const { currentPassword, newPassword } = req.body;

      this.logger.log(`🔑 Admin password change request from: ${adminId}`);

      // Change admin password
      await AdminService.changeAdminPassword(adminId, currentPassword, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to change password');
    }
  }

  /**
   * Change admin profile picture
   */
  async changeAdminPicture(req, res) {
    try {
      const adminId = req.user.userId;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      this.logger.log(`📷 Admin picture change request from: ${adminId}`);

      // Change admin picture
      const avatarUrl = await AdminService.changeAdminPicture(adminId, file);

      res.json({
        success: true,
        data: { avatarUrl },
        message: 'Profile picture updated successfully'
      });

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to change profile picture');
    }
  }

  /**
   * Get admin profile stats
   */
  async getAdminStats(req, res) {
    try {
      const adminId = req.user.userId;
      this.logger.log(`📊 Admin stats request from: ${adminId}`);

      // Get admin statistics
      const stats = await AdminService.getAdminStats(adminId);

      res.json({
        success: true,
        data: stats,
        timestamp: new Date()
      });

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to get admin stats');
    }
  }

  /**
   * Get admin activity log
   */
  async getAdminActivity(req, res) {
    try {
      const adminId = req.user.userId;
      const { limit = 50, offset = 0, type } = req.query;

      this.logger.log(`📝 Admin activity request from: ${adminId}`);

      // Get admin activity
      const activities = await AdminService.getAdminActivity(adminId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        type
      });

      res.json({
        success: true,
        data: activities,
        timestamp: new Date()
      });

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to get admin activity');
    }
  }

  /**
   * Get admin active sessions
   */
  async getAdminSessions(req, res) {
    try {
      const adminId = req.user.userId;
      this.logger.log(`💻 Admin sessions request from: ${adminId}`);

      // Get admin active sessions
      const sessions = await AdminService.getAdminSessions(adminId);

      res.json({
        success: true,
        data: sessions,
        timestamp: new Date()
      });

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to get admin sessions');
    }
  }

  /**
   * Terminate admin session
   */
  async terminateAdminSession(req, res) {
    try {
      const adminId = req.user.userId;
      const { sessionId } = req.params;

      this.logger.log(`🔒 Admin session termination request from: ${adminId}, session: ${sessionId}`);

      if (sessionId === 'all-others') {
        // Terminate all other sessions
        await AdminService.terminateAllOtherSessions(adminId, req.sessionID);
      } else {
        // Terminate specific session
        await AdminService.terminateAdminSession(adminId, sessionId);
      }

      res.json({
        success: true,
        message: sessionId === 'all-others' ? 'All other sessions terminated' : 'Session terminated successfully'
      });

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to terminate session');
    }
  }

  /**
   * Get admin security info
   */
  async getAdminSecurity(req, res) {
    try {
      const adminId = req.user.userId;
      this.logger.log(`🛡️ Admin security request from: ${adminId}`);

      // Get admin security info
      const securityInfo = await AdminService.getAdminSecurity(adminId);

      res.json({
        success: true,
        data: securityInfo,
        timestamp: new Date()
      });

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to get admin security info');
    }
  }

  /**
   * Setup 2FA for admin
   */
  async setupAdmin2FA(req, res) {
    try {
      const adminId = req.user.userId;
      this.logger.log(`🔐 Admin 2FA setup request from: ${adminId}`);

      // Setup 2FA
      const setupData = await AdminService.setupAdmin2FA(adminId);

      res.json({
        success: true,
        data: setupData,
        message: '2FA setup initiated'
      });

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to setup 2FA');
    }
  }

  /**
   * Verify 2FA for admin
   */
  async verifyAdmin2FA(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const adminId = req.user.userId;
      const { code } = req.body;

      this.logger.log(`🔐 Admin 2FA verification request from: ${adminId}`);

      // Verify 2FA code
      await AdminService.verifyAdmin2FA(adminId, code);

      res.json({
        success: true,
        message: '2FA enabled successfully'
      });

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to verify 2FA');
    }
  }

  /**
   * Toggle 2FA for admin
   */
  async toggleAdmin2FA(req, res) {
    try {
      const adminId = req.user.userId;
      const { enabled } = req.body;

      this.logger.log(`🔐 Admin 2FA toggle request from: ${adminId}, enabled: ${enabled}`);

      // Toggle 2FA
      await AdminService.toggleAdmin2FA(adminId, enabled);

      res.json({
        success: true,
        message: `2FA ${enabled ? 'enabled' : 'disabled'} successfully`
      });

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to toggle 2FA');
    }
  }

  /**
   * Export admin profile data
   */
  async exportAdminProfile(req, res) {
    try {
      const adminId = req.user.userId;
      this.logger.log(`📤 Admin profile export request from: ${adminId}`);

      // Export admin profile data
      const exportData = await AdminService.exportAdminProfile(adminId);

      res.json({
        success: true,
        data: exportData,
        message: 'Profile data exported successfully'
      });

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to export profile data');
    }
  }

  /**
   * Update admin preferences
   */
  async updateAdminPreferences(req, res) {
    try {
      const adminId = req.user.userId;
      const preferences = req.body;

      this.logger.log(`⚙️ Admin preferences update request from: ${adminId}`);

      // Update preferences
      const updatedPreferences = await AdminService.updateAdminPreferences(adminId, preferences);

      res.json({
        success: true,
        data: updatedPreferences,
        message: 'Preferences updated successfully'
      });

    } catch (error) {
      this.handleAPIError(res, error, 'Failed to update preferences');
    }
  }

  // ===============================================
  // ADMIN PROFILE VALIDATION RULES
  // ===============================================

  /**
   * Get admin profile update validation rules
   */
  static getAdminProfileValidationRules() {
    return [
      body('firstName').optional().isLength({ min: 2, max: 50 }).trim().withMessage('First name must be 2-50 characters'),
      body('lastName').optional().isLength({ min: 2, max: 50 }).trim().withMessage('Last name must be 2-50 characters'),
      body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
      body('bio').optional().isLength({ max: 500 }).trim().withMessage('Bio must be less than 500 characters'),
      body('jobTitle').optional().isLength({ max: 100 }).trim().withMessage('Job title must be less than 100 characters'),
      body('department').optional().isIn(['administration', 'operations', 'finance', 'marketing', 'support']).withMessage('Invalid department')
    ];
  }

  /**
   * Get admin password change validation rules
   */
  static getAdminPasswordValidationRules() {
    return [
      body('currentPassword').notEmpty().withMessage('Current password is required'),
      body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).withMessage('Password must contain uppercase, lowercase, number and special character'),
      body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Password confirmation does not match');
        }
        return true;
      })
    ];
  }

  /**
   * Get 2FA verification validation rules
   */
  static get2FAValidationRules() {
    return [
      body('code').isLength({ min: 6, max: 6 }).isNumeric().withMessage('2FA code must be 6 digits')
    ];
  }
}

module.exports = AdminController;