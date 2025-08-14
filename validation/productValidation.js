/**
 * Product Validation Rules
 * Professional validation schemas for product-related operations
 */

const { body, query, param } = require('express-validator');

const productValidation = {
    // Public product filtering validation
    productFilters: [
        query('page')
            .optional()
            .isInt({ min: 1, max: 1000 })
            .withMessage('Page must be between 1 and 1000'),
        
        query('limit')
            .optional()
            .isInt({ min: 1, max: 50 })
            .withMessage('Limit must be between 1 and 50'),
        
        query('search')
            .optional()
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Search query must be 1-100 characters')
            .escape(), // Prevent XSS
        
        query('category')
            .optional()
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('Category must be 1-50 characters')
            .matches(/^[a-z0-9-_]+$/)
            .withMessage('Category slug can only contain lowercase letters, numbers, hyphens and underscores'),
        
        query('manufacturer')
            .optional()
            .isMongoId()
            .withMessage('Manufacturer must be a valid MongoDB ObjectId'),
        
        query('priceMin')
            .optional()
            .isFloat({ min: 0, max: 1000000 })
            .withMessage('Minimum price must be between 0 and 1,000,000'),
        
        query('priceMax')
            .optional()
            .isFloat({ min: 0, max: 1000000 })
            .withMessage('Maximum price must be between 0 and 1,000,000'),
        
        query('rating')
            .optional()
            .isFloat({ min: 0, max: 5 })
            .withMessage('Rating must be between 0 and 5'),
        
        query('sort')
            .optional()
            .isIn([
                'newest', 'oldest', 'price-low', 'price-high', 'rating', 'popular'
            ])
            .withMessage('Invalid sort option'),
        
        query('featured')
            .optional()
            .isBoolean()
            .withMessage('Featured must be a boolean'),
        
        query('inStock')
            .optional()
            .isBoolean()
            .withMessage('InStock must be a boolean')
    ],
    
    // Product search validation
    productSearch: [
        query('q')
            .notEmpty()
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Search query is required and must be 1-100 characters')
            .escape(),
        
        query('limit')
            .optional()
            .isInt({ min: 1, max: 20 })
            .withMessage('Limit must be between 1 and 20')
    ],
    
    // Product details validation
    productDetails: [
        param('productId')
            .isMongoId()
            .withMessage('Product ID must be a valid MongoDB ObjectId')
    ],
    
    // Featured products validation
    featuredProducts: [
        query('limit')
            .optional()
            .isInt({ min: 1, max: 20 })
            .withMessage('Limit must be between 1 and 20')
    ],
    
    // Custom validation function for price range
    validatePriceRange: (req, res, next) => {
        const { priceMin, priceMax } = req.query;
        
        if (priceMin && priceMax && parseFloat(priceMin) > parseFloat(priceMax)) {
            return res.status(400).json({
                success: false,
                message: 'Minimum price cannot be greater than maximum price',
                code: 'INVALID_PRICE_RANGE'
            });
        }
        
        next();
    },
    
    // Sanitize search query
    sanitizeSearch: (req, res, next) => {
        if (req.query.search) {
            // Remove special regex characters to prevent ReDoS attacks
            req.query.search = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
        next();
    }
};

module.exports = productValidation;
