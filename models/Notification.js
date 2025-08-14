/**
 * Notification Model
 * Professional notification system for B2B platform
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    // Recipient information
    recipient: {
    type: mongoose.Schema.Types.ObjectId,
        refPath: 'recipientModel',
    required: true,
        index: true
  },
    
    recipientModel: {
    type: String,
    required: true,
        enum: ['User', 'Admin']
    },
    
    // Sender information (optional for system notifications)
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'senderModel'
    },
    
    senderModel: {
        type: String,
        enum: ['User', 'Admin', 'System']
    },
    
    // Notification content
  title: {
    type: String,
    required: true,
        trim: true,
        maxlength: 200
  },
    
  message: {
    type: String,
    required: true,
        trim: true,
        maxlength: 1000
  },
  
    // Notification type and category
  type: {
    type: String,
        enum: [
            'order_comment',    // Order comment notification
            'order_status',     // Order status change
            'order_payment',    // Payment related
            'order_delivery',   // Delivery related
            'system_alert',     // System notifications
            'marketing',        // Marketing messages
            'security',         // Security alerts
            'reminder'          // Reminders
        ],
    required: true,
        index: true
    },
    
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal',
        index: true
    },
    
    // Related entities
    relatedOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    
    relatedComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrderComment'
    },
    
    relatedProduct: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    
    // Notification status
  status: {
    type: String,
        enum: ['pending', 'sent', 'delivered', 'failed', 'cancelled'],
        default: 'pending',
        index: true
    },
    
    readStatus: {
  isRead: {
            type: Boolean,
            default: false,
            index: true
        },
        readAt: Date
    },
    
    // Delivery channels
    channels: {
        email: {
            enabled: {
                type: Boolean,
                default: true
            },
            sent: {
                type: Boolean,
                default: false
            },
            sentAt: Date,
            error: String
        },
        sms: {
            enabled: {
    type: Boolean,
    default: false
  },
            sent: {
                type: Boolean,
                default: false
            },
            sentAt: Date,
            error: String
        },
        push: {
            enabled: {
                type: Boolean,
                default: true
            },
            sent: {
                type: Boolean,
                default: false
            },
            sentAt: Date,
            error: String
        },
        inApp: {
            enabled: {
                type: Boolean,
                default: true
            },
            shown: {
                type: Boolean,
                default: false
            },
            shownAt: Date
        }
  },
  
  // Metadata
  metadata: {
        orderNumber: String,
        commentId: String,
        actionUrl: String,
        expiresAt: Date,
    tags: [String]
  },
  
    // Scheduling
    scheduledFor: {
    type: Date,
        index: true
    },
    
    attempts: {
        type: Number,
        default: 0
    },
    
    maxAttempts: {
        type: Number,
        default: 3
    },
    
    lastAttemptAt: Date,
    nextAttemptAt: Date

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1, status: 1 });
notificationSchema.index({ 'readStatus.isRead': 1, recipient: 1 });
notificationSchema.index({ scheduledFor: 1, status: 1 });
notificationSchema.index({ relatedOrder: 1 });

// Virtual for unread notifications count
notificationSchema.virtual('isUnread').get(function() {
    return !this.readStatus.isRead;
});

// Virtual for delivery status
notificationSchema.virtual('deliveryStatus').get(function() {
    const channels = this.channels;
    const delivered = channels.email.sent || channels.sms.sent || channels.push.sent;
    return delivered ? 'delivered' : 'pending';
});

// Pre-save middleware
notificationSchema.pre('save', function(next) {
    // Set next attempt time if failed
    if (this.status === 'failed' && this.attempts < this.maxAttempts) {
        const backoffMinutes = Math.pow(2, this.attempts) * 5; // Exponential backoff
        this.nextAttemptAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
  }
  
  next();
});

// Static methods
notificationSchema.statics.createOrderCommentNotification = async function(data) {
    const {
        recipientId,
        recipientModel,
        senderId,
        senderModel,
        orderId,
        commentId,
        orderNumber,
        commentContent,
        priority = 'normal',
        isUpdate = false
    } = data;
    
    // Customize title and message based on whether it's an update or new comment
    const title = isUpdate 
        ? `Buyurtma #${orderNumber} da izoh yangilandi`
        : `Buyurtma #${orderNumber} ga yangi izoh`;
    
    const message = isUpdate
        ? `Buyurtma #${orderNumber} dagi izoh yangilandi: "${commentContent.substring(0, 100)}${commentContent.length > 100 ? '...' : ''}"`
        : `Buyurtma #${orderNumber} ga yangi izoh qo'shildi: "${commentContent.substring(0, 100)}${commentContent.length > 100 ? '...' : ''}"`;
    
    const notification = new this({
        recipient: recipientId,
        recipientModel,
        sender: senderId,
        senderModel,
        title,
        message,
        type: 'order_comment',
        priority,
        relatedOrder: orderId,
        relatedComment: commentId,
        metadata: {
            orderNumber,
            commentId,
            actionUrl: `/manufacturer/orders/${orderId}`,
            isUpdate
        }
    });
    
    return await notification.save();
};

notificationSchema.statics.getUnreadCount = function(recipientId) {
  return this.countDocuments({
        recipient: recipientId,
        'readStatus.isRead': false,
        status: { $in: ['sent', 'delivered'] }
  });
};

notificationSchema.statics.markAsRead = function(notificationId, recipientId) {
    return this.findOneAndUpdate(
        { _id: notificationId, recipient: recipientId },
        {
            'readStatus.isRead': true,
            'readStatus.readAt': new Date()
        },
        { new: true }
    );
};

notificationSchema.statics.markAllAsRead = function(recipientId) {
    return this.updateMany(
        { recipient: recipientId, 'readStatus.isRead': false },
        {
            'readStatus.isRead': true,
            'readStatus.readAt': new Date()
    }
  );
};

notificationSchema.statics.getNotificationsByRecipient = function(recipientId, options = {}) {
    const {
        page = 1,
        limit = 20,
        type,
        priority,
        isRead,
        sortBy = 'createdAt',
        sortOrder = -1
    } = options;
    
    const query = { recipient: recipientId };
    
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (typeof isRead === 'boolean') query['readStatus.isRead'] = isRead;
    
    const skip = (page - 1) * limit;
    
    return this.find(query)
        .populate('sender', 'name companyName')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean();
};

// Instance methods
notificationSchema.methods.markAsRead = function() {
    this.readStatus.isRead = true;
    this.readStatus.readAt = new Date();
    return this.save();
};

notificationSchema.methods.updateDeliveryStatus = function(channel, success, error = null) {
    if (this.channels[channel]) {
        this.channels[channel].sent = success;
        this.channels[channel].sentAt = success ? new Date() : null;
        this.channels[channel].error = error;
    }
    
    // Update overall status
    const hasSuccessfulDelivery = Object.values(this.channels).some(ch => ch.sent);
    if (hasSuccessfulDelivery) {
        this.status = 'delivered';
    } else if (this.attempts >= this.maxAttempts) {
        this.status = 'failed';
    }
    
    return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);