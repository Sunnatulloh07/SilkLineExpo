/**
 * Admin Routes - Clean Architecture
 * Separated UI and API routes with proper middleware
 */

const express = require('express');
const AdminController = require('../controllers/AdminController');
const { authenticate, adminOnly } = require('../middleware/jwtAuth');

const router = express.Router();

// Apply JWT authentication to all routes
router.use(authenticate);
router.use(adminOnly);

// ===== UI ROUTES =====
router.get('/dashboard', AdminController.showDashboard);
router.get('/pending-approvals', AdminController.showPendingApprovals);
router.get('/users', AdminController.showAllUsers);
router.get('/users/:userId', AdminController.showUserDetails);
router.get('/settings', AdminController.showSettings);

// ===== API ROUTES =====
// Dashboard APIs
router.get('/api/dashboard/stats', AdminController.getDashboardStats);

// User Management APIs
router.get('/api/pending-approvals', AdminController.getPendingApprovals);
router.get('/api/users', AdminController.getAllUsers);
router.get('/api/users/:userId', AdminController.getUserDetails);

// User Actions APIs
router.post('/api/users/:userId/approve', AdminController.approveUser);
router.post('/api/users/:userId/reject', AdminController.rejectUser);

// Super Admin Only APIs
router.post('/api/users/:userId/suspend', AdminController.suspendUser);
router.post('/api/users/:userId/reactivate', AdminController.reactivateUser);

// Bulk Operations APIs
router.post('/api/users/bulk/approve', AdminController.bulkApproveUsers);
router.post('/api/users/bulk/reject', AdminController.bulkRejectUsers);

module.exports = router;