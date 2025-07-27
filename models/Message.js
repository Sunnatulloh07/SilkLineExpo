/**
 * Message Model - Professional Admin Messaging System
 * Senior Software Engineer Level Implementation
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Sender Information
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'senderType'
  },
  senderType: {
    type: String,
    required: true,
    enum: ['user', 'admin', 'system']
  },
  
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
  
  // Message Content
  subject: {
    type: String,
    required: true,
    maxLength: 200,
    trim: true
  },
  content: {
    type: String,
    required: true,
    maxLength: 5000,
    trim: true
  },
  
  // Message Type
  type: {
    type: String,
    enum: [
      'support_request',
      'inquiry',
      'complaint',
      'general',
      'system_notification',
      'admin_reply'
    ],
    default: 'general'
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
    enum: ['unread', 'read', 'replied', 'resolved', 'archived'],
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
  
  // Reply Information
  repliedAt: {
    type: Date,
    default: null
  },
  replyMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  parentMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  
  // Attachments (for future use)
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String
  }],
  
  // Metadata
  metadata: {
    userAgent: String,
    ipAddress: String,
    source: {
      type: String,
      enum: ['web', 'mobile', 'api'],
      default: 'web'
    }
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
messageSchema.index({ recipientId: 1, recipientType: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, senderType: 1, createdAt: -1 });
messageSchema.index({ status: 1, createdAt: -1 });
messageSchema.index({ readAt: 1, isRead: 1 });
messageSchema.index({ type: 1, priority: 1 });

// Update timestamps on save
messageSchema.pre('save', function(next) {
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
messageSchema.methods.markAsRead = function() {
  this.readAt = new Date();
  this.isRead = true;
  this.status = 'read';
  return this.save();
};

messageSchema.methods.markAsReplied = function(replyMessageId) {
  this.repliedAt = new Date();
  this.replyMessageId = replyMessageId;
  this.status = 'replied';
  return this.save();
};

// Static methods
messageSchema.statics.getUnreadCount = function(recipientId, recipientType) {
  return this.countDocuments({
    recipientId,
    recipientType,
    isRead: false
  });
};

messageSchema.statics.getMessageThread = function(messageId) {
  return this.find({
    $or: [
      { _id: messageId },
      { parentMessageId: messageId },
      { replyMessageId: messageId }
    ]
  }).sort({ createdAt: 1 }).populate('senderId recipientId');
};

// Virtual for formatted creation date
messageSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Transform JSON output
messageSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 