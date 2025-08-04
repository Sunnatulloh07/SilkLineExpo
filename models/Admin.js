/**
 * Admin Model for Super Admins
 * Handles super admin authentication and company admin approval
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please enter a valid email address'
    }
  },
  
  // Authentication
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  
  // Admin Role and Permissions
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator'],
    default: 'super_admin'
  },
  
  permissions: {
    canApproveUsers: { type: Boolean, default: true },
    canManageAdmins: { type: Boolean, default: true },
    canViewReports: { type: Boolean, default: true },
    canManageContent: { type: Boolean, default: true },
    canManageSystem: { type: Boolean, default: true }
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  
  // Login Activity
  lastLoginAt: {
    type: Date,
    default: null
  },
  
  lastLoginIP: {
    type: String,
    default: null
  },
  
  lastLoginUserAgent: {
    type: String,
    default: null
  },
  
  loginAttempts: {
    type: Number,
    default: 0
  },
  
  accountLockedUntil: {
    type: Date,
    default: null
  },
  
  // Security
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  
  twoFactorSecret: String,
  
  // Password Reset
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Activity Tracking
  approvedUsers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  rejectedUsers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],
  
  // Session Management
  sessionToken: String,
  sessionExpires: Date,
  
  // Created By (for admin hierarchy)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  
  // Language Preference
  preferredLanguage: {
    type: String,
    enum: ['uz', 'en', 'ru', 'tr', 'fa', 'zh'],
    default: 'en'
  }
  
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.resetPasswordToken;
      delete ret.twoFactorSecret;
      delete ret.sessionToken;
      return ret;
    }
  }
});

// Indexes (email already indexed via unique: true)
adminSchema.index({ status: 1 });
adminSchema.index({ role: 1 });
adminSchema.index({ createdAt: -1 });

// Virtual for checking if account is locked
adminSchema.virtual('isLocked').get(function() {
  return !!(this.accountLockedUntil && this.accountLockedUntil > Date.now());
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Increment login attempts
adminSchema.methods.incLoginAttempts = function() {
  if (this.accountLockedUntil && this.accountLockedUntil < Date.now()) {
    return this.updateOne({
      $unset: { accountLockedUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 3 failed attempts for 1 hour (stricter for admins)
  if (this.loginAttempts + 1 >= 3 && !this.accountLockedUntil) {
    updates.$set = { accountLockedUntil: Date.now() + 60 * 60 * 1000 }; // 1 hour
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
adminSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, accountLockedUntil: 1 },
    $set: { lastLoginAt: Date.now() }
  });
};

// Check if admin can login
adminSchema.methods.canLogin = function() {
  return this.status === 'active' && !this.isLocked;
};

// Generate session token
adminSchema.methods.generateSessionToken = function() {
  const crypto = require('crypto');
  const sessionToken = crypto.randomBytes(32).toString('hex');
  
  this.sessionToken = crypto.createHash('sha256').update(sessionToken).digest('hex');
  this.sessionExpires = Date.now() + 8 * 60 * 60 * 1000; // 8 hours
  
  return sessionToken;
};

// Generate password reset token
adminSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes (shorter for admins)
  
  return resetToken;
};

// Track user approval
adminSchema.methods.trackUserApproval = function(userId) {
  this.approvedUsers.push({
    userId: userId,
    approvedAt: Date.now()
  });
  return this.save();
};

// Track user rejection
adminSchema.methods.trackUserRejection = function(userId, reason) {
  this.rejectedUsers.push({
    userId: userId,
    rejectedAt: Date.now(),
    reason: reason
  });
  return this.save();
};

// Get admin statistics
adminSchema.methods.getStatistics = function() {
  return {
    totalApprovals: this.approvedUsers.length,
    totalRejections: this.rejectedUsers.length,
    lastLogin: this.lastLoginAt,
    accountCreated: this.createdAt
  };
};

// Static method to find active super admins
adminSchema.statics.getSuperAdmins = function() {
  return this.find({ 
    role: 'super_admin',
    status: 'active'
  })
  .sort({ createdAt: 1 })
  .select('-password');
};

// Static method to get admin by session token
adminSchema.statics.findBySessionToken = function(token) {
  const crypto = require('crypto');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  return this.findOne({
    sessionToken: hashedToken,
    sessionExpires: { $gt: Date.now() },
    status: 'active'
  });
};

// Check if admin has specific permission
adminSchema.methods.hasPermission = function(permission) {
  if (this.role === 'super_admin') return true;
  return this.permissions[permission] || false;
};

// Revoke session
adminSchema.methods.revokeSession = function() {
  this.sessionToken = undefined;
  this.sessionExpires = undefined;
  return this.save();
};

// Validate session token
adminSchema.methods.isValidSession = function(token) {
  if (!this.sessionToken || !this.sessionExpires) return false;
  if (this.sessionExpires < Date.now()) return false;
  
  const crypto = require('crypto');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return this.sessionToken === hashedToken;
};

module.exports = mongoose.model('Admin', adminSchema);