/**
 * Review Model
 * Handles product and company reviews/ratings
 */

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Review Type
  reviewType: {
    type: String,
    enum: ['product', 'company', 'order'],
    required: true
  },
  
  // Reviewer Information
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Review Target
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  
  // Rating and Review Content
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  
  // Detailed Ratings
  detailedRatings: {
    quality: {
      type: Number,
      min: 1,
      max: 5
    },
    delivery: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    value: {
      type: Number,
      min: 1,
      max: 5
    },
    service: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  // Review Media
  images: [{
    url: String,
    caption: String,
    uploadDate: Date
  }],
  
  // Review Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  
  // Verification
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  
  // Interaction
  helpfulVotes: {
    type: Number,
    default: 0
  },
  
  unhelpfulVotes: {
    type: Number,
    default: 0
  },
  
  // Response from Company
  response: {
    content: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  },
  
  // Moderation
  moderationNotes: String,
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  
  moderatedAt: Date,
  
  // Flags and Reports
  flags: [{
    reason: {
      type: String,
      enum: ['inappropriate', 'spam', 'fake', 'offensive', 'other']
    },
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    flaggedAt: {
      type: Date,
      default: Date.now
    },
    description: String
  }]
  
}, {
  timestamps: true
});

// Indexes
reviewSchema.index({ reviewType: 1, status: 1 });
reviewSchema.index({ product: 1, status: 1 });
reviewSchema.index({ company: 1, status: 1 });
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });

// Validation
reviewSchema.pre('validate', function(next) {
  // Ensure only one target is set based on review type
  if (this.reviewType === 'product' && !this.product) {
    return next(new Error('Product is required for product reviews'));
  }
  if (this.reviewType === 'company' && !this.company) {
    return next(new Error('Company is required for company reviews'));
  }
  if (this.reviewType === 'order' && !this.order) {
    return next(new Error('Order is required for order reviews'));
  }
  
  next();
});

// Methods
reviewSchema.methods.addHelpfulVote = function() {
  this.helpfulVotes += 1;
  return this.save();
};

reviewSchema.methods.addUnhelpfulVote = function() {
  this.unhelpfulVotes += 1;
  return this.save();
};

reviewSchema.methods.addResponse = function(content, responderId) {
  this.response = {
    content,
    respondedBy: responderId,
    respondedAt: new Date()
  };
  return this.save();
};

reviewSchema.methods.flagReview = function(reason, flaggedBy, description) {
  this.flags.push({
    reason,
    flaggedBy,
    description,
    flaggedAt: new Date()
  });
  
  // Auto-flag if multiple reports
  if (this.flags.length >= 3) {
    this.status = 'flagged';
  }
  
  return this.save();
};

// Static methods
reviewSchema.statics.getAverageRating = function(targetId, reviewType) {
  const matchField = reviewType === 'product' ? 'product' : 'company';
  
  return this.aggregate([
    {
      $match: {
        [matchField]: targetId,
        status: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);
};

reviewSchema.statics.getDetailedRatings = function(targetId, reviewType) {
  const matchField = reviewType === 'product' ? 'product' : 'company';
  
  return this.aggregate([
    {
      $match: {
        [matchField]: targetId,
        status: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        avgQuality: { $avg: '$detailedRatings.quality' },
        avgDelivery: { $avg: '$detailedRatings.delivery' },
        avgCommunication: { $avg: '$detailedRatings.communication' },
        avgValue: { $avg: '$detailedRatings.value' },
        avgService: { $avg: '$detailedRatings.service' }
      }
    }
  ]);
};

module.exports = mongoose.model('Review', reviewSchema);