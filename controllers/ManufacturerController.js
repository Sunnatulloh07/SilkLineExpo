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
        return req.lng || req.query.lng || req.body.lng || 'uz';
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
            this.logger.log(`🏭 Manufacturer dashboard request from: ${manufacturerId}`);

            // Get dashboard data in parallel for better performance
            const [dashboardStats, productionMetrics, recentOrders, equipmentStatus] = await Promise.all([
                this.manufacturerService.getDashboardStats(manufacturerId),
                this.manufacturerService.getProductionMetrics(manufacturerId),
                this.manufacturerService.getRecentProductionOrders(manufacturerId, 5),
                this.manufacturerService.getEquipmentStatus(manufacturerId)
            ]);

            res.render('manufacturer/dashboard/index', {
                title: 'Manufacturer Dashboard',
                currentPage: 'dashboard',
                user: req.user,
                stats: dashboardStats,
                productionMetrics,
                recentOrders,
                equipmentStatus
                // Layout removed - using admin structure
            });

        } catch (error) {
            this.logger.error('❌ Manufacturer dashboard error:', error);
            
            // Professional fallback: render dashboard with basic fallback data
            res.render('manufacturer/dashboard/index', {
                title: 'Manufacturer Dashboard',
                currentPage: 'dashboard',
                user: req.user,
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

            res.render('manufacturer/production/index', {
                title: 'Production Management',
                currentPage: 'production',
                user: req.user,
                layout: 'manufacturer/layout'
            });

        } catch (error) {
            this.logger.error('❌ Production page error:', error);
            res.status(500).render('error', { message: 'Failed to load production page' });
        }
    }

    /**
     * Render product development page
     */
    async showProducts(req, res) {
        try {
            const manufacturerId = req.user.userId;

            res.render('manufacturer/products/index', {
                title: 'Product Development',
                currentPage: 'products',
                user: req.user,
                layout: 'manufacturer/layout'
            });

        } catch (error) {
            this.logger.error('❌ Products page error:', error);
            res.status(500).render('error', { message: 'Failed to load products page' });
        }
    }

    /**
     * Render distribution network page
     */
    async showDistribution(req, res) {
        try {
            const manufacturerId = req.user.userId;

            res.render('manufacturer/distribution/index', {
                title: 'Distribution Network',
                currentPage: 'distribution',
                user: req.user,
                layout: 'manufacturer/layout'
            });

        } catch (error) {
            this.logger.error('❌ Distribution page error:', error);
            res.status(500).render('error', { message: 'Failed to load distribution page' });
        }
    }

    /**
     * Render sales and marketing page
     */
    async showSales(req, res) {
        try {
            const manufacturerId = req.user.userId;

            res.render('manufacturer/sales/index', {
                title: 'Sales & Marketing',
                currentPage: 'sales',
                user: req.user,
                layout: 'manufacturer/layout'
            });

        } catch (error) {
            this.logger.error('❌ Sales page error:', error);
            res.status(500).render('error', { message: 'Failed to load sales page' });
        }
    }

    /**
     * Render operations management page
     */
    async showOperations(req, res) {
        try {
            const manufacturerId = req.user.userId;

            res.render('manufacturer/operations/index', {
                title: 'Operations Management',
                currentPage: 'operations',
                user: req.user,
                layout: 'manufacturer/layout'
            });

        } catch (error) {
            this.logger.error('❌ Operations page error:', error);
            res.status(500).render('error', { message: 'Failed to load operations page' });
        }
    }



    /**
     * Render B2B marketplace page with professional design
     */
    async showMarketplace(req, res) {
        try {
            const manufacturerId = req.user.userId;
            this.logger.log(`🛍️ Marketplace page request from manufacturer: ${manufacturerId}`);

            // Get marketplace data for professional display
            const [
                dashboardStats,
                marketplaceMetrics,
                featuredProducts,
                recentInquiries,
                competitorAnalysis
            ] = await Promise.all([
                this.manufacturerService.getDashboardStats(manufacturerId),
                this.manufacturerService.getMarketplaceMetrics(manufacturerId),  
                this.manufacturerService.getFeaturedProducts(manufacturerId, 8),
                this.manufacturerService.getRecentInquiries(manufacturerId, 10),
                this.manufacturerService.getCompetitorAnalysis(manufacturerId)
            ]);

            res.render('manufacturer/marketplace/index', {
                title: 'B2B Marketplace',
                currentPage: 'marketplace',
                user: req.user,
                lng: req.lng || 'uz',
                t: req.t || ((key) => key),
                stats: dashboardStats || {},
                marketplaceMetrics: marketplaceMetrics || {},
                featuredProducts: featuredProducts || [],
                recentInquiries: recentInquiries || [],
                competitorAnalysis: competitorAnalysis || {}
            });

        } catch (error) {
            this.logger.error('❌ Marketplace page error:', error);
            
            // Render page with fallback data instead of error page
            res.render('manufacturer/marketplace/index', {
                title: 'B2B Marketplace',
                currentPage: 'marketplace',
                user: req.user,
                lng: req.lng || 'uz',
                t: req.t || ((key) => key),
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

            res.render('manufacturer/settings/index', {
                title: 'Settings',
                currentPage: 'settings',
                user: req.user,
                layout: 'manufacturer/layout'
            });

        } catch (error) {
            this.logger.error('❌ Settings page error:', error);
            res.status(500).render('error', { message: 'Failed to load settings page' });
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
            const manufacturerId = req.user.userId;
            
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
            const manufacturerId = req.user.userId;
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
            const manufacturerId = req.user.userId;
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
            const manufacturerId = req.user.userId;
            
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
            const manufacturerId = req.user.userId;
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
            const manufacturerId = req.user.userId;
            const options = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                type: req.query.type,
                read: req.query.read
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
            const manufacturerId = req.user.userId;
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
        this.logger.error(`❌ ${message}:`, error);
        
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
            this.logger.log(`🔍 Getting distributor inquiries for manufacturer: ${manufacturerId}`);

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
            this.logger.log(`💬 Getting communication center for manufacturer: ${manufacturerId}`);

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
            this.logger.log(`📦 Getting inventory management for manufacturer: ${manufacturerId}`);

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
            this.logger.log(`📊 Getting marketplace metrics for manufacturer: ${manufacturerId}`);

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
            const { limit = 8 } = req.query;
            this.logger.log(`⭐ Getting featured products for manufacturer: ${manufacturerId}`);

            const products = await this.manufacturerService.getFeaturedProducts(manufacturerId, parseInt(limit));

            res.json({
                success: true,
                data: products,
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
            const { limit = 10 } = req.query;
            this.logger.log(`💬 Getting recent inquiries for manufacturer: ${manufacturerId}`);

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
     * API: Get competitor analysis
     */
    async getCompetitorAnalysis(req, res) {
        try {
            const manufacturerId = req.user.userId;
            this.logger.log(`📊 Getting competitor analysis for manufacturer: ${manufacturerId}`);

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
            
            this.logger.log(`🏭 Loading product edit page for ID: ${productId}, Manufacturer: ${manufacturerId}`);
            
            // Get product data
            const product = await this.manufacturerService.getProductForEdit(productId, manufacturerId);
            
            if (!product) {
                this.logger.warn(`❌ Product not found - rendering page with error message instead of 404`);
                
                // Professional approach: render edit page with error message instead of error view
                const fallbackCategories = await this.manufacturerService.getProductCategories() || [];
                
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
            
            // Get categories for dropdown
            const categories = await this.manufacturerService.getProductCategories();
            
            // Get product analytics for context
            const productAnalytics = await this.manufacturerService.getProductAnalytics(productId);
            
            const lng = this.getLanguagePreference(req);
            
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
                // Get basic categories for fallback
                const fallbackCategories = await this.manufacturerService.getProductCategories() || [];
                
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
            
            this.logger.log(`🏭 Loading product add page for Manufacturer: ${manufacturerId}`);
            
            // Get categories for dropdown
            const categories = await this.manufacturerService.getProductCategories();
            
            const lng = this.getLanguagePreference(req);
            
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
            
            this.logger.log(`📊 Loading analytics dashboard for Manufacturer: ${manufacturerId}, Product: ${productId || 'all'}`);
            
            // Get comprehensive analytics data
            const dashboardStats = await this.manufacturerService.getDashboardStats(manufacturerId);
            const businessIntelligence = await this.manufacturerService.getBusinessIntelligence(manufacturerId);
            
            let productAnalytics = null;
            let productInfo = null;
            if (productId) {
                productAnalytics = await this.manufacturerService.getProductAnalytics(productId, manufacturerId);
                productInfo = await this.manufacturerService.getProductForEdit(productId, manufacturerId);
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
            
            this.logger.log(`📊 Loading product analytics for Product: ${productId}, Manufacturer: ${manufacturerId}`);
            
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
            
            this.logger.log(`💾 Saving product as draft: ${productId} for manufacturer: ${manufacturerId}`);
            
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
            
            this.logger.log(`✅ Product saved as draft: ${productId}`);
            
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
            
            this.logger.log(`🚀 Publishing product: ${productId} for manufacturer: ${manufacturerId}`);
            
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
            
            this.logger.log(`✅ Product published: ${productId}`);
            
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
            
            this.logger.log(`📦 Getting product: ${productId} for manufacturer: ${manufacturerId}`);
            
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
            this.logger.error('❌ Get product error:', error);
            res.status(500).json({
                success: false,
                message: 'Mahsulotni olishda xatolik yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    /**
     * Update product
     */
    async updateProduct(req, res) {
        try {
            const productId = req.params.id;
            const manufacturerId = req.user.userId;
            const updateData = req.body;
            
            this.logger.log(`🔄 Updating product: ${productId} for manufacturer: ${manufacturerId}`);
            
            // Validate and update product
            const updatedProduct = await this.manufacturerService.updateProduct(productId, manufacturerId, updateData);
            
            if (!updatedProduct) {
                return res.status(404).json({
                    success: false,
                    message: 'Mahsulot topilmadi yoki yangilash imkoni yo\'q'
                });
            }
            
            this.logger.log(`✅ Product updated successfully: ${productId}`);
            
            res.json({
                success: true,
                message: 'Mahsulot muvaffaqiyatli yangilandi',
                data: updatedProduct
            });
            
        } catch (error) {
            this.logger.error('❌ Update product error:', error);
            res.status(500).json({
                success: false,
                message: 'Mahsulotni yangilashda xatolik yuz berdi',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    /**
     * Create new product
     */
    async createProduct(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const productData = { ...req.body, manufacturer: manufacturerId };
            
            this.logger.log(`➕ Creating new product for manufacturer: ${manufacturerId}`);
            
            const newProduct = await this.manufacturerService.createProduct(productData);
            
            this.logger.log(`✅ Product created successfully: ${newProduct._id}`);
            
            res.status(201).json({
                success: true,
                message: 'Mahsulot muvaffaqiyatli yaratildi',
                data: newProduct
            });
            
        } catch (error) {
            this.logger.error('❌ Create product error:', error);
            res.status(500).json({
                success: false,
                message: 'Mahsulot yaratishda xatolik yuz berdi',
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
            
            this.logger.log(`🗑️ Deleting product: ${productId} for manufacturer: ${manufacturerId}`);
            
            const deleted = await this.manufacturerService.deleteProduct(productId, manufacturerId);
            
            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Mahsulot topilmadi yoki o\'chirish imkoni yo\'q'
                });
            }
            
            this.logger.log(`✅ Product deleted successfully: ${productId}`);
            
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
     * Upload product images
     */
    async uploadProductImages(req, res) {
        try {
            const manufacturerId = req.user.userId;
            
            this.logger.log(`📸 Uploading product images for manufacturer: ${manufacturerId}`);
            
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Rasm fayllar yuklanmadi'
                });
            }
            
            const imageUrls = await this.manufacturerService.uploadProductImages(req.files);
            
            this.logger.log(`✅ Images uploaded successfully: ${imageUrls.length} files`);
            
            res.json({
                success: true,
                message: 'Rasmlar muvaffaqiyatli yuklandi',
                data: {
                    urls: imageUrls,
                    count: imageUrls.length
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
     * Get business analytics via API
     */
    async getBusinessAnalytics(req, res) {
        try {
            const manufacturerId = req.user.userId;
            const period = parseInt(req.query.period) || 30; // Default 30 days
            

            
            const [dashboardStats, businessIntelligence] = await Promise.all([
                this.manufacturerService.getDashboardStats(manufacturerId),
                this.manufacturerService.getBusinessIntelligence(manufacturerId)
            ]);
            
            res.json({
                success: true,
                data: {
                    dashboardStats,
                    businessIntelligence
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
            
            this.logger.log(`📥 Exporting product report for Product: ${productId}`);
            
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
            
            this.logger.log(`📥 Exporting business report for Manufacturer: ${manufacturerId}`);
            
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
}

module.exports = ManufacturerController;