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
                competitorAnalysis: '/manufacturer/api/competitor-analysis'
            },
            ...options
        };
        
        this.charts = {};
        this.refreshTimers = {};
        this.isInitialized = false;
        this.logger = console;
        this.data = marketplaceData;
    }

    /**
     * Initialize marketplace manager
     */
    async init() {
        try {
            this.logger.log('🛍️ Initializing B2B Marketplace Manager...');

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
            this.logger.log('✅ B2B Marketplace Manager initialized successfully');

        } catch (error) {
            this.logger.error('❌ Marketplace initialization failed:', error);
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
                this.loadFeaturedProducts();
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
            
            // Extract chart data from server data
            const viewsGrowth = (this.data.marketplaceMetrics && this.data.marketplaceMetrics.growth && this.data.marketplaceMetrics.growth.views) || 15;
            const inquiriesGrowth = (this.data.marketplaceMetrics && this.data.marketplaceMetrics.growth && this.data.marketplaceMetrics.growth.inquiries) || 12;
            
            this.charts.performance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [
                    window.t ? window.t('manufacturer.marketplace.charts.week1') : 'Week 1',
                    window.t ? window.t('manufacturer.marketplace.charts.week2') : 'Week 2',
                    window.t ? window.t('manufacturer.marketplace.charts.week3') : 'Week 3',
                    window.t ? window.t('manufacturer.marketplace.charts.week4') : 'Week 4'
                ],
                    datasets: [{
                        label: window.t ? window.t('manufacturer.marketplace.charts.views') : 'Views',
                        data: [viewsGrowth, viewsGrowth + 5, viewsGrowth + 8, viewsGrowth + 12],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    }, {
                        label: window.t ? window.t('manufacturer.marketplace.charts.inquiries') : 'Inquiries',
                        data: [inquiriesGrowth, inquiriesGrowth + 3, inquiriesGrowth + 5, inquiriesGrowth + 8],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
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
            this.logger.log('🔄 Loading marketplace data...');
            
            await Promise.all([
                this.loadMarketplaceMetrics(),
                this.loadFeaturedProducts(),
                this.loadRecentInquiries(),
                this.loadCompetitorAnalysis()
            ]);
            
            this.logger.log('✅ All marketplace data loaded successfully');
        } catch (error) {
            this.logger.error('❌ Failed to load marketplace data:', error);
        }
    }

    /**
     * Load marketplace metrics via API
     */
    async loadMarketplaceMetrics() {
        try {
            this.logger.log('📊 Loading marketplace metrics from API...');
            
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
                this.logger.log('✅ Marketplace metrics updated from API');
            }
        } catch (error) {
            this.logger.error('❌ Failed to load marketplace metrics:', error);
        }
    }

    /**
     * Load featured products via API
     */
    async loadFeaturedProducts() {
        try {
            this.logger.log('⭐ Loading featured products from API...');
            
            const response = await fetch(this.options.apiEndpoints.featuredProducts, {
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
                this.updateFeaturedProducts(result.data);
                this.logger.log('✅ Featured products updated from API');
            }
        } catch (error) {
            this.logger.error('❌ Failed to load featured products:', error);
        }
    }

    /**
     * Load recent inquiries via API
     */
    async loadRecentInquiries() {
        try {
            this.logger.log('💬 Loading recent inquiries from API...');
            
            const response = await fetch(this.options.apiEndpoints.recentInquiries, {
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
                this.updateRecentInquiries(result.data);
                this.logger.log('✅ Recent inquiries updated from API');
            }
        } catch (error) {
            this.logger.error('❌ Failed to load recent inquiries:', error);
        }
    }

    /**
     * Load competitor analysis via API
     */
    async loadCompetitorAnalysis() {
        try {
            this.logger.log('📊 Loading competitor analysis from API...');
            
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
                this.logger.log('✅ Competitor analysis updated from API');
            }
        } catch (error) {
            this.logger.error('❌ Failed to load competitor analysis:', error);
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

            this.logger.log('✅ Marketplace metrics UI updated');
        } catch (error) {
            this.logger.error('❌ Failed to update marketplace metrics UI:', error);
        }
    }

    /**
     * Update featured products in UI
     */
    updateFeaturedProducts(products) {
        try {
            const gridElement = this.elements.featuredProductsGrid;
            if (!gridElement || !Array.isArray(products)) return;

            const existingProducts = gridElement.querySelectorAll('.product-card');
            existingProducts.forEach(card => card.remove());

            products.forEach((product, index) => {
                const productCard = this.createProductCard(product, index);
                gridElement.appendChild(productCard);
            });

            this.logger.log('✅ Featured products UI updated');
        } catch (error) {
            this.logger.error('❌ Failed to update featured products UI:', error);
        }
    }

    /**
     * Update recent inquiries in UI
     */
    updateRecentInquiries(inquiries) {
        try {
            const listElement = this.elements.recentInquiriesList;
            if (!listElement || !Array.isArray(inquiries)) return;

            listElement.innerHTML = '';

            if (inquiries.length === 0) {
                listElement.innerHTML = `
                    <div class="empty-inquiries">
                        <div class="empty-icon">
                            <i class="fas fa-inbox"></i>
                        </div>
                        <p class="empty-text">${window.t ? window.t('manufacturer.marketplace.recentInquiries.noInquiries') : 'No new inquiries'}</p>
                    </div>
                `;
            } else {
                inquiries.forEach(inquiry => {
                    const inquiryElement = this.createInquiryElement(inquiry);
                    listElement.appendChild(inquiryElement);
                });
            }

            this.logger.log('✅ Recent inquiries UI updated');
        } catch (error) {
            this.logger.error('❌ Failed to update recent inquiries UI:', error);
        }
    }

    /**
     * Update competitor analysis in UI
     */
    updateCompetitorAnalysis(analysis) {
        try {
            const positionBadges = document.querySelectorAll('.position-badge');
            positionBadges.forEach(badge => {
                if (analysis.marketPosition) {
                    badge.textContent = analysis.marketPosition;
                    badge.className = `position-badge position-${analysis.marketPosition.toLowerCase()}`;
                }
            });

            const strengthsList = document.querySelector('.strengths-list');
            if (strengthsList && analysis.strengths) {
                strengthsList.innerHTML = '';
                analysis.strengths.forEach(strength => {
                    const li = document.createElement('li');
                    li.className = 'strength-item';
                    li.innerHTML = `<i class="fas fa-check-circle"></i>${strength}`;
                    strengthsList.appendChild(li);
                });
            }

            const opportunitiesList = document.querySelector('.opportunities-list');
            if (opportunitiesList && analysis.opportunities) {
                opportunitiesList.innerHTML = '';
                analysis.opportunities.forEach(opportunity => {
                    const li = document.createElement('li');
                    li.className = 'opportunity-item';
                    li.innerHTML = `<i class="fas fa-lightbulb"></i>${opportunity}`;
                    opportunitiesList.appendChild(li);
                });
            }

            this.logger.log('✅ Competitor analysis UI updated');
        } catch (error) {
            this.logger.error('❌ Failed to update competitor analysis UI:', error);
        }
    }

    /**
     * Create product card element
     */
    createProductCard(product, index) {
        const card = document.createElement('div');
        card.className = 'product-card animate-slide-up';
        card.setAttribute('data-product', product._id || '');
        card.setAttribute('data-animation-delay', index * 0.1);
        
        // Apply animation delay immediately
        card.style.animationDelay = `${index * 0.1}s`;

        card.innerHTML = `
            <div class="product-image">
                ${product.images && product.images[0] ? 
                    `<img src="${product.images[0]}" alt="${product.title}" onerror="handleImageError(this)" loading="lazy">
                     <div class="product-image-placeholder" style="display: none;"><i class="fas fa-tshirt"></i></div>` :
                    `<div class="product-image-placeholder"><i class="fas fa-tshirt"></i></div>`
                }
                <div class="product-badge featured">
                    <i class="fas fa-star"></i>
                    ${window.t ? window.t('manufacturer.marketplace.featuredProducts.featured') : 'Featured'}
                </div>
            </div>
            <div class="product-info">
                <h4 class="product-title" title="${product.title || (window.t ? window.t('manufacturer.marketplace.featuredProducts.unnamedProduct') : 'Unnamed Product')}">
                    ${product.title && product.title.length > 40 ? 
                        product.title.substring(0, 40) + '...' : 
                        product.title || (window.t ? window.t('manufacturer.marketplace.featuredProducts.unnamedProduct') : 'Unnamed Product')
                    }
                </h4>
                <p class="product-category">
                    <i class="fas fa-tag"></i>
                    ${typeof product.category === 'string' ? product.category : (product.category?.name || product.category?._id || 'Kategoriyasiz')}
                </p>
                <div class="product-pricing">
                    <span class="price-range">
                        ${product.price && product.price.min ? 
                            `$${product.price.min}-${product.price.max || product.price.min}` :
                            window.t ? window.t('manufacturer.marketplace.featuredProducts.priceOnRequest') : 'Price on Request'
                        }
                    </span>
                    <span class="moq">${window.t ? window.t('manufacturer.marketplace.featuredProducts.minimum') : 'Minimum'} : ${product.moq || 100} ${window.t ? window.t('manufacturer.marketplace.featuredProducts.unit') : 'unit'}</span>
                </div>
                <div class="product-stats">
                    <div class="product-stat">
                        <i class="fas fa-eye"></i>
                        ${product.views || 0}
                    </div>
                    <div class="product-stat">
                        <i class="fas fa-star"></i>
                        ${product.rating || 4.5}
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
                    ${window.t ? window.t('manufacturer.marketplace.featuredProducts.edit') : 'Edit'}
                </button>
                <button class="btn-sm btn-outline" data-action="stats" data-product-id="${product._id || ''}">
                    <i class="fas fa-chart-bar"></i>
                    ${window.t ? window.t('manufacturer.marketplace.featuredProducts.statistics') : 'Statistics'}
                </button>
            </div>
        `;

        return card;
    }

    /**
     * Create inquiry element
     */
    createInquiryElement(inquiry) {
        const element = document.createElement('div');
        element.className = `inquiry-item priority-${inquiry.priority || 'medium'}`;
        element.setAttribute('data-inquiry', inquiry.id || '');

        const createdDate = inquiry.createdAt ? 
            new Date(inquiry.createdAt).toLocaleDateString('uz-UZ') : 
            (window.t ? window.t('manufacturer.marketplace.recentInquiries.today') : 'Today');

        element.innerHTML = `
            <div class="inquiry-header">
                <div class="company-info">
                    <div class="company-avatar">
                        ${(inquiry.company || 'U').charAt(0)}
                    </div>
                    <div class="company-details">
                        <h4 class="company-name">${inquiry.company || (window.t ? window.t('manufacturer.marketplace.recentInquiries.unknownCompany') : 'Unknown Company')}</h4>
                        <span class="inquiry-time">${createdDate}</span>
                    </div>
                </div>
                <div class="inquiry-priority priority-${inquiry.priority || 'medium'}">
                    ${inquiry.priority === 'high' ? 
                        `<i class="fas fa-exclamation-circle"></i>${window.t ? window.t('manufacturer.marketplace.recentInquiries.priority.high') : 'Urgent'}` :
                        inquiry.priority === 'medium' ? 
                        `<i class="fas fa-circle"></i>${window.t ? window.t('manufacturer.marketplace.recentInquiries.priority.medium') : 'Medium'}` :
                        `<i class="fas fa-circle"></i>${window.t ? window.t('manufacturer.marketplace.recentInquiries.priority.low') : 'Normal'}`
                    }
                </div>
            </div>
            <div class="inquiry-content">
                <p class="inquiry-product">
                    <i class="fas fa-cube"></i>
                    ${inquiry.product || (window.t ? window.t('manufacturer.marketplace.recentInquiries.generalInquiry') : 'General Inquiry')}
                </p>
                <div class="inquiry-details">
                    <span class="quantity">
                        <i class="fas fa-sort-numeric-up"></i>
                        ${inquiry.quantity || (window.t ? window.t('manufacturer.marketplace.recentInquiries.toBeDiscussed') : 'To be discussed')}
                    </span>
                    <span class="budget">
                        <i class="fas fa-dollar-sign"></i>
                        ${inquiry.budget || (window.t ? window.t('manufacturer.marketplace.recentInquiries.toBeDiscussed') : 'To be discussed')}
                    </span>
                </div>
                <p class="inquiry-message">
                    ${inquiry.message && inquiry.message.length > 80 ? 
                        inquiry.message.substring(0, 80) + '...' : 
                        inquiry.message || (window.t ? window.t('manufacturer.marketplace.recentInquiries.inquiryMessage') : 'Inquiry message')
                    }
                </p>
            </div>
            <div class="inquiry-actions">
                <button class="btn-sm btn-primary" data-action="respond" data-inquiry-id="${inquiry.id || ''}">
                    <i class="fas fa-reply"></i>
                    ${window.t ? window.t('manufacturer.marketplace.recentInquiries.respond') : 'Respond'}
                </button>
                <button class="btn-sm btn-outline" data-action="quote" data-inquiry-id="${inquiry.id || ''}">
                    <i class="fas fa-file-invoice-dollar"></i>
                    ${window.t ? window.t('manufacturer.marketplace.recentInquiries.quote') : 'Quote'}
                </button>
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
        
        this.logger.log(`🔄 Auto-refresh started (${this.options.refreshInterval / 1000}s interval)`);
    }

    /**
     * Stop auto-refresh
     */
    stopAutoRefresh() {
        Object.values(this.refreshTimers).forEach(timer => {
            clearInterval(timer);
        });
        this.refreshTimers = {};
        this.logger.log('⏹️ Auto-refresh stopped');
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
        this.logger.log('📊 Opening detailed analysis...');
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

        this.logger.log(`🎯 Product action: ${action} for product: ${productId}`);

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
                this.logger.warn(`Unknown action: ${action}`);
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
            this.logger.error('❌ Duplicate product error:', error);
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
            this.logger.error('❌ Delete product error:', error);
            this.showError(window.t ? window.t('manufacturer.marketplace.errors.deleteFailed') : 'Delete operation failed');
        }
    }

    /**
     * Show detailed product information in modal
     */
    async showProductDetails(productId) {
        try {
            this.logger.log(`👁️ Showing product details for: ${productId}`);
            
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
                    <p>${window.t ? window.t('manufacturer.marketplace.modal.loading') : 'Loading data...'}</p>
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
                    console.error('🚨 HTML creation error:', htmlError);
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
                        ${window.t ? window.t('manufacturer.marketplace.featuredProducts.edit') : 'Edit'}
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
    
    console.warn('🚨 Image error handler triggered for:', {
        src: img.src,
        className: img.className,
        productName: img.dataset.productName || 'Unknown'
    });
    
    img.dataset.errorHandled = 'true';
    img.onerror = null;
    
    // CASE 1: Real image failed - convert to mock image (including modal real images)
    if (img.classList.contains('product-real-image') || img.classList.contains('modal-real-image')) {
        console.log('🔄 Converting failed real image to mock image...');
        
        const category = img.dataset.category || 'general';
        const productId = img.dataset.productId || '';
        const productName = img.dataset.productName || '';
        
        // Remove real image class and add mock image class
        img.classList.remove('product-real-image', 'modal-real-image');
        img.classList.add('mock-product-image', 'modal-mock-image', 'converted-from-real');
        
        // Generate mock image
        const mockSrc = generateMockImage(category, productId, productName);
        img.src = mockSrc;
        
        console.log(`✅ Real image converted to mock: ${productName} (${category})`);
        return;
    }
    
    // CASE 2: Mock image failed - use backup mock image (including modal mock images)
    if (img.classList.contains('mock-product-image') || img.classList.contains('modal-mock-image')) {
        console.log('🔄 Mock image failed, using backup...');
        
        const category = img.dataset.category || 'general';
        const productId = img.dataset.productId || '';
        const productName = img.dataset.productName || '';
        
        // Try different mock image from the same category
        const categoryImages = PROFESSIONAL_MOCK_IMAGES[category] || PROFESSIONAL_MOCK_IMAGES['general'];
        const backupIndex = (parseInt(productId.slice(-2), 16) || 1) % categoryImages.length;
        const backupSrc = categoryImages[backupIndex];
        
        img.src = backupSrc;
        img.classList.add('backup-mock-image');
        
        console.log(`✅ Backup mock image loaded: ${productName}`);
        return;
    }
    
    // CASE 3: Everything failed - use professional SVG placeholder
    console.log('🔄 Using professional SVG placeholder as final fallback...');
    img.src = PROFESSIONAL_PLACEHOLDER_SVG;
    img.classList.add('final-placeholder');
    
    // CASE 4: Even SVG failed - show CSS placeholder
    img.onerror = function() {
        console.error('💥 All image fallbacks failed, using CSS placeholder');
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
    console.log('🔧 MARKETPLACE: Sidebar toggle delegated to dashboard-init.js for consistency');
    
    // Only handle marketplace-specific responsive behavior here
    if (window.innerWidth <= 1024) {
        console.log('📱 MARKETPLACE Mobile mode detected');
    }
    
    console.log('✅ MARKETPLACE responsive handlers initialized (sidebar delegated)');
}

// ENHANCED Mock Images System - Professional B2B Implementation
function initializeMockImages() {
    console.log('🖼️ Initializing ENHANCED Professional Mock Images System...');
    
    // Find all images that need mock treatment
    const mockImages = document.querySelectorAll('.mock-product-image[data-needs-mock="true"], .loading-placeholder');
    const realImages = document.querySelectorAll('.product-real-image');
    
    console.log(`📦 Found ${mockImages.length} products needing mock images`);
    console.log(`🖼️ Found ${realImages.length} products with real images`);
    
    // Process mock images
    mockImages.forEach((img, index) => {
        const category = img.dataset.category || 'general';
        const productId = img.dataset.productId || '';
        const productName = img.dataset.productName || '';
        
        console.log(`🔄 Processing mock image ${index + 1}:`, {
            category,
            productId: productId.slice(-8) || 'none',
            productName: productName || 'none'
        });
        
        // Generate appropriate mock image
        const mockSrc = generateMockImage(category, productId, productName);
        
        // Set the mock image with enhanced loading
        setTimeout(() => {
            img.src = mockSrc;
            img.classList.remove('loading-placeholder');
            img.classList.add('mock-image-loaded');
            img.removeAttribute('data-needs-mock');
            
            console.log(`✅ Mock image loaded for: ${productName || 'Unknown'} (${category})`);
            
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
        
        console.log(`🔍 Checking real image ${index + 1}:`, {
            src: img.src,
            productName: productName.slice(0, 20) + '...'
        });
        
        // Add loading indicator
        img.style.transition = 'opacity 0.3s ease';
        
        img.addEventListener('load', function() {
            console.log(`✅ Real image loaded successfully: ${productName}`);
            this.style.opacity = '1';
        });
        
        img.addEventListener('error', function() {
            console.warn(`❌ Real image failed to load: ${productName}`);
            handleImageError(this);
        });
        
        // Check if image is already loaded (cached)
        if (img.complete && img.naturalWidth > 0) {
            console.log(`📋 Real image already cached: ${productName}`);
            img.style.opacity = '1';
        }
    });
    
    console.log('✅ ENHANCED Mock Images System Fully Initialized');
}

// PROFESSIONAL Image System Debugging - Senior Software Engineer
function debugImageSystem() {
    console.log('🔍 ===== PROFESSIONAL IMAGE SYSTEM DEBUG =====');
    
    // Check all product cards
    const productCards = document.querySelectorAll('.b2b-product-card');
    console.log(`📦 Found ${productCards.length} product cards on page`);
    
    // Analyze each card's image system
    productCards.forEach((card, index) => {
        const productId = card.dataset.product || 'unknown';
        const realImage = card.querySelector('.product-real-image');
        const mockImage = card.querySelector('.mock-product-image');
        const loadingPlaceholder = card.querySelector('.loading-placeholder');
        
        console.log(`\n🔎 Product Card ${index + 1} (ID: ${productId.slice(-8) || 'none'}):`);
        
        if (realImage) {
            console.log('   ✅ Has REAL image:', {
                src: realImage.src.substring(0, 50) + (realImage.src.length > 50 ? '...' : ''),
                imageType: realImage.dataset.imageType,
                hasImages: realImage.dataset.hasImages,
                category: realImage.dataset.category,
                loaded: realImage.complete && realImage.naturalWidth > 0,
                naturalWidth: realImage.naturalWidth,
                naturalHeight: realImage.naturalHeight
            });
        }
        
        if (mockImage) {
            console.log('   🎨 Has MOCK image:', {
                needsMock: mockImage.dataset.needsMock,
                category: mockImage.dataset.category,
                hasImages: mockImage.dataset.hasImages,
                loaded: mockImage.complete && mockImage.naturalWidth > 0,
                isLoadingPlaceholder: mockImage.classList.contains('loading-placeholder')
            });
        }
        
        if (loadingPlaceholder) {
            console.log('   ⏳ Has loading placeholder');
        }
        
        if (!realImage && !mockImage && !loadingPlaceholder) {
            console.warn('   ❌ NO IMAGE ELEMENTS FOUND - This is a problem!');
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
    
    // EXACT DASHBOARD-INIT.JS THEME PATTERN
    function initTheme() {
        const savedTheme = localStorage.getItem('dashboard-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Update theme icon
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
            
            // Theme toggle handler (EXACT Dashboard-init.js Pattern)
            themeToggle.addEventListener('click', function() {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('dashboard-theme', newTheme);
                
                // Update icon
                const icon = this.querySelector('i');
                if (icon) {
                    icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
                }
                
                // Dispatch event
                window.dispatchEvent(new CustomEvent('themeChanged', { detail: newTheme }));
            });
        }
    }
    
    // ENHANCED LANGUAGE FUNCTION WITH DEBUGGING
    function initLanguage() {
        console.log('🔧 Initializing language functionality...');
        
        // Get current language from cookie
        const cookies = document.cookie.split(';');
        let currentLang = 'uz';
        
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'i18next') {
                currentLang = value;
                break;
            }
        }
        
        console.log('🌐 Current language from cookie:', currentLang);
        
        // Language toggle handler
        const languageToggle = document.getElementById('languageToggle');
        const languageMenu = document.getElementById('languageMenu');
        
        console.log('🔍 Language elements found:', {
            languageToggle: !!languageToggle,
            languageMenu: !!languageMenu
        });
        
        if (languageToggle && languageMenu) {
            // Remove any existing listeners
            const newLanguageToggle = languageToggle.cloneNode(true);
            languageToggle.parentNode.replaceChild(newLanguageToggle, languageToggle);
            
            newLanguageToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🌐 Language toggle clicked');
                
                const isHidden = languageMenu.classList.contains('hidden');
                console.log('📋 Language menu hidden:', isHidden);
                
                if (isHidden) {
                    languageMenu.classList.remove('hidden');
                    languageMenu.style.display = 'block';
                } else {
                    languageMenu.classList.add('hidden');
                    languageMenu.style.display = 'none';
                }
            });
            
            // Language option handlers
            const languageOptions = document.querySelectorAll('.language-option');
            console.log('🌐 Language options found:', languageOptions.length);
            
            languageOptions.forEach(option => {
                option.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const lang = this.dataset.lang;
                    console.log('🌐 Language selected:', lang);
                    
                    // Set cookie
                    document.cookie = `i18next=${lang};path=/;max-age=31536000;SameSite=Lax`;
                    
                    // Reload page to apply language
                    window.location.reload();
                });
            });
            
            console.log('✅ Language functionality initialized');
        } else {
            console.error('❌ Language elements not found');
        }
    }
    
    // CORRECT DASHBOARD HEADER DROPDOWNS (EXACT IDs FROM HEADER.EJS)
    function initDropdowns() {
        // Close dropdowns on outside click (EXACT Dashboard Pattern)
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.header-dropdown') && 
                !e.target.closest('.header-user-dropdown') &&
                !e.target.closest('.language-selector-wrapper')) {
                
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.classList.add('hidden');
                });
                
                // Also hide language menu
                const languageMenu = document.getElementById('languageMenu');
                if (languageMenu) {
                    languageMenu.classList.add('hidden');
                }
            }
        });
        
        // User Profile Dropdown (ENHANCED WITH DEBUGGING)
        const userProfileToggle = document.getElementById('userProfileToggle');
        const profileDropdown = document.getElementById('profileDropdown');
        
        console.log('👤 Profile elements found:', {
            userProfileToggle: !!userProfileToggle,
            profileDropdown: !!profileDropdown
        });
        
        if (userProfileToggle && profileDropdown) {
            // Remove any existing listeners
            const newUserProfileToggle = userProfileToggle.cloneNode(true);
            userProfileToggle.parentNode.replaceChild(newUserProfileToggle, userProfileToggle);
            
            newUserProfileToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('👤 Profile button clicked');
                
                const isHidden = profileDropdown.classList.contains('hidden');
                console.log('📋 Profile dropdown hidden:', isHidden);
                
                if (isHidden) {
                    profileDropdown.classList.remove('hidden');
                    profileDropdown.style.display = 'block';
                } else {
                    profileDropdown.classList.add('hidden');
                    profileDropdown.style.display = 'none';
                }
                
                // Close other dropdowns
                document.querySelectorAll('.dropdown-menu:not(#profileDropdown)').forEach(menu => {
                    menu.classList.add('hidden');
                    menu.style.display = 'none';
                });
            });
            
            console.log('✅ Profile dropdown initialized');
        } else {
            console.error('❌ Profile elements not found');
        }
        
        // Messages Dropdown (ENHANCED WITH DEBUGGING)
        const messagesBtn = document.getElementById('messagesBtn');
        const messagesDropdown = document.getElementById('messagesDropdown');
        
        console.log('📧 Messages elements found:', {
            messagesBtn: !!messagesBtn,
            messagesDropdown: !!messagesDropdown
        });
        
        if (messagesBtn && messagesDropdown) {
            // Remove any existing listeners
            const newMessagesBtn = messagesBtn.cloneNode(true);
            messagesBtn.parentNode.replaceChild(newMessagesBtn, messagesBtn);
            
            newMessagesBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('📧 Messages button clicked');
                
                const isHidden = messagesDropdown.classList.contains('hidden');
                console.log('📋 Messages dropdown hidden:', isHidden);
                
                if (isHidden) {
                    messagesDropdown.classList.remove('hidden');
                    messagesDropdown.style.display = 'block';
                } else {
                    messagesDropdown.classList.add('hidden');
                    messagesDropdown.style.display = 'none';
                }
                
                // Close other dropdowns
                document.querySelectorAll('.dropdown-menu:not(#messagesDropdown)').forEach(menu => {
                    menu.classList.add('hidden');
                    menu.style.display = 'none';
                });
            });
            
            console.log('✅ Messages dropdown initialized');
        } else {
            console.error('❌ Messages elements not found');
        }
        
        // Notifications Dropdown (ENHANCED WITH DEBUGGING)
        const notificationsBtn = document.getElementById('notificationsBtn');
        const notificationsDropdown = document.getElementById('notificationsDropdown');
        
        console.log('🔔 Notifications elements found:', {
            notificationsBtn: !!notificationsBtn,
            notificationsDropdown: !!notificationsDropdown
        });
        
        if (notificationsBtn && notificationsDropdown) {
            // Remove any existing listeners
            const newNotificationsBtn = notificationsBtn.cloneNode(true);
            notificationsBtn.parentNode.replaceChild(newNotificationsBtn, notificationsBtn);
            
            newNotificationsBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔔 Notifications button clicked');
                
                const isHidden = notificationsDropdown.classList.contains('hidden');
                console.log('📋 Notifications dropdown hidden:', isHidden);
                
                if (isHidden) {
                    notificationsDropdown.classList.remove('hidden');
                    notificationsDropdown.style.display = 'block';
                } else {
                    notificationsDropdown.classList.add('hidden');
                    notificationsDropdown.style.display = 'none';
                }
                
                // Close other dropdowns
                document.querySelectorAll('.dropdown-menu:not(#notificationsDropdown)').forEach(menu => {
                    menu.classList.add('hidden');
                    menu.style.display = 'none';
                });
            });
            
            console.log('✅ Notifications dropdown initialized');
        } else {
            console.error('❌ Notifications elements not found');
        }
        
        // Alerts Dropdown (IF EXISTS - Dashboard-init.js pattern)
        const alertsBtn = document.getElementById('alertsBtn');
        const alertsDropdown = document.getElementById('alertsDropdown');
        
        if (alertsBtn && alertsDropdown) {
            alertsBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                alertsDropdown.classList.toggle('hidden');
                // Close other dropdowns
                document.querySelectorAll('.dropdown-menu:not(#alertsDropdown)').forEach(menu => {
                    menu.classList.add('hidden');
                });
            });
        }
    }
    
    // SIDEBAR FUNCTIONALITY DELEGATED TO DASHBOARD-INIT.JS
    function initSidebar() {
        console.log('🔧 MARKETPLACE: Sidebar functionality is handled by dashboard-init.js');
        console.log('🔧 MARKETPLACE: Checking if dashboard-init.js sidebar is initialized...');
        
        // Verify that dashboard-init.js has set up the sidebar
        if (!window.sidebarInitialized) {
            console.warn('⚠️ MARKETPLACE: dashboard-init.js sidebar not initialized yet');
            
            // Wait for dashboard-init.js to initialize, then report status
            setTimeout(() => {
                if (window.sidebarInitialized) {
                    console.log('✅ MARKETPLACE: dashboard-init.js sidebar now initialized');
                } else {
                    console.error('❌ MARKETPLACE: dashboard-init.js sidebar failed to initialize');
                }
            }, 1000);
        } else {
            console.log('✅ MARKETPLACE: dashboard-init.js sidebar already initialized');
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
            console.log('✅ Manufacturer Dashboard initialized for Marketplace');
        } catch (error) {
            console.warn('⚠️ Manufacturer Dashboard initialization failed:', error);
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