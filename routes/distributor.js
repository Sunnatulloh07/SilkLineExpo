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
router.get('/messages', buyerController.showMessages.bind(buyerController));
router.get('/cart', buyerController.showCart.bind(buyerController));
router.get('/favorites', buyerController.showFavorites.bind(buyerController));
router.get('/settings', buyerController.showSettings.bind(buyerController));

// ===== BUYER PROFILE API ROUTES =====
router.get('/api/profile-stats', buyerController.getProfileStats.bind(buyerController));
router.get('/api/buyer-orders', buyerController.getBuyerOrders.bind(buyerController));
router.get('/api/buyer-conversations', buyerController.getBuyerConversations.bind(buyerController));
router.get('/api/buyer-rfqs', buyerController.getBuyerRFQs.bind(buyerController));

// ===== BUYER ACTION ROUTES (POST) =====
router.post('/api/send-message', buyerController.sendMessage.bind(buyerController));
router.post('/api/create-rfq', buyerController.createRFQ.bind(buyerController));

// ===== CART API ROUTES =====
router.post('/api/cart/add', buyerController.addToCart.bind(buyerController));
router.put('/api/cart/update', buyerController.updateCartItem.bind(buyerController));
router.delete('/api/cart/remove/:itemId', buyerController.removeFromCart.bind(buyerController));

// ===== FAVORITES API ROUTES =====
router.post('/api/favorites/add-product', buyerController.addToFavorites.bind(buyerController));
router.delete('/api/favorites/remove-product/:productId', buyerController.removeFromFavorites.bind(buyerController));
router.post('/api/favorites/add-supplier', buyerController.addSupplierToFavorites.bind(buyerController));

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

// ===== CART API ROUTES =====
router.post('/api/cart/update', buyerController.updateCartItem.bind(buyerController));
router.post('/api/cart/remove', buyerController.removeCartItem.bind(buyerController));
router.post('/api/cart/remove-multiple', buyerController.removeMultipleCartItems.bind(buyerController));

// ===== FAVORITES API ROUTES =====
router.post('/api/favorites/add', buyerController.addToFavorites.bind(buyerController));

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