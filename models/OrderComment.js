/**
 * Order Comment Model
 * Professional order comment system with role-based access
 */

const mongoose = require('mongoose');

const orderCommentSchema = new mongoose.Schema({
    // Reference to the order
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true
    },
    
    // Author information
    author: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'authorModel',
        required: true
    },
    
    authorModel: {
        type: String,
        required: true,
        enum: ['User', 'Admin']
    },
    
    // Comment content
    content: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 2000
    },
    
    // Comment type/category
    type: {
        type: String,
        enum: [
            'general',          // Umumiy izoh
            'status_update',    // Holat yangilanishi
            'quality_note',     // Sifat haqida
            'delivery_note',    // Yetkazib berish haqida
            'payment_note',     // To'lov haqida
            'internal_note',    // Ichki izoh (faqat manufacturer ko'radi)
            'customer_note'     // Mijoz uchun izoh
        ],
        default: 'general'
    },
    
    // Visibility settings
    visibility: {
        type: String,
        enum: [
            'public',       // Hamma ko'radi (manufacturer va customer)
            'internal',     // Faqat manufacturer team ko'radi
            'customer',     // Faqat customer ko'radi
            'admin'         // Faqat admin ko'radi
        ],
        default: 'public'
    },
    
    // Priority level
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    
    // Status
    status: {
        type: String,
        enum: ['active', 'resolved', 'archived'],
        default: 'active'
    },
    
    // Attachments (optional)
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
    
    // Metadata
    metadata: {
        ipAddress: String,
        userAgent: String,
        orderStatus: String, // Order status at time of comment
        orderValue: Number   // Order value at time of comment
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
    },
    
    // Reply to another comment (threading)
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrderComment',
        default: null
    },
    
    // Admin actions
    adminActions: {
        reviewed: {
            type: Boolean,
            default: false
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin'
        },
        reviewedAt: Date,
        flagged: {
            type: Boolean,
            default: false
        },
        flagReason: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
orderCommentSchema.index({ order: 1, createdAt: -1 });
orderCommentSchema.index({ author: 1, createdAt: -1 });
orderCommentSchema.index({ type: 1, status: 1 });
orderCommentSchema.index({ visibility: 1, status: 1 });

// Virtual for replies count
orderCommentSchema.virtual('repliesCount', {
    ref: 'OrderComment',
    localField: '_id',
    foreignField: 'parentComment',
    count: true
});

// Static methods
orderCommentSchema.statics.getOrderComments = async function(orderId, userRole, userId, options = {}) {
    try {
        const {
            page = 1,
            limit = 10,
            type = null,
            visibility = null,
            includeReplies = true
        } = options;

        // Build query based on user role
        let query = { 
            order: orderId,
            parentComment: null // Only get top-level comments initially
        };

        // Apply visibility filters based on user role
        if (userRole === 'customer') {
            query.visibility = { $in: ['public', 'customer'] };
        } else if (userRole === 'manufacturer') {
            query.visibility = { $in: ['public', 'internal', 'customer'] };
        }
        // Admin can see all

        if (type) query.type = type;
        if (visibility) query.visibility = visibility;

        const comments = await this.find(query)
            .populate({
                path: 'author',
                select: 'name email companyName role companyLogo',
                options: { strictPopulate: false }
            })
            .populate('adminActions.reviewedBy', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        // Get replies if requested
        if (includeReplies && comments.length > 0) {
            const commentIds = comments.map(c => c._id);
            const replies = await this.find({
                parentComment: { $in: commentIds }
            })
            .populate({
                path: 'author',
                select: 'name email companyName role companyLogo',
                options: { strictPopulate: false }
            })
            .sort({ createdAt: 1 })
            .lean();

            // Group replies by parent comment
            const repliesMap = {};
            replies.forEach(reply => {
                const parentId = reply.parentComment.toString();
                if (!repliesMap[parentId]) repliesMap[parentId] = [];
                repliesMap[parentId].push(reply);
            });

            // Attach replies to comments
            comments.forEach(comment => {
                comment.replies = repliesMap[comment._id.toString()] || [];
            });
        }

        // Get total count for pagination
        const total = await this.countDocuments(query);

        return {
            comments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error('Error fetching order comments:', error);
        return {
            comments: [],
            pagination: { page: 1, limit: 10, total: 0, pages: 0 }
        };
    }
};

orderCommentSchema.statics.createComment = async function(commentData) {
    try {
        const comment = new this(commentData);
        await comment.save();
        
        return await this.findById(comment._id)
            .populate({
                path: 'author',
                select: 'name email companyName role companyLogo',
                options: { strictPopulate: false }
            })
            .lean();
    } catch (error) {
        throw new Error(`Failed to create comment: ${error.message}`);
    }
};

orderCommentSchema.statics.getCommentStatistics = async function(orderId) {
    try {
        const stats = await this.aggregate([
            { $match: { order: mongoose.Types.ObjectId(orderId) } },
            {
                $group: {
                    _id: null,
                    totalComments: { $sum: 1 },
                    typeBreakdown: {
                        $push: {
                            type: '$type',
                            priority: '$priority',
                            visibility: '$visibility'
                        }
                    },
                    latestComment: { $max: '$createdAt' },
                    urgentCount: {
                        $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] }
                    },
                    activeCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                    }
                }
            }
        ]);

        return stats[0] || {
            totalComments: 0,
            typeBreakdown: [],
            latestComment: null,
            urgentCount: 0,
            activeCount: 0
        };
    } catch (error) {
        console.error('Error getting comment statistics:', error);
        return {
            totalComments: 0,
            typeBreakdown: [],
            latestComment: null,
            urgentCount: 0,
            activeCount: 0
        };
    }
};

// Pre-save middleware
orderCommentSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Pre-update middleware
orderCommentSchema.pre(['updateOne', 'findOneAndUpdate', 'updateMany'], function(next) {
    this.set({ updatedAt: new Date() });
    next();
});

module.exports = mongoose.model('OrderComment', orderCommentSchema);
