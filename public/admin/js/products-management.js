/**
 * Professional Products Management JavaScript
 * Senior Software Engineer level implementation with real database integration
 * Based on Users Management architecture with product-specific enhancements
 */

class ProductsManagement {
    constructor() {
        // State management
        this.currentTab = 'all';
        this.currentStatus = '';
        this.selectedProducts = new Set();
        this.currentPage = 1;
        this.pageSize = 25;
        this.totalProducts = 0;
        this.totalPages = 0;
        this.isLoading = false;
        
        // Filter state
        this.currentFilters = {};
        this.pendingFilters = {
            search: '',
            category: '',
            country: '',
            priceRange: '',
            stockStatus: '',
            dateRange: '',
            isPromoted: '',
            isFeatured: '',
            visibility: ''
        };
        this.activeFilters = {
            search: '',
            category: '',
            country: '',
            priceRange: '',
            stockStatus: '',
            dateRange: '',
            isPromoted: '',
            isFeatured: '',
            visibility: ''
        };
        
        // Auto-refresh
        this.autoRefreshInterval = null;
        
        // API endpoints
        this.endpoints = {
            products: '/admin/api/products',
            productAction: '/admin/api/products/action',
            bulkAction: '/admin/api/products/bulk',
            statistics: '/admin/api/products/statistics',
            export: '/admin/api/products/export'
        };
        
        // UI state
        this.isMobile = window.innerWidth <= 768;
        this.isTablet = window.innerWidth <= 1024;
    }

    /**
     * Initialize the Products Management System
     */
    init() {
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.loadProducts(false);
        this.updateTabCounts();
        this.setupAutoRefresh();
        this.setupResponsiveHandlers();
        
        // Restore state from URL parameters
        this.restoreState();
        
        console.log('🚀 Products Management System initialized successfully');
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(tab);
            });
        });

        // Search functionality - NO AUTO-SEARCH
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            // Only update pending filters, don't trigger search
            searchInput.addEventListener('input', (e) => {
                this.pendingFilters.search = e.target.value.trim();
            });
            
            // Search on Enter key
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch();
                }
            });
        }

        // Filter inputs - NO AUTO-FILTER
        const filterInputs = [
            'categoryFilter',
            'countryFilter', 
            'priceRangeFilter',
            'stockStatusFilter',
            'dateRangeFilter'
        ];

        filterInputs.forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element) {
                // Only update pending filters, don't trigger search
                element.addEventListener('change', (e) => {
                    const filterKey = filterId.replace('Filter', '').replace('priceRange', 'priceRange')
                        .replace('stockStatus', 'stockStatus').replace('dateRange', 'dateRange');
                    this.pendingFilters[filterKey] = e.target.value;
                });
            }
        });

        // Manual search trigger
        const applyFiltersBtn = document.querySelector('.filter-actions .btn-primary');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.performSearch();
            });
        }

        // Clear filters
        const clearFiltersBtn = document.querySelector('.filter-actions .btn-outline-secondary');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.clearAllFilters();
            });
        }

        // Select all checkbox
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }

        // Close action menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.actions-dropdown')) {
                this.closeAllActionMenus();
            }
        });

        // Window resize handler
        window.addEventListener('resize', this.debounce(() => {
            this.handleResponsiveLayout();
        }, 250));

        // Browser back/forward navigation
        window.addEventListener('popstate', (e) => {
            this.restoreState();
        });

        // Visibility change handler for auto-refresh
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.loadProducts(true);
            }
        });
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + R: Refresh data
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.refreshData();
            }
            
            // Ctrl/Cmd + F: Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }
            
            // Escape: Clear selection and close menus
            if (e.key === 'Escape') {
                this.clearSelection();
                this.closeAllActionMenus();
            }
            
            // Ctrl/Cmd + A: Select all visible (when not in input field)
            if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.selectAllVisible();
            }
        });
    }

    /**
     * Setup auto-refresh functionality
     */
    setupAutoRefresh() {
        // Auto-refresh every 5 minutes
        this.autoRefreshInterval = setInterval(() => {
            if (!document.hidden && !this.isLoading) {
                this.loadProducts(true);
                this.updateTabCounts();
            }
        }, 5 * 60 * 1000);
    }

    /**
     * Setup responsive handlers
     */
    setupResponsiveHandlers() {
        this.handleResponsiveLayout();
    }

    /**
     * Handle responsive layout changes
     */
    handleResponsiveLayout() {
        const wasResponsive = this.isMobile;
        this.isMobile = window.innerWidth <= 768;
        this.isTablet = window.innerWidth <= 1024;
        
        if (wasResponsive !== this.isMobile) {
            // Layout changed, adjust table if needed
            this.adjustTableForResponsive();
        }
    }

    /**
     * Adjust table for responsive layout
     */
    adjustTableForResponsive() {
        const tableContainer = document.getElementById('tableContainer');
        if (tableContainer) {
            if (this.isMobile) {
                tableContainer.style.fontSize = '0.75rem';
            } else if (this.isTablet) {
                tableContainer.style.fontSize = '0.875rem';
            } else {
                tableContainer.style.fontSize = '1rem';
            }
        }
    }

    /**
     * Switch to a different tab
     */
    switchTab(tabElement) {
        // Update UI
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.classList.remove('active');
        });
        tabElement.classList.add('active');
        
        // Update state
        this.currentTab = tabElement.dataset.tab;
        this.currentStatus = tabElement.dataset.status || '';
        this.currentPage = 1;
        
        // Clear selection
        this.clearSelection();
        
        // Update browser state
        this.updateBrowserState();
        
        // Load products for this tab
        this.loadProducts();
        
        // Track analytics
        this.trackEvent('tab_switch', { tab: this.currentTab });
    }

    /**
     * Perform search with current pending filters
     */
    performSearch() {
        // Apply pending filters to active filters
        this.activeFilters = { ...this.pendingFilters };
        
        // Reset to first page
        this.currentPage = 1;
        
        // Load products with new filters
        this.loadProducts();
        
        // Update browser state
        this.updateBrowserState();
        
        // Track search event
        this.trackEvent('search_performed', { 
            filters: this.activeFilters,
            tab: this.currentTab 
        });
        
        console.log('🔍 Search performed with filters:', this.activeFilters);
    }

    /**
     * Load products with current state
     */
    async loadProducts(silent = false) {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            
            if (!silent) {
                this.showTableLoading();
            }
            
            const queryParams = this.buildQueryParams();
            const fullUrl = `${this.endpoints.products}?${queryParams}`;
            console.log('🔍 Fetching products from:', fullUrl);
            
            const response = await this.fetchWithRetry(fullUrl);
            
            if (!response.ok) {
                console.error('❌ HTTP Error:', response.status, response.statusText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const response_data = await response.json();
            console.log('📊 API Response received:', response_data);
            
            // Handle wrapped response structure
            const data = response_data.success ? response_data.data : response_data;
            
            // Validate response structure
            if (!data || !data.pagination || !data.products) {
                console.error('❌ Invalid response structure:', { data, response_data });
                throw new Error('Invalid API response structure');
            }
            
            // Update state with fallbacks
            this.totalProducts = data.pagination.total || data.pagination.totalCount || 0;
            this.totalPages = data.pagination.totalPages || Math.ceil(this.totalProducts / (data.pagination.limit || 20));
            this.currentPage = data.pagination.currentPage || 1;
            
            // Render products
            this.renderProducts(data.products);
            
            // Update UI components
            this.updatePagination(data.pagination);
            this.updateStats(data.statistics);
            this.updateResultsCount(data.pagination.total);
            this.updateTabCounts(data.statistics);
            
            if (!silent) {
                this.showSuccess(`Loaded ${data.products.length} products successfully`);
            }
            
        } catch (error) {
            console.error('❌ Error loading products:', error);
            this.showError('Failed to load products. Please try again.');
            this.renderEmptyState('error');
        } finally {
            this.isLoading = false;
            this.hideTableLoading();
        }
    }

    /**
     * Build query parameters for API request
     */
    buildQueryParams() {
        const params = new URLSearchParams();
        
        // Pagination
        params.set('page', this.currentPage.toString());
        params.set('pageSize', this.pageSize.toString());
        
        // Tab/Status filter
        if (this.currentStatus) {
            params.set('status', this.currentStatus);
        }
        
        // Active filters (only applied after search)
        Object.entries(this.activeFilters).forEach(([key, value]) => {
            if (value && value.trim() !== '') {
                params.set(key, value.trim());
            }
        });
        
        return params.toString();
    }

    /**
     * Clear all filters
     */
    clearAllFilters() {
        // Clear both pending and active filters
        this.pendingFilters = {
            search: '',
            category: '',
            country: '',
            priceRange: '',
            stockStatus: '',
            dateRange: '',
            isPromoted: '',
            isFeatured: '',
            visibility: ''
        };
        
        this.activeFilters = {
            search: '',
            category: '',
            country: '',
            priceRange: '',
            stockStatus: '',
            dateRange: '',
            isPromoted: '',
            isFeatured: '',
            visibility: ''
        };
        
        // Clear form inputs
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        
        const filterSelects = [
            'categoryFilter',
            'countryFilter',
            'priceRangeFilter', 
            'stockStatusFilter',
            'dateRangeFilter'
        ];
        
        filterSelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) select.value = '';
        });
        
        // Reset to first page
        this.currentPage = 1;
        
        // Reload products
        this.loadProducts();
        
        // Update browser state
        this.updateBrowserState();
        
        // Show feedback
        this.showSuccess('All filters cleared');
        
        // Track event
        this.trackEvent('filters_cleared', { tab: this.currentTab });
        
        console.log('🧹 All filters cleared');
    }

    /**
     * Apply filters (called by search button)
     */
    applyFilters() {
        this.performSearch();
    }

    /**
     * Refresh data
     */
    refreshData() {
        this.loadProducts();
        this.updateTabCounts();
        this.showSuccess('Data refreshed');
    }

    /**
     * Render products in the table
     */
    renderProducts(products) {
        const tableBody = document.getElementById('productsTableBody');
        if (!tableBody) return;
        
        if (!products || products.length === 0) {
            this.renderEmptyState();
            return;
        }
        
        tableBody.innerHTML = products.map(product => this.renderProductRow(product)).join('');
        
        // Apply fade-in animation
        tableBody.classList.add('fade-in');
        
        // Update bulk actions state
        this.updateBulkActions();
        
        // Setup row event listeners
        this.setupRowEventListeners();
    }

    /**
     * Render a single product row
     */
    renderProductRow(product) {
        const isSelected = this.selectedProducts.has(product._id);
        
        return `
            <tr class="${isSelected ? 'selected' : ''}" data-product-id="${product._id}">
                <td>
                    <input type="checkbox" 
                           class="product-checkbox" 
                           value="${product._id}"
                           ${isSelected ? 'checked' : ''}
                           onchange="productsManagement.toggleProductSelection('${product._id}', this.checked)">
                </td>
                <td>
                    <div class="product-info">
                        ${this.renderProductImage(product)}
                        <div class="product-details">
                            <h4 class="product-name">${this.escapeHtml(product.name || 'N/A')}</h4>
                            <p class="product-description">${this.escapeHtml(product.shortDescription || product.description || 'No description available')}</p>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="manufacturer-info">
                        <div class="manufacturer-name">${this.escapeHtml(product.manufacturerInfo?.companyName || 'N/A')}</div>
                        <div class="manufacturer-country">
                            ${this.renderCountryFlag(product.manufacturerInfo?.country)}
                            <span>${this.escapeHtml(product.manufacturerInfo?.country || 'N/A')}</span>
                        </div>
                        <div class="trust-score">
                            <div class="trust-indicator ${this.getTrustLevel(product.manufacturerInfo?.trustScore || 0)}"></div>
                            ${product.manufacturerInfo?.trustScore || 0}%
                        </div>
                    </div>
                </td>
                <td>
                    ${this.renderCategoryBadge(product.category || 'other')}
                </td>
                <td>
                    <div class="price-stock-info">
                        <div class="price-value">
                            $${this.formatPrice(product.pricing?.basePrice || 0)}
                            <span class="price-currency">${product.pricing?.currency || 'USD'}</span>
                        </div>
                        <div class="stock-info">
                            <div class="stock-level ${this.getStockStatus(product)}">
                                ${this.getStockStatusText(product)}
                            </div>
                            <div class="stock-quantity">
                                ${product.inventory?.availableStock || 0} ${product.inventory?.unit || 'pcs'}
                            </div>
                        </div>
                    </div>
                </td>
                <td>
                    ${this.renderStatusBadge(product.status)}
                </td>
                <td>
                    <div class="performance-score">
                        <div class="performance-indicator ${product.businessMetrics?.performanceLevel || 'low'}"></div>
                        ${this.formatPerformanceScore(product.businessMetrics?.profitabilityScore || 0)}
                    </div>
                </td>
                <td>
                    <div class="featured-badge ${product.isFeatured ? 'active' : ''}" 
                         onclick="productsManagement.toggleFeatured('${product._id}', ${!product.isFeatured})">
                        <i class="las la-star"></i>
                    </div>
                </td>
                <td>
                    <small>${this.formatDate(product.createdAt)}</small>
                </td>
                <td>
                    ${this.renderProductActions(product)}
                </td>
            </tr>
        `;
    }

    /**
     * Render product image
     */
    renderProductImage(product) {
        const imageUrl = product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url;
        const productName = product.name || 'Unknown Product';
        const initials = this.getInitials(productName);
        
        return `
            <div class="product-image-container">
                ${imageUrl ? 
                    `<img src="${imageUrl}" alt="${this.escapeHtml(productName)}" class="product-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                     <div class="product-image-placeholder" style="display: none;">${initials}</div>` :
                    `<div class="product-image-placeholder">${initials}</div>`
                }
            </div>
        `;
    }

    /**
     * Render status badge
     */
    renderStatusBadge(status) {
        const statusConfig = {
            active: { icon: 'check-circle', label: 'Active' },
            draft: { icon: 'edit', label: 'Draft' },
            inactive: { icon: 'pause', label: 'Inactive' },
            discontinued: { icon: 'times-circle', label: 'Discontinued' },
            out_of_stock: { icon: 'exclamation-triangle', label: 'Out of Stock' }
        };
        
        const config = statusConfig[status] || { icon: 'question', label: status };
        
        return `
            <div class="status-badge ${status}">
                <div class="status-icon"></div>
                ${config.label}
            </div>
        `;
    }

    /**
     * Render category badge
     */
    renderCategoryBadge(category) {
        const categoryLabels = {
            food_beverages: 'Food & Beverages',
            textiles_clothing: 'Textiles & Clothing',
            electronics: 'Electronics',
            machinery_equipment: 'Machinery & Equipment',
            chemicals: 'Chemicals',
            agriculture: 'Agriculture',
            construction_materials: 'Construction Materials',
            automotive: 'Automotive',
            pharmaceuticals: 'Pharmaceuticals',
            other: 'Other'
        };
        
        const label = categoryLabels[category] || category;
        
        return `<div class="category-badge ${category}">${this.escapeHtml(label)}</div>`;
    }

    /**
     * Render country flag
     */
    renderCountryFlag(country) {
        if (!country) return '';
        
        const flagMap = {
            'uzbekistan': '🇺🇿',
            'kazakhstan': '🇰🇿', 
            'china': '🇨🇳',
            'tajikistan': '🇹🇯',
            'turkmenistan': '🇹🇲',
            'afghanistan': '🇦🇫',
            'kyrgyzstan': '🇰🇬'
        };
        
        const flag = flagMap[country.toLowerCase()] || '🏳️';
        
        return `<span class="country-flag">${flag}</span>`;
    }

    /**
     * Render product actions dropdown
     */
    renderProductActions(product) {
        return `
            <div class="actions-dropdown">
                <button class="actions-trigger" onclick="productsManagement.toggleActionMenu('${product._id}')">
                    <i class="las la-ellipsis-v"></i>
                </button>
                <div class="actions-menu" id="actions-${product._id}">
                    <button class="action-item" onclick="productsManagement.viewProduct('${product._id}')">
                        <i class="las la-eye"></i>
                        View Details
                    </button>
                    <button class="action-item" onclick="productsManagement.editProduct('${product._id}')">
                        <i class="las la-edit"></i>
                        Edit Product
                    </button>
                    <div class="action-divider"></div>
                    ${this.getProductStatusActions(product)}
                    <div class="action-divider"></div>
                    <button class="action-item ${product.isPromoted ? 'warning' : 'success'}" onclick="productsManagement.togglePromoted('${product._id}', ${!product.isPromoted})">
                        <i class="las la-${product.isPromoted ? 'star-half-alt' : 'star'}"></i>
                        ${product.isPromoted ? 'Remove Promotion' : 'Promote Product'}
                    </button>
                    <button class="action-item danger" onclick="productsManagement.deleteProduct('${product._id}')">
                        <i class="las la-trash"></i>
                        Delete Product
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Get context-sensitive status actions for product
     */
    getProductStatusActions(product) {
        const actions = [];
        
        switch (product.status) {
            case 'draft':
                actions.push(`
                    <button class="action-item success" onclick="productsManagement.activateProduct('${product._id}')">
                        <i class="las la-check"></i>
                        Activate Product
                    </button>
                `);
                break;
                
            case 'active':
                actions.push(`
                    <button class="action-item warning" onclick="productsManagement.deactivateProduct('${product._id}')">
                        <i class="las la-pause"></i>
                        Deactivate Product
                    </button>
                    <button class="action-item danger" onclick="productsManagement.discontinueProduct('${product._id}')">
                        <i class="las la-times-circle"></i>
                        Discontinue Product
                    </button>
                `);
                break;
                
            case 'inactive':
                actions.push(`
                    <button class="action-item success" onclick="productsManagement.activateProduct('${product._id}')">
                        <i class="las la-check"></i>
                        Activate Product
                    </button>
                `);
                break;
                
            case 'discontinued':
                actions.push(`
                    <button class="action-item success" onclick="productsManagement.activateProduct('${product._id}')">
                        <i class="las la-redo"></i>
                        Reactivate Product
                    </button>
                `);
                break;
        }
        
        return actions.join('');
    }

    // Helper methods for product data
    getStockStatus(product) {
        if (!product.inventory) return 'out-of-stock';
        
        const { availableStock, lowStockThreshold } = product.inventory;
        
        if (availableStock === 0) return 'out-of-stock';
        if (availableStock <= (lowStockThreshold || 10)) return 'low-stock';
        return 'in-stock';
    }

    getStockStatusText(product) {
        const status = this.getStockStatus(product);
        const statusTexts = {
            'in-stock': 'In Stock',
            'low-stock': 'Low Stock',
            'out-of-stock': 'Out of Stock'
        };
        return statusTexts[status] || 'Unknown';
    }

    getTrustLevel(score) {
        if (score >= 80) return 'high';
        if (score >= 50) return 'medium';
        return 'low';
    }

    formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(price);
    }

    formatPerformanceScore(score) {
        return Math.round(score).toString();
    }

    // Product action methods
    viewProduct(productId) {
        console.log('👁️ View product:', productId);
        this.showProductDetailsModal(productId);
    }

    editProduct(productId) {
        console.log('✏️ Edit product:', productId);
        this.showProductEditModal(productId);
    }

    async activateProduct(productId) {
        await this.updateProductStatus(productId, 'active');
    }

    async deactivateProduct(productId) {
        await this.updateProductStatus(productId, 'inactive');
    }

    async discontinueProduct(productId) {
        const confirmed = await this.confirmAction(
            'Discontinue Product',
            'Are you sure you want to discontinue this product?',
            'danger'
        );
        
        if (confirmed) {
            await this.updateProductStatus(productId, 'discontinued');
        }
    }

    async deleteProduct(productId) {
        const confirmed = await this.confirmAction(
            'Delete Product',
            'Are you sure you want to delete this product? This action can be undone.',
            'danger'
        );
        
        if (confirmed) {
            await this.performProductAction(productId, 'delete');
        }
    }

    async toggleFeatured(productId, featured) {
        await this.performProductAction(productId, featured ? 'feature' : 'unfeature');
    }

    async togglePromoted(productId, promoted) {
        await this.performProductAction(productId, promoted ? 'promote' : 'unpromote');
    }

    async updateProductStatus(productId, status) {
        try {
            this.showLoading(`Updating product status...`);
            
            const response = await this.fetchWithRetry(`/admin/api/products/${productId}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            this.showSuccess(`Product ${status} successfully`);
            this.loadProducts(true);
            this.updateTabCounts();
            
            // Clear selection if product was selected
            this.selectedProducts.delete(productId);
            this.updateBulkActions();
            
            // Track action
            this.trackEvent('product_status_update', { status, productId });
            
        } catch (error) {
            console.error(`❌ Error updating product status:`, error);
            this.showError(`Failed to update product status. Please try again.`);
        } finally {
            this.hideLoading();
        }
    }

    async performProductAction(productId, action, data = {}) {
        try {
            this.showLoading(`${action.charAt(0).toUpperCase() + action.slice(1)}ing product...`);
            
            const response = await this.fetchWithRetry('/admin/api/products/action', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId,
                    action,
                    ...data
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            this.showSuccess(`Product ${action}ed successfully`);
            this.loadProducts(true);
            this.updateTabCounts();
            
            // Clear selection if product was selected
            this.selectedProducts.delete(productId);
            this.updateBulkActions();
            
            // Track action
            this.trackEvent('product_action', { action, productId });
            
        } catch (error) {
            console.error(`❌ Error ${action}ing product:`, error);
            this.showError(`Failed to ${action} product. Please try again.`);
        } finally {
            this.hideLoading();
        }
    }

    // Bulk operations
    async bulkActivateProducts() {
        if (this.selectedProducts.size === 0) return;
        
        const confirmed = await this.confirmAction(
            'Bulk Activate',
            `Are you sure you want to activate ${this.selectedProducts.size} selected products?`,
            'success'
        );
        
        if (confirmed) {
            await this.performBulkAction('activate');
        }
    }

    async bulkPromoteProducts() {
        if (this.selectedProducts.size === 0) return;
        
        const confirmed = await this.confirmAction(
            'Bulk Promote',
            `Are you sure you want to promote ${this.selectedProducts.size} selected products?`,
            'warning'
        );
        
        if (confirmed) {
            await this.performBulkAction('promote');
        }
    }

    async bulkDeleteProducts() {
        if (this.selectedProducts.size === 0) return;
        
        const confirmed = await this.confirmAction(
            'Bulk Delete',
            `Are you sure you want to delete ${this.selectedProducts.size} selected products? This action can be undone.`,
            'danger'
        );
        
        if (confirmed) {
            await this.performBulkAction('delete');
        }
    }

    async bulkExportProducts() {
        if (this.selectedProducts.size === 0) return;
        
        try {
            this.showLoading('Preparing export...');
            
            const productIds = Array.from(this.selectedProducts);
            const response = await this.fetchWithRetry(this.endpoints.export, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productIds })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const filename = `products_export_${new Date().toISOString().split('T')[0]}.xlsx`;
            
            this.downloadFile(url, filename);
            this.showSuccess(`${productIds.length} products exported successfully`);
            
            // Track export
            this.trackEvent('bulk_export', { count: productIds.length });
            
        } catch (error) {
            console.error('❌ Error exporting products:', error);
            this.showError('Failed to export products. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async performBulkAction(action, data = {}) {
        if (this.selectedProducts.size === 0) return;
        
        try {
            this.showLoading(`${action.charAt(0).toUpperCase() + action.slice(1)}ing ${this.selectedProducts.size} products...`);
            
            const productIds = Array.from(this.selectedProducts);
            const response = await this.fetchWithRetry(this.endpoints.bulkAction, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productIds,
                    action,
                    ...data
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            this.showSuccess(`${productIds.length} products ${action}ed successfully`);
            this.loadProducts(true);
            this.updateTabCounts();
            this.clearSelection();
            
            // Track bulk action
            this.trackEvent('bulk_action', { action, count: productIds.length });
            
        } catch (error) {
            console.error(`❌ Error performing bulk ${action}:`, error);
            this.showError(`Failed to ${action} products. Please try again.`);
        } finally {
            this.hideLoading();
        }
    }

    // Export functionality
    async exportProducts() {
        try {
            this.showLoading('Preparing export...');
            
            const queryParams = this.buildQueryParams();
            const response = await this.fetchWithRetry(`${this.endpoints.export}?${queryParams}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const filename = `products_export_${this.currentTab}_${new Date().toISOString().split('T')[0]}.xlsx`;
            
            this.downloadFile(url, filename);
            this.showSuccess('Products exported successfully');
            
            // Track export
            this.trackEvent('export_products', { tab: this.currentTab, filters: this.activeFilters });
            
        } catch (error) {
            console.error('❌ Error exporting products:', error);
            this.showError('Failed to export products. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    // Utility methods - reuse from Users Management with product-specific modifications
    getInitials(name) {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'P';
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays <= 7) return `${diffDays - 1} days ago`;
        
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Reuse utility methods from Users Management
    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.product-checkbox');
        const productIds = Array.from(checkboxes).map(cb => cb.value);
        
        if (checked) {
            productIds.forEach(productId => this.selectedProducts.add(productId));
        } else {
            productIds.forEach(productId => this.selectedProducts.delete(productId));
        }
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            const row = checkbox.closest('tr');
            if (row) {
                row.classList.toggle('selected', checked);
            }
        });
        
        this.updateBulkActions();
    }

    toggleProductSelection(productId, selected) {
        if (selected) {
            this.selectedProducts.add(productId);
        } else {
            this.selectedProducts.delete(productId);
        }
        
        const row = document.querySelector(`tr[data-product-id="${productId}"]`);
        if (row) {
            row.classList.toggle('selected', selected);
        }
        
        this.updateBulkActions();
        this.updateSelectAllState();
    }

    updateBulkActions() {
        const bulkActions = document.getElementById('bulkActions');
        const selectedCount = document.getElementById('selectedCount');
        
        if (this.selectedProducts.size > 0) {
            bulkActions?.classList.remove('hidden');
            if (selectedCount) {
                selectedCount.textContent = `${this.selectedProducts.size} selected`;
            }
        } else {
            bulkActions?.classList.add('hidden');
        }
    }

    updateSelectAllState() {
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        const visibleCheckboxes = document.querySelectorAll('.product-checkbox');
        
        if (!selectAllCheckbox || visibleCheckboxes.length === 0) return;
        
        const checkedCount = Array.from(visibleCheckboxes).filter(cb => cb.checked).length;
        
        if (checkedCount === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (checkedCount === visibleCheckboxes.length) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    }

    clearSelection() {
        this.selectedProducts.clear();
        
        document.querySelectorAll('.product-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        document.querySelectorAll('#productsTableBody tr').forEach(row => {
            row.classList.remove('selected');
        });
        
        this.updateBulkActions();
    }

    selectAllVisible() {
        const checkboxes = document.querySelectorAll('.product-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
            this.selectedProducts.add(checkbox.value);
            const row = checkbox.closest('tr');
            if (row) {
                row.classList.add('selected');
            }
        });
        
        this.updateBulkActions();
    }

    setupRowEventListeners() {
        document.querySelectorAll('#productsTableBody tr').forEach(row => {
            row.addEventListener('dblclick', (e) => {
                if (!e.target.closest('input, button, .actions-dropdown')) {
                    const productId = row.dataset.productId;
                    if (productId) {
                        this.viewProduct(productId);
                    }
                }
            });
        });
    }

    renderEmptyState(type = 'empty') {
        const tableBody = document.getElementById('productsTableBody');
        if (!tableBody) return;
        
        const messages = {
            empty: {
                icon: 'las la-boxes',
                title: 'No products found',
                description: 'No products match your current filters. Try adjusting your search criteria.'
            },
            error: {
                icon: 'las la-exclamation-triangle',
                title: 'Error loading products',
                description: 'There was a problem loading products. Please try again.'
            }
        };
        
        const message = messages[type] || messages.empty;
        
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-5">
                    <div class="empty-state">
                        <i class="${message.icon} empty-icon"></i>
                        <h3 class="empty-title">${message.title}</h3>
                        <p class="empty-description">${message.description}</p>
                        ${type === 'error' ? 
                            '<button class="btn btn-primary" onclick="productsManagement.loadProducts()">Try Again</button>' : 
                            '<button class="btn btn-outline-primary" onclick="productsManagement.clearAllFilters()">Clear Filters</button>'
                        }
                    </div>
                </td>
            </tr>
        `;
    }

    // Reuse pagination, stats, and utility methods from Users Management
    updatePagination(pagination) {
        this.updateElement('paginationStart', ((pagination.currentPage - 1) * pagination.limit + 1).toString());
        this.updateElement('paginationEnd', Math.min(pagination.currentPage * pagination.limit, pagination.total).toString());
        this.updateElement('paginationTotal', pagination.total.toString());
        
        const paginationControls = document.getElementById('paginationControls');
        if (paginationControls) {
            paginationControls.innerHTML = this.generatePaginationHTML(pagination);
        }
    }

    generatePaginationHTML(pagination) {
        const { currentPage, totalPages } = pagination;
        let html = '';
        
        // Previous button
        html += `
            <button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" 
                    onclick="productsManagement.goToPage(${currentPage - 1})"
                    ${currentPage === 1 ? 'disabled' : ''}>
                <i class="las la-chevron-left"></i>
                <span class="d-none d-md-inline">Previous</span>
            </button>
        `;
        
        // Page numbers (mobile-friendly)
        if (this.isMobile) {
            html += `
                <span class="page-btn active">
                    ${currentPage} / ${totalPages}
                </span>
            `;
        } else {
            const maxVisiblePages = this.isTablet ? 5 : 7;
            const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            if (startPage > 1) {
                html += `<button class="page-btn" onclick="productsManagement.goToPage(1)">1</button>`;
                if (startPage > 2) {
                    html += `<span class="page-btn disabled">...</span>`;
                }
            }
            
            for (let i = startPage; i <= endPage; i++) {
                html += `
                    <button class="page-btn ${i === currentPage ? 'active' : ''}" 
                            onclick="productsManagement.goToPage(${i})">
                        ${i}
                    </button>
                `;
            }
            
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    html += `<span class="page-btn disabled">...</span>`;
                }
                html += `<button class="page-btn" onclick="productsManagement.goToPage(${totalPages})">${totalPages}</button>`;
            }
        }
        
        // Next button
        html += `
            <button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                    onclick="productsManagement.goToPage(${currentPage + 1})"
                    ${currentPage === totalPages ? 'disabled' : ''}>
                <span class="d-none d-md-inline">Next</span>
                <i class="las la-chevron-right"></i>
            </button>
        `;
        
        return html;
    }

    updateStats(statistics) {
        if (!statistics) return;
        
        this.updateElement('totalProductsCount', statistics.total?.toString() || '0');
        this.updateElement('activeProductsCount', statistics.statuses?.find(s => s.label === 'active')?.count?.toString() || '0');
        this.updateElement('lowStockCount', statistics.stockMetrics?.lowStock?.toString() || '0');
        this.updateElement('featuredProductsCount', statistics.performance?.featuredProducts?.toString() || '0');
    }

    updateTabCounts(statistics) {
        if (!statistics) return;
        
        this.updateElement('allProductsTab', statistics.total?.toString() || '0');
        
        const statusCounts = {
            active: statistics.statuses?.find(s => s.label === 'active')?.count || 0,
            draft: statistics.statuses?.find(s => s.label === 'draft')?.count || 0,
            inactive: statistics.statuses?.find(s => s.label === 'inactive')?.count || 0,
            out_of_stock: statistics.statuses?.find(s => s.label === 'out_of_stock')?.count || 0
        };
        
        this.updateElement('activeProductsTab', statusCounts.active.toString());
        this.updateElement('draftProductsTab', statusCounts.draft.toString());
        this.updateElement('inactiveProductsTab', statusCounts.inactive.toString());
        this.updateElement('outOfStockProductsTab', statusCounts.out_of_stock.toString());
    }

    updateResultsCount(count) {
        this.updateElement('tableResultsCount', `(${count} results)`);
    }

    goToPage(page) {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        
        this.currentPage = page;
        this.updateBrowserState();
        this.loadProducts();
        
        const tableContainer = document.getElementById('tableContainer');
        if (tableContainer) {
            tableContainer.scrollTop = 0;
        }
    }

    showTableLoading() {
        const tableBody = document.getElementById('productsTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center py-4">
                        <div class="loading-state">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="mt-2 mb-0 text-muted">Loading products...</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    hideTableLoading() {
        // Loading state is replaced by actual content or empty state
    }

    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        const text = document.getElementById('loadingText');
        
        if (overlay) {
            overlay.classList.remove('d-none');
            if (text) text.textContent = message;
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('d-none');
        }
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        // Reuse toast implementation from Users Management
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 300px;
            `;
            document.body.appendChild(toastContainer);
        }
        
        const toast = document.createElement('div');
        const toastId = `toast_${Date.now()}`;
        toast.id = toastId;
        
        const typeColors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6'
        };
        
        const typeIcons = {
            success: 'las la-check-circle',
            error: 'las la-exclamation-circle',
            warning: 'las la-exclamation-triangle',
            info: 'las la-info-circle'
        };
        
        toast.style.cssText = `
            background: white;
            border: 1px solid ${typeColors[type]};
            border-left: 4px solid ${typeColors[type]};
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 10px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            animation: slideInRight 0.3s ease-out;
            display: flex;
            align-items: center;
            gap: 12px;
        `;
        
        toast.innerHTML = `
            <i class="${typeIcons[type]}" style="color: ${typeColors[type]}; font-size: 1.2rem;"></i>
            <span style="flex: 1; color: #374151; font-weight: 500;">${message}</span>
            <button onclick="document.getElementById('${toastId}').remove()" 
                    style="background: none; border: none; color: #9CA3AF; cursor: pointer; font-size: 1.2rem;">
                <i class="las la-times"></i>
            </button>
        `;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            if (document.getElementById(toastId)) {
                toast.style.animation = 'slideOutRight 0.3s ease-in forwards';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
        
        if (!document.getElementById('toastAnimations')) {
            const style = document.createElement('style');
            style.id = 'toastAnimations';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    async confirmAction(title, message, type = 'warning') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10001;
                backdrop-filter: blur(2px);
            `;
            
            const typeColors = {
                warning: '#F59E0B',
                danger: '#EF4444',
                success: '#10B981'
            };
            
            modal.innerHTML = `
                <div style="background: white; border-radius: 12px; padding: 24px; max-width: 400px; width: 90%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(245, 158, 11, 0.1); display: flex; align-items: center; justify-content: center;">
                            <i class="las la-exclamation-triangle" style="color: ${typeColors[type] || typeColors.warning}; font-size: 1.5rem;"></i>
                        </div>
                        <h3 style="margin: 0; color: #374151; font-size: 1.25rem; font-weight: 600;">${title}</h3>
                    </div>
                    <p style="color: #6B7280; margin: 0 0 24px 0; line-height: 1.5;">${message}</p>
                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button id="cancelBtn" style="padding: 8px 16px; border: 1px solid #D1D5DB; background: white; color: #374151; border-radius: 6px; cursor: pointer; font-weight: 500;">
                            Cancel
                        </button>
                        <button id="confirmBtn" style="padding: 8px 16px; border: none; background: ${typeColors[type] || typeColors.warning}; color: white; border-radius: 6px; cursor: pointer; font-weight: 500;">
                            Confirm
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            modal.querySelector('#cancelBtn').onclick = () => {
                modal.remove();
                resolve(false);
            };
            
            modal.querySelector('#confirmBtn').onclick = () => {
                modal.remove();
                resolve(true);
            };
            
            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.remove();
                    resolve(false);
                }
            };
        });
    }

    downloadFile(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    closeAllActionMenus() {
        document.querySelectorAll('.actions-menu.show').forEach(menu => {
            menu.classList.remove('show');
        });
    }

    toggleActionMenu(productId) {
        const menu = document.getElementById(`actions-${productId}`);
        if (menu) {
            const isVisible = menu.classList.contains('show');
            
            this.closeAllActionMenus();
            
            if (!isVisible) {
                menu.classList.add('show');
            }
        }
    }

    updateBrowserState() {
        const params = new URLSearchParams();
        
        if (this.currentTab !== 'all') {
            params.set('tab', this.currentTab);
        }
        
        if (this.currentPage !== 1) {
            params.set('page', this.currentPage.toString());
        }
        
        Object.entries(this.activeFilters).forEach(([key, value]) => {
            if (value && value.trim() !== '') {
                params.set(key, value.trim());
            }
        });
        
        const url = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        history.replaceState(null, '', url);
    }

    restoreState() {
        const params = new URLSearchParams(window.location.search);
        
        const tab = params.get('tab');
        if (tab) {
            const tabElement = document.querySelector(`[data-tab="${tab}"]`);
            if (tabElement) {
                this.switchTab(tabElement);
            }
        }
        
        const page = parseInt(params.get('page'));
        if (page && page > 0) {
            this.currentPage = page;
        }
        
        Object.keys(this.activeFilters).forEach(key => {
            const value = params.get(key);
            if (value) {
                this.activeFilters[key] = value;
                this.pendingFilters[key] = value;
                
                const inputId = key === 'search' ? 'searchInput' : `${key}Filter`;
                const input = document.getElementById(inputId);
                if (input) {
                    input.value = value;
                }
            }
        });
    }

    trackEvent(event, data = {}) {
        console.log('📊 Analytics:', event, data);
        
        if (typeof gtag !== 'undefined') {
            gtag('event', event, {
                custom_parameter_1: data.tab,
                custom_parameter_2: JSON.stringify(data)
            });
        }
    }

    async fetchWithRetry(url, options = {}, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const token = this.getCookie('accessToken');
                
                const response = await fetch(url, {
                    ...options,
                    credentials: 'include',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Authorization': token ? `Bearer ${token}` : '',
                        ...options.headers
                    }
                });
                
                console.log('🔐 Request made with token:', token ? 'Present' : 'Missing');
                
                if (response.ok || response.status < 500) {
                    return response;
                }
                
                throw new Error(`HTTP ${response.status}`);
            } catch (error) {
                if (i === retries - 1) throw error;
                
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            }
        }
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Modal placeholder methods
    showProductDetailsModal(productId) {
        console.log('TODO: Implement product details modal for product:', productId);
        this.showToast('Product details modal - Coming soon!', 'info');
    }

    showProductEditModal(productId) {
        console.log('TODO: Implement product edit modal for product:', productId);
        this.showToast('Product edit modal - Coming soon!', 'info');
    }

    destroy() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        window.removeEventListener('resize', this.handleResponsiveLayout);
        window.removeEventListener('popstate', this.restoreState);
        document.removeEventListener('visibilitychange', this.loadProducts);
        
        console.log('🧹 Products Management System destroyed');
    }
}

// Global instance and functions
let productsManagement;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    productsManagement = new ProductsManagement();
    productsManagement.init();
});

// Global functions for inline event handlers
window.productsManagement = productsManagement;

// Expose global functions
window.toggleSelectAll = (checked) => productsManagement?.toggleSelectAll(checked);
window.clearAllFilters = () => productsManagement?.clearAllFilters();
window.applyFilters = () => productsManagement?.applyFilters();
window.refreshData = () => productsManagement?.refreshData();
window.exportProducts = () => productsManagement?.exportProducts();
window.bulkActivateProducts = () => productsManagement?.bulkActivateProducts();
window.bulkPromoteProducts = () => productsManagement?.bulkPromoteProducts();
window.bulkDeleteProducts = () => productsManagement?.bulkDeleteProducts();
window.bulkExportProducts = () => productsManagement?.bulkExportProducts();
window.openCreateProductModal = () => {
    console.log('TODO: Implement create product modal');
    productsManagement?.showToast('Create product modal - Coming soon!', 'info');
};

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    productsManagement?.destroy();
});

console.log('✅ Products Management JavaScript loaded successfully');