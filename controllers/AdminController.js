/**
 * Admin Controller
 * Handles HTTP requests for admin panel endpoints
 */

const AdminService = require('../services/AdminService');

class AdminController {
  /**
   * Show admin dashboard
   */
  async showDashboard(req, res) {
    try {
      const adminId = req.user.userId;
      
      // Try to get stats, but provide defaults if it fails
      let stats = {};
      try {
        stats = await AdminService.getDashboardStats(adminId);
      } catch (statsError) {
        console.warn('Stats loading failed, using defaults:', statsError.message);
        stats = {
          totalUsers: 0,
          pendingApprovals: 0,
          activeUsers: 0,
          suspendedUsers: 0,
          rejectedUsers: 0,
          recentRegistrations: [],
          usersByCountry: [],
          usersByActivity: [],
          monthlyStats: []
        };
      }

      res.render('admin/dashboard/index', {
        title: req.t('admin.dashboard') || 'Admin Dashboard',
        stats,
        admin: req.user,
        user: req.user, // For template compatibility
        currentLang: req.language || req.cookies.language || req.cookies.i18next || 'uz',
        lng: req.language || req.cookies.language || req.cookies.i18next || 'uz'
      });

    } catch (error) {
      console.error('Show dashboard error:', error);
      res.status(500).render('pages/error', {
        title: 'Error',
        message: error.message || 'An error occurred while loading the dashboard'
      });
    }
  }

  /**
   * Show pending approvals page
   */
  async showPendingApprovals(req, res) {
    try {
      const adminId = req.user.userId;
      const filters = {
        country: req.query.country,
        activityType: req.query.activityType,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
      };

      const result = await AdminService.getPendingApprovals(adminId, filters);

      res.render('admin/pending-approvals', {
        title: req.t('admin.pendingApprovals'),
        pendingUsers: result.pendingUsers,
        total: result.total,
        filters: result.filters,
        admin: req.user
      });

    } catch (error) {
      console.error('Show pending approvals error:', error);
      res.status(500).render('admin/error', {
        title: 'Error',
        message: error.message
      });
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

      res.render('admin/all-users', {
        title: req.t('admin.allUsers'),
        users: result.users,
        pagination: result.pagination,
        filters: result.filters,
        sorting: result.sorting,
        admin: req.user
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
   * API: Get pending approvals
   */
  async getPendingApprovals(req, res) {
    try {
      const adminId = req.user.userId;
      const filters = {
        country: req.query.country,
        activityType: req.query.activityType,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
      };

      const result = await AdminService.getPendingApprovals(adminId, filters);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Get pending approvals API error:', error);
      res.status(403).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * API: Get user details
   */
  async getUserDetails(req, res) {
    try {
      const adminId = req.user.userId;
      const userId = req.params.userId;

      const result = await AdminService.getUserDetails(userId, adminId);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Get user details API error:', error);
      res.status(403).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * API: Approve user
   */
  async approveUser(req, res) {
    try {
      const adminId = req.user.userId;
      const userId = req.params.userId;
      const notes = req.body.notes || '';

      const result = await AdminService.approveUser(userId, adminId, notes);

      res.json({
        success: true,
        message: req.t('admin.userApproved'),
        data: result
      });

    } catch (error) {
      console.error('Approve user error:', error);
      
      let statusCode = 400;
      if (error.message.includes('permission')) {
        statusCode = 403;
      } else if (error.message.includes('not found')) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * API: Reject user
   */
  async rejectUser(req, res) {
    try {
      const adminId = req.user.userId;
      const userId = req.params.userId;
      const reason = req.body.reason;

      if (!reason || reason.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: req.t('admin.errors.rejectionReasonRequired')
        });
      }

      const result = await AdminService.rejectUser(userId, adminId, reason);

      res.json({
        success: true,
        message: req.t('admin.userRejected'),
        data: result
      });

    } catch (error) {
      console.error('Reject user error:', error);
      
      let statusCode = 400;
      if (error.message.includes('permission')) {
        statusCode = 403;
      } else if (error.message.includes('not found')) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * API: Suspend user
   */
  async suspendUser(req, res) {
    try {
      const adminId = req.user.userId;
      const userId = req.params.userId;
      const reason = req.body.reason;

      if (!reason || reason.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: req.t('admin.errors.suspensionReasonRequired')
        });
      }

      const result = await AdminService.suspendUser(userId, adminId, reason);

      res.json({
        success: true,
        message: req.t('admin.userSuspended'),
        data: result
      });

    } catch (error) {
      console.error('Suspend user error:', error);
      
      let statusCode = 400;
      if (error.message.includes('super admin')) {
        statusCode = 403;
      } else if (error.message.includes('not found')) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * API: Reactivate user
   */
  async reactivateUser(req, res) {
    try {
      const adminId = req.user.userId;
      const userId = req.params.userId;

      const result = await AdminService.reactivateUser(userId, adminId);

      res.json({
        success: true,
        message: req.t('admin.userReactivated'),
        data: result
      });

    } catch (error) {
      console.error('Reactivate user error:', error);
      
      let statusCode = 400;
      if (error.message.includes('super admin')) {
        statusCode = 403;
      } else if (error.message.includes('not found')) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * API: Get all users with pagination
   */
  async getAllUsers(req, res) {
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

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Get all users API error:', error);
      res.status(403).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * API: Get dashboard statistics
   */
  async getDashboardStats(req, res) {
    try {
      const adminId = req.user.userId;
      const stats = await AdminService.getDashboardStats(adminId);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(403).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * API: Bulk approve users
   */
  async bulkApproveUsers(req, res) {
    try {
      const adminId = req.user.userId;
      const { userIds } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: req.t('admin.errors.userIdsRequired')
        });
      }

      const result = await AdminService.bulkApproveUsers(userIds, adminId);

      res.json({
        success: true,
        message: req.t('admin.bulkApprovalCompleted'),
        data: result
      });

    } catch (error) {
      console.error('Bulk approve users error:', error);
      res.status(403).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * API: Bulk reject users
   */
  async bulkRejectUsers(req, res) {
    try {
      const adminId = req.user.userId;
      const { userIds, reason } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: req.t('admin.errors.userIdsRequired')
        });
      }

      if (!reason || reason.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: req.t('admin.errors.rejectionReasonRequired')
        });
      }

      const result = await AdminService.bulkRejectUsers(userIds, adminId, reason);

      res.json({
        success: true,
        message: req.t('admin.bulkRejectionCompleted'),
        data: result
      });

    } catch (error) {
      console.error('Bulk reject users error:', error);
      res.status(403).json({
        success: false,
        message: error.message
      });
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
}

module.exports = new AdminController();