/**
 * Order Comments API Routes
 * Professional order comment management endpoints
 */

const express = require('express');
const OrderCommentController = require('../../controllers/OrderCommentController');
const { authenticate } = require('../../middleware/jwtAuth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// ===== ORDER COMMENT ROUTES =====

/**
 * GET /api/orders/:orderId/comments
 * Get all comments for a specific order
 * Query params: page, limit, type, visibility, includeReplies
 */
router.get('/orders/:orderId/comments', OrderCommentController.getOrderComments);

/**
 * POST /api/orders/:orderId/comments
 * Create a new comment for an order
 * Body: { content, type?, visibility?, priority?, parentComment? }
 */
router.post('/orders/:orderId/comments', 
    OrderCommentController.getCreateValidationRules(),
    OrderCommentController.createComment
);

/**
 * GET /api/orders/:orderId/comments/statistics
 * Get comment statistics for an order
 */
router.get('/orders/:orderId/comments/statistics', OrderCommentController.getCommentStatistics);

// ===== INDIVIDUAL COMMENT ROUTES =====

/**
 * PUT /api/comments/:commentId
 * Update an existing comment
 * Body: { content?, type?, visibility?, priority?, status? }
 */
router.put('/comments/:commentId',
    OrderCommentController.getUpdateValidationRules(),
    OrderCommentController.updateComment
);

/**
 * DELETE /api/comments/:commentId
 * Delete a comment and its replies
 */
router.delete('/comments/:commentId', OrderCommentController.deleteComment);

/**
 * POST /api/comments/:commentId/flag
 * Flag a comment for admin review
 * Body: { reason? }
 */
router.post('/comments/:commentId/flag', OrderCommentController.flagComment);

module.exports = router;
