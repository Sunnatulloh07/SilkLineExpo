// Get server data
const marketplaceData = JSON.parse(document.getElementById('marketplace-data').textContent);

/**
 * Business marketplace management system
 * Professional marketplace interface for manufacturers
 * Senior Software Engineer implementation - Fixed version
 */
class MarketplaceManager {
    constructor(options = {}) {
        this.options = {
            userId: marketplaceData.user.id,
            userName: marketplaceData.user.name,
            companyName: marketplaceData.user.companyName,
            autoRefresh: true,
            refreshInterval: 300000, // 5 minutes
            apiEndpoints: {
                marketplaceMetrics: '/manufacturer/api/marketplace-metrics',
                featuredProducts: '/manufacturer/api/featured-products',
                recentInquiries: '/manufacturer/api/recent-inquiries',
                marketplaceChart: '/manufacturer/api/marketplace-chart',
                competitorAnalysis: '/manufacturer/api/competitor-analysis'
            },
            ...options
        };
        
        this.charts = {};
        this.refreshTimers = {};
        this.isInitialized = false;
        this.logger = console;
        this.data = marketplaceData;
        this.currentPagination = null;
    }

    /**
     * Initialize marketplace manager
     */
    async init() {
        try {

            // Initialize core components
            this.initializeElements();
            this.setupEventListeners();
            this.initializeCharts();
            
            // Load initial content
            await this.loadMarketplaceData();
            
            // Start auto-refresh if enabled
            if (this.options.autoRefresh) {
                this.startAutoRefresh();
            }

            this.isInitialized = true;

        } catch (error) {
            this.showError(window.t ? window.t('manufacturer.marketplace.errors.initializationFailed') : 'Marketplace initialization failed');
        }
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.elements = {
            // Metrics
            totalViewsValue: document.getElementById('totalViewsValue'),
            conversionRateValue: document.getElementById('conversionRateValue'),
            responseRateValue: document.getElementById('responseRateValue'),
            marketplaceRankingValue: document.getElementById('marketplaceRankingValue'),
            
            // Products
            featuredProductsGrid: document.getElementById('featuredProductsGrid'),
            refreshProductsBtn: document.getElementById('refreshProductsBtn'),
            
            // Inquiries
            recentInquiriesList: document.getElementById('recentInquiriesList'),
            
            // Charts
            performanceChart: document.getElementById('performanceChart'),
            performanceChartCanvas: document.getElementById('performanceChartCanvas'),
            
            // Actions
            addProductBtn: document.getElementById('addProductBtn'),
            marketplaceAnalyticsBtn: document.getElementById('marketplaceAnalyticsBtn'),
            refreshCompetitorBtn: document.getElementById('refreshCompetitorBtn'),
            detailedAnalysisBtn: document.getElementById('detailedAnalysisBtn')
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Refresh buttons
        if (this.elements.refreshProductsBtn) {
            this.elements.refreshProductsBtn.addEventListener('click', () => {
                this.refreshFeaturedProducts();
            });
        }

        if (this.elements.refreshCompetitorBtn) {
            this.elements.refreshCompetitorBtn.addEventListener('click', () => {
                this.loadCompetitorAnalysis();
            });
        }

        // Action buttons
        if (this.elements.addProductBtn) {
            this.elements.addProductBtn.addEventListener('click', () => {
                window.location.href = '/manufacturer/products/add';
            });
        }

        if (this.elements.marketplaceAnalyticsBtn) {
            this.elements.marketplaceAnalyticsBtn.addEventListener('click', () => {
                window.location.href = '/manufacturer/analytics';
            });
        }

        if (this.elements.detailedAnalysisBtn) {
            this.elements.detailedAnalysisBtn.addEventListener('click', () => {
                this.showDetailedAnalysis();
            });
        }

        // Product action buttons - Event delegation for dynamic content
        document.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('[data-action]');
            if (actionBtn && actionBtn.hasAttribute('data-product-id')) {
                e.preventDefault();
                const action = actionBtn.getAttribute('data-action');
                const productId = actionBtn.getAttribute('data-product-id');
                this.handleProductAction(action, productId);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        window.location.href = '/manufacturer/products/add';
                        break;
                    case 'r':
                        e.preventDefault();
                        this.refreshAllData();
                        break;
                }
            }
        });
    }

    /**
     * Initialize performance chart
     */
    initializeCharts() {
        if (this.elements.performanceChartCanvas) {
            const ctx = this.elements.performanceChartCanvas.getContext('2d');
            
            // Initialize chart with loading state
            this.charts.performance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Yuklanmoqda...'],
                    datasets: [{
                        label: window.t ? window.t('manufacturer.marketplace.charts.views') : 'Ko\'rishlar',
                        data: [0],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    }, {
                        label: window.t ? window.t('manufacturer.marketplace.charts.inquiries') : 'So\'rovlar',
                        data: [0],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    }, {
                        label: 'Buyurtmalar',
                        data: [0],
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            enabled: true,
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#ffffff',
                            bodyColor: '#ffffff',
                            borderColor: '#3b82f6',
                            borderWidth: 1,
                            cornerRadius: 8,
                            displayColors: true,
                            callbacks: {
                                title: function(context) {
                                    const label = context[0].label;
                                    return window.t ? window.t('manufacturer.marketplace.charts.week') + ' ' + label : 'Hafta ' + label;
                                },
                                label: function(context) {
                                    const datasetLabel = context.dataset.label;
                                    const value = context.parsed.y;
                                    
                                    // Multi-language labels
                                    let label = datasetLabel;
                                    if (datasetLabel === 'Ko\'rishlar') {
                                        label = window.t ? window.t('manufacturer.marketplace.charts.views') : 'Ko\'rishlar';
                                    } else if (datasetLabel === 'So\'rovlar') {
                                        label = window.t ? window.t('manufacturer.marketplace.charts.inquiries') : 'So\'rovlar';
                                    } else if (datasetLabel === 'Buyurtmalar') {
                                        label = window.t ? window.t('manufacturer.marketplace.charts.orders') : 'Buyurtmalar';
                                    }
                                    
                                    return label + ': ' + value.toLocaleString();
                                },
                                afterBody: function(context) {
                                    const total = context.reduce((sum, item) => sum + item.parsed.y, 0);
                                    return window.t ? 
                                        window.t('manufacturer.marketplace.charts.total') + ': ' + total.toLocaleString() : 
                                        'Jami: ' + total.toLocaleString();
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            display: false
                        },
                        x: {
                            display: false
                        }
                    },
                    elements: {
                        point: {
                            radius: 3,
                            hoverRadius: 5
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });
        }
    }

    /**
     * Load all marketplace data
     */
    async loadMarketplaceData() {
        try {
            
            await Promise.all([
                this.loadMarketplaceMetrics(),
                this.loadFeaturedProducts(),
                this.loadRecentInquiries(),
                this.loadMarketplaceChartData('30d'),
                this.loadCompetitorAnalysis()
            ]);
            
        } catch (error) {
        }
    }

    /**
     * Load marketplace metrics via API
     */
    async loadMarketplaceMetrics() {
        try {
            
            const response = await fetch(this.options.apiEndpoints.marketplaceMetrics, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const result = await response.json();
            if (result.success && result.data) {
                this.updateMarketplaceMetrics(result.data);
            }
        } catch (error) {
        }
    }

    /**
     * Refresh featured products with real-time data
     */
    async refreshFeaturedProducts() {
        try {
            // Show loading feedback
            if (this.elements.refreshProductsBtn) {
                const originalContent = this.elements.refreshProductsBtn.innerHTML;
                this.elements.refreshProductsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                this.elements.refreshProductsBtn.disabled = true;
                
                // Restore button after operation
                setTimeout(() => {
                    this.elements.refreshProductsBtn.innerHTML = originalContent;
                    this.elements.refreshProductsBtn.disabled = false;
                }, 1000);
            }
            
            // Load fresh data
            await this.loadFeaturedProducts();
            
        } catch (error) {
            // Fallback to page reload
            this.refreshPage();
        }
    }

    /**
     * Refresh page - Simple and reliable solution
     */
    refreshPage() {
        try {
            // Show brief loading feedback
            if (this.elements.refreshProductsBtn) {
                const originalContent = this.elements.refreshProductsBtn.innerHTML;
                this.elements.refreshProductsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                this.elements.refreshProductsBtn.disabled = true;
                
                // Restore button after 500ms
                setTimeout(() => {
                    this.elements.refreshProductsBtn.innerHTML = originalContent;
                    this.elements.refreshProductsBtn.disabled = false;
                }, 500);
            }
            
            // Reload the page
            window.location.reload();
            
        } catch (error) {
            // Fallback: still reload the page
            window.location.reload();
        }
    }

    /**
     * Load featured products via API - Professional Hybrid Implementation
     * Combines server-side rendering with client-side enhancement
     */
    async loadFeaturedProducts() {
        try {
            // Check if we already have server-side rendered products
            const existingProducts = this.elements.featuredProductsGrid?.querySelectorAll('.b2b-product-card');
            
            if (existingProducts && existingProducts.length > 0) {
                // Server-side rendering already provided products
                // Enhance with real-time data if needed
                await this.enhanceExistingProducts();
                return;
            }
            
            // No server-side products, load via API with pagination
            const params = new URLSearchParams({
                page: 1,
                limit: 8,
                sort: 'performance_desc'
            });
            
            const response = await fetch(`${this.options.apiEndpoints.featuredProducts}?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            
            // Validate API response with pagination
            if (result.success && result.data && Array.isArray(result.data)) {
                // Validate each product data
                const validatedProducts = this.validateProductData(result.data);
                this.updateFeaturedProducts(validatedProducts);
                
                // Store pagination info for future use
                if (result.pagination) {
                    this.currentPagination = result.pagination;
                }
            } else {
                throw new Error('Invalid API response format');
            }
            
        } catch (error) {
            this.handleFeaturedProductsError(error);
        }
    }

    /**
     * Enhance existing server-side rendered products with real-time data
     */
    async enhanceExistingProducts() {
        try {
            // Get real-time metrics for existing products with pagination
            const params = new URLSearchParams({
                page: 1,
                limit: 8,
                sort: 'performance_desc'
            });
            
            const response = await fetch(`${this.options.apiEndpoints.featuredProducts}?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data && Array.isArray(result.data)) {
                    // Update metrics for existing products without recreating cards
                    this.updateProductMetrics(result.data);
                }
            }
        } catch (error) {
            // Silent fail - server-side data is already good
        }
    }

    /**
     * Update metrics for existing products without recreating cards
     */
    updateProductMetrics(products) {
        const existingCards = this.elements.featuredProductsGrid?.querySelectorAll('.b2b-product-card');
        
        if (!existingCards || !products) return;

        existingCards.forEach((card, index) => {
            const product = products[index];
            if (!product) return;

            // Update views
            const viewsElement = card.querySelector('.product-stat .fa-eye')?.parentElement;
            if (viewsElement) {
                viewsElement.innerHTML = `<i class="fas fa-eye"></i> ${product.views || 0}`;
            }

            // Update rating
            const ratingElement = card.querySelector('.product-stat .fa-star')?.parentElement;
            if (ratingElement) {
                ratingElement.innerHTML = `<i class="fas fa-star"></i> ${(product.rating || 0).toFixed(1)}`;
            }

            // Update inquiries
            const inquiriesElement = card.querySelector('.product-stat .fa-envelope')?.parentElement;
            if (inquiriesElement) {
                inquiriesElement.innerHTML = `<i class="fas fa-envelope"></i> ${product.inquiries || 0}`;
            }
        });
    }

    /**
     * Validate product data to prevent invalid cards
     */
    validateProductData(products) {
        if (!Array.isArray(products)) {
            return [];
        }

        return products.filter(product => {
            // Essential validation
            if (!product || typeof product !== 'object') {
                return false;
            }

            // Must have ID
            if (!product._id && !product.id) {
                return false;
            }

            // Must have name or title
            if (!product.name && !product.title) {
                return false;
            }

            // Validate required fields
            const validProduct = {
                _id: product._id || product.id,
                name: product.name || product.title || 'Noma\'lum mahsulot',
                title: product.title || product.name || 'Noma\'lum mahsulot',
                category: product.category || 'Kategoriyasiz',
                price: product.price || { min: 0, max: 0 },
                moq: product.moq || 100,
                views: product.views || 0,
                rating: product.rating || 0,
                images: Array.isArray(product.images) ? product.images : [],
                status: product.status || 'active',
                visibility: product.visibility || 'public'
            };

            // Add validated product to result
            Object.assign(product, validProduct);
            return true;
        });
    }

    /**
     * Handle featured products loading error
     */
    handleFeaturedProductsError(error) {
        const gridElement = this.elements.featuredProductsGrid;
        if (!gridElement) return;

        // Show error state
        gridElement.innerHTML = `
            <div class="error-state">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <p class="error-message">
                    ${window.t ? window.t('manufacturer.marketplace.featuredProducts.loadError') : 'Mahsulotlar yuklanmadi'}
                </p>
                <button class="retry-btn" onclick="marketplaceManager.loadFeaturedProducts()">
                    <i class="fas fa-redo"></i>
                    ${window.t ? window.t('common.retry') : 'Qayta urinish'}
                </button>
            </div>
        `;

        // Show toast notification
        this.showError(window.t ? window.t('manufacturer.marketplace.featuredProducts.loadError') : 'Mahsulotlar yuklanmadi');
    }


    /**
     * Load marketplace chart data via API
     */
    async loadMarketplaceChartData(period = '30d') {
        try {
            const params = new URLSearchParams({
                period: period
            });
            
            const response = await fetch(`${this.options.apiEndpoints.marketplaceChart}?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            if (result.success && result.data) {
                this.updatePerformanceChart(result.data);
            } else {
                throw new Error('Invalid API response format');
            }
        } catch (error) {
            this.handleChartError(error);
        }
    }

    /**
     * Update performance chart with real data
     */
    updatePerformanceChart(chartData) {
        if (this.charts.performance && chartData) {
            // Update chart data
            this.charts.performance.data = chartData;
            
            // Update tooltip callbacks with current language
            if (this.charts.performance.options && this.charts.performance.options.plugins && this.charts.performance.options.plugins.tooltip) {
                this.charts.performance.options.plugins.tooltip.callbacks = {
                    title: function(context) {
                        const label = context[0].label;
                        return window.t ? window.t('manufacturer.marketplace.charts.week') + ' ' + label : 'Hafta ' + label;
                    },
                    label: function(context) {
                        const datasetLabel = context.dataset.label;
                        const value = context.parsed.y;
                        
                        // Multi-language labels
                        let label = datasetLabel;
                        if (datasetLabel === 'Ko\'rishlar') {
                            label = window.t ? window.t('manufacturer.marketplace.charts.views') : 'Ko\'rishlar';
                        } else if (datasetLabel === 'So\'rovlar') {
                            label = window.t ? window.t('manufacturer.marketplace.charts.inquiries') : 'So\'rovlar';
                        } else if (datasetLabel === 'Buyurtmalar') {
                            label = window.t ? window.t('manufacturer.marketplace.charts.orders') : 'Buyurtmalar';
                        }
                        
                        return label + ': ' + value.toLocaleString();
                    },
                    afterBody: function(context) {
                        const total = context.reduce((sum, item) => sum + item.parsed.y, 0);
                        return window.t ? 
                            window.t('manufacturer.marketplace.charts.total') + ': ' + total.toLocaleString() : 
                            'Jami: ' + total.toLocaleString();
                    }
                };
            }
            
            this.charts.performance.update();
        }
    }

    /**
     * Handle chart loading error
     */
    handleChartError(error) {
        if (this.charts.performance) {
            this.charts.performance.data = {
                labels: ['Xatolik'],
                datasets: [{
                    label: 'Ma\'lumot yuklanmadi',
                    data: [0],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            };
            this.charts.performance.update();
        }
    }

    /**
     * Load recent inquiries via API
     */
    async loadRecentInquiries() {
        try {
            // Add pagination parameters for consistency
            const params = new URLSearchParams({
                limit: 3
            });
            
            const response = await fetch(`${this.options.apiEndpoints.recentInquiries}?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            if (result.success && result.data && Array.isArray(result.data)) {
                this.updateRecentInquiries(result.data);
            } else {
                throw new Error('Invalid API response format');
            }
        } catch (error) {
            this.handleRecentInquiriesError(error);
        }
    }

    /**
     * Handle recent inquiries loading error
     */
    handleRecentInquiriesError(error) {
        const listElement = this.elements.recentInquiriesList;
        if (!listElement) return;

        // Show error state
        listElement.innerHTML = `
            <div class="error-inquiries">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h4 class="error-title">${window.t ? window.t('manufacturer.marketplace.recentInquiries.loadError') : 'So\'rovlar yuklanmadi'}</h4>
                <p class="error-description">${window.t ? window.t('manufacturer.marketplace.recentInquiries.emptyState.description') : 'Ma\'lumotlarni yuklashda xatolik yuz berdi'}</p>
                <button class="retry-btn" onclick="marketplaceManager.loadRecentInquiries()">
                    <i class="fas fa-redo"></i>
                    ${window.t ? window.t('common.retry') : 'Qayta urinish'}
                </button>
            </div>
        `;

        // Show toast notification
        this.showError(window.t ? window.t('manufacturer.marketplace.recentInquiries.loadError') : 'So\'rovlar yuklanmadi');
    }

    /**
     * Load competitor analysis via API
     */
    async loadCompetitorAnalysis() {
        try {
            
            const response = await fetch(this.options.apiEndpoints.competitorAnalysis, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const result = await response.json();
            if (result.success && result.data) {
                this.updateCompetitorAnalysis(result.data);
            }
        } catch (error) {
            // Error handling without console.log
        }
    }

    /**
     * Update marketplace metrics in UI
     */
    updateMarketplaceMetrics(metrics) {
        try {
            if (this.elements.totalViewsValue && metrics.totalViews !== undefined) {
                this.elements.totalViewsValue.textContent = metrics.totalViews.toLocaleString();
            }

            if (this.elements.conversionRateValue && metrics.conversionRate) {
                this.elements.conversionRateValue.textContent = metrics.conversionRate;
            }

            if (this.elements.responseRateValue && metrics.inquiryResponseRate) {
                this.elements.responseRateValue.textContent = metrics.inquiryResponseRate;
            }

            if (this.elements.marketplaceRankingValue && metrics.marketplaceRanking) {
                this.elements.marketplaceRankingValue.textContent = metrics.marketplaceRanking;
            }

            if (this.charts.performance && metrics.growth) {
                this.charts.performance.data.datasets[0].data = [
                    metrics.growth.views, 
                    metrics.growth.views + 5, 
                    metrics.growth.views + 8, 
                    metrics.growth.views + 12
                ];
                this.charts.performance.data.datasets[1].data = [
                    metrics.growth.inquiries, 
                    metrics.growth.inquiries + 3, 
                    metrics.growth.inquiries + 5, 
                    metrics.growth.inquiries + 8
                ];
                this.charts.performance.update();
            }

        } catch (error) {
        }
    }

    /**
     * Update featured products in UI - Professional Implementation
     */
    updateFeaturedProducts(products) {
        try {
            const gridElement = this.elements.featuredProductsGrid;
            if (!gridElement) {
                return;
            }

            if (!Array.isArray(products)) {
                this.showEmptyState(gridElement);
                return;
            }

            if (products.length === 0) {
                this.showEmptyState(gridElement);
                return;
            }

            // Clear existing products
            const existingProducts = gridElement.querySelectorAll('.b2b-product-card');
            existingProducts.forEach(card => card.remove());

            // Create and append new product cards
            let validProductsCount = 0;
            products.forEach((product, index) => {
                const productCard = this.createProductCard(product, index);
                if (productCard) {
                gridElement.appendChild(productCard);
                    validProductsCount++;
                }
            });

            if (validProductsCount === 0) {
                this.showEmptyState(gridElement);
            } else {
            }

        } catch (error) {
            this.showErrorState(gridElement);
        }
    }

    /**
     * Show empty state when no products available
     */
    showEmptyState(gridElement) {
        gridElement.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-box-open"></i>
                </div>
                <p class="empty-message">
                    ${window.t ? window.t('manufacturer.marketplace.featuredProducts.noProducts') : 'Hech qanday mahsulot topilmadi'}
                </p>
                <button class="add-product-btn" onclick="window.location.href='/manufacturer/products/add'">
                    <i class="fas fa-plus"></i>
                    ${window.t ? window.t('manufacturer.marketplace.featuredProducts.addProduct') : 'Mahsulot qo\'shish'}
                </button>
            </div>
        `;
    }

    /**
     * Show error state when loading fails
     */
    showErrorState(gridElement) {
        gridElement.innerHTML = `
            <div class="error-state">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <p class="error-message">
                    ${window.t ? window.t('manufacturer.marketplace.featuredProducts.loadError') : 'Mahsulotlar yuklanmadi'}
                </p>
                <button class="retry-btn" onclick="marketplaceManager.loadFeaturedProducts()">
                    <i class="fas fa-redo"></i>
                    ${window.t ? window.t('common.retry') : 'Qayta urinish'}
                </button>
            </div>
        `;
    }

    /**
     * Update recent inquiries in UI
     */
    updateRecentInquiries(inquiries) {
        try {
            const listElement = this.elements.recentInquiriesList;
            if (!listElement || !Array.isArray(inquiries)) return;

            // Validate and sanitize data - Senior Software Engineer approach
            const validatedInquiries = this.validateInquiryData(inquiries);

            listElement.innerHTML = '';

            if (validatedInquiries.length === 0) {
                listElement.innerHTML = `
                    <div class="empty-inquiries">
                        <div class="empty-icon">
                            <i class="fas fa-inbox"></i>
                        </div>
                        <h4 class="empty-title">${window.t ? window.t('manufacturer.marketplace.recentInquiries.emptyState.title') : 'No Inquiries'}</h4>
                        <p class="empty-description">${window.t ? window.t('manufacturer.marketplace.recentInquiries.emptyState.description') : 'No new inquiries at the moment'}</p>
                        <p class="empty-action">${window.t ? window.t('manufacturer.marketplace.recentInquiries.emptyState.action') : 'Inquiries will appear here when they arrive'}</p>
                    </div>
                `;
            } else {
                validatedInquiries.forEach(inquiry => {
                    const inquiryElement = this.createInquiryElement(inquiry);
                    listElement.appendChild(inquiryElement);
                });
            }

        } catch (error) {
            this.handleRecentInquiriesError(error);
        }
    }

    /**
     * Validate inquiry data to prevent XSS and ensure data integrity
     */
    validateInquiryData(inquiries) {
        if (!Array.isArray(inquiries)) return [];
        
        return inquiries.filter(inquiry => {
            // Basic validation
            if (!inquiry || typeof inquiry !== 'object') return false;
            
            // Sanitize text fields
            if (inquiry.company) inquiry.company = this.sanitizeText(inquiry.company);
            if (inquiry.product) inquiry.product = this.sanitizeText(inquiry.product);
            if (inquiry.message) inquiry.message = this.sanitizeText(inquiry.message);
            
            // Validate priority
            if (!['high', 'medium', 'low'].includes(inquiry.priority)) {
                inquiry.priority = 'medium';
            }
            
            // Validate required fields
            return inquiry.id && inquiry.company;
        }).slice(0, 3); // Ensure max 3 items
    }

    /**
     * Sanitize text to prevent XSS
     */
    sanitizeText(text) {
        if (typeof text !== 'string') return '';
        return text
            .replace(/[<>]/g, '')
            .replace(/['"]/g, '')
            .trim()
            .substring(0, 200);
    }

    /**
     * Update competitor analysis in UI
     */
    updateCompetitorAnalysis(analysis) {
        try {
            // Update market position badges
            const positionBadges = document.querySelectorAll('.position-badge');
            positionBadges.forEach(badge => {
                if (analysis.marketPosition) {
                    const positionText = window.t ? 
                        window.t(`manufacturer.marketplace.competitorAnalysis.${analysis.marketPosition}`) || analysis.marketPosition : 
                        analysis.marketPosition;
                    badge.textContent = positionText;
                    badge.className = `position-badge position-${analysis.marketPosition.toLowerCase()}`;
                }
            });

            // Update competitor count
            const competitorCountElements = document.querySelectorAll('.competitor-count');
            competitorCountElements.forEach(element => {
                if (analysis.competitorCount) {
                    element.textContent = analysis.competitorCount;
                }
            });

            // Update price competitiveness
            const priceCompetitivenessElements = document.querySelectorAll('.price-competitiveness');
            priceCompetitivenessElements.forEach(element => {
                if (analysis.priceCompetitiveness) {
                    const priceText = window.t ? 
                        window.t(`manufacturer.marketplace.competitorAnalysis.${analysis.priceCompetitiveness}`) || analysis.priceCompetitiveness : 
                        analysis.priceCompetitiveness;
                    element.textContent = priceText;
                }
            });

            // Update strengths list
            const strengthsList = document.querySelector('.strengths-list');
            if (strengthsList && analysis.strengths) {
                strengthsList.innerHTML = '';
                analysis.strengths.forEach(strength => {
                    const li = document.createElement('li');
                    li.className = 'strength-item';
                    const strengthText = window.t ? 
                        window.t(`manufacturer.marketplace.competitorAnalysis.defaultStrengths.${strength}`) || strength : 
                        strength;
                    li.innerHTML = `<i class="fas fa-check-circle"></i>${strengthText}`;
                    strengthsList.appendChild(li);
                });
            }

            // Update opportunities list
            const opportunitiesList = document.querySelector('.opportunities-list');
            if (opportunitiesList && analysis.opportunities) {
                opportunitiesList.innerHTML = '';
                analysis.opportunities.forEach(opportunity => {
                    const li = document.createElement('li');
                    li.className = 'opportunity-item';
                    const opportunityText = window.t ? 
                        window.t(`manufacturer.marketplace.competitorAnalysis.defaultOpportunities.${opportunity}`) || opportunity : 
                        opportunity;
                    li.innerHTML = `<i class="fas fa-lightbulb"></i>${opportunityText}`;
                    opportunitiesList.appendChild(li);
                });
            }

        } catch (error) {
            // Error handling without console.log
        }
    }

    /**
     * Create product card element - Professional Implementation
     */
    createProductCard(product, index) {
        // Validate product data before creating card
        if (!this.isValidProduct(product)) {
            return null;
        }

        const card = document.createElement('div');
        card.className = 'b2b-product-card animate-slide-up';
        card.setAttribute('data-product', product._id || product.id || '');
        card.setAttribute('data-animation-delay', index * 0.1);
        
        // Apply animation delay immediately
        card.style.animationDelay = `${index * 0.1}s`;

        // Safe data extraction with fallbacks
        const productName = this.sanitizeText(product.name || product.title || 'Noma\'lum mahsulot');
        const productTitle = this.sanitizeText(product.title || product.name || 'Noma\'lum mahsulot');
        const categoryName = this.getCategoryName(product.category);
        const priceText = this.formatPrice(product.price);
        const moq = product.moq || 100;
        const views = product.views || 0;
        const rating = product.rating || 0;
        const imageUrl = this.getProductImage(product.images);

        card.innerHTML = `
            <div class="product-image">
                ${imageUrl ? 
                    `<img src="${imageUrl}" alt="${productTitle}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" loading="lazy">
                     <div class="product-image-placeholder" style="display: none;"><i class="fas fa-tshirt"></i></div>` :
                    `<div class="product-image-placeholder"><i class="fas fa-tshirt"></i></div>`
                }
                <div class="product-badge featured">
                    <i class="fas fa-star"></i>
                    ${window.t ? window.t('manufacturer.marketplace.featuredProducts.featured') : 'Featured'}
                </div>
            </div>
            <div class="product-info">
                <h4 class="product-title" title="${productTitle}">
                    ${productTitle.length > 40 ? productTitle.substring(0, 40) + '...' : productTitle}
                </h4>
                <p class="product-category">
                    <i class="fas fa-tag"></i>
                    ${categoryName}
                </p>
                <div class="product-pricing">
                    <span class="price-range">${priceText}</span>
                    <span class="moq">${window.t ? window.t('manufacturer.marketplace.featuredProducts.minimum') : 'Minimum'} : ${moq} ${window.t ? window.t('manufacturer.marketplace.featuredProducts.unit') : 'unit'}</span>
                </div>
                <div class="product-stats">
                    <div class="product-stat">
                        <i class="fas fa-eye"></i>
                        ${views.toLocaleString()}
                    </div>
                    <div class="product-stat">
                        <i class="fas fa-star"></i>
                        ${rating.toFixed(1)}
                    </div>
                    <div class="product-stat">
                        <i class="fas fa-envelope"></i>
                        ${product.inquiries || 0}
                    </div>
                </div>
            </div>
            <div class="product-actions">
                <button class="btn-sm btn-primary" data-action="edit" data-product-id="${product._id || ''}">
                    <i class="fas fa-edit"></i>
                    ${window.t ? window.t('manufacturer.marketplace.featuredProducts.edit') : 'Tahrirlash'}
                </button>
                <button class="btn-sm btn-outline" data-action="stats" data-product-id="${product._id || ''}">
                    <i class="fas fa-chart-bar"></i>
                    ${window.t ? window.t('manufacturer.marketplace.featuredProducts.statistics') : 'Statistika'}
                </button>
            </div>
        `;

        return card;
    }

    /**
     * Validate if product data is valid
     */
    isValidProduct(product) {
        if (!product || typeof product !== 'object') return false;
        if (!product._id && !product.id) return false;
        if (!product.name && !product.title) return false;
        return true;
    }

    /**
     * Sanitize text to prevent XSS
     */
    sanitizeText(text) {
        if (typeof text !== 'string') return '';
        return text.replace(/[<>]/g, '').trim();
    }

    /**
     * Get category name safely
     */
    getCategoryName(category) {
        if (typeof category === 'string') {
            return this.sanitizeText(category);
        }
        if (category && typeof category === 'object') {
            return this.sanitizeText(category.name || category.title || 'Kategoriyasiz');
        }
        return 'Kategoriyasiz';
    }

    /**
     * Format price safely
     */
    formatPrice(price) {
        if (!price || typeof price !== 'object') {
            return window.t ? window.t('manufacturer.marketplace.featuredProducts.priceOnRequest') : 'Price on Request';
        }
        
        if (price.min && price.min > 0) {
            const minPrice = parseFloat(price.min).toFixed(2);
            const maxPrice = price.max ? parseFloat(price.max).toFixed(2) : minPrice;
            return `$${minPrice}${maxPrice !== minPrice ? `-${maxPrice}` : ''}`;
        }
        
        return window.t ? window.t('manufacturer.marketplace.featuredProducts.priceOnRequest') : 'Price on Request';
    }

    /**
     * Get product image URL safely
     */
    getProductImage(images) {
        if (!Array.isArray(images) || images.length === 0) return null;
        
        // Find primary image first
        const primaryImage = images.find(img => img.isPrimary);
        if (primaryImage && primaryImage.url) {
            return primaryImage.url;
        }
        
        // Fallback to first image
        const firstImage = images[0];
        if (firstImage && firstImage.url) {
            return firstImage.url;
        }
        
        return null;
    }

    /**
     * Create inquiry element
     */
    createInquiryElement(inquiry) {
        const element = document.createElement('div');
        element.className = `inquiry-item priority-${inquiry.priority || 'medium'}`;
        element.setAttribute('data-inquiry', inquiry.id || '');
        element.style.cursor = 'pointer';
        element.addEventListener('click', () => {
            window.location.href = '/manufacturer/inquiries';
        });

        const createdDate = inquiry.createdAt ? 
            new Date(inquiry.createdAt).toLocaleDateString('uz-UZ') : 
            (window.t ? window.t('manufacturer.marketplace.recentInquiries.today') : 'Today');

        element.innerHTML = `
            <div class="inquiry-header">
                <div class="company-info">
                    <div class="company-avatar">
                        ${(inquiry.company || (window.t ? window.t('manufacturer.marketplace.recentInquiries.unknownCompany') : 'Noma\'lum kompaniya')).charAt(0)}
                    </div>
                    <div class="company-details">
                        <h4 class="company-name">${inquiry.company || (window.t ? window.t('manufacturer.marketplace.recentInquiries.unknownCompany') : 'Noma\'lum kompaniya')}</h4>
                        <span class="inquiry-time">${createdDate}</span>
                    </div>
                </div>
                <div class="inquiry-priority priority-${inquiry.priority || 'medium'}">
                    ${inquiry.priority === 'high' ? 
                        `<i class="fas fa-exclamation-circle"></i>${window.t ? window.t('manufacturer.marketplace.recentInquiries.priority.high') : 'Shoshilinch'}` :
                        inquiry.priority === 'medium' ? 
                        `<i class="fas fa-circle"></i>${window.t ? window.t('manufacturer.marketplace.recentInquiries.priority.medium') : 'O\'rta'}` :
                        `<i class="fas fa-circle"></i>${window.t ? window.t('manufacturer.marketplace.recentInquiries.priority.low') : 'Oddiy'}`
                    }
                </div>
            </div>
            <div class="inquiry-content">
                <p class="inquiry-product">
                    <i class="fas fa-cube"></i>
                    ${inquiry.product || (window.t ? window.t('manufacturer.marketplace.recentInquiries.generalInquiry') : 'Umumiy so\'rov')}
                </p>
                <div class="inquiry-details">
                    <span class="quantity">
                        <i class="fas fa-sort-numeric-up"></i>
                        ${inquiry.quantity || (window.t ? window.t('manufacturer.marketplace.recentInquiries.toBeDiscussed') : 'Muhokama qilinadi')}
                    </span>
                    <span class="budget">
                        <i class="fas fa-dollar-sign"></i>
                        ${inquiry.budget || (window.t ? window.t('manufacturer.marketplace.recentInquiries.toBeDiscussed') : 'Muhokama qilinadi')}
                    </span>
                </div>
                <p class="inquiry-message">
                    ${inquiry.message && inquiry.message.length > 80 ? 
                        inquiry.message.substring(0, 80) + '...' : 
                        inquiry.message || (window.t ? window.t('manufacturer.marketplace.recentInquiries.initialContact') : 'Dastlabki aloqa va so\'rov')
                    }
                </p>
            </div>
        `;

        return element;
    }

    /**
     * Start auto-refresh
     */
    startAutoRefresh() {
        this.refreshTimers.main = setInterval(() => {
            this.loadMarketplaceData();
        }, this.options.refreshInterval);
        
    }

    /**
     * Stop auto-refresh
     */
    stopAutoRefresh() {
        Object.values(this.refreshTimers).forEach(timer => {
            clearInterval(timer);
        });
        this.refreshTimers = {};
    }

    /**
     * Refresh all data
     */
    async refreshAllData() {
        try {
            this.showRefreshIndicator();
            await this.loadMarketplaceData();
            this.hideRefreshIndicator();
            this.showSuccessMessage(window.t ? window.t('manufacturer.marketplace.messages.dataUpdated') : 'Data updated');
        } catch (error) {
            this.hideRefreshIndicator();
            this.showError(window.t ? window.t('manufacturer.marketplace.errors.updateFailed') : 'Failed to update data');
        }
    }

    /**
     * Show detailed analysis modal
     */
    showDetailedAnalysis() {
        this.showInfoMessage('Batafsil tahlil tez orada...');
    }

    /**
     * Show success message
     */
    showSuccessMessage(message) {
        this.showToast(message, 'success');
    }

    /**
     * Handle product actions (edit, stats, duplicate)
     */
    handleProductAction(action, productId) {
        if (!productId) {
            this.showError(window.t ? window.t('manufacturer.marketplace.errors.productIdNotFound') : 'Product ID not found');
            return;
        }


        switch (action) {
            case 'edit':
                // Navigate to product edit page
                window.location.href = `/manufacturer/products/edit/${productId}`;
                break;
                
            case 'stats':
            case 'analytics':
                // Navigate to product analytics page
                window.location.href = `/manufacturer/products/${productId}/analytics`;
                break;
                
            case 'duplicate':
                // Duplicate product functionality
                this.duplicateProduct(productId);
                break;
                
            case 'view-details':
                // Show detailed product information in modal
                this.showProductDetails(productId);
                break;
                
            case 'delete':
                // Delete product with confirmation
                this.deleteProduct(productId);
                break;
                
            default:
                this.showError('Noma\'lum amal');
        }
    }

    /**
     * Duplicate product
     */
    async duplicateProduct(productId) {
        try {
            const confirmation = confirm(window.t ? window.t('manufacturer.marketplace.confirmations.copyProduct') : 'Do you want to copy this product?');
            if (!confirmation) return;

            this.showInfoMessage(window.t ? window.t('manufacturer.marketplace.messages.copyingProduct') : 'Copying product...');
            
            const response = await fetch(`/manufacturer/api/products/${productId}/duplicate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = await response.json();

            if (result.success) {
                this.showInfoMessage(window.t ? window.t('manufacturer.marketplace.messages.productCopied') : 'Product copied successfully');
                // Navigate to edit the new product
                setTimeout(() => {
                    window.location.href = `/manufacturer/products/edit/${result.data.newProductId}`;
                }, 1500);
            } else {
                this.showError(result.message || (window.t ? window.t('manufacturer.marketplace.errors.copyFailed') : 'Copy operation failed'));
            }

        } catch (error) {
            this.showError(window.t ? window.t('manufacturer.marketplace.errors.copyFailed') : 'Copy operation failed');
        }
    }

    /**
     * Delete product with confirmation
     */
    async deleteProduct(productId) {
        try {
            const confirmation = confirm(window.t ? window.t('manufacturer.marketplace.confirmations.deleteProduct') : 'Do you want to delete this product? This action cannot be undone.');
            if (!confirmation) return;

            this.showInfoMessage(window.t ? window.t('manufacturer.marketplace.messages.deletingProduct') : 'Deleting product...');
            
            const response = await fetch(`/manufacturer/api/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = await response.json();

            if (result.success) {
                this.showInfoMessage(window.t ? window.t('manufacturer.marketplace.messages.productDeleted') : 'Product deleted successfully');
                // Refresh the products list
                setTimeout(() => {
                    this.loadFeaturedProducts();
                }, 1000);
            } else {
                this.showError(result.message || (window.t ? window.t('manufacturer.marketplace.errors.deleteFailed') : 'Delete operation failed'));
            }

        } catch (error) {
            this.showError(window.t ? window.t('manufacturer.marketplace.errors.deleteFailed') : 'Delete operation failed');
        }
    }

    /**
     * Show detailed product information in modal
     */
    async showProductDetails(productId) {
        try {
            
            const modal = document.getElementById('productDetailsModal');
            const modalBody = document.getElementById('modalBody');
            
            if (!modal || !modalBody) {
                this.showError('Modal topilmadi');
                return;
            }

            // Show modal with loading state
            modal.classList.add('active');
            modalBody.innerHTML = `
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <p>${window.t ? window.t('manufacturer.marketplace.modal.loading') : 'Ma\'lumot yuklanmoqda...'}</p>
                </div>
            `;

            // Fetch product details
            const response = await fetch(`/manufacturer/api/products/${productId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = await response.json();

            if (result.success && result.data) {
                const product = result.data;

                
                try {
                    const htmlContent = this.generateProductDetailsHTML(product);
                    modalBody.innerHTML = htmlContent;
                } catch (htmlError) {
                    modalBody.innerHTML = `
                        <div class="error-content">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>${window.t ? window.t('manufacturer.marketplace.errors.htmlCreationFailed') : 'HTML creation error'}: ${htmlError.message}</p>
                        </div>
                    `;
                }
            } else {
                modalBody.innerHTML = `
                    <div class="error-content">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>${result.message || (window.t ? window.t('manufacturer.marketplace.errors.loadProductDataFailed') : 'Failed to load product data')}</p>
                    </div>
                `;
            }

        } catch (error) {
            const modalBody = document.getElementById('modalBody');
            if (modalBody) {
                modalBody.innerHTML = `
                    <div class="error-content">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>${window.t ? window.t('manufacturer.marketplace.errors.loadDataFailed') : 'Failed to load data'}: ${error.message}</p>
                    </div>
                `;
            }
        }
    }

    /**
     * Generate detailed product HTML for modal
     */
    generateProductDetailsHTML(product) {
        // Helper function to safely get category string
        const getCategoryString = (category) => {
            if (typeof category === 'string') {
                return category;
            } else if (typeof category === 'object' && category !== null) {
                return category.name || category._id || 'general';
            }
            return 'general';
        };
        
        const formatPrice = (pricing) => {
            if (!pricing || !pricing.basePrice) return window.t ? window.t('manufacturer.marketplace.featuredProducts.priceOnRequest') : 'Price on Request';
            const currency = pricing.currency === 'USD' ? '$' : pricing.currency;
            return `${currency}${pricing.basePrice.toLocaleString()}`;
        };

        const formatSpecs = (specifications) => {
            if (!specifications || specifications.length === 0) return '<p>Texnik xususiyatlar ko\'rsatilmagan</p>';
            return specifications.map(spec => 
                `<div class="spec-row">
                    <span class="spec-name">${spec.name}</span>
                    <span class="spec-value">${spec.value}${spec.unit ? ' ' + spec.unit : ''}</span>
                </div>`
            ).join('');
        };

        return `
            <div class="product-details-content">
                <!-- Product Header -->
                <div class="modal-product-header">
                    <div class="modal-product-image">
                        ${product.images && product.images.length > 0 ? 
                            `<img src="${typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url || product.images[0]}" 
                                alt="${product.name}" 
                                class="modal-real-image"
                                data-category="${getCategoryString(product.category)}"
                                data-product-id="${product._id}"
                                data-product-name="${product.name || (window.t ? window.t('manufacturer.marketplace.featuredProducts.unnamedProduct') : 'Unnamed Product')}"
                                onerror="handleImageError(this)">` :
                            `<img 
                                src="${(() => {
                                    const mockSrc = generateMockImage(getCategoryString(product.category), product._id, product.name);
                                    return mockSrc;
                                })()}" 
                                alt="${product.name}" 
                                class="modal-mock-image" 
                                data-category="${getCategoryString(product.category)}"
                                data-product-id="${product._id}"
                                data-product-name="${product.name || (window.t ? window.t('manufacturer.marketplace.featuredProducts.unnamedProduct') : 'Unnamed Product')}"
                                onerror="handleImageError(this)"
                            >`
                        }
                    </div>
                    <div class="modal-product-info">
                        <h3 class="modal-product-title">${product.name || (window.t ? window.t('manufacturer.marketplace.featuredProducts.unnamedProduct') : 'Unnamed Product')}</h3>
                        <p class="modal-product-category">
                            <i class="fas fa-tag"></i>
                            ${product.category?.name || product.category || (window.t ? window.t('manufacturer.marketplace.featuredProducts.noCategory') : 'No Category')}
                        </p>
                        <div class="modal-product-id">ID: ${product._id.toString().slice(-8).toUpperCase()}</div>
                        <div class="modal-product-price">
                            <span class="price-large">${formatPrice(product.pricing)}</span>
                            ${product.pricing?.minimumOrderQuantity ? 
                                `<span class="moq-large">${window.t ? window.t('manufacturer.marketplace.featuredProducts.minimum') : 'Minimum'}: ${product.pricing.minimumOrderQuantity.toLocaleString()} ${window.t ? window.t('manufacturer.marketplace.featuredProducts.unit') : 'unit'}</span>` : 
                                `<span class="moq-large">${window.t ? window.t('manufacturer.marketplace.featuredProducts.minimum') : 'Minimum'}: 100 ${window.t ? window.t('manufacturer.marketplace.featuredProducts.unit') : 'unit'}</span>`
                            }
                        </div>
                    </div>
                </div>

                <!-- Product Description -->
                ${product.description ? 
                    `<div class="modal-section">
                        <h4 class="section-title">${window.t ? window.t('manufacturer.marketplace.modal.description') : 'Description'}</h4>
                        <p class="product-description">${product.description}</p>
                    </div>` : ''
                }

                <!-- Specifications -->
                <div class="modal-section">
                    <h4 class="section-title">${window.t ? window.t('manufacturer.marketplace.modal.specifications') : 'Technical Specifications'}</h4>
                    <div class="specifications-grid">
                        ${formatSpecs(product.specifications)}
                    </div>
                </div>

                <!-- Inventory & Shipping -->
                <div class="modal-sections-grid">
                    <div class="modal-section">
                        <h4 class="section-title">${window.t ? window.t('manufacturer.marketplace.modal.inventoryStatus') : 'Inventory Status'}</h4>
                        <div class="inventory-info">
                            <div class="inventory-item">
                                <span class="inventory-label">${window.t ? window.t('manufacturer.marketplace.modal.total') : 'Total'}:</span>
                                <span class="inventory-value">${product.inventory?.totalStock?.toLocaleString() || '0'} ${product.inventory?.unit || (window.t ? window.t('manufacturer.marketplace.featuredProducts.unit') : 'unit')}</span>
                            </div>
                            <div class="inventory-item">
                                <span class="inventory-label">${window.t ? window.t('manufacturer.marketplace.modal.available') : 'Available'}:</span>
                                <span class="inventory-value">${product.inventory?.availableStock?.toLocaleString() || '0'} ${product.inventory?.unit || (window.t ? window.t('manufacturer.marketplace.featuredProducts.unit') : 'unit')}</span>
                            </div>
                        </div>
                    </div>

                    <div class="modal-section">
                        <h4 class="section-title">${window.t ? window.t('manufacturer.marketplace.modal.shipping') : 'Shipping'}</h4>
                        <div class="shipping-info">
                            ${product.shipping?.leadTime ? 
                                `<div class="shipping-item">
                                    <span class="shipping-label">${window.t ? window.t('manufacturer.marketplace.modal.leadTime') : 'Lead Time'}:</span>
                                    <span class="shipping-value">${product.shipping.leadTime.min}-${product.shipping.leadTime.max} ${window.t ? window.t('manufacturer.marketplace.modal.days') : 'days'}</span>
                                </div>` : ''
                            }
                            ${product.shipping?.weight ? 
                                `<div class="shipping-item">
                                    <span class="shipping-label">${window.t ? window.t('manufacturer.marketplace.modal.weight') : 'Weight'}:</span>
                                    <span class="shipping-value">${product.shipping.weight} kg</span>
                                </div>` : ''
                            }
                        </div>
                    </div>
                </div>

                <!-- Product Stats -->
                <div class="modal-section">
                    <h4 class="section-title">${window.t ? window.t('manufacturer.marketplace.modal.statistics') : 'Statistics'}</h4>
                    <div class="modal-stats-grid">
                        <div class="modal-stat">
                            <i class="fas fa-eye"></i>
                            <div class="stat-info">
                                <span class="stat-value">${(product.views || 0).toLocaleString()}</span>
                                <span class="stat-label">${window.t ? window.t('manufacturer.marketplace.modal.views') : 'Views'}</span>
                            </div>
                        </div>
                        <div class="modal-stat">
                            <i class="fas fa-star"></i>
                            <div class="stat-info">
                                <span class="stat-value">${product.rating || 4.5}</span>
                                <span class="stat-label">${window.t ? window.t('manufacturer.marketplace.modal.rating') : 'Rating'}</span>
                            </div>
                        </div>
                        <div class="modal-stat">
                            <i class="fas fa-shopping-cart"></i>
                            <div class="stat-info">
                                <span class="stat-value">${product.orderCount || 0}</span>
                                <span class="stat-label">${window.t ? window.t('manufacturer.marketplace.modal.orders') : 'Orders'}</span>
                            </div>
                        </div>
                        <div class="modal-stat">
                            <i class="fas fa-calendar-plus"></i>
                            <div class="stat-info">
                                <span class="stat-value">${product.createdAt ? new Date(product.createdAt).toLocaleDateString('uz-UZ') : (window.t ? window.t('manufacturer.marketplace.modal.unknown') : 'Unknown')}</span>
                                <span class="stat-label">${window.t ? window.t('manufacturer.marketplace.modal.created') : 'Created'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="modal-actions">
                    <button class="btn-modal btn-primary" onclick="window.location.href='/manufacturer/products/edit/${product._id}'">
                        <i class="fas fa-edit"></i>
                        ${window.t ? window.t('manufacturer.marketplace.featuredProducts.edit') : 'Tahrirlash'}
                    </button>
                    <button class="btn-modal btn-secondary" onclick="window.location.href='/manufacturer/products/${product._id}/analytics'">
                        <i class="fas fa-chart-line"></i>
                        ${window.t ? window.t('manufacturer.marketplace.modal.analytics') : 'Analytics'}
                    </button>
                    <button class="btn-modal btn-outline" onclick="document.getElementById('productDetailsModal').classList.remove('active')">
                        <i class="fas fa-times"></i>
                        Yopish
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showToast(message, 'error');
    }

    /**
     * Show info message
     */
    showInfoMessage(message) {
        this.showToast(message, 'info');
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 16px',
            borderRadius: '8px',
            color: 'white',
            zIndex: '9999',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'
        });

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    /**
     * Show refresh indicator
     */
    showRefreshIndicator() {
        document.body.style.cursor = 'wait';
    }

    /**
     * Hide refresh indicator
     */
    hideRefreshIndicator() {
        document.body.style.cursor = 'default';
    }
}

// Professional SVG Placeholder - Industry Standard
const PROFESSIONAL_PLACEHOLDER_SVG = 'data:image/svg+xml;base64,' + btoa(`
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f3f4f6"/>
  <g fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">
    <text x="50%" y="45%" font-family="Arial, sans-serif" font-size="16" font-weight="500">Product</text>
    <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="14">Image</text>
  </g>
  <circle cx="100" cy="35" r="8" fill="#d1d5db"/>
  <path d="M70 80 L130 80 L110 60 Z" fill="#d1d5db"/>
</svg>
`);

// Professional Mock Image System - Category-Based Images
const PROFESSIONAL_MOCK_IMAGES = {
    // Textile & Cotton Products
    'textiles': [
        'data:image/svg+xml;base64,' + btoa(`<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="fabric" patternUnits="userSpaceOnUse" width="20" height="20"><rect width="20" height="20" fill="#f8fafc"/><circle cx="10" cy="10" r="2" fill="#3b82f6"/></pattern></defs><rect width="300" height="300" fill="url(#fabric)"/><rect x="50" y="50" width="200" height="200" fill="#e2e8f0" stroke="#3b82f6" stroke-width="3"/><text x="150" y="160" text-anchor="middle" font-family="Arial" font-size="18" fill="#1e40af" font-weight="bold">TEXTILE</text><text x="150" y="180" text-anchor="middle" font-family="Arial" font-size="14" fill="#64748b">Premium Fabric</text></svg>`),
        'data:image/svg+xml;base64,' + btoa(`<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#f1f5f9"/><rect x="30" y="80" width="240" height="140" fill="#3b82f6" rx="10"/><rect x="50" y="100" width="200" height="100" fill="#1d4ed8" rx="5"/><text x="150" y="140" text-anchor="middle" font-family="Arial" font-size="16" fill="white" font-weight="bold">COTTON</text><text x="150" y="160" text-anchor="middle" font-family="Arial" font-size="12" fill="#bfdbfe">100% Organic</text></svg>`)
    ],
    // Food & Agriculture
    'food': [
        'data:image/svg+xml;base64,' + btoa(`<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#fef3c7"/><circle cx="150" cy="150" r="80" fill="#f59e0b" opacity="0.2"/><rect x="120" y="120" width="60" height="60" fill="#d97706" rx="5"/><text x="150" y="145" text-anchor="middle" font-family="Arial" font-size="14" fill="white" font-weight="bold">FOOD</text><text x="150" y="160" text-anchor="middle" font-family="Arial" font-size="10" fill="white">Premium Quality</text><circle cx="150" cy="80" r="15" fill="#f59e0b"/><circle cx="100" cy="200" r="10" fill="#d97706"/><circle cx="200" cy="220" r="12" fill="#f59e0b"/></svg>`),
        'data:image/svg+xml;base64,' + btoa(`<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#ecfdf5"/><rect x="50" y="100" width="200" height="100" fill="#10b981" rx="10"/><text x="150" y="140" text-anchor="middle" font-family="Arial" font-size="18" fill="white" font-weight="bold">ORGANIC</text><text x="150" y="160" text-anchor="middle" font-family="Arial" font-size="12" fill="#86efac">Fresh & Natural</text><circle cx="80" cy="70" r="8" fill="#059669"/><circle cx="220" cy="230" r="6" fill="#10b981"/></svg>`)
    ],
    // Electronics & Technology
    'electronics': [
        'data:image/svg+xml;base64,' + btoa(`<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#f8fafc"/><rect x="50" y="80" width="200" height="140" fill="#1e293b" rx="10"/><rect x="70" y="100" width="160" height="100" fill="#0f172a" rx="5"/><circle cx="90" cy="120" r="3" fill="#22d3ee"/><circle cx="110" cy="120" r="3" fill="#ef4444"/><circle cx="130" cy="120" r="3" fill="#10b981"/><rect x="80" y="140" width="140" height="40" fill="#334155" rx="3"/><text x="150" y="160" text-anchor="middle" font-family="Arial" font-size="12" fill="#64748b">ELECTRONICS</text></svg>`),
        'data:image/svg+xml;base64,' + btoa(`<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#fef2f2"/><rect x="80" y="60" width="140" height="180" fill="#dc2626" rx="15"/><rect x="100" y="80" width="100" height="60" fill="#991b1b" rx="5"/><text x="150" y="110" text-anchor="middle" font-family="Arial" font-size="12" fill="white" font-weight="bold">LED PANEL</text><circle cx="150" cy="180" r="20" fill="#fee2e2"/><circle cx="150" cy="180" r="15" fill="#dc2626"/></svg>`)
    ],
    // General/Default Products
    'general': [
        'data:image/svg+xml;base64,' + btoa(`<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#f1f5f9"/><rect x="75" y="75" width="150" height="150" fill="#e2e8f0" stroke="#64748b" stroke-width="2" rx="10"/><rect x="100" y="100" width="100" height="100" fill="#94a3b8" rx="5"/><text x="150" y="145" text-anchor="middle" font-family="Arial" font-size="14" fill="white" font-weight="bold">PRODUCT</text><text x="150" y="160" text-anchor="middle" font-family="Arial" font-size="10" fill="white">B2B Quality</text></svg>`),
        'data:image/svg+xml;base64,' + btoa(`<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#fafafa"/><polygon points="150,50 250,150 150,250 50,150" fill="#6366f1" opacity="0.8"/><polygon points="150,80 220,150 150,220 80,150" fill="#4f46e5"/><text x="150" y="145" text-anchor="middle" font-family="Arial" font-size="12" fill="white" font-weight="bold">PREMIUM</text><text x="150" y="160" text-anchor="middle" font-family="Arial" font-size="8" fill="#c7d2fe">Manufacturing</text></svg>`)
    ],
    // Machinery & Industrial
    'machinery': [
        'data:image/svg+xml;base64,' + btoa(`<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#f9fafb"/><rect x="50" y="100" width="200" height="100" fill="#374151" rx="5"/><circle cx="100" cy="150" r="20" fill="#6b7280"/><circle cx="200" cy="150" r="20" fill="#6b7280"/><rect x="120" y="140" width="60" height="20" fill="#9ca3af" rx="3"/><text x="150" y="240" text-anchor="middle" font-family="Arial" font-size="14" fill="#374151" font-weight="bold">MACHINERY</text></svg>`),
        'data:image/svg+xml;base64,' + btoa(`<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#f0f9ff"/><rect x="70" y="80" width="160" height="140" fill="#0ea5e9" rx="8"/><rect x="90" y="100" width="120" height="100" fill="#0284c7" rx="5"/><circle cx="110" cy="130" r="8" fill="#7dd3fc"/><circle cx="150" cy="130" r="8" fill="#7dd3fc"/><circle cx="190" cy="130" r="8" fill="#7dd3fc"/><text x="150" y="250" text-anchor="middle" font-family="Arial" font-size="12" fill="#0369a1" font-weight="bold">INDUSTRIAL</text></svg>`)
    ]
};

// Generate mock image based on category and product info
function generateMockImage(category, productId, productName) {
    // Categorize based on product name and category
    let imageCategory = 'general';
    
    if (category) {
        // Handle both string and object categories
        let categoryString = '';
        if (typeof category === 'string') {
            categoryString = category;
        } else if (typeof category === 'object' && category !== null) {
            categoryString = category.name || category._id || String(category);
        } else {
            categoryString = String(category);
        }
        const cat = categoryString.toLowerCase();
        if (cat.includes('textile') || cat.includes('fabric') || cat.includes('cotton') || cat.includes('yarn')) {
            imageCategory = 'textiles';
        } else if (cat.includes('food') || cat.includes('agriculture') || cat.includes('organic') || cat.includes('grain')) {
            imageCategory = 'food';
        } else if (cat.includes('electronic') || cat.includes('led') || cat.includes('display') || cat.includes('tech')) {
            imageCategory = 'electronics';
        } else if (cat.includes('machinery') || cat.includes('industrial') || cat.includes('equipment')) {
            imageCategory = 'machinery';
        }
    }
    
    // Also check product name for better categorization
    if (productName) {
        const name = productName.toLowerCase();
        if (name.includes('cotton') || name.includes('fabric') || name.includes('textile')) {
            imageCategory = 'textiles';
        } else if (name.includes('flour') || name.includes('wheat') || name.includes('food') || name.includes('organic')) {
            imageCategory = 'food';
        } else if (name.includes('led') || name.includes('display') || name.includes('panel') || name.includes('electronic')) {
            imageCategory = 'electronics';
        } else if (name.includes('machine') || name.includes('industrial') || name.includes('equipment')) {
            imageCategory = 'machinery';
        }
    }
    
    // Get images for the category
    const categoryImages = PROFESSIONAL_MOCK_IMAGES[imageCategory] || PROFESSIONAL_MOCK_IMAGES['general'];
    
    // Use product ID to consistently select the same image for the same product
    const imageIndex = productId ? 
        Math.abs(productId.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % categoryImages.length :
        Math.floor(Math.random() * categoryImages.length);
    
    return categoryImages[imageIndex];
}

// ENHANCED Professional Image Error Handler - Senior Software Engineer Pattern
function handleImageError(img) {
    if (img.dataset.errorHandled) return; // Prevent infinite loop
    
    
    img.dataset.errorHandled = 'true';
    img.onerror = null;
    
    // CASE 1: Real image failed - convert to mock image (including modal real images)
    if (img.classList.contains('product-real-image') || img.classList.contains('modal-real-image')) {
        
        const category = img.dataset.category || 'general';
        const productId = img.dataset.productId || '';
        const productName = img.dataset.productName || '';
        
        // Remove real image class and add mock image class
        img.classList.remove('product-real-image', 'modal-real-image');
        img.classList.add('mock-product-image', 'modal-mock-image', 'converted-from-real');
        
        // Generate mock image
        const mockSrc = generateMockImage(category, productId, productName);
        img.src = mockSrc;
        
        return;
    }
    
    // CASE 2: Mock image failed - use backup mock image (including modal mock images)
    if (img.classList.contains('mock-product-image') || img.classList.contains('modal-mock-image')) {
        
        const category = img.dataset.category || 'general';
        const productId = img.dataset.productId || '';
        const productName = img.dataset.productName || '';
        
        // Try different mock image from the same category
        const categoryImages = PROFESSIONAL_MOCK_IMAGES[category] || PROFESSIONAL_MOCK_IMAGES['general'];
        const backupIndex = (parseInt(productId.slice(-2), 16) || 1) % categoryImages.length;
        const backupSrc = categoryImages[backupIndex];
        
        img.src = backupSrc;
        img.classList.add('backup-mock-image');
        
        return;
    }
    
    // CASE 3: Everything failed - use professional SVG placeholder
    img.src = PROFESSIONAL_PLACEHOLDER_SVG;
    img.classList.add('final-placeholder');
    
    // CASE 4: Even SVG failed - show CSS placeholder
    img.onerror = function() {
        this.style.display = 'none';
        
        // Create CSS placeholder if it doesn't exist
        let placeholder = this.nextElementSibling;
        if (!placeholder || !placeholder.classList.contains('product-image-placeholder')) {
            placeholder = document.createElement('div');
            placeholder.className = 'product-image-placeholder';
            placeholder.innerHTML = `
                <i class="fas fa-image"></i>
                <span>No Image Available</span>
            `;
            this.parentNode.insertBefore(placeholder, this.nextSibling);
        }
        
        placeholder.style.display = 'flex';
    };
}

// Professional Event Delegation Handler - Senior Software Engineer Pattern
function initializeEventDelegation() {
    // Product Actions Event Delegation
    document.addEventListener('click', function(e) {
        const button = e.target.closest('button[data-action][data-product-id]');
        if (!button) return;
        
        const action = button.dataset.action;
        const productId = button.dataset.productId;
        
        if (!productId) return;
        
        switch (action) {
            case 'edit':
                window.location.href = `/manufacturer/products/edit/${productId}`;
                break;
            case 'stats':
                window.location.href = `/manufacturer/products/${productId}/analytics`;
                break;
            case 'view-details':
                if (window.marketplaceManager) {
                    window.marketplaceManager.showProductDetails(productId);
                }
                break;
        }
    });
    
    // Inquiry Actions Event Delegation
    document.addEventListener('click', function(e) {
        const button = e.target.closest('button[data-action][data-inquiry-id]');
        if (!button) return;
        
        const action = button.dataset.action;
        const inquiryId = button.dataset.inquiryId;
        
        if (!inquiryId) return;
        
        switch (action) {
            case 'respond':
                window.location.href = `/manufacturer/inquiries/${inquiryId}/respond`;
                break;
            case 'quote':
                window.location.href = `/manufacturer/inquiries/${inquiryId}/quote`;
                break;
        }
    });
}

// Initialize animation delays from data attributes
function initializeAnimationDelays() {
    const animatedElements = document.querySelectorAll('[data-animation-delay]');
    animatedElements.forEach(element => {
        const delay = element.dataset.animationDelay;
        if (delay) {
            element.style.animationDelay = `${delay}s`;
        }
    });
}

// Initialize global image error handling
function initializeImageErrorHandling() {
    // Handle all existing images that might have failed to load
    const images = document.querySelectorAll('img:not([data-error-handled])');
    images.forEach(img => {
        if (img.complete && img.naturalWidth === 0) {
            handleImageError(img);
        }
    });
}

// NOTE: Sidebar toggle functionality is now handled by dashboard-init.js 
// This prevents conflicts and ensures consistent behavior across all pages
function initializeResponsiveHandlers() {
    
    // Only handle marketplace-specific responsive behavior here
    if (window.innerWidth <= 1024) {
    }
    
}

// ENHANCED Mock Images System - Professional B2B Implementation
function initializeMockImages() {
    
    // Find all images that need mock treatment
    const mockImages = document.querySelectorAll('.mock-product-image[data-needs-mock="true"], .loading-placeholder');
    const realImages = document.querySelectorAll('.product-real-image');
    
    
    // Process mock images
    mockImages.forEach((img, index) => {
        const category = img.dataset.category || 'general';
        const productId = img.dataset.productId || '';
        const productName = img.dataset.productName || '';
        
        // Generate appropriate mock image
        const mockSrc = generateMockImage(category, productId, productName);
        
        // Set the mock image with enhanced loading
        setTimeout(() => {
            img.src = mockSrc;
            img.classList.remove('loading-placeholder');
            img.classList.add('mock-image-loaded');
            img.removeAttribute('data-needs-mock');
            
            
            // Add responsive behavior
            img.style.opacity = '0';
            img.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                img.style.transition = 'all 0.3s ease';
                img.style.opacity = '1';
                img.style.transform = 'scale(1)';
            }, 50);
            
        }, index * 75); // Stagger loading for visual effect
    });
    
    // Process real images for better error handling
    realImages.forEach((img, index) => {
        const productName = img.dataset.productName || 'Unknown';
        
        // Add loading indicator
        img.style.transition = 'opacity 0.3s ease';
        
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
        
        img.addEventListener('error', function() {
            handleImageError(this);
        });
        
        // Check if image is already loaded (cached)
        if (img.complete && img.naturalWidth > 0) {
            img.style.opacity = '1';
        }
    });
    
}

// PROFESSIONAL Image System Debugging - Senior Software Engineer
function debugImageSystem() {
    
    // Check all product cards
    const productCards = document.querySelectorAll('.b2b-product-card');
    
    // Analyze each card's image system
    productCards.forEach((card, index) => {
        const productId = card.dataset.product || 'unknown';
        const realImage = card.querySelector('.product-real-image');
        const mockImage = card.querySelector('.mock-product-image');
        const loadingPlaceholder = card.querySelector('.loading-placeholder');
        
        if (realImage || mockImage) {
            // Image found, no action needed
        }
        
        if (loadingPlaceholder) {
        }
        
        if (!realImage && !mockImage && !loadingPlaceholder) {
        }
    });
    
    
    // Check if CSS is loaded
    const testElement = document.createElement('div');
    testElement.className = 'product-image-section';
    document.body.appendChild(testElement);
    const styles = window.getComputedStyle(testElement);
    const hasCSS = styles.height !== 'auto' && styles.height !== '';
    document.body.removeChild(testElement);

}

// Initialize Marketplace on DOM ready (DASHBOARD-COMPATIBLE PATTERN)
document.addEventListener('DOMContentLoaded', async function() {
    
    // MARKETPLACE-SPECIFIC HEADER FUNCTIONALITY (AVOID DASHBOARD-INIT.JS CONFLICTS)
    function initializeHeaderFunctionality() {
        // Always use custom functions to avoid conflicts with dashboard-init.js
        initTheme();
        initLanguage();
        initDropdowns();
        initSidebar();
    }
    
    // RETRY MECHANISM: Try multiple times in case scripts are still loading
    function attemptHeaderInitialization(retryCount = 0) {
        const maxRetries = 5;
        const retryDelay = 200; // ms
        
        // Always use custom functions, don't rely on ManufacturerHeader
        initializeHeaderFunctionality();
    }
    
    // THEME MANAGEMENT DISABLED - DELEGATED TO DASHBOARD-INIT.JS
    function initTheme() {
        // Theme functionality is handled by dashboard-init.js to prevent conflicts
        // This function is kept for compatibility but does nothing
        console.log('⚠️ Marketplace theme init disabled - delegated to dashboard-init.js');
        
        // Just ensure theme is applied from localStorage without adding duplicate listeners
        const savedTheme = localStorage.getItem('dashboard-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Update theme icon without adding duplicate event listener
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }
    
    // LANGUAGE FUNCTION DISABLED - DELEGATED TO DASHBOARD-INIT.JS
    function initLanguage() {
        // Language functionality is handled by dashboard-init.js to prevent conflicts
        // This function is kept for compatibility but does nothing
        console.log('⚠️ Marketplace language init disabled - delegated to dashboard-init.js');
    }
    
    // DROPDOWN FUNCTION DISABLED - DELEGATED TO DASHBOARD-INIT.JS
    function initDropdowns() {
        // Dropdown functionality is handled by dashboard-init.js to prevent conflicts
        // This function is kept for compatibility but does nothing
        console.log('⚠️ Marketplace dropdown init disabled - delegated to dashboard-init.js');
    }
    
    // SIDEBAR FUNCTIONALITY DELEGATED TO DASHBOARD-INIT.JS
    function initSidebar() {
        
        // Verify that dashboard-init.js has set up the sidebar
        if (!window.sidebarInitialized) {
            
            // Wait for dashboard-init.js to initialize, then report status
            setTimeout(() => {
                if (window.sidebarInitialized) {
                } else {
                }
            }, 1000);
        } else {
        }
    }
    
    // PROFESSIONAL Image System Debugging
    debugImageSystem();

    // Initialize Professional Mock Images System
    initializeMockImages();

    // Initialize dashboard options (EXACT Dashboard Pattern)
    const dashboardOptions = {
        userId: marketplaceData.user.id,
        userName: marketplaceData.user.name,
        companyName: marketplaceData.user.companyName,
        currentPage: 'marketplace'
    };
    
    // Initialize core manufacturer dashboard functionality
    if (window.ManufacturerDashboard) {
        window.manufacturerDashboard = new ManufacturerDashboard(dashboardOptions);
        
        try {
            await window.manufacturerDashboard.init();
        } catch (error) {
        }
    }
    
    // Initialize header functionality with retry (FIXED DASHBOARD DROPDOWNS)
    attemptHeaderInitialization();
    
    // Initialize professional event delegation
    initializeEventDelegation();
    
    // Initialize animation delays
    initializeAnimationDelays();
    
    // Initialize professional image error handling
    initializeImageErrorHandling();

    // Initialize marketplace manager
    window.marketplaceManager = new MarketplaceManager();
    window.marketplaceManager.init();

    // Initialize modal functionality
    const modal = document.getElementById('productDetailsModal');
    const closeModal = document.getElementById('closeModal');
    
    if (modal && closeModal) {
        // Close modal on close button click
        closeModal.addEventListener('click', () => {
            modal.classList.remove('active');
        });

        // Close modal on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                modal.classList.remove('active');
            }
        });
    }
});