/**
 * Authentication API Routes
 * Clean and optimized authentication endpoints
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const AuthController = require('../controllers/AuthController');
const { rateLimit } = require('../middleware/auth');

const router = express.Router();

// Multer configuration for file uploads
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

// User Registration
router.post('/register', 
  rateLimit(3, 15 * 60 * 1000), 
  upload.single('companyLogo'), 
  AuthController.register
);

// Unified Login (Auto-detects Admin or Company User)
router.post('/login', 
  rateLimit(5, 15 * 60 * 1000), 
  AuthController.login
);

// Legacy Admin Login (redirects to unified login)
router.post('/admin/login', 
  rateLimit(3, 15 * 60 * 1000), 
  AuthController.adminLogin
);

// Logout
router.post('/logout', AuthController.logout);

// Validation Endpoints
router.get('/check-email', AuthController.checkEmailExists);
router.get('/check-tax-number', AuthController.checkTaxNumberExists);

// Password Reset
router.post('/password-reset', 
  rateLimit(3, 60 * 60 * 1000), 
  AuthController.requestPasswordReset
);

router.post('/reset-password', AuthController.resetPassword);

// Status Check
router.get('/status', AuthController.getStatus);

module.exports = router;