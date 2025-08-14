/**
 * Public Products Service
 * Professional B2B Marketplace Business Logic
 * Senior Software Engineer Level Implementation
 * Advanced filtering, search, caching, and optimization
 */

const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const mongoose = require('mongoose');
const Logger = require('../utils/Logger');
const { CLIENT_RENEG_LIMIT } = require('tls');

class PublicProductsService {
    constructor() {
        this.logger = new Logger('PublicProductsService');
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
        
        // Performance optimization: precompile aggregation pipelines
        this.precompiledPipelines = new Map();
        this._initializePrecompiledPipelines();
    }

    /**
     * Get products with advanced filtering, search, and pagination
     * @param {Object} filters - Filter parameters
     * @returns {Object} Products with pagination and metadata
     */
    async getProducts(filters) {
        try {
            // Create cache key
            const cacheKey = this._createCacheKey('products', filters);
            
            // Check cache first
            const cached = this._getFromCache(cacheKey);
            if (cached) {
                return { ...cached, fromCache: true };
            }
            
             // Build MongoDB aggregation pipeline
            const pipeline = this._buildProductsPipeline(filters);
            
            // Execute aggregation with parallel operations for performance
            const [
                productsResult,
                totalCountResult,
                metadataResult
            ] = await Promise.all([
                Product.aggregate(pipeline),
                this._getTotalCount(filters),
                this._getFilterMetadata(filters)
            ]);

            // Process results
            const products = productsResult[0]?.products || [];
            const totalCount = totalCountResult;
            
            // Calculate pagination
            const pagination = this._calculatePagination(
                filters.page,
                filters.limit,
                totalCount
            );

            // Prepare response
            const result = {
                products: this._formatProductsForPublic(products),
                pagination,
                appliedFilters: this._getAppliedFilters(filters),
                metadata: metadataResult,
                fromCache: false
            };

            // Cache the result
            this._setCache(cacheKey, result);

            return result;

        } catch (error) {
            this.logger.error('❌ Get products error:', error);
            throw error;
        }
    }

    /**
     * Get all available categories with product counts
     * @returns {Array} All categories (including those without products)
     */
    async getCategories() {
        try {
            const cacheKey = 'all_categories_with_counts';
            const cached = this._getFromCache(cacheKey);
            if (cached) return cached;


            // Step 1: Get ALL active categories
            const Category = require('../models/Category');
            const allCategories = await Category.find({
                status: 'active',
                'settings.isActive': true,
                'settings.isVisible': true
            }).sort({ 'settings.sortOrder': 1, name: 1 }).lean();

            // Step 2: Get product counts for each category
            const categoryProductCounts = await Product.aggregate([
                {
                    $match: {
                        status: 'active',
                        visibility: 'public',
                        publishedAt: { $exists: true, $ne: null }
                    }
                },
                {
                    $group: {
                        _id: '$category',
                        productCount: { $sum: 1 },
                        avgPrice: { $avg: '$pricing.basePrice' },
                        maxPrice: { $max: '$pricing.basePrice' },
                        minPrice: { $min: '$pricing.basePrice' }
                    }
                }
            ]);

            // Step 3: Create a map of category ID to product data
            const productCountMap = new Map();
            categoryProductCounts.forEach(item => {
                if (item._id) {
                    productCountMap.set(item._id.toString(), {
                        productCount: item.productCount || 0,
                        avgPrice: item.avgPrice || 0,
                        maxPrice: item.maxPrice || 0,
                        minPrice: item.minPrice || 0
                    });
                }
            });

            // Step 4: Combine all categories with their product counts
            const categories = allCategories.map(category => {
                const productData = productCountMap.get(category._id.toString()) || {
                    productCount: 0,
                    avgPrice: 0,
                    maxPrice: 0,
                    minPrice: 0
                };

                return {
                    _id: category._id,
                    name: category.name,
                    slug: category.slug,
                    description: category.description,
                    shortDescription: category.shortDescription,
                    icon: category.icon,
                    color: category.color,
                    image: category.image,
                    level: category.level,
                    parentCategory: category.parentCategory,
                    translations: category.translations,
                    productCount: productData.productCount,
                    avgPrice: productData.avgPrice,
                    maxPrice: productData.maxPrice,
                    minPrice: productData.minPrice,
                    hasProducts: productData.productCount > 0,
                    isActive: category.settings?.isActive || false,
                    isFeatured: category.settings?.isFeatured || false
                };
            });

            // Step 5: Sort by product count (descending) and then by name
            const sortedCategories = categories.sort((a, b) => {
                // First sort by product count (categories with products first)
                if (a.productCount !== b.productCount) {
                    return b.productCount - a.productCount;
                }
                // Then sort alphabetically
                return a.name.localeCompare(b.name);
            });

            // Add "All Categories" option at the beginning
            const totalProducts = sortedCategories.reduce((sum, cat) => sum + cat.productCount, 0);
            const allCategoriesOption = {
                _id: null,
                name: 'All Categories',
                slug: 'all',
                productCount: totalProducts,
                avgPrice: sortedCategories.reduce((sum, c) => sum + (c.avgPrice * c.productCount), 0) / totalProducts || 0,
                maxPrice: Math.max(...sortedCategories.map(c => c.maxPrice).filter(p => p > 0)) || 0,
                minPrice: Math.min(...sortedCategories.map(c => c.minPrice).filter(p => p > 0)) || 0,
                hasProducts: totalProducts > 0,
                isActive: true,
                isFeatured: false
            };

            const result = [allCategoriesOption, ...sortedCategories];
            
            this._setCache(cacheKey, result);
            return result;

        } catch (error) {
            this.logger.error('❌ Get categories error:', error);
            throw error;
        }
    }

    /**
     * Get all available manufacturers with product counts
     * @returns {Array} Manufacturers with product counts
     */
    async getManufacturers() {
        try {
            const cacheKey = 'manufacturers_with_counts';
            const cached = this._getFromCache(cacheKey);
            if (cached) return cached;

           
            const manufacturers = await Product.aggregate([
                // Only include marketplace products
                {
                    $match: {
                        status: 'active',
                        visibility: 'public',
                        publishedAt: { $exists: true, $ne: null }
                    }
                },
                // Group by manufacturer
                {
                    $group: {
                        _id: '$manufacturer',
                        productCount: { $sum: 1 },
                        avgRating: { $avg: '$averageRating' },
                        totalViews: { $sum: '$analytics.views' }
                    }
                },
                // Populate manufacturer details
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'manufacturerInfo'
                    }
                },
                {
                    $unwind: {
                        path: '$manufacturerInfo',
                        preserveNullAndEmptyArrays: true
                    }
                },
                // Format output
                {
                    $project: {
                        _id: 1,
                        companyName: { $ifNull: ['$manufacturerInfo.companyName', 'Unknown'] },
                        country: { $ifNull: ['$manufacturerInfo.country', 'Unknown'] },
                        email: '$manufacturerInfo.email',
                        productCount: 1,
                        avgRating: { $round: ['$avgRating', 2] },
                        totalViews: { $ifNull: ['$totalViews', 0] },
                        isVerified: { $ifNull: ['$manufacturerInfo.isVerified', false] }
                    }
                },
                {
                    $sort: { productCount: -1 }
                }
            ]);

            this._setCache(cacheKey, manufacturers);
            return manufacturers;

        } catch (error) {
            this.logger.error('❌ Get manufacturers error:', error);
            throw error;
        }
    }

    /**
     * Get available filter options
     * @returns {Object} Filter options with ranges and available values
     */
    async getFilterOptions() {
        try {
            const cacheKey = 'filter_options';
            const cached = this._getFromCache(cacheKey);
            if (cached) return cached;

           
            const [categories, manufacturers, priceStats] = await Promise.all([
                this.getCategories(),
                this.getManufacturers(),
                this._getPriceStatistics()
            ]);

            const filterOptions = {
                categories: categories.map(cat => ({
                    value: cat.slug,
                    label: cat.name,
                    count: cat.productCount
                })),
                manufacturers: manufacturers.map(man => ({
                    value: man._id,
                    label: man.companyName,
                    count: man.productCount,
                    country: man.country
                })),
                priceRange: priceStats,
                sortOptions: [
                    { value: 'newest', label: 'Newest First' },
                    { value: 'oldest', label: 'Oldest First' },
                    { value: 'price-low', label: 'Price: Low to High' },
                    { value: 'price-high', label: 'Price: High to Low' },
                    { value: 'rating', label: 'Highest Rated' },
                    { value: 'popular', label: 'Most Popular' }
                ],
                ratingOptions: [
                    { value: '4', label: '4+ Stars' },
                    { value: '3', label: '3+ Stars' },
                    { value: '2', label: '2+ Stars' },
                    { value: '1', label: '1+ Stars' }
                ]
            };

            this._setCache(cacheKey, filterOptions);
            return filterOptions;

        } catch (error) {
            this.logger.error('❌ Get filter options error:', error);
            throw error;
        }
    }

    /**
     * Advanced product search with autocomplete
     * @param {string} query - Search query
     * @param {number} limit - Result limit
     * @returns {Object} Search results with suggestions
     */
    async searchProducts(query, limit = 10) {
        try {
           
            // Create search pipeline
            const searchPipeline = [
                // Text search stage
                {
                    $match: {
                        $and: [
                            // Marketplace products only
                            {
                                status: 'active',
                                visibility: 'public',
                                publishedAt: { $exists: true, $ne: null }
                            },
                            // Text search
                            {
                                $or: [
                                    { name: { $regex: query, $options: 'i' } },
                                    { description: { $regex: query, $options: 'i' } },
                                    { shortDescription: { $regex: query, $options: 'i' } },
                                    { 'specifications.name': { $regex: query, $options: 'i' } },
                                    { 'specifications.value': { $regex: query, $options: 'i' } }
                                ]
                            }
                        ]
                    }
                },
                // Populate manufacturer and category
                {
                    $lookup: {
                        from: 'users',
                        localField: 'manufacturer',
                        foreignField: '_id',
                        as: 'manufacturerInfo'
                    }
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'category',
                        foreignField: '_id',
                        as: 'categoryInfo'
                    }
                },
                // Calculate search relevance score
                {
                    $addFields: {
                        relevanceScore: {
                            $sum: [
                                // Name match gets highest score
                                {
                                    $cond: [
                                        { $regexMatch: { input: '$name', regex: query, options: 'i' } },
                                        10,
                                        0
                                    ]
                                },
                                // Description match gets medium score
                                {
                                    $cond: [
                                        { $regexMatch: { input: '$description', regex: query, options: 'i' } },
                                        5,
                                        0
                                    ]
                                },
                                // Featured products get bonus points
                                {
                                    $cond: [
                                        { $eq: ['$isFeatured', true] },
                                        3,
                                        0
                                    ]
                                },
                                // High rating gets bonus
                                {
                                    $cond: [
                                        { $gte: ['$averageRating', 4] },
                                        2,
                                        0
                                    ]
                                }
                            ]
                        }
                    }
                },
                // Sort by relevance and popularity
                {
                    $sort: {
                        relevanceScore: -1,
                        'analytics.views': -1,
                        averageRating: -1
                    }
                },
                // Limit results
                {
                    $limit: limit
                },
                // Format output
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        shortDescription: 1,
                        images: 1,
                        pricing: 1,
                        manufacturer: {
                            _id: { $arrayElemAt: ['$manufacturerInfo._id', 0] },
                            companyName: { $arrayElemAt: ['$manufacturerInfo.companyName', 0] }
                        },
                        category: {
                            _id: { $arrayElemAt: ['$categoryInfo._id', 0] },
                            name: { $arrayElemAt: ['$categoryInfo.name', 0] }
                        },
                        averageRating: 1,
                        totalReviews: 1,
                        analytics: 1,
                        relevanceScore: 1
                    }
                }
            ];

            const searchResults = await Product.aggregate(searchPipeline);

            // Generate search suggestions (autocomplete)
            const suggestions = await this._generateSearchSuggestions(query);

            return {
                products: this._formatProductsForPublic(searchResults),
                suggestions,
                total: searchResults.length,
                query
            };

        } catch (error) {
            this.logger.error('❌ Search products error:', error);
            throw error;
        }
    }

    /**
     * Get featured/trending products
     * @param {number} limit - Number of products to return
     * @returns {Array} Featured products
     */
    async getFeaturedProducts(limit = 8) {
        try {
            const cacheKey = `featured_products_${limit}`;
            const cached = this._getFromCache(cacheKey);
            if (cached) return cached;

            
            const featuredProducts = await Product.aggregate([
                // Match marketplace products
                {
                    $match: {
                        status: 'active',
                        visibility: 'public',
                        publishedAt: { $exists: true, $ne: null }
                    }
                },
                // Populate related data
                {
                    $lookup: {
                        from: 'users',
                        localField: 'manufacturer',
                        foreignField: '_id',
                        as: 'manufacturerInfo'
                    }
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'category',
                        foreignField: '_id',
                        as: 'categoryInfo'
                    }
                },
                // Calculate trending score
                {
                    $addFields: {
                        trendingScore: {
                            $sum: [
                                // Featured products get priority
                                { $cond: [{ $eq: ['$isFeatured', true] }, 50, 0] },
                                // High rating bonus
                                { $multiply: [{ $ifNull: ['$averageRating', 0] }, 10] },
                                // View count bonus (normalized)
                                { $divide: [{ $ifNull: ['$analytics.views', 0] }, 100] },
                                // Recent orders bonus
                                { $multiply: [{ $ifNull: ['$analytics.orders', 0] }, 5] },
                                // Recency bonus (newer products get slight advantage)
                                {
                                    $divide: [
                                        { $subtract: [new Date(), '$createdAt'] },
                                        1000 * 60 * 60 * 24 * 30 // 30 days in milliseconds
                                    ]
                                }
                            ]
                        }
                    }
                },
                // Sort by trending score
                {
                    $sort: {
                        trendingScore: -1,
                        'analytics.views': -1,
                        averageRating: -1
                    }
                },
                // Limit results
                {
                    $limit: limit
                },
                // Format output
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        shortDescription: 1,
                        images: 1,
                        pricing: 1,
                        manufacturer: {
                            _id: { $arrayElemAt: ['$manufacturerInfo._id', 0] },
                            companyName: { $arrayElemAt: ['$manufacturerInfo.companyName', 0] }
                        },
                        category: {
                            _id: { $arrayElemAt: ['$categoryInfo._id', 0] },
                            name: { $arrayElemAt: ['$categoryInfo.name', 0] }
                        },
                        averageRating: 1,
                        totalReviews: 1,
                        analytics: 1,
                        isFeatured: 1,
                        trendingScore: 1
                    }
                }
            ]);

            const result = this._formatProductsForPublic(featuredProducts);
            this._setCache(cacheKey, result);
            return result;

        } catch (error) {
            this.logger.error('❌ Get featured products error:', error);
            throw error;
        }
    }

    /**
     * Get marketplace statistics
     * @returns {Object} Marketplace statistics
     */
    async getMarketplaceStats() {
        try {
            const cacheKey = 'marketplace_stats';
            const cached = this._getFromCache(cacheKey);
            if (cached) return cached;

            
            const stats = await Product.aggregate([
                {
                    $facet: {
                        // Total marketplace products
                        totalProducts: [
                            {
                                $match: {
                                    status: 'active',
                                    visibility: 'public',
                                    publishedAt: { $exists: true, $ne: null }
                                }
                            },
                            { $count: 'count' }
                        ],
                        // Featured products count
                        featuredProducts: [
                            {
                                $match: {
                                    status: 'active',
                                    visibility: 'public',
                                    publishedAt: { $exists: true, $ne: null },
                                    isFeatured: true
                                }
                            },
                            { $count: 'count' }
                        ],
                        // Categories count
                        totalCategories: [
                            {
                                $match: {
                                    status: 'active',
                                    visibility: 'public',
                                    publishedAt: { $exists: true, $ne: null }
                                }
                            },
                            {
                                $group: {
                                    _id: '$category'
                                }
                            },
                            { $count: 'count' }
                        ],
                        // Manufacturers count
                        totalManufacturers: [
                            {
                                $match: {
                                    status: 'active',
                                    visibility: 'public',
                                    publishedAt: { $exists: true, $ne: null }
                                }
                            },
                            {
                                $group: {
                                    _id: '$manufacturer'
                                }
                            },
                            { $count: 'count' }
                        ],
                        // Price statistics
                        priceStats: [
                            {
                                $match: {
                                    status: 'active',
                                    visibility: 'public',
                                    publishedAt: { $exists: true, $ne: null },
                                    'pricing.basePrice': { $exists: true, $ne: null }
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    avgPrice: { $avg: '$pricing.basePrice' },
                                    minPrice: { $min: '$pricing.basePrice' },
                                    maxPrice: { $max: '$pricing.basePrice' }
                                }
                            }
                        ]
                    }
                }
            ]);

            const result = {
                totalProducts: stats[0].totalProducts[0]?.count || 0,
                featuredProducts: stats[0].featuredProducts[0]?.count || 0,
                totalCategories: stats[0].totalCategories[0]?.count || 0,
                totalManufacturers: stats[0].totalManufacturers[0]?.count || 0,
                priceRange: {
                    min: stats[0].priceStats[0]?.minPrice || 0,
                    max: stats[0].priceStats[0]?.maxPrice || 0,
                    avg: Math.round(stats[0].priceStats[0]?.avgPrice || 0)
                },
                lastUpdated: new Date().toISOString()
            };

            this._setCache(cacheKey, result);
            return result;

        } catch (error) {
            this.logger.error('❌ Get marketplace stats error:', error);
            throw error;
        }
    }

    /**
     * Get single product details for public viewing
     * @param {string} productId - Product ID
     * @returns {Object} Product details
     */
    async getProductDetails(productId) {
        try {
            // Validate product ID and check basic existence
            if (!mongoose.Types.ObjectId.isValid(productId)) {
                this.logger.warn('Invalid product ID format:', productId);
                return null;
            }

            // Get comprehensive product data with all required fields for product details page
            const product = await Product.findOne({
                _id: productId,
                status: 'active',
                visibility: 'public',
                publishedAt: { $exists: true, $ne: null },
                $or: [
                    { unpublishedAt: { $exists: false } },
                    { unpublishedAt: null }
                ]
            })
            .populate({
                path: 'manufacturer',
                select: 'companyName email phone country address website activityType companyLogo businessLicense isVerified establishedYear employeeCount description totalProducts totalOrders averageRating totalReviews'
            })
            .populate({
                path: 'category',
                select: 'name slug description parentCategory',
                populate: {
                    path: 'parentCategory',
                    select: 'name slug'
                }
            })
            .populate('subcategory', 'name slug')
            .populate('marketplaceCategory', 'name slug')
            .lean();

            if (!product) {
                this.logger.warn('Product not found or not publicly available:', productId);
                return null;
            }
            
             // Increment view count asynchronously with last viewed timestamp
            Product.findByIdAndUpdate(
                productId,
                { 
                    $inc: { 'analytics.views': 1 },
                    'analytics.lastViewed': new Date()
                },
                { new: false }
            ).exec().catch(err => {
                this.logger.error('❌ Failed to increment view count:', err);
            });

            // Get related products from same manufacturer
            const relatedProducts = await Product.find({
                manufacturer: product.manufacturer._id,
                _id: { $ne: productId },
                status: 'active',
                visibility: 'public'
            })
            .select('name shortDescription images pricing manufacturer category averageRating totalReviews')
            .populate('manufacturer', 'companyName country')
            .limit(6)
            .lean();

            // Get similar products from same category but different manufacturer
            const similarProducts = await Product.find({
                category: product.category._id,
                _id: { $ne: productId },
                manufacturer: { $ne: product.manufacturer._id },
                status: 'active',
                visibility: 'public'
            })
            .select('name shortDescription images pricing manufacturer category averageRating totalReviews')
            .populate('manufacturer', 'companyName country')
            .limit(4)
            .lean();

            // Calculate manufacturer statistics
            const manufacturerStats = await Product.aggregate([
                { 
                    $match: { 
                        manufacturer: product.manufacturer._id, 
                        status: 'active', 
                        visibility: 'public' 
                    } 
                },
                {
                    $group: {
                        _id: '$manufacturer',
                        totalProducts: { $sum: 1 },
                        totalViews: { $sum: '$analytics.views' },
                        averageRating: { $avg: '$averageRating' }
                    }
                }
            ]);

            // Enhanced product data with all required fields
            const enhancedProduct = {
                ...product,
                relatedProducts: relatedProducts,
                similarProducts: similarProducts,
                manufacturer: {
                    ...product.manufacturer,
                    stats: manufacturerStats[0] || { 
                        totalProducts: 0, 
                        totalViews: 0, 
                        averageRating: 0 
                    }
                }
            };

            return enhancedProduct;

        } catch (error) {
            this.logger.error('❌ Get product details error:', error);
            throw error;
        }
    }

    // ===============================================
    //              PRIVATE HELPER METHODS
    // ===============================================

    /**
     * Initialize precompiled aggregation pipelines for performance
     * @private
     */
    _initializePrecompiledPipelines() {
        // Base marketplace filter
        this.precompiledPipelines.set('baseMarketplaceFilter', {
            status: 'active',
            visibility: 'public',
            publishedAt: { $exists: true, $ne: null },
            $or: [
                { unpublishedAt: { $exists: false } },
                { unpublishedAt: null }
            ]
        });

        // Common lookup stages
        this.precompiledPipelines.set('manufacturerLookup', {
            $lookup: {
                from: 'users',
                localField: 'manufacturer',
                foreignField: '_id',
                as: 'manufacturerInfo'
            }
        });

        this.precompiledPipelines.set('categoryLookup', {
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'categoryInfo'
            }
        });
    }

    /**
     * Build MongoDB aggregation pipeline for products query
     * @private
     */
    _buildProductsPipeline(filters) {
        const pipeline = [];

        // Base match stage - only marketplace products
        const matchStage = {
            $match: {
                ...this.precompiledPipelines.get('baseMarketplaceFilter')
            }
        };

        // Add additional filters
        if (filters.search) {
            matchStage.$match.$and = matchStage.$match.$and || [];
            matchStage.$match.$and.push({
                $or: [
                    { name: { $regex: filters.search, $options: 'i' } },
                    { description: { $regex: filters.search, $options: 'i' } },
                    { shortDescription: { $regex: filters.search, $options: 'i' } }
                ]
            });
        }

        // Category filter will be handled in post-lookup stage since category is slug-based

        if (filters.manufacturer) {
            try {
                matchStage.$match.manufacturer = new mongoose.Types.ObjectId(filters.manufacturer);
            } catch (error) {
                // Skip invalid manufacturer filter rather than failing the whole query
            }
        }

        if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
            matchStage.$match['pricing.basePrice'] = {};
            if (filters.priceMin !== undefined) {
                matchStage.$match['pricing.basePrice'].$gte = filters.priceMin;
            }
            if (filters.priceMax !== undefined) {
                matchStage.$match['pricing.basePrice'].$lte = filters.priceMax;
            }
        }

        if (filters.rating !== undefined) {
            matchStage.$match.averageRating = { $gte: filters.rating };
        }

        if (filters.featured !== undefined) {
            matchStage.$match.isFeatured = filters.featured;
        }

        if (filters.inStock !== undefined && filters.inStock) {
            matchStage.$match['inventory.availableStock'] = { $gt: 0 };
        }

        pipeline.push(matchStage);

        // Add lookups
        pipeline.push(this.precompiledPipelines.get('manufacturerLookup'));
        pipeline.push(this.precompiledPipelines.get('categoryLookup'));

        // Add category filter after lookup (since we filter by slug, not ObjectId)
        if (filters.category && filters.category !== 'all') {
            pipeline.push({
                $match: {
                    'categoryInfo.slug': filters.category
                }
            });
        }

        // Add sort stage
        const sortStage = this._buildSortStage(filters.sort);
        pipeline.push(sortStage);

        // Add pagination using facet to get both data and count efficiently
        pipeline.push({
            $facet: {
                products: [
                    { $skip: (filters.page - 1) * filters.limit },
                    { $limit: filters.limit },
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            shortDescription: 1,
                            images: 1,
                            pricing: 1,
                            manufacturer: {
                                _id: { $arrayElemAt: ['$manufacturerInfo._id', 0] },
                                companyName: { $arrayElemAt: ['$manufacturerInfo.companyName', 0] },
                                country: { $arrayElemAt: ['$manufacturerInfo.country', 0] }
                            },
                            category: {
                                _id: { $arrayElemAt: ['$categoryInfo._id', 0] },
                                name: { $arrayElemAt: ['$categoryInfo.name', 0] },
                                slug: { $arrayElemAt: ['$categoryInfo.slug', 0] }
                            },
                            averageRating: 1,
                            totalReviews: 1,
                            analytics: 1,
                            isFeatured: 1,
                            createdAt: 1,
                            publishedAt: 1
                        }
                    }
                ]
            }
        });

        return pipeline;
    }

    /**
     * Build sort stage based on sort parameter
     * @private
     */
    _buildSortStage(sortOption) {
        const sortStages = {
            // Basic sorting
            'newest': { publishedAt: -1, createdAt: -1 },
            'oldest': { publishedAt: 1, createdAt: 1 },
            'price-low': { 'pricing.basePrice': 1 },
            'price-high': { 'pricing.basePrice': -1 },
            'rating': { averageRating: -1, totalReviews: -1 },
            'popular': { 'analytics.views': -1, 'analytics.orders': -1, averageRating: -1 },

            
            // Alternative naming for compatibility
            'best-match': { averageRating: -1, totalReviews: -1, 'analytics.views': -1 },
            'best-rating': { averageRating: -1, totalReviews: -1 },
            'best-offers': { 'pricing.basePrice': 1, averageRating: -1 },
            'best-selling': { 'analytics.orders': -1, 'analytics.views': -1, averageRating: -1 }
        };

        const selectedSort = sortStages[sortOption] || sortStages.newest;
        
        return { $sort: selectedSort };
    }

    /**
     * Get total count for pagination
     * @private
     */
    async _getTotalCount(filters) {
        // For category filtering by slug, we need to use aggregation
        if (filters.category && filters.category !== 'all') {
            const pipeline = [
                // Base marketplace filter
                {
                    $match: {
                        ...this.precompiledPipelines.get('baseMarketplaceFilter')
                    }
                }
            ];

            // Add search filter
            if (filters.search) {
                pipeline.push({
                    $match: {
                        $or: [
                            { name: { $regex: filters.search, $options: 'i' } },
                            { description: { $regex: filters.search, $options: 'i' } },
                            { shortDescription: { $regex: filters.search, $options: 'i' } }
                        ]
                    }
                });
            }

            // Add other filters
            const additionalMatch = {};

            if (filters.manufacturer) {
                additionalMatch.manufacturer = new mongoose.Types.ObjectId(filters.manufacturer);
            }

            if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
                additionalMatch['pricing.basePrice'] = {};
                if (filters.priceMin !== undefined) {
                    additionalMatch['pricing.basePrice'].$gte = filters.priceMin;
                }
                if (filters.priceMax !== undefined) {
                    additionalMatch['pricing.basePrice'].$lte = filters.priceMax;
                }
            }

            if (filters.rating !== undefined) {
                additionalMatch.averageRating = { $gte: filters.rating };
            }

            if (filters.featured !== undefined) {
                additionalMatch.isFeatured = filters.featured;
            }

            if (filters.inStock !== undefined && filters.inStock) {
                additionalMatch['inventory.availableStock'] = { $gt: 0 };
            }

            if (Object.keys(additionalMatch).length > 0) {
                pipeline.push({ $match: additionalMatch });
            }

            // Add category lookup and filter
            pipeline.push(this.precompiledPipelines.get('categoryLookup'));
            pipeline.push({
                $match: {
                    'categoryInfo.slug': filters.category
                }
            });

            // Count documents
            pipeline.push({ $count: 'total' });

            const result = await Product.aggregate(pipeline);
            return result[0]?.total || 0;
        }

        // For non-category filters, use simple countDocuments
        const matchConditions = {
            ...this.precompiledPipelines.get('baseMarketplaceFilter')
        };

        // Apply same filters as main query
        if (filters.search) {
            matchConditions.$and = matchConditions.$and || [];
            matchConditions.$and.push({
                $or: [
                    { name: { $regex: filters.search, $options: 'i' } },
                    { description: { $regex: filters.search, $options: 'i' } },
                    { shortDescription: { $regex: filters.search, $options: 'i' } }
                ]
            });
        }

        if (filters.manufacturer) {
            matchConditions.manufacturer = new mongoose.Types.ObjectId(filters.manufacturer);
        }

        if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
            matchConditions['pricing.basePrice'] = {};
            if (filters.priceMin !== undefined) {
                matchConditions['pricing.basePrice'].$gte = filters.priceMin;
            }
            if (filters.priceMax !== undefined) {
                matchConditions['pricing.basePrice'].$lte = filters.priceMax;
            }
        }

        if (filters.rating !== undefined) {
            matchConditions.averageRating = { $gte: filters.rating };
        }

        if (filters.featured !== undefined) {
            matchConditions.isFeatured = filters.featured;
        }

        if (filters.inStock !== undefined && filters.inStock) {
            matchConditions['inventory.availableStock'] = { $gt: 0 };
        }

        return await Product.countDocuments(matchConditions);
    }

    /**
     * Get filter metadata (price ranges, etc.)
     * @private
     */
    async _getFilterMetadata(filters) {
        // This could be expanded to provide dynamic filter options
        // based on current filter selection
        return {
            totalCategories: await Category.countDocuments({ status: 'active' }),
            totalManufacturers: await User.countDocuments({ 
                role: { $in: ['manufacturer', 'company_admin'] } 
            }),
            priceRange: await this._getPriceStatistics()
        };
    }

    /**
     * Get price statistics for the current dataset
     * @private
     */
    async _getPriceStatistics() {
        const priceStats = await Product.aggregate([
            {
                $match: {
                    ...this.precompiledPipelines.get('baseMarketplaceFilter'),
                    'pricing.basePrice': { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: null,
                    minPrice: { $min: '$pricing.basePrice' },
                    maxPrice: { $max: '$pricing.basePrice' },
                    avgPrice: { $avg: '$pricing.basePrice' }
                }
            }
        ]);

        if (priceStats.length === 0) {
            return { min: 0, max: 1000, avg: 100 };
        }

        return {
            min: Math.floor(priceStats[0].minPrice || 0),
            max: Math.ceil(priceStats[0].maxPrice || 1000),
            avg: Math.round(priceStats[0].avgPrice || 100)
        };
    }

    /**
     * Calculate pagination information
     * @private
     */
    _calculatePagination(page, limit, total) {
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPreviousPage = page > 1;

        return {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit,
            hasNextPage,
            hasPreviousPage,
            startIndex: (page - 1) * limit + 1,
            endIndex: Math.min(page * limit, total)
        };
    }

    /**
     * Get applied filters summary
     * @private
     */
    _getAppliedFilters(filters) {
        const applied = [];

        if (filters.search) {
            applied.push({ type: 'search', value: filters.search, label: `Search: "${filters.search}"` });
        }

        if (filters.category && filters.category !== 'all') {
            applied.push({ type: 'category', value: filters.category, label: `Category: ${filters.category}` });
        }

        if (filters.manufacturer) {
            applied.push({ type: 'manufacturer', value: filters.manufacturer, label: 'Manufacturer filter' });
        }

        if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
            const priceLabel = `Price: $${filters.priceMin || 0} - $${filters.priceMax || '∞'}`;
            applied.push({ type: 'price', value: { min: filters.priceMin, max: filters.priceMax }, label: priceLabel });
        }

        if (filters.rating !== undefined) {
            applied.push({ type: 'rating', value: filters.rating, label: `${filters.rating}+ Stars` });
        }

        if (filters.featured !== undefined) {
            applied.push({ type: 'featured', value: filters.featured, label: 'Featured Only' });
        }

        if (filters.inStock !== undefined && filters.inStock) {
            applied.push({ type: 'inStock', value: true, label: 'In Stock Only' });
        }

        return applied;
    }

    /**
     * Generate search suggestions for autocomplete
     * @private
     */
    async _generateSearchSuggestions(query) {
        try {
            if (query.length < 2) return [];

            const suggestions = await Product.aggregate([
                {
                    $match: {
                        ...this.precompiledPipelines.get('baseMarketplaceFilter'),
                        name: { $regex: query, $options: 'i' }
                    }
                },
                {
                    $project: {
                        name: 1,
                        suggestion: '$name'
                    }
                },
                {
                    $limit: 5
                }
            ]);

            return suggestions.map(s => s.suggestion);

        } catch (error) {
            this.logger.error('❌ Generate suggestions error:', error);
            return [];
        }
    }

    /**
     * Format products for public API response
     * @private
     */
    _formatProductsForPublic(products) {
        return products.map(product => this._formatProductForPublic(product));
    }

    /**
     * Format single product for public API response
     * @private
     */
    _formatProductForPublic(product) {
        return {
            id: product._id,
            name: product.name,
            shortDescription: product.shortDescription,
            images: this._formatImages(product.images),
            pricing: {
                basePrice: product.pricing?.basePrice || 0,
                currency: product.pricing?.currency || 'USD',
                priceType: product.pricing?.priceType || 'fixed'
            },
            manufacturer: {
                id: product.manufacturer?._id || product.manufacturer?.id,
                companyName: product.manufacturer?.companyName || 'Unknown',
                country: product.manufacturer?.country || 'Unknown',
                isVerified: product.manufacturer?.isVerified || false
            },
            category: {
                id: product.category?._id || product.category?.id,
                name: product.category?.name || 'Uncategorized',
                slug: product.category?.slug || 'uncategorized'
            },
            rating: {
                average: product.averageRating || 0,
                total: product.totalReviews || 0
            },
            analytics: {
                views: product.analytics?.views || 0,
                orders: product.analytics?.orders || 0
            },
            isFeatured: product.isFeatured || false,
            publishedAt: product.publishedAt,
            detailsUrl: `/product-details?id=${product._id}`
        };
    }

    /**
     * Format product images
     * @private
     */
    _formatImages(images) {
        if (!images || !Array.isArray(images) || images.length === 0) {
            return [{
                url: '/assets/images/thumbs/product-placeholder.png',
                alt: 'Product placeholder',
                isPrimary: true
            }];
        }

        return images.map(img => ({
            url: img.url || '/assets/images/thumbs/product-placeholder.png',
            alt: img.alt || 'Product image',
            isPrimary: img.isPrimary || false
        }));
    }

    /**
     * Create cache key
     * @private
     */
    _createCacheKey(prefix, data) {
        const hash = require('crypto')
            .createHash('md5')
            .update(JSON.stringify(data))
            .digest('hex');
        return `${prefix}_${hash}`;
    }

    /**
     * Get from cache
     * @private
     */
    _getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    /**
     * Set cache
     * @private
     */
    _setCache(key, data) {
        // Clean old cache entries if cache is getting too large
        if (this.cache.size > 100) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
}

module.exports = PublicProductsService;
