/**
 * API Configuration
 * Professional API settings and environment configurations
 */

const apiConfig = {
    // API Version
    version: '1.0.0',
    
    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
        message: {
            success: false,
            message: 'Too many requests from this IP, please try again later.',
            code: 'RATE_LIMIT_EXCEEDED'
        }
    },
    
    // Cache Settings
    cache: {
        defaultTTL: parseInt(process.env.API_CACHE_TTL) || 5 * 60 * 1000, // 5 minutes
        maxSize: parseInt(process.env.API_CACHE_MAX_SIZE) || 100 // max 100 cached items
    },
    
    // Pagination
    pagination: {
        defaultLimit: parseInt(process.env.API_DEFAULT_LIMIT) || 12,
        maxLimit: parseInt(process.env.API_MAX_LIMIT) || 50,
        defaultPage: 1
    },
    
    // Search Settings
    search: {
        minQueryLength: parseInt(process.env.API_SEARCH_MIN_LENGTH) || 1,
        maxQueryLength: parseInt(process.env.API_SEARCH_MAX_LENGTH) || 100,
        debounceMs: parseInt(process.env.API_SEARCH_DEBOUNCE_MS) || 300
    },
    
    // Performance
    performance: {
        slowQueryThreshold: parseInt(process.env.API_SLOW_QUERY_THRESHOLD_MS) || 1000, // 1 second
        enableMetrics: process.env.API_ENABLE_METRICS === 'true' || process.env.NODE_ENV === 'development'
    }
};

module.exports = apiConfig;
