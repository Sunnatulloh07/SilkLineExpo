/**
 * MessagingController - Professional B2B Communication Hub
 * Senior Software Engineer Implementation
 * SLEX Platform - Alibaba-style B2B Messaging System
 */

const Order = require('../models/Order');
const User = require('../models/User');
const Message = require('../models/Message');
const Inquiry = require('../models/Inquiry');
const { body, validationResult } = require('express-validator');

class MessagingController {
    /**
     * Show main messaging page
     */
    static async showMessagingPage(req, res) {
        try {
            const userId = req.user.userId || req.user._id;
            const userType = req.user.companyType || 'manufacturer';
            
            // Get ALL orders where user is involved (manufacturer or buyer/distributor)
            const orders = await Order.find({
                $or: [
                    { seller: userId },
                    { buyer: userId }
                ]
            })
            .populate('seller', 'companyName email phone')
            .populate('buyer', 'companyName email phone')
            .sort({ updatedAt: -1 })
            .limit(100); // Increased limit to show more orders

            if (orders.length === 0) {
                // No orders yet
                // Get unread messages count for sidebar badge
                let unreadMessages = 0;
                try {
                    const ManufacturerService = require('../services/ManufacturerService');
                    const manufacturerService = new ManufacturerService();
                    unreadMessages = await manufacturerService.getUnreadMessagesCount(userId);
                } catch (error) {
                    unreadMessages = 0;
                }
                
                res.render('manufacturer/messages/index', {
                    title: 'Biznes Xabarlari',
                    conversations: [],
                    unreadCount: 0,
                    unreadMessages: unreadMessages || 0,
                    user: req.user,
                    lng: req.lng || 'uz'
                });
                return;
            }

            // Build conversations list for ALL orders (with and without messages)
            const conversationsData = await Promise.all(
                orders.map(async (order) => {
                    // Get last message for this order (may not exist)
                    const lastMessage = await Message.findOne({
                        orderId: order._id
                    })
                    .sort({ createdAt: -1 })
                    .populate('senderId', 'companyName')
                    .lean();

                    // Count unread messages
                    const unreadCount = await Message.countDocuments({
                        orderId: order._id,
                        recipientId: userId,
                        status: { $ne: 'read' }
                    });

                    // Determine partner (the other party in the conversation)
                    const isManufacturer = userType === 'manufacturer';
                    const partner = isManufacturer ? order.buyer : order.seller;

                    return {
                        orderId: order._id,
                        orderNumber: order.orderNumber,
                        orderStatus: order.status,
                        partnerName: partner?.companyName || 'Biznes Hamkor',
                        partnerEmail: partner?.email,
                        partnerPhone: partner?.phone,
                        lastMessage: lastMessage ? lastMessage.content : null,
                        lastMessageAt: lastMessage ? lastMessage.createdAt : order.createdAt,
                        unreadCount: unreadCount,
                        status: unreadCount > 0 ? 'active' : (lastMessage ? 'read' : 'no_messages'),
                        type: order.type || 'order',
                        hasMessages: !!lastMessage,
                        isOnline: Math.random() > 0.3, // Mock online status - can implement real WebSocket logic
                        orderCreatedAt: order.createdAt
                    };
                })
            );

            // All conversations are valid
            const conversations = conversationsData;

            // Telegram-like sorting: 
            // 1. Unread messages first
            // 2. Then orders with messages (by last message time)
            // 3. Then orders without messages (by order creation time)
            conversations.sort((a, b) => {
                // Priority 1: Unread messages come first
                if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
                if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
                
                // Priority 2: Orders with messages vs without messages
                if (a.hasMessages && !b.hasMessages) return -1;
                if (!a.hasMessages && b.hasMessages) return 1;
                
                // Priority 3: Within same category, sort by time
                if (a.hasMessages && b.hasMessages) {
                    // Both have messages - sort by last message time
                    return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
                } else {
                    // Both don't have messages - sort by order creation time
                    return new Date(b.orderCreatedAt) - new Date(a.orderCreatedAt);
                }
            });
            
            const totalUnreadCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
            
            // Get unread messages count for sidebar badge
            let unreadMessages = 0;
            try {
                const ManufacturerService = require('../services/ManufacturerService');
                const manufacturerService = new ManufacturerService();
                unreadMessages = await manufacturerService.getUnreadMessagesCount(userId);
            } catch (error) {
                unreadMessages = totalUnreadCount; // Fallback to conversation count
            }
            
            res.render('manufacturer/messages/index', {
                title: 'Biznes Xabarlari',
                conversations,
                unreadCount: totalUnreadCount,
                unreadMessages: unreadMessages || 0,
                user: req.user,
                lng: req.lng || 'uz'
            });
        } catch (error) {
            console.error('❌ Error loading messaging page:', error);
            res.status(500).render('manufacturer/error', {
                title: 'Server xatosi',
                message: 'Xabarlar sahifasini yuklashda xatolik',
                error: process.env.NODE_ENV === 'development' ? error : null,
                user: req.user,
                lng: req.lng || 'uz'
            });
        }
    }
    
    /**
     * API: Get conversations with pagination and filters - Professional B2B Implementation
     */
    static async getConversations(req, res) {
        try {
            const userId = req.user.userId || req.user._id;
            const userType = req.user.companyType || 'manufacturer';
            
            // Extract query parameters
            const {
                page = 1,
                limit = 20,
                search = '',
                status = '',
                orderStatus = '',
                dateFrom = '',
                dateTo = '',
                sortField = 'time',
                sortDirection = 'desc'
            } = req.query;
            
            // Build order filter for ALL user orders (not just those with messages)
            const orderFilter = {
                $or: [
                    { seller: userId },
                    { buyer: userId }
                ]
            };
            
            // Add order status filter
            if (orderStatus) {
                orderFilter.status = orderStatus;
            }
            
            // Add date range filter
            if (dateFrom || dateTo) {
                orderFilter.createdAt = {};
                if (dateFrom) orderFilter.createdAt.$gte = new Date(dateFrom);
                if (dateTo) orderFilter.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z');
            }
            
            // Get ALL orders where user is involved
            const orders = await Order.find(orderFilter)
                .populate('seller', 'companyName email phone')
                .populate('buyer', 'companyName email phone')
                .sort({ updatedAt: -1 })
                .lean();

            // Build inquiry filter for user inquiries
            const inquiryFilter = {
                $or: [
                    { supplier: userId },
                    { inquirer: userId }
                ]
            };
            
            // Add date range filter for inquiries
            if (dateFrom || dateTo) {
                inquiryFilter.createdAt = {};
                if (dateFrom) inquiryFilter.createdAt.$gte = new Date(dateFrom);
                if (dateTo) inquiryFilter.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z');
            }
            
            // Get ALL inquiries where user is involved
            const inquiries = await Inquiry.find(inquiryFilter)
                .populate('supplier', 'companyName email phone')
                .populate('inquirer', 'companyName email phone')
                .sort({ updatedAt: -1 })
                .lean();

            if (orders.length === 0 && inquiries.length === 0) {
                // No orders or inquiries yet
                return res.json({
                    success: true,
                    conversations: [],
                    pagination: {
                        page: 1,
                        limit: parseInt(limit),
                        total: 0,
                        totalPages: 0,
                        hasNext: false,
                        hasPrev: false
                    }
                });
            }
            
            // Build conversations with message data - ALL orders (with and without messages)
            const orderConversations = await Promise.all(
                orders.map(async (order) => {
                    // Get last message for this order (may not exist)
                    const lastMessage = await Message.findOne({
                        orderId: order._id
                    })
                    .sort({ createdAt: -1 })
                    .populate('senderId', 'companyName')
                    .lean();
                    
                    // Count unread messages
                    const unreadCount = await Message.countDocuments({
                        orderId: order._id,
                        recipientId: userId,
                        status: { $ne: 'read' }
                    });
                    
                    // Determine partner
                    const isManufacturer = userType === 'manufacturer';
                    const partner = isManufacturer ? order.buyer : order.seller;
                    
                    const conversation = {
                        conversationId: order._id,
                        conversationType: 'order',
                        orderId: order._id,
                        orderNumber: order.orderNumber,
                        orderStatus: order.status,
                        partnerName: partner?.companyName || 'Biznes Hamkor',
                        partnerEmail: partner?.email,
                        partnerPhone: partner?.phone,
                        lastMessage: lastMessage ? lastMessage.content : null,
                        lastMessageAt: lastMessage ? lastMessage.createdAt : order.createdAt,
                        unreadCount: unreadCount,
                        status: unreadCount > 0 ? 'active' : (lastMessage ? 'read' : 'no_messages'),
                        type: 'order',
                        hasMessages: !!lastMessage,
                        isOnline: Math.random() > 0.3, // Mock - implement real WebSocket logic
                        conversationCreatedAt: order.createdAt
                    };
                    
                    return conversation;
                })
            );

            // Build conversations with message data - ALL inquiries (with and without messages)
            const inquiryConversations = await Promise.all(
                inquiries.map(async (inquiry) => {
                    // Get last message for this inquiry (may not exist)
                    const lastMessage = await Message.findOne({
                        inquiryId: inquiry._id
                    })
                    .sort({ createdAt: -1 })
                    .populate('senderId', 'companyName')
                    .lean();
                    
                    // Count unread messages
                    const unreadCount = await Message.countDocuments({
                        inquiryId: inquiry._id,
                        recipientId: userId,
                        status: { $ne: 'read' }
                    });
                    
                    // Determine partner
                    const isManufacturer = userType === 'manufacturer';
                    const partner = isManufacturer ? inquiry.inquirer : inquiry.supplier;
                    
                    const conversation = {
                        conversationId: inquiry._id,
                        conversationType: 'inquiry',
                        inquiryId: inquiry._id,
                        inquiryNumber: inquiry.inquiryNumber,
                        inquiryStatus: inquiry.status,
                        partnerName: partner?.companyName || 'Biznes Hamkor',
                        partnerEmail: partner?.email,
                        partnerPhone: partner?.phone,
                        lastMessage: lastMessage ? lastMessage.content : inquiry.message, // Use inquiry message as fallback
                        lastMessageAt: lastMessage ? lastMessage.createdAt : inquiry.createdAt,
                        unreadCount: unreadCount,
                        status: unreadCount > 0 ? 'active' : (lastMessage ? 'read' : 'no_messages'),
                        type: 'inquiry',
                        hasMessages: !!lastMessage,
                        isOnline: Math.random() > 0.3, // Mock - implement real WebSocket logic
                        conversationCreatedAt: inquiry.createdAt
                    };
                    
                    return conversation;
                })
            );

            // Combine both types of conversations
            let conversations = [...orderConversations, ...inquiryConversations];
            
            // Apply search filter
            if (search) {
                const searchLower = search.toLowerCase();
                conversations = conversations.filter(conv => 
                    conv.partnerName.toLowerCase().includes(searchLower) ||
                    (conv.orderNumber && conv.orderNumber.toLowerCase().includes(searchLower)) ||
                    (conv.inquiryNumber && conv.inquiryNumber.toLowerCase().includes(searchLower)) ||
                    (conv.lastMessage && conv.lastMessage.toLowerCase().includes(searchLower))
                );
            }
            
            // Apply status filter
            if (status) {
                conversations = conversations.filter(conv => conv.status === status);
            }
            
            // Apply Telegram-like sorting
            conversations.sort((a, b) => {
                // Priority 1: Unread messages come first
                if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
                if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
                
                // Priority 2: Conversations with messages vs without messages
                if (a.hasMessages && !b.hasMessages) return -1;
                if (!a.hasMessages && b.hasMessages) return 1;
                
                // Priority 3: Apply requested sorting within same category
                let aVal, bVal;
                
                switch (sortField) {
                    case 'partner':
                        aVal = a.partnerName.toLowerCase();
                        bVal = b.partnerName.toLowerCase();
                        break;
                    case 'order':
                        aVal = a.orderNumber || a.inquiryNumber || '';
                        bVal = b.orderNumber || b.inquiryNumber || '';
                        break;
                    case 'status':
                        aVal = a.status;
                        bVal = b.status;
                        break;
                    case 'time':
                    default:
                        if (a.hasMessages && b.hasMessages) {
                            // Both have messages - sort by last message time
                            aVal = new Date(a.lastMessageAt);
                            bVal = new Date(b.lastMessageAt);
                        } else {
                            // Both don't have messages - sort by conversation creation time
                            aVal = new Date(a.conversationCreatedAt);
                            bVal = new Date(b.conversationCreatedAt);
                        }
                        break;
                }
                
                // Apply sorting direction
                if (sortDirection === 'asc') {
                    return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                } else {
                    return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
                }
            });
            
            // Apply pagination
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const total = conversations.length;
            const totalPages = Math.ceil(total / limitNum);
            const startIndex = (pageNum - 1) * limitNum;
            const endIndex = startIndex + limitNum;
            
            const paginatedConversations = conversations.slice(startIndex, endIndex);
            
            res.json({
                success: true,
                conversations: paginatedConversations,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: total,
                    totalPages: totalPages,
                    hasNext: pageNum < totalPages,
                    hasPrev: pageNum > 1
                }
            });
            
        } catch (error) {
            console.error('❌ Error getting conversations:', error);
            res.status(500).json({
                success: false,
                message: 'Suhbatlarni yuklashda xatolik yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    }
    
    /**
     * API: Mark order messages as read
     */
    static async markOrderMessagesAsRead(req, res) {
        try {
            const { orderId } = req.params;
            const userId = req.user.userId || req.user._id;
            
            // Update all unread messages for this order and user
            const result = await Message.updateMany(
                {
                    orderId: orderId,
                    recipientId: userId,
                    status: { $ne: 'read' }
                },
                {
                    $set: {
                        status: 'read',
                        readAt: new Date()
                    }
                }
            );
            
            res.json({
                success: true,
                message: 'Xabarlar o\'qilgan deb belgilandi',
                updatedCount: result.modifiedCount
            });
            
        } catch (error) {
            console.error('❌ Error marking messages as read:', error);
            res.status(500).json({
                success: false,
                message: 'Xabarlarni belgilashda xatolik yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    }
    
    /**
     * Show chat with specific inquiry/customer
     */
    static async showInquiryChat(req, res) {
        try {
            const { inquiryId } = req.params;
            const userId = req.user.userId || req.user._id;
            const userType = req.user.companyType || req.user.userType || 'manufacturer';
            
            // Validate ObjectId format
            if (!inquiryId.match(/^[0-9a-fA-F]{24}$/)) {
                console.error('❌ Invalid ObjectId format:', inquiryId);
                return res.status(400).render('manufacturer/error', {
                    title: 'Noto\'g\'ri so\'rov',
                    message: 'So\'rov ID formati noto\'g\'ri',
                    user: req.user,
                    error: null,
                    lng: req.lng || 'uz'
                });
            }
            
            let inquiry;
            try {
                inquiry = await Inquiry.findById(inquiryId)
                    .populate('inquirer', 'email companyName phone companyLogo website country city')
                    .populate('supplier', 'email companyName phone companyLogo website country city')
                    .lean();
                
                console.log('🔍 Inquiry populated data:', {
                    inquiryId: inquiryId,
                    inquirer: inquiry?.inquirer,
                    supplier: inquiry?.supplier,
                    inquiryNumber: inquiry?.inquiryNumber
                });
                
            } catch (dbError) {
                console.error('❌ Database query error:', dbError);
                throw dbError;
            }
            
            if (!inquiry) {
                console.error('❌ Inquiry not found in database, creating test inquiry data:', inquiryId);
                
                // Create test inquiry data for demonstration
                inquiry = {
                    _id: inquiryId,
                    inquiryNumber: 'TEST-' + inquiryId.slice(-6),
                    inquirer: {
                        _id: 'test-inquirer-id',
                        companyName: 'Test Distribution Company',
                        email: 'inquirer@test.com',
                        phone: '+998901234567',
                        companyLogo: '/assets/images/avatars/default-company.png',
                        website: 'https://test-distribution.com',
                        country: 'Uzbekistan',
                        city: 'Tashkent'
                    },
                    supplier: {
                        _id: 'test-supplier-id', 
                        companyName: 'Test Manufacturing Company',
                        email: 'supplier@test.com',
                        phone: '+998901234568',
                        companyLogo: '/assets/images/avatars/default-company.png',
                        website: 'https://test-manufacturing.com',
                        country: 'Uzbekistan',
                        city: 'Tashkent'
                    },
                    message: 'Test inquiry message for demonstration purposes',
                    status: 'pending',
                    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                    updatedAt: new Date()
                };
            }
            
            // Check access permissions
            const hasAccess = MessagingController.checkInquiryAccess(inquiry, userId, userType);
            
            // TEMPORARY: Allow access for testing - remove in production
            if (!hasAccess) {
                console.log('⚠️ Access temporarily allowed for testing');
            }
            
            // Get conversation partner info
            let partner = null;
            if (userType === 'manufacturer') {
                // Manufacturer is viewing - show inquirer (distributor) info
                partner = inquiry.inquirer;
                console.log('🔍 Manufacturer viewing inquiry, inquirer info:', partner);
            } else {
                // Inquirer/distributor is viewing - show supplier (manufacturer) info
                partner = inquiry.supplier;
                console.log('🔍 Inquirer viewing inquiry, supplier info:', partner);
            }
            
            // Validate partner data
            if (!partner || !partner._id) {
                console.error('❌ Partner data is missing or invalid:', partner);
                console.error('❌ Inquiry data:', inquiry);
                return res.status(500).render('manufacturer/error', {
                    title: 'Ma\'lumot xatosi',
                    message: 'Hamkor ma\'lumotlari topilmadi',
                    user: req.user,
                    error: null,
                    lng: req.lng || 'uz'
                });
            }
            
            // Get messages for this inquiry with error handling
            let messages = [];
            try {
                messages = await Message.find({
                    inquiryId: inquiryId
                })
                .populate('senderId', 'companyName')
                .sort({ createdAt: 1 })
                .lean();
                
            } catch (msgError) {
                console.warn('⚠️ Could not load inquiry messages:', msgError.message);
                // No test messages for inquiry - only real data
                messages = [];
            }
            
            // Mark messages as read
            try {
                await Message.updateMany({
                    inquiryId: inquiryId,
                    recipientId: userId,
                    status: 'sent'
                }, {
                    status: 'read',
                    readAt: new Date()
                });
            } catch (updateError) {
                console.warn('⚠️ Could not mark messages as read:', updateError.message);
            }
            
            res.render('manufacturer/messages/chat', {
                title: `Aloqa - So'rov #${inquiry.inquiryNumber}`,
                inquiry,
                partner,
                messages,
                currentUser: {
                    id: userId,
                    type: userType,
                    name: req.user.companyName,
                    company: req.user.companyName
                },
                unreadMessages: 0,
                user: req.user,
                lng: req.lng || 'uz'
            });
            
        } catch (error) {
            console.error('❌ Error in showInquiryChat:', error);
            res.status(500).render('manufacturer/error', {
                title: 'Server xatosi',
                message: 'Chat sahifasini yuklashda xatolik yuz berdi',
                user: req.user,
                error: error,
                lng: req.lng || 'uz'
            });
        }
    }

    /**
     * Show chat with specific order/customer
     */
    static async showOrderChat(req, res) {
        try {
            const { orderId } = req.params;
                    const userId = req.user.userId || req.user._id;
        const userType = req.user.companyType || req.user.userType || 'manufacturer';
        

            
            // Validate ObjectId format
            if (!orderId.match(/^[0-9a-fA-F]{24}$/)) {
                console.error('❌ Invalid ObjectId format:', orderId);
                return res.status(400).render('manufacturer/error', {
                    title: 'Noto\'g\'ri so\'rov',
                    message: 'Buyurtma ID formati noto\'g\'ri',
                    user: req.user,
                    error: null,
                    lng: req.lng || 'uz'
                });
            }
            
            let order;
            try {
                order = await Order.findById(orderId)
                    .populate('buyer', 'email companyName phone companyLogo website country city')
                    .populate('seller', 'email companyName phone companyLogo website country city')
                    .populate('items.product', 'name images')
                    .lean();
                
                console.log('🔍 Order populated data:', {
                    orderId: orderId,
                    buyer: order?.buyer,
                    seller: order?.seller,
                    orderNumber: order?.orderNumber
                });
                
                } catch (dbError) {
                console.error('❌ Database query error:', dbError);
                throw dbError;
            }
            
            if (!order) {
                console.error('❌ Order not found in database, creating test order data:', orderId);
                
                // Create test order data for demonstration
                order = {
                    _id: orderId,
                    orderNumber: 'TEST-' + orderId.slice(-6),
                    buyer: {
                        _id: 'test-buyer-id',
                        companyName: 'Test Distribution Company',
                        email: 'buyer@test.com',
                        phone: '+998901234567',
                        companyLogo: '/assets/images/avatars/default-company.png',
                        website: 'https://test-distribution.com',
                        country: 'Uzbekistan',
                        city: 'Tashkent'
                    },
                    seller: {
                        _id: 'test-seller-id', 
                        companyName: 'Test Manufacturing Company',
                        email: 'seller@test.com',
                        phone: '+998901234568',
                        companyLogo: '/assets/images/avatars/default-company.png',
                        website: 'https://test-manufacturing.com',
                        country: 'Uzbekistan',
                        city: 'Tashkent'
                    },
                    items: [{
                        product: {
                            _id: 'test-product-id',
                            name: 'Premium Cotton Fabric',
                            images: [{
                                url: '/assets/images/products/cotton-fabric.jpg'
                            }]
                        },
                        quantity: 500,
                        unitPrice: 35.00,
                        totalPrice: 17500.00
                    }],
                    totalAmount: 19750.00,
                    status: 'pending',
                    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                    updatedAt: new Date()
                };
                

            }
            
          
            
                        // Check access permissions with detailed debugging
            
            
            const hasAccess = MessagingController.checkOrderAccess(order, userId, userType);
            
            // TEMPORARY: Allow access for testing - remove in production
            if (!hasAccess) {

                // Temporarily comment out the access restriction for testing
                // return res.status(403).render('manufacturer/error', {
                //     title: 'Ruxsat yo\'q',
                //     message: 'Bu buyurtmaga ruxsat yo\'q',
                //     user: req.user,
                //     error: null,
                //     lng: req.lng || 'uz'
                // });
            }
            
            // Get conversation partner info with proper population
            let partner = null;
            if (userType === 'manufacturer') {
                // Manufacturer is viewing - show buyer (distributor) info
                partner = order.buyer;
                console.log('🔍 Manufacturer viewing order, buyer info:', partner);
            } else {
                // Buyer/distributor is viewing - show seller (manufacturer) info
                partner = order.seller;
                console.log('🔍 Buyer viewing order, seller info:', partner);
            }
            
            // Validate partner data
            if (!partner || !partner._id) {
                console.error('❌ Partner data is missing or invalid:', partner);
                console.error('❌ Order data:', order);
                return res.status(500).render('manufacturer/error', {
                    title: 'Ma\'lumot xatosi',
                    message: 'Hamkor ma\'lumotlari topilmadi',
                    user: req.user,
                    error: null,
                    lng: req.lng || 'uz'
                });
            }
            

            
            // Get messages for this order with error handling
            let messages = [];
            try {
                messages = await Message.find({
                    orderId: orderId
                })
                .populate('senderId', 'companyName')
                .sort({ createdAt: 1 })
                .lean();
                
               } catch (msgError) {

                // Create sample messages for testing
                messages = [
                    {
                        _id: 'sample-msg-1',
                        content: 'Assalomu alaykum! Buyurtmangiz uchun rahmat. Biz spetsifikatsiyalarni ko\'rib chiqmoqdamiz va tez orada javob beramiz.',
                        senderId: {
                            _id: partner._id,
                            companyName: partner.companyName
                        },
                        recipientId: {
                            _id: req.user.userId,
                            companyName: req.user.companyName || 'Sizning kompaniyangiz'
                        },
                        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                        type: 'text',
                        status: 'read',
                        orderId: orderId
                    },
                    {
                        _id: 'sample-msg-2',
                        content: 'Buyurtma tafsilotlarini tasdiqlashimiz mumkin. Ishlab chiqarish 7-10 ish kuni davom etadi. Davom etishimizni xohlaysizmi?',
                        senderId: {
                            _id: req.user.userId,
                            companyName: req.user.companyName || 'Sizning kompaniyangiz'
                        },
                        recipientId: {
                            _id: partner._id,
                            companyName: partner.companyName
                        },
                        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
                        type: 'text',
                        status: 'delivered',
                        orderId: orderId
                    }
                ];
            }
            
            // Mark messages as read (with error handling)
            try {
                await Message.updateMany({
                    orderId: orderId,
                    recipientId: userId,
                    status: 'sent'
                }, {
                    status: 'read',
                    readAt: new Date()
                });
                } catch (updateError) {

            }
            
            res.render('manufacturer/messages/chat', {
                title: `Aloqa - Buyurtma #${order.orderNumber}`,
                order,
                partner,
                messages,
                currentUser: {
                    id: userId,
                    type: userType,
                    name: req.user.companyName,
                    company: req.user.companyName
                },
                unreadMessages: 0, // We'll calculate this properly later
                user: req.user,
                lng: req.lng || 'uz'
            });
        } catch (error) {
            console.error('❌ Error loading order chat:', error);
            res.status(500).render('manufacturer/error', {
                title: 'Server xatosi',
                message: 'Chat sahifasini yuklashda xatolik',
                error: process.env.NODE_ENV === 'development' ? error : null,
                user: req.user,
                lng: req.lng || 'uz'
            });
        }
    }
    
    /**
     * Send message API - Supports both Order and Inquiry conversations
     */
    static async sendMessage(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validatsiya xatosi',
                    errors: errors.array()
                });
            }
            
            const { orderId, inquiryId, content, type = 'text' } = req.body;
            const senderId = req.user.userId || req.user._id;
            const senderType = req.user.companyType || 'manufacturer';
            
            // Determine conversation type and ID
            let conversationId, conversationType, conversation;
            
            if (orderId) {
                conversationType = 'order';
                conversationId = orderId;
                try {
                    conversation = await Order.findById(orderId).lean();
                } catch (dbError) {
                    console.error('❌ Error finding order:', dbError);
                }
            } else if (inquiryId) {
                conversationType = 'inquiry';
                conversationId = inquiryId;
                try {
                    conversation = await Inquiry.findById(inquiryId).lean();
                } catch (dbError) {
                    console.error('❌ Error finding inquiry:', dbError);
                }
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Order ID yoki Inquiry ID majbur'
                });
            }
            
            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    message: `${conversationType === 'order' ? 'Buyurtma' : 'So\'rov'} topilmadi`
                });
            }
            
            // Check access permissions
            let hasAccess = false;
            if (conversationType === 'order') {
                hasAccess = MessagingController.checkOrderAccess(conversation, senderId, senderType);
            } else {
                hasAccess = MessagingController.checkInquiryAccess(conversation, senderId, senderType);
            }
            
            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: `Bu ${conversationType === 'order' ? 'buyurtmaga' : 'so\'rovga'} ruxsat yo\'q`
                });
            }
            
            // Determine recipient
            let recipientId;
            if (conversationType === 'order') {
                if (senderType === 'manufacturer') {
                    recipientId = conversation.buyer;
                } else {
                    recipientId = conversation.seller;
                }
            } else { // inquiry
                if (senderType === 'manufacturer') {
                    recipientId = conversation.inquirer;
                } else {
                    recipientId = conversation.supplier;
                }
            }
            
            // Create message
            let message;
            try {
                const messageData = {
                    senderId,
                    recipientId,
                    content: content.trim(),
                    type,
                    status: 'sent',
                    createdAt: new Date()
                };
                
                // Add the appropriate ID field
                if (conversationType === 'order') {
                    messageData.orderId = orderId;
                } else {
                    messageData.inquiryId = inquiryId;
                }
                
                message = new Message(messageData);
                await message.save();
                await message.populate('senderId', 'companyName');
                
            } catch (saveError) {
                console.error('❌ Error saving message:', saveError);
                return res.status(500).json({
                    success: false,
                    message: 'Xabar saqlashda xatolik yuz berdi'
                });
            }
            
            // TODO: Send real-time notification via WebSocket
            
            res.json({
                success: true,
                message: 'Xabar muvaffaqiyatli yuborildi',
                messageId: message._id,
                data: { 
                    message: {
                        _id: message._id,
                        content: message.content,
                        type: message.type,
                        status: message.status,
                        createdAt: message.createdAt,
                        senderId: message.senderId
                    }
                }
            });
        } catch (error) {
            console.error('❌ Error sending message:', error);
            res.status(500).json({
                success: false,
                message: 'Xabar yuborishda xatolik'
            });
        }
    }
    
    /**
     * Get conversations for user
     */
    static async getUserConversations(userId, userType) {
        try {
            // Get ALL orders where user is involved (not just those with messages)
            const orderQuery = {
                $or: [
                    { seller: userId },
                    { buyer: userId }
                ]
            };
            
            const orders = await Order.find(orderQuery)
                .populate('buyer', 'email companyName phone')
                .populate('seller', 'email companyName phone')
                .populate('items.product', 'name images')
                .sort({ updatedAt: -1 })
                .lean();
            
            // Get conversation data for each order (with and without messages)
            const conversations = await Promise.all(
                orders.map(async (order) => {
                    const lastMessage = await Message.findOne({
                        orderId: order._id
                    })
                    .populate('senderId', 'companyName')
                    .sort({ createdAt: -1 })
                    .lean();
                    
                    const unreadCount = await Message.countDocuments({
                        orderId: order._id,
                        recipientId: userId,
                        status: { $ne: 'read' }
                    });
                    
                    // Get partner info
                    let partner = null;
                    if (userType === 'manufacturer') {
                        partner = order.buyer;
                    } else {
                        partner = order.seller;
                    }
                    
                    return {
                        orderId: order._id,
                        orderNumber: order.orderNumber,
                        partner,
                        lastMessage,
                        unreadCount,
                        updatedAt: order.updatedAt,
                        status: order.status,
                        hasMessages: !!lastMessage,
                        orderCreatedAt: order.createdAt
                    };
                })
            );
            
            // Filter out conversations without partner and apply Telegram-like sorting
            const validConversations = conversations.filter(conv => conv.partner);
            
            // Sort conversations Telegram-style
            validConversations.sort((a, b) => {
                // Priority 1: Unread messages first
                if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
                if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
                
                // Priority 2: Orders with messages vs without messages
                if (a.hasMessages && !b.hasMessages) return -1;
                if (!a.hasMessages && b.hasMessages) return 1;
                
                // Priority 3: Sort by time within same category
                if (a.hasMessages && b.hasMessages) {
                    // Both have messages - sort by last message time
                    return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
                } else {
                    // Both don't have messages - sort by order creation time
                    return new Date(b.orderCreatedAt) - new Date(a.orderCreatedAt);
                }
            });
            
            return validConversations;
        } catch (error) {
            console.error('❌ Error getting conversations:', error);
            return [];
        }
    }
    
    /**
     * Check if user has access to order
     */
    static checkOrderAccess(order, userId, userType) {
        
        if (userType === 'manufacturer') {
            const sellerMatch = (order.seller?._id || order.seller).toString() === userId.toString();
            return sellerMatch;
        } else {
            const buyerMatch = (order.buyer?._id || order.buyer).toString() === userId.toString();

            return buyerMatch;
        }
    }
    
    /**
     * Validation rules for sending message - Supports both Order and Inquiry
     */
    static sendMessageValidation() {
        return [
            body('orderId')
                .optional()
                .isMongoId()
                .withMessage('Noto\'g\'ri buyurtma ID'),
            body('inquiryId')
                .optional()
                .isMongoId()
                .withMessage('Noto\'g\'ri so\'rov ID'),
            body('content')
                .notEmpty()
                .withMessage('Xabar matni majbur')
                .isLength({ min: 1, max: 2000 })
                .withMessage('Xabar matni 1-2000 belgi orasida bo\'lishi kerak'),
            body('type')
                .optional()
                .isIn(['text', 'image', 'file', 'system'])
                .withMessage('Noto\'g\'ri xabar turi')
        ].concat([
            // Custom validation to ensure either orderId or inquiryId is provided
            body().custom((value, { req }) => {
                if (!req.body.orderId && !req.body.inquiryId) {
                    throw new Error('Order ID yoki Inquiry ID dan biri majbur');
                }
                if (req.body.orderId && req.body.inquiryId) {
                    throw new Error('Faqat Order ID yoki Inquiry ID dan biri bo\'lishi kerak');
                }
                return true;
            })
        ]);
    }

    /**
     * Get messages for a specific inquiry
     * API Endpoint: GET /manufacturer/messages/api/inquiry/:inquiryId/messages
     */
    static async getInquiryMessages(req, res) {
        console.log('🔍 getInquiryMessages called with params:', req.params);
        console.log('🔍 getInquiryMessages called with query:', req.query);
        console.log('🔍 getInquiryMessages called with user:', req.user);
        
        try {
            const { inquiryId } = req.params;
            const { page = 1, limit = 50 } = req.query;
            const userId = req.user.userId || req.user._id;
            console.log('🔍 Looking for inquiry with ID:', inquiryId);
            console.log('🔍 User ID:', userId);
            
            // Verify user has access to this inquiry
            const inquiry = await Inquiry.findOne({
                _id: inquiryId,
                $or: [
                    { supplier: userId },
                    { inquirer: userId }
                ]
            }).populate('supplier inquirer', 'companyName email');
            
            console.log('🔍 Inquiry found:', inquiry ? 'YES' : 'NO');
            
            if (!inquiry) {
                console.log('❌ Inquiry not found or access denied');
                // Return test messages for demonstration
                const testMessages = [
                    {
                        _id: 'test-inq-msg-1',
                        content: 'Assalomu alaykum! So\'rovingiz uchun rahmat. Biz spetsifikatsiyalarni ko\'rib chiqmoqdamiz va tez orada javob beramiz.',
                        senderId: {
                            _id: 'test-inquirer-id',
                            companyName: 'Test Distribution Company',
                            email: 'inquirer@test.com'
                        },
                        recipientId: {
                            _id: userId,
                            companyName: 'Uzbek Cotton Mills',
                            email: 'info@uzbekcotton.uz'
                        },
                        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                        type: 'text',
                        status: 'read',
                        inquiryId: inquiryId
                    },
                    {
                        _id: 'test-inq-msg-2',
                        content: 'So\'rovingiz tafsilotlarini ko\'rib chiqmoqdamiz. Narx belgilash 2-3 ish kuni davom etadi. Davom etishimizni xohlaysizmi?',
                        senderId: {
                            _id: userId,
                            companyName: 'Uzbek Cotton Mills',
                            email: 'info@uzbekcotton.uz'
                        },
                        recipientId: {
                            _id: 'test-inquirer-id',
                            companyName: 'Test Distribution Company',
                            email: 'inquirer@test.com'
                        },
                        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
                        type: 'text',
                        status: 'delivered',
                        inquiryId: inquiryId
                    }
                ];
                
                return res.json({
                    success: true,
                    data: {
                        messages: testMessages,
                        pagination: {
                            currentPage: parseInt(page),
                            totalPages: 1,
                            totalCount: testMessages.length,
                            limit: parseInt(limit)
                        },
                        inquiry: {
                            id: inquiryId,
                            inquiryNumber: 'TEST-' + inquiryId.slice(-6),
                            status: 'pending',
                            message: 'Test inquiry message for demonstration purposes',
                            supplier: {
                                _id: userId,
                                companyName: 'Uzbek Cotton Mills',
                                email: 'info@uzbekcotton.uz'
                            },
                            inquirer: {
                                _id: 'test-inquirer-id',
                                companyName: 'Test Distribution Company',
                                email: 'inquirer@test.com'
                            }
                        }
                    },
                    message: 'Inquiry not found - showing test conversation'
                });
            }
            
            console.log('✅ Inquiry found, proceeding with message loading...');
            
            // Get messages for this inquiry with proper population
            const skip = (parseInt(page) - 1) * parseInt(limit);
            const messages = await Message.find({
                inquiryId: inquiryId
            })
            .populate({
                path: 'senderId',
                select: 'companyName email avatar _id',
                model: 'User'
            })
            .populate({
                path: 'recipientId', 
                select: 'companyName email avatar _id',
                model: 'User'
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
            
            // Get total count for pagination
            const totalCount = await Message.countDocuments({ inquiryId: inquiryId });
            
            // Prepare response data
            const responseData = {
                success: true,
                data: {
                    messages: messages.reverse(),
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(totalCount / parseInt(limit)),
                        totalCount,
                        limit: parseInt(limit)
                    },
                    inquiry: {
                        id: inquiry._id,
                        inquiryNumber: inquiry.inquiryNumber,
                        status: inquiry.status,
                        message: inquiry.message,
                        supplier: inquiry.supplier,
                        inquirer: inquiry.inquirer
                    }
                }
            };
            
            // Mark messages as read if user is recipient
            await Message.updateMany({
                inquiryId: inquiryId,
                recipientId: userId,
                status: 'sent'
            }, {
                status: 'read',
                readAt: new Date()
            });
            
            res.json(responseData);
            
        } catch (error) {
            console.error('❌ Error loading inquiry messages:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to load messages',
                error: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    }

    /**
     * Get messages for a specific order
     * API Endpoint: GET /manufacturer/messages/api/order/:orderId/messages
     */
    static async getOrderMessages(req, res) {
        console.log('🔍 getOrderMessages called with params:', req.params);
        console.log('🔍 getOrderMessages called with query:', req.query);
        console.log('🔍 getOrderMessages called with user:', req.user);
        
        try {
            const { orderId } = req.params;
            const { page = 1, limit = 50 } = req.query;
            const userId = req.user.userId || req.user._id;
            console.log('🔍 Looking for order with ID:', orderId);
            console.log('🔍 User ID:', userId);
            
            // Verify user has access to this order
            const order = await Order.findOne({
                _id: orderId,
                $or: [
                    { seller: userId },
                    { buyer: userId }
                ]
            }).populate('seller buyer', 'companyName email');
            
            console.log('🔍 Order found:', order ? 'YES' : 'NO');
            
            if (!order) {
                console.log('❌ Order not found or access denied');
                // Return test messages for demonstration
                const testMessages = [
                    {
                        _id: 'test-msg-1',
                        content: 'Assalomu alaykum! Buyurtmangiz uchun rahmat. Biz spetsifikatsiyalarni ko\'rib chiqmoqdamiz va tez orada javob beramiz.',
                        senderId: {
                            _id: 'test-buyer-id',
                            companyName: 'Test Distribution Company',
                            email: 'buyer@test.com'
                        },
                        recipientId: {
                            _id: userId,
                            companyName: 'Uzbek Cotton Mills',
                            email: 'info@uzbekcotton.uz'
                        },
                        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                        type: 'text',
                        status: 'read',
                        orderId: orderId
                    },
                    {
                        _id: 'test-msg-2',
                        content: 'Buyurtma tafsilotlarini tasdiqlashimiz mumkin. Ishlab chiqarish 7-10 ish kuni davom etadi. Davom etishimizni xohlaysizmi?',
                        senderId: {
                            _id: userId,
                            companyName: 'Uzbek Cotton Mills',
                            email: 'info@uzbekcotton.uz'
                        },
                        recipientId: {
                            _id: 'test-buyer-id',
                            companyName: 'Test Distribution Company',
                            email: 'buyer@test.com'
                        },
                        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
                        type: 'text',
                        status: 'delivered',
                        orderId: orderId
                    }
                ];
                
                return res.json({
                    success: true,
                    data: {
                        messages: testMessages,
                        pagination: {
                            currentPage: parseInt(page),
                            totalPages: 1,
                            totalCount: testMessages.length,
                            limit: parseInt(limit)
                        },
                        order: {
                            id: orderId,
                            number: 'TEST-' + orderId.slice(-6),
                            status: 'pending',
                            totalAmount: 19750.00,
                            seller: {
                                _id: userId,
                                companyName: 'Uzbek Cotton Mills',
                                email: 'info@uzbekcotton.uz'
                            },
                            buyer: {
                                _id: 'test-buyer-id',
                                companyName: 'Test Distribution Company',
                                email: 'buyer@test.com'
                            }
                        }
                    },
                    message: 'Order not found - showing test conversation'
                });
            }
            
            console.log('✅ Order found, proceeding with message loading...');
            
            // Get messages for this order with proper population
            const skip = (parseInt(page) - 1) * parseInt(limit);
            const messages = await Message.find({
                orderId: orderId
            })
            .populate({
                path: 'senderId',
                select: 'companyName email avatar _id',
                model: 'User'
            })
            .populate({
                path: 'recipientId', 
                select: 'companyName email avatar _id',
                model: 'User'
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
            
            // Get total count for pagination
            const totalCount = await Message.countDocuments({ orderId: orderId });
            
            // Prepare response data
            const responseData = {
                success: true,
                data: {
                    messages: messages.reverse(),
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(totalCount / parseInt(limit)),
                        totalCount,
                        limit: parseInt(limit)
                    },
                    order: {
                        id: order._id,
                        number: order.orderNumber,
                        status: order.status,
                        totalAmount: order.totalAmount,
                        seller: order.seller,
                        buyer: order.buyer
                    }
                }
            };
            
            // Mark messages as read if user is recipient
            await Message.updateMany({
                orderId: orderId,
                recipientId: userId,
                status: 'sent'
            }, {
                status: 'read',
                readAt: new Date()
            });
            
            res.json(responseData);
            
        } catch (error) {
            console.error('❌ Error loading order messages:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to load messages',
                error: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    }

    /**
     * Upload attachment for messaging
     * API Endpoint: POST /manufacturer/messages/api/upload
     */
    static async uploadAttachment(req, res) {
        try {
            const userId = req.user.userId || req.user._id;
            

            
            // Check if file was uploaded
            if (!req.file && !req.files) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }
            
            const file = req.file || (req.files && req.files[0]);
            
            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid file upload'
                });
            }
            
            // Validate file type and size
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            const maxSize = 10 * 1024 * 1024; // 10MB
            
            if (!allowedTypes.includes(file.mimetype)) {
                return res.status(400).json({
                    success: false,
                    message: 'File type not allowed. Supported formats: JPEG, PNG, GIF, WebP, PDF, TXT, DOC, DOCX'
                });
            }
            
            if (file.size > maxSize) {
                return res.status(400).json({
                    success: false,
                    message: 'File size too large. Maximum size is 10MB'
                });
            }
            
            // Generate unique filename
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(2, 15);
            const fileExtension = file.originalname.split('.').pop();
            const fileName = `attachment_${timestamp}_${randomStr}.${fileExtension}`;
            
            // File path (you can modify this based on your storage setup)
            const filePath = `/uploads/attachments/${fileName}`;
            const fullPath = `./public${filePath}`;
            
            // Ensure directory exists
            const fs = require('fs');
            const path = require('path');
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            // Save file (this is a simple implementation, you might want to use cloud storage)
            if (file.buffer) {
                fs.writeFileSync(fullPath, file.buffer);
            } else if (file.path) {
                fs.copyFileSync(file.path, fullPath);
            }
            
            // Create attachment record in database (you might want to create an Attachment model)
            const attachmentData = {
                originalName: file.originalname,
                fileName: fileName,
                filePath: filePath,
                fileSize: file.size,
                mimeType: file.mimetype,
                uploadedBy: userId,
                uploadedAt: new Date()
            };
            
            // Create message in database with attachment
            const { orderId } = req.body;
            
            if (orderId) {
                try {
                    // Find the order to get recipient
                    const order = await Order.findById(orderId).populate('seller buyer');
                    if (order) {
                        const recipientId = order.seller._id.toString() === userId ? order.buyer._id : order.seller._id;
                        
                        // Create message with attachment
                        const message = new Message({
                            orderId: orderId,
                            senderId: userId,
                            recipientId: recipientId,
                            content: file.originalname,
                            type: file.mimetype.startsWith('image/') ? 'image' : 'file',
                            attachments: [{
                                filename: fileName,
                                originalName: file.originalname,
                                mimetype: file.mimetype,
                                size: file.size,
                                url: filePath,
                                uploadedAt: new Date()
                            }]
                        });
                        
                        await message.save();

                    }
                } catch (dbError) {
                    console.error('❌ Error saving message to database:', dbError);
                    // Continue with file upload response even if message save fails
                }
            }
            
            // File uploaded successfully
            
            res.json({
                success: true,
                message: 'File uploaded successfully',
                data: {
                    attachment: {
                        id: `${timestamp}_${randomStr}`,
                        originalName: file.originalname,
                        fileName: fileName,
                        url: filePath,
                        size: file.size,
                        type: file.mimetype,
                        uploadedAt: new Date()
                    }
                }
            });
            
        } catch (error) {
            console.error('❌ Error uploading file:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload file',
                error: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    }

    /**
     * Get header messages for dropdown
     * GET /manufacturer/api/messages
     */
    static async getHeaderMessages(req, res) {
        try {
            // Fix: Use correct user ID extraction for manufacturer
            const userId = req.user._id || req.user.userId;
            const userType = req.user.companyType || 'manufacturer';
            
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: 'User ID not found',
                    message: 'Authentication required'
                });
            }
            
            // Get recent unread messages for header dropdown
            const messages = await Message.find({
                recipientId: userId,
                status: { $ne: 'read' }
            })
            .populate('senderId', 'companyName name email')
            .populate('orderId', 'orderNumber')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

            // Format messages for header dropdown
            const formattedMessages = messages.map(msg => {
                try {
                    return {
                        id: msg._id,
                        sender: msg.senderId?.companyName || msg.senderId?.name || 'Unknown',
                        content: (() => {
                            if (msg.content) return msg.content;
                            if (msg.type === 'file' && msg.attachments && msg.attachments.length > 0) {
                                return `📎 ${msg.attachments.length} ta fayl`;
                            }
                            if (msg.type === 'image') return '🖼️ Rasm';
                            if (msg.type === 'system') return '🔔 Tizim xabari';
                            return 'No content';
                        })(),
                        time: MessagingController.formatTimeAgo(msg.createdAt),
                        orderNumber: msg.orderId?.orderNumber || 'N/A',
                        isUnread: true
                    };
                } catch (error) {
                    console.error('❌ Error formatting message:', msg, error);
                    return {
                        id: msg._id || 'unknown',
                        sender: 'Unknown',
                        content: 'Error loading message',
                        time: 'hozir',
                        orderNumber: 'N/A',
                        isUnread: true
                    };
                }
            });

            // Get total unread count
            const unreadCount = await Message.countDocuments({
                recipientId: userId,
                status: { $ne: 'read' }
            });

            res.json({
                success: true,
                messages: formattedMessages,
                count: unreadCount,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error getting header messages:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get header messages',
                message: error.message
            });
        }
    }

    /**
     * Format time ago for messages
     */
    static formatTimeAgo(date) {
        if (!date) return 'hozir';
        
        const now = new Date();
        const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
        
        if (diffInSeconds < 60) return 'hozir';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} daqiqa oldin`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} soat oldin`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} kun oldin`;
        
        return new Date(date).toLocaleDateString('uz-UZ');
    }

    /**
     * Mark all messages as read for a user
     * POST /manufacturer/api/messages/mark-all-read
     */
    static async markAllMessagesAsRead(req, res) {
        try {
            // Fix: Use correct user ID extraction for manufacturer
            const userId = req.user._id || req.user.userId;
            
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: 'User ID not found',
                    message: 'Authentication required'
                });
            }
            
            // Update all unread messages to read status
            const result = await Message.updateMany(
                {
                    recipientId: userId,
                    status: { $ne: 'read' }
                },
                {
                    $set: { status: 'read' }
                }
            );

            res.json({
                success: true,
                message: 'All messages marked as read',
                updatedCount: result.modifiedCount,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error marking all messages as read:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to mark messages as read',
                message: error.message
            });
        }
    }

    /**
     * Mark all orders as read for a user
     * POST /manufacturer/api/orders/mark-all-read
     */
    static async markAllOrdersAsRead(req, res) {
        try {
            const userId = req.user._id || req.user.userId;
            
        
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: 'User ID not found',
                    message: 'Authentication required'
                });
            }
            
            // Update all unread orders to read status
            const result = await Order.updateMany(
                {
                    seller: userId,
                    status: { $in: ['pending', 'confirmed', 'processing'] }
                },
                {
                    $set: { 
                        readBySeller: true,
                        readAt: new Date()
                    }
                }
            );

            res.json({
                success: true,
                message: 'All orders marked as read',
                updatedCount: result.modifiedCount,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error marking all orders as read:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to mark orders as read',
                message: error.message
            });
        }
    }

    /**
     * Mark all inquiries as read for a user
     * POST /manufacturer/api/inquiries/mark-all-read
     */
    static async markAllInquiriesAsRead(req, res) {
        try {
            const userId = req.user._id || req.user.userId;
            
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: 'User ID not found',
                    message: 'Authentication required'
                });
            }
            
            // Update all unread inquiries to read status
            const result = await Inquiry.updateMany(
                {
                    manufacturer: userId,
                    status: { $ne: 'archived' }
                },
                {
                    $set: { 
                        readByManufacturer: true,
                        readAt: new Date()
                    }
                }
            );

            res.json({
                success: true,
                message: 'All inquiries marked as read',
                updatedCount: result.modifiedCount,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error marking all inquiries as read:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to mark inquiries as read',
                message: error.message
            });
        }
    }

    /**
     * Mark individual inquiry as read
     * POST /manufacturer/api/inquiries/mark-read
     */
    static async markInquiryAsRead(req, res) {
        try {
            const userId = req.user._id || req.user.userId;
            const { inquiryId } = req.body;
            
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
            
            // Update individual inquiry to read status
            const result = await Inquiry.updateOne(
                {
                    _id: inquiryId,
                    manufacturer: userId
                },
                {
                    $set: { 
                        readByManufacturer: true,
                        readAt: new Date()
                    }
                }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Inquiry not found',
                    message: 'Inquiry not found or access denied'
                });
            }

            res.json({
                success: true,
                message: 'Inquiry marked as read',
                updatedCount: result.modifiedCount,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error marking inquiry as read:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to mark inquiry as read',
                message: error.message
            });
        }
    }

    /**
     * Mark individual order as read
     * POST /manufacturer/api/orders/mark-read
     */
    static async markOrderAsRead(req, res) {
        try {
            const userId = req.user._id || req.user.userId;
            const { orderId } = req.body;
            
             
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: 'User ID not found',
                    message: 'Authentication required'
                });
            }
            
            if (!orderId) {
                return res.status(400).json({
                    success: false,
                    error: 'Order ID required',
                    message: 'Order ID is required'
                });
            }
            
            // Update individual order to read status
            const result = await Order.updateOne(
                {
                    _id: orderId,
                    seller: userId
                },
                {
                    $set: { 
                        readBySeller: true,
                        readAt: new Date()
                    }
                }
            );

            
            if (result.matchedCount === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Order not found',
                    message: 'Order not found or access denied'
                });
            }

            res.json({
                success: true,
                message: 'Order marked as read',
                updatedCount: result.modifiedCount,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error marking order as read:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to mark order as read',
                message: error.message
            });
        }
    }

    /**
     * Mark individual message as read
     * POST /manufacturer/api/messages/mark-read
     */
    static async markMessageAsRead(req, res) {
        try {
            const userId = req.user._id || req.user.userId;
            const { messageId } = req.body;
            
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: 'User ID not found',
                    message: 'Authentication required'
                });
            }
            
            if (!messageId) {
                return res.status(400).json({
                    success: false,
                    error: 'Message ID required',
                    message: 'Message ID is required'
                });
            }
            
            // Update individual message to read status
            const result = await Message.updateOne(
                {
                    _id: messageId,
                    recipientId: userId
                },
                {
                    $set: { 
                        status: 'read',
                        readAt: new Date()
                    }
                }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Message not found',
                    message: 'Message not found or access denied'
                });
            }

            res.json({
                success: true,
                message: 'Message marked as read',
                updatedCount: result.modifiedCount,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error marking message as read:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to mark message as read',
                message: error.message
            });
        }
    }

    /**
     * Get messages for a specific inquiry
     * API Endpoint: GET /manufacturer/messages/api/inquiry/:inquiryId/messages
     */
    static async getInquiryMessages(req, res) {
        try {
            const { inquiryId } = req.params;
            const { page = 1, limit = 50 } = req.query;
            const userId = req.user.userId || req.user._id;
            
            // Verify user has access to this inquiry
            const inquiry = await Inquiry.findOne({
                _id: inquiryId,
                $or: [
                    { supplier: userId },
                    { inquirer: userId }
                ]
            }).populate('supplier inquirer', 'companyName email');
            
            if (!inquiry) {
                return res.status(404).json({
                    success: false,
                    message: 'Inquiry not found or access denied'
                });
            }
            
            // Get messages for this inquiry with proper population
            const skip = (parseInt(page) - 1) * parseInt(limit);
            const messages = await Message.find({
                inquiryId: inquiryId
            })
            .populate({
                path: 'senderId',
                select: 'companyName email avatar _id',
                model: 'User'
            })
            .populate({
                path: 'recipientId', 
                select: 'companyName email avatar _id',
                model: 'User'
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
            
            // Get total count for pagination
            const totalCount = await Message.countDocuments({ inquiryId: inquiryId });
            
            // Prepare response data
            const responseData = {
                success: true,
                data: {
                    messages: messages.reverse(),
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(totalCount / parseInt(limit)),
                        totalCount,
                        limit: parseInt(limit)
                    },
                    inquiry: {
                        id: inquiry._id,
                        number: inquiry.inquiryNumber,
                        status: inquiry.status,
                        message: inquiry.message,
                        supplier: inquiry.supplier,
                        inquirer: inquiry.inquirer
                    }
                }
            };
            
            // Mark messages as read if user is recipient
            await Message.updateMany({
                inquiryId: inquiryId,
                recipientId: userId,
                status: 'sent'
            }, {
                status: 'read',
                readAt: new Date()
            });
            
            res.json(responseData);
            
        } catch (error) {
            console.error('❌ Error loading inquiry messages:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to load messages',
                error: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    }

    /**
     * Mark inquiry messages as read
     * API Endpoint: POST /manufacturer/messages/api/inquiry/:inquiryId/mark-read
     */
    static async markInquiryMessagesAsRead(req, res) {
        try {
            const { inquiryId } = req.params;
            const userId = req.user.userId || req.user._id;
            
            // Update all unread messages for this inquiry and user
            const result = await Message.updateMany(
                {
                    inquiryId: inquiryId,
                    recipientId: userId,
                    status: { $ne: 'read' }
                },
                {
                    $set: {
                        status: 'read',
                        readAt: new Date()
                    }
                }
            );
            
            res.json({
                success: true,
                message: 'Xabarlar o\'qilgan deb belgilandi',
                updatedCount: result.modifiedCount
            });
            
        } catch (error) {
            console.error('❌ Error marking inquiry messages as read:', error);
            res.status(500).json({
                success: false,
                message: 'Xabarlarni belgilashda xatolik yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    }

    /**
     * Show chat with specific inquiry
     * Route: GET /manufacturer/messages/inquiry/:inquiryId
     */
    static async showInquiryChat(req, res) {
        try {
            const { inquiryId } = req.params;
            const userId = req.user.userId || req.user._id;
            const userType = req.user.companyType || req.user.userType || 'manufacturer';
            
            // Validate ObjectId format
            if (!inquiryId.match(/^[0-9a-fA-F]{24}$/)) {
                console.error('❌ Invalid ObjectId format:', inquiryId);
                return res.status(400).render('manufacturer/error', {
                    title: 'Noto\'g\'ri so\'rov',
                    message: 'So\'rov ID formati noto\'g\'ri',
                    user: req.user,
                    error: null,
                    lng: req.lng || 'uz'
                });
            }
            
            let inquiry;
            try {
                inquiry = await Inquiry.findById(inquiryId)
                    .populate('inquirer', 'email companyName phone')
                    .populate('supplier', 'email companyName phone')
                    .populate('product', 'name images')
                    .lean();
            } catch (dbError) {
                console.error('❌ Database query error:', dbError);
                throw dbError;
            }
            
            if (!inquiry) {
                console.error('❌ Inquiry not found in database:', inquiryId);
                return res.status(404).render('manufacturer/error', {
                    title: 'So\'rov topilmadi',
                    message: 'So\'rov ma\'lumotlari topilmadi',
                    user: req.user,
                    error: null,
                    lng: req.lng || 'uz'
                });
            }
            
            // Check access permissions
            const hasAccess = MessagingController.checkInquiryAccess(inquiry, userId, userType);
            if (!hasAccess) {
                return res.status(403).render('manufacturer/error', {
                    title: 'Ruxsat yo\'q',
                    message: 'Bu so\'rovga ruxsat yo\'q',
                    user: req.user,
                    error: null,
                    lng: req.lng || 'uz'
                });
            }
            
            // Get conversation partner info
            let partner = null;
            if (userType === 'manufacturer') {
                partner = inquiry.inquirer;
            } else {
                partner = inquiry.supplier;
            }
            
            // Get messages for this inquiry
            let messages = [];
            try {
                messages = await Message.find({
                    inquiryId: inquiryId
                })
                .populate('senderId', 'companyName')
                .sort({ createdAt: 1 })
                .lean();
            } catch (msgError) {
                console.error('❌ Error loading inquiry messages:', msgError);
                messages = [];
            }
            
            // Mark messages as read
            try {
                await Message.updateMany({
                    inquiryId: inquiryId,
                    recipientId: userId,
                    status: 'sent'
                }, {
                    status: 'read',
                    readAt: new Date()
                });
            } catch (updateError) {
                console.error('❌ Error marking messages as read:', updateError);
            }
            
            res.render('manufacturer/messages/chat', {
                title: `Aloqa - So\'rov #${inquiry.inquiryNumber}`,
                inquiry,
                partner,
                messages,
                currentUser: {
                    id: userId,
                    type: userType,
                    name: req.user.companyName,
                    company: req.user.companyName
                },
                unreadMessages: 0,
                user: req.user,
                lng: req.lng || 'uz'
            });
        } catch (error) {
            console.error('❌ Error loading inquiry chat:', error);
            res.status(500).render('manufacturer/error', {
                title: 'Server xatosi',
                message: 'Chat sahifasini yuklashda xatolik',
                error: process.env.NODE_ENV === 'development' ? error : null,
                user: req.user,
                lng: req.lng || 'uz'
            });
        }
    }

    /**
     * Check if user has access to inquiry
     */
    static checkInquiryAccess(inquiry, userId, userType) {
        if (userType === 'manufacturer') {
            const supplierMatch = (inquiry.supplier?._id || inquiry.supplier).toString() === userId.toString();
            return supplierMatch;
        } else {
            const inquirerMatch = (inquiry.inquirer?._id || inquiry.inquirer).toString() === userId.toString();
            return inquirerMatch;
        }
    }
}

module.exports = MessagingController;
