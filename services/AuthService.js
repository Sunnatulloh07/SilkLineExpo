/**
 * Authentication Service
 * Handles all authentication business logic
 */

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Admin = require('../models/Admin');
const FileService = require('./FileService');
const EmailService = require('./EmailService');

class AuthService {
  /**
   * Register new company admin
   */
  async registerCompanyAdmin(userData, logoFile) {
    try {
      // Validate required fields
      this.validateRegistrationData(userData);

      // Check if user already exists
      const existingUser = await User.findByEmailOrTaxNumber(userData.email);
      if (existingUser) {
        // Clean up uploaded file if user exists
        if (logoFile) {
          await FileService.deleteFile(logoFile.path);
        }
        throw new Error('User with this email or tax number already exists');
      }

      // Process company logo if uploaded
      let logoData = null;
      if (logoFile) {
        logoData = await FileService.processCompanyLogo(logoFile);
      }

      // Prepare user data
      const processedUserData = {
        companyName: userData.companyName.trim(),
        email: userData.email.toLowerCase().trim(),
        phone: userData.phone.trim(),
        taxNumber: userData.taxNumber.trim(),
        activityType: userData.activityType,
        companyType: userData.companyType,
        country: userData.country,
        city: userData.city.trim(),
        address: userData.address.trim(),
        password: userData.password,
        preferredLanguage: userData.preferredLanguage || 'uz',
        status: 'pending', // Default pending status
        companyLogo: logoData
      };

      // Create new user
      const newUser = new User(processedUserData);
      await newUser.save();

      // Generate email verification token
      const verificationToken = newUser.generateEmailVerificationToken();
      await newUser.save();

      // Send notification emails
      await this.sendRegistrationNotifications(newUser, verificationToken);

      // Create admin notification for new user registration
      try {
        const AdminService = require('./AdminService');
        await AdminService.createUserRegistrationNotification(newUser._id, {
          companyName: newUser.companyName,
          email: newUser.email,
          country: newUser.country,
          companyType: newUser.companyType
        });
        console.log('✅ Admin notification created for new user registration:', newUser.email);
      } catch (notificationError) {
        console.error('❌ Failed to create admin notification:', notificationError);
        // Don't fail the registration if notification fails
      }

      return {
        userId: newUser._id,
        companyName: newUser.companyName,
        email: newUser.email,
        status: newUser.status,
        message: 'Registration successful. Awaiting admin approval.'
      };

    } catch (error) {
      // Clean up uploaded file on error
      if (logoFile) {
        await FileService.deleteFile(logoFile.path).catch(console.error);
      }
      throw error;
    }
  }

  /**
   * Unified Login - Auto-detects user type (Admin or Company User)
   */
  async unifiedLogin(identifier, password, rememberMe = false) {
    try {      
      // First, try to find admin by email
      let user = await Admin.findOne({ email: identifier.toLowerCase().trim() });
      let userType = 'admin';
      
      // If not found in admins, try company users
      if (!user) {
        user = await User.findByEmailOrTaxNumber(identifier);
        userType = 'user';
      }
      if (!user) {
        throw new Error('Invalid email/identifier or password');
      }

      // Check if account is locked
      if (user.isLocked) {
        const error = new Error('Account is temporarily locked due to multiple failed login attempts');
        error.type = 'locked';
        throw error;
      }

      // Verify password
      const isPasswordCorrect = await user.comparePassword(password);
      if (!isPasswordCorrect) {
        await user.incLoginAttempts();
        const maxAttempts = userType === 'admin' ? 3 : 5;
        const attemptsRemaining = Math.max(0, maxAttempts - (user.loginAttempts + 1));
        
        const error = new Error(`Invalid credentials. ${attemptsRemaining} attempts remaining.`);
        error.type = 'invalid_credentials';
        error.data = { attemptsRemaining };
        throw error;
      }

      // Check account status
      await this.validateAccountStatus(user, userType);

      // Successful login
      await user.resetLoginAttempts();

      // Generate session token for admins
      let sessionToken = null;
      if (userType === 'admin') {
        sessionToken = user.generateSessionToken();
        await user.save();
      }

      return {
        userId: user._id,
        name: user.name || user.companyName,
        email: user.email,
        role: user.role,
        status: user.status,
        userType: userType,
        preferredLanguage: user.preferredLanguage,
        sessionToken,
        rememberMe
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Legacy Login method (for backward compatibility)
   */
  async login(identifier, password, rememberMe = false, userType = 'user') {
    return this.unifiedLogin(identifier, password, rememberMe);
  }

  /**
   * Validate account status for login
   */
  async validateAccountStatus(user, userType) {
    if (userType === 'admin') {
      if (user.status !== 'active') {
        throw new Error('Admin account is inactive');
      }
    } else {
      if (user.status === 'pending') {
        const error = new Error('Hisobingiz hali tasdiqlanmagan. Admin tasdiqlashini kuting.');
        error.type = 'pending';
        error.data = {
          status: user.status,
          registrationDate: user.createdAt,
          message: 'Hisobingiz hali tasdiqlanmagan. Admin tasdiqlashini kuting.'
        };
        throw error;
      }
      
      if (user.status === 'blocked') {
        const error = new Error('Hisobingiz bloklangan. Yordam uchun admin bilan bog\'laning.');
        error.type = 'blocked';
        error.data = {
          status: user.status,
          registrationDate: user.createdAt,
          message: 'Hisobingiz bloklangan. Yordam uchun admin bilan bog\'laning.'
        };
        throw error;
      }
      
      if (user.status === 'suspended') {
        const error = new Error('Hisobingiz vaqtincha to\'xtatilgan. Yordam uchun admin bilan bog\'laning.');
        error.type = 'suspended';
        throw error;
      }
    }
  }

  /**
   * Validate registration data
   */
  validateRegistrationData(userData) {
    const required = [
      'companyName', 'email', 'phone', 'taxNumber', 
      'activityType', 'country', 'city', 'address', 
      'password', 'confirmPassword'
    ];

    for (const field of required) {
      if (!userData[field] || userData[field].toString().trim() === '') {
        throw new Error(`${field} is required`);
      }
    }

    // Password confirmation
    if (userData.password !== userData.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Terms agreement
    if (!userData.agreeTerms) {
      throw new Error('You must agree to the Terms of Service and Privacy Policy');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new Error('Please enter a valid email address');
    }

    // Phone validation
    const phoneRegex = /^\+[1-9]\d{6,14}$/;
    if (!phoneRegex.test(userData.phone)) {
      throw new Error('Please enter a valid phone number');
    }

    // Tax number validation
    if (userData.taxNumber.length < 6 || userData.taxNumber.length > 20) {
      throw new Error('Tax number must be between 6 and 20 characters');
    }

    // Password strength
    if (userData.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
  }

  /**
   * Send registration notification emails
   */
  async sendRegistrationNotifications(user, verificationToken) {
    try {
      // Send welcome email to user
      await EmailService.sendWelcomeEmail(user.email, {
        companyName: user.companyName,
        verificationToken
      });

      // Send notification to admins
      await EmailService.sendAdminNotification('new_registration', {
        companyName: user.companyName,
        email: user.email,
        country: user.country,
        activityType: user.activityType,
        registrationDate: user.createdAt
      });

    } catch (error) {
      console.error('Email notification error:', error);
      // Don't throw error for email failures
    }
  }

  /**
   * Get user status and profile
   */
  async getUserStatus(userId, userType = 'user') {
    try {
      let user;
      
      if (userType === 'admin') {
        user = await Admin.findById(userId).select('-password');
      } else {
        user = await User.findById(userId).select('-password');
      }

      if (!user) {
        throw new Error('User not found');
      }

      return {
        user,
        type: userType === 'admin' ? 'admin' : 'company_admin'
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(userId, userType = 'user') {
    try {
      if (userType === 'admin') {
        const admin = await Admin.findById(userId);
        if (admin) {
          await admin.revokeSession();
        }
      }
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reset password request
   */
  async requestPasswordReset(email, userType = 'user') {
    try {
      let user;
      
      if (userType === 'admin') {
        user = await Admin.findOne({ email: email.toLowerCase().trim() });
      } else {
        user = await User.findOne({ email: email.toLowerCase().trim() });
      }

      if (!user) {
        // Don't reveal if email exists or not
        return { message: 'If the email exists, a reset link has been sent' };
      }

      const resetToken = user.generatePasswordResetToken();
      await user.save();

      // Send password reset email
      await EmailService.sendPasswordResetEmail(user.email, {
        name: user.name || user.companyName,
        resetToken,
        userType
      });

      return { message: 'Password reset link has been sent to your email' };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword, userType = 'user') {
    try {
      const crypto = require('crypto');
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      let user;
      const query = {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() }
      };

      if (userType === 'admin') {
        user = await Admin.findOne(query);
      } else {
        user = await User.findOne(query);
      }

      if (!user) {
        throw new Error('Password reset token is invalid or has expired');
      }

      // Update password
      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return { message: 'Password has been reset successfully' };

    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthService();