/**
 * Public Products API Routes
 * Professional B2B Marketplace Integration
 * Senior Software Engineer Level Implementation
 * Advanced filtering, search, pagination, and caching
 */

const express = require('express');
const { query, param, validationResult } = require('express-validator');
const PublicProductsController = require('../../controllers/PublicProductsController');
const productValidation = require('../../validation/productValidation');
const router = express.Router();

// Create controller instance
const controller = new PublicProductsController();

/**
 * GET /api/public/products
 * Advanced products listing with filtering, search, sorting, and pagination
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 12, max: 50)
 * - search: Search query string
 * - category: Category filter
 * - manufacturer: Manufacturer filter  
 * - priceMin: Minimum price filter
 * - priceMax: Maximum price filter
 * - rating: Minimum rating filter
 * - sort: Sort option (newest, oldest, price-low, price-high, rating, popular)
 * - featured: Show only featured products (true/false)
 * - inStock: Show only in-stock products (true/false)
 */
router.get('/products', [
    ...productValidation.productFilters,
    productValidation.validatePriceRange,
    productValidation.sanitizeSearch
], controller.getProducts.bind(controller));

/**
 * GET /api/public/products/categories
 * Get all available product categories with product counts
 */
router.get('/products/categories', controller.getCategories.bind(controller));

/**
 * GET /api/public/products/manufacturers
 * Get all available manufacturers with product counts
 */
router.get('/products/manufacturers', controller.getManufacturers.bind(controller));

/**
 * GET /api/public/products/filters
 * Get available filter options (categories, manufacturers, price ranges)
 */
router.get('/products/filters', controller.getFilterOptions.bind(controller));

/**
 * GET /api/public/products/search
 * Advanced search with autocomplete suggestions
 */
router.get('/products/search', [
    ...productValidation.productSearch,
    productValidation.sanitizeSearch
], controller.searchProducts.bind(controller));

/**
 * GET /api/public/products/featured
 * Get featured/trending products
 */
router.get('/products/featured', [
    ...productValidation.featuredProducts
], controller.getFeaturedProducts.bind(controller));

/**
 * GET /api/public/products/stats
 * Get marketplace statistics (total products, categories, etc.)
 */
router.get('/products/stats', controller.getMarketplaceStats.bind(controller));

/**
 * GET /api/public/products/:productId
 * Get single product details for public viewing
 */
router.get('/products/:productId', [
    ...productValidation.productDetails
], controller.getProductDetails.bind(controller));

module.exports = router;
