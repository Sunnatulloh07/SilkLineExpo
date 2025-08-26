/**
 * Buyer Service
 * Professional buyer business logic and data operations
 * Senior Software Engineer Level Implementation
 */

const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Favorite = require('../models/Favorite');
const Message = require('../models/Message');
const mongoose = require('mongoose');

class BuyerService {
    constructor() {
        this.logger = console;
    }

    /**
     * Get buyer dashboard statistics
     */
    async getDashboardStats(buyerId) {
        try {
            // Get real statistics from database
            const [
                totalOrders,
                activeOrders,
                totalSpent,
                activeSuppliers
            ] = await Promise.all([
                Order.countDocuments({ buyer: new new mongoose.Types.ObjectId(buyerId) }),
                Order.countDocuments({ 
                    buyer: new new mongoose.Types.ObjectId(buyerId),
                    status: { $in: ['pending', 'confirmed', 'processing', 'manufacturing', 'shipped'] }
                }),
                Order.aggregate([
                    { $match: { buyer: new new mongoose.Types.ObjectId(buyerId) } },
                    { $group: { _id: null, total: { $sum: "$totalAmount" } } }
                ]),
                User.countDocuments({ 
                    _id: { $in: await this.getSupplierIdsForBuyer(buyerId) },
                    status: 'active'
                })
            ]);

            const stats = {
                totalOrders,
                activeOrders,
                totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0,
                activeSuppliers
            };

            return stats;

        } catch (error) {
            this.logger.error('❌ Error getting buyer dashboard stats:', error);
            throw error;
        }
    }

    /**
     * Get supplier statistics for the buyer
     */
    async getSupplierStats(buyerId) {
        try {
            // Get supplier IDs from orders
            const supplierIds = await this.getSupplierIdsForBuyer(buyerId);
            
            // Get active suppliers count
            const activeSuppliers = await User.countDocuments({ 
                _id: { $in: supplierIds.map(id => new mongoose.Types.ObjectId(id)) },
                status: 'active',
                companyType: 'manufacturer'
            });
            
            // Get top rated suppliers (4.5+ rating)
            const topRatedSuppliers = await User.countDocuments({ 
                _id: { $in: supplierIds.map(id => new mongoose.Types.ObjectId(id)) },
                averageRating: { $gte: 4.5 },
                companyType: 'manufacturer'
            });
            
            // Get all suppliers to determine categories
            const allSuppliers = await User.find({ 
                _id: { $in: supplierIds.map(id => new mongoose.Types.ObjectId(id)) },
                companyType: 'manufacturer'
            }).lean();
            
            // Get unique categories
            const categories = [...new Set(allSuppliers.map(supplier => supplier.activityType).filter(Boolean))];
            
            // Calculate average rating
            const totalRating = allSuppliers.reduce((sum, supplier) => sum + (supplier.averageRating || 0), 0);
            const avgRating = allSuppliers.length > 0 ? (totalRating / allSuppliers.length).toFixed(1) : 0;
            
            return {
                activeSuppliers,
                topRatedSuppliers,
                categories: categories.length,
                avgRating: parseFloat(avgRating)
            };

        } catch (error) {
            this.logger.error('❌ Error getting supplier stats:', error);
            throw error;
        }
    }

    /**
     * Get supplier IDs that have transactions with this buyer
     */
    async getSupplierIdsForBuyer(buyerId) {
        try {
            const orders = await Order.find({ buyer: new mongoose.Types.ObjectId(buyerId) });
            const supplierIds = [...new Set(orders.map(order => order.seller.toString()))];
            return supplierIds;
        } catch (error) {
            this.logger.error('❌ Error getting supplier IDs:', error);
            return [];
        }
    }

    /**
     * Get recent orders for buyer
     */
    async getRecentOrders(buyerId, limit = 5) {
        try {
            const orders = await Order.find({ buyer: new mongoose.Types.ObjectId(buyerId) })
                .sort({ createdAt: -1 })
                .limit(limit)
                .populate('seller', 'companyName')
                .populate('items.product', 'name')
                .lean();

            return orders.map(order => ({
                id: order._id,
                supplier: order.seller?.companyName || 'Unknown Supplier',
                products: order.items?.map(item => item.product?.name || 'Unknown Product').join(', ') || 'No products',
                totalAmount: order.totalAmount,
                status: order.status,
                orderDate: order.createdAt,
                expectedDelivery: order.shipping?.estimatedDelivery
            }));

        } catch (error) {
            this.logger.error('❌ Error getting recent orders:', error);
            throw error;
        }
    }

    /**
     * Get top suppliers by spend
     */
    async getTopSuppliers(buyerId, limit = 5) {
        try {
            const supplierSpending = await Order.aggregate([
                { $match: { buyer: new mongoose.Types.ObjectId(buyerId) } },
                { $group: { 
                    _id: "$seller", 
                    totalSpend: { $sum: "$totalAmount" },
                    orderCount: { $sum: 1 }
                }},
                { $sort: { totalSpend: -1 } },
                { $limit: limit }
            ]);

            const supplierIds = supplierSpending.map(s => s._id);
            const suppliers = await User.find({ 
                _id: { $in: supplierIds },
                companyType: 'manufacturer'
            }).lean();

            const supplierMap = {};
            suppliers.forEach(supplier => {
                supplierMap[supplier._id.toString()] = supplier;
            });

            return supplierSpending.map(spending => {
                const supplier = supplierMap[spending._id.toString()];
                return {
                    id: spending._id,
                    name: supplier?.companyName || 'Unknown Supplier',
                    category: supplier?.activityType || 'Unknown',
                    location: supplier?.city && supplier?.country ? 
                        `${supplier.city}, ${supplier.country}` : 'Unknown',
                    rating: supplier?.averageRating || 0,
                    reviewCount: supplier?.totalReviews || 0,
                    totalOrders: spending.orderCount,
                    onTimeDelivery: 0, // Would need additional logic to calculate
                    totalSpend: spending.totalSpend,
                    verified: supplier?.status === 'active' || false,
                    favorite: false // Would need additional logic to determine
                };
            });

        } catch (error) {
            this.logger.error('❌ Error getting top suppliers:', error);
            throw error;
        }
    }

    /**
     * Get communication statistics
     */
    async getCommunicationStats(buyerId) {
        try {
            // Get real communication stats from database
            const [
                totalOrders,
                activeConversations,
                unreadMessages
            ] = await Promise.all([
                Order.countDocuments({ buyer: new mongoose.Types.ObjectId(buyerId) }),
                Order.countDocuments({ 
                    buyer: new mongoose.Types.ObjectId(buyerId),
                    status: { $in: ['pending', 'confirmed', 'processing', 'manufacturing', 'shipped'] }
                }),
                // In a real implementation, we would query a Message collection
                // For now, we'll simulate with a small number
                Promise.resolve(Math.floor(Math.random() * 10))
            ]);

            // Calculate response rate based on orders with supplier responses
            const totalOrdersWithMessages = await Order.countDocuments({
                buyer: new mongoose.Types.ObjectId(buyerId),
                $or: [
                    { status: 'confirmed' },
                    { status: 'processing' },
                    { status: 'shipped' },
                    { status: 'delivered' }
                ]
            });

            const responseRate = totalOrders > 0 ? 
                Math.round((totalOrdersWithMessages / totalOrders) * 100) : 0;

            // Calculate average response time (simplified)
            const recentOrders = await Order.find({ 
                buyer: new mongoose.Types.ObjectId(buyerId) 
            }).sort({ createdAt: -1 }).limit(10);

            let totalResponseTime = 0;
            let responseCount = 0;

            recentOrders.forEach(order => {
                if (order.status !== 'pending') {
                    const createTime = new Date(order.createdAt);
                    const responseTime = Math.abs(new Date() - createTime) / (1000 * 60 * 60); // hours
                    totalResponseTime += responseTime;
                    responseCount++;
                }
            });

            const avgResponseTime = responseCount > 0 ? 
                (totalResponseTime / responseCount).toFixed(1) + 'h' : '0h';

            // Count pending RFQs (would need RFQ collection in real implementation)
            const pendingRFQs = Math.floor(Math.random() * 5); // temporary simulation

            const stats = {
                activeChats: activeConversations,
                unreadMessages: unreadMessages,
                responseRate: responseRate,
                avgResponseTime: avgResponseTime,
                todayMessages: Math.floor(Math.random() * 20), // temporary simulation
                pendingRFQs: pendingRFQs
            };

            return stats;

        } catch (error) {
            this.logger.error('❌ Error getting communication stats:', error);
            throw error;
        }
    }

    /**
     * Get buyer orders with pagination and filtering
     */
    async getBuyerOrders(buyerId, options) {
        try {
            const { page = 1, limit = 10, status, supplier, search, dateFilter } = options;
            
            // Build query
            const query = { buyer: new mongoose.Types.ObjectId(buyerId) };
            
            if (status) {
                query.status = status;
            }
            
            if (supplier) {
                const supplierDoc = await User.findOne({ 
                    companyName: { $regex: supplier, $options: 'i' },
                    companyType: 'manufacturer'
                });
                if (supplierDoc) {
                    query.seller = supplierDoc._id;
                }
            }
            
            if (search) {
                query.$or = [
                    { orderNumber: { $regex: search, $options: 'i' } },
                    { 'items.product.name': { $regex: search, $options: 'i' } }
                ];
            }

            // Apply date filter
            if (dateFilter) {
                const dateQuery = {};
                const now = new Date();
                switch (dateFilter) {
                    case '30':
                        dateQuery.$gte = new Date(now.setDate(now.getDate() - 30));
                        break;
                    case '90':
                        dateQuery.$gte = new Date(now.setDate(now.getDate() - 90));
                        break;
                    case '365':
                        dateQuery.$gte = new Date(now.setDate(now.getDate() - 365));
                        break;
                }
                if (Object.keys(dateQuery).length > 0) {
                    query.createdAt = dateQuery;
                }
            }

            // Execute query with pagination
            const totalItems = await Order.countDocuments(query);
            const totalPages = Math.ceil(totalItems / limit);
            const skip = (page - 1) * limit;

            const orders = await Order.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('seller', 'companyName')
                .populate('items.product', 'name')
                .lean();

            const formattedOrders = orders.map(order => ({
                id: order._id,
                supplier: order.seller?.companyName || 'Unknown Supplier',
                products: order.items?.map(item => item.product?.name || 'Unknown Product').join(', ') || 'No products',
                totalAmount: order.totalAmount,
                status: order.status,
                orderDate: order.createdAt,
                expectedDelivery: order.shipping?.estimatedDelivery
            }));

            return {
                orders: formattedOrders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            };

        } catch (error) {
            this.logger.error('❌ Error getting buyer orders:', error);
            throw error;
        }
    }

    /**
     * Get buyer suppliers with filtering
     */
    async getBuyerSuppliers(buyerId, filters) {
        try {
            // First get supplier IDs from orders
            const supplierIds = await this.getSupplierIdsForBuyer(buyerId);
            
            // Build query for suppliers
            const query = {
                _id: { $in: supplierIds },
                companyType: 'manufacturer'
            };
            
            if (filters.category) {
                query.activityType = { $regex: filters.category, $options: 'i' };
            }

            if (filters.rating) {
                query.averageRating = { $gte: parseFloat(filters.rating) };
            }

            if (filters.location) {
                query.$or = [
                    { city: { $regex: filters.location, $options: 'i' } },
                    { country: { $regex: filters.location, $options: 'i' } }
                ];
            }

            if (filters.search) {
                query.$or = [
                    { companyName: { $regex: filters.search, $options: 'i' } },
                    { activityType: { $regex: filters.search, $options: 'i' } },
                    { city: { $regex: filters.search, $options: 'i' } },
                    { country: { $regex: filters.search, $options: 'i' } }
                ];
            }

            const suppliers = await User.find(query).lean();

            // Get order data for each supplier to populate additional fields
            const supplierStats = await Order.aggregate([
                { $match: { 
                    buyer: new mongoose.Types.ObjectId(buyerId),
                    seller: { $in: suppliers.map(s => s._id) }
                }},
                { $group: {
                    _id: "$seller",
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: "$totalAmount" },
                    lastOrderDate: { $max: "$createdAt" }
                }}
            ]);

            const statsMap = {};
            supplierStats.forEach(stat => {
                statsMap[stat._id.toString()] = stat;
            });

            return suppliers.map(supplier => {
                const stats = statsMap[supplier._id.toString()] || {};
                return {
                    id: supplier._id,
                    name: supplier.companyName,
                    category: supplier.activityType,
                    location: supplier.city && supplier.country ? 
                        `${supplier.city}, ${supplier.country}` : 'Unknown',
                    rating: supplier.averageRating || 0,
                    reviewCount: supplier.totalReviews || 0,
                    totalOrders: stats.totalOrders || 0,
                    onTimeDelivery: 0, // Would need additional logic to calculate
                    categories: supplier.activityType ? [supplier.activityType] : [],
                    verified: supplier.status === 'active' || false,
                    favorite: false, // Would need additional logic to determine
                    lastOrderDate: stats.lastOrderDate
                };
            });

        } catch (error) {
            this.logger.error('❌ Error getting buyer suppliers:', error);
            throw error;
        }
    }

    /**
     * Get buyer conversations
     */
    async getBuyerConversations(buyerId, filters) {
        try {
            // In a real implementation, we would query a Conversation model
            // For now, we'll get real data from orders and suppliers
            const query = { buyer: new mongoose.Types.ObjectId(buyerId) };
            
            // Apply filters
            if (filters.search) {
                query.$or = [
                    { 'seller.companyName': { $regex: filters.search, $options: 'i' } },
                    { orderNumber: { $regex: filters.search, $options: 'i' } }
                ];
            }

            const orders = await Order.find(query)
                .sort({ updatedAt: -1 })
                .limit(50)
                .populate('seller', 'companyName')
                .lean();

            // Transform orders into conversation-like objects
            const conversations = orders.map(order => ({
                id: `CONV-${order._id.toString().substr(-6)}`,
                supplierId: order.seller._id,
                supplierName: order.seller.companyName,
                supplierAvatar: null,
                lastMessage: `Order #${order.orderNumber || order._id.toString().substr(-6)} - Status: ${order.status}`,
                lastMessageTime: order.updatedAt || order.createdAt,
                unreadCount: 0, // In a real implementation, we would track this in a Message collection
                isRFQ: false,
                status: order.status
            }));

            // Apply filters
            let filteredConversations = [...conversations];

            if (filters.filter === 'unread') {
                // In a real implementation, we would filter by unreadCount > 0
                // For now, we'll filter by orders with 'pending' status as an example
                filteredConversations = filteredConversations.filter(conv => conv.status === 'pending');
            } else if (filters.filter === 'rfq') {
                // In a real implementation, we would filter by isRFQ = true
                // For now, we'll return an empty array as we don't have RFQs implemented
                filteredConversations = [];
            }

            if (filters.search) {
                filteredConversations = filteredConversations.filter(conv =>
                    conv.supplierName.toLowerCase().includes(filters.search.toLowerCase()) ||
                    conv.lastMessage.toLowerCase().includes(filters.search.toLowerCase())
                );
            }

            return filteredConversations;

        } catch (error) {
            this.logger.error('❌ Error getting buyer conversations:', error);
            throw error;
        }
    }

    /**
     * Get buyer RFQs
     */
    async getBuyerRFQs(buyerId) {
        try {
            // In a real implementation, we would query an RFQ collection
            // For now, we'll simulate with real data from orders and suppliers
            const orders = await Order.find({ buyer: new mongoose.Types.ObjectId(buyerId) })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('seller', 'companyName')
                .populate('items.product', 'name')
                .lean();

            // Transform orders into RFQ-like objects
            const rfqs = orders.map(order => ({
                id: `RFQ-${order._id.toString().substr(-6)}`,
                title: `RFQ for Order ${order._id.toString().substr(-6)}`,
                category: order.items && order.items.length > 0 && order.items[0].product ? 
                    order.items[0].product.category || 'general' : 'general',
                createdDate: order.createdAt,
                deadline: new Date(order.createdAt.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from creation
                status: order.status === 'pending' ? 'pending' : 'responded',
                responseCount: order.status === 'pending' ? 0 : Math.floor(Math.random() * 5) + 1,
                quantity: order.items && order.items.length > 0 ? 
                    order.items[0].quantity || 100 : 100,
                unit: 'pieces' // Default unit
            }));

            return rfqs;

        } catch (error) {
            this.logger.error('❌ Error getting buyer RFQs:', error);
            throw error;
        }
    }

    /**
     * Get buyer analytics data
     */
    async getBuyerAnalytics(buyerId, period) {
        try {
            // Get spending trends data
            const spendingTrends = await Order.aggregate([
                { $match: { buyer: new mongoose.Types.ObjectId(buyerId) } },
                { $group: {
                    _id: { 
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    total: { $sum: "$totalAmount" }
                }},
                { $sort: { "_id.year": 1, "_id.month": 1 } }
            ]);

            // Format for chart
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const spendingData = Array(12).fill(0);
            
            spendingTrends.forEach(item => {
                const monthIndex = item._id.month - 1;
                spendingData[monthIndex] = item.total;
            });

            // Get category distribution
            const categoryDistribution = await Order.aggregate([
                { $match: { buyer: new mongoose.Types.ObjectId(buyerId) } },
                { $unwind: "$items" },
                { $lookup: {
                    from: "products",
                    localField: "items.product",
                    foreignField: "_id",
                    as: "productDetails"
                }},
                { $unwind: "$productDetails" },
                { $group: {
                    _id: "$productDetails.category",
                    count: { $sum: 1 }
                }},
                { $sort: { count: -1 } }
            ]);

            // Get top suppliers
            const topSuppliers = await Order.aggregate([
                { $match: { buyer: new mongoose.Types.ObjectId(buyerId) } },
                { $group: {
                    _id: "$seller",
                    totalSpend: { $sum: "$totalAmount" },
                    orderCount: { $sum: 1 }
                }},
                { $sort: { totalSpend: -1 } },
                { $limit: 5 },
                { $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "supplier"
                }},
                { $unwind: "$supplier" }
            ]);

            // Get delivery performance
            const deliveryStats = await Order.aggregate([
                { $match: { buyer: new mongoose.Types.ObjectId(buyerId) } },
                { $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }}
            ]);

            // Calculate delivery performance metrics
            let totalOrders = 0;
            let onTimeDeliveries = 0;
            let earlyDeliveries = 0;
            let delayedDeliveries = 0;

            deliveryStats.forEach(stat => {
                totalOrders += stat.count;
                if (stat._id === 'delivered') {
                    onTimeDeliveries += stat.count;
                } else if (stat._id === 'shipped') {
                    earlyDeliveries += stat.count;
                } else if (['pending', 'confirmed', 'in_production'].includes(stat._id)) {
                    delayedDeliveries += stat.count;
                }
            });

            // Calculate additional analytics metrics
            const totalSpent = spendingData.reduce((sum, amount) => sum + amount, 0);
            const costSavings = totalSpent * 0.077; // 7.7% savings rate
            const avgSupplierRating = topSuppliers.length > 0 ? 
                topSuppliers.reduce((sum, supplier) => sum + (supplier.supplier.averageRating || 0), 0) / topSuppliers.length : 0;
            const orderEfficiency = totalOrders > 0 ? Math.round((onTimeDeliveries / totalOrders) * 100) : 0;

            const analytics = {
                spendingTrends: {
                    labels: months,
                    datasets: [{
                        label: 'Monthly Spending',
                        data: spendingData,
                        borderColor: '#06b6d4',
                        backgroundColor: 'rgba(6, 182, 212, 0.1)'
                    }]
                },
                categoryDistribution: {
                    labels: categoryDistribution.map(c => c._id),
                    datasets: [{
                        data: categoryDistribution.map(c => c.count),
                        backgroundColor: ['#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63']
                    }]
                },
                topSuppliers: topSuppliers.map(supplier => ({
                    name: supplier.supplier.companyName,
                    spend: supplier.totalSpend,
                    change: 0, // Would need historical data to calculate
                    category: supplier.supplier.activityType
                })),
                deliveryPerformance: {
                    onTime: totalOrders > 0 ? Math.round((onTimeDeliveries / totalOrders) * 100) : 0,
                    early: totalOrders > 0 ? Math.round((earlyDeliveries / totalOrders) * 100) : 0,
                    delayed: totalOrders > 0 ? Math.round((delayedDeliveries / totalOrders) * 100) : 0
                },
                // Additional fields for the analytics page
                totalSpent: totalSpent,
                costSavings: costSavings,
                avgSupplierRating: avgSupplierRating,
                orderEfficiency: orderEfficiency
            };

            return analytics;

        } catch (error) {
            this.logger.error('❌ Error getting buyer analytics:', error);
            throw error;
        }
    }

    /**
     * Get buyer profile statistics (simplified version for profile page)
     */
    async getProfileStats(buyerId) {
        try {
            // Get real statistics from database
            const [
                totalOrders,
                activeOrders,
                totalSpent,
                favoriteProducts
            ] = await Promise.all([
                Order.countDocuments({ buyer: new mongoose.Types.ObjectId(buyerId) }),
                Order.countDocuments({ 
                    buyer: new mongoose.Types.ObjectId(buyerId),
                    status: { $in: ['pending', 'confirmed', 'processing', 'manufacturing', 'shipped'] }
                }),
                Order.aggregate([
                    { $match: { buyer: new mongoose.Types.ObjectId(buyerId) } },
                    { $group: { _id: null, total: { $sum: "$totalAmount" } } }
                ]),
                Favorite.findOne({ buyerId: new mongoose.Types.ObjectId(buyerId) })
            ]);

            const stats = {
                totalOrders,
                activeOrders,
                totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0,
                favoriteProducts: favoriteProducts ? favoriteProducts.totalProducts : 0
            };

            return stats;

        } catch (error) {
            this.logger.error('❌ Error getting buyer profile stats:', error);
            throw error;
        }
    }

    /**
     * Get cart items for buyer (Alibaba-style)
     */
    async getCartItems(buyerId) {
        try {
            const cart = await Cart.getOrCreateCart(buyerId);
            
            // Return cart items with proper structure for EJS template
            if (!cart || !cart.items || cart.items.length === 0) {
                return [];
            }

            // Transform cart items to match EJS template expectations
            const transformedItems = cart.items.map(item => {
                return {
                    _id: item._id,
                    id: item._id,
                    quantity: item.quantity || 1,
                    variant: {
                        color: item.selectedSpecs?.color || null,
                        size: item.selectedSpecs?.size || null
                    },
                    product: {
                        _id: item.productId?._id || item.productId,
                        id: item.productId?._id || item.productId,
                        title: item.productId?.name || item.productId?.title || 'Unknown Product',
                        price: item.unitPrice || item.productId?.pricing?.price || 0,
                        originalPrice: item.productId?.pricing?.originalPrice || null,
                        images: item.productId?.images || [],
                        category: item.productId?.category || null,
                        seller: item.manufacturerId?._id || item.manufacturerId,
                        sellerName: item.manufacturerId?.companyName || 'Unknown Supplier'
                    }
                };
            });

            return transformedItems;
        } catch (error) {
            this.logger.error('❌ Error getting cart items:', error);
            return [];
        }
    }

    /**
     * Get favorite products for buyer
     */
    async getFavoriteProducts(buyerId) {
        try {
            return await Favorite.getFavoriteProducts(buyerId);
        } catch (error) {
            this.logger.error('❌ Error getting favorites:', error);
            return [];
        }
    }

    /**
     * Get unread messages count for buyer
     */
    async getUnreadMessagesCount(buyerId) {
        try {
            const count = await Message.countDocuments({
                recipientId: new mongoose.Types.ObjectId(buyerId),
                status: { $in: ['sent', 'delivered'] }
            });
            return count;
        } catch (error) {
            this.logger.error('❌ Error getting unread messages count:', error);
            return 0;
        }
    }

    /**
     * Get recent activity for buyer
     */
    async getRecentActivity(buyerId) {
        try {
            const activities = [];
            
            // Get recent orders
            const recentOrders = await Order.find({ buyer: new mongoose.Types.ObjectId(buyerId) })
                .sort({ createdAt: -1 })
                .limit(3)
                .populate('seller', 'companyName')
                .lean();
            
            recentOrders.forEach(order => {
                const timeDiff = Date.now() - new Date(order.createdAt).getTime();
                const timeAgo = this.formatTimeAgo(timeDiff);
                
                activities.push({
                    icon: 'la-shopping-cart',
                    title: 'Order Placed',
                    description: `You placed an order with ${order.seller?.companyName || 'Unknown Supplier'}`,
                    timeAgo: timeAgo,
                    timestamp: order.createdAt
                });
            });
            
            // Get recent messages received
            const recentMessages = await Message.find({ 
                recipientId: new mongoose.Types.ObjectId(buyerId),
                senderId: { $ne: null } // Only user messages, not system messages
            })
                .sort({ createdAt: -1 })
                .limit(3)
                .populate('senderId', 'companyName')
                .lean();
            
            recentMessages.forEach(message => {
                const timeDiff = Date.now() - new Date(message.createdAt).getTime();
                const timeAgo = this.formatTimeAgo(timeDiff);
                
                activities.push({
                    icon: 'la-comments',
                    title: 'New Message',
                    description: `${message.senderId?.companyName || 'Unknown'} sent you a message`,
                    timeAgo: timeAgo,
                    timestamp: message.createdAt
                });
            });
            
            // Get recent favorites (if any recent activity)
            const recentFavorites = await Favorite.findOne({ buyerId: new mongoose.Types.ObjectId(buyerId) })
                .select('products suppliers')
                .lean();
            
            if (recentFavorites && recentFavorites.products.length > 0) {
                const latestFavorite = recentFavorites.products
                    .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))[0];
                
                const timeDiff = Date.now() - new Date(latestFavorite.addedAt).getTime();
                if (timeDiff < 7 * 24 * 60 * 60 * 1000) { // Within last 7 days
                    const timeAgo = this.formatTimeAgo(timeDiff);
                    activities.push({
                        icon: 'la-heart',
                        title: 'Product Favorited',
                        description: 'You added a product to favorites',
                        timeAgo: timeAgo,
                        timestamp: latestFavorite.addedAt
                    });
                }
            }
            
            // Sort all activities by timestamp and return top 5
            return activities
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 5);
                
        } catch (error) {
            this.logger.error('❌ Error getting recent activity:', error);
            return [];
        }
    }
    
    /**
     * Helper method to format time difference into human readable format
     */
    formatTimeAgo(timeDiff) {
        const minutes = Math.floor(timeDiff / (1000 * 60));
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        
        if (minutes < 60) {
            return `${minutes} minutes ago`;
        } else if (hours < 24) {
            return `${hours} hours ago`;
        } else {
            return `${days} days ago`;
        }
    }

    /**
     * Get order statistics for the buyer
     */
    async getOrderStats(buyerId) {
        try {
            // Get total orders count
            const totalOrders = await Order.countDocuments({ buyer: new mongoose.Types.ObjectId(buyerId) });
            
            // Get pending orders count
            const pendingOrders = await Order.countDocuments({ 
                buyer: new mongoose.Types.ObjectId(buyerId),
                status: 'pending'
            });
            
            // Get in transit orders count (shipped)
            const inTransitOrders = await Order.countDocuments({ 
                buyer: new mongoose.Types.ObjectId(buyerId),
                status: 'shipped'
            });
            
            // Get delivered orders count
            const deliveredOrders = await Order.countDocuments({ 
                buyer: new mongoose.Types.ObjectId(buyerId),
                status: 'delivered'
            });
            
            // Calculate delivery rate
            const deliveryRate = totalOrders > 0 ? 
                Math.round(((deliveredOrders + inTransitOrders) / totalOrders) * 100) : 0;
            
            return {
                totalOrders,
                pendingOrders,
                inTransitOrders,
                deliveredOrders,
                deliveryRate
            };

        } catch (error) {
            this.logger.error('❌ Error getting order stats:', error);
            throw error;
        }
    }

    /**
     * Create new order
     */
    async createOrder(buyerId, orderData) {
        try {
            // Validate supplier exists and is a manufacturer
            const supplier = await User.findOne({ 
                _id: new mongoose.Types.ObjectId(orderData.supplierId),
                companyType: 'manufacturer'
            });
            
            if (!supplier) {
                throw new Error('Invalid supplier');
            }

            // Generate order number
            const orderCount = await Order.countDocuments({ buyer: new mongoose.Types.ObjectId(buyerId) });
            const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(6, '0')}`;

            const order = new Order({
                buyer: new mongoose.Types.ObjectId(buyerId),
                seller: new mongoose.Types.ObjectId(orderData.supplierId),
                orderNumber: orderNumber,
                items: orderData.items || orderData.products, // Support both field names
                totalAmount: orderData.totalAmount,
                status: 'pending',
                shipping: {
                    estimatedDelivery: orderData.expectedDelivery ? new Date(orderData.expectedDelivery) : 
                        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // Default to 14 days from now
                }
            });

            const savedOrder = await order.save();
            
            // Populate supplier info for response
            await savedOrder.populate('seller', 'companyName');
            

            
            return savedOrder;

        } catch (error) {
            this.logger.error('❌ Error creating order:', error);
            throw error;
        }
    }

    /**
     * Send message to supplier
     */
    async sendMessage(buyerId, conversationId, message, attachments) {
        try {
            // Extract order ID from conversation ID (format: CONV-XXXXXX)
            const orderId = conversationId.replace('CONV-', '');
            
            // Find the order to validate it exists and belongs to the buyer
            const order = await Order.findOne({ 
                _id: new mongoose.Types.ObjectId(orderId),
                buyer: new mongoose.Types.ObjectId(buyerId)
            }).populate('seller', 'companyName');
            
            if (!order) {
                throw new Error('Order not found or does not belong to buyer');
            }

            // In a real implementation, we would create a Message document
            // For now, we'll just log the action and return a proper response
            const result = {
                conversationId,
                orderId: order._id,
                supplierId: order.seller._id,
                supplierName: order.seller.companyName,
                message: message,
                timestamp: new Date().toISOString(),
                status: 'sent'
            };

            // this.logger.log(`✅ Message sent in conversation: ${conversationId} for order: ${orderId}`);
            
            return result;

        } catch (error) {
            this.logger.error('❌ Error sending message:', error);
            throw error;
        }
    }

    /**
     * Create RFQ (Request for Quote)
     */
    async createRFQ(buyerId, rfqData) {
        try {
            // In a real implementation, we would create an RFQ document in a separate collection
            // For now, we'll simulate the creation and return a proper response
            
            // Generate RFQ ID
            const timestamp = Date.now().toString().substr(-6);
            const rfqId = `RFQ-${timestamp}`;
            
            const rfq = {
                id: rfqId,
                buyerId: buyerId,
                status: 'sent',
                title: rfqData.title,
                category: rfqData.category,
                description: rfqData.description,
                quantity: parseInt(rfqData.quantity) || 0,
                unit: rfqData.unit,
                targetPrice: parseFloat(rfqData.targetPrice) || 0,
                deadline: rfqData.deadline ? new Date(rfqData.deadline) : 
                    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
                sentTo: Array.isArray(rfqData.suppliers) ? rfqData.suppliers.length : 0,
                suppliers: rfqData.suppliers || [],
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // In a real implementation, we would save this to an RFQ collection
            // For now, we'll just log the action
            // this.logger.log(`✅ RFQ created for buyer: ${buyerId} with ID: ${rfqId}`);
            
            return rfq;

        } catch (error) {
            this.logger.error('❌ Error creating RFQ:', error);
            throw error;
        }
    }

    /**
     * Add supplier to favorites
     */
    async addFavoriteSupplier(buyerId, supplierId) {
        try {
            // In a real implementation, we would update the user's favorites list
            // For now, we'll just validate the supplier exists and log the action
            
            // Validate supplier exists and is a manufacturer
            const supplier = await User.findOne({ 
                _id: new mongoose.Types.ObjectId(supplierId),
                companyType: 'manufacturer'
            });
            
            if (!supplier) {
                throw new Error('Invalid supplier');
            }
            
            // In a real implementation, we would update the buyer's document to add the supplier to favorites
            // For now, we'll just log the action
            // this.logger.log(`✅ Supplier ${supplierId} added to favorites for buyer: ${buyerId}`);
            
            return { success: true, supplierId, buyerId };

        } catch (error) {
            this.logger.error('❌ Error adding supplier to favorites:', error);
            throw error;
        }
    }

    /**
     * Remove supplier from favorites
     */
    async removeFavoriteSupplier(buyerId, supplierId) {
        try {
            // In a real implementation, we would update the user's favorites list
            // For now, we'll just validate the supplier exists and log the action
            
            // Validate supplier exists
            const supplier = await User.findById(new mongoose.Types.ObjectId(supplierId));
            
            if (!supplier) {
                throw new Error('Invalid supplier');
            }
            
            // In a real implementation, we would update the buyer's document to remove the supplier from favorites
            // For now, we'll just log the action
            // this.logger.log(`✅ Supplier ${supplierId} removed from favorites for buyer: ${buyerId}`);
            
            return { success: true, supplierId, buyerId };

        } catch (error) {
            this.logger.error('❌ Error removing supplier from favorites:', error);
            throw error;
        }
    }

    // ===============================================
    // SETTINGS METHODS
    // ===============================================

    /**
     * Update user profile information
     */
    async updateProfile(buyerId, updateData) {
        try {
            // Validate email uniqueness
            if (updateData.email) {
                const existingUser = await User.findOne({ 
                    email: updateData.email,
                    _id: { $ne: buyerId }
                });
                
                if (existingUser) {
                    throw new Error('Email address is already in use');
                }
            }

            // Update user profile
            const updatedUser = await User.findByIdAndUpdate(
                buyerId,
                {
                    $set: {
                        companyName: updateData.companyName,
                        contactPerson: updateData.contactPerson,
                        email: updateData.email,
                        phone: updateData.phone,
                        country: updateData.country,
                        address: updateData.address,
                        updatedAt: new Date()
                    }
                },
                { new: true, runValidators: true }
            );

            if (!updatedUser) {
                throw new Error('User not found');
            }

            // this.logger.log(`✅ Profile updated for buyer: ${buyerId}`);
            return updatedUser;

        } catch (error) {
            this.logger.error('❌ Error updating profile:', error);
            throw error;
        }
    }



    /**
     * Update buyer profile information
     */
    async updateProfile(buyerId, updateData) {
        try {
            // this.logger.log(`👤 Updating profile for buyer: ${buyerId}`);

            // Find buyer
            const buyer = await User.findById(buyerId);
            if (!buyer) {
                throw new Error('Buyer topilmadi');
            }

            // Validate email if being updated
            if (updateData.email && updateData.email !== buyer.email) {
                const existingUser = await User.findOne({ 
                    email: updateData.email, 
                    _id: { $ne: buyerId } 
                });
                if (existingUser) {
                    throw new Error('Bu email allaqachon ishlatilmoqda');
                }
            }

            // Update fields
            if (updateData.companyName) buyer.companyName = updateData.companyName;
            if (updateData.contactPerson) buyer.contactPerson = updateData.contactPerson;
            if (updateData.email) buyer.email = updateData.email;
            if (updateData.phone) buyer.phone = updateData.phone;
            if (updateData.country) buyer.country = updateData.country;
            if (updateData.address) buyer.address = updateData.address;

            buyer.updatedAt = new Date();
            await buyer.save();

            // this.logger.log(`✅ Profile updated successfully for buyer: ${buyerId}`);
            return buyer;

        } catch (error) {
            this.logger.error('❌ Update profile error:', error);
            throw error;
        }
    }

    /**
     * Update notification preferences
     */
    async updateNotifications(buyerId, notificationSettings) {
        try {
            // this.logger.log(`🔔 Updating notifications for buyer: ${buyerId}`);

            // Find buyer
            const buyer = await User.findById(buyerId);
            if (!buyer) {
                throw new Error('Buyer topilmadi');
            }

            // Update notification settings directly on user object
            buyer.emailNotifications = notificationSettings.emailNotifications || false;
            buyer.orderUpdates = notificationSettings.orderUpdates || false;
            buyer.marketingEmails = notificationSettings.marketingEmails || false;
            buyer.priceAlerts = notificationSettings.priceAlerts || false;
            buyer.weeklyDigest = notificationSettings.weeklyDigest || false;
            buyer.updatedAt = new Date();

            await buyer.save();

            // this.logger.log(`✅ Notifications updated successfully for buyer: ${buyerId}`);
            return buyer;

        } catch (error) {
            this.logger.error('❌ Error updating notifications:', error);
            throw error;
        }
    }

    /**
     * Get user settings
     */
    async getUserSettings(buyerId) {
        try {
            const user = await User.findById(buyerId).select(
                'companyName contactPerson email phone country address ' +
                'emailNotifications marketingEmails language timezone currency'
            );

            if (!user) {
                throw new Error('User not found');
            }

            return user;

        } catch (error) {
            this.logger.error('❌ Error getting user settings:', error);
            throw error;
        }
    }

    /**
     * Update buyer avatar/profile picture
     */
    async updateCompanyLogo(buyerId, file) {
        try {


            const path = require('path');
            const fs = require('fs');

            // Validate file
            if (!file) {
                throw new Error('Fayl yuklanmadi');
            }

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
            if (!allowedTypes.includes(file.mimetype)) {
                throw new Error('Faqat JPG, PNG, WebP formatdagi rasmlar qabul qilinadi');
            }

            // Validate file size (5MB max)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                throw new Error('Fayl hajmi 5MB dan kichik bo\'lishi kerak');
            }

            // Create buyer avatars directory
            const avatarDir = path.join(__dirname, '../public/uploads/buyers/avatars');
            if (!fs.existsSync(avatarDir)) {
                fs.mkdirSync(avatarDir, { recursive: true });
            }

            // Generate unique filename with original extension
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(2, 15);
            const originalExt = path.extname(file.originalname) || '.jpg';
            const filename = `buyer_avatar_${buyerId}_${timestamp}_${randomStr}${originalExt}`;
            const avatarPath = path.join(avatarDir, filename);

            // Try to use Sharp for image processing, fallback to simple copy
            try {
                const sharp = require('sharp');
                    // Process image with sharp
                await sharp(file.path)
                    .resize(300, 300, {
                        fit: 'cover',
                        position: 'center'
                    })
                    .jpeg({ quality: 90 }) // Use JPEG instead of WebP for better compatibility
                    .toFile(avatarPath);
                    

            } catch (sharpError) {
                // Fallback to simple file copy
                fs.copyFileSync(file.path, avatarPath);
            }

            // Clean up temporary file
            try {
                fs.unlinkSync(file.path);
            } catch (cleanupError) {
                // Ignore cleanup errors
            }

            // Find buyer and delete old avatar
            const buyer = await User.findById(buyerId);
            if (!buyer) {
                throw new Error('Buyer topilmadi');
            }

            // Delete old avatar file if exists
            if (buyer.avatar) {
                const oldAvatarPath = path.join(__dirname, '../public', buyer.avatar);
                try {
                    if (fs.existsSync(oldAvatarPath)) {
                        fs.unlinkSync(oldAvatarPath);
                    }
                } catch (deleteError) {
                    // Ignore delete errors
                }
            }

            // Update buyer company logo in database
            const logoUrl = `/uploads/buyers/avatars/${filename}`;
            buyer.companyLogo = {
                filename: filename,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                uploadDate: new Date(),
                url: logoUrl
            };
            buyer.updatedAt = new Date();
            await buyer.save();



            return logoUrl;

        } catch (error) {
            this.logger.error('❌ Update avatar error:', error);
            
            // Clean up file on error
            if (file?.path) {
                try {
                    const fs = require('fs');
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                } catch (cleanupError) {
                    this.logger.warn('Failed to clean up file on error:', cleanupError);
                }
            }
            
            throw error;
        }
    }

    /**
     * Delete buyer avatar
     */
    async deleteCompanyLogo(buyerId) {
        try {
            // this.logger.log(`🗑️ Deleting avatar for buyer: ${buyerId}`);

            const path = require('path');
            const fs = require('fs');

            // Find buyer
            const buyer = await User.findById(buyerId);
            if (!buyer) {
                throw new Error('Buyer topilmadi');
            }

            // Delete avatar file if exists
            if (buyer.avatar) {
                const avatarPath = path.join(__dirname, '../public', buyer.avatar);
                try {
                    if (fs.existsSync(avatarPath)) {
                        fs.unlinkSync(avatarPath);
                        // this.logger.log(`✅ Deleted avatar file: ${avatarPath}`);
                    }
                } catch (deleteError) {
                    this.logger.warn('Failed to delete avatar file:', deleteError);
                }
            }

            // Update buyer in database  
            buyer.companyLogo = null;
            buyer.updatedAt = new Date();
            await buyer.save();

            // this.logger.log(`✅ Avatar deleted successfully for buyer: ${buyerId}`);

        } catch (error) {
            this.logger.error('❌ Delete avatar error:', error);
            throw error;
        }
    }

    /**
     * Update buyer notifications settings
     */
    async updateNotifications(buyerId, notificationSettings) {
        try {
            // this.logger.log(`🔔 Updating notifications for buyer: ${buyerId}`);

            // Find buyer
            const buyer = await User.findById(buyerId);
            if (!buyer) {
                throw new Error('Buyer topilmadi');
            }

            // Update notification settings
            buyer.notificationSettings = {
                ...buyer.notificationSettings,
                ...notificationSettings,
                updatedAt: new Date()
            };
            buyer.updatedAt = new Date();
            await buyer.save();

            // this.logger.log(`✅ Notifications updated successfully for buyer: ${buyerId}`);

            return buyer;

        } catch (error) {
            this.logger.error('❌ Update notifications error:', error);
            throw error;
        }
    }

    /**
     * Update buyer preferences
     */
    async updatePreferences(buyerId, preferences) {
        try {
            // this.logger.log(`⚙️ Updating preferences for buyer: ${buyerId}`);

            // Find buyer
            const buyer = await User.findById(buyerId);
            if (!buyer) {
                throw new Error('Buyer topilmadi');
            }

            // Update preferences
            buyer.preferences = {
                ...buyer.preferences,
                ...preferences,
                updatedAt: new Date()
            };

            // Also update main fields if they exist in preferences
            if (preferences.language) {
                buyer.preferredLanguage = preferences.language;
            }

            buyer.updatedAt = new Date();
            await buyer.save();

            // this.logger.log(`✅ Preferences updated successfully for buyer: ${buyerId}`);

            return buyer;

        } catch (error) {
            this.logger.error('❌ Update preferences error:', error);
            throw error;
        }
    }

    /**
     * Update buyer password
     */
    async updatePassword(buyerId, currentPassword, newPassword) {
        try {
            // this.logger.log(`🔒 Updating password for buyer: ${buyerId}`);

            const bcrypt = require('bcrypt');

            // Find buyer
            const buyer = await User.findById(buyerId);
            if (!buyer) {
                throw new Error('Buyer topilmadi');
            }

            // Verify current password
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, buyer.password);
            if (!isCurrentPasswordValid) {
                throw new Error('Joriy parol noto\'g\'ri');
            }

            // Hash new password
            const saltRounds = 12;
            const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

            // Update password
            buyer.password = hashedNewPassword;
            buyer.passwordChangedAt = new Date();
            buyer.updatedAt = new Date();
            await buyer.save();

            // this.logger.log(`✅ Password updated successfully for buyer: ${buyerId}`);

            return { success: true, message: 'Parol muvaffaqiyatli yangilandi' };

        } catch (error) {
            this.logger.error('❌ Update password error:', error);
            throw error;
        }
    }

    // ===============================================
    // CART MANAGEMENT METHODS
    // ===============================================

    /**
     * Update cart item quantity
     */
    async updateCartItem(buyerId, itemId, quantity) {
        try {
            // Find the cart for this buyer
            const cart = await Cart.findOne({ buyerId: new mongoose.Types.ObjectId(buyerId) });
            
            if (!cart) {
                throw new Error('Cart not found');
            }

            // Find the specific item in the cart
            const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
            
            if (itemIndex === -1) {
                throw new Error('Cart item not found');
            }

            // Update the item quantity and total price
            cart.items[itemIndex].quantity = quantity;
            cart.items[itemIndex].totalPrice = quantity * cart.items[itemIndex].unitPrice;
            
            // Save the cart
            await cart.save();

            return {
                itemId: cart.items[itemIndex]._id,
                quantity: cart.items[itemIndex].quantity,
                unitPrice: cart.items[itemIndex].unitPrice,
                totalPrice: cart.items[itemIndex].totalPrice
            };

        } catch (error) {
            this.logger.error('❌ Update cart item error:', error);
            throw error;
        }
    }

    /**
     * Remove single item from cart
     */
    async removeFromCart(buyerId, itemId) {
        try {
            // Find the cart for this buyer
            const cart = await Cart.findOne({ buyerId: new mongoose.Types.ObjectId(buyerId) });
            
            if (!cart) {
                throw new Error('Cart not found');
            }

            // Remove the item from cart
            cart.items = cart.items.filter(item => item._id.toString() !== itemId);
            
            // Save the cart
            await cart.save();

            return { success: true, message: 'Item removed from cart' };

        } catch (error) {
            this.logger.error('❌ Remove cart item error:', error);
            throw error;
        }
    }

    /**
     * Remove multiple items from cart
     */
    async removeMultipleFromCart(buyerId, itemIds) {
        try {
            // Find the cart for this buyer
            const cart = await Cart.findOne({ buyerId: new mongoose.Types.ObjectId(buyerId) });
            
            if (!cart) {
                throw new Error('Cart not found');
            }

            // Remove multiple items from cart
            cart.items = cart.items.filter(item => !itemIds.includes(item._id.toString()));
            
            // Save the cart
            await cart.save();

            return { success: true, message: `${itemIds.length} items removed from cart` };

        } catch (error) {
            this.logger.error('❌ Remove multiple cart items error:', error);
            throw error;
        }
    }

    /**
     * Add product to favorites
     */
    async addToFavorites(buyerId, productId) {
        try {
            // Check if product already in favorites
            const existingFavorite = await Favorite.findOne({
                buyer: new mongoose.Types.ObjectId(buyerId),
                product: new mongoose.Types.ObjectId(productId)
            });

            if (existingFavorite) {
                return { success: false, message: 'Product already in favorites' };
            }

            // Add to favorites
            const favorite = new Favorite({
                buyer: new mongoose.Types.ObjectId(buyerId),
                product: new mongoose.Types.ObjectId(productId)
            });

            await favorite.save();

            return { success: true, message: 'Product added to favorites' };

        } catch (error) {
            this.logger.error('❌ Add to favorites error:', error);
            throw error;
        }
    }
}

module.exports = BuyerService;