/**
 * Authentication API Routes
 * Clean and optimized authentication endpoints
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const AuthControllerClass = require('../controllers/AuthController');
const { rateLimit } = require('../middleware/auth');

const router = express.Router();

// Create AuthController instance and bind methods
const AuthController = new AuthControllerClass();
const boundAuthMethods = {
  register: AuthController.register.bind(AuthController),
  login: AuthController.login.bind(AuthController),
  adminLogin: AuthController.adminLogin.bind(AuthController),
  logout: AuthController.logout.bind(AuthController),
  checkEmailExists: AuthController.checkEmailExists.bind(AuthController),
  checkTaxNumberExists: AuthController.checkTaxNumberExists.bind(AuthController),
  requestPasswordReset: AuthController.requestPasswordReset.bind(AuthController),
  resetPassword: AuthController.resetPassword.bind(AuthController),
  getStatus: AuthController.getStatus.bind(AuthController)
};

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
  boundAuthMethods.register
);

// Unified Login (Auto-detects Admin or Company User)
router.post('/login', 
  rateLimit(5, 15 * 60 * 1000), 
  boundAuthMethods.login
);

// Legacy Admin Login (redirects to unified login)
router.post('/admin/login', 
  rateLimit(3, 15 * 60 * 1000), 
  boundAuthMethods.adminLogin
);

// Logout
router.post('/logout', boundAuthMethods.logout);

// Validation Endpoints
router.get('/check-email', boundAuthMethods.checkEmailExists);
router.get('/check-tax-number', boundAuthMethods.checkTaxNumberExists);

// Password Reset
router.post('/password-reset', 
  rateLimit(3, 60 * 60 * 1000), 
  boundAuthMethods.requestPasswordReset
);

router.post('/reset-password', boundAuthMethods.resetPassword);

// Status Check
router.get('/status', boundAuthMethods.getStatus);

module.exports = router;