/**
 * Professional Products Management JavaScript
 * B2B Marketplace Integration - Senior Software Engineer Level Implementation
 * SLEX Platform - Products Management Module
 */

(function() {
    'use strict';

    // Global state management
    let productsData = {};
    let selectedProducts = new Set();
    let currentFilters = {};
    let isLoading = false;

    // DOM Cache
    const DOM = {
        // Main containers
        productsGrid: null,
        filtersForm: null,
        toastContainer: null,
        
        // Filter elements
        searchInput: null,
        statusFilter: null,
        categoryFilter: null,
        marketplaceFilter: null,
        sortFilter: null,
        sortOrderFilter: null,
        
        // Action buttons
        addProductBtn: null,
        bulkActionsBtn: null,
        resetFiltersBtn: null,
        clearFiltersBtn: null,
        refreshBtn: null,
        
        // Modals
        bulkActionsModal: null,
        
        // View toggle
        viewToggle: null,
        
        // Statistics cards
        statCards: null
    };

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        initializeProductsManagement();
    });

    /**
     * Main initialization function
     */
    function initializeProductsManagement() {
        try {
            logger.log('🚀 Initializing Professional Products Management System');
            
            // Load server data
            loadServerData();
            
            // Cache DOM elements
            cacheDOMElements();
            
            // Setup event listeners
            setupEventListeners();
            
            // Initialize components
            initializeComponents();
            
            // Setup keyboard shortcuts
            setupKeyboardShortcuts();
            
            logger.log('✅ Products Management System initialized successfully');
            
        } catch (error) {
            logger.error('❌ Failed to initialize Products Management:', error);
            showToast(window.t ? window.t('manufacturer.products.errors.systemLoadFailed') : 'System loading failed', 'error');
        }
    }

    /**
     * Load data from server-side rendered JSON
     */
    function loadServerData() {
        try {
            const dataScript = document.getElementById('products-data');
            if (dataScript) {
                productsData = JSON.parse(dataScript.textContent);
                currentFilters = productsData.filters || {};
                logger.log('📊 Server data loaded:', {
                    products: productsData.products?.length || 0,
                    filters: Object.keys(currentFilters),
                    stats: productsData.stats
                });
            }
        } catch (error) {
            logger.error('❌ Failed to load server data:', error);
            productsData = { products: [], pagination: {}, filters: {}, stats: {} };
        }
    }

    /**
     * Cache frequently used DOM elements
     */
    function cacheDOMElements() {
        // Main containers
        DOM.productsGrid = document.getElementById('productsGrid');
        DOM.filtersForm = document.getElementById('filtersForm');
        DOM.toastContainer = document.getElementById('toastContainer');
        
        // Filter elements
        DOM.searchInput = document.getElementById('searchInput');
        DOM.statusFilter = document.getElementById('statusFilter');
        DOM.categoryFilter = document.getElementById('categoryFilter');
        DOM.marketplaceFilter = document.getElementById('marketplaceFilter');
        DOM.sortFilter = document.getElementById('sortFilter');
        DOM.sortOrderFilter = document.getElementById('sortOrderFilter');
        
        // Action buttons
        DOM.addProductBtn = document.getElementById('addProductBtn');
        DOM.bulkActionsBtn = document.getElementById('bulkActionsBtn');
        DOM.resetFiltersBtn = document.getElementById('resetFiltersBtn');
        DOM.clearFiltersBtn = document.getElementById('clearFiltersBtn');
        DOM.refreshBtn = document.getElementById('refreshProductsBtn');
        
        // Modals
        DOM.bulkActionsModal = document.getElementById('bulkActionsModal');
        
        // View toggle
        DOM.viewToggle = document.querySelectorAll('.view-btn');
        
        // Statistics cards
        DOM.statCards = document.querySelectorAll('.stat-card');
        
        logger.log('🎯 DOM elements cached successfully');
    }

    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        // Filter form submission
        if (DOM.filtersForm) {
            DOM.filtersForm.addEventListener('submit', handleFilterSubmit);
        }

        // Search input real-time filtering (debounced)
        if (DOM.searchInput) {
            DOM.searchInput.addEventListener('input', debounce(handleSearchInput, 500));
        }

        // Filter dropdowns
        [DOM.statusFilter, DOM.categoryFilter, DOM.marketplaceFilter, DOM.sortFilter, DOM.sortOrderFilter]
            .forEach(element => {
                if (element) {
                    element.addEventListener('change', handleFilterChange);
                }
            });

        // Action buttons
        if (DOM.addProductBtn) {
            DOM.addProductBtn.addEventListener('click', handleAddProduct);
        }

        if (DOM.bulkActionsBtn) {
            DOM.bulkActionsBtn.addEventListener('click', handleBulkActionsOpen);
        }

        if (DOM.resetFiltersBtn) {
            DOM.resetFiltersBtn.addEventListener('click', handleResetFilters);
        }

        if (DOM.clearFiltersBtn) {
            DOM.clearFiltersBtn.addEventListener('click', handleClearFilters);
        }

        if (DOM.refreshBtn) {
            DOM.refreshBtn.addEventListener('click', handleRefreshProducts);
        }

        // View toggle buttons
        DOM.viewToggle.forEach(btn => {
            btn.addEventListener('click', handleViewToggle);
        });

        // Product card actions (event delegation)
        if (DOM.productsGrid) {
            DOM.productsGrid.addEventListener('click', handleProductCardActions);
        }

        // Bulk actions modal
        if (DOM.bulkActionsModal) {
            DOM.bulkActionsModal.addEventListener('click', handleBulkActionsModal);
        }

        // Modal close handlers
        document.addEventListener('click', handleModalClose);
        
        // More actions dropdown handlers
        document.addEventListener('click', handleMoreActionsToggle);

        logger.log('🔗 Event listeners setup completed');
    }

    /**
     * Initialize additional components
     */
    function initializeComponents() {
        // Initialize tooltips if available
        if (typeof initializeTooltips === 'function') {
            initializeTooltips();
        }

        // Initialize animations
        initializeAnimations();

        // Update statistics display
        updateStatisticsDisplay();

        // Setup periodic refresh if needed
        setupPeriodicRefresh();
    }

    /**
     * Handle filter form submission
     */
    function handleFilterSubmit(event) {
        event.preventDefault();
        
        if (isLoading) return;
        
        logger.log('🔍 Processing filter submission');
        
        const formData = new FormData(DOM.filtersForm);
        const filters = Object.fromEntries(formData.entries());
        
        // Update current filters
        currentFilters = { ...currentFilters, ...filters };
        
        // Apply filters (redirect with query params)
        applyFilters(filters);
    }

    /**
     * Handle search input changes (debounced)
     */
    function handleSearchInput(event) {
        const searchTerm = event.target.value.trim();
        
        if (searchTerm !== currentFilters.search) {
            currentFilters.search = searchTerm;
            
            // Auto-submit after delay
            setTimeout(() => {
                if (DOM.searchInput.value.trim() === searchTerm) {
                    applyFilters({ search: searchTerm });
                }
            }, 300);
        }
    }

    /**
     * Handle filter dropdown changes
     */
    function handleFilterChange(event) {
        const { name, value } = event.target;
        currentFilters[name] = value;
        
        logger.log(`🔄 Filter changed: ${name} = ${value}`);
        
        // Auto-apply filter change
        applyFilters({ [name]: value });
    }

    /**
     * Apply filters and reload page
     */
    function applyFilters(newFilters = {}) {
        if (isLoading) return;
        
        isLoading = true;
        
        // Merge with current filters
        const allFilters = { ...currentFilters, ...newFilters };
        
        // Remove empty values
        Object.keys(allFilters).forEach(key => {
            if (!allFilters[key] || allFilters[key] === 'all' || allFilters[key] === '') {
                delete allFilters[key];
            }
        });
        
        // Build query string
        const queryParams = new URLSearchParams(allFilters);
        
        // Add current page if not filtering (preserve pagination)
        if (!Object.keys(newFilters).length) {
            queryParams.set('page', '1');
        }
        
        // Navigate to filtered results
        const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
        
        logger.log('🚀 Applying filters, navigating to:', newUrl);
        showToast('Filtrlar qo\'llanmoqda...', 'info');
        
        window.location.href = newUrl;
    }

    /**
     * Handle add new product
     */
    function handleAddProduct() {
        logger.log('➕ Adding new product');
        window.location.href = '/manufacturer/products/add';
    }

    /**
     * Handle bulk actions modal opening
     */
    function handleBulkActionsOpen() {
        if (selectedProducts.size === 0) {
            showToast(window.t ? window.t('manufacturer.products.messages.selectAtLeastOne') : 'Please select at least one product', 'warning');
            return;
        }

        logger.log(`📦 Opening bulk actions for ${selectedProducts.size} products`);
        showModal('bulkActionsModal');
    }

    /**
     * Handle filter reset
     */
    function handleResetFilters() {
        logger.log('🔄 Resetting all filters');
        
        // Reset form
        if (DOM.filtersForm) {
            DOM.filtersForm.reset();
        }
        
        // Clear current filters
        currentFilters = {};
        
        // Navigate to clean URL
        window.location.href = window.location.pathname;
    }

    /**
     * Handle clear filters
     */
    function handleClearFilters() {
        handleResetFilters();
    }

    /**
     * Handle products refresh
     */
    function handleRefreshProducts() {
        if (isLoading) return;
        
        logger.log('🔄 Refreshing products');
                    showToast(window.t ? window.t('manufacturer.products.messages.updatingProducts') : 'Updating products...', 'info');
        
        // Reload current page
        window.location.reload();
    }

    /**
     * Handle view toggle (grid/list)
     */
    function handleViewToggle(event) {
        const clickedBtn = event.currentTarget;
        const view = clickedBtn.dataset.view;
        
        // Update active state
        DOM.viewToggle.forEach(btn => btn.classList.remove('active'));
        clickedBtn.classList.add('active');
        
        // Apply view to products grid
        if (DOM.productsGrid) {
            DOM.productsGrid.className = `products-${view}`;
        }
        
        // Store preference
        localStorage.setItem('products-view-preference', view);
        
        logger.log(`👁️ View changed to: ${view}`);
    }

    /**
     * Handle product card actions (event delegation)
     */
    function handleProductCardActions(event) {
        const target = event.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        const productId = target.dataset.productId;
        
        logger.log(`🎯 Product action: ${action} for product: ${productId}`);

        switch (action) {
            case 'view':
                handleViewProduct(productId);
                break;
            case 'edit':
                handleEditProduct(productId);
                break;
            case 'analytics':
                handleProductAnalytics(productId);
                break;
            case 'publish':
                handleMarketplaceToggle(productId, 'publish');
                break;
            case 'unpublish':
                handleMarketplaceToggle(productId, 'unpublish');
                break;
            case 'duplicate':
                handleDuplicateProduct(productId);
                break;
            case 'archive':
                handleArchiveProduct(productId);
                break;
            case 'delete':
                handleDeleteProduct(productId);
                break;
            default:
                logger.warn('Unknown product action:', action);
        }
    }

    /**
     * Handle view product details
     */
    async function handleViewProduct(productId) {
        try {
            
            // Show loading state
            const modal = document.getElementById('productDetailsModal');
            const content = document.getElementById('productDetailsContent');
            
            if (modal && content) {
                modal.classList.remove('hidden');
                content.innerHTML = `
                    <div class="loading-content">
                        <div class="loading-spinner"></div>
                        <p>${window.t ? window.t('manufacturer.products.modal.loading') : 'Loading...'}</p>
                    </div>
                `;
            }
            
            // Fetch product details
            const response = await fetch(`/api/manufacturer/products/${productId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = await response.json();
            
            if (result.success && result.product) {
                // Render product details with multi-language support
                renderProductDetails(result.product);
            } else {
                throw new Error(result.message || 'Failed to load product details');
            }
            
        } catch (error) {
            logger.error('❌ Failed to load product details:', error);
            showToast(window.t ? window.t('manufacturer.products.errors.generalError') : 'Failed to load product details', 'error');
            
            // Show error state
            const content = document.getElementById('productDetailsContent');
            if (content) {
                content.innerHTML = `
                    <div class="error-content">
                        <i class="fas fa-exclamation-circle text-danger"></i>
                        <p>${window.t ? window.t('manufacturer.products.errors.generalError') : 'Failed to load product details'}</p>
                    </div>
                `;
            }
        }
    }

    /**
     * Render product details in modal
     */
    function renderProductDetails(product) {
        const content = document.getElementById('productDetailsContent');
        if (!content) return;
        
        const productDetails = `
            <div class="product-details">
                <div class="product-header">
                    <h3 class="product-title">${product.name || (window.t ? window.t('manufacturer.products.noCategory') : 'Unnamed Product')}</h3>
                    <span class="product-category">${product.category?.name || product.category || (window.t ? window.t('manufacturer.products.noCategory') : 'No Category')}</span>
                </div>
                
                <div class="product-info">
                    <div class="info-section">
                        <h4>${window.t ? window.t('manufacturer.products.modal.description') : 'Description'}</h4>
                        <p>${product.description || (window.t ? window.t('manufacturer.products.noDescription') : 'No description available')}</p>
                    </div>
                    
                    <div class="info-section">
                        <h4>${window.t ? window.t('manufacturer.products.modal.price') : 'Price'}</h4>
                        <p>${product.price ? `${window.t ? window.t('manufacturer.products.modal.currency') : '$'}${product.price}` : (window.t ? window.t('manufacturer.products.modal.priceOnRequest') : 'Price on request')}</p>
                    </div>
                    
                    <div class="info-section">
                        <h4>${window.t ? window.t('manufacturer.products.modal.quantity') : 'Quantity'}</h4>
                        <p>${product.quantity || 0} ${window.t ? window.t('manufacturer.products.unit') : 'units'}</p>
                    </div>
                    
                    <div class="info-section">
                        <h4>${window.t ? window.t('manufacturer.products.modal.status') : 'Status'}</h4>
                        <span class="status-badge ${product.status}">${window.t ? window.t(`manufacturer.products.status.${product.status}`) : product.status}</span>
                    </div>
                    
                    <div class="info-section">
                        <h4>${window.t ? window.t('manufacturer.products.modal.marketplace') : 'Marketplace'}</h4>
                        <span class="marketplace-badge ${product.visibility === 'public' ? 'published' : 'unpublished'}">
                            ${product.visibility === 'public' ? 
                                (window.t ? window.t('manufacturer.products.marketplace.published') : 'Published') : 
                                (window.t ? window.t('manufacturer.products.marketplace.unpublished') : 'Unpublished')
                            }
                        </span>
                    </div>
                </div>
            </div>
        `;
        
        content.innerHTML = productDetails;
    }

    /**
     * Handle marketplace publish/unpublish toggle
     */
    async function handleMarketplaceToggle(productId, action) {
        if (isLoading) return;
        
        try {
            isLoading = true;
            
            const actionText = action === 'publish' ? 
            (window.t ? window.t('manufacturer.products.messages.publishing') : 'publishing') : 
            (window.t ? window.t('manufacturer.products.messages.hiding') : 'hiding');
            showToast(window.t ? window.t('manufacturer.products.messages.processingProduct', { action: actionText }) : `Processing product ${actionText}...`, 'info');
            
            const response = await fetch(`/api/manufacturer/products/${productId}/marketplace/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = await response.json();
            
            if (result.success) {
                const successText = action === 'publish' ? 
                    (window.t ? window.t('manufacturer.products.messages.published') : 'published') : 
                    (window.t ? window.t('manufacturer.products.messages.hidden') : 'hidden');
                showToast(window.t ? window.t('manufacturer.products.messages.productSuccessfullyProcessed', { action: successText }) : `Product successfully ${successText}`, 'success');
                
                // Update button state
                updateMarketplaceButton(productId, action);
                
                // Update statistics
                updateStatisticsAfterAction(action);
                
            } else {
                            throw new Error(result.message || (window.t ? window.t('manufacturer.products.errors.generalError') : 'An error occurred'));
        }
        
    } catch (error) {
        logger.error('❌ Marketplace toggle failed:', error);
        showToast(window.t ? window.t('manufacturer.products.errors.marketplaceToggleFailed') : 'Failed to change marketplace status', 'error');
        } finally {
            isLoading = false;
        }
    }

    /**
     * Update marketplace button state after action
     */
    function updateMarketplaceButton(productId, action) {
        const productCard = document.querySelector(`[data-product-id="${productId}"]`);
        if (!productCard) return;
        
        const marketplaceBtn = productCard.querySelector('.marketplace-toggle');
        const marketplaceBadge = productCard.querySelector('.marketplace-badge');
        
        if (action === 'publish') {
            // Update button to unpublish
            marketplaceBtn.dataset.action = 'unpublish';
            marketplaceBtn.className = 'btn-action btn-warning marketplace-toggle';
            marketplaceBtn.innerHTML = `<i class="fas fa-eye-slash"></i><span>${window.t ? window.t('manufacturer.products.actions.removeFromMarketplace') : 'Remove from Marketplace'}</span>`;
            
            // Add marketplace badge if not exists
            if (!marketplaceBadge) {
                const badgesContainer = productCard.querySelector('.product-badges');
                if (badgesContainer) {
                    const badge = document.createElement('span');
                    badge.className = 'marketplace-badge published';
                    badge.innerHTML = `<i class="fas fa-globe"></i>${window.t ? window.t('manufacturer.products.marketplace.title') : 'Marketplace'}`;
                    badgesContainer.appendChild(badge);
                }
            }
        } else {
            // Update button to publish
            marketplaceBtn.dataset.action = 'publish';
            marketplaceBtn.className = 'btn-action btn-success marketplace-toggle';
            marketplaceBtn.innerHTML = `<i class="fas fa-globe"></i><span>${window.t ? window.t('manufacturer.products.actions.addToMarketplace') : 'Add to Marketplace'}</span>`;
            
            // Remove marketplace badge
            if (marketplaceBadge) {
                marketplaceBadge.remove();
            }
        }
    }

    /**
     * Handle product edit
     */
    function handleEditProduct(productId) {
        logger.log(`✏️ Editing product: ${productId}`);
        window.location.href = `/manufacturer/products/${productId}/edit`;
    }

    /**
     * Handle product analytics
     */
    function handleProductAnalytics(productId) {
        logger.log(`📊 Viewing analytics for product: ${productId}`);
        window.location.href = `/manufacturer/products/${productId}/analytics`;
    }

    /**
     * Handle product duplication
     */
    async function handleDuplicateProduct(productId) {
        if (isLoading) return;
        
        try {
            isLoading = true;
            showToast(window.t ? window.t('manufacturer.products.messages.duplicatingProduct') : 'Duplicating product...', 'info');
            
            const response = await fetch(`/api/manufacturer/products/${productId}/duplicate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = await response.json();
            
            if (result.success) {
                showToast(window.t ? window.t('manufacturer.products.messages.productDuplicated') : 'Product duplicated successfully', 'success');
                
                // Refresh page to show new product
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
                
            } else {
                throw new Error(result.message || (window.t ? window.t('manufacturer.products.errors.duplicationFailed') : 'Duplication failed'));
            }
            
        } catch (error) {
            logger.error('❌ Product duplication failed:', error);
            showToast(window.t ? window.t('manufacturer.products.errors.duplicationFailed') : 'Failed to duplicate product', 'error');
        } finally {
            isLoading = false;
        }
    }

    /**
     * Handle product archiving
     */
    async function handleArchiveProduct(productId) {
        if (!confirm(window.t ? window.t('manufacturer.products.confirmations.archiveProduct') : 'Do you want to archive this product?')) return;
        
        if (isLoading) return;
        
        try {
            isLoading = true;
            showToast(window.t ? window.t('manufacturer.products.messages.archivingProduct') : 'Archiving product...', 'info');
            
            const response = await fetch(`/api/manufacturer/products/${productId}/archive`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = await response.json();
            
            if (result.success) {
                showToast(window.t ? window.t('manufacturer.products.messages.productArchived') : 'Product archived successfully', 'success');
                
                // Remove product card from view
                const productCard = document.querySelector(`[data-product-id="${productId}"]`);
                if (productCard) {
                    productCard.style.opacity = '0.5';
                    setTimeout(() => {
                        productCard.remove();
                    }, 500);
                }
                
            } else {
                throw new Error(result.message || (window.t ? window.t('manufacturer.products.errors.archiveFailed') : 'Archive failed'));
            }
            
        } catch (error) {
            logger.error('❌ Product archiving failed:', error);
            showToast(window.t ? window.t('manufacturer.products.errors.archiveFailed') : 'Failed to archive product', 'error');
        } finally {
            isLoading = false;
        }
    }

    /**
     * Handle product deletion
     */
    async function handleDeleteProduct(productId) {
        if (!confirm(window.t ? window.t('manufacturer.products.confirmations.deleteProduct') : 'Do you want to completely delete this product? This action cannot be undone.')) return;
        
        if (isLoading) return;
        
        try {
            isLoading = true;
            showToast(window.t ? window.t('manufacturer.products.messages.deletingProduct') : 'Deleting product...', 'info');
            
            const response = await fetch(`/api/manufacturer/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = await response.json();
            
            if (result.success) {
                showToast(window.t ? window.t('manufacturer.products.messages.productDeleted') : 'Product deleted successfully', 'success');
                
                // Remove product card from view with animation
                const productCard = document.querySelector(`[data-product-id="${productId}"]`);
                if (productCard) {
                    productCard.style.transform = 'scale(0)';
                    productCard.style.opacity = '0';
                    setTimeout(() => {
                        productCard.remove();
                    }, 300);
                }
                
                // Update statistics
                updateStatisticsAfterDelete();
                
            } else {
                throw new Error(result.message || (window.t ? window.t('manufacturer.products.errors.deleteFailed') : 'Delete failed'));
            }
            
        } catch (error) {
            logger.error('❌ Product deletion failed:', error);
            showToast(window.t ? window.t('manufacturer.products.errors.deleteFailed') : 'Failed to delete product', 'error');
        } finally {
            isLoading = false;
        }
    }

    /**
     * Handle bulk actions modal interactions
     */
    function handleBulkActionsModal(event) {
        const target = event.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        
        logger.log(`📦 Bulk action: ${action} for ${selectedProducts.size} products`);

        switch (action) {
            case 'publish-selected':
                handleBulkMarketplaceToggle('publish');
                break;
            case 'unpublish-selected':
                handleBulkMarketplaceToggle('unpublish');
                break;
            case 'activate-selected':
                handleBulkStatusChange('active');
                break;
            case 'deactivate-selected':
                handleBulkStatusChange('inactive');
                break;
            default:
                logger.warn('Unknown bulk action:', action);
        }
    }

    /**
     * Handle bulk status change
     */
    async function handleBulkStatusChange(status) {
        if (selectedProducts.size === 0) return;
        
        const statusText = status === 'active' ? 
            (window.t ? window.t('manufacturer.products.actions.activate') : 'activate') : 
            (window.t ? window.t('manufacturer.products.actions.deactivate') : 'deactivate');
        if (!confirm(window.t ? window.t('manufacturer.products.confirmations.bulkStatusChange', { count: selectedProducts.size, action: statusText }) : `Do you want to ${statusText} ${selectedProducts.size} products?`)) return;
        
        hideModal('bulkActionsModal');
        
        try {
            isLoading = true;
            showToast(window.t ? window.t('manufacturer.products.messages.bulkStatusChange', { count: selectedProducts.size, action: statusText }) : `${selectedProducts.size} products ${statusText}...`, 'info');
            
            const response = await fetch(`/api/manufacturer/products/bulk/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    productIds: Array.from(selectedProducts),
                    status: status
                })
            });

            const result = await response.json();
            
            if (result.success) {
                        const successText = status === 'active' ? 
            (window.t ? window.t('manufacturer.products.messages.activated') : 'activated') : 
            (window.t ? window.t('manufacturer.products.messages.deactivated') : 'deactivated');
        showToast(window.t ? window.t('manufacturer.products.messages.bulkStatusSuccess', { count: result.affectedCount, action: successText }) : `${result.affectedCount} products successfully ${successText}`, 'success');
                
                // Clear selection and refresh page
                clearProductSelection();
                
                // Refresh page to show updated status
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
                
                    } else {
            throw new Error(result.message || (window.t ? window.t('manufacturer.products.errors.bulkStatusChangeFailed') : 'Bulk status change failed'));
        }
        
    } catch (error) {
        logger.error('❌ Bulk status change failed:', error);
        showToast(window.t ? window.t('manufacturer.products.errors.bulkStatusChangeFailed') : 'Bulk status change failed', 'error');
        } finally {
            isLoading = false;
        }
    }

    /**
     * Handle bulk marketplace toggle
     */
    async function handleBulkMarketplaceToggle(action) {
        if (selectedProducts.size === 0) return;
        
        const actionText = action === 'publish' ? 
            (window.t ? window.t('manufacturer.products.actions.publish') : 'publish') : 
            (window.t ? window.t('manufacturer.products.actions.unpublish') : 'unpublish');
        if (!confirm(window.t ? window.t('manufacturer.products.confirmations.bulkMarketplaceChange', { count: selectedProducts.size, action: actionText }) : `Do you want to ${actionText} ${selectedProducts.size} products in marketplace?`)) return;
        
        hideModal('bulkActionsModal');
        
        try {
            isLoading = true;
            showToast(window.t ? window.t('manufacturer.products.messages.bulkMarketplaceChange', { count: selectedProducts.size, action: actionText }) : `${selectedProducts.size} products ${actionText}...`, 'info');
            
            const response = await fetch(`/api/manufacturer/products/bulk/marketplace/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    productIds: Array.from(selectedProducts)
                })
            });

            const result = await response.json();
            
            if (result.success) {
                        const successText = action === 'publish' ? 
            (window.t ? window.t('manufacturer.products.messages.published') : 'published') : 
            (window.t ? window.t('manufacturer.products.messages.hidden') : 'hidden');
        showToast(window.t ? window.t('manufacturer.products.messages.bulkMarketplaceSuccess', { count: result.affectedCount, action: successText }) : `${result.affectedCount} products successfully ${successText}`, 'success');
                
                // Update UI for affected products
                selectedProducts.forEach(productId => {
                    updateMarketplaceButton(productId, action);
                });
                
                // Clear selection
                clearProductSelection();
                
                // Update statistics
                updateStatisticsAfterBulkAction(action, result.affectedCount);
                
                    } else {
            throw new Error(result.message || (window.t ? window.t('manufacturer.products.errors.bulkActionFailed') : 'Bulk action failed'));
        }
        
    } catch (error) {
        logger.error('❌ Bulk marketplace toggle failed:', error);
        showToast(window.t ? window.t('manufacturer.products.errors.bulkActionFailed') : 'Bulk action failed', 'error');
        } finally {
            isLoading = false;
        }
    }

    /**
     * Handle more actions dropdown toggle
     */
    function handleMoreActionsToggle(event) {
        const target = event.target.closest('.more-toggle');
        
        if (target) {
            event.stopPropagation();
            const menu = target.parentElement.querySelector('.more-menu');
            
            // Close all other menus
            document.querySelectorAll('.more-menu').forEach(m => {
                if (m !== menu) m.classList.add('hidden');
            });
            
            // Toggle current menu
            menu.classList.toggle('hidden');
        } else {
            // Close all menus when clicking outside
            document.querySelectorAll('.more-menu').forEach(m => {
                m.classList.add('hidden');
            });
        }
    }

    /**
     * Handle modal close
     */
    function handleModalClose(event) {
        const target = event.target;
        
        if (target.classList.contains('modal-overlay') || target.classList.contains('modal-close')) {
            const modal = target.closest('.modal-overlay');
            if (modal) {
                hideModal(modal.id);
            }
        }
    }

    /**
     * Show modal
     */
    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Hide modal
     */
    function hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    /**
     * Show toast notification
     */
    function showToast(message, type = 'info', duration = 5000) {
        if (!DOM.toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = getToastIcon(type);
        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;
        
        DOM.toastContainer.appendChild(toast);
        
        // Auto remove
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);
        
        logger.log(`📱 Toast: ${type} - ${message}`);
    }

    /**
     * Get toast icon based on type
     */
    function getToastIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    /**
     * Initialize animations
     */
    function initializeAnimations() {
        // Stagger product card animations
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.05}s`;
            card.classList.add('animate-slide-up');
        });
        
        // Stats cards animation
        DOM.statCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('animate-fade-in');
        });
    }

    /**
     * Update statistics display
     */
    function updateStatisticsDisplay() {
        if (!productsData.stats) return;
        
        const stats = productsData.stats;
        
        // Update each stat card
        updateStatCard('total', stats.totalProducts || 0);
        updateStatCard('active', stats.activeProducts || 0);
        updateStatCard('marketplace', stats.marketplaceProducts || 0);
        updateStatCard('lowstock', stats.lowStockProducts || 0);
        updateStatCard('draft', stats.draftProducts || 0);
    }

    /**
     * Update individual stat card
     */
    function updateStatCard(metric, value) {
        const card = document.querySelector(`[data-metric="${metric}"] .metric-value`);
        if (card) {
            // Animate number change
            animateNumber(card, parseInt(card.textContent) || 0, value);
        }
    }

    /**
     * Animate number change
     */
    function animateNumber(element, from, to, duration = 1000) {
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.round(from + (to - from) * progress);
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    }

    /**
     * Update statistics after action
     */
    function updateStatisticsAfterAction(action) {
        if (!productsData.stats) return;
        
        if (action === 'publish') {
            productsData.stats.marketplaceProducts = (productsData.stats.marketplaceProducts || 0) + 1;
            updateStatCard('marketplace', productsData.stats.marketplaceProducts);
        } else if (action === 'unpublish') {
            productsData.stats.marketplaceProducts = Math.max(0, (productsData.stats.marketplaceProducts || 0) - 1);
            updateStatCard('marketplace', productsData.stats.marketplaceProducts);
        }
    }

    /**
     * Update statistics after bulk action
     */
    function updateStatisticsAfterBulkAction(action, count) {
        if (!productsData.stats) return;
        
        if (action === 'publish') {
            productsData.stats.marketplaceProducts = (productsData.stats.marketplaceProducts || 0) + count;
            updateStatCard('marketplace', productsData.stats.marketplaceProducts);
        } else if (action === 'unpublish') {
            productsData.stats.marketplaceProducts = Math.max(0, (productsData.stats.marketplaceProducts || 0) - count);
            updateStatCard('marketplace', productsData.stats.marketplaceProducts);
        }
    }

    /**
     * Update statistics after deletion
     */
    function updateStatisticsAfterDelete() {
        if (productsData.stats.totalProducts) {
            productsData.stats.totalProducts -= 1;
            updateStatCard('total', productsData.stats.totalProducts);
        }
    }

    /**
     * Clear product selection
     */
    function clearProductSelection() {
        selectedProducts.clear();
        
        // Update UI
        document.querySelectorAll('.product-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Update bulk actions button
        if (DOM.bulkActionsBtn) {
            DOM.bulkActionsBtn.disabled = true;
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', function(event) {
            // Ctrl/Cmd + K for search focus
            if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
                event.preventDefault();
                if (DOM.searchInput) {
                    DOM.searchInput.focus();
                    DOM.searchInput.select();
                }
            }
            
            // Escape to close modals
            if (event.key === 'Escape') {
                document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(modal => {
                    hideModal(modal.id);
                });
            }
            
            // Ctrl/Cmd + N for new product
            if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
                event.preventDefault();
                handleAddProduct();
            }
        });
    }

    /**
     * Setup periodic refresh (optional)
     */
    function setupPeriodicRefresh() {
        // Only refresh if user is not actively filtering
        let lastActivity = Date.now();
        
        document.addEventListener('click', () => lastActivity = Date.now());
        document.addEventListener('keypress', () => lastActivity = Date.now());
        
        // Check every 5 minutes if user is inactive for 10 minutes
        setInterval(() => {
            const inactiveTime = Date.now() - lastActivity;
            if (inactiveTime > 10 * 60 * 1000) { // 10 minutes
                logger.log('🔄 Auto-refreshing due to inactivity');
                window.location.reload();
            }
        }, 5 * 60 * 1000); // 5 minutes
    }

    /**
     * Debounce utility function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Logger utility
     */
    const logger = {
        log: (message, data = null) => {
            if (data) {
                console.log(`[Products] ${message}`, data);
            } else {
                console.log(`[Products] ${message}`);
            }
        },
        error: (message, error = null) => {
            if (error) {
                console.error(`[Products] ${message}`, error);
            } else {
                console.error(`[Products] ${message}`);
            }
        },
        warn: (message, data = null) => {
            if (data) {
                console.warn(`[Products] ${message}`, data);
            } else {
                console.warn(`[Products] ${message}`);
            }
        }
    };

    // Export for global access if needed
    window.ProductsManagement = {
        showToast,
        applyFilters,
        refreshProducts: handleRefreshProducts,
        logger
    };

})();