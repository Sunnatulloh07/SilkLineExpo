/**
 * User Controller
 * Handles HTTP requests for company admin user endpoints
 */

const User = require('../models/User');
const FileService = require('../services/FileService');

class UserController {
  /**
   * Show user dashboard
   */
  async showDashboard(req, res) {
    try {
      const user = req.user;
      
      // Get user statistics
      const stats = {
        profileCompleted: user.profileCompleted,
        lastLogin: user.lastLoginAt,
        accountStatus: user.status,
        registrationDate: user.createdAt
      };

      res.render('user/dashboard', {
        title: req.t('user.dashboard'),
        user,
        stats
      });

    } catch (error) {
      console.error('Show user dashboard error:', error);
      res.status(500).render('pages/error', {
        title: 'Error',
        message: error.message
      });
    }
  }

  /**
   * Show user profile page
   */
  async showProfile(req, res) {
    try {
      const user = req.user;

      res.render('user/profile', {
        title: req.t('user.profile'),
        user,
        formData: user.toObject()
      });

    } catch (error) {
      console.error('Show profile error:', error);
      res.status(500).render('pages/error', {
        title: 'Error',
        message: error.message
      });
    }
  }

  /**
   * API: Get user profile
   */
  async getProfile(req, res) {
    try {
      const user = req.user;
      
      const profileData = {
        companyName: user.companyName,
        email: user.email,
        phone: user.phone,
        taxNumber: user.taxNumber,
        activityType: user.activityType,
        country: user.country,
        city: user.city,
        address: user.address,
        companyLogo: user.companyLogo,
        preferredLanguage: user.preferredLanguage,
        status: user.status,
        profileCompleted: user.profileCompleted,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      };

      res.json({
        success: true,
        data: profileData
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * API: Update user profile
   */
  async updateProfile(req, res) {
    try {
      const userId = req.session.userId;
      const updateData = {
        companyName: req.body.companyName,
        phone: req.body.phone,
        city: req.body.city,
        address: req.body.address,
        preferredLanguage: req.body.preferredLanguage
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === '') {
          delete updateData[key];
        }
      });

      // Validate required fields
      if (updateData.companyName && updateData.companyName.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: req.t('user.errors.companyNameTooShort')
        });
      }

      if (updateData.phone && !/^\+[1-9]\d{6,14}$/.test(updateData.phone)) {
        return res.status(400).json({
          success: false,
          message: req.t('user.errors.invalidPhone')
        });
      }

      // Update user
      const user = await User.findByIdAndUpdate(
        userId,
        { 
          ...updateData,
          updatedAt: Date.now()
        },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: req.t('user.errors.userNotFound')
        });
      }

      res.json({
        success: true,
        message: req.t('user.profileUpdated'),
        data: {
          companyName: user.companyName,
          phone: user.phone,
          city: user.city,
          address: user.address,
          preferredLanguage: user.preferredLanguage,
          updatedAt: user.updatedAt
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: validationErrors.join(', ')
        });
      }

      res.status(500).json({
        success: false,
        message: req.t('user.errors.updateFailed')
      });
    }
  }

  /**
   * API: Update company logo
   */
  async updateCompanyLogo(req, res) {
    try {
      const userId = req.session.userId;
      const logoFile = req.file;

      if (!logoFile) {
        return res.status(400).json({
          success: false,
          message: req.t('user.errors.logoRequired')
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: req.t('user.errors.userNotFound')
        });
      }

      // Delete old logo if exists
      if (user.companyLogo) {
        await FileService.deleteCompanyLogo(user.companyLogo);
      }

      // Process new logo
      const logoData = await FileService.processCompanyLogo(logoFile);

      // Update user with new logo
      user.companyLogo = logoData;
      user.updatedAt = Date.now();
      await user.save();

      res.json({
        success: true,
        message: req.t('user.logoUpdated'),
        data: {
          companyLogo: logoData
        }
      });

    } catch (error) {
      console.error('Update company logo error:', error);
      
      // Clean up uploaded file on error
      if (req.file) {
        await FileService.deleteFile(req.file.path).catch(console.error);
      }

      let statusCode = 500;
      let message = req.t('user.errors.logoUpdateFailed');

      if (error.message.includes('file') || error.message.includes('upload')) {
        statusCode = 413; // Payload too large
        message = error.message;
      }

      res.status(statusCode).json({
        success: false,
        message
      });
    }
  }

  /**
   * API: Delete company logo
   */
  async deleteCompanyLogo(req, res) {
    try {
      const userId = req.session.userId;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: req.t('user.errors.userNotFound')
        });
      }

      if (!user.companyLogo) {
        return res.status(400).json({
          success: false,
          message: req.t('user.errors.noLogoToDelete')
        });
      }

      // Delete logo file
      await FileService.deleteCompanyLogo(user.companyLogo);

      // Update user
      user.companyLogo = null;
      user.updatedAt = Date.now();
      await user.save();

      res.json({
        success: true,
        message: req.t('user.logoDeleted')
      });

    } catch (error) {
      console.error('Delete company logo error:', error);
      res.status(500).json({
        success: false,
        message: req.t('user.errors.logoDeleteFailed')
      });
    }
  }

  /**
   * API: Change password
   */
  async changePassword(req, res) {
    try {
      const userId = req.session.userId;
      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Validate required fields
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: req.t('user.errors.passwordFieldsRequired')
        });
      }

      // Validate password confirmation
      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: req.t('user.errors.passwordMismatch')
        });
      }

      // Validate password strength
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: req.t('user.errors.passwordTooShort')
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: req.t('user.errors.userNotFound')
        });
      }

      // Verify current password
      const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordCorrect) {
        return res.status(400).json({
          success: false,
          message: req.t('user.errors.currentPasswordIncorrect')
        });
      }

      // Update password
      user.password = newPassword;
      user.updatedAt = Date.now();
      await user.save();

      res.json({
        success: true,
        message: req.t('user.passwordChanged')
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: req.t('user.errors.passwordChangeFailed')
      });
    }
  }

  /**
   * API: Get account status
   */
  async getAccountStatus(req, res) {
    try {
      const user = req.user;
      
      const statusInfo = {
        status: user.status,
        statusText: this.getStatusText(user.status, req.t),
        canLogin: user.status === 'active',
        registrationDate: user.createdAt,
        approvedAt: user.approvedAt,
        approvedBy: user.approvedBy,
        rejectedAt: user.rejectedAt,
        rejectedBy: user.rejectedBy,
        rejectionReason: user.rejectionReason,
        emailVerified: user.emailVerified,
        profileCompleted: user.profileCompleted
      };

      res.json({
        success: true,
        data: statusInfo
      });

    } catch (error) {
      console.error('Get account status error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Show account settings page
   */
  async showSettings(req, res) {
    try {
      const user = req.user;

      res.render('user/settings', {
        title: req.t('user.settings'),
        user
      });

    } catch (error) {
      console.error('Show settings error:', error);
      res.status(500).render('pages/error', {
        title: 'Error',
        message: error.message
      });
    }
  }

  /**
   * Show company profile page (public view)
   */
  async showCompanyProfile(req, res) {
    try {
      const userId = req.params.userId;
      
      const user = await User.findById(userId)
        .select('companyName email phone country city address activityType companyLogo createdAt status')
        .where('status').equals('active');

      if (!user) {
        return res.status(404).render('pages/error', {
          title: 'Not Found',
          message: req.t('user.errors.companyNotFound')
        });
      }

      res.render('pages/company-profile', {
        title: user.companyName,
        company: user
      });

    } catch (error) {
      console.error('Show company profile error:', error);
      res.status(500).render('pages/error', {
        title: 'Error',
        message: error.message
      });
    }
  }

  /**
   * Helper: Get status text
   */
  getStatusText(status, t) {
    const statusMap = {
      'blocked': t('user.status.blocked'),
      'active': t('user.status.active'),
      'suspended': t('user.status.suspended'),
      'deleted': t('user.status.deleted')
    };
    
    return statusMap[status] || status;
  }
}

module.exports = new UserController();