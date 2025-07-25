/**
 * Admin Service
 * Handles all admin-related business logic
 */

const User = require('../models/User');
const Admin = require('../models/Admin');
const EmailService = require('./EmailService');

class AdminService {
  /**
   * Get pending company admin registrations
   */
  async getPendingApprovals(adminId, filters = {}) {
    try {
      const admin = await Admin.findById(adminId);
      if (!admin.hasPermission('canApproveUsers')) {
        throw new Error('Insufficient permissions to view pending approvals');
      }

      const query = { 
        status: 'blocked',
        approvedBy: null,
        rejectedBy: null
      };

      // Apply filters
      if (filters.country) query.country = filters.country;
      if (filters.activityType) query.activityType = filters.activityType;
      if (filters.dateFrom) query.createdAt = { $gte: new Date(filters.dateFrom) };
      if (filters.dateTo) {
        query.createdAt = query.createdAt || {};
        query.createdAt.$lte = new Date(filters.dateTo);
      }

      const pendingUsers = await User.find(query)
        .sort({ createdAt: -1 })
        .select('-password')
        .populate('approvedBy', 'name email')
        .populate('rejectedBy', 'name email');

      return {
        pendingUsers,
        total: pendingUsers.length,
        filters: filters
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Get specific user details for approval review
   */
  async getUserDetails(userId, adminId) {
    try {
      const admin = await Admin.findById(adminId);
      if (!admin.hasPermission('canApproveUsers')) {
        throw new Error('Insufficient permissions to view user details');
      }

      const user = await User.findById(userId)
        .populate('approvedBy', 'name email role')
        .populate('rejectedBy', 'name email role')
        .select('-password');

      if (!user) {
        throw new Error('User not found');
      }

      // Get additional user statistics
      const userStats = await this.getUserStatistics(userId);

      return {
        user,
        statistics: userStats
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Approve company admin
   */
  async approveUser(userId, adminId, notes = '') {
    try {
      const admin = await Admin.findById(adminId);
      if (!admin.hasPermission('canApproveUsers')) {
        throw new Error('Insufficient permissions to approve users');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.status !== 'blocked' || user.approvedBy) {
        throw new Error('User has already been processed');
      }

      // Approve the user
      await user.approve(adminId);
      
      // Track admin activity
      await admin.trackUserApproval(userId);

      // Send approval notification email
      await EmailService.sendApprovalEmail(user.email, {
        companyName: user.companyName,
        approvedBy: admin.name,
        approvedAt: user.approvedAt,
        loginUrl: process.env.APP_URL + '/login'
      });

      // Log activity
      console.log(`Company admin approved: ${user.email} by ${admin.name}`);

      return {
        userId: user._id,
        companyName: user.companyName,
        email: user.email,
        status: user.status,
        approvedBy: admin.name,
        approvedAt: user.approvedAt,
        notes
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Reject company admin
   */
  async rejectUser(userId, adminId, reason) {
    try {
      const admin = await Admin.findById(adminId);
      if (!admin.hasPermission('canApproveUsers')) {
        throw new Error('Insufficient permissions to reject users');
      }

      if (!reason || reason.trim().length < 10) {
        throw new Error('Rejection reason must be at least 10 characters long');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.status !== 'blocked' || user.approvedBy) {
        throw new Error('User has already been processed');
      }

      // Reject the user
      await user.reject(adminId, reason.trim());
      
      // Track admin activity
      await admin.trackUserRejection(userId, reason.trim());

      // Send rejection notification email
      await EmailService.sendRejectionEmail(user.email, {
        companyName: user.companyName,
        rejectedBy: admin.name,
        rejectedAt: user.rejectedAt,
        rejectionReason: user.rejectionReason,
        supportEmail: 'support@slex.uz'
      });

      // Log activity
      console.log(`Company admin rejected: ${user.email} by ${admin.name} - Reason: ${reason}`);

      return {
        userId: user._id,
        companyName: user.companyName,
        email: user.email,
        status: user.status,
        rejectedBy: admin.name,
        rejectedAt: user.rejectedAt,
        rejectionReason: user.rejectionReason
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all company admins with pagination and filtering
   */
  async getAllUsers(adminId, options = {}) {
    try {
      const admin = await Admin.findById(adminId);
      if (!admin.hasPermission('canViewReports')) {
        throw new Error('Insufficient permissions to view user reports');
      }

      const {
        page = 1,
        limit = 20,
        status,
        country,
        activityType,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      // Build query
      const query = {};
      
      if (status) query.status = status;
      if (country) query.country = country;
      if (activityType) query.activityType = activityType;
      
      if (search) {
        query.$or = [
          { companyName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { taxNumber: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      const [users, total] = await Promise.all([
        User.find(query)
          .populate('approvedBy', 'name email')
          .populate('rejectedBy', 'name email')
          .select('-password')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        User.countDocuments(query)
      ]);

      return {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          limit: parseInt(limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        filters: { status, country, activityType, search },
        sorting: { sortBy, sortOrder }
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Suspend company admin
   */
  async suspendUser(userId, adminId, reason) {
    try {
      const admin = await Admin.findById(adminId);
      if (admin.role !== 'super_admin') {
        throw new Error('Only super admins can suspend users');
      }

      if (!reason || reason.trim().length < 10) {
        throw new Error('Suspension reason must be at least 10 characters long');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.status === 'suspended') {
        throw new Error('User is already suspended');
      }

      user.status = 'suspended';
      user.rejectedBy = adminId;
      user.rejectedAt = Date.now();
      user.rejectionReason = reason.trim();
      await user.save();

      // Send suspension notification
      await EmailService.sendSuspensionEmail(user.email, {
        companyName: user.companyName,
        suspendedBy: admin.name,
        suspendedAt: user.rejectedAt,
        suspensionReason: user.rejectionReason,
        supportEmail: 'support@slex.uz'
      });

      console.log(`Company admin suspended: ${user.email} by ${admin.name} - Reason: ${reason}`);

      return {
        userId: user._id,
        companyName: user.companyName,
        status: user.status,
        suspendedBy: admin.name,
        suspensionReason: reason.trim()
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Reactivate company admin
   */
  async reactivateUser(userId, adminId) {
    try {
      const admin = await Admin.findById(adminId);
      if (admin.role !== 'super_admin') {
        throw new Error('Only super admins can reactivate users');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.status === 'active') {
        throw new Error('User is already active');
      }

      await user.approve(adminId);

      // Send reactivation notification
      await EmailService.sendReactivationEmail(user.email, {
        companyName: user.companyName,
        reactivatedBy: admin.name,
        reactivatedAt: user.approvedAt,
        loginUrl: process.env.APP_URL + '/login'
      });

      console.log(`Company admin reactivated: ${user.email} by ${admin.name}`);

      return {
        userId: user._id,
        companyName: user.companyName,
        status: user.status,
        reactivatedBy: admin.name
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Get admin dashboard statistics
   */
  async getDashboardStats(adminId) {
    try {
      const admin = await Admin.findById(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }
      
      // Check permission
      if (admin.role !== 'super_admin' && !(admin.permissions && admin.permissions.canViewReports)) {
        throw new Error('Insufficient permissions to view dashboard statistics');
      }

      const [
        totalUsers,
        pendingApprovals,
        activeUsers,
        suspendedUsers,
        rejectedUsers,
        recentRegistrations,
        usersByCountry,
        usersByActivity,
        monthlyStats
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ status: 'blocked', approvedBy: null, rejectedBy: null }),
        User.countDocuments({ status: 'active' }),
        User.countDocuments({ status: 'suspended' }),
        User.countDocuments({ status: 'blocked', rejectedBy: { $ne: null } }),
        User.find().sort({ createdAt: -1 }).limit(10).select('companyName email country createdAt status'),
        User.aggregate([
          { $group: { _id: '$country', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        User.aggregate([
          { $group: { _id: '$activityType', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        this.getMonthlyRegistrationStats()
      ]);

      const adminStats = admin.getStatistics();

      return {
        overview: {
          totalUsers,
          pendingApprovals,
          activeUsers,
          suspendedUsers,
          rejectedUsers
        },
        recentActivity: recentRegistrations,
        distribution: {
          byCountry: usersByCountry,
          byActivity: usersByActivity
        },
        trends: {
          monthlyRegistrations: monthlyStats
        },
        adminActivity: adminStats
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Get monthly registration statistics
   */
  async getMonthlyRegistrationStats() {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const stats = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            total: { $sum: 1 },
            approved: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            pending: {
              $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] }
            },
            rejected: {
              $sum: { $cond: [{ $ne: ['$rejectedBy', null] }, 1, 0] }
            }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);

      return stats;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        registrationDate: user.createdAt,
        lastLogin: user.lastLoginAt,
        loginAttempts: user.loginAttempts,
        emailVerified: user.emailVerified,
        profileCompleted: user.profileCompleted,
        hasCompanyLogo: !!user.companyLogo
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Bulk approve users
   */
  async bulkApproveUsers(userIds, adminId) {
    try {
      const admin = await Admin.findById(adminId);
      if (!admin.hasPermission('canApproveUsers')) {
        throw new Error('Insufficient permissions to approve users');
      }

      const results = [];
      
      for (const userId of userIds) {
        try {
          const result = await this.approveUser(userId, adminId);
          results.push({ userId, status: 'approved', data: result });
        } catch (error) {
          results.push({ userId, status: 'failed', error: error.message });
        }
      }

      return {
        total: userIds.length,
        successful: results.filter(r => r.status === 'approved').length,
        failed: results.filter(r => r.status === 'failed').length,
        results
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Bulk reject users
   */
  async bulkRejectUsers(userIds, adminId, reason) {
    try {
      const admin = await Admin.findById(adminId);
      if (!admin.hasPermission('canApproveUsers')) {
        throw new Error('Insufficient permissions to reject users');
      }

      if (!reason || reason.trim().length < 10) {
        throw new Error('Rejection reason must be at least 10 characters long');
      }

      const results = [];
      
      for (const userId of userIds) {
        try {
          const result = await this.rejectUser(userId, adminId, reason);
          results.push({ userId, status: 'rejected', data: result });
        } catch (error) {
          results.push({ userId, status: 'failed', error: error.message });
        }
      }

      return {
        total: userIds.length,
        successful: results.filter(r => r.status === 'rejected').length,
        failed: results.filter(r => r.status === 'failed').length,
        results
      };

    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AdminService();