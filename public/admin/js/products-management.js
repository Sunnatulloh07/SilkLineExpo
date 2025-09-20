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
        this.setupThemeListener(); // Add theme listener setup
        this.loadProducts(false);
        this.updateTabCounts();
        this.setupAutoRefresh();
        this.setupResponsiveHandlers();
        
        // Restore state from URL parameters
        this.restoreState();
        
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
            
            const response = await this.fetchWithRetry(fullUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const response_data = await response.json();
            
            // Handle wrapped response structure
            const data = response_data.success ? response_data.data : response_data;
            
            // Validate response structure
            if (!data || !data.pagination || !data.products) {
                console.error('❌ Invalid response structure:', { 
                    hasData: !!data,
                    hasPagination: !!(data && data.pagination),
                    hasProducts: !!(data && data.products),
                    dataKeys: data ? Object.keys(data) : 'Ma\'lumot yo\'q',
                    response_data 
                });
                throw new Error('Noto\'g\'ri API javob struktura');
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
                this.showSuccess(`${data.products.length} ta mahsulot muvaffaqiyatli yuklandi`);
            }
            
        } catch (error) {
            this.showError('Mahsulotlarni yuklashda xatolik. Qayta urinib ko\'ring.');
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
        this.showSuccess('Barcha filtrlar tozalandi');
        
        // Track event
        this.trackEvent('filters_cleared', { tab: this.currentTab });
        
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
        this.showSuccess('Ma\'lumotlar yangilandi');
    }

    /**
     * Render products in the table
     */
    renderProducts(products) {
        const tableBody = document.getElementById('productsTableBody');
        const mobileCardsView = document.getElementById('mobileCardsView');
        
        if (!tableBody) return;
        
        if (!products || products.length === 0) {
            console.log('📦 No products to render:', {
                products: products,
                productsLength: products ? products.length : 'undefined',
                productsType: typeof products
            });
            this.renderEmptyState();
            return;
        }
        
        // Render desktop table
        tableBody.innerHTML = products.map(product => this.renderProductRow(product)).join('');
        
        // Render mobile cards
        if (mobileCardsView) {
            mobileCardsView.innerHTML = products.map(product => this.renderMobileCard(product)).join('');
        }
        
        // Apply fade-in animation
        tableBody.classList.add('fade-in');
        
        // Update bulk actions state
        this.updateBulkActions();
        
        // Setup row event listeners
        this.setupRowEventListeners();
    }

    /**
     * Render mobile card view
     */
    renderMobileCard(product) {
        const isSelected = this.selectedProducts.has(product._id);
        
        return `
            <div class="mobile-product-card ${isSelected ? 'selected' : ''}" data-product-id="${product._id}">
                <div class="mobile-card-header">
                    <label class="modern-checkbox">
                        <input type="checkbox" 
                               class="product-checkbox" 
                               value="${product._id}"
                               ${isSelected ? 'checked' : ''}
                               onchange="window.productsManager.toggleProductSelection('${product._id}', this.checked)">
                        <span class="checkbox-mark"></span>
                    </label>
                    <div class="mobile-product-info">
                        ${this.renderProductImage(product)}
                        <div class="mobile-product-details">
                            <h4 class="mobile-product-name">${this.escapeHtml(product.name || 'Noma\'lum')}</h4>
                            <div class="mobile-product-badges">
                                ${product.isFeatured ? '<span class="badge badge-featured"><i class="las la-star"></i>Tavsiya etilgan</span>' : ''}
                                ${product.isPromoted ? '<span class="badge badge-promoted"><i class="las la-fire"></i>Targ\'ib qilingan</span>' : ''}
                            </div>
                        </div>
                    </div>
                    ${this.renderProductActions(product)}
                </div>
                
                <div class="mobile-card-content">
                    <p class="mobile-product-description">${this.escapeHtml(product.shortDescription || product.description || 'Tavsif mavjud emas')}</p>
                    
                    <div class="mobile-info-grid">
                        <div class="mobile-info-item">
                            <span class="mobile-info-label">Ishlab chiqaruvchi:</span>
                            <span class="mobile-info-value">${this.escapeHtml(product.manufacturerInfo?.companyName || 'Noma\'lum')}</span>
                        </div>
                        <div class="mobile-info-item">
                            <span class="mobile-info-label">Kategoriya:</span>
                            ${this.renderCategoryBadge(product)}
                        </div>
                        <div class="mobile-info-item">
                            <span class="mobile-info-label">Narx:</span>
                            <span class="mobile-price-value">$${this.formatPrice(product.pricing?.basePrice || 0)} ${product.pricing?.currency || 'USD'}</span>
                        </div>
                        <div class="mobile-info-item">
                            <span class="mobile-info-label">Qoldiq:</span>
                            <div class="mobile-stock-info">
                                <div class="stock-status ${this.getStockStatus(product)}">
                                    <div class="stock-indicator"></div>
                                    <span class="stock-text">${this.getStockStatusText(product)}</span>
                                </div>
                                <span class="stock-quantity">${product.inventory?.availableStock || 0} ${product.inventory?.unit || 'dona'}</span>
                            </div>
                        </div>
                        <div class="mobile-info-item">
                            <span class="mobile-info-label">Holat:</span>
                            ${this.renderStatusBadge(product.status)}
                        </div>
                        <div class="mobile-info-item">
                            <span class="mobile-info-label">Qo'shilgan:</span>
                            <span class="mobile-info-value">${this.formatDate(product.createdAt)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render a single product row
     */
    renderProductRow(product) {
        const isSelected = this.selectedProducts.has(product._id);
        
        return `
            <tr class="table-row ${isSelected ? 'selected' : ''}" data-product-id="${product._id}">
                <td class="td-select">
                    <label class="modern-checkbox">
                        <input type="checkbox" 
                               class="product-checkbox" 
                               value="${product._id}"
                               ${isSelected ? 'checked' : ''}
                               onchange="window.productsManager.toggleProductSelection('${product._id}', this.checked)">
                        <span class="checkbox-mark"></span>
                    </label>
                </td>
                <td class="td-product">
                    <div class="product-info-cell">
                        <div class="product-image-container">
                            ${this.renderProductImage(product)}
                        </div>
                        <div class="product-details">
                            <div class="product-name-container">
                                <h4 class="product-name">${this.escapeHtml(product.name || 'Noma\'lum')}</h4>
                                <div class="product-badges">
                                    ${product.isFeatured ? '<span class="badge badge-featured"><i class="las la-star"></i>Tavsiya etilgan</span>' : ''}
                                    ${product.isPromoted ? '<span class="badge badge-promoted"><i class="las la-fire"></i>Targ\'ib qilingan</span>' : ''}
                                </div>
                            </div>
                            <p class="product-description">${this.escapeHtml(product.shortDescription || product.description || 'Tavsif mavjud emas')}</p>
                            <div class="product-meta">
                                <span class="product-sku">${product.sku || 'SKU yo\'q'}</span>
                                ${this.renderCategoryBadge(product)}
                            </div>
                        </div>
                    </div>
                </td>
                <td class="td-manufacturer">
                    <div class="manufacturer-info-cell">
                        <div class="manufacturer-header">
                            <div class="manufacturer-name">${this.escapeHtml(product.manufacturerInfo?.companyName || 'Noma\'lum')}</div>
                            <div class="manufacturer-rating">
                                ${this.renderTrustScore(product.manufacturerInfo?.trustScore || 0)}
                            </div>
                        </div>
                        <div class="manufacturer-location">
                            ${this.renderCountryFlag(product.manufacturerInfo?.country)}
                            <span class="country-name">${this.escapeHtml(product.manufacturerInfo?.country || 'Noma\'lum')}</span>
                        </div>
                        <div class="manufacturer-contact">
                            ${product.manufacturerInfo?.email ? `<span class="contact-email">${this.escapeHtml(product.manufacturerInfo.email)}</span>` : ''}
                        </div>
                    </div>
                </td>
                <td class="td-business">
                    <div class="business-info-cell">
                        <div class="business-type">
                            <i class="las la-industry business-icon"></i>
                            <span class="business-label">${this.getBusinessTypeLabel(product.businessMetrics?.type || 'standard')}</span>
                        </div>
                        <div class="certification-info">
                            ${product.certifications?.length ? 
                                `<span class="certification-count"><i class="las la-certificate"></i>${product.certifications.length} Sertifikatlangan</span>` : 
                                '<span class="no-certification">Sertifikatlar yo\'q</span>'
                            }
                        </div>
                        <div class="quality-score">
                            ${this.renderQualityScore(product.businessMetrics?.qualityScore || 0)}
                        </div>
                    </div>
                </td>
                <td class="td-pricing">
                    <div class="pricing-info-cell">
                        <div class="price-container">
                            <div class="price-main">
                                <span class="currency-symbol">$</span>
                                <span class="price-value">${this.formatPrice(product.pricing?.basePrice || 0)}</span>
                                <span class="price-currency">${product.pricing?.currency || 'USD'}</span>
                            </div>
                            <div class="price-details">
                                ${product.pricing?.discount ? `<span class="price-discount">-${product.pricing.discount}%</span>` : ''}
                                <span class="price-unit">${product.inventory?.unit || 'dona'} uchun</span>
                            </div>
                        </div>
                        <div class="stock-container">
                            <div class="stock-status ${this.getStockStatus(product)}">
                                <div class="stock-indicator"></div>
                                <span class="stock-text">${this.getStockStatusText(product)}</span>
                            </div>
                            <div class="stock-quantity">
                                <span class="stock-number">${product.inventory?.availableStock || 0}</span>
                                <span class="stock-unit">${product.inventory?.unit || 'dona'}</span>
                            </div>
                        </div>
                    </div>
                </td>
                <td class="td-status">
                    <div class="status-cell">
                        ${this.renderStatusBadge(product.status)}
                        <div class="status-details">
                            <small class="status-updated">Yangilangan ${this.getTimeAgo(product.lastModifiedAt || product.createdAt)}</small>
                        </div>
                    </div>
                </td>
                <td class="td-metrics">
                    <div class="metrics-cell">
                        <div class="performance-score">
                            <div class="performance-indicator ${this.getPerformanceLevel(product.businessMetrics?.profitabilityScore || 0)}"></div>
                            <span class="performance-value">${this.formatPerformanceScore(product.businessMetrics?.profitabilityScore || 0)}%</span>
                        </div>
                        <div class="metrics-details">
                            <div class="metric-item">
                                <span class="metric-label">Ko'rishlar:</span>
                                <span class="metric-value">${product.businessMetrics?.viewCount || 0}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Buyurtmalar:</span>
                                <span class="metric-value">${product.businessMetrics?.orderCount || 0}</span>
                            </div>
                        </div>
                    </div>
                </td>
                <td class="td-date">
                    <div class="date-cell">
                        <div class="date-main">${this.formatDate(product.createdAt)}</div>
                        <div class="date-details">
                            <small class="date-time">${this.formatTime(product.createdAt)}</small>
                        </div>
                    </div>
                </td>
                <td class="td-actions">
                    <div class="actions-cell">
                        ${this.renderProductActions(product)}
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Render product image
     */
    renderProductImage(product) {
        const imageUrl = product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url;
        const productName = product.name || 'Noma\'lum mahsulot';
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
            active: { icon: 'check-circle', label: 'Faol' },
            draft: { icon: 'edit', label: 'Loyiha' },
            inactive: { icon: 'pause', label: 'Nofaol' },
            discontinued: { icon: 'times-circle', label: 'To\'xtatilgan' },
            out_of_stock: { icon: 'exclamation-triangle', label: 'Tugagan' }
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
    renderCategoryBadge(product) {
        // Handle new category structure with MongoDB references
        if (product.categoryName) {
            // New category system with full category information
            const categoryColor = product.categoryColor || '#3B82F6';
            const categoryIcon = product.categoryIcon || 'las la-folder';
            const categoryLevel = product.categoryLevel || 0;
            
            return `
                <div class="category-badge-modern" style="border-left-color: ${categoryColor}">
                    <div class="category-icon" style="color: ${categoryColor}">
                        <i class="${categoryIcon}"></i>
                    </div>
                    <div class="category-info">
                        <span class="category-name">${this.escapeHtml(product.categoryName)}</span>
                        ${product.subcategoryName ? `<span class="subcategory-name">${this.escapeHtml(product.subcategoryName)}</span>` : ''}
                        <span class="category-level">Daraja ${categoryLevel}</span>
                    </div>
                </div>
            `;
        } else if (product.legacyCategory) {
            // Legacy category system support
            const categoryLabels = {
                food_beverages: 'Oziq-ovqat va ichimliklar',
                textiles_clothing: 'To\'qimachilik va kiyim',
                electronics: 'Elektronika',
                machinery_equipment: 'Texnika va uskunalar',
                chemicals: 'Kimyo sanoati',
                agriculture: 'Qishloq xo\'jaligi',
                construction_materials: 'Qurilish materiallari',
                automotive: 'Avtomobil sanoati',
                pharmaceuticals: 'Farmatsevtika',
                other: 'Boshqa'
            };
            
            const label = categoryLabels[product.legacyCategory] || product.legacyCategory;
            return `<div class="category-badge legacy-category ${product.legacyCategory}">${this.escapeHtml(label)}</div>`;
        } else {
            // Fallback for products without category
            return `<div class="category-badge no-category">Noma\'lum</div>`;
        }
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
                <button class="actions-trigger" onclick="window.productsManager.toggleActionMenu('${product._id}')">
                    <i class="las la-ellipsis-v"></i>
                </button>
                <div class="actions-menu" id="actions-${product._id}">
                    <button class="action-item" onclick="window.productsManager.viewProduct('${product._id}')">
                        <i class="las la-eye"></i>
                        Tafsilotlarni ko'rish
                    </button>
                    <button class="action-item" onclick="window.productsManager.editProduct('${product._id}')">
                        <i class="las la-edit"></i>
                        Mahsulotni tahrirlash
                    </button>
                    <div class="action-divider"></div>
                    ${this.getProductStatusActions(product)}
                    <div class="action-divider"></div>
                    <button class="action-item ${product.isPromoted ? 'warning' : 'success'}" onclick="window.productsManager.togglePromoted('${product._id}', ${!product.isPromoted})">
                        <i class="las la-${product.isPromoted ? 'star-half-alt' : 'star'}"></i>
                        ${product.isPromoted ? 'Targ\'ibni olib tashlash' : 'Mahsulotni targ\'ib qilish'}
                    </button>
                    <button class="action-item danger" onclick="window.productsManager.deleteProduct('${product._id}')">
                        <i class="las la-trash"></i>
                        Mahsulotni o'chirish
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
                    <button class="action-item success" onclick="window.productsManager.activateProduct('${product._id}')">
                        <i class="las la-check"></i>
                        Mahsulotni faollashtirish
                    </button>
                `);
                break;
                
            case 'active':
                actions.push(`
                    <button class="action-item warning" onclick="window.productsManager.deactivateProduct('${product._id}')">
                        <i class="las la-pause"></i>
                        Mahsulotni deaktivlashtirish
                    </button>
                    <button class="action-item danger" onclick="window.productsManager.discontinueProduct('${product._id}')">
                        <i class="las la-times-circle"></i>
                        Mahsulotni to'xtatish
                    </button>
                `);
                break;
                
            case 'inactive':
                actions.push(`
                    <button class="action-item success" onclick="window.productsManager.activateProduct('${product._id}')">
                        <i class="las la-check"></i>
                        Mahsulotni faollashtirish
                    </button>
                `);
                break;
                
            case 'discontinued':
                actions.push(`
                    <button class="action-item success" onclick="window.productsManager.activateProduct('${product._id}')">
                        <i class="las la-redo"></i>
                        Mahsulotni qayta faollashtirish
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
            'in-stock': 'Yetarli',
            'low-stock': 'Kam',
            'out-of-stock': 'Tugagan'
        };
        return statusTexts[status] || 'Noma\'lum';
    }

    getTrustLevel(score) {
        if (score >= 80) return 'high';
        if (score >= 50) return 'medium';
        return 'low';
    }

    getPerformanceLevel(score) {
        if (score >= 70) return 'high';
        if (score >= 40) return 'medium';
        return 'low';
    }

    getBusinessTypeLabel(type) {
        const types = {
            manufacturer: 'Ishlab chiqarish',
            distributor: 'Tarqatish',
            wholesaler: 'Ulgurji savdo',
            retailer: 'Chakana savdo',
            standard: 'Standart'
        };
        return types[type] || 'Standart';
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

    formatTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    }

    getTimeAgo(dateString) {
        if (!dateString) return 'Noma\'lum';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'bugun';
        if (diffDays === 2) return 'bugun oldin'; 
        if (diffDays <= 7) return `${diffDays - 1} kun oldin`;
        if (diffDays <= 30) return `${Math.ceil((diffDays - 1) / 7)} hafta oldin`;
        
        return `${Math.ceil(diffDays / 30)} oy oldin`;
    }

    renderTrustScore(score) {
        const level = this.getTrustLevel(score);
        return `
            <div class="trust-score ${level}">
                <div class="trust-indicator ${level}"></div>
                <span class="trust-value">${score}%</span>
            </div>
        `;
    }

    renderQualityScore(score) {
        const level = this.getPerformanceLevel(score);
        return `
            <div class="quality-score ${level}">
                <div class="quality-bar">
                    <div class="quality-fill" style="width: ${Math.min(100, score)}%"></div>
                </div>
                <span class="quality-value">${Math.round(score)}%</span>
            </div>
        `;
    }

    // Product action methods
    viewProduct(productId) {
        this.showProductDetailsModal(productId);
    }

    editProduct(productId) {
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
            'Mahsulotni to\'xtatish',
            'Bu mahsulotni to\'xtatishni xohlaysizmi?',
            'danger'
        );
        
        if (confirmed) {
            await this.updateProductStatus(productId, 'discontinued');
        }
    }

    async deleteProduct(productId) {
        const confirmed = await this.confirmAction(
            'Mahsulotni o\'chirish',
            'Bu mahsulotni o\'chirishni xohlaysizmi? Bu amalni bekor qilish mumkin.',
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
            
            this.showSuccess(`Mahsulot ${status} muvaffaqiyatli`);
            this.loadProducts(true);
            this.updateTabCounts();
            
            // Clear selection if product was selected
            this.selectedProducts.delete(productId);
            this.updateBulkActions();
            
            // Track action
            this.trackEvent('product_status_update', { status, productId });
            
        } catch (error) {
            this.showError(`Mahsulot holatini yangilashda xatolik. Qayta urinib ko\'ring.`);
        } finally {
            this.hideLoading();
        }
    }

    async performProductAction(productId, action, data = {}) {
        try {
            this.showLoading(`${action.charAt(0).toUpperCase() + action.slice(1)}ing product...`);
            
            const response = await this.fetchWithRetry('/admin/api/products/bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productIds: [productId],
                    action,
                    ...data
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            this.showSuccess(`Mahsulot ${action} muvaffaqiyatli`);
            this.loadProducts(true);
            this.updateTabCounts();
            
            // Clear selection if product was selected
            this.selectedProducts.delete(productId);
            this.updateBulkActions();
            
            // Track action
            this.trackEvent('product_action', { action, productId });
            
        } catch (error) {
            this.showError(`Mahsulotni ${action} qilishda xatolik. Qayta urinib ko\'ring.`);
        } finally {
            this.hideLoading();
        }
    }

    // Bulk operations
    async bulkAction(action) {
        if (this.selectedProducts.size === 0) return;
        
        const actionLabels = {
            activate: 'Faollashtirish',
            promote: 'Targ\'ib qilish', 
            delete: 'O\'chirish'
        };
        
        const confirmed = await this.confirmAction(
            `Ommaviy ${actionLabels[action] || action}`,
            `${this.selectedProducts.size} ta tanlangan mahsulotni ${actionLabels[action] || action}ni xohlaysizmi?`,
            action === 'delete' ? 'danger' : 'success'
        );
        
        if (confirmed) {
            await this.performBulkAction(action);
        }
    }

    async bulkActivateProducts() {
        this.bulkAction('activate');
    }

    async bulkPromoteProducts() {
        this.bulkAction('promote');
    }

    async bulkDeleteProducts() {
        this.bulkAction('delete');
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
            this.showSuccess(`${productIds.length} ta mahsulot muvaffaqiyatli eksport qilindi`);
            
            // Track export
            this.trackEvent('bulk_export', { count: productIds.length });
            
        } catch (error) {
            this.showError('Mahsulotlarni eksport qilishda xatolik. Qayta urinib ko\'ring.');
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
            
            this.showSuccess(`${productIds.length} ta mahsulot ${action} muvaffaqiyatli`);
            this.loadProducts(true);
            this.updateTabCounts();
            this.clearSelection();
            
            // Track bulk action
            this.trackEvent('bulk_action', { action, count: productIds.length });
            
        } catch (error) {
            this.showError(`Mahsulotlarni ${action} qilishda xatolik. Qayta urinib ko\'ring.`);
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
            this.showSuccess('Mahsulotlar muvaffaqiyatli eksport qilindi');
            
            // Track export
            this.trackEvent('export_products', { tab: this.currentTab, filters: this.activeFilters });
            
        } catch (error) {
            this.showError('Mahsulotlarni eksport qilishda xatolik. Qayta urinib ko\'ring.');
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
        if (!dateString) return 'Noma\'lum';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Bugun';
        if (diffDays === 2) return 'Bugun oldin';
        if (diffDays <= 7) return `${diffDays - 1} kun oldin`;
        
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
                title: 'Mahsulotlar topilmadi',
                description: 'Hozirgi filtr mezonlaringizga mos mahsulotlar yo\'q.'
            },
            error: {
                icon: 'las la-exclamation-triangle',
                title: 'Mahsulotlarni yuklashda xatolik',
                description: 'Mahsulotlarni yuklashda muammo yuz berdi. Qayta urinib ko\'ring.'
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
                            '<button class="btn btn-primary" onclick="window.productsManager.loadProducts()">Qayta urinish</button>' : 
                            '<button class="btn btn-outline-primary" onclick="window.productsManager.clearAllFilters()">Filtrlarni tozalash</button>'
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
                    onclick="window.productsManager.goToPage(${currentPage - 1})"
                    ${currentPage === 1 ? 'disabled' : ''}>
                <i class="las la-chevron-left"></i>
                <span class="d-none d-md-inline">Oldingi</span>
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
                html += `<button class="page-btn" onclick="window.productsManager.goToPage(1)">1</button>`;
                if (startPage > 2) {
                    html += `<span class="page-btn disabled">...</span>`;
                }
            }
            
            for (let i = startPage; i <= endPage; i++) {
                html += `
                    <button class="page-btn ${i === currentPage ? 'active' : ''}" 
                            onclick="window.productsManager.goToPage(${i})">
                        ${i}
                    </button>
                `;
            }
            
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    html += `<span class="page-btn disabled">...</span>`;
                }
                html += `<button class="page-btn" onclick="window.productsManager.goToPage(${totalPages})">${totalPages}</button>`;
            }
        }
        
        // Next button
        html += `
            <button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                    onclick="window.productsManager.goToPage(${currentPage + 1})"
                    ${currentPage === totalPages ? 'disabled' : ''}>
                <span class="d-none d-md-inline">Keyingi</span>
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
        const loadingOverlay = document.getElementById('tableLoadingOverlay');
        const tableBody = document.getElementById('productsTableBody');
        
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
            loadingOverlay.style.display = 'flex';
        }
        
        if (tableBody) {
            tableBody.innerHTML = '';
        }
    }

    hideTableLoading() {
        const loadingOverlay = document.getElementById('tableLoadingOverlay');
        
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
            loadingOverlay.style.display = 'none';
        }
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
                            Bekor qilish
                        </button>
                        <button id="confirmBtn" style="padding: 8px 16px; border: none; background: ${typeColors[type] || typeColors.warning}; color: white; border-radius: 6px; cursor: pointer; font-weight: 500;">
                            Tasdiqlash
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
        this.showToast('Mahsulot ma\'lumotlarini ko\'rish modalini yuklashda xatolik', 'info');
    }

    showProductEditModal(productId) {
        this.showToast('Mahsulot tahrirlash modalini yuklashda xatolik', 'info');
    }

    // Theme management for products page
    updateModalTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const modals = document.querySelectorAll('.product-modal, .modal-overlay');
        
        modals.forEach(modal => {
            if (currentTheme === 'dark') {
                modal.classList.add('dark-theme');
            } else {
                modal.classList.remove('dark-theme');
            }
        });
    }

    // Listen for theme changes from dashboard
    setupThemeListener() {
        // Listen for theme changes from the main dashboard
        window.addEventListener('themeChanged', (event) => {
            const newTheme = event.detail.theme;
            this.updateModalTheme();
        });

        // Listen for storage events (theme changes from other tabs)
        window.addEventListener('storage', (event) => {
            if (event.key === 'dashboard-theme') {
                this.updateModalTheme();
            }
        });

        // Initial theme setup
        this.updateModalTheme();
    }

    /**
     * Show create product modal
     */
    async showCreateModal() {
        
        try {
            // Create and show modal
            const modal = this.createProductModal();
            document.body.appendChild(modal);
            
            // Initialize modal functionality
            this.initializeModalFeatures(modal);
            
            // Apply current theme to modal
            this.updateModalTheme();
            
            // Show modal with animation
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
            
        } catch (error) {
            this.showError('Mahsulot yaratish modalini ochishda xatolik');
        }
    }

    /**
     * Create professional product modal
     */
    createProductModal() {
        const modal = document.createElement('div');
        modal.className = 'product-modal-overlay';
        modal.innerHTML = `
            <div class="product-modal">
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="las la-plus-circle"></i>
                        Yangi mahsulot qo'shish
                    </h2>
                    <button type="button" class="modal-close" onclick="this.closest('.product-modal-overlay').remove()">
                        <i class="las la-times"></i>
                    </button>
                </div>

                <form class="product-form" id="createProductForm">
                    <div class="modal-body">
                        
                        <!-- Basic Information Section -->
                        <div class="form-section">
                            <div class="section-header">
                                <h3 class="section-title">
                                    <i class="las la-info-circle"></i>
                                    Asosiy ma'lumotlar
                                </h3>
                            </div>
                            
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label required">Mahsulot nomi</label>
                                    <input type="text" name="name" class="form-control" required 
                                           placeholder="Mahsulot nomini kiriting" maxlength="200">
                                    <div class="form-feedback"></div>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label required">Kategoriya</label>
                                    <select name="category" class="form-control" required>
                                        <option value="">Kategoriyani tanlang</option>
                                        <option value="food_beverages">Oziq-ovqat va ichimliklar</option>
                                        <option value="textiles_clothing">To'qimachilik va kiyim</option>
                                        <option value="electronics">Elektronika</option>
                                        <option value="machinery_equipment">Mashina va uskunalar</option>
                                        <option value="chemicals">Kimyoviy mahsulotlar</option>
                                        <option value="agriculture">Qishloq xo'jaligi</option>
                                        <option value="construction_materials">Qurilish materiallari</option>
                                        <option value="automotive">Avtomobil</option>
                                        <option value="pharmaceuticals">Farmatsevtika</option>
                                        <option value="other">Boshqa</option>
                                    </select>
                                    <div class="form-feedback"></div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label required">Tavsif</label>
                                <textarea name="description" class="form-control" rows="4" required 
                                          placeholder="Batafsil mahsulot tavsifini kiriting" maxlength="2000"></textarea>
                                <div class="form-feedback"></div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Qisqa tavsif</label>
                                <textarea name="shortDescription" class="form-control" rows="2" 
                                          placeholder="Qisqa mahsulot xulosasi (ixtiyoriy)" maxlength="500"></textarea>
                                <div class="form-feedback"></div>
                            </div>
                        </div>

                        <!-- Manufacturer Information -->
                        <div class="form-section">
                            <div class="section-header">
                                <h3 class="section-title">
                                    <i class="las la-industry"></i>
                                    Ishlab chiqaruvchi ma'lumotlari
                                </h3>
                            </div>
                            
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label required">Ishlab chiqaruvchi nomi</label>
                                    <input type="text" name="manufacturerName" class="form-control" required 
                                           placeholder="Ishlab chiqaruvchi nomini kiriting">
                                    <div class="form-feedback"></div>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label required">Mamlakat</label>
                                    <select name="country" class="form-control" required>
                                        <option value="">Mamlakatni tanlang</option>
                                        <option value="Uzbekistan">🇺🇿 O'zbekiston</option>
                                        <option value="Kazakhstan">🇰🇿 Qozog'iston</option>
                                        <option value="China">🇨🇳 Xitoy</option>
                                        <option value="Tajikistan">🇹🇯 Tojikiston</option>
                                        <option value="Turkmenistan">🇹🇲 Turkmaniston</option>
                                        <option value="Afghanistan">🇦🇫 Afg'oniston</option>
                                        <option value="Kyrgyzstan">🇰🇬 Qirg'iziston</option>
                                    </select>
                                    <div class="form-feedback"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Pricing & Inventory -->
                        <div class="form-section">
                            <div class="section-header">
                                <h3 class="section-title">
                                    <i class="las la-dollar-sign"></i>
                                    Narx va qoldiq
                                </h3>
                            </div>
                            
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label required">Asosiy narx (USD)</label>
                                    <input type="number" name="basePrice" class="form-control" required 
                                           min="0" step="0.01" placeholder="0.00">
                                    <div class="form-feedback"></div>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">Valyuta</label>
                                    <select name="currency" class="form-control">
                                        <option value="USD" selected>USD - AQSH dollari</option>
                                        <option value="UZS">UZS - O'zbek so'mi</option>
                                        <option value="KZT">KZT - Qozog'iston tenge</option>
                                        <option value="CNY">CNY - Xitoy yuani</option>
                                        <option value="EUR">EUR - Yevro</option>
                                    </select>
                                    <div class="form-feedback"></div>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label required">Qoldiq miqdori</label>
                                    <input type="number" name="stockQuantity" class="form-control" required 
                                           min="0" placeholder="0">
                                    <div class="form-feedback"></div>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label required">O'lchov birligi</label>
                                    <select name="unit" class="form-control" required>
                                        <option value="">Birlikni tanlang</option>
                                        <option value="piece">Dona</option>
                                        <option value="kg">Kilogramm</option>
                                        <option value="ton">Tonna</option>
                                        <option value="liter">Litr</option>
                                        <option value="meter">Metr</option>
                                        <option value="box">Quti</option>
                                        <option value="carton">Karton</option>
                                        <option value="pallet">Pallet</option>
                                    </select>
                                    <div class="form-feedback"></div>
                                </div>
                            </div>
                            
                            <div class="form-grid grid-2">
                                <div class="form-group">
                                    <label class="form-label">Minimal buyurtma miqdori</label>
                                    <input type="number" name="minOrderQuantity" class="form-control" 
                                           min="1" value="1" placeholder="1">
                                    <div class="form-feedback"></div>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">Maksimal buyurtma miqdori</label>
                                    <input type="number" name="maxOrderQuantity" class="form-control" 
                                           min="1" placeholder="Cheksiz">
                                    <div class="form-feedback"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Product Settings -->
                        <div class="form-section">
                            <div class="section-header">
                                <h3 class="section-title">
                                    <i class="las la-cog"></i>
                                    Mahsulot sozlamalari
                                </h3>
                            </div>
                            
                            <div class="settings-grid">
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <input type="checkbox" name="isActive" value="true" checked>
                                        <span class="setting-toggle"></span>
                                        <span class="setting-text">
                                            <strong>Faol mahsulot</strong>
                                            <small>Mahsulot xaridorlarga ko'rinadi</small>
                                        </span>
                                    </label>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <input type="checkbox" name="isFeatured" value="true">
                                        <span class="setting-toggle"></span>
                                        <span class="setting-text">
                                            <strong>Tavsiya etilgan mahsulot</strong>
                                            <small>Tavsiya etilgan mahsulotlar bo'limida ko'rsatish</small>
                                        </span>
                                    </label>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="setting-label">
                                        <input type="checkbox" name="allowBackorders" value="true">
                                        <span class="setting-toggle"></span>
                                        <span class="setting-text">
                                            <strong>Qoldiq tugaganda buyurtma qabul qilish</strong>
                                            <small>Qoldiq tugaganda ham buyurtmalarni qabul qilish</small>
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.product-modal-overlay').remove()">
                            <i class="las la-times"></i>
                            Bekor qilish
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="las la-save"></i>
                            Mahsulot yaratish
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        return modal;
    }

    /**
     * Initialize modal features
     */
    initializeModalFeatures(modal) {
        const form = modal.querySelector('.product-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleProductCreation(form, modal);
            });
        }

        // Close modal on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Escape key to close
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    /**
     * Handle product creation
     */
    async handleProductCreation(form, modal) {
        
        try {
            // Validate form
            if (!this.validateProductForm(form)) {
                this.showError('Yuborishdan oldin validatsiya xatolarini tuzating');
                return;
            }
            
            // Show loading state
            this.setProductModalLoadingState(true);
            
            // Collect form data
            const formData = this.collectProductFormData(form);
            
            // Submit to backend
            const response = await fetch(this.endpoints.products, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Success - close modal and refresh table
                modal.remove();
                this.showSuccess('Mahsulot muvaffaqiyatli yaratildi!');
                await this.loadProducts(true);
                
                // Update theme for any remaining modals
                this.updateModalTheme();
                
            } else {
                // Handle validation errors
                this.handleProductServerErrors(result, form);
            }
            
        } catch (error) {
            this.showError('Mahsulot yaratishda xatolik. Qayta urinib ko\'ring.');
        } finally {
            this.setProductModalLoadingState(false);
        }
    }

    /**
     * Validate product form
     */
    validateProductForm(form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                this.showFieldError(field, 'Bu maydon majburiy');
                isValid = false;
            } else {
                this.clearFieldError(field);
            }
        });

        return isValid;
    }

    /**
     * Collect product form data
     */
    collectProductFormData(form) {
        const formData = new FormData(form);
        const data = {};

        for (let [key, value] of formData.entries()) {
            if (key.includes('[]')) {
                const cleanKey = key.replace('[]', '');
                if (!data[cleanKey]) data[cleanKey] = [];
                data[cleanKey].push(value);
            } else {
                data[key] = value;
            }
        }

        // Handle checkboxes
        const checkboxes = form.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            data[checkbox.name] = checkbox.checked;
        });

        return data;
    }

    /**
     * Handle server validation errors for products
     */
    handleProductServerErrors(result, form) {
        if (result.errors) {
            Object.entries(result.errors).forEach(([field, messages]) => {
                const fieldElement = form.querySelector(`[name="${field}"]`);
                if (fieldElement) {
                    this.showFieldError(fieldElement, Array.isArray(messages) ? messages[0] : messages);
                }
            });
        } else {
            this.showError(result.message || 'Mahsulot yaratishda xatolik');
        }
    }

    /**
     * Set modal loading state
     */
    setProductModalLoadingState(loading) {
        const modal = document.querySelector('.product-modal');
        if (!modal) return;

        const submitBtn = modal.querySelector('button[type="submit"]');
        const cancelBtn = modal.querySelector('.btn-secondary');

        if (loading) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="las la-spinner animate-spin"></i> Mahsulot yaratish...';
            cancelBtn.disabled = true;
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="las la-save"></i> Mahsulot yaratish';
            cancelBtn.disabled = false;
        }
    }

    /**
     * Show field error
     */
    showFieldError(field, message) {
        field.classList.add('is-invalid');
        const feedback = field.parentNode.querySelector('.form-feedback');
        if (feedback) {
            feedback.textContent = message;
            feedback.classList.add('invalid-feedback');
        }
    }

    /**
     * Clear field error
     */
    clearFieldError(field) {
        field.classList.remove('is-invalid');
        const feedback = field.parentNode.querySelector('.form-feedback');
        if (feedback) {
            feedback.textContent = '';
            feedback.classList.remove('invalid-feedback');
        }
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
        
    }
}

// Global instance - will be initialized in EJS template
// window.productsManager is set in the EJS template

// Expose global functions - these will work with window.productsManager
window.toggleSelectAll = (checked) => window.productsManager?.toggleSelectAll(checked);
window.clearAllFilters = () => window.productsManager?.clearAllFilters();
window.applyFilters = () => window.productsManager?.applyFilters();
window.refreshData = () => window.productsManager?.refreshData();
window.exportProducts = () => window.productsManager?.exportProducts();
window.bulkActivateProducts = () => window.productsManager?.bulkActivateProducts();
window.bulkPromoteProducts = () => window.productsManager?.bulkPromoteProducts();
window.bulkDeleteProducts = () => window.productsManager?.bulkDeleteProducts();
window.bulkExportProducts = () => window.productsManager?.bulkExportProducts();
window.openCreateProductModal = () => {
    window.productsManager?.showToast('Mahsulot yaratish modalini yuklashda xatolik', 'info');
};

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    window.productsManager?.destroy();
});
