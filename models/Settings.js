/**
 * Settings Model - System Configuration Management
 * Professional settings management for SLEX platform
 */

const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Settings Category and Key (unique combination)
  category: {
    type: String,
    required: true,
    enum: ['general', 'platform', 'security', 'notifications', 'integrations', 'advanced', 'email', 'sms', 'payment', 'shipping', 'localization']
  },
  
  key: {
    type: String,
    required: true,
    trim: true
  },
  
  // Setting Value and Metadata
  value: {
    type: mongoose.Schema.Types.Mixed, // Can store any type
    required: true
  },
  
  // Setting Configuration
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    trim: true
  },
  
  // Field Type for UI Generation
  fieldType: {
    type: String,
    required: true,
    enum: ['text', 'number', 'boolean', 'select', 'textarea', 'email', 'url', 'password', 'json', 'array', 'file', 'color', 'date', 'time']
  },
  
  // Field Options for Select/Radio
  options: [{
    label: String,
    value: mongoose.Schema.Types.Mixed
  }],
  
  // Validation Rules
  validation: {
    required: {
      type: Boolean,
      default: false
    },
    minLength: Number,
    maxLength: Number,
    min: Number,
    max: Number,
    pattern: String, // Regex pattern
    customValidation: String // Custom validation function name
  },
  
  // Access Control
  isPublic: {
    type: Boolean,
    default: false // Whether setting can be accessed by non-admin users
  },
  
  isReadOnly: {
    type: Boolean,
    default: false
  },
  
  requiresRestart: {
    type: Boolean,
    default: false // Whether changing this setting requires server restart
  },
  
  // Environment and Deployment
  environment: {
    type: String,
    enum: ['all', 'development', 'staging', 'production'],
    default: 'all'
  },
  
  // Default Value
  defaultValue: mongoose.Schema.Types.Mixed,
  
  // Grouping and Organization
  group: {
    type: String,
    trim: true
  },
  
  sortOrder: {
    type: Number,
    default: 0
  },
  
  // Change Tracking
  lastModified: {
    type: Date,
    default: Date.now
  },
  
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  
  // Version Control
  version: {
    type: Number,
    default: 1
  },
  
  changeHistory: [{
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],
  
  // Feature Flags
  isActive: {
    type: Boolean,
    default: true
  },
  
  tags: [String]
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for category + key uniqueness
settingsSchema.index({ category: 1, key: 1 }, { unique: true });

// Indexes for performance
settingsSchema.index({ category: 1, isActive: 1 });
settingsSchema.index({ isPublic: 1, isActive: 1 });
settingsSchema.index({ environment: 1, isActive: 1 });

// Virtual for full key name
settingsSchema.virtual('fullKey').get(function() {
  return `${this.category}.${this.key}`;
});

// Instance Methods
settingsSchema.methods.updateValue = function(newValue, adminId, reason = 'Value updated') {
  // Add to change history
  this.changeHistory.push({
    oldValue: this.value,
    newValue: newValue,
    changedBy: adminId,
    changedAt: new Date(),
    reason: reason
  });
  
  // Update value and metadata
  this.value = newValue;
  this.lastModified = new Date();
  this.modifiedBy = adminId;
  this.version += 1;
  
  return this.save();
};

// Static Methods
settingsSchema.statics.getByCategory = function(category, includeReadOnly = false) {
  const query = { 
    category, 
    isActive: true 
  };
  
  if (!includeReadOnly) {
    query.isReadOnly = { $ne: true };
  }
  
  return this.find(query).sort({ sortOrder: 1, key: 1 });
};

settingsSchema.statics.getPublicSettings = function() {
  return this.find({ 
    isPublic: true, 
    isActive: true 
  }).select('category key value displayName description');
};

settingsSchema.statics.getByKey = function(category, key) {
  return this.findOne({ category, key, isActive: true });
};

settingsSchema.statics.getBulk = function(settings) {
  // settings = [{ category: 'general', key: 'siteName' }, ...]
  const queries = settings.map(s => ({ category: s.category, key: s.key }));
  return this.find({ 
    $or: queries, 
    isActive: true 
  });
};

settingsSchema.statics.setSetting = async function(category, key, value, adminId, reason) {
  const setting = await this.findOne({ category, key });
  
  if (!setting) {
    throw new Error(`Setting ${category}.${key} not found`);
  }
  
  if (setting.isReadOnly) {
    throw new Error(`Setting ${category}.${key} is read-only`);
  }
  
  return setting.updateValue(value, adminId, reason);
};

// Initialize default settings
settingsSchema.statics.initializeDefaults = async function() {
  const defaultSettings = [
    // General Settings
    {
      category: 'general',
      key: 'siteName',
      value: 'SLEX - Silk Line Expo',
      displayName: 'Site Name',
      description: 'The name of your platform',
      fieldType: 'text',
      validation: { required: true, maxLength: 100 },
      group: 'Basic Information',
      sortOrder: 1
    },
    {
      category: 'general',
      key: 'siteDescription',
      value: 'Central Asia B2B Trade Platform',
      displayName: 'Site Description',
      description: 'Brief description of your platform',
      fieldType: 'textarea',
      validation: { maxLength: 500 },
      group: 'Basic Information',
      sortOrder: 2
    },
    {
      category: 'general',
      key: 'defaultLanguage',
      value: 'uz',
      displayName: 'Default Language',
      description: 'Default language for new users',
      fieldType: 'select',
      options: [
        { label: 'Uzbek', value: 'uz' },
        { label: 'English', value: 'en' },
        { label: 'Russian', value: 'ru' },
        { label: 'Turkish', value: 'tr' },
        { label: 'Persian', value: 'fa' },
        { label: 'Chinese', value: 'zh' }
      ],
      group: 'Localization',
      sortOrder: 3
    },
    {
      category: 'general',
      key: 'timezone',
      value: 'Asia/Tashkent',
      displayName: 'Timezone',
      description: 'Default timezone for the platform',
      fieldType: 'select',
      options: [
        { label: 'Tashkent (UTC+5)', value: 'Asia/Tashkent' },
        { label: 'Almaty (UTC+6)', value: 'Asia/Almaty' },
        { label: 'Dubai (UTC+4)', value: 'Asia/Dubai' }
      ],
      group: 'Localization',
      sortOrder: 4
    },
    {
      category: 'general',
      key: 'defaultCurrency',
      value: 'USD',
      displayName: 'Default Currency',
      description: 'Default currency for transactions',
      fieldType: 'select',
      options: [
        { label: 'US Dollar (USD)', value: 'USD' },
        { label: 'Uzbek Sum (UZS)', value: 'UZS' },
        { label: 'Euro (EUR)', value: 'EUR' },
        { label: 'Chinese Yuan (CNY)', value: 'CNY' }
      ],
      group: 'Currency',
      sortOrder: 5
    },
    
    // Platform Settings
    {
      category: 'platform',
      key: 'maintenanceMode',
      value: false,
      displayName: 'Maintenance Mode',
      description: 'Enable to put the platform in maintenance mode',
      fieldType: 'boolean',
      group: 'System Status',
      sortOrder: 1
    },
    {
      category: 'platform',
      key: 'registrationEnabled',
      value: true,
      displayName: 'Registration Enabled',
      description: 'Allow new user registrations',
      fieldType: 'boolean',
      group: 'User Management',
      sortOrder: 2
    },
    {
      category: 'platform',
      key: 'maxFileUploadSize',
      value: 10,
      displayName: 'Max File Upload Size (MB)',
      description: 'Maximum file size allowed for uploads',
      fieldType: 'number',
      validation: { min: 1, max: 100 },
      group: 'File Management',
      sortOrder: 3
    },
    
    // Security Settings
    {
      category: 'security',
      key: 'passwordMinLength',
      value: 8,
      displayName: 'Minimum Password Length',
      description: 'Minimum required password length',
      fieldType: 'number',
      validation: { min: 6, max: 32 },
      group: 'Password Policy',
      sortOrder: 1
    },
    {
      category: 'security',
      key: 'requireStrongPassword',
      value: true,
      displayName: 'Require Strong Password',
      description: 'Require passwords to contain uppercase, lowercase, numbers and symbols',
      fieldType: 'boolean',
      group: 'Password Policy',
      sortOrder: 2
    },
    {
      category: 'security',
      key: 'sessionTimeout',
      value: 24,
      displayName: 'Session Timeout (hours)',
      description: 'Automatic logout after this many hours of inactivity',
      fieldType: 'number',
      validation: { min: 1, max: 168 },
      group: 'Session Management',
      sortOrder: 3
    },
    
    // Email Settings
    {
      category: 'email',
      key: 'smtpHost',
      value: '',
      displayName: 'SMTP Host',
      description: 'SMTP server hostname',
      fieldType: 'text',
      group: 'SMTP Configuration',
      sortOrder: 1
    },
    {
      category: 'email',
      key: 'smtpPort',
      value: 587,
      displayName: 'SMTP Port',
      description: 'SMTP server port',
      fieldType: 'number',
      group: 'SMTP Configuration',
      sortOrder: 2
    },
    {
      category: 'email',
      key: 'fromEmail',
      value: 'noreply@slex.uz',
      displayName: 'From Email Address',
      description: 'Default sender email address',
      fieldType: 'email',
      group: 'Email Configuration',
      sortOrder: 3
    }
  ];
  
  // Insert default settings if they don't exist
  for (const setting of defaultSettings) {
    const exists = await this.findOne({ 
      category: setting.category, 
      key: setting.key 
    });
    
    if (!exists) {
      await this.create({
        ...setting,
        defaultValue: setting.value
      });
    }
  }
  
  console.log('✅ Default settings initialized');
};

module.exports = mongoose.model('Settings', settingsSchema);