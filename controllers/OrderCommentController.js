/**
 * Order Comment Controller
 * Professional order comment management with role-based access control
 */

const OrderComment = require('../models/OrderComment');
const Order = require('../models/Order');
const { body, validationResult } = require('express-validator');

class OrderCommentController {
    /**
     * Get comments for a specific order
     * GET /api/orders/:orderId/comments
     */
    static async getOrderComments(req, res) {
        try {
            const { orderId } = req.params;
            const {
                page = 1,
                limit = 10,
                type,
                visibility,
                includeReplies = 'true'
            } = req.query;

            // Check if order exists and user has access
            const order = await Order.findById(orderId).populate('manufacturer', '_id');
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            // Determine user role and access
            const userRole = req.user.userType === 'admin' ? 'admin' : 
                           (req.user.role === 'company_admin' ? 'manufacturer' : 'customer');
            
            // Check access permissions
            if (userRole === 'manufacturer' && !OrderCommentController.hasManufacturerAccess(order, req.user)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this order'
                });
            }

            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                type,
                visibility,
                includeReplies: includeReplies === 'true'
            };

            const result = await OrderComment.getOrderComments(orderId, userRole, req.user.userId, options);
            
            // Get comment statistics
            const statistics = await OrderComment.getCommentStatistics(orderId);

            return res.json({
                success: true,
                data: {
                    comments: result.comments,
                    pagination: result.pagination,
                    statistics
                }
            });

        } catch (error) {
            console.error('Error fetching order comments:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Create a new comment for an order
     * POST /api/orders/:orderId/comments
     */
    static async createComment(req, res) {
        try {
            // Validation
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: errors.array()
                });
            }

            const { orderId } = req.params;
            const {
                content,
                type = 'general',
                visibility = 'public',
                priority = 'normal',
                parentComment = null
            } = req.body;

            // Check if order exists and user has access
            const order = await Order.findById(orderId).populate('manufacturer', '_id');
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            // Determine user role and access
            const userRole = req.user.userType === 'admin' ? 'admin' : 
                           (req.user.role === 'company_admin' ? 'manufacturer' : 'customer');
            
            // Check access permissions
            if (userRole === 'manufacturer' && !OrderCommentController.hasManufacturerAccess(order, req.user)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this order'
                });
            }

            // Validate parent comment if provided
            if (parentComment) {
                const parentExists = await OrderComment.findOne({
                    _id: parentComment,
                    order: orderId
                });
                if (!parentExists) {
                    return res.status(400).json({
                        success: false,
                        message: 'Parent comment not found'
                    });
                }
            }

            // Determine author model based on user type
            const authorModel = req.user.userType === 'admin' ? 'Admin' : 'User';

            // Create comment data
            const commentData = {
                order: orderId,
                author: req.user.userId,
                authorModel,
                content: content.trim(),
                type,
                visibility,
                priority,
                parentComment,
                metadata: {
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    orderStatus: order.status,
                    orderValue: order.totalAmount
                }
            };

            // Create comment
            const comment = await OrderComment.createComment(commentData);

            return res.status(201).json({
                success: true,
                message: 'Comment created successfully',
                data: { comment }
            });

        } catch (error) {
            console.error('Error creating order comment:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Update an existing comment
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
            const { content, type, visibility, priority, status } = req.body;

            // Find comment
            const comment = await OrderComment.findById(commentId);
            if (!comment) {
                return res.status(404).json({
                    success: false,
                    message: 'Comment not found'
                });
            }

            // Check permissions - only author or admin can update
            const userRole = req.user.userType === 'admin' ? 'admin' : 'user';
            const isAuthor = comment.author.toString() === req.user.userId;
            
            if (!isAuthor && userRole !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only edit your own comments.'
                });
            }

            // Update fields
            if (content !== undefined) comment.content = content.trim();
            if (type !== undefined) comment.type = type;
            if (visibility !== undefined) comment.visibility = visibility;
            if (priority !== undefined) comment.priority = priority;
            if (status !== undefined) comment.status = status;

            await comment.save();

            // Populate author information
            await comment.populate('author', 'name email companyName role');

            return res.json({
                success: true,
                message: 'Comment updated successfully',
                data: { comment }
            });

        } catch (error) {
            console.error('Error updating comment:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

            // Find comment
            const comment = await OrderComment.findById(commentId);
            if (!comment) {
                return res.status(404).json({
                    success: false,
                    message: 'Comment not found'
                });
            }

            // Check permissions - only author or admin can delete
            const userRole = req.user.userType === 'admin' ? 'admin' : 'user';
            const isAuthor = comment.author.toString() === req.user.userId;
            
            if (!isAuthor && userRole !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only delete your own comments.'
                });
            }

            // Delete comment and its replies
            await OrderComment.deleteMany({
                $or: [
                    { _id: commentId },
                    { parentComment: commentId }
                ]
            });

            return res.json({
                success: true,
                message: 'Comment deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting comment:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Get comment statistics for an order
     * GET /api/orders/:orderId/comments/statistics
     */
    static async getCommentStatistics(req, res) {
        try {
            const { orderId } = req.params;

            // Check if order exists and user has access
            const order = await Order.findById(orderId).populate('manufacturer', '_id');
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            const statistics = await OrderComment.getCommentStatistics(orderId);

            return res.json({
                success: true,
                data: { statistics }
            });

        } catch (error) {
            console.error('Error fetching comment statistics:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Flag a comment for review
     * POST /api/comments/:commentId/flag
     */
    static async flagComment(req, res) {
        try {
            const { commentId } = req.params;
            const { reason } = req.body;

            const comment = await OrderComment.findById(commentId);
            if (!comment) {
                return res.status(404).json({
                    success: false,
                    message: 'Comment not found'
                });
            }

            // Update admin actions
            comment.adminActions.flagged = true;
            comment.adminActions.flagReason = reason || 'No reason provided';
            await comment.save();

            return res.json({
                success: true,
                message: 'Comment flagged for review successfully'
            });

        } catch (error) {
            console.error('Error flagging comment:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Get validation rules for creating comments
     */
    static getCreateValidationRules() {
        return [
            body('content')
                .trim()
                .notEmpty()
                .withMessage('Comment content is required')
                .isLength({ min: 1, max: 2000 })
                .withMessage('Comment must be between 1 and 2000 characters'),
            body('type')
                .optional()
                .isIn(['general', 'status_update', 'quality_note', 'delivery_note', 'payment_note', 'internal_note', 'customer_note'])
                .withMessage('Invalid comment type'),
            body('visibility')
                .optional()
                .isIn(['public', 'internal', 'customer', 'admin'])
                .withMessage('Invalid visibility option'),
            body('priority')
                .optional()
                .isIn(['low', 'normal', 'high', 'urgent'])
                .withMessage('Invalid priority level'),
            body('parentComment')
                .optional()
                .isMongoId()
                .withMessage('Invalid parent comment ID')
        ];
    }

    /**
     * Get validation rules for updating comments
     */
    static getUpdateValidationRules() {
        return [
            body('content')
                .optional()
                .trim()
                .notEmpty()
                .withMessage('Comment content cannot be empty')
                .isLength({ min: 1, max: 2000 })
                .withMessage('Comment must be between 1 and 2000 characters'),
            body('type')
                .optional()
                .isIn(['general', 'status_update', 'quality_note', 'delivery_note', 'payment_note', 'internal_note', 'customer_note'])
                .withMessage('Invalid comment type'),
            body('visibility')
                .optional()
                .isIn(['public', 'internal', 'customer', 'admin'])
                .withMessage('Invalid visibility option'),
            body('priority')
                .optional()
                .isIn(['low', 'normal', 'high', 'urgent'])
                .withMessage('Invalid priority level'),
            body('status')
                .optional()
                .isIn(['active', 'resolved', 'archived'])
                .withMessage('Invalid status')
        ];
    }

    /**
     * Helper method to check manufacturer access to order
     */
    static hasManufacturerAccess(order, user) {
        try {
            const orderManufacturerId = order.manufacturer?.toString();
            const userCompanyId = user.companyId?.toString() || user.userId?.toString();
            
            return orderManufacturerId && userCompanyId && orderManufacturerId === userCompanyId;
        } catch (error) {
            console.error('Error checking manufacturer access:', error);
            return false;
        }
    }
}

module.exports = OrderCommentController;
