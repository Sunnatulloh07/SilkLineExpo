/**
 * Notification Model - Professional Admin Notification System
 * Senior Software Engineer Level Implementation
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient Information
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientType'
  },
  recipientType: {
    type: String,
    required: true,
    enum: ['user', 'admin', 'system']
  },
  
  // Notification Content
  title: {
    type: String,
    required: true,
    maxLength: 150,
    trim: true
  },
  message: {
    type: String,
    required: true,
    maxLength: 500,
    trim: true
  },
  
  // Notification Type
  type: {
    type: String,
    required: true,
    enum: [
      'user_registration',
      'support_message',
      'order_placed',
      'payment_received',
      'system_alert',
      'maintenance',
      'security',
      'info',
      'warning',
      'success',
      'error'
    ]
  },
  
  // Priority Level
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Status
  status: {
    type: String,
    enum: ['unread', 'read', 'dismissed', 'archived'],
    default: 'unread'
  },
  
  // Read Status
  readAt: {
    type: Date,
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  
  // Action Information
  actionUrl: {
    type: String,
    maxLength: 500,
    trim: true
  },
  actionText: {
    type: String,
    maxLength: 50,
    trim: true,
    default: 'View Details'
  },
  
  // Additional Data
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Sender Information (optional)
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'senderType',
    default: null
  },
  senderType: {
    type: String,
    enum: ['user', 'admin', 'system'],
    default: 'system'
  },
  
  // Display Settings
  icon: {
    type: String,
    default: 'fas fa-bell'
  },
  color: {
    type: String,
    enum: ['blue', 'green', 'yellow', 'red', 'purple', 'gray'],
    default: 'blue'
  },
  
  // Expiry (for temporary notifications)
  expiresAt: {
    type: Date,
    default: null
  },
  
  // Metadata
  metadata: {
    source: {
      type: String,
      enum: ['system', 'user_action', 'admin_action', 'external'],
      default: 'system'
    },
    category: String,
    tags: [String]
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes for performance
notificationSchema.index({ recipientId: 1, recipientType: 1, createdAt: -1 });
notificationSchema.index({ status: 1, createdAt: -1 });
notificationSchema.index({ type: 1, priority: 1 });
notificationSchema.index({ readAt: 1, isRead: 1 });

// TTL index for expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Update timestamps on save
notificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Set isRead based on readAt
  if (this.readAt && !this.isRead) {
    this.isRead = true;
  }
  
  // Update status when read
  if (this.readAt && this.status === 'unread') {
    this.status = 'read';
  }
  
  next();
});

// Instance methods
notificationSchema.methods.markAsRead = function() {
  this.readAt = new Date();
  this.isRead = true;
  this.status = 'read';
  return this.save();
};

notificationSchema.methods.dismiss = function() {
  this.status = 'dismissed';
  return this.save();
};

notificationSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Static methods
notificationSchema.statics.getUnreadCount = function(recipientId, recipientType) {
  return this.countDocuments({
    recipientId,
    recipientType,
    isRead: false,
    status: { $ne: 'archived' }
  });
};

notificationSchema.statics.markAllAsRead = function(recipientId, recipientType) {
  return this.updateMany(
    {
      recipientId,
      recipientType,
      isRead: false,
      status: 'unread'
    },
    {
      $set: {
        readAt: new Date(),
        isRead: true,
        status: 'read',
        updatedAt: new Date()
      }
    }
  );
};

notificationSchema.statics.createUserRegistrationNotification = async function(userId, userData) {
  const Admin = require('./Admin');
  const admins = await Admin.find({ status: 'active' }).select('_id');
  
  const notifications = admins.map(admin => ({
    recipientId: admin._id,
    recipientType: 'admin',
    type: 'user_registration',
    title: 'New User Registration',
    message: `New company registration: ${userData.companyName}`,
    data: userData,
    actionUrl: `/admin/users/${userId}`,
    actionText: 'Review Registration',
    priority: 'normal',
    color: 'blue',
    icon: 'fas fa-user-plus'
  }));
  
  return this.insertMany(notifications);
};

notificationSchema.statics.createSupportMessageNotification = async function(senderId, subject, content) {
  const Admin = require('./Admin');
  const admins = await Admin.find({ status: 'active' }).select('_id');
  
  const notifications = admins.map(admin => ({
    recipientId: admin._id,
    recipientType: 'admin',
    type: 'support_message',
    title: 'New Support Message',
    message: `Support request: ${subject}`,
    data: {
      senderId,
      subject,
      content: content.substring(0, 100) + '...'
    },
    actionUrl: `/admin/messages/${senderId}`,
    actionText: 'View Message',
    priority: 'high',
    color: 'yellow',
    icon: 'fas fa-envelope'
  }));
  
  return this.insertMany(notifications);
};

// Virtual for formatted creation date
notificationSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
});

// Transform JSON output
notificationSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 