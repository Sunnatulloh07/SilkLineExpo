/**
 * Manufacturer Messaging Routes
 * Professional B2B Communication System
 * SLEX Platform - Senior Software Engineer Implementation
 */

const express = require('express');
const router = express.Router();
const MessagingController = require('../controllers/MessagingController');
const { authenticate } = require('../middleware/jwtAuth');

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /manufacturer/messages
 * @desc    Show main messaging page with conversations list
 * @access  Private (Manufacturer)
 */
router.get('/', MessagingController.showMessagingPage);

/**
 * @route   GET /manufacturer/messages/order/:orderId
 * @desc    Show chat interface for specific order
 * @access  Private (Manufacturer)
 */
router.get('/order/:orderId', MessagingController.showOrderChat);

/**
 * @route   POST /api/messages/send
 * @desc    Send a message in order conversation
 * @access  Private (Manufacturer/Distributor)
 */
router.post('/api/send', 
    MessagingController.sendMessageValidation(),
    MessagingController.sendMessage
);

module.exports = router;
