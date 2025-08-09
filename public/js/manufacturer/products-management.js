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
            showToast('Tizimni yuklashda xatolik yuz berdi', 'error');
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
            showToast('Iltimos, kamida bitta mahsulotni tanlang', 'warning');
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
        showToast('Mahsulotlar yangilanmoqda...', 'info');
        
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
     * Handle marketplace publish/unpublish toggle
     */
    async function handleMarketplaceToggle(productId, action) {
        if (isLoading) return;
        
        try {
            isLoading = true;
            
            const actionText = action === 'publish' ? 'nashr etilmoqda' : 'yashirilmoqda';
            showToast(`Mahsulot ${actionText}...`, 'info');
            
            const response = await fetch(`/api/manufacturer/products/${productId}/marketplace/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = await response.json();
            
            if (result.success) {
                const successText = action === 'publish' ? 'nashr etildi' : 'yashirildi';
                showToast(`Mahsulot muvaffaqiyatli ${successText}`, 'success');
                
                // Update button state
                updateMarketplaceButton(productId, action);
                
                // Update statistics
                updateStatisticsAfterAction(action);
                
            } else {
                throw new Error(result.message || 'Xatolik yuz berdi');
            }
            
        } catch (error) {
            logger.error('❌ Marketplace toggle failed:', error);
            showToast('Marketplace holati o\'zgartirishda xatolik', 'error');
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
            marketplaceBtn.innerHTML = '<i class="fas fa-eye-slash"></i><span>Marketplace dan olib tashlash</span>';
            
            // Add marketplace badge if not exists
            if (!marketplaceBadge) {
                const badgesContainer = productCard.querySelector('.product-badges');
                if (badgesContainer) {
                    const badge = document.createElement('span');
                    badge.className = 'marketplace-badge published';
                    badge.innerHTML = '<i class="fas fa-globe"></i>Marketplace';
                    badgesContainer.appendChild(badge);
                }
            }
        } else {
            // Update button to publish
            marketplaceBtn.dataset.action = 'publish';
            marketplaceBtn.className = 'btn-action btn-success marketplace-toggle';
            marketplaceBtn.innerHTML = '<i class="fas fa-globe"></i><span>Marketplace ga joylashtirish</span>';
            
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
            showToast('Mahsulot nusxalanmoqda...', 'info');
            
            const response = await fetch(`/api/manufacturer/products/${productId}/duplicate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = await response.json();
            
            if (result.success) {
                showToast('Mahsulot muvaffaqiyatli nusxalandi', 'success');
                
                // Refresh page to show new product
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
                
            } else {
                throw new Error(result.message || 'Nusxalashda xatolik');
            }
            
        } catch (error) {
            logger.error('❌ Product duplication failed:', error);
            showToast('Mahsulotni nusxalashda xatolik', 'error');
        } finally {
            isLoading = false;
        }
    }

    /**
     * Handle product archiving
     */
    async function handleArchiveProduct(productId) {
        if (!confirm('Mahsulotni arxivlashni xohlaysizmi?')) return;
        
        if (isLoading) return;
        
        try {
            isLoading = true;
            showToast('Mahsulot arxivlanmoqda...', 'info');
            
            const response = await fetch(`/api/manufacturer/products/${productId}/archive`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = await response.json();
            
            if (result.success) {
                showToast('Mahsulot muvaffaqiyatli arxivlandi', 'success');
                
                // Remove product card from view
                const productCard = document.querySelector(`[data-product-id="${productId}"]`);
                if (productCard) {
                    productCard.style.opacity = '0.5';
                    setTimeout(() => {
                        productCard.remove();
                    }, 500);
                }
                
            } else {
                throw new Error(result.message || 'Arxivlashda xatolik');
            }
            
        } catch (error) {
            logger.error('❌ Product archiving failed:', error);
            showToast('Mahsulotni arxivlashda xatolik', 'error');
        } finally {
            isLoading = false;
        }
    }

    /**
     * Handle product deletion
     */
    async function handleDeleteProduct(productId) {
        if (!confirm('Mahsulotni butunlay o\'chirishni xohlaysizmi? Bu amalni ortga qaytarib bo\'lmaydi.')) return;
        
        if (isLoading) return;
        
        try {
            isLoading = true;
            showToast('Mahsulot o\'chirilmoqda...', 'info');
            
            const response = await fetch(`/api/manufacturer/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = await response.json();
            
            if (result.success) {
                showToast('Mahsulot muvaffaqiyatli o\'chirildi', 'success');
                
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
                throw new Error(result.message || 'O\'chirishda xatolik');
            }
            
        } catch (error) {
            logger.error('❌ Product deletion failed:', error);
            showToast('Mahsulotni o\'chirishda xatolik', 'error');
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
        
        const statusText = status === 'active' ? 'faollashtirish' : 'nofaollashtirish';
        if (!confirm(`${selectedProducts.size} ta mahsulotni ${statusText}ni xohlaysizmi?`)) return;
        
        hideModal('bulkActionsModal');
        
        try {
            isLoading = true;
            showToast(`${selectedProducts.size} ta mahsulot ${statusText}...`, 'info');
            
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
                const successText = status === 'active' ? 'faollashtirildi' : 'nofaollashtirildi';
                showToast(`${result.affectedCount} ta mahsulot muvaffaqiyatli ${successText}`, 'success');
                
                // Clear selection and refresh page
                clearProductSelection();
                
                // Refresh page to show updated status
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
                
            } else {
                throw new Error(result.message || 'Xatolik yuz berdi');
            }
            
        } catch (error) {
            logger.error('❌ Bulk status change failed:', error);
            showToast('Ommaviy holat o\'zgartirishda xatolik', 'error');
        } finally {
            isLoading = false;
        }
    }

    /**
     * Handle bulk marketplace toggle
     */
    async function handleBulkMarketplaceToggle(action) {
        if (selectedProducts.size === 0) return;
        
        const actionText = action === 'publish' ? 'nashr etish' : 'yashirish';
        if (!confirm(`${selectedProducts.size} ta mahsulotni marketplace da ${actionText}ni xohlaysizmi?`)) return;
        
        hideModal('bulkActionsModal');
        
        try {
            isLoading = true;
            showToast(`${selectedProducts.size} ta mahsulot ${actionText}...`, 'info');
            
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
                const successText = action === 'publish' ? 'nashr etildi' : 'yashirildi';
                showToast(`${result.affectedCount} ta mahsulot muvaffaqiyatli ${successText}`, 'success');
                
                // Update UI for affected products
                selectedProducts.forEach(productId => {
                    updateMarketplaceButton(productId, action);
                });
                
                // Clear selection
                clearProductSelection();
                
                // Update statistics
                updateStatisticsAfterBulkAction(action, result.affectedCount);
                
            } else {
                throw new Error(result.message || 'Xatolik yuz berdi');
            }
            
        } catch (error) {
            logger.error('❌ Bulk marketplace toggle failed:', error);
            showToast('Ommaviy amalda xatolik yuz berdi', 'error');
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