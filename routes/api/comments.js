/**
 * Comments API Routes
 * Professional B2B product comments and reviews system
 */

const express = require('express');
const { body, param } = require('express-validator');
const CommentController = require('../../controllers/CommentController');
const { authenticate } = require('../../middleware/jwtAuth');

const router = express.Router();

// Validation rules
const createCommentValidation = [
  body('content')
    .trim()
    .isLength({ min: 3, max: 1000 })
    .withMessage('Content must be between 3 and 1000 characters'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('type')
    .optional()
    .isIn(['review', 'question', 'feedback'])
    .withMessage('Invalid comment type'),
  body('parentComment')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent comment ID')
];

const updateCommentValidation = [
  body('content')
    .trim()
    .isLength({ min: 3, max: 1000 })
    .withMessage('Content must be between 3 and 1000 characters'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5')
];

const commentIdValidation = [
  param('commentId')
    .isMongoId()
    .withMessage('Invalid comment ID')
];

const productIdValidation = [
  param('productId')
    .isMongoId()
    .withMessage('Invalid product ID')
];

// ===== PRODUCT COMMENTS ROUTES =====

/**
 * GET /api/products/:productId/comments
 * Get all comments for a product
 */
router.get('/products/:productId/comments', 
  productIdValidation,
  CommentController.getProductComments
);

/**
 * POST /api/products/:productId/comments
 * Create a new comment for a product
 */
router.post('/products/:productId/comments',
  authenticate,
  productIdValidation,
  createCommentValidation,
  CommentController.createComment
);

// ===== COMMENT MANAGEMENT ROUTES =====

/**
 * PUT /api/comments/:commentId
 * Update a comment
 */
router.put('/comments/:commentId',
  authenticate,
  commentIdValidation,
  updateCommentValidation,
  CommentController.updateComment
);

/**
 * DELETE /api/comments/:commentId
 * Delete a comment
 */
router.delete('/comments/:commentId',
  authenticate,
  commentIdValidation,
  CommentController.deleteComment
);

/**
 * POST /api/comments/:commentId/vote
 * Vote on comment helpfulness
 */
router.post('/comments/:commentId/vote',
  authenticate,
  commentIdValidation,
  [
    body('helpful')
      .isBoolean()
      .withMessage('Helpful must be a boolean value')
  ],
  CommentController.voteComment
);

/**
 * POST /api/comments/:commentId/flag
 * Flag a comment for moderation
 */
router.post('/comments/:commentId/flag',
  authenticate,
  commentIdValidation,
  [
    body('reason')
      .optional()
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage('Reason must be between 3 and 200 characters')
  ],
  CommentController.flagComment
);

// ===== USER COMMENTS ROUTES =====

/**
 * GET /api/users/me/comments
 * Get current user's comments
 */
router.get('/users/me/comments',
  authenticate,
  CommentController.getUserComments
);

module.exports = router;
