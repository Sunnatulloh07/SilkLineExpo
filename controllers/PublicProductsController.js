/**
 * Public Products Controller
 * Professional B2B Marketplace API Controller
 * Senior Software Engineer Level Implementation
 * Handles all public product-related operations with advanced features
 */

const { validationResult } = require('express-validator');
const PublicProductsService = require('../services/PublicProductsService');
const Logger = require('../utils/Logger');

class PublicProductsController {
    constructor() {
        this.service = new PublicProductsService();
        this.logger = new Logger('PublicProductsController');
    }

    /**
     * Get products with advanced filtering, search, and pagination
     * GET /api/public/products
     */
    async getProducts(req, res) {
        try {
            // Validate input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                    code: 'VALIDATION_ERROR'
                });
            }

            // Extract and sanitize query parameters
            const filters = this._extractFilters(req.query);
            
            
            // Get products from service
            const result = await this.service.getProducts(filters);

            // Log performance metrics
            const responseTime = Date.now() - (req.startTime || Date.now());



            // Return standardized response
            res.status(200).json({
                success: true,
                data: {
                    products: result.products,
                    pagination: result.pagination,
                    filters: result.appliedFilters,
                    metadata: {
                        totalCategories: result.metadata?.totalCategories || 0,
                        totalManufacturers: result.metadata?.totalManufacturers || 0,
                        priceRange: result.metadata?.priceRange || { min: 0, max: 0 },
                        responseTime: `${responseTime}ms`,
                        fromCache: result.fromCache || false
                    }
                },
                message: 'Products retrieved successfully'
            });

        } catch (error) {
            this.logger.error('❌ Get products error:', error);
            
            // Handle specific error types
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid filter parameters',
                    error: error.message,
                    code: 'VALIDATION_ERROR'
                });
            }

            if (error.name === 'DatabaseError') {
                return res.status(503).json({
                    success: false,
                    message: 'Database temporarily unavailable',
                    code: 'DATABASE_ERROR'
                });
            }

            // Generic error response
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve products',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
                code: 'SERVER_ERROR'
            });
        }
    }

    /**
     * Get all available categories with product counts
     * GET /api/public/products/categories
     */
    async getCategories(req, res) {
        try {
             const categories = await this.service.getCategories();

            res.status(200).json({
                success: true,
                data: {
                    categories,
                    total: categories.length
                },
                message: 'Categories retrieved successfully'
            });

        } catch (error) {
            this.logger.error('❌ Get categories error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve categories',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
                code: 'SERVER_ERROR'
            });
        }
    }

    /**
     * Get all available manufacturers with product counts
     * GET /api/public/products/manufacturers
     */
    async getManufacturers(req, res) {
        try {

            const manufacturers = await this.service.getManufacturers();

            res.status(200).json({
                success: true,
                data: {
                    manufacturers,
                    total: manufacturers.length
                },
                message: 'Manufacturers retrieved successfully'
            });

        } catch (error) {
            this.logger.error('❌ Get manufacturers error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve manufacturers',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
                code: 'SERVER_ERROR'
            });
        }
    }

    /**
     * Get available filter options
     * GET /api/public/products/filters
     */
    async getFilterOptions(req, res) {
        try {


            const filterOptions = await this.service.getFilterOptions();

            res.status(200).json({
                success: true,
                data: filterOptions,
                message: 'Filter options retrieved successfully'
            });

        } catch (error) {
            this.logger.error('❌ Get filter options error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve filter options',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
                code: 'SERVER_ERROR'
            });
        }
    }

    /**
     * Advanced product search with autocomplete
     * GET /api/public/products/search
     */
    async searchProducts(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                    code: 'VALIDATION_ERROR'
                });
            }

            const { q: query, limit = 10 } = req.query;
            


            const results = await this.service.searchProducts(query, parseInt(limit));

            res.status(200).json({
                success: true,
                data: {
                    results: results.products,
                    suggestions: results.suggestions,
                    total: results.total,
                    query
                },
                message: 'Search completed successfully'
            });

        } catch (error) {
            this.logger.error('❌ Search products error:', error);
            res.status(500).json({
                success: false,
                message: 'Search failed',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
                code: 'SEARCH_ERROR'
            });
        }
    }

    /**
     * Get featured/trending products
     * GET /api/public/products/featured
     */
    async getFeaturedProducts(req, res) {
        try {
            const { limit = 8 } = req.query;
            


            const featuredProducts = await this.service.getFeaturedProducts(parseInt(limit));

            res.status(200).json({
                success: true,
                data: {
                    products: featuredProducts,
                    total: featuredProducts.length
                },
                message: 'Featured products retrieved successfully'
            });

        } catch (error) {
            this.logger.error('❌ Get featured products error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve featured products',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
                code: 'SERVER_ERROR'
            });
        }
    }

    /**
     * Get marketplace statistics
     * GET /api/public/products/stats
     */
    async getMarketplaceStats(req, res) {
        try {


            const stats = await this.service.getMarketplaceStats();

            res.status(200).json({
                success: true,
                data: stats,
                message: 'Marketplace statistics retrieved successfully'
            });

        } catch (error) {
            this.logger.error('❌ Get marketplace stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve marketplace statistics',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
                code: 'SERVER_ERROR'
            });
        }
    }

    /**
     * Get single product details
     * GET /api/public/products/:productId
     */
    async getProductDetails(req, res) {
        try {
            const { productId } = req.params;
            


            const product = await this.service.getProductDetails(productId);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found',
                    code: 'PRODUCT_NOT_FOUND'
                });
            }
            console.log("product details :", product);
            res.status(200).json({
                success: true,
                data: { product },
                message: 'Product details retrieved successfully'
            });

        } catch (error) {
            this.logger.error('❌ Get product details error:', error);
            
            if (error.name === 'CastError') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid product ID format',
                    code: 'INVALID_ID'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to retrieve product details',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined,
                code: 'SERVER_ERROR'
            });
        }
    }

    /**
     * Extract and sanitize filters from query parameters
     * @private
     */
    _extractFilters(query) {
        const {
            page = 1,
            limit = 12,
            search,
            category,
            manufacturer,
            priceMin,
            priceMax,
            rating,
            sort = 'newest',
            featured,
            inStock
        } = query;

        // Build filters object
        const filters = {
            page: parseInt(page),
            limit: Math.min(parseInt(limit), 50), // Cap at 50 items
            sort: sort || 'newest'
        };

        // Add optional filters only if provided
        if (search && search.trim()) {
            filters.search = search.trim();
        }

        if (category && category.trim()) {
            filters.category = category.trim();
        }

        if (manufacturer && manufacturer.trim()) {
            filters.manufacturer = manufacturer.trim();
        }

        if (priceMin !== undefined && !isNaN(parseFloat(priceMin))) {
            filters.priceMin = parseFloat(priceMin);
        }

        if (priceMax !== undefined && !isNaN(parseFloat(priceMax))) {
            filters.priceMax = parseFloat(priceMax);
        }

        if (rating !== undefined && !isNaN(parseFloat(rating))) {
            filters.rating = parseFloat(rating);
        }

        if (featured !== undefined) {
            filters.featured = featured === 'true';
        }

        if (inStock !== undefined) {
            filters.inStock = inStock === 'true';
        }

        return filters;
    }
}

module.exports = PublicProductsController;
