/**
 * Manufacturer Products API Routes
 * Professional B2B Marketplace Integration
 * Senior Software Engineer Level Implementation
 */

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Product = require('../../models/Product');
const { authenticate, manufacturerOnly } = require('../../middleware/jwtAuth');
const { body, validationResult } = require('express-validator');

// Note: Using manufacturerOnly middleware from jwtAuth instead of custom requireManufacturer

/**
 * Get products statistics for KPI dashboard  
 * GET /api/manufacturer/products/stats
 * IMPORTANT: This route MUST be defined BEFORE /:productId routes to avoid conflicts
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
            
            // Get aggregated statistics with enhanced error handling
            const stats = await Product.aggregate([
                { $match: { manufacturer: new mongoose.Types.ObjectId(manufacturerId) } },
                {
                    $group: {
                        _id: null,
                        totalProducts: { $sum: 1 },
                        activeProducts: {
                            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
                        },
                        draftProducts: {
                            $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] }
                        },
                        inactiveProducts: {
                            $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] }
                        },
                        marketplaceProducts: {
                            $sum: { $cond: [{ $eq: ["$visibility", "public"] }, 1, 0] }
                        },
                        totalViews: { $sum: { $ifNull: ["$analytics.views", 0] } },
                        totalOrders: { $sum: { $ifNull: ["$analytics.orders", 0] } },
                        totalInquiries: { $sum: { $ifNull: ["$analytics.inquiries", 0] } }
                    }
                }
            ]);
            
            const result = stats.length > 0 ? stats[0] : {
                totalProducts: 0,
                activeProducts: 0,
                draftProducts: 0,
                inactiveProducts: 0,
                marketplaceProducts: 0,
                totalViews: 0,
                totalOrders: 0,
                totalInquiries: 0
            };
            
            // Remove _id from result
            delete result._id;
            
             res.json({
                success: true,
                data: result,
                totalProducts: result.totalProducts,
                activeProducts: result.activeProducts,
                draftProducts: result.draftProducts,
                inactiveProducts: result.inactiveProducts,
                marketplaceProducts: result.marketplaceProducts,
                totalViews: result.totalViews,
                totalOrders: result.totalOrders,
                totalInquiries: result.totalInquiries,
                message: 'Products statistics retrieved successfully'
            });
            
        } catch (error) {
            console.error('❌ Get products stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve products statistics',
                code: 'SERVER_ERROR'
            });
        }
    }
);

// Middleware to validate product ownership
const validateProductOwnership = async (req, res, next) => {
    try {
        const productId = req.params.productId || req.params.id;
        const manufacturerId = req.user?._id || req.user?.userId;
        
        if (!manufacturerId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }
        
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format',
                code: 'INVALID_PRODUCT_ID'
            });
        }
        
        const product = await Product.findOne({
            _id: productId,
            manufacturer: manufacturerId
        });
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found or access denied',
                code: 'PRODUCT_NOT_FOUND'
            });
        }
        
        req.product = product;
        next();
    } catch (error) {
        console.error('❌ Product ownership validation error:', error);
        
        // Handle specific MongoDB errors
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format',
                code: 'INVALID_PRODUCT_ID'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error validating product ownership',
            code: 'SERVER_ERROR'
        });
    }
};

/**
 * Toggle marketplace status for single product
 * POST /api/manufacturer/products/:productId/marketplace/:action
 * PATCH /api/manufacturer/products/:productId/marketplace (with action in body)
 */
router.post('/:productId/marketplace/:action', 
    authenticate, 
    manufacturerOnly, 
    validateProductOwnership,
    async (req, res) => {
        try {
            const { action } = req.params;
            const product = req.product;
            
            if (!['publish', 'unpublish'].includes(action)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid action. Use "publish" or "unpublish"'
                });
            }
            
            // Validate product can be published with smart auto-activation
            if (action === 'publish') {
                // Auto-activate product if it's in draft status for better UX
                if (product.status === 'draft') {
                    product.status = 'active';
                } else if (!['active', 'draft'].includes(product.status)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Only active or draft products can be published to marketplace',
                        code: 'INVALID_PRODUCT_STATUS'
                    });
                }
                
                if (!product.images || product.images.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Product must have at least one image to be published'
                    });
                }
                
                if (!product.pricing || !product.pricing.basePrice) {
                    return res.status(400).json({
                        success: false,
                        message: 'Product must have pricing information to be published'
                    });
                }
            }
            
            // Update marketplace status
            if (action === 'publish') {
                product.visibility = 'public';
                product.status = 'active'; // Ensure it's active when publishing
                await product.save();
            } else {
                product.visibility = 'private';
                await product.save();
            }
            
            res.json({
                success: true,
                message: `Product ${action === 'publish' ? 'published to' : 'removed from'} marketplace successfully`,
                data: {
                    productId: product._id,
                    marketplaceStatus: action === 'publish' ? 'published' : 'unpublished',
                    visibility: product.visibility
                }
            });
            
        } catch (error) {
            console.error('❌ Marketplace toggle error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update marketplace status'
            });
        }
    }
);

/**
 * Toggle marketplace status - PATCH method support
 * PATCH /api/manufacturer/products/:productId/marketplace
 */
router.patch('/:productId/marketplace',
    authenticate,
    manufacturerOnly,
    validateProductOwnership,
    async (req, res) => {
        try {
            const { action } = req.body;
            const product = req.product;
            
            if (!action || !['publish', 'unpublish'].includes(action)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid action. Use "publish" or "unpublish" in request body'
                });
            }
            
            // Validate product can be published with smart auto-activation
            if (action === 'publish') {
                // Auto-activate product if it's in draft status for better UX
                if (product.status === 'draft') {
                    product.status = 'active';
                } else if (!['active', 'draft'].includes(product.status)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Only active or draft products can be published to marketplace',
                        code: 'INVALID_PRODUCT_STATUS'
                    });
                }
                
                if (!product.images || product.images.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Product must have at least one image to be published'
                    });
                }
                
                if (!product.pricing || !product.pricing.basePrice) {
                    return res.status(400).json({
                        success: false,
                        message: 'Product must have pricing information to be published'
                    });
                }
            }
            
            // Update marketplace status
            if (action === 'publish') {
                product.visibility = 'public';
                product.status = 'active'; // Ensure it's active when publishing
                product.publishedAt = new Date(); // Add published timestamp
                await product.save();
            } else {
                product.visibility = 'private';
                product.unpublishedAt = new Date(); // Add unpublished timestamp
                await product.save();
            }
            
            res.json({
                success: true,
                message: `Product ${action === 'publish' ? 'published to' : 'removed from'} marketplace successfully`,
                data: {
                    productId: product._id,
                    marketplaceStatus: action === 'publish' ? 'published' : 'unpublished',
                    visibility: product.visibility,
                    action: action
                }
            });
            
        } catch (error) {
            console.error('❌ Marketplace toggle error (PATCH):', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update marketplace status'
            });
        }
    }
);

/**
 * Bulk marketplace toggle
 * POST /api/manufacturer/products/bulk/marketplace/:action
 */
router.post('/bulk/marketplace/:action',
    authenticate,
    manufacturerOnly,
    [
        body('productIds').isArray().withMessage('Product IDs must be an array'),
        body('productIds.*').isMongoId().withMessage('Invalid product ID format')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }
            
            const { action } = req.params;
            const { productIds } = req.body;
            const manufacturerId = req.user?._id || req.user?.userId;
            
            if (!['publish', 'unpublish'].includes(action)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid action. Use "publish" or "unpublish"'
                });
            }
            
            // Find products owned by manufacturer
            const products = await Product.find({
                _id: { $in: productIds },
                manufacturer: manufacturerId
            });
            
            if (products.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No valid products found'
                });
            }
            
            // Filter products that can be updated
            let validProducts = products;
            
            if (action === 'publish') {
                validProducts = products.filter(product => 
                    product.status === 'active' && 
                    product.images && 
                    product.images.length > 0 &&
                    product.pricing &&
                    product.pricing.basePrice
                );
            }
            
            if (validProducts.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: action === 'publish' 
                        ? 'No products meet the requirements for marketplace publishing'
                        : 'No products available for unpublishing'
                });
            }
            
            // Update products
            const updateData = action === 'publish' 
                ? { visibility: 'public', status: 'active' }
                : { visibility: 'private' };
            
            const result = await Product.updateMany(
                { _id: { $in: validProducts.map(p => p._id) } },
                { $set: updateData }
            );
            
            res.json({
                success: true,
                message: `${result.matchedCount} products ${action === 'publish' ? 'published to' : 'removed from'} marketplace`,
                data: {
                    affectedCount: result.matchedCount,
                    modifiedCount: result.modifiedCount,
                    action: action
                }
            });
            
        } catch (error) {
            console.error('❌ Bulk marketplace toggle error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to perform bulk marketplace operation'
            });
        }
    }
);

/**
 * Bulk status change
 * POST /api/manufacturer/products/bulk/status
 */
router.post('/bulk/status',
    authenticate,
    manufacturerOnly,
    [
        body('productIds').isArray().withMessage('Product IDs must be an array'),
        body('productIds.*').isMongoId().withMessage('Invalid product ID format'),
        body('status').isIn(['active', 'inactive', 'draft', 'discontinued']).withMessage('Invalid status')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }
            
            const { productIds, status } = req.body;
            const manufacturerId = req.user?._id || req.user?.userId;
            
            // Update products owned by manufacturer
            const result = await Product.updateMany(
                { 
                    _id: { $in: productIds },
                    manufacturer: manufacturerId
                },
                { 
                    $set: { 
                        status: status,
                        // If setting to inactive/draft/discontinued, remove from marketplace
                        ...(status !== 'active' && { visibility: 'private' })
                    }
                }
            );
            
            if (result.matchedCount === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No valid products found'
                });
            }
            
            res.json({
                success: true,
                message: `${result.matchedCount} products status updated to ${status}`,
                data: {
                    affectedCount: result.matchedCount,
                    modifiedCount: result.modifiedCount,
                    newStatus: status
                }
            });
            
        } catch (error) {
            console.error('❌ Bulk status change error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to perform bulk status change'
            });
        }
    }
);

/**
 * Duplicate product
 * POST /api/manufacturer/products/:productId/duplicate
 */
router.post('/:productId/duplicate',
    authenticate,
    manufacturerOnly,
    validateProductOwnership,
    async (req, res) => {
        try {
            const originalProduct = req.product;
            
            // Create duplicate with modified data
            const duplicateData = {
                ...originalProduct.toObject(),
                _id: undefined, // Remove ID for new document
                name: `${originalProduct.name} (Copy)`,
                status: 'draft', // New products start as draft
                visibility: 'private', // Not published to marketplace
                createdAt: undefined,
                updatedAt: undefined,
                analytics: {
                    views: 0,
                    inquiries: 0,
                    orders: 0,
                    uniqueViewers: 0,
                    conversionRate: 0
                },
                businessMetrics: {
                    totalRevenue: 0,
                    totalOrdersCount: 0,
                    averageOrderValue: 0,
                    totalQuantitySold: 0,
                    monthlyRevenue: [],
                    popularityRank: 0
                }
            };
            
            const duplicateProduct = new Product(duplicateData);
            await duplicateProduct.save();
            
            res.json({
                success: true,
                message: 'Product duplicated successfully',
                data: {
                    originalId: originalProduct._id,
                    duplicateId: duplicateProduct._id,
                    duplicateName: duplicateProduct.name
                }
            });
            
        } catch (error) {
            console.error('❌ Product duplication error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to duplicate product'
            });
        }
    }
);

/**
 * Archive product
 * POST /api/manufacturer/products/:productId/archive
 */
router.post('/:productId/archive',
    authenticate,
    manufacturerOnly,
    validateProductOwnership,
    async (req, res) => {
        try {
            const product = req.product;
            
            // Archive by setting status and removing from marketplace
            product.status = 'discontinued';
            product.visibility = 'private';
            await product.save();
            
            res.json({
                success: true,
                message: 'Product archived successfully',
                data: {
                    productId: product._id,
                    status: product.status
                }
            });
            
        } catch (error) {
            console.error('❌ Product archiving error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to archive product'
            });
        }
    }
);

/**
 * Delete product
 * DELETE /api/manufacturer/products/:productId
 */
router.delete('/:productId',
    authenticate,
    manufacturerOnly,
    validateProductOwnership,
    async (req, res) => {
        try {
            const product = req.product;
            
            // Check if product has orders (prevent deletion if has orders)
            // This would require Order model check - simplified for now
            
            await Product.findByIdAndDelete(product._id);
            
            res.json({
                success: true,
                message: 'Product deleted successfully',
                data: {
                    deletedProductId: product._id
                }
            });
            
        } catch (error) {
            console.error('❌ Product deletion error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete product'
            });
        }
    }
);

/**
 * Get detailed product information
 * GET /api/manufacturer/products/:productId/details
 */
router.get('/:productId/details',
    authenticate,
    manufacturerOnly,
    validateProductOwnership,
    async (req, res) => {
        try {
            const product = req.product;
            
            // Populate related data for comprehensive details
            await product.populate([
                { path: 'category', select: 'name slug' },
                { path: 'manufacturer', select: 'companyName email phone' }
            ]);
            
            // Calculate additional metrics
            const metrics = {
                views: product.analytics?.views || 0,
                totalOrders: product.analytics?.totalOrders || 0,
                totalRevenue: product.analytics?.totalRevenue || 0,
                lastOrderDate: product.analytics?.lastOrderDate || null,
                averageRating: product.analytics?.averageRating || 0
            };
            
            // Enhanced product data
            const detailedProduct = {
                ...product.toObject(),
                metrics,
                specifications: product.specifications || {},
                attributes: product.attributes || {},
                seo: product.seo || {},
                marketplaceInfo: {
                    isPublished: product.visibility === 'public',
                    publishedDate: product.publishedAt || null,
                    marketplaceCategory: product.marketplaceCategory || null
                }
            };
            
            res.json({
                success: true,
                data: detailedProduct,
                message: 'Product details retrieved successfully'
            });
            
        } catch (error) {
            console.error('❌ Get product details error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve product details'
            });
        }
    }
);

/**
 * Auto-save product draft
 * POST /api/manufacturer/products/:productId/autosave
 */
router.post('/:productId/autosave',
    authenticate,
    manufacturerOnly,
    validateProductOwnership,
    async (req, res) => {
        try {
            const productId = req.params.productId;
            const manufacturerId = req.user?._id || req.user?.userId;
            const updateData = req.body;
            
            if (!productId || !manufacturerId) {
                return res.status(400).json({
                    success: false,
                    message: 'Product ID and manufacturer ID are required'
                });
            }
            
            const product = await Product.findOne({
                _id: productId,
                manufacturer: manufacturerId
            });
            
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
            
            // Update only specific fields for auto-save
            const allowedFields = ['name', 'description', 'shortDescription', 'pricing', 'inventory', 'shipping'];
            const updateFields = {};
            
            allowedFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    updateFields[field] = updateData[field];
                }
            });
            
            // Add timestamp
            updateFields.lastAutoSaved = new Date();
            
            // Update the product
            await Product.findByIdAndUpdate(productId, { $set: updateFields });
            
            res.json({
                success: true,
                message: 'Product auto-saved successfully',
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('Auto-save error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to auto-save product'
            });
        }
    }
);

/**
 * Get product analytics
 * GET /api/manufacturer/products/:productId/analytics
 */
router.get('/:productId/analytics',
    authenticate,
    manufacturerOnly,
    validateProductOwnership,
    async (req, res) => {
        try {
            const productId = req.params.productId;
            const manufacturerId = req.user?._id || req.user?.userId;
            
            if (!manufacturerId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
            }

            // Validate product ID format
            if (!mongoose.Types.ObjectId.isValid(productId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid product ID format',
                    code: 'INVALID_PRODUCT_ID'
                });
            }

            // Get product analytics from service
            const ManufacturerService = require('../../services/ManufacturerService');
            const manufacturerService = new ManufacturerService();
            const analytics = await manufacturerService.getProductAnalytics(productId, manufacturerId);
            
            res.json({
                success: true,
                data: analytics,
                message: 'Product analytics retrieved successfully'
            });
            
        } catch (error) {
            console.error('❌ Get product analytics error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve product analytics'
            });
        }
    }
);

/**
 * Get basic product information
 * GET /api/manufacturer/products/:productId
 */
router.get('/:productId',
    authenticate,
    manufacturerOnly,
    validateProductOwnership,
    async (req, res) => {
        try {
            const product = req.product;
            
            res.json({
                success: true,
                data: product,
                message: 'Product retrieved successfully'
            });
            
        } catch (error) {
            console.error('❌ Get product error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve product'
            });
        }
    }
);

/**
 * Add shipping methods to existing product (migration helper)
 * POST /api/manufacturer/products/:productId/migrate-shipping-methods
 */
router.post('/:productId/migrate-shipping-methods',
    authenticate,
    manufacturerOnly,
    validateProductOwnership,
    async (req, res) => {
        try {
            const productId = req.params.productId;
            const manufacturerId = req.user?._id || req.user?.userId;
            
            if (!productId || !manufacturerId) {
                return res.status(400).json({
                    success: false,
                    message: 'Product ID and manufacturer ID are required'
                });
            }
            
            const product = await Product.findOne({
                _id: productId,
                manufacturer: manufacturerId
            });
            
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
            
            // Set default shipping methods based on shipping class
            let defaultMethods = ['standard']; // Default method
            
            if (product.shipping && product.shipping.shippingClass) {
                switch (product.shipping.shippingClass) {
                    case 'fragile':
                        defaultMethods = ['standard', 'express'];
                        break;
                    case 'hazardous':
                        defaultMethods = ['standard'];
                        break;
                    case 'perishable':
                        defaultMethods = ['express', 'overnight'];
                        break;
                    case 'oversized':
                        defaultMethods = ['standard', 'pickup'];
                        break;
                    default:
                        defaultMethods = ['standard', 'express'];
                }
            }
            
            // Update the product with shipping methods
            const updatedProduct = await Product.findByIdAndUpdate(
                productId,
                { 
                    $set: { 
                        'shipping.methods': defaultMethods 
                    } 
                },
                { new: true }
            );
            
            res.json({
                success: true,
                data: {
                    productId: productId,
                    shippingMethods: defaultMethods,
                    product: updatedProduct
                },
                message: 'Shipping methods added successfully'
            });
            
        } catch (error) {
            console.error('❌ Add shipping methods error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add shipping methods'
            });
        }
    }
);

module.exports = router;