/**
 * Message Model - Professional B2B Communication
 * Senior Software Engineer Implementation
 * SLEX Platform - Real-time messaging system
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    // Order context
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true
    },
    
    // Participants
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    // Message content
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    
    // Message type
    type: {
        type: String,
        enum: ['text', 'image', 'file', 'system', 'order_update'],
        default: 'text'
    },
    
    // Attachments
    attachments: [{
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        url: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Message status
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read'],
        default: 'sent',
        index: true
    },
    
    // Read timestamp
    readAt: {
        type: Date,
        default: null
    },
    
    // Metadata for system messages
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for performance
messageSchema.index({ orderId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, recipientId: 1 });
messageSchema.index({ recipientId: 1, status: 1 });
messageSchema.index({ orderId: 1, type: 1 });

// Virtual for formatted creation time
messageSchema.virtual('formattedTime').get(function() {
    return this.createdAt.toLocaleString('uz-UZ', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
});

// Static method to create system message
messageSchema.statics.createSystemMessage = async function(data) {
    const {
        orderId, recipientId, content, metadata = {}
    } = data;
    
    const message = new this({
        orderId,
        senderId: null, // System message
        recipientId,
        content,
        type: 'system',
        metadata,
        status: 'delivered'
    });
    
    return await message.save();
};

// Static method to get conversation messages
messageSchema.statics.getConversation = async function(orderId, limit = 50, skip = 0) {
    return await this.find({ orderId })
        .populate('senderId', 'name companyName')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();
};

// Static method to mark messages as read
messageSchema.statics.markAsRead = async function(orderId, recipientId) {
    return await this.updateMany({
        orderId,
        recipientId,
        status: { $in: ['sent', 'delivered'] }
    }, {
        status: 'read',
        readAt: new Date()
    });
};

// Pre-save middleware
messageSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Create notification for new message
messageSchema.post('save', async function(doc) {
    try {
        // TODO: Implement real-time notification
        console.log('📬 New message saved:', {
            orderId: doc.orderId,
            from: doc.senderId,
            to: doc.recipientId,
            type: doc.type
        });
        
        // TODO: Send WebSocket notification
        // TODO: Send email notification for offline users
        // TODO: Update conversation last activity
        
    } catch (error) {
        console.error('❌ Error in message post-save hook:', error);
    }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;