/**
 * Order Comment Controller
 * Professional order comment management with role-based access control
 */

const OrderComment = require('../models/OrderComment');
const Order = require('../models/Order');
const NotificationService = require('../services/NotificationService');
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
            const order = await Order.findById(orderId).populate('seller', '_id');
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
                parentComment = null,
                notifyCustomer = false
            } = req.body;

            // Check if order exists and user has access
            const order = await Order.findById(orderId).populate('seller', '_id');
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

            // Handle customer notification if requested
            if (notifyCustomer) {
                try {
                    // Determine recipient (customer/buyer of the order)
                    const recipientId = order.buyer;
                    const senderName = req.user.companyName || req.user.name || 'Manufacturer';
                    
                    // Send professional notification
                    await NotificationService.createOrderCommentNotification({
                        orderId: order._id,
                        commentId: comment._id,
                        commentContent: content,
                        commentType: type,
                        priority,
                        recipientId,
                        recipientModel: 'User',
                        senderId: req.user.userId,
                        senderModel: req.user.userType === 'admin' ? 'Admin' : 'User',
                        orderNumber: order.orderNumber,
                        senderName,
                        channels: {
                            email: true,
                            push: true,
                            inApp: true
                        }
                    });
                    
                    console.log(`✅ Customer notification sent for order ${order.orderNumber}`);
                } catch (notificationError) {
                    console.error('❌ Error sending customer notification:', notificationError);
                    // Don't fail the whole request if notification fails
                }
            }

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
            const { commentId } = req.params;
            const { content, type, visibility, priority, status, notifyCustomer = false } = req.body;

            // Validate commentId format
            if (!commentId || !require('mongoose').Types.ObjectId.isValid(commentId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid comment ID format'
                });
            }

            // Validate content
            if (!content || typeof content !== 'string' || content.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Comment content is required and cannot be empty'
                });
            }

            if (content.trim().length > 2000) {
                return res.status(400).json({
                    success: false,
                    message: 'Comment content cannot exceed 2000 characters'
                });
            }

            // Find comment
            const comment = await OrderComment.findById(commentId);
            if (!comment) {
                return res.status(404).json({
                    success: false,
                    message: 'Comment not found'
                });
            }

            // Advanced permission check with proper user ID handling
            const userRole = req.user.userType === 'admin' ? 'admin' : 'user';
            const userId = req.user.userId || req.user._id;
            const authorId = comment.author?._id || comment.author;
            
            const isAuthor = userId && authorId && 
                           (userId.toString() === authorId.toString());
            
            if (!isAuthor && userRole !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only edit your own comments.'
                });
            }

            // Time restriction check for non-admin users (24 hours)
            if (userRole !== 'admin' && comment.createdAt) {
                const hoursSinceCreated = (new Date() - new Date(comment.createdAt)) / (1000 * 60 * 60);
                if (hoursSinceCreated > 24) {
                    return res.status(403).json({
                        success: false,
                        message: 'Comments can only be edited within 24 hours of creation'
                    });
                }
            }

            // Validate enum values
            const validTypes = ['general', 'status_update', 'quality_note', 'delivery_note', 'payment_note', 'internal_note', 'customer_note'];
            const validVisibilities = ['public', 'internal', 'private'];
            const validPriorities = ['low', 'normal', 'high', 'urgent'];
            const validStatuses = ['active', 'hidden', 'deleted'];

            if (type && !validTypes.includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid comment type'
                });
            }

            if (visibility && !validVisibilities.includes(visibility)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid visibility setting'
                });
            }

            if (priority && !validPriorities.includes(priority)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid priority level'
                });
            }

            if (status && !validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status'
                });
            }

            // Update fields with validation
            comment.content = content.trim();
            if (type !== undefined) comment.type = type;
            if (visibility !== undefined) comment.visibility = visibility;
            if (priority !== undefined) comment.priority = priority;
            if (status !== undefined && userRole === 'admin') comment.status = status; // Only admin can change status

            // Track modification
            comment.updatedAt = new Date();
            comment.modifiedBy = userId;

            await comment.save();

            // Populate author information
            await comment.populate('author', 'name email companyName role');

            // Handle customer notification if requested during edit
            if (notifyCustomer) {
                try {
                    // Get order information for notification
                    const order = await Order.findById(comment.order).populate('seller', '_id');
                    if (order) {
                        const recipientId = order.buyer;
                        const senderName = req.user.companyName || req.user.name || 'Manufacturer';
                        
                        await NotificationService.createOrderCommentNotification({
                            orderId: order._id,
                            commentId: comment._id,
                            commentContent: content,
                            commentType: type,
                            priority,
                            recipientId,
                            recipientModel: 'User',
                            senderId: req.user.userId,
                            senderModel: req.user.userType === 'admin' ? 'Admin' : 'User',
                            orderNumber: order.orderNumber,
                            senderName,
                            channels: {
                                email: true,
                                push: true,
                                inApp: true
                            },
                            isUpdate: true  // Flag to indicate this is an update notification
                        });
                        
                        console.log(`✅ Customer notification sent for updated comment on order ${order.orderNumber}`);
                    }
                } catch (notificationError) {
                    console.error('❌ Error sending customer notification for comment update:', notificationError);
                    // Don't fail the update if notification fails
                }
            }

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
            console.log('🗑️ DELETE attempt for commentId:', commentId);

            // Validate commentId format
            if (!commentId || !require('mongoose').Types.ObjectId.isValid(commentId)) {
                console.log('❌ Invalid comment ID format:', commentId);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid comment ID format'
                });
            }

            // Find comment with replies count
            console.log('🔍 Searching for comment in OrderComment collection...');
            const comment = await OrderComment.findById(commentId);
            console.log('📊 Comment found:', comment ? 'YES' : 'NO');
            
            if (!comment) {
                // Additional debugging: check if it exists in Comment (product) collection
                const ProductComment = require('../models/Comment');
                const productComment = await ProductComment.findById(commentId);
                console.log('🔍 Found in Product Comment collection:', productComment ? 'YES' : 'NO');
                
                return res.status(404).json({
                    success: false,
                    message: 'Order comment not found',
                    debug: {
                        searchedIn: 'OrderComment',
                        foundInProductComment: !!productComment,
                        commentId
                    }
                });
            }

            // Advanced permission check with proper user ID handling
            const userRole = req.user.userType === 'admin' ? 'admin' : 'user';
            const userId = req.user.userId || req.user._id;
            const authorId = comment.author?._id || comment.author;
            
            const isAuthor = userId && authorId && 
                           (userId.toString() === authorId.toString());
            
            if (!isAuthor && userRole !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only delete your own comments.'
                });
            }

            // Check if comment has replies
            const replyCount = await OrderComment.countDocuments({ parentComment: commentId });
            
            if (replyCount > 0) {
                // If comment has replies, mark as deleted instead of removing
                comment.status = 'deleted';
                comment.content = '[This comment has been deleted]';
                comment.deletedAt = new Date();
                comment.deletedBy = userId;
                await comment.save();
                
                return res.json({
                    success: true,
                    message: 'Comment marked as deleted (has replies)'
                });
            } else {
                // Safe deletion: no replies exist
                await OrderComment.findByIdAndDelete(commentId);
                
                // If this was a reply, remove it from parent's replies array
                if (comment.parentComment) {
                    await OrderComment.findByIdAndUpdate(comment.parentComment, {
                        $pull: { replies: commentId }
                    });
                }
                
                return res.json({
                    success: true,
                    message: 'Comment deleted successfully'
                });
            }

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
            const order = await Order.findById(orderId).populate('seller', '_id');
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
     * Get a specific comment by ID
     * GET /api/comments/:commentId
     */
    static async getCommentById(req, res) {
        try {
            const { commentId } = req.params;

            // Find comment
            const comment = await OrderComment.findById(commentId)
                .populate('author', 'name email companyName role')
                .lean();

            if (!comment) {
                return res.status(404).json({
                    success: false,
                    message: 'Comment not found'
                });
            }

            // Check permissions - user can view comments they have access to
            const order = await Order.findById(comment.order).populate('seller', '_id');
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Related order not found'
                });
            }

            // Determine user role and access
            const userRole = req.user.userType === 'admin' ? 'admin' : 
                           (req.user.role === 'company_admin' ? 'manufacturer' : 'customer');
            
            // Check access permissions
            if (userRole === 'manufacturer' && !OrderCommentController.hasManufacturerAccess(order, req.user)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this comment'
                });
            }

            return res.json({
                success: true,
                data: { comment }
            });

        } catch (error) {
            console.error('Error fetching comment:', error);
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
                .withMessage('Invalid parent comment ID'),
            body('notifyCustomer')
                .optional()
                .isBoolean()
                .withMessage('Notify customer must be a boolean value')
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
            // Order'da seller = manufacturer, buyer = distributor
            const orderSellerId = order.seller?._id?.toString() || order.seller?.toString();
            const userIdStr = user.userId?.toString() || user._id?.toString();
            const userCompanyId = user.companyId?.toString();
            
            // Check if user is manufacturer (seller) of this order
            const isOrderSeller = orderSellerId && userIdStr && orderSellerId === userIdStr;
            
            // Alternative: Check by company ID if available
            const isSellerByCompany = orderSellerId && userCompanyId && orderSellerId === userCompanyId;
            
            return isOrderSeller || isSellerByCompany;
        } catch (error) {
            console.error('Error checking manufacturer access:', error);
            return false;
        }
    }
}

module.exports = OrderCommentController;
