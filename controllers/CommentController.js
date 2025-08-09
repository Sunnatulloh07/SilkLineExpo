/**
 * Comment Controller
 * Professional B2B product comments and reviews management
 */

const Comment = require('../models/Comment');
const Product = require('../models/Product');
const User = require('../models/User');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

class CommentController {
  
  /**
   * Get comments for a product
   * GET /api/products/:productId/comments
   */
  static async getProductComments(req, res) {
    try {
      const { productId } = req.params;
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        status = 'approved'
      } = req.query;

      // Validate product ID
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID'
        });
      }

      // Check if product exists
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Get comments with proper error handling
      const comments = await Comment.getProductComments(productId, {
        status,
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder: sortOrder === 'desc' ? -1 : 1
      });

      // Ensure comments is always an array
      const safeComments = Array.isArray(comments) ? comments : [];

      // Get total count for pagination
      const totalComments = await Comment.countDocuments({
        product: productId,
        status,
        parentComment: null
      });

      // Get comment statistics
      const stats = await Comment.getCommentStatistics(productId);

      res.json({
        success: true,
        data: {
          comments: safeComments,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalComments / limit),
            totalComments,
            limit: parseInt(limit)
          },
          statistics: stats.length > 0 ? stats[0] : {
            totalComments: 0,
            averageRating: 0,
            ratingDistribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 }
          }
        }
      });

    } catch (error) {
      console.error('Error getting product comments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get comments'
      });
    }
  }

  /**
   * Create a new comment
   * POST /api/products/:productId/comments
   */
  static async createComment(req, res) {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { productId } = req.params;
      const { content, rating, type = 'review', parentComment } = req.body;
      const userId = req.user?._id || req.user?.userId;

      // Validate product ID
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID'
        });
      }

      // Check if product exists
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Validate parent comment if provided
      let parentCommentDoc = null;
      if (parentComment) {
        if (!mongoose.Types.ObjectId.isValid(parentComment)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid parent comment ID'
          });
        }
        
        parentCommentDoc = await Comment.findById(parentComment);
        if (!parentCommentDoc || !parentCommentDoc.product.equals(productId)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid parent comment'
          });
        }
      }

      // Create comment data
      const commentData = {
        product: productId,
        author: userId,
        content: content.trim(),
        type,
        parentComment: parentComment || null,
        metadata: {
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          verifiedPurchase: false // TODO: Check if user has purchased this product
        }
      };

      // Add rating only for review type comments and not replies
      if (type === 'review' && !parentComment && rating) {
        commentData.rating = parseInt(rating);
      }

      // Create comment
      const comment = new Comment(commentData);
      await comment.save();

      // If it's a reply, add to parent comment's replies
      if (parentCommentDoc) {
        await parentCommentDoc.addReply(comment._id);
      }

      // Populate the comment for response
      await comment.populate('author', 'name companyName avatar');

      res.status(201).json({
        success: true,
        message: 'Comment created successfully',
        data: {
          comment: {
            _id: comment._id,
            content: comment.content,
            rating: comment.rating,
            type: comment.type,
            status: comment.status,
            author: comment.author,
            parentComment: comment.parentComment,
            helpfulScore: comment.helpfulScore,
            repliesCount: comment.repliesCount,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt
          }
        }
      });

    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create comment'
      });
    }
  }

  /**
   * Update a comment
   * PUT /api/comments/:commentId
   */
  static async updateComment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { commentId } = req.params;
      const { content, rating } = req.body;
      const userId = req.user?._id || req.user?.userId;

      // Validate comment ID
      if (!mongoose.Types.ObjectId.isValid(commentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid comment ID'
        });
      }

      // Find comment
      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      // Check ownership
      if (!comment.author.equals(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this comment'
        });
      }

      // Update comment
      comment.content = content.trim();
      if (rating && comment.type === 'review' && !comment.parentComment) {
        comment.rating = parseInt(rating);
      }

      await comment.save();
      await comment.populate('author', 'name companyName avatar');

      res.json({
        success: true,
        message: 'Comment updated successfully',
        data: { comment }
      });

    } catch (error) {
      console.error('Error updating comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update comment'
      });
    }
  }

  /**
   * Delete a comment
   * DELETE /api/comments/:commentId
   */
  static async deleteComment(req, res) {
    try {
      const { commentId } = req.params;
      const userId = req.user?._id || req.user?.userId;

      // Validate comment ID
      if (!mongoose.Types.ObjectId.isValid(commentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid comment ID'
        });
      }

      // Find comment
      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      // Check ownership or admin privileges
      const user = await User.findById(userId);
      const isOwner = comment.author.equals(userId);
      const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin');

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this comment'
        });
      }

      // If comment has replies, just hide it instead of deleting
      if (comment.replies.length > 0) {
        comment.status = 'hidden';
        comment.content = '[This comment has been deleted]';
        await comment.save();
      } else {
        // Delete the comment completely
        await Comment.findByIdAndDelete(commentId);
        
        // Remove from parent's replies if it's a reply
        if (comment.parentComment) {
          await Comment.findByIdAndUpdate(comment.parentComment, {
            $pull: { replies: commentId }
          });
        }
      }

      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete comment'
      });
    }
  }

  /**
   * Vote on comment helpfulness
   * POST /api/comments/:commentId/vote
   */
  static async voteComment(req, res) {
    try {
      const { commentId } = req.params;
      const { helpful } = req.body; // true for helpful, false for not helpful
      const userId = req.user?._id || req.user?.userId;

      // Validate comment ID
      if (!mongoose.Types.ObjectId.isValid(commentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid comment ID'
        });
      }

      // Find comment
      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      // Cannot vote on own comment
      if (comment.author.equals(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot vote on your own comment'
        });
      }

      // Vote on comment
      if (helpful === true) {
        await comment.markAsHelpful(userId);
      } else if (helpful === false) {
        await comment.markAsNotHelpful(userId);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid vote value'
        });
      }

      res.json({
        success: true,
        message: 'Vote recorded successfully',
        data: {
          helpfulScore: comment.helpfulScore,
          helpfulVotes: comment.helpfulVotes.helpful.length,
          notHelpfulVotes: comment.helpfulVotes.notHelpful.length
        }
      });

    } catch (error) {
      console.error('Error voting on comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record vote'
      });
    }
  }

  /**
   * Flag a comment
   * POST /api/comments/:commentId/flag
   */
  static async flagComment(req, res) {
    try {
      const { commentId } = req.params;
      const { reason } = req.body;
      const userId = req.user?._id || req.user?.userId;

      // Validate comment ID
      if (!mongoose.Types.ObjectId.isValid(commentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid comment ID'
        });
      }

      // Find comment
      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      // Cannot flag own comment
      if (comment.author.equals(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot flag your own comment'
        });
      }

      // Flag the comment
      await comment.flagComment(userId, reason);

      res.json({
        success: true,
        message: 'Comment flagged successfully'
      });

    } catch (error) {
      console.error('Error flagging comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to flag comment'
      });
    }
  }

  /**
   * Get user's comments
   * GET /api/users/me/comments
   */
  static async getUserComments(req, res) {
    try {
      const userId = req.user?._id || req.user?.userId;
      const {
        page = 1,
        limit = 10,
        status
      } = req.query;

      const query = { author: userId };
      if (status) {
        query.status = status;
      }

      const comments = await Comment.find(query)
        .populate('product', 'name title images')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean();

      const totalComments = await Comment.countDocuments(query);

      res.json({
        success: true,
        data: {
          comments,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalComments / limit),
            totalComments,
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error getting user comments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user comments'
      });
    }
  }
}

module.exports = CommentController;
