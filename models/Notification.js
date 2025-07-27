/**
 * Notification Model for Admin Notification System
 * Handles system notifications, alerts, and activity updates
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient Information
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'recipientType',
    required: true
  },
  
  recipientType: {
    type: String,
    enum: ['admin', 'user'],
    required: true
  },
  
  // Notification Content
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150
  },
  
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  
  // Notification Type and Category
  type: {
    type: String,
    enum: [
      'user_registration',
      'user_approval',
      'user_rejection',
      'system_alert',
      'security',
      'maintenance',
      'report',
      'reminder',
      'order',
      'inquiry',
      'general'
    ],
    required: true
  },
  
  category: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'urgent'],
    default: 'info'
  },
  
  // Priority Level
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Icon and Styling
  icon: {
    type: String,
    default: 'fas fa-bell'
  },
  
  color: {
    type: String,
    enum: ['primary', 'success', 'warning', 'danger', 'info'],
    default: 'primary'
  },
  
  // Action Information
  actionUrl: {
    type: String,
    trim: true
  },
  
  actionText: {
    type: String,
    trim: true,
    maxlength: 50
  },
  
  // Related Entity Information
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['user', 'admin', 'order', 'product', 'inquiry', 'system']
    },
    entityId: mongoose.Schema.Types.ObjectId,
    entityName: String
  },
  
  // Status and Tracking
  status: {
    type: String,
    enum: ['unread', 'read', 'archived', 'dismissed'],
    default: 'unread'
  },
  
  readAt: {
    type: Date,
    default: null
  },
  
  dismissedAt: {
    type: Date,
    default: null
  },
  
  archivedAt: {
    type: Date,
    default: null
  },
  
  // Auto-expiry
  expiresAt: {
    type: Date,
    default: null
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Source Information
  source: {
    type: String,
    enum: ['system', 'admin', 'user', 'automated'],
    default: 'system'
  },
  
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
notificationSchema.index({ recipientId: 1, recipientType: 1, status: 1 });
notificationSchema.index({ recipientId: 1, readAt: 1 });
notificationSchema.index({ type: 1, category: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ priority: 1, status: 1 });

// Virtual for checking if notification is read
notificationSchema.virtual('isRead').get(function() {
  return this.readAt !== null;
});

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} min ago`;
  return 'Just now';
});

// Virtual for checking if notification is urgent
notificationSchema.virtual('isUrgent').get(function() {
  return this.priority === 'urgent' || this.category === 'urgent';
});

// Instance Methods
notificationSchema.methods.markAsRead = async function() {
  this.readAt = new Date();
  this.status = 'read';
  return await this.save();
};

notificationSchema.methods.dismiss = async function() {
  this.dismissedAt = new Date();
  this.status = 'dismissed';
  return await this.save();
};

notificationSchema.methods.archive = async function() {
  this.archivedAt = new Date();
  this.status = 'archived';
  return await this.save();
};

// Static Methods
notificationSchema.statics.getUnreadCount = async function(recipientId, recipientType) {
  return await this.countDocuments({
    recipientId,
    recipientType,
    status: 'unread'
  });
};

notificationSchema.statics.markAllAsRead = async function(recipientId, recipientType) {
  return await this.updateMany(
    {
      recipientId,
      recipientType,
      status: 'unread'
    },
    {
      $set: {
        readAt: new Date(),
        status: 'read'
      }
    }
  );
};

notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  
  // Set default icon based on type
  if (!notification.icon) {
    const iconMap = {
      user_registration: 'fas fa-user-plus',
      user_approval: 'fas fa-check-circle',
      user_rejection: 'fas fa-times-circle',
      system_alert: 'fas fa-exclamation-triangle',
      security: 'fas fa-shield-alt',
      maintenance: 'fas fa-tools',
      report: 'fas fa-chart-bar',
      reminder: 'fas fa-clock',
      order: 'fas fa-shopping-cart',
      inquiry: 'fas fa-question-circle',
      general: 'fas fa-bell'
    };
    notification.icon = iconMap[notification.type] || 'fas fa-bell';
  }
  
  // Set default color based on category
  if (!notification.color) {
    const colorMap = {
      info: 'primary',
      success: 'success',
      warning: 'warning',
      error: 'danger',
      urgent: 'danger'
    };
    notification.color = colorMap[notification.category] || 'primary';
  }
  
  return await notification.save();
};

notificationSchema.statics.cleanExpired = async function() {
  return await this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  // Auto-set status based on readAt
  if (this.readAt && this.status === 'unread') {
    this.status = 'read';
  }
  
  // Set default expiry for certain types (30 days)
  if (!this.expiresAt && ['reminder', 'general'].includes(this.type)) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  
  next();
});

module.exports = mongoose.model('Notification', notificationSchema); 