/**
 * Buyer Routes  
 * Professional B2B buyer routes for settings, orders, and interactions
 * Senior Software Engineer Implementation
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const BuyerController = require('../controllers/BuyerController');
const { authenticate, distributorOnly } = require('../middleware/jwtAuth');
const optionalJWTAuth = require('../middleware/optionalJWTAuth');
const Inquiry = require('../models/Inquiry');
const Message = require('../models/Message');

// Ensure temp directory exists for avatar uploads
const tempDir = path.join(__dirname, '../temp/');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Multer configuration for buyer message attachments
const uploadMessageAttachments = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 5, // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg',
      'application/pdf', 'text/plain', 
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip', 'application/x-rar-compressed'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: images, PDF, documents`), false);
    }
  },
});

// Professional multer configuration for avatar uploads
const avatarUpload = multer({
    dest: tempDir,
    limits: { 
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1 // Only 1 file at a time for avatar
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed for avatars'), false);
        }
    }
});

const router = express.Router();

// Create controller instance
const buyerController = new BuyerController();

// ===== BUYER SETTINGS API ROUTES =====

/**
 * Update buyer notification preferences
 * POST /buyer/api/settings/notifications
 * Professional API endpoint with comprehensive validation
 */
router.post('/api/settings/notifications', 
    authenticate, // Authentication required
    distributorOnly, // Only distributors can update notifications
    buyerController.updateNotifications.bind(buyerController)
);

/**
 * Update buyer password
 * POST /buyer/api/settings/password
 */
router.post('/api/settings/password',
    authenticate,
    distributorOnly,
    buyerController.updatePassword.bind(buyerController)
);

/**
 * Update buyer profile settings
 * POST /buyer/api/settings/profile
 */
router.post('/api/settings/profile',
    authenticate, 
    distributorOnly,
    buyerController.updateProfile.bind(buyerController)
);

/**
 * Update buyer preferences
 * POST /buyer/api/settings/preferences
 */
router.post('/api/settings/preferences',
    authenticate,
    distributorOnly,
    buyerController.updatePreferences.bind(buyerController)
);

// ===== BUYER PROFILE API ROUTES =====

/**
 * Get buyer profile statistics
 * GET /buyer/api/profile-stats
 */
router.get('/api/profile-stats', 
    authenticate,
    distributorOnly,
    buyerController.getProfileStats.bind(buyerController)
);

/**
 * Get buyer orders
 * GET /buyer/api/buyer-orders
 */
router.get('/api/buyer-orders', 
    authenticate,
    distributorOnly,
    buyerController.getBuyerOrders.bind(buyerController)
);

/**
 * Get buyer RFQs
 * GET /buyer/api/buyer-rfqs
 */
router.get('/api/buyer-rfqs', 
    authenticate,
    distributorOnly,
    buyerController.getBuyerRFQs.bind(buyerController)
);

/**
 * Create RFQ
 * POST /buyer/api/create-rfq
 */
router.post('/api/create-rfq',
    authenticate,
    distributorOnly,
    buyerController.createRFQ.bind(buyerController)
);

// ===== BUYER MESSAGING API ROUTES =====

/**
 * Get buyer conversations
 * GET /buyer/api/conversations
 */
router.get('/api/conversations', 
    authenticate,
    distributorOnly,
    buyerController.getBuyerConversations.bind(buyerController)
);

/**
 * Get conversations with current manufacturers
 * GET /buyer/api/conversations-with-current
 */
router.get('/api/conversations-with-current',
    authenticate,
    distributorOnly,
    buyerController.getBuyerConversationsWithCurrent.bind(buyerController)
);

/**
 * Get manufacturer details
 * GET /buyer/api/manufacturer/:manufacturerId/details
 */
router.get('/api/manufacturer/:manufacturerId/details',
    authenticate,
    distributorOnly,
    buyerController.getManufacturerDetails.bind(buyerController)
);

/**
 * Get or create conversation with manufacturer
 * GET /buyer/api/manufacturer/:manufacturerId/conversation
 */
router.get('/api/manufacturer/:manufacturerId/conversation',
    authenticate,
    distributorOnly,
    buyerController.getManufacturerConversation.bind(buyerController)
);

/**
 * Get order messages
 * GET /buyer/api/orders/:orderId/messages
 */
router.get('/api/orders/:orderId/messages',
    authenticate,
    distributorOnly,
    buyerController.getOrderMessages.bind(buyerController)
);

/**
 * Mark order messages as read
 * POST /buyer/api/orders/:orderId/mark-read
 */
router.post('/api/orders/:orderId/mark-read',
    authenticate,
    distributorOnly,
    buyerController.markOrderMessagesAsRead.bind(buyerController)
);

/**
 * Get unread messages count
 * GET /buyer/api/unread-messages-count
 */
router.get('/api/unread-messages-count',
    authenticate,
    distributorOnly,
    buyerController.getUnreadMessagesCount.bind(buyerController)
);

/**
 * Send message to manufacturer
 * POST /buyer/api/send-message
 */
router.post('/api/send-message',
    authenticate,
    distributorOnly,
    uploadMessageAttachments.array('attachments', 5),
    buyerController.sendMessage.bind(buyerController)
);

// ===== BUYER CART API ROUTES =====

/**
 * Add to cart
 * POST /buyer/api/cart/add
 */
router.post('/api/cart/add',
    authenticate,
    distributorOnly,
    buyerController.addToCart.bind(buyerController)
);

/**
 * Update cart item
 * POST /buyer/api/cart/update
 */
router.post('/api/cart/update',
    authenticate,
    distributorOnly,
    buyerController.updateCartItem.bind(buyerController)
);

/**
 * Remove from cart
 * POST /buyer/api/cart/remove
 */
router.post('/api/cart/remove',
    authenticate,
    distributorOnly,
    buyerController.removeCartItem.bind(buyerController)
);

/**
 * Remove from cart by ID
 * DELETE /buyer/api/cart/remove/:itemId
 */
router.delete('/api/cart/remove/:itemId',
    authenticate,
    distributorOnly,
    buyerController.removeFromCart.bind(buyerController)
);

/**
 * Remove multiple cart items
 * POST /buyer/api/cart/remove-multiple
 */
router.post('/api/cart/remove-multiple',
    authenticate,
    distributorOnly,
    buyerController.removeMultipleCartItems.bind(buyerController)
);

/**
 * Process checkout
 * POST /buyer/api/checkout/process
 */
router.post('/api/checkout/process',
    authenticate,
    distributorOnly,
    buyerController.processCheckout.bind(buyerController)
);

/**
 * Cancel order
 * POST /buyer/api/cancel-order
 */
router.post('/api/cancel-order',
    authenticate,
    distributorOnly,
    buyerController.cancelOrder.bind(buyerController)
);

/**
 * Track order
 * POST /buyer/api/track-order
 */
router.post('/api/track-order',
    authenticate,
    distributorOnly,
    buyerController.trackOrder.bind(buyerController)
);

// ===== BUYER FAVORITES API ROUTES =====

/**
 * Get favorites
 * GET /buyer/api/favorites
 */
router.get('/api/favorites',
    authenticate,
    distributorOnly,
    buyerController.getFavorites.bind(buyerController)
);

/**
 * Add to favorites
 * POST /buyer/api/favorites/add
 */
router.post('/api/favorites/add',
    authenticate,
    distributorOnly,
    buyerController.addToFavorites.bind(buyerController)
);

/**
 * Remove from favorites
 * POST /buyer/api/favorites/remove
 */
router.post('/api/favorites/remove',
    authenticate,
    distributorOnly,
    buyerController.removeFromFavorites.bind(buyerController)
);

/**
 * Check favorite status
 * GET /buyer/api/favorites/check/:productId
 */
router.get('/api/favorites/check/:productId',
    authenticate,
    distributorOnly,
    buyerController.checkFavoriteStatus.bind(buyerController)
);

/**
 * Add supplier to favorites
 * POST /buyer/api/add-supplier-to-favorites
 */
router.post('/api/add-supplier-to-favorites',
    authenticate,
    distributorOnly,
    buyerController.addSupplierToFavorites.bind(buyerController)
);

/**
 * Remove supplier from favorites
 * POST /buyer/api/remove-supplier-from-favorites
 */
router.post('/api/remove-supplier-from-favorites',
    authenticate,
    distributorOnly,
    buyerController.removeSupplierFromFavorites.bind(buyerController)
);

/**
 * Add to favorites (legacy route)
 * POST /buyer/api/add-to-favorites
 */
router.post('/api/add-to-favorites',
    authenticate,
    distributorOnly,
    buyerController.addToFavorites.bind(buyerController)
);

/**
 * Remove from favorites (legacy route)
 * POST /buyer/api/remove-from-favorites
 */
router.post('/api/remove-from-favorites',
    authenticate,
    distributorOnly,
    buyerController.removeFromFavorites.bind(buyerController)
);

/**
 * Clear all favorites
 * POST /buyer/api/favorites/clear-all
 */
router.post('/api/favorites/clear-all',
    authenticate,
    distributorOnly,
    buyerController.clearAllFavorites.bind(buyerController)
);

/**
 * Upload avatar
 * POST /buyer/api/avatar/upload
 */
router.post('/api/avatar/upload',
    authenticate,
    distributorOnly,
    avatarUpload.single('avatar'),
    buyerController.updateAvatar.bind(buyerController)
);

/**
 * Delete avatar
 * DELETE /buyer/api/avatar/delete
 */
router.delete('/api/avatar/delete',
    authenticate,
    distributorOnly,
    buyerController.deleteAvatar.bind(buyerController)
);

/**
 * Check product status
 * GET /buyer/api/product-status/:productId
 */
router.get('/api/product-status/:productId',
    optionalJWTAuth.optionalAuth,
    buyerController.checkProductStatus.bind(buyerController)
);

// ===== BUYER PAGE ROUTES =====

/**
 * Render buyer settings page
 * GET /buyer/settings
 */
router.get('/settings',
    authenticate,
    distributorOnly,
    buyerController.showSettings.bind(buyerController)
);

/**
 * Render buyer cart page
 * GET /buyer/cart
 */
router.get('/cart',
    authenticate,
    distributorOnly,
    buyerController.showCart.bind(buyerController)
);

/**
 * Render buyer orders page
 * GET /buyer/orders
 */
router.get('/orders',
    authenticate,
    distributorOnly,
    buyerController.showOrders.bind(buyerController)
);

/**
 * Render order details page
 * GET /buyer/orders/:orderId
 */
router.get('/orders/:orderId',
    authenticate,
    distributorOnly,
    buyerController.showOrderDetails.bind(buyerController)
);

/**
 * Render buyer inquiries page
 * GET /buyer/inquiries
 */
router.get('/inquiries',
    authenticate,
    distributorOnly,
    buyerController.showInquiries.bind(buyerController)
);

/**
 * Render buyer profile page
 * GET /buyer/profile
 */
router.get('/profile',
    authenticate,
    distributorOnly,
    buyerController.showProfile.bind(buyerController)
);

/**
 * Render buyer favorites page
 * GET /buyer/favorites
 */
router.get('/favorites',
    authenticate,
    distributorOnly,
    buyerController.showFavorites.bind(buyerController)
);

/**
 * Render buyer messages page
 * GET /buyer/messages
 */
router.get('/messages',
    authenticate,
    distributorOnly,
    buyerController.showMessages.bind(buyerController)
);

// ===== INQUIRY MANAGEMENT =====

/**
 * Create new inquiry
 * POST /buyer/api/inquiries
 */
router.post('/api/inquiries',
    authenticate,
    distributorOnly,
    buyerController.createInquiry.bind(buyerController)
);

/**
 * Get buyer inquiries
 * GET /buyer/api/inquiries
 */
router.get('/api/inquiries',
    authenticate,
    distributorOnly,
    buyerController.getBuyerInquiries.bind(buyerController)
);

/**
 * Get specific inquiry
 * GET /buyer/api/inquiries/:inquiryId
 */
router.get('/api/inquiries/:inquiryId',
    authenticate,
    distributorOnly,
    buyerController.getInquiry.bind(buyerController)
);

/**
 * Mark inquiry messages as read
 * POST /buyer/api/inquiries/:inquiryId/mark-read
 */
router.post('/api/inquiries/:inquiryId/mark-read',
    authenticate,
    distributorOnly,
    async (req, res) => {
        try {
            const userId = req.user._id || req.user.userId;
            const { inquiryId } = req.params;
            
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: 'User ID not found',
                    message: 'Authentication required'
                });
            }
            
            if (!inquiryId) {
                return res.status(400).json({
                    success: false,
                    error: 'Inquiry ID required',
                    message: 'Inquiry ID is required'
                });
            }
            

            
            // Mark all messages in this inquiry as read for the buyer
            const result = await Message.updateMany(
                {
                    inquiryId: inquiryId,
                    recipientId: userId,
                    status: { $in: ['sent', 'delivered'] }
                },
                {
                    $set: { 
                        status: 'read',
                        readAt: new Date()
                    }
                }
            );

            // Also update inquiry read status
            await Inquiry.updateOne(
                {
                    _id: inquiryId,
                    inquirer: userId
                },
                {
                    $set: { 
                        readByInquirer: true,
                        readAt: new Date()
                    }
                }
            );

            res.json({
                success: true,
                message: 'Inquiry messages marked as read',
                updatedMessages: result.modifiedCount,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error marking inquiry messages as read:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to mark inquiry messages as read',
                message: error.message
            });
        }
    }
);

module.exports = router;
