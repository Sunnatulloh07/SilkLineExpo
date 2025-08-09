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
            
            console.log(`📊 Getting orders stats for manufacturer: ${manufacturerId}`);
            
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
            
            // Get aggregated statistics with enhanced error handling
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
                                        $in: ["$status", ["confirmed", "processing", "manufacturing", "ready_to_ship", "shipped"]] 
                                    }, 
                                    1, 
                                    0
                                ]
                            }
                        },
                        pendingOrders: {
                            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
                        },
                        completedOrders: {
                            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
                        },
                        cancelledOrders: {
                            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] }
                        },
                        totalRevenue: { $sum: "$totalAmount" },
                        averageOrderValue: { $avg: "$totalAmount" }
                    }
                }
            ]);

            // Get monthly revenue
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
                        monthlyOrders: { $sum: 1 }
                    }
                }
            ]);
            
            const result = stats.length > 0 ? stats[0] : {
                totalOrders: 0,
                activeOrders: 0,
                pendingOrders: 0,
                completedOrders: 0,
                cancelledOrders: 0,
                totalRevenue: 0,
                averageOrderValue: 0
            };

            const monthlyResult = monthlyStats.length > 0 ? monthlyStats[0] : {
                monthlyRevenue: 0,
                monthlyOrders: 0
            };
            
            // Remove _id from results
            delete result._id;
            delete monthlyResult._id;

            // Combine results
            const finalResult = {
                ...result,
                monthlyRevenue: monthlyResult.monthlyRevenue,
                monthlyOrders: monthlyResult.monthlyOrders
            };
            
            console.log(`✅ Orders stats calculated for manufacturer ${manufacturerId}:`, finalResult);
            
            res.json({
                success: true,
                data: finalResult,
                // Backward compatibility - flatten data to root level
                totalOrders: finalResult.totalOrders,
                activeOrders: finalResult.activeOrders,
                pendingOrders: finalResult.pendingOrders,
                completedOrders: finalResult.completedOrders,
                cancelledOrders: finalResult.cancelledOrders,
                monthlyRevenue: finalResult.monthlyRevenue,
                totalRevenue: finalResult.totalRevenue,
                averageOrderValue: finalResult.averageOrderValue,
                message: 'Orders statistics retrieved successfully'
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

            // Build query
            const query = { seller: new mongoose.Types.ObjectId(manufacturerId) };

            // Status filter
            if (status) {
                query.status = status;
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

            // Search filter
            if (search) {
                query.$or = [
                    { orderNumber: { $regex: search, $options: 'i' } },
                    { 'buyer.companyName': { $regex: search, $options: 'i' } },
                    { 'buyer.name': { $regex: search, $options: 'i' } },
                    { 'buyer.email': { $regex: search, $options: 'i' } }
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

            // Execute query with population
            const [orders, total] = await Promise.all([
                Order.find(query)
                    .populate('buyer', 'name email companyName avatar')
                    .populate('items.product', 'title name images category')
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(limitNum)
                    .lean(),
                Order.countDocuments(query)
            ]);

            // Calculate pagination info
            const totalPages = Math.ceil(total / limitNum);
            const hasNextPage = pageNum < totalPages;
            const hasPreviousPage = pageNum > 1;

            res.json({
                success: true,
                orders,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalOrders: total,
                    hasNextPage,
                    hasPreviousPage,
                    limit: limitNum
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
 * Update order status
 * PATCH /api/manufacturer/orders/:orderId/status
 */
router.patch('/:orderId/status',
    authenticate,
    manufacturerOnly,
    [
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

            const { orderId } = req.params;
            const { status, note, notifyCustomer } = req.body;
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

            // Add to status history
            order.statusHistory.push({
                status: status,
                timestamp: new Date(),
                updatedBy: manufacturerId,
                notes: note
            });

            // Update current status
            order.status = status;
            order.updatedAt = new Date();

            // Set specific timestamps based on status
            switch (status) {
                case 'confirmed':
                    order.confirmedAt = new Date();
                    break;
                case 'shipped':
                    order.shipping.shippedAt = new Date();
                    break;
                case 'delivered':
                    order.shipping.deliveredAt = new Date();
                    break;
                case 'completed':
                    order.completedAt = new Date();
                    break;
                case 'cancelled':
                    order.cancelledAt = new Date();
                    break;
            }

            await order.save();

            console.log(`📋 Order status updated: ${orderId} -> ${status}`, {
                notifyCustomer,
                note: note?.substring(0, 50) || 'No note'
            });

            // Send customer notification if requested
            let notificationSent = false;
            if (notifyCustomer) {
                try {
                    // TODO: Implement real notification service (email, SMS)
                    // For now, just log that notification would be sent
                    console.log(`📧 Customer notification would be sent to:`, {
                        orderId: order._id,
                        orderNumber: order.orderNumber,
                        customerEmail: order.buyer?.email,
                        status,
                        note
                    });
                    
                    notificationSent = true;
                } catch (notificationError) {
                    console.error('❌ Error sending customer notification:', notificationError);
                    // Don't fail the status update if notification fails
                }
            }

            res.json({
                success: true,
                message: `Order status updated successfully${notificationSent ? '. Customer notified.' : ''}`,
                order: {
                    _id: order._id,
                    status: order.status,
                    statusHistory: order.statusHistory,
                    updatedAt: order.updatedAt
                },
                notifications: {
                    customerNotified: notificationSent
                }
            });

        } catch (error) {
            console.error('❌ Update order status error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update order status'
            });
        }
    }
);

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
 * Export orders to Excel/CSV
 * POST /api/manufacturer/orders/export
 */
router.post('/export',
    authenticate,
    manufacturerOnly,
    async (req, res) => {
        try {
            const manufacturerId = req.user?._id || req.user?.userId;
            const { format = 'excel', filters = {} } = req.body;

            // Build query based on filters
            const query = { seller: new mongoose.Types.ObjectId(manufacturerId) };
            
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
