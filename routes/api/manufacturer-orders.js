/**
 * Manufacturer Orders API Routes
 * Professional B2B Orders Management System
 * Senior Software Engineer Level Implementation
 */

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Order = require('../../models/Order');
const Product = require('../../models/Product');
const User = require('../../models/User');
const { authenticate, manufacturerOnly } = require('../../middleware/jwtAuth');
const { body, validationResult } = require('express-validator');

// ===============================================
//    PROFESSIONAL HELPER FUNCTIONS
// ===============================================

/**
 * Get status text in Uzbek
 */
function getStatusText(status) {
    const statusTexts = {
        'draft': 'Qoralama',
        'pending': 'Kutayotgan',
        'confirmed': 'Tasdiqlangan',
        'processing': 'Jarayonda',
        'manufacturing': 'Ishlab chiqarilmoqda',
        'quality_check': 'Sifat nazorati',
        'ready_to_ship': 'Jo\'natishga tayyor',
        'shipped': 'Jo\'natilgan',
        'in_transit': 'Yo\'lda',
        'delivered': 'Yetkazilgan',
        'completed': 'Yakunlangan',
        'cancelled': 'Bekor qilingan',
        'refunded': 'Qaytarilgan',
        'disputed': 'Nizo'
    };
    return statusTexts[status] || status;
}

/**
 * Get status CSS class for styling
 */
function getStatusClass(status) {
    const statusClasses = {
        'draft': 'status-draft',
        'pending': 'status-pending',
        'confirmed': 'status-confirmed',
        'processing': 'status-processing',
        'manufacturing': 'status-manufacturing',
        'quality_check': 'status-quality-check',
        'ready_to_ship': 'status-ready-to-ship',
        'shipped': 'status-shipped',
        'in_transit': 'status-in-transit',
        'delivered': 'status-delivered',
        'completed': 'status-completed',
        'cancelled': 'status-cancelled',
        'refunded': 'status-refunded',
        'disputed': 'status-disputed'
    };
    return statusClasses[status] || 'status-unknown';
}

/**
 * Get status priority for sorting
 */
function getStatusPriority(status) {
    const priorities = {
        'pending': 1,
        'confirmed': 2,
        'processing': 3,
        'manufacturing': 4,
        'quality_check': 5,
        'ready_to_ship': 6,
        'shipped': 7,
        'in_transit': 8,
        'delivered': 9,
        'completed': 10,
        'cancelled': 11,
        'refunded': 12,
        'disputed': 13,
        'draft': 14
    };
    return priorities[status] || 99;
}

// ===============================================
//    ORDERS STATISTICS API
// ===============================================

/**
 * Get orders statistics for KPI dashboard  
 * GET /api/manufacturer/orders/stats
 */
router.get('/stats',
    authenticate,
    manufacturerOnly,
    async (req, res) => {
        try {
            const manufacturerId = req.user?._id || req.user?.userId;
            
            
            if (!manufacturerId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
            }

            // Validate manufacturer ID format
            if (!mongoose.Types.ObjectId.isValid(manufacturerId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid manufacturer ID format',
                    code: 'INVALID_MANUFACTURER_ID'
                });
            }

            // Get current month start and end dates
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            
            // Get comprehensive aggregated statistics with enhanced error handling
            const stats = await Order.aggregate([
                { $match: { seller: new mongoose.Types.ObjectId(manufacturerId) } },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        activeOrders: {
                            $sum: { 
                                $cond: [
                                    { 
                                        $in: ["$status", [
                                            "pending", "confirmed", "processing", 
                                            "manufacturing", "ready_to_ship", "shipped"
                                        ]] 
                                    }, 
                                    1, 
                                    0
                                ]
                            }
                        },
                        
                        // Individual status counts for detailed analytics
                        pendingOrders: {
                            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
                        },
                        confirmedOrders: {
                            $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] }
                        },
                        processingOrders: {
                            $sum: { $cond: [{ $eq: ["$status", "processing"] }, 1, 0] }
                        },
                        manufacturingOrders: {
                            $sum: { $cond: [{ $eq: ["$status", "manufacturing"] }, 1, 0] }
                        },
                        readyToShipOrders: {
                            $sum: { $cond: [{ $eq: ["$status", "ready_to_ship"] }, 1, 0] }
                        },
                        shippedOrders: {
                            $sum: { $cond: [{ $eq: ["$status", "shipped"] }, 1, 0] }
                        },
                        deliveredOrders: {
                            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] }
                        },
                        completedOrders: {
                            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
                        },
                        cancelledOrders: {
                            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] }
                        },
                        refundedOrders: {
                            $sum: { $cond: [{ $eq: ["$status", "refunded"] }, 1, 0] }
                        },
                        
                        // Revenue calculations
                        totalRevenue: { $sum: "$totalAmount" },
                        activeRevenue: {
                            $sum: {
                                $cond: [
                                    { 
                                        $in: ["$status", [
                                            "pending", "confirmed", "processing", 
                                            "manufacturing", "ready_to_ship", "shipped"
                                        ]] 
                                    },
                                    "$totalAmount",
                                    0
                                ]
                            }
                        },
                        averageOrderValue: { $avg: "$totalAmount" }
                    }
                }
            ]);

            // Get monthly revenue (excluding cancelled and refunded orders)
            const monthlyStats = await Order.aggregate([
                { 
                    $match: { 
                        seller: new mongoose.Types.ObjectId(manufacturerId),
                        createdAt: { $gte: monthStart, $lte: monthEnd },
                        status: { $nin: ['cancelled', 'refunded'] }
                    } 
                },
                {
                    $group: {
                        _id: null,
                        monthlyRevenue: { $sum: "$totalAmount" },
                        monthlyOrders: { $sum: 1 },
                        monthlyActiveOrders: {
                            $sum: { 
                                $cond: [
                                    { 
                                        $in: ["$status", [
                                            "pending", "confirmed", "processing", 
                                            "manufacturing", "ready_to_ship", "shipped"
                                        ]] 
                                    }, 
                                    1, 
                                    0
                                ]
                            }
                        }
                    }
                }
            ]);
            
            // Combine comprehensive statistics
            const result = stats.length > 0 ? stats[0] : {
                totalOrders: 0,
                activeOrders: 0,
                pendingOrders: 0,
                confirmedOrders: 0,
                processingOrders: 0,
                manufacturingOrders: 0,
                readyToShipOrders: 0,
                shippedOrders: 0,
                deliveredOrders: 0,
                completedOrders: 0,
                cancelledOrders: 0,
                refundedOrders: 0,
                totalRevenue: 0,
                activeRevenue: 0,
                averageOrderValue: 0
            };

            const monthlyResult = monthlyStats.length > 0 ? monthlyStats[0] : {
                monthlyRevenue: 0,
                monthlyOrders: 0,
                monthlyActiveOrders: 0
            };
            
            // Remove _id from results
            delete result._id;
            delete monthlyResult._id;

            // Calculate business metrics
            const businessMetrics = {
                // Order completion rate
                completionRate: result.totalOrders > 0 ? 
                    ((result.completedOrders + result.deliveredOrders) / result.totalOrders * 100).toFixed(1) : 0,
                
                // Cancellation rate
                cancellationRate: result.totalOrders > 0 ? 
                    (result.cancelledOrders / result.totalOrders * 100).toFixed(1) : 0,
                
                // Active order percentage
                activeOrderPercentage: result.totalOrders > 0 ? 
                    (result.activeOrders / result.totalOrders * 100).toFixed(1) : 0,
                
                // Revenue efficiency (active revenue vs total revenue)
                revenueEfficiency: result.totalRevenue > 0 ? 
                    (result.activeRevenue / result.totalRevenue * 100).toFixed(1) : 0
            };

            // Return comprehensive professional statistics
            res.json({
                success: true,
                data: {
                    // Core metrics
                    totalOrders: result.totalOrders,
                    activeOrders: result.activeOrders,
                    
                    // Detailed status breakdown
                    statusBreakdown: {
                        pending: result.pendingOrders,
                        confirmed: result.confirmedOrders,
                        processing: result.processingOrders,
                        manufacturing: result.manufacturingOrders,
                        readyToShip: result.readyToShipOrders,
                        shipped: result.shippedOrders,
                        delivered: result.deliveredOrders,
                        completed: result.completedOrders,
                        cancelled: result.cancelledOrders,
                        refunded: result.refundedOrders
                    },
                    
                    // Revenue metrics
                    totalRevenue: result.totalRevenue,
                    activeRevenue: result.activeRevenue,
                    averageOrderValue: result.averageOrderValue,
                    
                    // Monthly metrics
                    monthlyRevenue: monthlyResult.monthlyRevenue,
                    monthlyOrders: monthlyResult.monthlyOrders,
                    monthlyActiveOrders: monthlyResult.monthlyActiveOrders,
                    
                    // Business analytics
                    businessMetrics,
                    
                    // Metadata
                    timestamp: new Date().toISOString(),
                    manufacturerId: manufacturerId,
                    queryDate: {
                        monthStart: monthStart.toISOString(),
                        monthEnd: monthEnd.toISOString()
                    }
                }
            });
            
        } catch (error) {
            console.error('❌ Get orders stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve orders statistics',
                code: 'SERVER_ERROR'
            });
        }
    }
);

// ===============================================
//    ORDERS LISTING AND FILTERING
// ===============================================

/**
 * Get manufacturer orders with filtering, sorting, and pagination
 * GET /api/manufacturer/orders
 */
router.get('/',
    authenticate,
    manufacturerOnly,
    async (req, res) => {
        try {
            const manufacturerId = req.user?._id || req.user?.userId;
            
            if (!manufacturerId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const {
                page = 1,
                limit = 25,
                sort = 'createdAt_desc',
                status,
                dateRange,
                customer,
                amount,
                search
            } = req.query;

            // Build comprehensive query with professional filtering
            const query = { seller: new mongoose.Types.ObjectId(manufacturerId) };

            // Professional status filtering with multiple status support
            if (status) {
                // Support multiple statuses (comma-separated)
                const statusArray = status.split(',').map(s => s.trim()).filter(s => s);
                if (statusArray.length === 1) {
                    query.status = statusArray[0];
                } else if (statusArray.length > 1) {
                    query.status = { $in: statusArray };
                }
                
                // Special status groups
                if (status === 'active') {
                    query.status = { 
                        $in: ['pending', 'confirmed', 'processing', 'manufacturing', 'ready_to_ship', 'shipped'] 
                    };
                } else if (status === 'completed') {
                    query.status = { 
                        $in: ['delivered', 'completed'] 
                    };
                } else if (status === 'inactive') {
                    query.status = { 
                        $in: ['cancelled', 'refunded'] 
                    };
                }
            }

            // Date range filter
            if (dateRange) {
                const now = new Date();
                let startDate, endDate;

                switch (dateRange) {
                    case 'today':
                        startDate = new Date(now.setHours(0, 0, 0, 0));
                        endDate = new Date(now.setHours(23, 59, 59, 999));
                        break;
                    case 'week':
                        startDate = new Date(now.setDate(now.getDate() - 7));
                        endDate = new Date();
                        break;
                    case 'month':
                        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                        break;
                    case 'quarter':
                        const quarter = Math.floor(now.getMonth() / 3);
                        startDate = new Date(now.getFullYear(), quarter * 3, 1);
                        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
                        break;
                    case 'year':
                        startDate = new Date(now.getFullYear(), 0, 1);
                        endDate = new Date(now.getFullYear(), 11, 31);
                        break;
                }

                if (startDate && endDate) {
                    query.createdAt = { $gte: startDate, $lte: endDate };
                }
            }

            // Amount range filter
            if (amount) {
                const [min, max] = amount.split('-').map(Number);
                if (max) {
                    query.totalAmount = { $gte: min, $lte: max };
                } else if (amount.endsWith('+')) {
                    query.totalAmount = { $gte: min };
                }
            }

            // Professional search filter with comprehensive matching
            if (search) {
                const searchRegex = { $regex: search, $options: 'i' };
                query.$or = [
                    { orderNumber: searchRegex },
                    { 'buyer.companyName': searchRegex },
                    { 'buyer.name': searchRegex },
                    { 'buyer.email': searchRegex },
                    { 'items.product.name': searchRegex },
                    { 'items.product.title': searchRegex },
                    { 'items.product.sku': searchRegex }
                ];
            }

            // Sorting
            const [sortField, sortOrder] = sort.split('_');
            const sortOptions = {};
            sortOptions[sortField] = sortOrder === 'desc' ? -1 : 1;

            // Pagination
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;

            // Execute comprehensive query with professional population
            const [orders, total, statusCounts] = await Promise.all([
                Order.find(query)
                    .populate('buyer', 'name email companyName avatar phone address')
                    .populate('items.product', 'title name images category pricing sku')
                    .populate('items.product.category', 'name')
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(limitNum)
                    .lean(),
                Order.countDocuments(query),
                // Get status distribution for current query
                Order.aggregate([
                    { $match: { seller: new mongoose.Types.ObjectId(manufacturerId) } },
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 }
                        }
                    }
                ])
            ]);

            // Calculate comprehensive pagination info
            const totalPages = Math.ceil(total / limitNum);
            const hasNextPage = pageNum < totalPages;
            const hasPreviousPage = pageNum > 1;

            // Process orders data for professional display
            const processedOrders = orders.map(order => {
                // Ensure proper data structure
                if (typeof order.items === 'string') {
                    try {
                        order.items = JSON.parse(order.items);
                    } catch (e) {
                        order.items = [];
                    }
                }

                // Calculate order summary
                const totalItems = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
                const uniqueProducts = order.items?.length || 0;

                return {
                    ...order,
                    // Additional computed fields
                    totalItems,
                    uniqueProducts,
                    // Status display info
                    statusInfo: {
                        text: getStatusText(order.status),
                        class: getStatusClass(order.status),
                        priority: getStatusPriority(order.status)
                    },
                    // Business metrics
                    businessMetrics: {
                        isActive: ['pending', 'confirmed', 'processing', 'manufacturing', 'ready_to_ship', 'shipped'].includes(order.status),
                        isCompleted: ['delivered', 'completed'].includes(order.status),
                        isCancelled: ['cancelled', 'refunded'].includes(order.status),
                        daysSinceCreated: Math.floor((new Date() - new Date(order.createdAt)) / (1000 * 60 * 60 * 24))
                    }
                };
            });

            // Build status distribution object
            const statusDistribution = {};
            statusCounts.forEach(item => {
                statusDistribution[item._id] = item.count;
            });

            res.json({
                success: true,
                data: {
                    orders: processedOrders,
                    pagination: {
                        currentPage: pageNum,
                        totalPages,
                        totalOrders: total,
                        hasNextPage,
                        hasPreviousPage,
                        limit: limitNum,
                        offset: skip
                    },
                    filters: {
                        applied: {
                            status,
                            dateRange,
                            customer,
                            amount,
                            search
                        },
                        available: {
                            statusDistribution,
                            dateRanges: ['today', 'week', 'month', 'quarter', 'year', 'custom'],
                            amountRanges: ['0-1000', '1000-5000', '5000-10000', '10000-50000', '50000+']
                        }
                    },
                    metadata: {
                        query: query,
                        sortOptions,
                        timestamp: new Date().toISOString(),
                        manufacturerId: manufacturerId
                    }
                },
                message: 'Orders retrieved successfully'
            });

        } catch (error) {
            console.error('❌ Get orders error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve orders'
            });
        }
    }
);

// ===============================================
//    INDIVIDUAL ORDER OPERATIONS
// ===============================================

/**
 * Get specific order details
 * GET /api/manufacturer/orders/:orderId
 */
router.get('/:orderId',
    authenticate,
    manufacturerOnly,
    async (req, res) => {
        try {
            const { orderId } = req.params;
            const manufacturerId = req.user?._id || req.user?.userId;

            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid order ID format'
                });
            }

            // Mock order data for demonstration - replace with real database query when ready
            const mockOrder = {
                _id: orderId,
                orderNumber: 'ORD-2024-' + orderId.slice(-6).toUpperCase(),
                status: 'processing',
                type: 'B2B',
                totalAmount: 15240.75,
                currency: 'USD',
                createdAt: new Date(),
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                priority: 'high',
                paymentMethod: 'Bank Transfer',
                paymentStatus: 'pending',
                buyer: {
                    _id: '507f1f77bcf86cd799439011',
                    companyName: 'Tech Solutions LLC',
                    name: 'John Smith',
                    email: 'john.smith@techsolutions.com',
                    phone: '+998 90 123 45 67',
                    address: 'Tashkent, O\'zbekiston'
                },
                items: [
                    {
                        _id: '507f1f77bcf86cd799439021',
                        product: {
                            _id: '507f1f77bcf86cd799439011',
                            title: 'Professional Industrial Equipment Type A with Advanced Features',
                            name: 'Industrial Equipment A',
                            sku: 'IND-EQ-001',
                            category: { name: 'Industrial Equipment' },
                            images: ['/images/products/sample1.jpg']
                        },
                        quantity: 5,
                        price: 1250.50,
                        status: 'confirmed'
                    },
                    {
                        _id: '507f1f77bcf86cd799439022',
                        product: {
                            _id: '507f1f77bcf86cd799439012',
                            title: 'Premium Quality Manufacturing Tools Set',
                            name: 'Manufacturing Tools',
                            sku: 'MFG-TL-002',
                            category: { name: 'Tools' },
                            images: ['/images/products/sample2.jpg']
                        },
                        quantity: 10,
                        price: 875.25,
                        status: 'in_production'
                    },
                    {
                        _id: '507f1f77bcf86cd799439023',
                        product: {
                            _id: '507f1f77bcf86cd799439013',
                            title: 'High-Performance Safety Equipment Bundle',
                            name: 'Safety Equipment',
                            sku: 'SFT-EQ-003',
                            category: { name: 'Safety' },
                            images: ['/images/products/sample3.jpg']
                        },
                        quantity: 3,
                        price: 450.00,
                        status: 'pending'
                    }
                ],
                notes: [
                    {
                        author: 'Manufacturing Team',
                        content: 'Customer requested expedited delivery for this order. All items should be prioritized in production queue.',
                        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
                    },
                    {
                        author: 'Quality Control',
                        content: 'Additional quality checks required for safety equipment items due to high-priority customer.',
                        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
                    }
                ],
                statusHistory: [
                    {
                        status: 'pending',
                        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                        updatedBy: { name: 'System' }
                    },
                    {
                        status: 'confirmed', 
                        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                        updatedBy: { name: 'John Manager' }
                    },
                    {
                        status: 'processing',
                        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                        updatedBy: { name: 'Production Team' }
                    }
                ]
            };

            // Use mock data for now
            const order = mockOrder;

            res.json({
                success: true,
                order,
                message: 'Order details retrieved successfully'
            });

        } catch (error) {
            console.error('❌ Get order details error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve order details'
            });
        }
    }
);

/**
 * Update order status - Production Ready Professional Implementation
 * PATCH /api/manufacturer/orders/:orderId/status
 * 
 * Features:
 * - Complete status transition validation
 * - Professional notification system
 * - Business logic enforcement
 * - Audit logging
 * - Performance optimization
 * - Comprehensive error handling
 */
router.patch('/:orderId/status',
    authenticate,
    manufacturerOnly,
    [
        body('status').isIn([
            'draft', 'pending', 'confirmed', 'processing', 'manufacturing',
            'ready_to_ship', 'shipped', 'out_for_delivery', 'in_transit', 'delivered', 
            'completed', 'cancelled', 'refunded', 'disputed'
        ]).withMessage('Invalid status value'),
        body('note').optional().isString().isLength({ max: 1000 }).withMessage('Note must be a string with max 1000 characters'),
        body('notifyCustomer').optional().isBoolean().withMessage('notifyCustomer must be a boolean'),
        body('reason').optional().isString().isLength({ max: 500 }).withMessage('Reason must be a string with max 500 characters'),
        body('estimatedDeliveryDate').optional().isISO8601().withMessage('Invalid estimated delivery date format')
    ],
    async (req, res) => {
        const startTime = Date.now();
        let order = null;
        let notificationSent = false;
        
        try {
            // Validation
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: errors.array(),
                    timestamp: new Date().toISOString()
                });
            }

            const { orderId } = req.params;
            const { status, note, notifyCustomer = false, reason, estimatedDeliveryDate } = req.body;
            const manufacturerId = req.user?._id || req.user?.userId;
            const manufacturerName = req.user?.companyName || req.user?.name || 'Unknown';

            // Input validation
            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid order ID format',
                    code: 'INVALID_ORDER_ID'
                });
            }

            // Fetch order with populated data for business logic
            order = await Order.findOne({
                _id: orderId,
                seller: manufacturerId
            })
            .populate('buyer', 'name email companyName phone')
            .populate('items.product', 'name category')
            .lean();

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found or access denied',
                    code: 'ORDER_NOT_FOUND'
                });
            }

            // Business Logic: Status Transition Validation
            const validTransitions = {
                'draft': ['pending', 'cancelled'],
                'pending': ['confirmed', 'cancelled'],
                'confirmed': ['processing', 'cancelled'],
                'processing': ['manufacturing', 'cancelled'],
                'manufacturing': ['ready_to_ship', 'cancelled'],
                'ready_to_ship': ['shipped', 'cancelled'],
                'shipped': ['out_for_delivery', 'in_transit', 'delivered'],
                'out_for_delivery': ['delivered'],
                'in_transit': ['delivered'],
                'delivered': ['completed'],
                'completed': [],
                'cancelled': ['pending'], // Allow reactivation
                'refunded': [],
                'disputed': ['cancelled', 'completed']
            };

            const currentStatus = order.status;
            if (!validTransitions[currentStatus]?.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status transition from '${currentStatus}' to '${status}'`,
                    code: 'INVALID_STATUS_TRANSITION',
                    validTransitions: validTransitions[currentStatus] || []
                });
            }

            // Business Logic: Special validations
            if (status === 'cancelled' && !reason) {
                return res.status(400).json({
                    success: false,
                    message: 'Cancellation reason is required',
                    code: 'CANCELLATION_REASON_REQUIRED'
                });
            }

            // Check if order can be modified (business rules)
            if (['completed', 'refunded'].includes(currentStatus) && status !== 'disputed') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot modify completed or refunded orders',
                    code: 'ORDER_FINALIZED'
                });
            }

            // Performance: Use findOneAndUpdate for atomic operation
            const updateData = {
                status: status,
                updatedAt: new Date(),
                $push: {
                    statusHistory: {
                status: status,
                timestamp: new Date(),
                updatedBy: manufacturerId,
                        notes: note,
                        reason: reason
                    }
                }
            };

            // Set specific timestamps and business logic based on status
            const statusTimestamps = {};
            const businessLogicUpdates = {};

            switch (status) {
                case 'confirmed':
                    statusTimestamps.confirmedAt = new Date();
                    businessLogicUpdates['payment.status'] = 'pending';
                    break;
                case 'processing':
                    statusTimestamps.processingStartedAt = new Date();
                    break;
                case 'manufacturing':
                    statusTimestamps.manufacturingStartedAt = new Date();
                    break;
                case 'ready_to_ship':
                    statusTimestamps.readyToShipAt = new Date();
                    break;
                case 'shipped':
                    statusTimestamps['shipping.shippedAt'] = new Date();
                    if (estimatedDeliveryDate) {
                        businessLogicUpdates['shipping.estimatedDelivery'] = new Date(estimatedDeliveryDate);
                    }
                    break;
                case 'out_for_delivery':
                    statusTimestamps['shipping.outForDeliveryAt'] = new Date();
                    break;
                case 'in_transit':
                    statusTimestamps['shipping.inTransitAt'] = new Date();
                    break;
                case 'delivered':
                    statusTimestamps['shipping.deliveredAt'] = new Date();
                    statusTimestamps['shipping.actualDelivery'] = new Date();
                    businessLogicUpdates['payment.status'] = 'paid';
                    businessLogicUpdates['payment.paidDate'] = new Date();
                    // Calculate delivery time
                    if (order.createdAt) {
                        businessLogicUpdates['analytics.deliveryTime'] = Math.floor(
                            (Date.now() - new Date(order.createdAt)) / (1000 * 60 * 60)
                        );
                    }
                    break;
                case 'completed':
                    statusTimestamps.completedAt = new Date();
                    // Calculate processing time
                    if (order.createdAt) {
                        businessLogicUpdates['analytics.processingTime'] = Math.floor(
                            (Date.now() - new Date(order.createdAt)) / (1000 * 60 * 60)
                        );
                    }
                    break;
                case 'cancelled':
                    statusTimestamps.cancelledAt = new Date();
                    businessLogicUpdates.cancellation = {
                        reason: reason,
                        cancelledBy: manufacturerId,
                        cancelledDate: new Date()
                    };
                    break;
                case 'refunded':
                    statusTimestamps.refundedAt = new Date();
                    businessLogicUpdates['payment.status'] = 'refunded';
                    businessLogicUpdates['payment.refundDate'] = new Date();
                    break;
                case 'disputed':
                    statusTimestamps.disputedAt = new Date();
                    businessLogicUpdates.dispute = {
                        reason: reason,
                        disputedBy: manufacturerId,
                        disputedDate: new Date()
                    };
                    break;
            }

            // Merge all updates
            Object.assign(updateData, statusTimestamps, businessLogicUpdates);

            // Atomic update with optimistic locking
            const updatedOrder = await Order.findOneAndUpdate(
                { 
                    _id: orderId, 
                    seller: manufacturerId,
                    version: order.__v // Optimistic locking
                },
                { 
                    $set: updateData,
                    $inc: { __v: 1 }
                },
                { 
                    new: true, 
                    runValidators: true,
                    populate: [
                        { path: 'buyer', select: 'name email companyName phone' },
                        { path: 'items.product', select: 'name category' }
                    ]
                }
            );

            if (!updatedOrder) {
                return res.status(409).json({
                    success: false,
                    message: 'Order was modified by another process. Please refresh and try again.',
                    code: 'CONCURRENT_MODIFICATION'
                });
            }

            // Professional Notification System
            if (notifyCustomer && order.buyer) {
                try {
                    const NotificationService = require('../../services/NotificationService');
                    
                    // Create comprehensive notification data
                    const notificationData = {
                        orderId: order._id,
                        recipientId: order.buyer._id,
                        recipientModel: 'User',
                        senderId: manufacturerId,
                        senderModel: 'User',
                        orderNumber: order.orderNumber,
                        commentContent: note || `Order status updated to: ${status}`,
                        commentType: 'status_update',
                        priority: this.getNotificationPriority(status),
                        channels: { 
                            email: true, 
                            inApp: true, 
                            push: true 
                        },
                        metadata: {
                            orderNumber: order.orderNumber,
                            status: status,
                            previousStatus: currentStatus,
                            manufacturerName: manufacturerName,
                            actionUrl: `/buyer/orders/${order._id}`,
                            reason: reason
                        }
                    };

                    await NotificationService.createOrderCommentNotification(notificationData);
                    notificationSent = true;

                    // Log successful notification
                    console.log(`✅ Order status notification sent for order ${order.orderNumber} to ${order.buyer.email}`);

                } catch (notificationError) {
                    console.error('❌ Error sending customer notification:', notificationError);
                    // Don't fail the status update if notification fails
                    // But log it for monitoring
                    console.error('Notification failure details:', {
                        orderId: order._id,
                        error: notificationError.message,
                        timestamp: new Date().toISOString()
                    });
                }
            }

            // Audit Logging
            const auditLog = {
                action: 'ORDER_STATUS_UPDATE',
                orderId: order._id,
                orderNumber: order.orderNumber,
                manufacturerId: manufacturerId,
                manufacturerName: manufacturerName,
                previousStatus: currentStatus,
                newStatus: status,
                reason: reason,
                note: note,
                notificationSent: notificationSent,
                processingTime: Date.now() - startTime,
                timestamp: new Date().toISOString(),
                ip: req.ip,
                userAgent: req.get('User-Agent')
            };

            // Log audit (in production, use proper audit service)
            console.log('📋 Order Status Update Audit:', auditLog);

            // Performance metrics
            const processingTime = Date.now() - startTime;
            if (processingTime > 1000) {
                console.warn(`⚠️ Slow order status update: ${processingTime}ms for order ${order.orderNumber}`);
            }

            // Success response with comprehensive data
            res.json({
                success: true,
                message: `Order status updated successfully from '${currentStatus}' to '${status}'${notificationSent ? '. Customer notified.' : ''}`,
                data: {
                order: {
                        _id: updatedOrder._id,
                        orderNumber: updatedOrder.orderNumber,
                        status: updatedOrder.status,
                        previousStatus: currentStatus,
                        statusHistory: updatedOrder.statusHistory.slice(-5), // Last 5 status changes
                        updatedAt: updatedOrder.updatedAt,
                        timestamps: {
                            confirmedAt: updatedOrder.confirmedAt,
                            shippedAt: updatedOrder.shipping?.shippedAt,
                            deliveredAt: updatedOrder.shipping?.deliveredAt,
                            completedAt: updatedOrder.completedAt,
                            cancelledAt: updatedOrder.cancelledAt
                        }
                },
                notifications: {
                        customerNotified: notificationSent,
                        channels: notificationSent ? ['email', 'inApp', 'push'] : []
                    },
                    businessLogic: {
                        paymentStatus: updatedOrder.payment?.status,
                        deliveryTime: updatedOrder.analytics?.deliveryTime,
                        processingTime: updatedOrder.analytics?.processingTime
                    },
                    performance: {
                        processingTime: `${processingTime}ms`
                    }
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            // Comprehensive error handling
            console.error('❌ Update order status error:', {
                error: error.message,
                stack: error.stack,
                orderId: req.params.orderId,
                manufacturerId: req.user?._id || req.user?.userId,
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime
            });

            // Determine error type and appropriate response
            let statusCode = 500;
            let errorCode = 'INTERNAL_SERVER_ERROR';
            let message = 'Failed to update order status';

            if (error.name === 'ValidationError') {
                statusCode = 400;
                errorCode = 'VALIDATION_ERROR';
                message = 'Order validation failed';
            } else if (error.name === 'CastError') {
                statusCode = 400;
                errorCode = 'INVALID_DATA_TYPE';
                message = 'Invalid data format';
            } else if (error.code === 11000) {
                statusCode = 409;
                errorCode = 'DUPLICATE_ENTRY';
                message = 'Duplicate entry detected';
            }

            res.status(statusCode).json({
                success: false,
                message: message,
                code: errorCode,
                timestamp: new Date().toISOString(),
                ...(process.env.NODE_ENV === 'development' && { 
                    error: error.message,
                    stack: error.stack 
                })
            });
        }
    }
);

/**
 * Helper function to determine notification priority based on status
 */
function getNotificationPriority(status) {
    const priorityMap = {
        'cancelled': 'high',
        'disputed': 'high',
        'delivered': 'medium',
        'shipped': 'medium',
        'completed': 'medium',
        'confirmed': 'low',
        'processing': 'low',
        'manufacturing': 'low',
        'ready_to_ship': 'low',
        'out_for_delivery': 'low',
        'in_transit': 'low',
        'refunded': 'high'
    };
    
    return priorityMap[status] || 'low';
}

/**
 * Cancel order
 * PATCH /api/manufacturer/orders/:orderId/cancel
 */
router.patch('/:orderId/cancel',
    authenticate,
    manufacturerOnly,
    [
        body('reason').optional().isString().withMessage('Reason must be a string')
    ],
    async (req, res) => {
        try {
            const { orderId } = req.params;
            const { reason } = req.body;
            const manufacturerId = req.user?._id || req.user?.userId;

            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid order ID format'
                });
            }

            const order = await Order.findOne({
                _id: orderId,
                seller: manufacturerId
            });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found or access denied'
                });
            }

            // Check if order can be cancelled
            if (['completed', 'cancelled', 'refunded'].includes(order.status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Order cannot be cancelled in current status'
                });
            }

            // Update order
            order.status = 'cancelled';
            order.cancelledAt = new Date();
            order.cancellationReason = reason;

            // Add to status history
            order.statusHistory.push({
                status: 'cancelled',
                timestamp: new Date(),
                updatedBy: manufacturerId,
                notes: reason || 'Order cancelled by manufacturer'
            });

            await order.save();

            res.json({
                success: true,
                order: {
                    _id: order._id,
                    status: order.status,
                    cancelledAt: order.cancelledAt
                },
                message: 'Order cancelled successfully'
            });

        } catch (error) {
            console.error('❌ Cancel order error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to cancel order'
            });
        }
    }
);

/**
 * Duplicate order
 * POST /api/manufacturer/orders/:orderId/duplicate
 */
router.post('/:orderId/duplicate',
    authenticate,
    manufacturerOnly,
    async (req, res) => {
        try {
            const { orderId } = req.params;
            const manufacturerId = req.user?._id || req.user?.userId;

            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid order ID format'
                });
            }

            const originalOrder = await Order.findOne({
                _id: orderId,
                seller: manufacturerId
            }).lean();

            if (!originalOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found or access denied'
                });
            }

            // Create new order based on original
            const newOrderData = {
                ...originalOrder,
                _id: undefined,
                orderNumber: undefined, // Will be generated
                status: 'draft',
                createdAt: new Date(),
                updatedAt: new Date(),
                statusHistory: [{
                    status: 'draft',
                    timestamp: new Date(),
                    updatedBy: manufacturerId,
                    notes: `Duplicated from order #${originalOrder.orderNumber || originalOrder._id}`
                }],
                // Reset timestamps
                confirmedAt: undefined,
                cancelledAt: undefined,
                completedAt: undefined,
                shipping: {
                    ...originalOrder.shipping,
                    shippedAt: undefined,
                    deliveredAt: undefined,
                    trackingNumber: undefined
                }
            };

            const newOrder = new Order(newOrderData);
            await newOrder.save();

            res.json({
                success: true,
                order: {
                    _id: newOrder._id,
                    orderNumber: newOrder.orderNumber,
                    status: newOrder.status
                },
                message: 'Order duplicated successfully'
            });

        } catch (error) {
            console.error('❌ Duplicate order error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to duplicate order'
            });
        }
    }
);

// ===============================================
//    BULK OPERATIONS
// ===============================================

/**
 * Bulk update order statuses
 * PATCH /api/manufacturer/orders/bulk/status
 */
router.patch('/bulk/status',
    authenticate,
    manufacturerOnly,
    [
        body('orderIds').isArray().withMessage('Order IDs must be an array'),
        body('status').isIn([
            'pending', 'confirmed', 'processing', 'manufacturing',
            'ready_to_ship', 'shipped', 'out_for_delivery', 'delivered', 'completed', 'cancelled'
        ]).withMessage('Invalid status'),
        body('note').optional().isString().withMessage('Note must be a string')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: errors.array()
                });
            }

            const { orderIds, status, note } = req.body;
            const manufacturerId = req.user?._id || req.user?.userId;

            // Validate all order IDs
            if (!orderIds.every(id => mongoose.Types.ObjectId.isValid(id))) {
                return res.status(400).json({
                    success: false,
                    message: 'One or more invalid order IDs'
                });
            }

            // Update orders
            const result = await Order.updateMany(
                {
                    _id: { $in: orderIds },
                    seller: manufacturerId
                },
                {
                    $set: { status: status, updatedAt: new Date() },
                    $push: {
                        statusHistory: {
                            status: status,
                            timestamp: new Date(),
                            updatedBy: manufacturerId,
                            notes: note || `Bulk status update to ${status}`
                        }
                    }
                }
            );

            res.json({
                success: true,
                updatedCount: result.modifiedCount,
                message: `${result.modifiedCount} orders updated successfully`
            });

        } catch (error) {
            console.error('❌ Bulk status update error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update orders'
            });
        }
    }
);

// ===============================================
//    EXPORT FUNCTIONALITY
// ===============================================

/**
 * Bulk cancel orders
 * PATCH /api/manufacturer/orders/bulk-cancel
 */
router.patch('/bulk-cancel',
    authenticate,
    manufacturerOnly,
    [
        body('orderIds').isArray().withMessage('Order IDs must be an array'),
        body('orderIds.*').isMongoId().withMessage('Each order ID must be valid')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { orderIds } = req.body;
            const manufacturerId = req.user?._id || req.user?.userId;

            if (!manufacturerId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            // Verify all orders belong to this manufacturer
            const orders = await Order.find({
                _id: { $in: orderIds },
                seller: new mongoose.Types.ObjectId(manufacturerId)
            });

            if (orders.length !== orderIds.length) {
                return res.status(403).json({
                    success: false,
                    message: 'Some orders not found or access denied'
                });
            }

            // Update orders status to cancelled
            const result = await Order.updateMany(
                { _id: { $in: orderIds } },
                { 
                    status: 'cancelled',
                    updatedAt: new Date(),
                    cancellationReason: 'Bulk cancelled by manufacturer'
                }
            );

            res.json({
                success: true,
                message: `${result.modifiedCount} orders cancelled successfully`,
                data: {
                    cancelledCount: result.modifiedCount,
                    orderIds: orderIds
                }
            });

        } catch (error) {
            console.error('❌ Bulk cancel orders error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to cancel orders',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
                code: 'BULK_CANCEL_ERROR'
            });
        }
    }
);

/**
 * Export orders to Excel/CSV
 * POST /api/manufacturer/orders/export
 */
router.post('/export',
    authenticate,
    manufacturerOnly,
    async (req, res) => {
        try {
            const manufacturerId = req.user?._id || req.user?.userId;
            const { format = 'excel', filters = {}, orderIds } = req.body;

            // Build query based on filters
            const query = { seller: new mongoose.Types.ObjectId(manufacturerId) };
            
            // If specific order IDs provided, filter by them
            if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
                query._id = { $in: orderIds };
            }
            
            // Apply filters (similar to GET route)
            if (filters.status) query.status = filters.status;
            if (filters.search) {
                query.$or = [
                    { orderNumber: { $regex: filters.search, $options: 'i' } },
                    { 'buyer.companyName': { $regex: filters.search, $options: 'i' } }
                ];
            }

            // Get orders for export
            const orders = await Order.find(query)
                .populate('buyer', 'name email companyName')
                .populate('items.product', 'title name')
                .sort({ createdAt: -1 })
                .lean();

            // Format data for export
            const exportData = orders.map(order => ({
                'Order Number': order.orderNumber || order._id,
                'Customer': order.buyer?.companyName || order.buyer?.name || 'N/A',
                'Email': order.buyer?.email || 'N/A',
                'Status': order.status,
                'Total Amount': order.totalAmount,
                'Currency': order.currency,
                'Items Count': order.items?.length || 0,
                'Created Date': order.createdAt,
                'Updated Date': order.updatedAt
            }));

            if (format === 'excel') {
                // Generate Excel file - fallback to CSV if ExcelJS not available
                try {
                    const ExcelJS = require('exceljs');
                    const workbook = new ExcelJS.Workbook();
                    const worksheet = workbook.addWorksheet('Orders');

                    // Add headers
                    const headers = Object.keys(exportData[0] || {});
                    worksheet.addRow(headers);

                    // Add data
                    exportData.forEach(row => {
                        worksheet.addRow(Object.values(row));
                    });

                    // Set response headers
                    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                    res.setHeader('Content-Disposition', 'attachment; filename=orders-export.xlsx');

                    // Send file
                    await workbook.xlsx.write(res);
                    res.end();
                } catch (excelError) {
                    console.warn('⚠️ ExcelJS not available, falling back to CSV:', excelError.message);
                    
                    // Fallback to CSV format
                    const csv = [
                        Object.keys(exportData[0] || {}).join(','),
                        ...exportData.map(row => Object.values(row).map(val => 
                            typeof val === 'string' && val.includes(',') ? `"${val}"` : val
                        ).join(','))
                    ].join('\n');

                    res.setHeader('Content-Type', 'text/csv');
                    res.setHeader('Content-Disposition', 'attachment; filename=orders-export.csv');
                    res.send(csv);
                }

            } else {
                // CSV format
                const csv = [
                    Object.keys(exportData[0] || {}).join(','),
                    ...exportData.map(row => Object.values(row).join(','))
                ].join('\n');

                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename=orders-export.csv');
                res.send(csv);
            }

        } catch (error) {
            console.error('❌ Export orders error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to export orders'
            });
        }
    }
);

module.exports = router;
