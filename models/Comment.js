/**
 * Comment Model
 * Professional B2B product comments and reviews system
 */

const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  // Product reference
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  
  // Author information
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Comment content
  content: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 1000
  },
  
  // Rating (1-5 stars)
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: false // Optional, some comments might not have ratings
  },
  
  // Comment type
  type: {
    type: String,
    enum: ['review', 'question', 'feedback'],
    default: 'review'
  },
  
  // Status for moderation
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'hidden'],
    default: 'pending'
  },
  
  // Parent comment for replies
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  
  // Replies to this comment
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  
  // Helpful votes
  helpfulVotes: {
    helpful: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }],
    notHelpful: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Additional metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    verifiedPurchase: {
      type: Boolean,
      default: false
    },
    orderReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null
    }
  },
  
  // Moderation info
  moderation: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null
    },
    reviewedAt: Date,
    moderationNotes: String,
    flagged: {
      type: Boolean,
      default: false
    },
    flaggedBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: String,
      flaggedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
commentSchema.index({ product: 1, status: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ status: 1, createdAt: -1 });

// Virtual for helpful score
commentSchema.virtual('helpfulScore').get(function() {
  const helpful = this.helpfulVotes.helpful.length;
  const notHelpful = this.helpfulVotes.notHelpful.length;
  return helpful - notHelpful;
});

// Virtual for total replies count
commentSchema.virtual('repliesCount').get(function() {
  return this.replies.length;
});

// Instance methods
commentSchema.methods.markAsHelpful = function(userId) {
  // Remove from not helpful if exists
  this.helpfulVotes.notHelpful = this.helpfulVotes.notHelpful.filter(
    vote => !vote.user.equals(userId)
  );
  
  // Add to helpful if not already there
  const alreadyHelpful = this.helpfulVotes.helpful.some(
    vote => vote.user.equals(userId)
  );
  
  if (!alreadyHelpful) {
    this.helpfulVotes.helpful.push({ user: userId });
  }
  
  return this.save();
};

commentSchema.methods.markAsNotHelpful = function(userId) {
  // Remove from helpful if exists
  this.helpfulVotes.helpful = this.helpfulVotes.helpful.filter(
    vote => !vote.user.equals(userId)
  );
  
  // Add to not helpful if not already there
  const alreadyNotHelpful = this.helpfulVotes.notHelpful.some(
    vote => vote.user.equals(userId)
  );
  
  if (!alreadyNotHelpful) {
    this.helpfulVotes.notHelpful.push({ user: userId });
  }
  
  return this.save();
};

commentSchema.methods.addReply = function(replyId) {
  if (!this.replies.includes(replyId)) {
    this.replies.push(replyId);
    return this.save();
  }
  return Promise.resolve(this);
};

commentSchema.methods.flagComment = function(userId, reason) {
  const alreadyFlagged = this.moderation.flaggedBy.some(
    flag => flag.user.equals(userId)
  );
  
  if (!alreadyFlagged) {
    this.moderation.flaggedBy.push({
      user: userId,
      reason: reason || 'Inappropriate content'
    });
    this.moderation.flagged = true;
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Static methods
commentSchema.statics.getProductComments = function(productId, options = {}) {
  const {
    status = 'approved',
    parentOnly = true,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = -1
  } = options;
  
  const query = {
    product: productId,
    status: status
  };
  
  if (parentOnly) {
    query.parentComment = null;
  }
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .populate('author', 'name companyName avatar email')
    .populate({
      path: 'replies',
      populate: {
        path: 'author',
        select: 'name companyName avatar'
      }
    })
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit)
    .lean()
    .catch(error => {
      console.error('Error in getProductComments:', error);
      return []; // Return empty array on error
    });
};

commentSchema.statics.getCommentStatistics = function(productId) {
  return this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), status: 'approved' } },
    {
      $group: {
        _id: null,
        totalComments: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    },
    {
      $project: {
        totalComments: 1,
        averageRating: { $round: ['$averageRating', 1] },
        ratingDistribution: {
          '5': {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 5] }
              }
            }
          },
          '4': {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 4] }
              }
            }
          },
          '3': {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 3] }
              }
            }
          },
          '2': {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 2] }
              }
            }
          },
          '1': {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 1] }
              }
            }
          }
        }
      }
    }
  ]);
};

// Pre-save middleware
commentSchema.pre('save', function(next) {
  // Auto-approve comments from verified manufacturers
  if (this.isNew && this.metadata?.verifiedPurchase) {
    this.status = 'approved';
  }
  
  next();
});

// Post-save middleware to update product rating
commentSchema.post('save', async function(doc) {
  if (doc.rating && doc.status === 'approved') {
    try {
      const Product = mongoose.model('Product');
      const stats = await this.constructor.getCommentStatistics(doc.product);
      
      if (stats.length > 0) {
        await Product.findByIdAndUpdate(doc.product, {
          $set: {
            'analytics.averageRating': stats[0].averageRating,
            'analytics.totalReviews': stats[0].totalComments
          }
        }, { upsert: false });
      }
    } catch (error) {
      console.error('Error updating product rating:', error);
    }
  }
});

module.exports = mongoose.model('Comment', commentSchema);
