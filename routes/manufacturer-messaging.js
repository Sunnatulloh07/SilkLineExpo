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
 * @route   GET /manufacturer/messages/api/conversations
 * @desc    Get conversations list with pagination and filters
 * @access  Private (Manufacturer)
 */
router.get('/api/conversations', MessagingController.getConversations);

/**
 * @route   POST /manufacturer/messages/api/order/:orderId/mark-read
 * @desc    Mark order messages as read
 * @access  Private (Manufacturer)
 */
router.post('/api/order/:orderId/mark-read', MessagingController.markOrderMessagesAsRead);

/**
 * @route   POST /api/messages/send
 * @desc    Send a message in order conversation
 * @access  Private (Manufacturer/Distributor)
 */
router.post('/api/send', 
    MessagingController.sendMessageValidation(),
    MessagingController.sendMessage
);

/**
 * @route   GET /manufacturer/messages/inquiry/:inquiryId
 * @desc    Show chat interface for specific inquiry
 * @access  Private (Manufacturer)
 */
router.get('/inquiry/:inquiryId', MessagingController.showInquiryChat);

/**
 * @route   GET /manufacturer/messages/api/inquiry/:inquiryId/messages
 * @desc    Get inquiry messages with pagination
 * @access  Private (Manufacturer)
 */
router.get('/api/inquiry/:inquiryId/messages', MessagingController.getInquiryMessages);

/**
 * @route   POST /manufacturer/messages/api/inquiry/:inquiryId/mark-read
 * @desc    Mark inquiry messages as read
 * @access  Private (Manufacturer)
 */
router.post('/api/inquiry/:inquiryId/mark-read', MessagingController.markInquiryMessagesAsRead);

module.exports = router;
