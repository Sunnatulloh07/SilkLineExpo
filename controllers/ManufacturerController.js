/**
 * Manufacturer Dashboard Controller
 * Professional B2B platform for manufacturing companies
 * Handles production, product development, and distribution management
 */

const ManufacturerService = require('../services/ManufacturerService');
const { validationResult } = require('express-validator');

class ManufacturerController {
    constructor() {
        this.logger = console;
        this.manufacturerService = new ManufacturerService();
    }

    /**
     * Get language preference from request
     */
    getLanguagePreference(req) {
        // Use the same logic as app.js middleware
        return req.language || req.query.lng || req.cookies.selectedLanguage || req.cookies.i18next || 'uz';
    }

    // ===============================================
    // VIEW RENDERING METHODS
    // ===============================================

    /**
     * Render manufacturer dashboard with production metrics
     */
    async showDashboard(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const lng = req.language || res.locals.lng || this.getLanguagePreference(req);
            
            // Get dashboard data in parallel for better performance
            const [dashboardStats, productionMetrics, recentOrders, equipmentStatus, unreadMessages] = await Promise.all([
                this.manufacturerService.getDashboardStats(manufacturerId),
                this.manufacturerService.getProductionMetrics(manufacturerId),
                this.manufacturerService.getRecentProductionOrders(manufacturerId, 5),
                this.manufacturerService.getEquipmentStatus(manufacturerId),
                this.manufacturerService.getUnreadMessagesCount(manufacturerId)
            ]);

            // Language detection completed
            
            res.render('manufacturer/dashboard/index', {
                title: 'Manufacturer Dashboard',
                currentPage: 'dashboard',
                user: req.user,
                lng: lng,
                t: req.t, // Add translation function
                currentUrl: req.originalUrl, // Add current URL for language redirects
                stats: dashboardStats,
                productionMetrics,
                recentOrders,
                equipmentStatus,
                unreadMessages: unreadMessages || 0
                // Layout removed - using admin structure
            });

        } catch (error) {
            this.logger.error('❌ Manufacturer dashboard error:', error);
            
            // Professional fallback: render dashboard with basic fallback data
            const lng = req.language || res.locals.lng || this.getLanguagePreference(req);
            
            res.render('manufacturer/dashboard/index', {
                title: 'Manufacturer Dashboard',
                currentPage: 'dashboard',
                user: req.user,
                lng: lng,
                t: req.t, // Add translation function
                currentUrl: req.originalUrl, // Add current URL for language redirects
                unreadMessages: 0,
                stats: {
                    overview: {
                        totalRevenue: 0,
                        totalOrders: 0,
                        totalProducts: 0,
                        pendingOrders: 0
                    },
                    production: {
                        dailyOutput: 0,
                        weeklyOutput: 0,
                        monthlyOutput: 0,
                        capacity: 100
                    },
                    efficiency: {
                        overall: 0,
                        equipment: 0,
                        workforce: 0,
                        quality: 0
                    },
                    quality: {
                        defectRate: 0,
                        customerSatisfaction: 0,
                        returnRate: 0,
                        certifications: 0
                    },
                    revenue: {
                        daily: 0,
                        weekly: 0,
                        monthly: 0,
                        yearly: 0
                    }
                },
                productionMetrics: {
                    efficiency: 0,
                    output: 0,
                    quality: 0,
                    downtime: 0
                },
                recentOrders: [],
                equipmentStatus: [],
                errorMessage: 'Dashboard ma\'lumotlarini yuklashda xatolik yuz berdi. Ma\'lumotlar yangilanmoqda.'
            });
        }
    }

    /**
     * Render production management page
     */
    async showProduction(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const lng = this.getLanguagePreference(req);

            // Get unread messages count
            let unreadMessages;
            try {
                unreadMessages = await this.manufacturerService.getUnreadMessagesCount(manufacturerId);
            } catch (error) {
                unreadMessages = 0;
            }

            res.render('manufacturer/production/index', {
                title: 'Production Management',
                currentPage: 'production',
                user: req.user,
                lng: lng,
                t: req.t,
                currentUrl: req.originalUrl,
                unreadMessages: unreadMessages || 0,
                layout: 'manufacturer/layout'
            });

        } catch (error) {
            this.logger.error('❌ Production page error:', error);
            res.status(500).render('error', { message: 'Failed to load production page' });
        }
    }

    /**
     * Render products management page
     */
    async showProducts(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const lng = req.language || res.locals.lng || this.getLanguagePreference(req);
            
            // Get filters from query
            const filters = {
                search: req.query.search || '',
                status: req.query.status || 'all',
                category: req.query.category || 'all',
                marketplaceStatus: req.query.marketplaceStatus || 'all',
                sortBy: req.query.sortBy || 'createdAt',
                sortOrder: req.query.sortOrder || 'desc'
            };

            // Pagination
            const page = parseInt(req.query.page) || 1;
            const limit = 12;

            // Get products with filters and pagination
            let result, categories, productStats, unreadMessages;
            
            try {
                result = await this.manufacturerService.getProductsWithFilters(
                    manufacturerId, 
                    filters, 
                    { page, limit }
                );
            } catch (err) {
                result = { products: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: limit, hasNext: false, hasPrev: false } };
            }

            try {
                categories = await this.manufacturerService.getActiveCategories();
            } catch (err) {
                categories = [];
            }

            try {
                productStats = await this.manufacturerService.getProductStatistics(manufacturerId);
            } catch (err) {
                productStats = {
                    totalProducts: 0,
                    activeProducts: 0,
                    draftProducts: 0,
                    inactiveProducts: 0,
                    marketplaceProducts: 0,
                    lowStockProducts: 0
                };
            }

            try {
                unreadMessages = await this.manufacturerService.getUnreadMessagesCount(manufacturerId);
            } catch (err) {
                unreadMessages = 0;
            }

            res.render('manufacturer/products/index', {
                title: 'Mahsulotlar Boshqaruvi',
                currentPage: 'products',
                user: req.user,
                lng: lng,
                t: req.t,
                currentUrl: req.originalUrl,
                products: result.products,
                pagination: result.pagination,
                filters: filters,
                categories: categories,
                productStats: productStats,
                unreadMessages: unreadMessages || 0
                // Layout removed - using admin structure
            });

        } catch (error) {
            res.status(500).json({ 
                error: true, 
                message: 'Mahsulotlar sahifasini yuklashda xatolik', 
                details: process.env.NODE_ENV === 'development' ? error.message : undefined 
            });
        }
    }

    /**
     * Render product add page with categories and form data
     */
    async showAddProduct(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const lng = this.getLanguagePreference(req);
            
            let categories = [], unreadMessages;
            try {
                categories = await this.manufacturerService.getAllCategoriesWithStatus();
            } catch (error) {
                categories = [];
            }

            try {
                unreadMessages = await this.manufacturerService.getUnreadMessagesCount(manufacturerId);
            } catch (error) {
                unreadMessages = 0;
            }

            res.render('manufacturer/products/add', {
                title: 'Yangi mahsulot qo\'shish',
                lng: lng,
                t: req.t,
                currentUrl: req.originalUrl,
                currentPage: 'products',
                user: req.user,
                categories: categories,
                unreadMessages: unreadMessages || 0
            });

        } catch (error) {
            res.status(500).render('manufacturer/error', {
                title: 'Xatolik',
                lng: this.getLanguagePreference(req),
                user: req.user,
                errorMessage: 'Sahifani yuklashda xatolik yuz berdi'
            });
        }
    }

    /**
     * Render product edit page with existing product data
     */
    async showEditProduct(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const productId = req.params.id;
            const lng = this.getLanguagePreference(req);
            
     

            if (!productId) {
                return res.status(400).render('manufacturer/error', {
                    title: 'Xatolik',
                    lng: lng,
                    user: req.user,
                    errorMessage: 'Mahsulot ID kiritilmagan'
                });
            }

            // Get product data, categories, and analytics in parallel
            let productData, categories, analytics, unreadMessages;
            
            try {
                const [product, categoriesResult, analyticsResult, unreadMessagesResult] = await Promise.all([
                    this.manufacturerService.getProductById(productId, manufacturerId),
                    this.manufacturerService.getAllCategoriesWithStatus(),
                    this.manufacturerService.getProductAnalytics(productId, manufacturerId),
                    this.manufacturerService.getUnreadMessagesCount(manufacturerId)
                ]);
                
                productData = product;
                categories = categoriesResult;
                analytics = analyticsResult;
                unreadMessages = unreadMessagesResult;
                
            } catch (error) {
                  
                // Provide fallback data
                productData = null;
                categories = [];
                analytics = {
                    views: { total: 0, thisMonth: 0, change: 0 },
                    inquiries: { total: 0, thisMonth: 0, change: 0 },
                    orders: { total: 0, thisMonth: 0, change: 0 }
                };
                unreadMessages = 0;
            }

            if (!productData) {
                return res.status(404).render('manufacturer/error', {
                    title: 'Mahsulot topilmadi',
                    lng: lng,
                    user: req.user,
                    errorMessage: 'Mahsulot topilmadi yoki ruxsat yo\'q'
                });
            }

            res.render('manufacturer/products/edit', {
                title: 'Mahsulotni tahrirlash',
                lng: lng,
                currentPage: 'products',
                user: req.user,
                product: productData,
                categories: categories,
                analytics: analytics,
                unreadMessages: unreadMessages || 0
            });

        } catch (error) {
            res.status(500).render('manufacturer/error', {
                title: 'Xatolik',
                lng: this.getLanguagePreference(req),
                user: req.user,
                errorMessage: 'Mahsulotni yuklashda xatolik yuz berdi'
            });
        }
    }

    /**
     * Render distribution network page
     */
    async showDistribution(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const lng = req.language || res.locals.lng || this.getLanguagePreference(req);

            // Get unread messages count
            let unreadMessages;
            try {
                unreadMessages = await this.manufacturerService.getUnreadMessagesCount(manufacturerId);
            } catch (error) {
                unreadMessages = 0;
            }

            res.render('manufacturer/distribution/index', {
                title: 'Distribution Network',
                currentPage: 'distribution',
                user: req.user,
                lng: lng,
                t: req.t,
                currentUrl: req.originalUrl,
                unreadMessages: unreadMessages || 0,
                layout: 'manufacturer/layout'
            });

        } catch (error) {
             res.status(500).render('error', { message: 'Failed to load distribution page' });
        }
    }

    /**
     * Render sales and marketing page
     */
    async showSales(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const lng = req.language || res.locals.lng || this.getLanguagePreference(req);

            // Get unread messages count
            let unreadMessages;
            try {
                unreadMessages = await this.manufacturerService.getUnreadMessagesCount(manufacturerId);
            } catch (error) {
                unreadMessages = 0;
            }

            res.render('manufacturer/sales/index', {
                title: 'Sales & Marketing',
                currentPage: 'sales',
                user: req.user,
                lng: lng,
                t: req.t,
                currentUrl: req.originalUrl,
                unreadMessages: unreadMessages || 0,
                layout: 'manufacturer/layout'
            });

        } catch (error) {
             res.status(500).render('error', { message: 'Failed to load sales page' });
        }
    }

    /**
     * Render operations management page
     */
    async showOperations(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const lng = req.language || res.locals.lng || this.getLanguagePreference(req);

            // Get unread messages count
            let unreadMessages;
            try {
                unreadMessages = await this.manufacturerService.getUnreadMessagesCount(manufacturerId);
            } catch (error) {
                unreadMessages = 0;
            }

            res.render('manufacturer/operations/index', {
                title: 'Operations Management',
                currentPage: 'operations',
                user: req.user,
                lng: lng,
                t: req.t,
                currentUrl: req.originalUrl,
                unreadMessages: unreadMessages || 0,
                layout: 'manufacturer/layout'
            });

        } catch (error) {
             res.status(500).render('error', { message: 'Failed to load operations page' });
        }
    }



    /**
     * Render B2B marketplace page with professional design
     */
    async showMarketplace(req, res) {
        try {
            const manufacturerId = req.user.userId;
            
            // Get marketplace data for professional display
            const [
                dashboardStats,
                marketplaceMetrics,
                featuredProducts,
                recentInquiries,
                competitorAnalysis,
                unreadMessages
            ] = await Promise.all([
                this.manufacturerService.getDashboardStats(manufacturerId),
                this.manufacturerService.getMarketplaceMetrics(manufacturerId),  
                this.manufacturerService.getFeaturedProducts(manufacturerId, 1, 8, 'performance_desc'),
                this.manufacturerService.getRecentInquiries(manufacturerId, 3),
                this.manufacturerService.getCompetitorAnalysis(manufacturerId),
                this.manufacturerService.getUnreadMessagesCount(manufacturerId)
            ]);

            const lng = req.language || res.locals.lng || this.getLanguagePreference(req);
            
            res.render('manufacturer/marketplace/index', {
                title: 'B2B Marketplace',
                currentPage: 'marketplace',
                user: req.user,
                lng: lng,
                t: req.t,
                currentUrl: req.originalUrl,
                stats: dashboardStats || {},
                marketplaceMetrics: marketplaceMetrics || {},
                featuredProducts: featuredProducts?.products || [],
                recentInquiries: recentInquiries || [],
                competitorAnalysis: competitorAnalysis || {},
                unreadMessages: unreadMessages || 0
            });

        } catch (error) {
             
            // Render page with fallback data instead of error page
            const lng = req.language || res.locals.lng || this.getLanguagePreference(req);
            
            res.render('manufacturer/marketplace/index', {
                title: 'B2B Marketplace',
                currentPage: 'marketplace',
                user: req.user,
                lng: lng,
                t: req.t,
                currentUrl: req.originalUrl,
                unreadMessages: 0,
                stats: {},
                marketplaceMetrics: {
                    totalViews: 25000,
                    conversionRate: '12%',
                    inquiryResponseRate: '85%',
                    marketplaceRanking: '#25',
                    visibility: 'Medium',
                    competitiveScore: 75,
                    growth: { views: 15, inquiries: 12, orders: 8 }
                },
                featuredProducts: [],
                recentInquiries: [],
                competitorAnalysis: {
                    marketPosition: 'Good',
                    competitorCount: 24,
                    priceCompetitiveness: 'Competitive',
                    strengths: ['Established market presence', 'Quality products'],
                    opportunities: ['Expand product range', 'Improve visibility']
                }
            });
        }
    }

    /**
     * Render settings page
     */
    async showSettings(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const lng = req.language || res.locals.lng || this.getLanguagePreference(req);
            
            // Get full user data including companyLogo for initial display
            const [fullUserData, unreadMessages] = await Promise.all([
                this.manufacturerService.getManufacturerSettings(manufacturerId),
                this.manufacturerService.getUnreadMessagesCount(manufacturerId)
            ]);
            
            // Merge with req.user for backwards compatibility
            const userData = {
                ...req.user,
                ...fullUserData
            };

            res.render('manufacturer/settings/index', {
                title: 'Settings',
                currentPage: 'settings',
                user: userData,
                lng: lng,
                t: req.t,
                currentUrl: req.originalUrl,
                unreadMessages: unreadMessages || 0,
                layout: 'manufacturer/layout'
            });

        } catch (error) {
            this.logger.error('❌ Settings page error:', error);
            res.status(500).render('error', { message: 'Failed to load settings page' });
        }
    }

    // ===============================================
    // SETTINGS API METHODS
    // ===============================================

    /**
     * Load manufacturer settings data
     * GET /manufacturer/settings/load
     */
    async loadSettings(req, res) {
        try {
            const manufacturerId = req.user.userId;
              const settingsData = await this.manufacturerService.getManufacturerSettings(manufacturerId);

            res.json({
                success: true,
                data: settingsData,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error('❌ Load settings error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to load settings data',
                message: error.message
            });
        }
    }

    /**
     * Save company information
     * PUT /manufacturer/settings/company
     */
    async saveCompanyInfo(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const companyData = req.body;

            // Validate required fields
            const requiredFields = ['companyName', 'activityType', 'taxNumber'];
            for (const field of requiredFields) {
                if (!companyData[field]) {
                    return res.status(400).json({
                        success: false,
                        error: `${field} is required`
                    });
                }
            }

            // Additional validation
            if (companyData.companyName && companyData.companyName.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    error: 'Company name must be at least 2 characters'
                });
            }

            if (companyData.taxNumber && !/^\d{6,20}$/.test(companyData.taxNumber.trim())) {
                return res.status(400).json({
                    success: false,
                    error: 'Tax number must be 6-20 digits'
                });
            }

            if (companyData.establishedYear) {
                const year = parseInt(companyData.establishedYear);
                const currentYear = new Date().getFullYear();
                if (year < 1900 || year > currentYear) {
                    return res.status(400).json({
                        success: false,
                        error: `Established year must be between 1900 and ${currentYear}`
                    });
                }
            }

            if (companyData.companyDescription && companyData.companyDescription.trim().length > 500) {
                return res.status(400).json({
                    success: false,
                    error: 'Company description must not exceed 500 characters'
                });
            }

            const result = await this.manufacturerService.updateCompanyInfo(manufacturerId, companyData);

            res.json({
                success: true,
                message: 'Kompaniya ma\'lumotlari muvaffaqiyatli saqlandi',
                data: result
            });

        } catch (error) {
            this.logger.error('❌ Save company info error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to save company information',
                message: error.message
            });
        }
    }

    /**
     * Save contact information
     * PUT /manufacturer/settings/contact
     */
    async saveContactInfo(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const contactData = req.body;
    // Validate email format
            if (contactData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactData.email)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid email format'
                });
            }

            const result = await this.manufacturerService.updateContactInfo(manufacturerId, contactData);

            res.json({
                success: true,
                message: 'Aloqa ma\'lumotlari muvaffaqiyatli saqlandi',
                data: result
            });

        } catch (error) {
            this.logger.error('❌ Save contact info error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to save contact information',
                message: error.message
            });
        }
    }

    /**
     * Save business information
     * PUT /manufacturer/settings/business
     */
    async saveBusinessInfo(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const businessData = req.body;

            const result = await this.manufacturerService.updateBusinessInfo(manufacturerId, businessData);

            res.json({
                success: true,
                message: 'Biznes ma\'lumotlari muvaffaqiyatli saqlandi',
                data: result
            });

        } catch (error) {
            this.logger.error('❌ Save business info error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to save business information',
                message: error.message
            });
        }
    }

    /**
     * Change password
     * PUT /manufacturer/settings/change-password
     */
    async changePassword(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const { currentPassword, newPassword } = req.body;
      // Validate required fields
            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Current password and new password are required'
                });
            }

            // Validate password strength
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(newPassword)) {
                return res.status(400).json({
                    success: false,
                    error: 'Password must be at least 8 characters with uppercase, lowercase, and number'
                });
            }

            const result = await this.manufacturerService.changePassword(manufacturerId, currentPassword, newPassword);

            res.json({
                success: true,
                message: 'Parol muvaffaqiyatli o\'zgartirildi'
            });

        } catch (error) {
            this.logger.error('❌ Change password error:', error);
            
            if (error.message === 'Invalid current password') {
                return res.status(400).json({
                    success: false,
                    error: 'Joriy parol noto\'g\'ri'
                });
            }

            res.status(500).json({
                success: false,
                error: 'Failed to change password',
                message: error.message
            });
        }
    }

    /**
     * Save preferences
     * PUT /manufacturer/settings/preferences
     */
    async savePreferences(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const preferences = req.body;
     const result = await this.manufacturerService.updatePreferences(manufacturerId, preferences);

            res.json({
                success: true,
                message: 'Sozlamalar muvaffaqiyatli saqlandi',
                data: result
            });

        } catch (error) {
            this.logger.error('❌ Save preferences error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to save preferences',
                message: error.message
            });
        }
    }

    /**
     * Save integrations
     * PUT /manufacturer/settings/integrations
     */
    async saveIntegrations(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const integrations = req.body;

            const result = await this.manufacturerService.updateIntegrations(manufacturerId, integrations);

            res.json({
                success: true,
                message: 'Integratsiyalar muvaffaqiyatli saqlandi',
                data: result
            });

        } catch (error) {
            this.logger.error('❌ Save integrations error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to save integrations',
                message: error.message
            });
        }
    }

    /**
     * Upload company logo
     * POST /manufacturer/settings/upload-logo
     */
    async uploadLogo(req, res) {
        try {
            const manufacturerId = req.user.userId;
        
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                });
            }

            const result = await this.manufacturerService.uploadCompanyLogo(manufacturerId, req.file);

            res.json({
                success: true,
                message: 'Logo muvaffaqiyatli yuklandi',
                data: {
                    logoUrl: result.logoUrl,
                    filename: result.filename
                }
            });

        } catch (error) {
            this.logger.error('❌ Logo upload error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to upload logo',
                message: error.message
            });
        }
    }

    /**
     * Auto-save settings
     * PUT /manufacturer/settings/auto-save
     */
    async autoSaveSettings(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const { tab, data } = req.body;

            // Silent auto-save, no detailed logging
            await this.manufacturerService.autoSaveSettings(manufacturerId, tab, data);

            res.json({
                success: true,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            // Silent failure for auto-save
            res.json({
                success: false,
                error: 'Auto-save failed'
            });
        }
    }

    // ===============================================
    // DASHBOARD API METHODS
    // ===============================================

    /**
     * API: Get manufacturer dashboard statistics
     */
    async getDashboardStats(req, res) {
        try {
            const manufacturerId = req.user.userId || req.user._id;
            
            if (!manufacturerId) {
                return this.handleAPIError(res, new Error('User ID not found'), 'User authentication required');
            }
            
            const { period = '30' } = req.query;
            const stats = await this.manufacturerService.getDashboardStats(manufacturerId, period);
            
            this.sendSuccess(res, stats, 'Dashboard stats retrieved successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to get dashboard stats');
        }
    }

    /**
     * API: Get production metrics
     */
    async getProductionMetrics(req, res) {
        try {
            const manufacturerId = req.user.userId || req.user._id;
            
            if (!manufacturerId) {
                return this.handleAPIError(res, new Error('User ID not found'), 'User authentication required');
            }
            
            const { period = '30' } = req.query;
            
            const metrics = await this.manufacturerService.getProductionMetrics(manufacturerId, period);
            
            this.sendSuccess(res, metrics, 'Production metrics retrieved successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to get production metrics');
        }
    }

    /**
     * API: Get sales analytics
     */
    async getSalesAnalytics(req, res) {
        try {
            const manufacturerId = req.user.userId || req.user._id;
            
            if (!manufacturerId) {
                return this.handleAPIError(res, new Error('User ID not found'), 'User authentication required');
            }
            
            const { period = '30' } = req.query;
            
            const analytics = await this.manufacturerService.getSalesAnalytics(manufacturerId, period);
            
            this.sendSuccess(res, analytics, 'Sales analytics retrieved successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to get sales analytics');
        }
    }

    /**
     * API: Get equipment status
     */
    async getEquipmentStatus(req, res) {
        try {
            const manufacturerId = req.user.userId || req.user._id;
            
            if (!manufacturerId) {
                return this.handleAPIError(res, new Error('User ID not found'), 'User authentication required');
            }
            
            const equipmentStatus = await this.manufacturerService.getEquipmentStatus(manufacturerId);
            
            this.sendSuccess(res, equipmentStatus, 'Equipment status retrieved successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to get equipment status');
        }
    }

    /**
     * API: Get quality metrics
     */
    async getQualityMetrics(req, res) {
        try {
            const manufacturerId = req.user.userId || req.user._id;
            
            if (!manufacturerId) {
                return this.handleAPIError(res, new Error('User ID not found'), 'User authentication required');
            }
            
            const { period = '30' } = req.query;
            
            const qualityMetrics = await this.manufacturerService.getQualityMetrics(manufacturerId, period);
            
            this.sendSuccess(res, qualityMetrics, 'Quality metrics retrieved successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to get quality metrics');
        }
    }

    /**
     * API: Get notifications
     */
    async getNotifications(req, res) {
        try {
            const manufacturerId = req.user.userId || req.user._id;
            
            if (!manufacturerId) {
                return this.handleAPIError(res, new Error('User ID not found'), 'User authentication required');
            }
            
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                type: req.query.type,
                read: req.query.read,
                unread: req.query.unread
            };
                       
            const notifications = await this.manufacturerService.getNotifications(manufacturerId, options);
            
            this.sendSuccess(res, notifications, 'Notifications retrieved successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to get notifications');
        }
    }

    // ===============================================
    // PRODUCTION MANAGEMENT API METHODS
    // ===============================================

    /**
     * API: Get production orders
     */
    async getProductionOrders(req, res) {
        try {
            const manufacturerId = req.user.userId || req.user._id;
            
            if (!manufacturerId) {
                return this.handleAPIError(res, new Error('User ID not found'), 'User authentication required');
            }
            
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20,
                status: req.query.status,
                priority: req.query.priority,
                sortBy: req.query.sortBy || 'createdAt',
                sortOrder: req.query.sortOrder || 'desc'
            };
            
            const result = await this.manufacturerService.getProductionOrders(manufacturerId, options);
            
            this.sendSuccess(res, result, 'Production orders retrieved successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to get production orders');
        }
    }

    /**
     * API: Create production order
     */
    async createProductionOrder(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const orderData = req.body;
            
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return this.sendValidationError(res, errors);
            }
            
            const order = await this.manufacturerService.createProductionOrder(manufacturerId, orderData);
            
            this.sendSuccess(res, order, 'Production order created successfully', 201);

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to create production order');
        }
    }

    /**
     * API: Update production order status
     */
    async updateProductionStatus(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const { orderId } = req.params;
            const { status, notes } = req.body;
            
            const result = await this.manufacturerService.updateProductionStatus(orderId, manufacturerId, status, notes);
            
            this.sendSuccess(res, result, 'Production status updated successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to update production status');
        }
    }

    /**
     * API: Get production schedule
     */
    async getProductionSchedule(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const { startDate, endDate } = req.query;
            
            const schedule = await this.manufacturerService.getProductionSchedule(manufacturerId, startDate, endDate);
            
            this.sendSuccess(res, schedule, 'Production schedule retrieved successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to get production schedule');
        }
    }

    /**
     * API: Get quality metrics
     */
    async getQualityMetrics(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const { period = '30' } = req.query;
            
            const metrics = await this.manufacturerService.getQualityMetrics(manufacturerId, period);
            
            this.sendSuccess(res, metrics, 'Quality metrics retrieved successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to get quality metrics');
        }
    }

    // ===============================================
    // PRODUCT DEVELOPMENT API METHODS
    // ===============================================

    /**
     * API: Get product development pipeline
     */
    async getProductPipeline(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const { stage } = req.query;
            
            const pipeline = await this.manufacturerService.getProductPipeline(manufacturerId, stage);
            
            this.sendSuccess(res, pipeline, 'Product pipeline retrieved successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to get product pipeline');
        }
    }

    /**
     * API: Create new product
     */
    async createProduct(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const productData = req.body;
            
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return this.sendValidationError(res, errors);
            }
            
            const product = await this.manufacturerService.createProduct(manufacturerId, productData);
            
            this.sendSuccess(res, product, 'Product created successfully', 201);

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to create product');
        }
    }

    /**
     * API: Update product status
     */
    async updateProductStatus(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const { productId } = req.params;
            const { status, notes } = req.body;
            
            const result = await this.manufacturerService.updateProductStatus(productId, manufacturerId, status, notes);
            
            this.sendSuccess(res, result, 'Product status updated successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to update product status');
        }
    }

    /**
     * API: Get product lifecycle
     */
    async getProductLifecycle(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const { productId } = req.params;
            
            const lifecycle = await this.manufacturerService.getProductLifecycle(productId, manufacturerId);
            
            this.sendSuccess(res, lifecycle, 'Product lifecycle retrieved successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to get product lifecycle');
        }
    }

    // ===============================================
    // DISTRIBUTION API METHODS
    // ===============================================

    /**
     * API: Get distributor partners
     */
    async getDistributorPartners(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20,
                status: req.query.status,
                region: req.query.region
            };
            
            const partners = await this.manufacturerService.getDistributorPartners(manufacturerId, options);
            
            this.sendSuccess(res, partners, 'Distributor partners retrieved successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to get distributor partners');
        }
    }

    /**
     * API: Invite distributor
     */
    async inviteDistributor(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const invitationData = req.body;
            
            const result = await this.manufacturerService.inviteDistributor(manufacturerId, invitationData);
            
            this.sendSuccess(res, result, 'Distributor invitation sent successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to invite distributor');
        }
    }

    /**
     * API: Get channel performance
     */
    async getChannelPerformance(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const { period = '30' } = req.query;
            
            const performance = await this.manufacturerService.getChannelPerformance(manufacturerId, period);
            
            this.sendSuccess(res, performance, 'Channel performance retrieved successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to get channel performance');
        }
    }

    // ===============================================
    // OPERATIONS API METHODS
    // ===============================================

    /**
     * API: Get supply chain status
     */
    async getSupplyChainStatus(req, res) {
        try {
            const manufacturerId = req.user.userId;
            
            const status = await this.manufacturerService.getSupplyChainStatus(manufacturerId);
            
            this.sendSuccess(res, status, 'Supply chain status retrieved successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to get supply chain status');
        }
    }

    /**
     * API: Get equipment status
     */
    async getEquipmentStatus(req, res) {
        try {
            const manufacturerId = req.user.userId;
            
            const status = await this.manufacturerService.getEquipmentStatus(manufacturerId);
            
            this.sendSuccess(res, status, 'Equipment status retrieved successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to get equipment status');
        }
    }

    /**
     * API: Get raw materials inventory
     */
    async getRawMaterialsInventory(req, res) {
        try {
            const manufacturerId = req.user.userId;
            
            const inventory = await this.manufacturerService.getRawMaterialsInventory(manufacturerId);
            
            this.sendSuccess(res, inventory, 'Raw materials inventory retrieved successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to get raw materials inventory');
        }
    }

    // ===============================================
    // ANALYTICS API METHODS
    // ===============================================

    /**
     * API: Get business intelligence data
     */
    async getBusinessIntelligence(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const { period = '30' } = req.query;
            
            const intelligence = await this.manufacturerService.getBusinessIntelligence(manufacturerId, period);
            
            this.sendSuccess(res, intelligence, 'Business intelligence retrieved successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to get business intelligence');
        }
    }

    /**
     * API: Get financial reports
     */
    async getFinancialReports(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const { period = '30', reportType = 'summary' } = req.query;
            
            const reports = await this.manufacturerService.getFinancialReports(manufacturerId, period, reportType);
            
            this.sendSuccess(res, reports, 'Financial reports retrieved successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to get financial reports');
        }
    }

    /**
     * API: Get cost analysis
     */
    async getCostAnalysis(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const { period = '30' } = req.query;
            
            const analysis = await this.manufacturerService.getCostAnalysis(manufacturerId, period);
            
            this.sendSuccess(res, analysis, 'Cost analysis retrieved successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to get cost analysis');
        }
    }

    /**
     * API: Get profitability report
     */
    async getProfitabilityReport(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const { period = '30' } = req.query;
            
            const report = await this.manufacturerService.getProfitabilityReport(manufacturerId, period);
            
            this.sendSuccess(res, report, 'Profitability report retrieved successfully');

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to get profitability report');
        }
    }

    // ===============================================
    // EXPORT API METHODS
    // ===============================================

    /**
     * API: Export production report
     */
    async exportProductionReport(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const { format = 'excel', period = '30' } = req.query;
            
            const report = await this.manufacturerService.exportProductionReport(manufacturerId, format, period);
            
            res.setHeader('Content-Type', report.contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
            res.send(report.data);

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to export production report');
        }
    }

    /**
     * API: Export sales report
     */
    async exportSalesReport(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const { format = 'excel', period = '30' } = req.query;
            
            const report = await this.manufacturerService.exportSalesReport(manufacturerId, format, period);
            
            res.setHeader('Content-Type', report.contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
            res.send(report.data);

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to export sales report');
        }
    }

    /**
     * API: Export financial report
     */
    async exportFinancialReport(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const { format = 'excel', period = '30', reportType = 'summary' } = req.query;
            
            const report = await this.manufacturerService.exportFinancialReport(manufacturerId, format, period, reportType);
            
            res.setHeader('Content-Type', report.contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
            res.send(report.data);

        } catch (error) {
            this.handleAPIError(res, error, 'Failed to export financial report');
        }
    }

    // ===============================================
    // UTILITY METHODS
    // ===============================================

    /**
     * Send success response
     */
    sendSuccess(res, data, message = 'Success', statusCode = 200, meta = {}) {
        res.status(statusCode).json({
            success: true,
            message,
            data,
            timestamp: new Date().toISOString(),
            ...meta
        });
    }

    /**
     * Send error response
     */
    sendError(res, message, statusCode = 400, details = null) {
        const response = {
            success: false,
            message,
            timestamp: new Date().toISOString()
        };
        
        if (details) {
            response.details = details;
        }
        
        res.status(statusCode).json(response);
    }

    /**
     * Send validation error response
     */
    sendValidationError(res, errors) {
        this.sendError(res, 'Validation failed', 400, errors.array());
    }

    /**
     * Handle API errors
     */
    handleAPIError(res, error, message) {
        
        if (error.name === 'ValidationError') {
            return this.sendError(res, error.message, 400);
        }
        
        if (error.name === 'CastError') {
            return this.sendError(res, 'Invalid ID format', 400);
        }
        
        this.sendError(res, message, 500);
    }
    /**
     * Get distributor inquiries API
     */
    async getDistributorInquiries(req, res) {
        try {
            const manufacturerId = req.user.userId;
            
            const inquiriesData = await this.manufacturerService.getDistributorInquiries(manufacturerId);

            res.json({
                success: true,
                data: inquiriesData,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error('❌ Get distributor inquiries error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get distributor inquiries',
                message: error.message
            });
        }
    }

    /**
     * Get communication center API
     */
    async getCommunicationCenter(req, res) {
        try {
            const manufacturerId = req.user.userId;
               const communicationData = await this.manufacturerService.getCommunicationCenter(manufacturerId);

            
            res.json({
                success: true,
                data: communicationData,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error('❌ Get communication center error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get communication center data',
                message: error.message
            });
        }
    }

    /**
     * Get inventory management API
     */
    async getInventoryManagement(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const inventoryData = await this.manufacturerService.getInventoryManagement(manufacturerId);

            res.json({
                success: true,
                data: inventoryData,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error('❌ Get inventory management error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get inventory management data',
                message: error.message
            });
        }
    }

    // ===============================================
    // B2B MARKETPLACE API METHODS
    // ===============================================

    /**
     * API: Get marketplace metrics
     */
    async getMarketplaceMetrics(req, res) {
        try {
            const manufacturerId = req.user.userId;
             const metrics = await this.manufacturerService.getMarketplaceMetrics(manufacturerId);

            res.json({
                success: true,
                data: metrics,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error('❌ Get marketplace metrics error:', error);
            this.handleAPIError(res, error, 'Failed to get marketplace metrics');
        }
    }

    /**
     * API: Get featured products
     */
    async getFeaturedProducts(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const { 
                page = 1, 
                limit = 8,
                sort = 'performance_desc'
            } = req.query;
            
            const result = await this.manufacturerService.getFeaturedProducts(
                manufacturerId, 
                parseInt(page), 
                parseInt(limit),
                sort
            );

            res.json({
                success: true,
                data: result.products,
                pagination: result.pagination,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error('❌ Get featured products error:', error);
            this.handleAPIError(res, error, 'Failed to get featured products');
        }
    }

    /**
     * API: Get recent inquiries
     */
    async getRecentInquiries(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const { limit = 3 } = req.query;

            const inquiries = await this.manufacturerService.getRecentInquiries(manufacturerId, parseInt(limit));

            res.json({
                success: true,
                data: inquiries,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error('❌ Get recent inquiries error:', error);
            this.handleAPIError(res, error, 'Failed to get recent inquiries');
        }
    }

    /**
     * API: Get marketplace chart data
     */
    async getMarketplaceChartData(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const { period = '30d' } = req.query;

            const chartData = await this.manufacturerService.getMarketplaceChartData(manufacturerId, period);

            res.json({
                success: true,
                data: chartData.data,
                period: chartData.period,
                generatedAt: chartData.generatedAt
            });

        } catch (error) {
            this.logger.error('❌ Get marketplace chart data error:', error);
            this.handleAPIError(res, error, 'Failed to get marketplace chart data');
        }
    }

    /**
     * API: Get competitor analysis
     */
    async getCompetitorAnalysis(req, res) {
        try {
            const manufacturerId = req.user.userId;
              const analysis = await this.manufacturerService.getCompetitorAnalysis(manufacturerId);

            res.json({
                success: true,
                data: analysis,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error('❌ Get competitor analysis error:', error);
            this.handleAPIError(res, error, 'Failed to get competitor analysis');
        }
    }

    // ===== PRODUCT MANAGEMENT METHODS =====
    
    /**
     * Show product edit page
     */
    async showEditProduct(req, res) {
        try {
            const productId = req.params.id;
            const manufacturerId = req.user.userId;
      
            // Get product data
            const product = await this.manufacturerService.getProductForEdit(productId, manufacturerId);
            
            if (!product) {
                 
                // Professional approach: render edit page with error message instead of error view
                const lng = this.getLanguagePreference(req);
                const fallbackCategories = await this.manufacturerService.getProductCategories(lng) || [];
                
                return res.render('manufacturer/products/edit', {
                    title: 'Mahsulotni tahrirlash',
                    currentPage: 'products',
                    user: req.user,
                    lng: req.lng || 'uz',
                    t: req.t || ((key) => key),
                    product: {
                        _id: productId,
                        name: '',
                        description: '',
                        shortDescription: '',
                        category: '',
                        subcategory: '',
                        specifications: [],
                        pricing: {
                            basePrice: 0,
                            minimumOrderQuantity: 1,
                            currency: 'USD',
                            bulkPricing: []
                        },
                        inventory: {
                            totalStock: 0,
                            availableStock: 0,
                            reservedStock: 0,
                            unit: 'pieces',
                            lowStockThreshold: 10
                        },
                        images: [],
                        shipping: {
                            weight: 0,
                            dimensions: { length: 0, width: 0, height: 0, unit: 'cm' },
                            packagingType: '',
                            shippingClass: 'standard',
                            leadTime: { min: 3, max: 7 },
                            methods: []
                        },
                        tags: [],
                        status: 'draft',
                        isFeatured: false,
                        isPromoted: false
                    },
                    categories: fallbackCategories,
                    productAnalytics: {
                        totalViews: 0,
                        totalOrders: 0,
                        averageRating: 0,
                        totalRevenue: 0,
                        conversionRate: 0
                    },
                    errorMessage: 'Mahsulot topilmadi yoki sizga tegishli emas. Yangi mahsulot yaratish uchun formani to\'ldiring.'
                });
            }
            
            // Get categories for dropdown with language support
            const lng = this.getLanguagePreference(req);
            const categories = await this.manufacturerService.getProductCategories(lng);
            
            // Get product analytics for context
            const productAnalytics = await this.manufacturerService.getProductAnalytics(productId);
            
            res.render('manufacturer/products/edit', {
                title: 'Mahsulotni tahrirlash',
                currentPage: 'products',
                user: req.user,
                lng: lng,
                t: req.t || ((key) => key),
                product: product,
                categories: categories || [],
                productAnalytics: productAnalytics || {},
                errorMessage: null
            });
            
        } catch (error) {
            this.logger.error('❌ Product edit page error:', error);
            
            // Professional fallback: render page with empty data instead of error page
            try {
                // Get basic categories for fallback with language support
                const lng = this.getLanguagePreference(req);
                const fallbackCategories = await this.manufacturerService.getProductCategories(lng) || [];
                
                res.render('manufacturer/products/edit', {
                    title: 'Mahsulotni tahrirlash',
                    currentPage: 'products',
                    user: req.user,
                    lng: req.lng || 'uz',
                    t: req.t || ((key) => key),
                    product: {
                        _id: req.params.id,
                        name: '',
                        description: '',
                        shortDescription: '',
                        category: '',
                        subcategory: '',
                        specifications: [],
                        pricing: {
                            basePrice: 0,
                            minimumOrderQuantity: 1,
                            currency: 'USD',
                            bulkPricing: []
                        },
                        inventory: {
                            totalStock: 0,
                            availableStock: 0,
                            reservedStock: 0,
                            unit: 'pieces',
                            lowStockThreshold: 10
                        },
                        images: [],
                        shipping: {
                            weight: 0,
                            dimensions: { length: 0, width: 0, height: 0, unit: 'cm' },
                            packagingType: '',
                            shippingClass: 'standard',
                            leadTime: { min: 3, max: 7 },
                            methods: []
                        },
                        tags: [],
                        status: 'draft',
                        isFeatured: false,
                        isPromoted: false
                    },
                    categories: fallbackCategories,
                    productAnalytics: {
                        totalViews: 0,
                        totalOrders: 0,
                        averageRating: 0,
                        totalRevenue: 0,
                        conversionRate: 0
                    },
                    errorMessage: 'Mahsulot ma\'lumotlarini yuklashda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.'
                });
            } catch (fallbackError) {
                this.logger.error('❌ Fallback rendering failed:', fallbackError);
                res.status(500).json({
                    success: false,
                    message: 'Sahifani yuklashda xatolik yuz berdi',
                    error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
                });
            }
        }
    }
    
    /**
     * Show product add page
     */
    async showAddProduct(req, res) {
        try {
            const manufacturerId = req.user.userId;
              
            // Get categories for dropdown with language support
            const lng = this.getLanguagePreference(req);
            const categories = await this.manufacturerService.getProductCategories(lng);
            
            res.render('manufacturer/products/add', {
                title: 'Yangi mahsulot qo\'shish',
                currentPage: 'products',
                user: req.user,
                lng: lng,
                t: req.t || ((key) => key),
                categories: categories || []
            });
            
        } catch (error) {
            this.logger.error('❌ Product add page error:', error);
            
            // Professional fallback: render add page with empty data
            res.render('manufacturer/products/add', {
                title: 'Yangi mahsulot qo\'shish',
                currentPage: 'products',
                user: req.user,
                lng: req.lng || 'uz',
                t: req.t || ((key) => key),
                categories: [],
                errorMessage: 'Sahifani yuklashda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.'
            });
        }
    }
    
    /**
     * Show main analytics page
     */
    async showAnalytics(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const productId = req.query.product; // Product ID from query param
                 // Get comprehensive analytics data with period support
            const period = req.query.period ? parseInt(req.query.period) : 30; // Default 30 days
            const [dashboardStats, businessIntelligence, unreadMessages] = await Promise.all([
                this.manufacturerService.getDashboardStats(manufacturerId, period.toString()),
                this.manufacturerService.getBusinessIntelligence(manufacturerId, period),
                this.manufacturerService.getUnreadMessagesCount(manufacturerId)
            ]);
            
            let productAnalytics = null;
            let productInfo = null;
            if (productId) {
                const [productAnalyticsResult, productInfoResult] = await Promise.all([
                    this.manufacturerService.getProductAnalytics(productId, manufacturerId, period),
                    this.manufacturerService.getProductForEdit(productId, manufacturerId)
                ]);
                productAnalytics = productAnalyticsResult;
                productInfo = productInfoResult;
            }
            
            const lng = this.getLanguagePreference(req);
            
            res.render('manufacturer/analytics/index', {
                title: productId ? 'Mahsulot tahlili' : 'Biznes tahlili',
                currentPage: 'analytics',
                user: req.user,
                lng: lng,
                t: req.t || ((key) => key),
                dashboardStats: dashboardStats || {},
                businessIntelligence: businessIntelligence || {},
                productAnalytics: productAnalytics || {},
                productInfo: productInfo || null,
                productId: productId || null,
                unreadMessages: unreadMessages || 0,
                errorMessage: null
            });
            
        } catch (error) {
            this.logger.error('❌ Analytics page error:', error);
            
            // Professional fallback: render with empty data
            res.render('manufacturer/analytics/index', {
                title: 'Biznes tahlili',
                currentPage: 'analytics',
                user: req.user,
                lng: req.lng || 'uz',
                t: req.t || ((key) => key),
                dashboardStats: {},
                businessIntelligence: {},
                productAnalytics: {},
                productInfo: null,
                productId: null,
                unreadMessages: 0,
                errorMessage: 'Tahlil ma\'lumotlarini yuklashda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.'
            });
        }
    }

    /**
     * Show product analytics page
     */
    async showProductAnalytics(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const productId = req.params.id;
              
            // Get product analytics data
            const productAnalytics = await this.manufacturerService.getProductAnalytics(productId, manufacturerId);
            
            if (!productAnalytics) {
              return res.redirect('/manufacturer/marketplace?error=product_not_found');
            }
            
            const lng = this.getLanguagePreference(req);
            
            // Redirect to general analytics page with product context
            res.redirect(`/manufacturer/analytics?product=${productId}`);
            
        } catch (error) {
            this.logger.error('❌ Product analytics page error:', error);
            
            // Professional fallback: redirect to marketplace with error
            res.redirect('/manufacturer/marketplace?error=analytics_unavailable');
        }
    }
    
    /**
     * Save product as draft
     */
    async saveProductAsDraft(req, res) {
        try {
            const productId = req.params.id;
            const manufacturerId = req.user.userId;
     
            // Get product and verify ownership
            const product = await this.manufacturerService.getProductForEdit(productId, manufacturerId);
            
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Mahsulot topilmadi yoki sizga tegishli emas'
                });
            }
            
            // Update product status to draft and save any changes
            const updateData = {
                ...req.body,
                status: 'draft'
            };
            
            const updatedProduct = await this.manufacturerService.updateProduct(
                productId, 
                manufacturerId, 
                updateData
            );
            
            if (!updatedProduct) {
                return res.status(400).json({
                    success: false,
                    message: 'Qoralama saqlashda xatolik yuz berdi'
                });
            }
                     
            res.json({
                success: true,
                message: 'Mahsulot qoralama sifatida saqlandi',
                data: {
                    productId: updatedProduct._id,
                    status: updatedProduct.status,
                    updatedAt: updatedProduct.updatedAt
                }
            });
            
        } catch (error) {
            this.logger.error('❌ Save as draft error:', error);
            res.status(500).json({
                success: false,
                message: 'Qoralama saqlashda server xatosi',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    /**
     * Publish product (make it active and visible)
     */
    async publishProduct(req, res) {
        try {
            const productId = req.params.id;
            const manufacturerId = req.user.userId;
      
            // Get product and verify ownership
            const product = await this.manufacturerService.getProductForEdit(productId, manufacturerId);
            
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Mahsulot topilmadi yoki sizga tegishli emas'
                });
            }
            
            // Validate required fields for publishing
            const validationErrors = this.validateProductForPublishing(product, req.body);
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Chop etish uchun quyidagi maydonlar to\'ldirilishi shart:',
                    errors: validationErrors
                });
            }
            
            // Update product status to active and save any changes
            const updateData = {
                ...req.body,
                status: 'active',
                visibility: 'public'
            };
            
            const publishedProduct = await this.manufacturerService.updateProduct(
                productId, 
                manufacturerId, 
                updateData
            );
            
            if (!publishedProduct) {
                return res.status(400).json({
                    success: false,
                    message: 'Chop etishda xatolik yuz berdi'
                });
            }
                  
            res.json({
                success: true,
                message: 'Mahsulot muvaffaqiyatli chop etildi va marketplace da ko\'rinadi',
                data: {
                    productId: publishedProduct._id,
                    status: publishedProduct.status,
                    visibility: publishedProduct.visibility,
                    publishedAt: publishedProduct.updatedAt,
                    marketplaceUrl: `/marketplace/product/${publishedProduct._id}`
                }
            });
            
        } catch (error) {
            this.logger.error('❌ Publish product error:', error);
            res.status(500).json({
                success: false,
                message: 'Chop etishda server xatosi',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    /**
     * Validate product for publishing - ensure all required fields are filled
     */
    validateProductForPublishing(existingProduct, updateData = {}) {
        const errors = [];
        
        // Merge existing product data with update data for validation
        const productData = {
            name: updateData.name || existingProduct.name,
            description: updateData.description || existingProduct.description,
            category: updateData.category || existingProduct.category,
            pricing: {
                basePrice: updateData.pricing?.basePrice || existingProduct.pricing?.basePrice,
                minimumOrderQuantity: updateData.pricing?.minimumOrderQuantity || existingProduct.pricing?.minimumOrderQuantity
            },
            inventory: {
                totalStock: updateData.inventory?.totalStock || existingProduct.inventory?.totalStock,
                availableStock: updateData.inventory?.availableStock || existingProduct.inventory?.availableStock,
                unit: updateData.inventory?.unit || existingProduct.inventory?.unit
            },
            images: updateData.images || existingProduct.images || []
        };
        
        // Required field validations
        if (!productData.name || productData.name.trim().length < 3) {
            errors.push('Mahsulot nomi kamida 3 ta belgidan iborat bo\'lishi kerak');
        }
        
        if (!productData.description || productData.description.trim().length < 20) {
            errors.push('Махсулот таъриф камида 20 та belgidan iborat bo\'lishi kerak');
        }
        
        if (!productData.category) {
            errors.push('Kategoriya tanlanishi shart');
        }
        
        if (!productData.pricing.basePrice || productData.pricing.basePrice <= 0) {
            errors.push('Асосiy нарx 0 дан katta bo\'lishi kerak');
        }
        
        if (!productData.pricing.minimumOrderQuantity || productData.pricing.minimumOrderQuantity <= 0) {
            errors.push('Eng kam buyurtma miqdori 0 dan katta bo\'lishi kerak');
        }
        
        if (!productData.inventory.totalStock || productData.inventory.totalStock <= 0) {
            errors.push('Umumiy ombor miqdori 0 dan katta bo\'lishi kerak');
        }
        
        if (!productData.inventory.unit) {
            errors.push('O\'lchov birligi tanlanishi shart');
        }
        
        if (!productData.images || productData.images.length === 0) {
            errors.push('Kamida bitta mahsulot rasmi yuklash shart');
        }
        
        return errors;
    }

    /**
     * Get single product for API
     */
    async getProduct(req, res) {
        try {
            const productId = req.params.id;
            const manufacturerId = req.user.userId;
            
           
            const product = await this.manufacturerService.getProductForEdit(productId, manufacturerId);
            
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Mahsulot topilmadi yoki sizga tegishli emas'
                });
            }
            
            res.json({
                success: true,
                data: product
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Mahsulotni olishda xatolik yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    /**
     * Update product - OPTIMIZED for Image Management
     */
    async updateProduct(req, res) {
        try {
            const productId = req.params.id;
            const manufacturerId = req.user.userId;
            const updateData = req.body;
            
            
            // Extract image data for separate processing
            const imageData = updateData.imageData;
            delete updateData.imageData; // Remove from main update data
            
           
            // Step 1: Handle image cleanup first (delete unused images)
            if (imageData?.deletedImages?.length > 0) {
                try {
                    await this.cleanupDeletedImages(imageData.deletedImages);
                    } catch (cleanupError) {
                     // Don't fail the whole operation for cleanup errors
                }
            }
            
            // Step 2: Process temporary images if any
            let newImageUrls = [];
            if (imageData?.temporaryImages?.length > 0) {
                try {
                    // Note: This requires the actual files to be uploaded separately
                    // For now, we'll just prepare the metadata
                    } catch (uploadError) {
                    }
            }
            
            // Step 3: Prepare final image array for product
            const finalImages = [
                // Keep existing images (not deleted)
                ...(imageData?.existingImages || []).map(img => ({
                    url: img.url,
                    alt: img.alt,
                    isPrimary: img.isPrimary
                })),
                // Add new uploaded images (when implemented)
                ...newImageUrls
            ];
            
            // Add final images to update data
            if (finalImages.length > 0) {
                updateData.images = finalImages;
            }
            
            // Step 4: Update product with optimized data
            const updatedProduct = await this.manufacturerService.updateProduct(productId, manufacturerId, updateData);
            
            if (!updatedProduct) {
                return res.status(404).json({
                    success: false,
                    message: 'Mahsulot topilmadi yoki yangilash imkoni yo\'q'
                });
            }
            
            
            res.json({
                success: true,
                message: 'Mahsulot muvaffaqiyatli yangilandi',
                data: {
                    product: updatedProduct,
                    imageOperations: {
                        deletedCount: imageData?.deletedImages?.length || 0,
                        newImagesCount: imageData?.temporaryImages?.length || 0,
                        finalImagesCount: finalImages.length
                    }
                }
            });
            
        } catch (error) {
            
            // Enhanced error response
            let errorMessage = 'Mahsulotni yangilashda xatolik yuz berdi';
            if (error.message.includes('PayloadTooLargeError')) {
                errorMessage = 'Ma\'lumot hajmi juda katta. Rasmlar sonini kamaytiring.';
            } else if (error.message.includes('request entity too large')) {
                errorMessage = 'Yuborilgan ma\'lumot hajmi juda katta.';
            }
            
            res.status(500).json({
                success: false,
                message: errorMessage,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Cleanup deleted images helper method
     */
    async cleanupDeletedImages(deletedImages) {
        const fs = require('fs').promises;
        const path = require('path');
        let deletedCount = 0;
        
        for (const imgData of deletedImages) {
            try {
                if (imgData.url && imgData.type === 'existing') {
                    const filename = path.basename(imgData.url);
                    const filePath = path.join(__dirname, '../public/uploads/products', filename);
                    
                    try {
                        await fs.access(filePath);
                        await fs.unlink(filePath);
                        deletedCount++;
                    } catch (fileError) {
                      
                    }
                }
            } catch (error) {
                this.logger.warn(`⚠️ Error processing deleted image:`, error.message);
            }
        }
        
        return deletedCount;
    }
    
    /**
     * Create new product - Professional B2B Implementation
     */
    /**
     * Upload product images (Legacy method for immediate upload)
     */
    async uploadProductImages(req, res) {
        try {
            const manufacturerId = req.user.userId;
            
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Rasm fayllari topilmadi'
                });
            }
      
            const imageUrls = req.files.map(file => `/uploads/products/${file.filename}`);
            
            res.status(200).json({
                success: true,
                message: 'Rasmlar muvaffaqiyatli yuklandi',
                data: {
                    urls: imageUrls
                }
            });
            
        } catch (error) {
            this.logger.error('❌ Upload product images error:', error);
            res.status(500).json({
                success: false,
                message: 'Rasmlarni yuklashda xatolik yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * PROFESSIONAL Final Image Upload for optimized workflow
     * Used by professional image management system
     */
    async uploadImagesFinal(req, res) {
        try {
            const manufacturerId = req.user.userId;
            
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Rasm fayllari topilmadi'
                });
            }
               // Debug file information
            req.files.forEach((file, index) => {
                this.logger.log(`📁 File ${index + 1}: ${file.originalname} → ${file.filename}`);
            });
            
            // Process images with metadata
            const processedImages = req.files.map((file, index) => {
                const metadata = {
                    alt: req.body[`metadata[${index}][alt]`] || '',
                    isPrimary: req.body[`metadata[${index}][isPrimary]`] === 'true'
                };
                
                return {
                    url: `/uploads/products/${file.filename}`,
                    alt: metadata.alt,
                    isPrimary: metadata.isPrimary,
                    filename: file.originalname,
                    size: file.size,
                    mimeType: file.mimetype
                };
            });
                    
            const response = {
                success: true,
                message: 'Rasmlar muvaffaqiyatli yuklandi',
                data: processedImages
            };
             
            res.status(200).json(response);
            
        } catch (error) {
            this.logger.error('❌ Final image upload error:', error);
            res.status(500).json({
                success: false,
                message: 'Rasmlarni yuklashda xatolik yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Delete unused images from server
     * Used by professional image management system for cleanup
     */
    async deleteUnusedImages(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const { imageUrls } = req.body;
            
            if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'O\'chiriladigan rasmlar ro\'yxati topilmadi'
                });
            }
                   const fs = require('fs').promises;
            const path = require('path');
            let deletedCount = 0;
            
            for (const imageUrl of imageUrls) {
                try {
                    // Extract filename from URL (e.g., "/uploads/products/image.jpg" -> "image.jpg")
                    const filename = imageUrl.split('/').pop();
                    const filePath = path.join(__dirname, '../public/uploads/products', filename);
                    
                    // Check if file exists and delete it
                    await fs.unlink(filePath);
                    deletedCount++;
                } catch (fileError) {
                    this.logger.error(`❌ Failed to delete file: ${imageUrl}`, fileError);
                    // Continue with other files even if one fails
                }
            }
                 
            res.status(200).json({
                success: true,
                message: `${deletedCount} ta rasm o'chirildi`,
                data: {
                    requested: imageUrls.length,
                    deleted: deletedCount
                }
            });
            
        } catch (error) {
            this.logger.error('❌ Delete unused images error:', error);
            res.status(500).json({
                success: false,
                message: 'Rasmlarni o\'chirishda xatolik yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Create new product - OPTIMIZED for Professional Image Management
     */
    async createProduct(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const productData = { ...req.body, manufacturer: manufacturerId };
       
            
            // Extract image data for separate processing
            const imageData = productData.imageData;
            delete productData.imageData; // Remove from main product data
               
            // Professional validation
            if (!productData.name || !productData.category || !productData.description) {
                return res.status(400).json({
                    success: false,
                    message: 'Majburiy maydonlar to\'ldirilmagan',
                    errors: [
                        !productData.name && 'Mahsulot nomi kiritilishi shart',
                        !productData.category && 'Kategoriya tanlanishi shart',
                        !productData.description && 'Mahsulot tavsifi kiritilishi shart'
                    ].filter(Boolean)
                });
            }
            
            // Step 1: Prepare final image array for product creation
            const finalImages = [
                // Add existing images (already uploaded)
                ...(imageData?.existingImages || []).map(img => ({
                    url: img.url,
                    alt: img.alt,
                    isPrimary: img.isPrimary
                }))
                // Note: temporaryImages are handled separately by frontend upload process
            ];
            
            // Add final images to product data
            if (finalImages.length > 0) {
                productData.images = finalImages;
             } 
            
            // Step 2: Create product with optimized data
            const newProduct = await this.manufacturerService.createProduct(productData);
         
            res.status(201).json({
                success: true,
                message: 'Mahsulot muvaffaqiyatli yaratildi',
                data: {
                    productId: newProduct._id,
                    name: newProduct.name,
                    status: newProduct.status,
                    marketplaceUrl: newProduct.marketplaceUrl,
                    createdAt: newProduct.createdAt,
                    imagesCount: finalImages.length
                }
            });
            
        } catch (error) {
            this.logger.error('❌ Optimized create product error:', error);
            
            // Professional error response with specific handling
            let statusCode = 500;
            let errorMessage = 'Mahsulot yaratishda xatolik yuz berdi';
            
            // Enhanced error handling for different error types
            if (error.message.includes('PayloadTooLargeError')) {
                errorMessage = 'Ma\'lumot hajmi juda katta. Rasmlar sonini kamaytiring.';
            } else if (error.message.includes('request entity too large')) {
                errorMessage = 'Yuborilgan ma\'lumot hajmi juda katta.';
            } else if (error.message.includes('Validation error')) {
                statusCode = 400;
                errorMessage = error.message;
            } else if (error.message.includes('already exists')) {
                statusCode = 409;
                errorMessage = 'Bunday nomli mahsulot allaqachon mavjud';
            } else if (error.message.includes('Manufacturer not found')) {
                statusCode = 403;
                errorMessage = 'Manufacturer hisobi topilmadi yoki faol emas';
            }
            
            res.status(statusCode).json({
                success: false,
                message: errorMessage,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    /**
     * Save product as draft API endpoint
     */
    async saveProductAsDraft(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const productData = { ...req.body, manufacturer: manufacturerId, status: 'draft' };
            
            
            const draftProduct = await this.manufacturerService.createProduct(productData);
            
            res.json({
                success: true,
                message: 'Mahsulot qoralama sifatida saqlandi',
                data: {
                    productId: draftProduct._id,
                    status: draftProduct.status
                }
            });
            
        } catch (error) {
            this.logger.error('❌ Save draft error:', error);
            res.status(500).json({
                success: false,
                message: 'Qoralama saqlashda xatolik yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    /**
     * Publish product API endpoint
     */
    async publishProduct(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const productData = { ...req.body, manufacturer: manufacturerId, status: 'active' };
                 
            // Enhanced validation for publishing
            const validationErrors = [];
            
            if (!productData.name || productData.name.trim().length < 3) {
                validationErrors.push('Mahsulot nomi kamida 3 ta belgidan iborat bo\'lishi kerak');
            }
            
            if (!productData.description || productData.description.trim().length < 20) {
                validationErrors.push('Mahsulot ta\'rif kamida 20 ta belgidan iborat bo\'lishi kerak');
            }
            
            if (!productData.category) {
                validationErrors.push('Kategoriya tanlanishi shart');
            }
            
            if (!productData.pricing?.basePrice || productData.pricing.basePrice <= 0) {
                validationErrors.push('Asosiy narx 0 dan katta bo\'lishi kerak');
            }
            
            if (!productData.pricing?.minimumOrderQuantity || productData.pricing.minimumOrderQuantity <= 0) {
                validationErrors.push('Eng kam buyurtma miqdori 0 dan katta bo\'lishi kerak');
            }
            
            if (!productData.images || !Array.isArray(productData.images) || productData.images.length === 0) {
                validationErrors.push('Kamida bitta mahsulot rasmi yuklash shart');
            }
            
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Chop etish uchun quyidagi maydonlarni to\'ldiring',
                    errors: validationErrors
                });
            }
            
            const publishedProduct = await this.manufacturerService.createProduct(productData);
   
            res.status(201).json({
                success: true,
                message: 'Mahsulot muvaffaqiyatli chop etildi',
                data: {
                    productId: publishedProduct._id,
                    name: publishedProduct.name,
                    status: publishedProduct.status,
                    marketplaceUrl: publishedProduct.marketplaceUrl,
                    publishedAt: publishedProduct.createdAt
                }
            });
            
        } catch (error) {
            this.logger.error('❌ Publish product error:', error);
            res.status(500).json({
                success: false,
                message: 'Mahsulotni chop etishda xatolik yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    /**
     * Upload product images API endpoint
     */
    async uploadProductImages(req, res) {
        try {
            const manufacturerId = req.user.userId;
    
            if (!req.files || !req.files.images) {
                return res.status(400).json({
                    success: false,
                    message: 'Hech qanday rasm yuklanmadi'
                });
            }
            
            // Handle multiple files
            const files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
            
            // Validate file types and sizes
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            const maxSize = 5 * 1024 * 1024; // 5MB
            const maxFiles = 10;
            
            if (files.length > maxFiles) {
                return res.status(400).json({
                    success: false,
                    message: `Maksimal ${maxFiles} ta rasm yuklash mumkin`
                });
            }
            
            for (const file of files) {
                if (!allowedTypes.includes(file.mimetype)) {
                    return res.status(400).json({
                        success: false,
                        message: `Noto'g'ri fayl turi: ${file.name}. Faqat JPG, PNG, WebP ruxsat etilgan.`
                    });
                }
                
                if (file.size > maxSize) {
                    return res.status(400).json({
                        success: false,
                        message: `Fayl juda katta: ${file.name}. Maksimal 5MB ruxsat etilgan.`
                    });
                }
            }
            
            // Upload files using proper file upload service
            const uploadedUrls = await Promise.all(files.map(async (file, index) => {
                try {
                    // Use your file upload service here (AWS S3, local storage, etc.)
                    const result = await this.manufacturerService.uploadProductImage(manufacturerId, file);
                    return result.url;
                } catch (error) {
                    this.logger.error(`❌ File upload error for file ${index}:`, error);
                    throw new Error(`File upload failed for ${file.name}`);
                }
            }));
                 
            res.json({
                success: true,
                message: `${uploadedUrls.length} ta rasm muvaffaqiyatli yuklandi`,
                data: {
                    urls: uploadedUrls,
                    count: uploadedUrls.length
                }
            });
            
        } catch (error) {
            this.logger.error('❌ Upload images error:', error);
            res.status(500).json({
                success: false,
                message: 'Rasmlarni yuklashda xatolik yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    /**
     * Delete product
     */
    async deleteProduct(req, res) {
        try {
            const productId = req.params.id;
            const manufacturerId = req.user.userId;
              
            const deleted = await this.manufacturerService.deleteProduct(productId, manufacturerId);
            
            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Mahsulot topilmadi yoki o\'chirish imkoni yo\'q'
                });
            }
      
            res.json({
                success: true,
                message: 'Mahsulot muvaffaqiyatli o\'chirildi'
            });
            
        } catch (error) {
            this.logger.error('❌ Delete product error:', error);
            res.status(500).json({
                success: false,
                message: 'Mahsulotni o\'chirishda xatolik yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    /**
     * Upload product images - LEGACY METHOD (immediate upload)
     */
    async uploadProductImages(req, res) {
        try {
            const manufacturerId = req.user.userId;
   
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Rasm fayllar yuklanmadi'
                });
            }
            
            const imageUrls = await this.manufacturerService.uploadProductImages(req.files);
    
            res.json({
                success: true,
                message: 'Rasmlar muvaffaqiyatli yuklandi',
                data: {
                    urls: imageUrls,
                    count: imageUrls.length
                }
            });
            
        } catch (error) {
            this.logger.error('❌ Legacy upload images error:', error);
            res.status(500).json({
                success: false,
                message: 'Rasmlarni yuklashda xatolik yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * PROFESSIONAL Final Image Upload - Called when saving product
     * Only uploads images when user actually saves the product
     */
    async uploadImagesFinal(req, res) {
        try {
            const manufacturerId = req.user.userId;
            
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Rasmlar yuklanmadi'
                });
            }
      
            const uploadedImages = [];
            
            // Process each image with metadata
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const altText = req.body[`imageAlt_${i}`] || '';
                const isPrimary = req.body[`isPrimary_${i}`] === 'true';
                
               
                const imageData = {
                    url: `/uploads/products/${file.filename}`,
                    alt: altText,
                    isPrimary: isPrimary,
                    uploadDate: new Date(),
                    originalName: file.originalname,
                    size: file.size,
                    mimeType: file.mimetype
                };
                
                uploadedImages.push(imageData);
                this.logger.log(`✅ Processed: ${file.originalname} (${isPrimary ? 'PRIMARY' : 'secondary'})`);
            }
            
            // Ensure at least one primary image
            const hasPrimary = uploadedImages.some(img => img.isPrimary);
            if (!hasPrimary && uploadedImages.length > 0) {
                uploadedImages[0].isPrimary = true;
            }
            
            res.json({
                success: true,
                message: `${uploadedImages.length} ta rasm muvaffaqiyatli yuklandi`,
                data: {
                    images: uploadedImages,
                    urls: uploadedImages.map(img => img.url) // Legacy compatibility
                }
            });
            
        } catch (error) {
            this.logger.error('❌ Final image upload error:', error);
            res.status(500).json({
                success: false,
                message: 'Rasmlarni final upload qilishda xatolik',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * PROFESSIONAL Image Cleanup - Delete unused images
     */
    async deleteUnusedImages(req, res) {
        try {
            const { imageUrls } = req.body;
            const manufacturerId = req.user.userId;
            
            if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
                return res.json({
                    success: true,
                    message: 'Hech qanday rasm o\'chirilmadi',
                    data: { deletedCount: 0 }
                });
            }
            
            const fs = require('fs').promises;
            const path = require('path');
            let deletedCount = 0;
            const errors = [];
            
            for (const imageUrl of imageUrls) {
                try {
                    // Extract filename from URL
                    const filename = path.basename(imageUrl);
                    const filePath = path.join(__dirname, '../public/uploads/products', filename);
                    
                    // Check if file exists and delete
                    try {
                        await fs.access(filePath);
                        await fs.unlink(filePath);
                        deletedCount++;
                    } catch (fileError) {
                        if (fileError.code !== 'ENOENT') { // File not found is OK
                            errors.push(`Failed to delete ${filename}: ${fileError.message}`);
                        }
                    }
                    
                } catch (error) {
                    errors.push(`Error processing ${imageUrl}: ${error.message}`);
                }
            }
            
            res.json({
                success: true,
                message: `${deletedCount} ta rasm o'chirildi`,
                data: {
                    deletedCount,
                    totalRequested: imageUrls.length,
                    errors: errors.length > 0 ? errors : undefined
                }
            });
            
        } catch (error) {
            this.logger.error('❌ Image cleanup error:', error);
            res.status(500).json({
                success: false,
                message: 'Rasmlarni o\'chirishda xatolik',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    /**
     * Get product analytics via API
     */
    async getProductAnalytics(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const productId = req.params.id;
            const period = parseInt(req.query.period) || 30; // Default 30 days
            

            
            const analytics = await this.manufacturerService.getProductAnalytics(productId, manufacturerId, period);
            
            if (!analytics) {
                return res.status(404).json({
                    success: false,
                    message: 'Mahsulot topilmadi yoki sizga tegishli emas'
                });
            }
            
            res.json({
                success: true,
                data: analytics
            });
            
        } catch (error) {
            this.logger.error('❌ API: Get product analytics error:', error);
            res.status(500).json({
                success: false,
                message: 'Mahsulot tahlillarini olishda xatolik',
                error: error.message
            });
        }
    }
    
    /**
     * Get business analytics via API with period support
     */
    async getBusinessAnalytics(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const period = parseInt(req.query.period) || 30; // Default 30 days
        const [dashboardStats, businessIntelligence] = await Promise.all([
                this.manufacturerService.getDashboardStats(manufacturerId, period.toString()),
                this.manufacturerService.getBusinessIntelligence(manufacturerId, period)
            ]);
             
            res.json({
                success: true,
                data: {
                    dashboardStats,
                    businessIntelligence,
                    period: period,
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error) {
            this.logger.error('❌ API: Get business analytics error:', error);
            res.status(500).json({
                success: false,
                message: 'Biznes tahlillarini olishda xatolik',
                error: error.message
            });
        }
    }
    
    /**
     * Export product report
     */
    async exportProductReport(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const productId = req.params.id;
            
            // For now, return a JSON response
            // In production, you would generate a PDF/Excel file
            const analytics = await this.manufacturerService.getProductAnalytics(productId, manufacturerId);
            
            if (!analytics) {
                return res.status(404).json({
                    success: false,
                    message: 'Mahsulot topilmadi'
                });
            }
            
            res.json({
                success: true,
                message: 'Hisobot tayyor',
                downloadUrl: `/reports/product-${productId}-${Date.now()}.pdf`
            });
            
        } catch (error) {
            this.logger.error('❌ Export product report error:', error);
            res.status(500).json({
                success: false,
                message: 'Hisobotni eksport qilishda xatolik',
                error: error.message
            });
        }
    }
    
    /**
     * Export business report
     */
    async exportBusinessReport(req, res) {
        try {
            const manufacturerId = req.user.userId;
                   
            // For now, return a JSON response
            // In production, you would generate a PDF/Excel file
            res.json({
                success: true,
                message: 'Biznes hisoboti tayyor',
                downloadUrl: `/reports/business-${manufacturerId}-${Date.now()}.pdf`
            });
            
        } catch (error) {
            this.logger.error('❌ Export business report error:', error);
            res.status(500).json({
                success: false,
                message: 'Biznes hisobotini eksport qilishda xatolik',
                error: error.message
            });
        }
    }

    // ===============================================
    // PROFILE METHODS
    // ===============================================

    /**
     * Show profile page
     * GET /manufacturer/profile
     */
    async showProfile(req, res) {
        try {
            const manufacturerId = req.user.userId;

            // Get unread messages count
            let unreadMessages;
            try {
                unreadMessages = await this.manufacturerService.getUnreadMessagesCount(manufacturerId);
            } catch (error) {
                unreadMessages = 0;
            }

            res.render('manufacturer/profile/index', {
                title: 'Kompaniya Profili',
                currentPage: 'profile',
                user: req.user,
                unreadMessages: unreadMessages || 0,
                layout: 'manufacturer/layout'
            });

        } catch (error) {
            this.logger.error('❌ Profile page error:', error);
            res.status(500).render('error', { message: 'Failed to load profile page' });
        }
    }

    /**
     * Show support page
     * GET /manufacturer/support
     */
    async showSupport(req, res) {
        try {
            const manufacturerId = req.user.userId;

            // Get unread messages count
            let unreadMessages;
            try {
                unreadMessages = await this.manufacturerService.getUnreadMessagesCount(manufacturerId);
            } catch (error) {
                unreadMessages = 0;
            }

            res.render('manufacturer/support/index', {
                title: 'Qo\'llab-quvvatlash',
                currentPage: 'support',
                user: req.user,
                unreadMessages: unreadMessages || 0,
                layout: 'manufacturer/layout'
            });

        } catch (error) {
            this.logger.error('❌ Support page error:', error);
            res.status(500).render('error', { message: 'Failed to load support page' });
        }
    }

    /**
     * Show shipping page
     * GET /manufacturer/shipping
     */
    async showShipping(req, res) {
        try {
            const manufacturerId = req.user.userId;

            // Get unread messages count
            let unreadMessages;
            try {
                unreadMessages = await this.manufacturerService.getUnreadMessagesCount(manufacturerId);
            } catch (error) {
                unreadMessages = 0;
            }

            res.render('manufacturer/shipping/index', {
                title: 'Yetkazib berish',
                currentPage: 'shipping',
                user: req.user,
                unreadMessages: unreadMessages || 0,
                layout: 'manufacturer/layout'
            });

        } catch (error) {
            this.logger.error('❌ Shipping page error:', error);
            res.status(500).render('error', { message: 'Failed to load shipping page' });
        }
    }

    /**
     * Show inventory page
     * GET /manufacturer/inventory
     */
    async showInventory(req, res) {
        try {
            const manufacturerId = req.user.userId;

            // Get unread messages count
            let unreadMessages;
            try {
                unreadMessages = await this.manufacturerService.getUnreadMessagesCount(manufacturerId);
            } catch (error) {
                unreadMessages = 0;
            }

            res.render('manufacturer/inventory/index', {
                title: 'Ombor boshqaruvi',
                currentPage: 'inventory',
                user: req.user,
                unreadMessages: unreadMessages || 0,
                layout: 'manufacturer/layout'
            });

        } catch (error) {
            this.logger.error('❌ Inventory page error:', error);
            res.status(500).render('error', { message: 'Failed to load inventory page' });
        }
    }

    /**
     * Get profile data
     * GET /manufacturer/profile/api/data
     */
    async getProfileData(req, res) {
        try {
            const manufacturerId = req.user.userId;
       
            const profileData = await this.manufacturerService.getProfileData(manufacturerId);

            res.json({
                success: true,
                data: profileData,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error('❌ Get profile data error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to load profile data',
                message: error.message
            });
        }
    }

    /**
     * Get recent products
     * GET /manufacturer/profile/api/recent-products
     */
    async getRecentProducts(req, res) {
        try {
            const manufacturerId = req.user.userId;
            
            const products = await this.manufacturerService.getRecentProducts(manufacturerId, 5);

            res.json({
                success: true,
                data: products
            });

        } catch (error) {
            this.logger.error('❌ Get recent products error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to load recent products',
                message: error.message
            });
        }
    }

    /**
     * Get recent orders
     * GET /manufacturer/profile/api/recent-orders
     */
    async getRecentOrders(req, res) {
        try {
            const manufacturerId = req.user.userId;
            
            const orders = await this.manufacturerService.getRecentOrders(manufacturerId, 5);

            res.json({
                success: true,
                data: orders
            });

        } catch (error) {
            this.logger.error('❌ Get recent orders error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to load recent orders',
                message: error.message
            });
        }
    }

    /**
     * Get chart data for analytics
     * GET /manufacturer/profile/api/chart-data
     */
    async getChartData(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const { period = '30' } = req.query;
            
            const chartData = await this.manufacturerService.getChartData(manufacturerId, period);

            res.json({
                success: true,
                data: chartData
            });

        } catch (error) {
            this.logger.error('❌ Get chart data error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to load chart data',
                message: error.message
            });
        }
    }

    /**
     * Get product analytics data with period support
     * GET /manufacturer/analytics/api/product-data
     */
    async getProductAnalyticsData(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const { productId, period = '30' } = req.query;
            
            if (!productId) {
                return res.status(400).json({
                    success: false,
                    error: 'Product ID is required'
                });
            }

            const periodNum = parseInt(period);
            if (![7, 30, 90].includes(periodNum)) {
                return res.status(400).json({
                    success: false,
                    error: 'Period must be 7, 30, or 90 days'
                });
            }

            const productAnalytics = await this.manufacturerService.getProductAnalytics(productId, manufacturerId, periodNum);

            res.json({
                success: true,
                data: productAnalytics,
                period: periodNum
            });

        } catch (error) {
            this.logger.error('❌ Get product analytics data error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to load product analytics data',
                message: error.message
            });
        }
    }

    /**
     * Get business analytics data with period support
     * GET /manufacturer/analytics/api/business-data
     */
    async getBusinessAnalyticsData(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const { period = '30' } = req.query;
            
            const periodNum = parseInt(period);
            if (![7, 30, 90].includes(periodNum)) {
                return res.status(400).json({
                    success: false,
                    error: 'Period must be 7, 30, or 90 days'
                });
            }

            const businessIntelligence = await this.manufacturerService.getBusinessIntelligence(manufacturerId, periodNum);

            res.json({
                success: true,
                data: businessIntelligence,
                period: periodNum
            });

        } catch (error) {
            this.logger.error('❌ Get business analytics data error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to load business analytics data',
                message: error.message
            });
        }
    }

    /**
     * API: Get unread messages count for manufacturer
     */
    async getUnreadMessagesCount(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const count = await this.manufacturerService.getUnreadMessagesCount(manufacturerId);
            
            res.json({
                success: true,
                count: count
            });
        } catch (error) {
            console.error('❌ Error getting unread messages count:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get unread messages count',
                count: 0
            });
        }
    }
}

module.exports = ManufacturerController;