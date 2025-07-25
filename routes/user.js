/**
 * User Routes - Clean Architecture
 * Company admin user management with proper separation
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const UserController = require('../controllers/UserController');
const { isAuthenticated, rateLimit } = require('../middleware/auth');

const router = express.Router();

// Multer configuration
const upload = multer({
  dest: path.join(__dirname, '../temp/'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    allowedTypes.includes(file.mimetype) 
      ? cb(null, true) 
      : cb(new Error('Only JPG and PNG files allowed'), false);
  }
});

// ===== PUBLIC ROUTES =====
router.get('/company/:userId', UserController.showCompanyProfile);

// ===== AUTHENTICATED ROUTES =====
router.use(isAuthenticated('user')); // Apply to all routes below

// UI Routes
router.get('/dashboard', UserController.showDashboard);
router.get('/profile', UserController.showProfile);
router.get('/settings', UserController.showSettings);

// ===== API ROUTES =====
// Profile Management
router.get('/api/profile', UserController.getProfile);
router.put('/api/profile', UserController.updateProfile);

// Logo Management
router.post('/api/profile/logo', upload.single('logo'), UserController.updateCompanyLogo);
router.delete('/api/profile/logo', UserController.deleteCompanyLogo);

// Security
router.post('/api/profile/change-password', rateLimit(3, 60 * 60 * 1000), UserController.changePassword);

// Account Status
router.get('/api/account/status', UserController.getAccountStatus);

module.exports = router;