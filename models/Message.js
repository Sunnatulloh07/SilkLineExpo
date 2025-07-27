/**
 * Message Model for Admin Messaging System
 * Handles internal messages between admins and system notifications
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Sender Information
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'senderType',
    required: true
  },
  
  senderType: {
    type: String,
    enum: ['admin', 'user', 'system'],
    required: true
  },
  
  senderName: {
    type: String,
    required: true,
    trim: true
  },
  
  senderEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  
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
  
  // Message Content
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  
  // Message Type
  messageType: {
    type: String,
    enum: ['system', 'notification', 'support', 'general'],
    default: 'general'
  },
  
  // Priority Level
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'archived'],
    default: 'sent'
  },
  
  // Read Status
  readAt: {
    type: Date,
    default: null
  },
  
  // Attachments
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  }],
  
  // Related Entity (e.g., user approval, order, etc.)
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['user', 'order', 'product', 'inquiry']
    },
    entityId: mongoose.Schema.Types.ObjectId
  },
  
  // Thread/Conversation
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  
  // Admin Actions
  archivedAt: {
    type: Date,
    default: null
  },
  
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
messageSchema.index({ recipientId: 1, recipientType: 1, readAt: 1 });
messageSchema.index({ senderId: 1, senderType: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ status: 1 });
messageSchema.index({ threadId: 1 });

// Virtual for checking if message is read
messageSchema.virtual('isRead').get(function() {
  return this.readAt !== null;
});

// Virtual for time ago
messageSchema.virtual('timeAgo').get(function() {
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

// Instance Methods
messageSchema.methods.markAsRead = async function() {
  this.readAt = new Date();
  this.status = 'read';
  return await this.save();
};

messageSchema.methods.archive = async function(adminId) {
  this.archivedAt = new Date();
  this.archivedBy = adminId;
  return await this.save();
};

// Static Methods
messageSchema.statics.getUnreadCount = async function(recipientId, recipientType) {
  return await this.countDocuments({
    recipientId,
    recipientType,
    readAt: null,
    archivedAt: null
  });
};

messageSchema.statics.markAllAsRead = async function(recipientId, recipientType) {
  return await this.updateMany(
    {
      recipientId,
      recipientType,
      readAt: null
    },
    {
      $set: {
        readAt: new Date(),
        status: 'read'
      }
    }
  );
};

// Pre-save middleware
messageSchema.pre('save', function(next) {
  // Auto-set status based on readAt
  if (this.readAt && this.status === 'sent') {
    this.status = 'read';
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema); 