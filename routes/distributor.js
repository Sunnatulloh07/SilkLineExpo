/**
 * Buyer Profile Routes  
 * Alibaba-style buyer profile for purchasing and supplier interaction
 * Simple profile system without dashboard complexity
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const BuyerController = require('../controllers/BuyerController');
const BuyerService = require('../services/BuyerService');
const { authenticate, distributorOnly } = require('../middleware/jwtAuth');
const optionalJWTAuth = require('../middleware/optionalJWTAuth');

const router = express.Router();

// Create controller instance
const buyerController = new BuyerController();

// ===== MULTER CONFIGURATION FOR BUYER AVATAR UPLOAD =====
// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, '../temp/');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Professional multer configuration for avatar uploads
const avatarUpload = multer({
    dest: tempDir,
    limits: { 
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1 // Only 1 file at a time for avatar
    },
    fileFilter: (req, file, cb) => {
        // Only accept image files
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Faqat JPG, PNG, WebP formatdagi rasmlar qabul qilinadi'), false);
        }
    }
});

// Professional multer configuration for message attachments
const messageAttachmentsUpload = multer({
    dest: tempDir,
    limits: { 
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
        files: 5 // Maximum 5 files at a time
    },
    fileFilter: (req, file, cb) => {
        // Accept images and documents
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp',
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Fayl formati noto'g'ri: ${file.mimetype}`), false);
        }
    }
});

// Apply JWT authentication and buyer-only access
router.use(authenticate);
router.use(distributorOnly);

// ===== BUYER PROFILE ROUTES (ALIBABA STYLE) =====
// Redirect distributor route to buyer profile
router.get('/', (req, res) => {
    res.redirect('/buyer/profile');
});

// Redirect dashboard specifically to buyer profile
router.get('/dashboard', (req, res) => {
    res.redirect('/buyer/profile');
});

// Main buyer pages
router.get('/profile', buyerController.showProfile.bind(buyerController));
router.get('/orders', buyerController.showOrders.bind(buyerController));
router.get('/orders/:orderId', buyerController.showOrderDetails.bind(buyerController));
router.get('/messages', buyerController.showMessages.bind(buyerController));
router.get('/cart', buyerController.showCart.bind(buyerController));
router.get('/favorites', buyerController.showFavorites.bind(buyerController));
router.get('/settings', buyerController.showSettings.bind(buyerController));

// ===== BUYER PROFILE API ROUTES =====
router.get('/api/profile-stats', buyerController.getProfileStats.bind(buyerController));
router.get('/api/buyer-orders', buyerController.getBuyerOrders.bind(buyerController));
router.get('/api/buyer-rfqs', buyerController.getBuyerRFQs.bind(buyerController));

// ===== BUYER MESSAGING API ROUTES =====
router.get('/api/conversations', buyerController.getBuyerConversations.bind(buyerController));
router.get('/api/conversations-with-current', buyerController.getBuyerConversationsWithCurrent.bind(buyerController));
router.get('/api/orders/:orderId/messages', buyerController.getOrderMessages.bind(buyerController));
router.get('/api/manufacturer/:manufacturerId/details', buyerController.getManufacturerDetails.bind(buyerController));
router.get('/api/manufacturer/:manufacturerId/conversation', buyerController.getManufacturerConversation.bind(buyerController));
router.post('/api/send-message', messageAttachmentsUpload.array('attachments', 5), buyerController.sendMessage.bind(buyerController));

// ===== BUYER ACTION ROUTES (POST) =====
router.post('/api/create-rfq', buyerController.createRFQ.bind(buyerController));

// ===== CART API ROUTES =====
router.post('/api/cart/add', buyerController.addToCart.bind(buyerController));
router.put('/api/cart/update', buyerController.updateCartItem.bind(buyerController));
router.delete('/api/cart/remove/:itemId', buyerController.removeFromCart.bind(buyerController));
router.post('/api/cart/remove-multiple', buyerController.removeMultipleCartItems.bind(buyerController));

// ===== CHECKOUT API ROUTES =====
router.post('/api/checkout/process', buyerController.processCheckout.bind(buyerController));

// ===== ORDER MANAGEMENT API ROUTES =====
router.post('/api/cancel-order', buyerController.cancelOrder.bind(buyerController));
router.post('/api/track-order', buyerController.trackOrder.bind(buyerController));

// ===== FAVORITES API ROUTES =====
router.get('/api/favorites', buyerController.getFavorites.bind(buyerController));
router.post('/api/add-to-favorites', buyerController.addToFavorites.bind(buyerController));
router.post('/api/remove-from-favorites', buyerController.removeFromFavorites.bind(buyerController));
router.post('/api/add-supplier-to-favorites', buyerController.addSupplierToFavorites.bind(buyerController));
router.post('/api/remove-supplier-from-favorites', buyerController.removeSupplierFromFavorites.bind(buyerController));
router.get('/api/favorites/check/:productId', buyerController.checkFavoriteStatus.bind(buyerController));

// ===== SETTINGS API ROUTES =====
router.post('/api/settings/profile', buyerController.updateProfile.bind(buyerController));
router.post('/api/settings/password', buyerController.updatePassword.bind(buyerController));
router.post('/api/settings/notifications', buyerController.updateNotifications.bind(buyerController));
router.post('/api/settings/preferences', buyerController.updatePreferences.bind(buyerController));

// ===== PROFESSIONAL AVATAR UPLOAD ROUTES =====
// Upload/Update buyer avatar
router.post('/api/avatar/upload', 
    avatarUpload.single('avatar'), 
    buyerController.updateAvatar.bind(buyerController)
);

// Delete buyer avatar
router.delete('/api/avatar/delete', 
    buyerController.deleteAvatar.bind(buyerController)
);

// ===== PRODUCT STATUS API ROUTES =====
router.get('/api/product-status/:productId', optionalJWTAuth.optionalAuth, buyerController.checkProductStatus.bind(buyerController));

router.use((error, req, res, next) => {
    console.error('❌ Distributor route error:', error);
    
    const isAjax = req.get('Content-Type') === 'application/json' ||
                   req.get('X-Requested-With') === 'XMLHttpRequest';
    
    if (isAjax) {
        return res.status(500).json({
            success: false,
            message: 'Distributor service error',
            code: 'SERVICE_ERROR'
        });
    } else {
        // Get language preference for HTML responses
        const lng = req.session?.language || 
                    req.cookies?.selectedLanguage || 
                    req.cookies?.i18next ||
                    req.query?.lng || 
                    'uz';
        
        return res.status(500).render('pages/error', {
            title: 'Distributor Profile Error - Silk Line Expo',
            message: 'Unable to load distributor profile',
            error: process.env.NODE_ENV === 'development' ? error : {},
            user: req.user || null,
            admin: req.user || null,
            lng: lng,
            currentLang: lng
        });
    }
});

module.exports = router;