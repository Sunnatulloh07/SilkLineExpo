/**
 * User Model for Company Admins
 * Handles company admin registration and authentication
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Company Information
  companyName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  // Contact Information
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
  
  phone: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(phone) {
        // More flexible phone validation for international numbers
        return /^\+[1-9]\d{7,15}$/.test(phone);
      },
      message: 'Please enter a valid international phone number (e.g., +998901234567)'
    }
  },
  
  // Additional Contact Information
  website: {
    type: String,
    trim: true,
    validate: {
      validator: function(url) {
        if (!url) return true; // Optional field
        return /^https?:\/\/.+\..+/.test(url);
      },
      message: 'Please enter a valid website URL'
    }
  },
  
  socialMedia: {
    linkedin: String,
    facebook: String,
    instagram: String,
    telegram: String
  },
  
  // Business Information
  taxNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 6,
    maxlength: 20
  },
  
  activityType: {
    type: String,
    required: true,
    enum: [
      'food_beverages',
      'textiles_clothing', 
      'electronics',
      'machinery_equipment',
      'chemicals',
      'agriculture',
      'construction_materials',
      'automotive',
      'pharmaceuticals',
      'other'
    ]
  },
  
  // Location Information
  country: {
    type: String,
    required: true,
    enum: [
      'Uzbekistan', 'Kazakhstan', 'China', 'Tajikistan', 'Turkmenistan', 'Afghanistan', 'Kyrgyzstan',
      'Turkey', 'Russia', 'Iran', 'Pakistan', 'India', 'Mongolia', 'Azerbaijan', 'Georgia', 'Armenia',
      'United States', 'United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium',
      'Switzerland', 'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland', 'Czech Republic',
      'Hungary', 'Romania', 'Bulgaria', 'Greece', 'Portugal', 'Ireland', 'Canada', 'Australia', 'Japan',
      'South Korea', 'Singapore', 'Malaysia', 'Thailand', 'Vietnam', 'Philippines', 'Indonesia', 'Brazil',
      'Argentina', 'Chile', 'Mexico', 'Colombia', 'Peru', 'Venezuela', 'South Africa', 'Egypt', 'Morocco',
      'Nigeria', 'Kenya', 'Ghana', 'Ethiopia', 'Uganda', 'Tanzania', 'Algeria', 'Tunisia', 'Libya',
      'Sudan', 'Somalia', 'Djibouti', 'Eritrea', 'Yemen', 'Oman', 'UAE', 'Qatar', 'Kuwait', 'Bahrain',
      'Saudi Arabia', 'Jordan', 'Lebanon', 'Syria', 'Iraq', 'Israel', 'Palestine', 'Cyprus', 'Malta'
    ]
  },
  
  city: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  address: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  
  // Company Logo
  companyLogo: {
    filename: {
      type: String,
      required: true,
      trim: true
    },
    originalName: {
      type: String,
      required: true,
      trim: true
    },
    mimeType: {
      type: String,
      required: true,
      enum: ['image/jpeg', 'image/png', 'image/jpg']
    },
    size: {
      type: Number,
      required: true,
      min: [1, 'File size must be greater than 0'],
      max: [5 * 1024 * 1024, 'File size must not exceed 5MB']
    },
    uploadDate: {
      type: Date,
      default: Date.now
    },
    url: {
      type: String,
      required: true,
      trim: true
    }, // Full URL path for frontend
    thumbnailUrl: {
      type: String,
      trim: true
    }, // Thumbnail URL for frontend
    // Legacy fields for backward compatibility
    path: String,
    thumbnailPath: String
  },
  
  // Authentication
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // Admin Status Management
  status: {
    type: String,
    enum: ['pending', 'active', 'blocked', 'suspended'],
    default: 'pending' // Default pending status requiring super admin approval
  },
  
  // Approval Information
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  
  approvedAt: {
    type: Date,
    default: null
  },
  
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  
  rejectedAt: {
    type: Date,
    default: null
  },
  
  rejectionReason: {
    type: String,
    default: null
  },
  
  // User Role and Company Type
  role: {
    type: String,
    enum: ['company_admin'],
    default: 'company_admin'
  },
  
  companyType: {
    type: String,
    enum: ['manufacturer', 'distributor'],
    required: true
  },
  
  // Business Details
  businessLicense: {
    type: String,
    trim: true
  },
  
  establishedYear: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear()
  },
  
  employeeCount: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '500+']
  },
  
  annualRevenue: {
    type: String,
    enum: ['under-100k', '100k-500k', '500k-1m', '1m-5m', '5m+']
  },

  // Company Description
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Company description cannot exceed 500 characters']
  },
  
  // Note: Capabilities removed - only companyType (manufacturer/distributor) is needed
  
  // Certifications
  certifications: [{
    name: String,
    issuedBy: String,
    issuedDate: Date,
    expiryDate: Date,
    certificateNumber: String
  }],
  
  // Business Metrics
  totalProducts: {
    type: Number,
    default: 0
  },
  
  totalOrders: {
    type: Number,
    default: 0
  },
  
  completedOrders: {
    type: Number,
    default: 0
  },
  
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  totalReviews: {
    type: Number,
    default: 0
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
  
  // Password Reset
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Password Security Tracking
  passwordChangedAt: {
    type: Date,
    default: Date.now
  },
  
  // Email Verification
  emailVerified: {
    type: Boolean,
    default: false
  },
  
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Profile Information
  profileCompleted: {
    type: Boolean,
    default: false
  },
  
  // Terms Agreement
  termsAcceptedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Language Preference
  preferredLanguage: {
    type: String,
    enum: ['uz', 'en', 'ru', 'tr', 'fa', 'zh'],
    default: 'uz'
  },

  // Notification Settings
  emailNotifications: {
    type: Boolean,
    default: true
  },

  orderUpdates: {
    type: Boolean,
    default: true
  },

  marketingEmails: {
    type: Boolean,
    default: false
  },

  priceAlerts: {
    type: Boolean,
    default: false
  },

  weeklyDigest: {
    type: Boolean,
    default: false
  },

  // User Preferences
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'light'
    },
    currency: {
      type: String,
      enum: ['USD', 'UZS', 'EUR', 'RUB'],
      default: 'USD'
    },
    timezone: {
      type: String,
      default: 'Asia/Tashkent'
    },
    itemsPerPage: {
      type: Number,
      default: 20,
      min: 10,
      max: 100
    },
    compactView: {
      type: Boolean,
      default: false
    }
  },

  // Contact Person (for buyer profile)
  contactPerson: {
    type: String,
    trim: true,
    maxlength: 200
  }
  
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.resetPasswordToken;
      delete ret.emailVerificationToken;
      return ret;
    }
  }
});

// Indexes for better performance (email and taxNumber already indexed via unique: true)
userSchema.index({ status: 1 });
userSchema.index({ country: 1 });
userSchema.index({ activityType: 1 });
userSchema.index({ companyType: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ averageRating: -1 });
userSchema.index({ 'companyName': 'text', 'address': 'text' }); // Text search

// Virtual for checking if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.accountLockedUntil && this.accountLockedUntil > Date.now());
});

// Pre-save validations
userSchema.pre('save', function(next) {
  // Note: Capabilities validation removed - only companyType validation remains
  
  // Calculate profile completion
  this.calculateProfileCompletion();
  
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
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
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.accountLockedUntil && this.accountLockedUntil < Date.now()) {
    return this.updateOne({
      $unset: { accountLockedUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.accountLockedUntil) {
    updates.$set = { accountLockedUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, accountLockedUntil: 1 },
    $set: { lastLoginAt: Date.now() }
  });
};

// Check if user can login (active status and not locked)
userSchema.methods.canLogin = function() {
  return this.status === 'active' && !this.isLocked;
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
  
  return resetToken;
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

// Static method to find user by email or tax number
userSchema.statics.findByEmailOrTaxNumber = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { taxNumber: identifier }
    ]
  });
};

// Static method to get users pending approval
userSchema.statics.getPendingApproval = function() {
  return this.find({ status: 'blocked', approvedBy: null })
    .sort({ createdAt: -1 })
    .select('-password');
};

// Static method to get active company admins by country
userSchema.statics.getActiveByCountry = function(country) {
  return this.find({ 
    status: 'active', 
    country: country 
  })
  .sort({ companyName: 1 })
  .select('-password');
};

// Method to approve user
userSchema.methods.approve = function(adminId) {
  this.status = 'active';
  this.approvedBy = adminId;
  this.approvedAt = Date.now();
  this.rejectedBy = null;
  this.rejectedAt = null;
  this.rejectionReason = null;
  return this.save();
};

// Method to reject user
userSchema.methods.reject = function(adminId, reason) {
  this.status = 'blocked';
  this.rejectedBy = adminId;
  this.rejectedAt = Date.now();
  this.rejectionReason = reason;
  this.approvedBy = null;
  this.approvedAt = null;
  return this.save();
};

// Method to suspend user
userSchema.methods.suspend = function(adminId, reason) {
  this.status = 'suspended';
  this.rejectedBy = adminId;
  this.rejectedAt = Date.now();
  this.rejectionReason = reason;
  return this.save();
};

// Method to calculate profile completion
userSchema.methods.calculateProfileCompletion = function() {
  let completedFields = 0;
  const totalFields = 15;
  
  // Required fields
  if (this.companyName) completedFields++;
  if (this.email) completedFields++;
  if (this.phone) completedFields++;
  if (this.taxNumber) completedFields++;
  if (this.activityType) completedFields++;
  if (this.country) completedFields++;
  if (this.city) completedFields++;
  if (this.address) completedFields++;
  if (this.companyType) completedFields++;
  
  // Optional but important fields
  if (this.website) completedFields++;
  if (this.establishedYear) completedFields++;
  if (this.employeeCount) completedFields++;
  if (this.annualRevenue) completedFields++;
  if (this.description) completedFields++;
  if (this.companyLogo && this.companyLogo.filename) completedFields++;
  if (this.certifications && this.certifications.length > 0) completedFields++;
  if (this.businessLicense) completedFields++;
  
  const percentage = Math.round((completedFields / totalFields) * 100);
  this.profileCompleted = percentage >= 80;
  
  return percentage;
};

// Method to get business statistics
userSchema.methods.getBusinessStats = function() {
  return {
    totalProducts: this.totalProducts,
    totalOrders: this.totalOrders,
    completedOrders: this.completedOrders,
    successRate: this.totalOrders > 0 ? Math.round((this.completedOrders / this.totalOrders) * 100) : 0,
    averageRating: this.averageRating,
    totalReviews: this.totalReviews,
    profileCompletion: this.calculateProfileCompletion()
  };
};

// Static method to get company statistics
userSchema.statics.getCompanyStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalCompanies: { $sum: 1 },
        activeCompanies: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        pendingCompanies: {
          $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] }
        },
        suspendedCompanies: {
          $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] }
        },
        manufacturers: {
          $sum: { $cond: [{ $in: ['$companyType', ['manufacturer', 'both']] }, 1, 0] }
        },
        distributors: {
          $sum: { $cond: [{ $in: ['$companyType', ['distributor', 'both']] }, 1, 0] }
        }
      }
    }
  ]);
};

// Static method for advanced search
userSchema.statics.searchCompanies = function(searchTerm, filters = {}) {
  const query = {};
  
  if (searchTerm) {
    query.$text = { $search: searchTerm };
  }
  
  if (filters.country) query.country = filters.country;
  if (filters.activityType) query.activityType = filters.activityType;
  if (filters.companyType) query.companyType = filters.companyType;
  if (filters.status) query.status = filters.status;
  
  return this.find(query)
    .select('-password -resetPasswordToken -emailVerificationToken')
    .sort(searchTerm ? { score: { $meta: 'textScore' } } : { averageRating: -1 });
};

module.exports = mongoose.model('User', userSchema);