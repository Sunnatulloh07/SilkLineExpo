/**
 * Enhanced Professional Products Management JavaScript
 * B2B Marketplace Integration with Table/Card Views
 * SLEX Platform - Senior Software Engineer Level Implementation
 */

(function() {
    'use strict';

    // Enhanced Logger utility with production check
    const isDevelopment = (function() {
        // Check if we're in development mode
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' || 
               window.location.hostname.includes('dev') ||
               localStorage.getItem('debug_mode') === 'true';
    })();
    
    const logger = {
        log: function(...args) {
            if (isDevelopment && typeof console !== 'undefined' && console.log) {
                console.log(...args);
            }
        },
        error: function(...args) {
            // Always log errors, even in production
            if (typeof console !== 'undefined' && console.error) {
                console.error(...args);
            }
        },
        warn: function(...args) {
            if (typeof console !== 'undefined' && console.warn) {
                console.warn(...args);
            }
        },
        info: function(...args) {
            if (isDevelopment && typeof console !== 'undefined' && console.info) {
                console.info(...args);
            }
        },
        debug: function(...args) {
            if (isDevelopment && typeof console !== 'undefined' && console.debug) {
                console.debug(...args);
            }
        }
    };

    // ===============================================
    //    SENIOR SOFTWARE ENGINEER ENHANCEMENTS
    // ===============================================

    // Performance monitoring system
    const PerformanceMonitor = {
        metrics: {
            dropdownOperations: [],
            modalOperations: [],
            apiCalls: []
        },
        
        startTimer: function(label) {
            return {
                label,
                startTime: performance.now(),
                end: function() {
                    const duration = performance.now() - this.startTime;
                    PerformanceMonitor.recordMetric(this.label, duration);
                    return duration;
                }
            };
        },
        
        recordMetric: function(label, duration) {
            if (!this.metrics[label]) {
                this.metrics[label] = [];
            }
            this.metrics[label].push(duration);
            logger.debug(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
        },
        
        getAverageTime: function(label) {
            const metrics = this.metrics[label];
            if (!metrics || metrics.length === 0) return 0;
            return metrics.reduce((a, b) => a + b, 0) / metrics.length;
        }
    };

    // Error boundary system
    const ErrorBoundary = {
        handleError: function(error, context = 'Unknown') {
            logger.error(`🚨 Error in ${context}:`, error);
            
            // Show user-friendly message
            this.showUserError(context);
            
            // Report to monitoring service in production
            if (!isDevelopment) {
                this.reportError(error, context);
            }
        },
        
        showUserError: function(context) {
            const userMessage = this.getUserMessage(context);
            if (typeof showToast === 'function') {
                showToast(userMessage, 'error');
            }
        },
        
        getUserMessage: function(context) {
            const messages = {
                'dropdown': 'Menyuni ochishda xatolik yuz berdi',
                'modal': 'Oynani ochishda xatolik yuz berdi',
                'api': 'Ma\'lumotlarni yuklashda xatolik yuz berdi',
                'form': 'Ma\'lumotlarni saqlashda xatolik yuz berdi'
            };
            return messages[context] || 'Kutilmagan xatolik yuz berdi';
        },
        
        reportError: function(error, context) {
            // Send to error tracking service
            try {
                // Example integration with error tracking
                // window.errorTracker?.report({ error, context, timestamp: Date.now() });
            } catch (e) {
                console.error('Failed to report error:', e);
            }
        }
    };

    // Global state management
    let productsData = {};
    let selectedProducts = new Set();
    let currentFilters = {};
    let currentView = 'table'; // 'table' or 'card' - Default to table
    let isLoading = false;

    // DOM Cache
    const DOM = {
        // Main containers
        cardView: null,
        tableView: null,
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
        exportBtn: null,
        
        // View toggle
        viewToggleBtns: null,
        
        // Table elements
        selectAllCheckbox: null,
        tableCheckboxes: null,
        
        // Modal
        bulkActionsModal: null
    };

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        initializeProductsManagement();
        initializeMarketplaceModal();
    });

    /**
     * Main initialization function
     */
    function initializeProductsManagement() {
        try {
            logger.log('🚀 Initializing Enhanced Products Management System');
            
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
            
            // Initialize view mode
            initializeViewMode();
            
            // Initialize modal system
            initModalSystemOnReady();
            
            logger.log('✅ Enhanced Products Management System initialized');
            
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
            if (dataScript && dataScript.textContent) {
                try {
                    productsData = JSON.parse(dataScript.textContent);
                    currentFilters = productsData.filters || {};
                    logger.log('📊 Server data loaded:', {
                        products: productsData.products?.length || 0,
                        filters: Object.keys(currentFilters),
                        stats: productsData.stats
                    });
                } catch (parseError) {
                    logger.error('❌ Failed to parse server data JSON:', parseError);
                    productsData = { products: [], pagination: {}, filters: {}, stats: {} };
                    currentFilters = {};
                }
            } else {
                logger.warn('⚠️ No server data script found, using empty data');
                productsData = { products: [], pagination: {}, filters: {}, stats: {} };
                currentFilters = {};
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
        DOM.cardView = document.getElementById('cardView');
        DOM.tableView = document.getElementById('tableView');
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
        DOM.exportBtn = document.getElementById('exportProductsBtn');
        
        // View toggle
        DOM.viewToggleBtns = document.querySelectorAll('.products-view-btn');
        
        // Table elements
        DOM.selectAllCheckbox = document.getElementById('selectAllCheckbox');
        DOM.tableCheckboxes = document.querySelectorAll('.table-checkbox[data-product-id]');
        
        // Modal
        DOM.bulkActionsModal = document.getElementById('bulkActionsModal');
        
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

        // Search input - remove real-time filtering, only on form submit
        // if (DOM.searchInput) {
        //     DOM.searchInput.addEventListener('input', debounce(handleSearchInput, 500));
        // }

        // Filter dropdowns - remove auto-change, only track changes
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

        if (DOM.exportBtn) {
            DOM.exportBtn.addEventListener('click', handleExportProducts);
        }

        // View toggle buttons
        DOM.viewToggleBtns.forEach(btn => {
            btn.addEventListener('click', handleViewToggle);
        });

        // Unified click handler to prevent conflicts
        document.addEventListener('click', handleUnifiedClick);

        // Checkbox selections
        if (DOM.selectAllCheckbox) {
            DOM.selectAllCheckbox.addEventListener('change', handleSelectAll);
        }

        // Individual checkboxes (event delegation)
        document.addEventListener('change', handleCheckboxChange);

        // Bulk actions modal
        if (DOM.bulkActionsModal) {
            DOM.bulkActionsModal.addEventListener('click', handleBulkActionsModal);
        }

        // Debug: Test dropdown system after DOM load
        setTimeout(() => {
            testDropdownSystem();
        }, 1000);

        logger.log('🔗 Event listeners setup completed');
    }

    /**
     * Initialize additional components
     */
    function initializeComponents() {
        // Update statistics display
        updateStatisticsDisplay();

        // Initialize animations
        initializeAnimations();

        // Setup periodic refresh if needed
        setupPeriodicRefresh();

        // Initialize tooltips if available
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
    }

    /**
     * Initialize view mode
     */
    function initializeViewMode() {
        // Default to table view as per requirements
        const savedView = localStorage.getItem('products-view-preference') || 'table';
        switchView(savedView);
    }

    /**
     * Handle view toggle
     */
    function handleViewToggle(event) {
        const clickedBtn = event.currentTarget;
        const view = clickedBtn.dataset.view;
        
        switchView(view);
        
        // Store preference
        localStorage.setItem('products-view-preference', view);
        
        logger.log(`👁️ View changed to: ${view}`);
    }

    /**
     * Switch between card and table views
     */
    function switchView(view) {
        currentView = view;
        
        // Update button states
        DOM.viewToggleBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // Show/hide views
        if (DOM.cardView && DOM.tableView) {
            if (view === 'card') {
                DOM.cardView.classList.remove('hidden');
                DOM.tableView.classList.add('hidden');
            } else {
                DOM.cardView.classList.add('hidden');
                DOM.tableView.classList.remove('hidden');
            }
        }
        
        // Update selection UI based on view
        updateSelectionUI();
    }

    /**
     * Handle table sorting
     */
    function handleTableSort(event) {
        const target = event.target.closest('th.sortable');
        if (!target) return false;

        const sortBy = target.dataset.sort;
        const currentSort = currentFilters.sortBy;
        const currentOrder = currentFilters.sortOrder || 'desc';
        
        let newOrder = 'asc';
        if (currentSort === sortBy && currentOrder === 'asc') {
            newOrder = 'desc';
        }
        
        // Update UI
        document.querySelectorAll('th.sortable').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
        });
        
        target.classList.add(newOrder === 'asc' ? 'sort-asc' : 'sort-desc');
        
        // Apply sort
        applyFilters({ sortBy, sortOrder: newOrder });
        
        logger.log(`🔄 Table sorted by: ${sortBy} ${newOrder}`);
        
        return true; // Sort was handled
    }

    /**
     * Handle select all checkbox
     */
    function handleSelectAll(event) {
        const isChecked = event.target.checked;
        
        if (currentView === 'table') {
            // Select all visible table rows
            const tableCheckboxes = document.querySelectorAll('.table-checkbox[data-product-id]');
            tableCheckboxes.forEach(checkbox => {
                checkbox.checked = isChecked;
                const productId = checkbox.dataset.productId;
                if (isChecked) {
                    selectedProducts.add(productId);
                } else {
                    selectedProducts.delete(productId);
                }
            });
        } else {
            // Select all visible cards
            const cardCheckboxes = document.querySelectorAll('.card-select-checkbox');
            cardCheckboxes.forEach(checkbox => {
                checkbox.checked = isChecked;
                const productId = checkbox.dataset.productId;
                if (isChecked) {
                    selectedProducts.add(productId);
                } else {
                    selectedProducts.delete(productId);
                }
            });
        }
        
        updateSelectionUI();
        logger.log(`📋 ${isChecked ? 'Selected' : 'Deselected'} all products: ${selectedProducts.size}`);
    }

    /**
     * Unified click handler to prevent conflicts - Professional Implementation
     */
    function handleUnifiedClick(event) {
        try {
            // Handle product actions first (highest priority)
            if (handleProductActions(event)) return;
            
            // Handle dropdown system
            if (handleDropdownSystem(event)) return;
            
            // Handle modal close
            if (handleModalClose(event)) return;
            
            // Handle table sorting
            if (handleTableSort(event)) return;
            
        } catch (error) {
            logger.error('Error in unified click handler:', error);
        }
    }

    /**
     * Handle individual checkbox changes
     */
    function handleCheckboxChange(event) {
        const target = event.target;
        if (!target.matches('.table-checkbox[data-product-id], .card-select-checkbox')) return;

        const productId = target.dataset.productId;
        if (target.checked) {
            selectedProducts.add(productId);
        } else {
            selectedProducts.delete(productId);
        }
        
        updateSelectionUI();
        
        // Update select all checkbox state
        if (DOM.selectAllCheckbox) {
            const allCheckboxes = document.querySelectorAll(
                currentView === 'table' ? '.table-checkbox[data-product-id]' : '.card-select-checkbox'
            );
            const checkedCount = Array.from(allCheckboxes).filter(cb => cb.checked).length;
            
            DOM.selectAllCheckbox.checked = checkedCount === allCheckboxes.length;
            DOM.selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < allCheckboxes.length;
        }
        
        logger.log(`📋 Product ${productId} ${target.checked ? 'selected' : 'deselected'}. Total: ${selectedProducts.size}`);
    }

    /**
     * Update selection UI elements
     */
    function updateSelectionUI() {
        const selectedCount = selectedProducts.size;
        
        // Update bulk actions button
        if (DOM.bulkActionsBtn) {
            DOM.bulkActionsBtn.disabled = selectedCount === 0;
            DOM.bulkActionsBtn.innerHTML = `
                <i class="fas fa-tasks"></i>
                Ommaviy Amallar ${selectedCount > 0 ? `(${selectedCount})` : ''}
            `;
        }
        
        // Update row selection styling
        if (currentView === 'table') {
            document.querySelectorAll('tbody tr').forEach(row => {
                const productId = row.dataset.productId;
                row.classList.toggle('selected', selectedProducts.has(productId));
            });
        } else {
            document.querySelectorAll('.product-card').forEach(card => {
                const productId = card.dataset.productId;
                card.classList.toggle('selected', selectedProducts.has(productId));
            });
        }
    }

    /**
     * Handle product actions (works for both card and table views)
     */
    function handleProductActions(event) {
        const target = event.target.closest('[data-action]');
        if (!target) return false;

        const action = target.dataset.action;
        const productId = target.dataset.productId;
        
        if (!productId) {
            showToast('Mahsulot ID topilmadi', 'error');
            return true; // Handled but with error
        }
        
        logger.log(`🎯 Product action: ${action} for product: ${productId}`);

        switch (action) {
            case 'view':
                event.preventDefault();
                event.stopPropagation();
                showProductDetailsModal(productId);
                break;
            case 'edit':
                event.preventDefault();
                event.stopPropagation();
                handleEditProduct(productId);
                break;
            case 'analytics':
                event.preventDefault();
                event.stopPropagation();
                handleProductAnalytics(productId);
                break;
            case 'publish':
                event.preventDefault();
                event.stopPropagation();
                handleMarketplaceToggle(productId, 'publish');
                break;
            case 'unpublish':
                event.preventDefault();
                event.stopPropagation();
                handleMarketplaceToggle(productId, 'unpublish');
                break;
            case 'duplicate':
                event.preventDefault();
                event.stopPropagation();
                showDuplicateModal(productId);
                break;
            case 'status-change':
                event.preventDefault();
                event.stopPropagation();
                showStatusChangeModal(productId);
                break;
            case 'archive':
                event.preventDefault();
                event.stopPropagation();
                handleArchiveProduct(productId);
                break;
            case 'delete':
                event.preventDefault();
                event.stopPropagation();
                showDeleteModal(productId);
                break;
            default:
                logger.warn('Unknown product action:', action);
        }
        
        return true; // Action was handled
    }

    /**
     * Handle marketplace publish/unpublish toggle - ENHANCED
     */
    async function handleMarketplaceToggle(productId, action) {
        const timer = PerformanceMonitor.startTimer('apiCalls');
        
        if (isLoading) {
            logger.warn('⏳ Another operation is in progress');
            return;
        }
        
        try {
            isLoading = true;
            
            // Professional loading states
            const actionText = action === 'publish' ? 'nashr etilmoqda' : 'yashirilmoqda';
            showToast(`Mahsulot ${actionText}...`, 'info');
            
            // Update UI optimistically
            updateMarketplaceStatusOptimistic(productId, action);
            
            // API call with comprehensive error handling (using correct route)
            const response = await fetch(`/api/manufacturer/products/${productId}/marketplace/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Authorization': `Bearer ${getCookie('accessToken')}`
                },
                body: JSON.stringify({
                    productId,
                    action,
                    timestamp: Date.now()
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Network error' }));
                const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
                error.response = response;
                error.responseData = errorData;
                throw error;
            }

            const result = await response.json();
            
            if (result.success) {
                const successText = action === 'publish' ? 'nashr etildi' : 'yashirildi';
                showToast(`Mahsulot muvaffaqiyatli ${successText}`, 'success');
                
                // Confirm UI update with server data
                updateMarketplaceStatus(productId, action, result.data);
                
                // Update statistics
                updateStatisticsAfterMarketplaceAction(action);
                
                logger.log(`✅ Marketplace ${action} successful for product: ${productId}`);
                
            } else {
                throw new Error(result.message || 'Xatolik yuz berdi');
            }
            
        } catch (error) {
            logger.error(`❌ Marketplace ${action} failed:`, error);
            
            // Revert optimistic UI update
            revertMarketplaceStatusUpdate(productId, action);
            
            // Enhanced error message handling
            let errorMessage = 'Marketplace holati o\'zgartirishda xatolik';
            
            // Try to extract specific error message from response
            if (error.responseData) {
                const errorData = error.responseData;
                if (errorData.message) {
                                            // Translate common backend errors to user-friendly Uzbek
                        const errorTranslations = {
                            'Only active products can be published to marketplace': 'Faqat faol mahsulotlarni marketplace ga joylashtirish mumkin. Avval mahsulot holatini "Faol" ga o\'zgartiring.',
                            'Only active or draft products can be published to marketplace': 'Faqat faol yoki qoralama mahsulotlarni marketplace ga joylashtirish mumkin.',
                            'Product must have at least one image to be published': 'Mahsulotni marketplace ga joylashtirish uchun kamida bitta rasm kerak.',
                            'Product must have pricing information to be published': 'Mahsulotni marketplace ga joylashtirish uchun narx ma\'lumotlari kerak.',
                            'Authentication required': 'Autentifikatsiya talab qilinadi. Qayta tizimga kiring.',
                            'Product not found or access denied': 'Mahsulot topilmadi yoki ruxsat yo\'q.'
                        };
                    
                    errorMessage = errorTranslations[errorData.message] || errorData.message;
                }
            } else if (error.message) {
                // Use error message directly if no responseData
                errorMessage = error.message;
            }
            
            // Show specific error message
            showToast(errorMessage, 'error');
            
            ErrorBoundary.handleError(error, 'api');
            
        } finally {
            isLoading = false;
            timer.end();
        }
    }

    /**
     * Optimistic UI update for marketplace actions
     */
    function updateMarketplaceStatusOptimistic(productId, action) {
        logger.log(`🎯 Optimistic UI update: ${action} for product ${productId}`);
        updateMarketplaceStatus(productId, action);
    }
    
    /**
     * Revert optimistic UI update if API call fails
     */
    function revertMarketplaceStatusUpdate(productId, action) {
        logger.log(`🔄 Reverting UI update for product ${productId}`);
        const revertAction = action === 'publish' ? 'unpublish' : 'publish';
        updateMarketplaceStatus(productId, revertAction);
    }
    
    /**
     * Update statistics after marketplace action
     */
    function updateStatisticsAfterMarketplaceAction(action) {
        try {
            // Update KPI cards if they exist
            const publishedCount = document.querySelector('[data-kpi="published"]');
            const draftCount = document.querySelector('[data-kpi="draft"]');
            
            if (publishedCount && draftCount) {
                const currentPublished = parseInt(publishedCount.textContent) || 0;
                const currentDraft = parseInt(draftCount.textContent) || 0;
                
                if (action === 'publish') {
                    publishedCount.textContent = currentPublished + 1;
                    draftCount.textContent = Math.max(0, currentDraft - 1);
                } else {
                    publishedCount.textContent = Math.max(0, currentPublished - 1);
                    draftCount.textContent = currentDraft + 1;
                }
            }
            
            logger.log(`📊 Statistics updated for ${action} action`);
        } catch (error) {
            logger.warn('⚠️ Failed to update statistics:', error);
        }
    }
    
    /**
     * View image in fullscreen - Global function for gallery
     */
    window.viewImageFullscreen = function(imageSrc) {
        const modal = document.createElement('div');
        modal.className = 'image-fullscreen-modal';
        modal.innerHTML = `
            <div class="fullscreen-backdrop" onclick="this.parentElement.remove()">
                <div class="fullscreen-image-container">
                    <img src="${imageSrc}" alt="Fullscreen view" class="fullscreen-image">
                    <button class="fullscreen-close" onclick="this.closest('.image-fullscreen-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    /**
     * Update marketplace status in UI (both card and table views) - ENHANCED
     */
    function updateMarketplaceStatus(productId, action, serverData = null) {
        // Update card view
        const productCard = document.querySelector(`.product-card[data-product-id="${productId}"]`);
        if (productCard) {
            const marketplaceBtn = productCard.querySelector('.card-marketplace-toggle');
            const marketplaceBadge = productCard.querySelector('.card-marketplace-badge');
            
            if (action === 'publish') {
                // Update button to unpublish
                marketplaceBtn.dataset.action = 'unpublish';
                marketplaceBtn.className = 'card-marketplace-toggle unpublish';
                marketplaceBtn.innerHTML = '<i class="fas fa-eye-slash"></i><span>Marketplace dan olib tashlash</span>';
                
                // Add marketplace badge if not exists
                if (!marketplaceBadge) {
                    const badgesContainer = productCard.querySelector('.card-badges');
                    if (badgesContainer) {
                        const badge = document.createElement('span');
                        badge.className = 'card-marketplace-badge published';
                        badge.innerHTML = '<i class="fas fa-globe"></i>Marketplace';
                        badgesContainer.appendChild(badge);
                    }
                }
            } else {
                // Update button to publish
                marketplaceBtn.dataset.action = 'publish';
                marketplaceBtn.className = 'card-marketplace-toggle publish';
                marketplaceBtn.innerHTML = '<i class="fas fa-globe"></i><span>Marketplace ga joylashtirish</span>';
                
                // Remove marketplace badge
                if (marketplaceBadge) {
                    marketplaceBadge.remove();
                }
            }
        }
        
        // Update table view
        const tableRow = document.querySelector(`tbody tr[data-product-id="${productId}"]`);
        if (tableRow) {
            const marketplaceCell = tableRow.querySelector('.table-marketplace-badge');
            const actionBtn = tableRow.querySelector('.table-action-btn[data-action]');
            
            if (action === 'publish') {
                marketplaceCell.className = 'table-marketplace-badge published';
                marketplaceCell.innerHTML = '<i class="fas fa-check"></i>Nashr etilgan';
                
                actionBtn.dataset.action = 'unpublish';
                actionBtn.className = 'table-action-btn warning';
                actionBtn.title = 'Marketplace dan olib tashlash';
                actionBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                marketplaceCell.className = 'table-marketplace-badge unpublished';
                marketplaceCell.innerHTML = '<i class="fas fa-times"></i>Nashr etilmagan';
                
                actionBtn.dataset.action = 'publish';
                actionBtn.className = 'table-action-btn success';
                actionBtn.title = 'Marketplace ga joylashtirish';
                actionBtn.innerHTML = '<i class="fas fa-globe"></i>';
            }
        }
    }

    /**
     * Handle export products
     */
    function handleExportProducts() {
        logger.log('📤 Exporting products');
        
        const queryParams = new URLSearchParams(currentFilters);
        queryParams.set('export', 'xlsx');
        
        const exportUrl = `/manufacturer/products/export?${queryParams.toString()}`;
        
        // Create temporary link and click it
        const link = document.createElement('a');
        link.href = exportUrl;
        link.download = `products-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Mahsulotlar eksport qilinmoqda...', 'info');
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
        
        // Don't auto-apply filter changes, wait for search button
        // applyFilters({ [name]: value });
    }
    
    /**
     * Handle clear/reset filters
     */
    function handleClearFilters() {
        logger.log('🗑️ Clearing all filters');
        
        // Reset form
        if (DOM.filtersForm) {
            DOM.filtersForm.reset();
        }
        
        // Reset all filter inputs to default values
        if (DOM.searchInput) DOM.searchInput.value = '';
        if (DOM.statusFilter) DOM.statusFilter.value = 'all';
        if (DOM.categoryFilter) DOM.categoryFilter.value = 'all';
        if (DOM.marketplaceFilter) DOM.marketplaceFilter.value = 'all';
        if (DOM.sortFilter) DOM.sortFilter.value = 'createdAt';
        if (DOM.sortOrderFilter) DOM.sortOrderFilter.value = 'desc';
        
        // Clear current filters
        currentFilters = {};
        
        // Navigate to clean URL (no query params)
        const cleanUrl = window.location.pathname;
        
        logger.log('🧹 Navigating to clean URL:', cleanUrl);
        showToast('Filtrlar tozalandi', 'success');
        
        window.location.href = cleanUrl;
    }
    
    /**
     * Handle reset filters (alias for clear)
     */
    function handleResetFilters() {
        handleClearFilters();
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

    // Import all other functions from the original products-management.js
    // (handleEditProduct, handleProductAnalytics, handleDuplicateProduct, etc.)
    
    /**
     * Show product details modal
     */
    async function showProductDetailsModal(productId) {
        logger.log(`👁️ Viewing product details: ${productId}`);
        
        const modal = document.getElementById('productDetailsModal');
        const content = document.getElementById('productDetailsContent');
        
        if (!modal || !content) {
            logger.error('Modal elements not found');
            return;
        }
        
        try {
            // Show loading state
            content.innerHTML = `
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <p>Ma'lumot yuklanmoqda...</p>
                </div>
            `;
            
            // Show modal immediately - MARKETPLACE STYLE
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent body scroll
            console.log('✅ Modal shown with marketplace style');
            
            // ALWAYS FETCH FROM API FOR COMPLETE DATA INCLUDING IMAGES
            logger.log(`🌐 Fetching complete product data from API for: ${productId}`);
            
            // Try multiple endpoints to find working one
            let response;
            const endpoints = [
                `/manufacturer/api/products/${productId}`,
                `/api/manufacturer/products/${productId}`,
                `/api/manufacturer/products/${productId}/details`
            ];
            
            for (const endpoint of endpoints) {
                try {
                    console.log(`🔄 Trying endpoint: ${endpoint}`);
                    response = await fetch(endpoint, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        credentials: 'same-origin'
                    });
                    
                    if (response.ok) {
                        console.log(`✅ Success with endpoint: ${endpoint}`);
                        break;
                    } else {
                        console.log(`❌ Failed with endpoint: ${endpoint} - ${response.status}`);
                    }
                } catch (error) {
                    console.log(`❌ Error with endpoint: ${endpoint} - ${error.message}`);
                }
            }
            
            if (!response || !response.ok) {
                throw new Error(`All API endpoints failed. Last status: ${response?.status || 'Network Error'}`);
            }
            
            const result = await response.json();
            console.log('🔍 API Response:', result);
            console.log('🔍 API Response type:', typeof result);
            console.log('🔍 API Response keys:', Object.keys(result));
            
            if (result.data) {
                console.log('📦 API Response data:', result.data);
                console.log('📦 API Response data keys:', Object.keys(result.data));
                console.log('🖼️ API Response data images:', result.data.images);
                console.log('🖼️ Images type:', typeof result.data.images);
                console.log('🖼️ Is images array:', Array.isArray(result.data.images));
                if (result.data.images && Array.isArray(result.data.images)) {
                    result.data.images.forEach((img, i) => {
                        console.log(`🖼️ Raw API image ${i}:`, img);
                        console.log(`🖼️ Raw API image ${i} type:`, typeof img);
                        if (typeof img === 'object' && img) {
                            console.log(`🖼️ Raw API image ${i} keys:`, Object.keys(img));
                        }
                    });
                }
            }
            
            // Handle different API response formats
            let product = result;
            if (result.success && result.data) {
                product = result.data;
            } else if (result.product) {
                product = result.product;
            }
            
            // Ensure product has required fields with real DB data
            product = {
                _id: product._id || productId,
                name: product.name || product.title || 'Noma\'lum mahsulot',
                code: product.code || product.sku || 'N/A',
                price: product.price || product.basePrice || 0,
                status: product.status || 'active',
                stockQuantity: product.stockQuantity || product.stock || 0,
                visibility: product.visibility || (product.isPublished ? 'public' : 'private'),
                createdAt: product.createdAt || new Date().toISOString(),
                updatedAt: product.updatedAt || product.createdAt || new Date().toISOString(),
                description: product.description || '',
                category: product.category || { name: 'Kategoriyasiz' },
                images: product.images || [],
                specifications: product.specifications || [],
                pricing: product.pricing || { basePrice: product.price || 0, currency: 'USD' },
                inventory: product.inventory || { totalStock: product.stockQuantity || 0 },
                shipping: product.shipping || {},
                analytics: product.analytics || {},
                views: product.views || 0,
                rating: product.rating || 0,
                orderCount: product.orderCount || 0,
                ...product
            };
            
            logger.log(`📦 Complete product data prepared:`, product);
            console.log('🔍 Final product object keys:', Object.keys(product));
            console.log('🖼️ Final product images field:', product.images);
            console.log('🔍 Product images type:', typeof product.images);
            if (product.images && Array.isArray(product.images)) {
                console.log('📸 Images array length:', product.images.length);
                product.images.forEach((img, i) => {
                    console.log(`📷 Image ${i}:`, img);
                    console.log(`📷 Image ${i} type:`, typeof img);
                    if (typeof img === 'object' && img) {
                        console.log(`📷 Image ${i} keys:`, Object.keys(img));
                    }
                });
            }
            
            // Generate and show content
            console.log('🎨 About to call generateProductDetailsHTML with product:', product);
            console.log('🔍 generateProductDetailsHTML function type:', typeof generateProductDetailsHTML);
            
            content.innerHTML = generateProductDetailsHTML(product);
            logger.log('✅ Product details loaded successfully with complete data');
            
            // Check if any [object Object] exists in the generated HTML
            const generatedHTML = content.innerHTML;
            if (generatedHTML.includes('[object Object]')) {
                console.error('❌ FOUND [object Object] IN GENERATED HTML!');
                console.log('🔍 HTML snippet with issue:', generatedHTML.substring(generatedHTML.indexOf('[object Object]') - 100, generatedHTML.indexOf('[object Object]') + 100));
            } else {
                console.log('✅ No [object Object] found in generated HTML');
            }
            
        } catch (error) {
            logger.error('Error loading product details:', error);
            content.innerHTML = `
                <div class="error-content">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Xatolik yuz berdi: ${error.message}</p>
                    <p class="text-muted">Product ID: ${productId}</p>
                </div>
            `;
            
            // Show modal even with error
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent body scroll
        }
    }

    // Modal functions are defined globally below - removed duplicate definitions

    /**
     * Extract product data from DOM elements
     */
    function extractProductDataFromDOM(productElement, productId) {
        logger.log(`🔍 Extracting product data from DOM for: ${productId}`);
        
        const product = {
            _id: productId,
            name: 'Noma\'lum mahsulot',
            code: 'N/A',
            price: 0,
            status: 'active',
            stockQuantity: 0,
            isPublished: false,
            createdAt: new Date().toISOString(),
            description: '',
            category: { name: 'Belgilanmagan' },
            images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjYWFhIj5NQUhTVUxPVDwvdGV4dD48L3N2Zz4=']
        };

        try {
            // Extract from table row
            if (productElement.tagName === 'TR') {
                const cells = productElement.querySelectorAll('td');
                
                // Product name (usually in first data cell)
                const nameCell = cells[1]; // Skip checkbox cell
                if (nameCell) {
                    const nameElement = nameCell.querySelector('.product-name, .table-product-name');
                    if (nameElement) product.name = nameElement.textContent.trim();
                }

                // Product code
                const codeElement = productElement.querySelector('.product-code, .table-product-code');
                if (codeElement) product.code = codeElement.textContent.trim();

                // Price
                const priceElement = productElement.querySelector('.product-price, .table-product-price');
                if (priceElement) {
                    const priceText = priceElement.textContent.replace(/[^\d.,]/g, '');
                    product.price = parseFloat(priceText.replace(',', '')) || 0;
                }

                // Status
                const statusElement = productElement.querySelector('.status-badge, .table-status');
                if (statusElement) {
                    if (statusElement.textContent.includes('Faol')) product.status = 'active';
                    else if (statusElement.textContent.includes('Nofaol')) product.status = 'inactive';
                    else if (statusElement.textContent.includes('Qoralama')) product.status = 'draft';
                }

                // Published status
                const publishedElement = productElement.querySelector('.marketplace-badge, .table-marketplace');
                if (publishedElement && publishedElement.textContent.includes('Sotuvda')) {
                    product.isPublished = true;
                }
            }
            
            // Extract from card
            else if (productElement.classList.contains('product-card')) {
                const nameElement = productElement.querySelector('.card-product-name, .product-name');
                if (nameElement) product.name = nameElement.textContent.trim();

                const codeElement = productElement.querySelector('.card-product-code, .product-code');
                if (codeElement) product.code = codeElement.textContent.trim();

                const priceElement = productElement.querySelector('.card-product-price, .product-price');
                if (priceElement) {
                    const priceText = priceElement.textContent.replace(/[^\d.,]/g, '');
                    product.price = parseFloat(priceText.replace(',', '')) || 0;
                }
            }

        } catch (error) {
            logger.error('Error extracting product data from DOM:', error);
        }

        logger.log('📦 Extracted product data:', product);
        return product;
    }

    /**
     * OLD FUNCTION - DISABLED - CAUSING [object Object] ISSUES
     * Generate comprehensive product details HTML - MARKETPLACE STYLE
     * Professional and Working Implementation
     */
    function generateProductDetailsHTML_OLD_DISABLED(product) {
        
        // Helper functions
        const formatPrice = (price) => {
            if (!price) return 'Narx so\'raladi';
            return new Intl.NumberFormat('uz-UZ', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0
            }).format(price);
        };
        
        const formatDate = (dateStr) => {
            if (!dateStr) return 'Noma\'lum';
            return new Date(dateStr).toLocaleDateString('uz-UZ', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };
        
        const getStatusBadge = (status) => {
            const statusMap = {
                'active': { class: 'success', text: 'Faol', icon: 'check-circle' },
                'inactive': { class: 'warning', text: 'Nofaol', icon: 'pause-circle' },
                'draft': { class: 'secondary', text: 'Qoralama', icon: 'edit' },
                'archived': { class: 'dark', text: 'Arxivlangan', icon: 'archive' }
            };
            const s = statusMap[status] || statusMap['active'];
            return `<span class="badge bg-${s.class}"><i class="fas fa-${s.icon}"></i> ${s.text}</span>`;
        };
        
        const getImages = () => {
            if (!product.images || !Array.isArray(product.images) || product.images.length === 0) {
                return [{
                    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PGcgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+PGNpcmNsZSBjeD0iMjAwIiBjeT0iMTIwIiByPSIyMCIgZmlsbD0iI2QxZDVkYiIvPjxyZWN0IHg9IjE2MCIgeT0iMTQwIiB3aWR0aD0iODAiIGhlaWdodD0iNDAiIGZpbGw9IiNkMWQ1ZGIiLz48dGV4dCB4PSIyMDAiIHk9IjIxMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iNTAwIj5SYXNtIHlvJ3E8L3RleHQ+PC9nPjwvc3ZnPg==',
                    alt: 'Rasm mavjud emas'
                }];
            }
            
            return product.images.map((img, index) => ({
                url: typeof img === 'string' ? img : (img.url || img.src || img),
                alt: `${product.name} - Rasm ${index + 1}`
            }));
        };
        
        const images = getImages();
        return `
            <div class="enterprise-product-details">
                <!-- Hero Section with Dynamic Background -->
                <div class="product-hero-section">
                    <div class="hero-background-overlay"></div>
                    <div class="container-fluid">
                        <div class="row align-items-center">
                            <div class="col-lg-4 col-md-5">
                                <div class="product-showcase">
                                    <div class="main-image-container">
                                        <img src="${(() => {
                                const firstImage = product.images && Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null;
                                if (firstImage && typeof firstImage === 'object' && firstImage.url) {
                                    return String(firstImage.url);
                                } else if (firstImage && typeof firstImage === 'string') {
                                    return String(firstImage);
                                } else {
                                    return '/images/placeholder-product.png';
                                }
                            })()}" 
                                             alt="${product.name}" 
                                             class="product-hero-image"
                                             onerror="console.log('❌ Hero image failed:', this.src); this.src='/images/placeholder-product.png'; this.onerror=null;"
                                             onclick="openImageZoom('${(() => {
                                const firstImage = product.images && Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null;
                                if (firstImage && typeof firstImage === 'object' && firstImage.url) {
                                    return String(firstImage.url);
                                } else if (firstImage && typeof firstImage === 'string') {
                                    return String(firstImage);
                                } else {
                                    return '/images/placeholder-product.png';
                                }
                            })()}')">
                                        <div class="image-overlay">
                                            <button class="zoom-btn" onclick="openImageZoom('${(() => {
                                const firstImage = product.images && Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null;
                                if (firstImage && typeof firstImage === 'object' && firstImage.url) {
                                    return String(firstImage.url);
                                } else if (firstImage && typeof firstImage === 'string') {
                                    return String(firstImage);
                                } else {
                                    return '/images/placeholder-product.png';
                                }
                            })()}')"
                                                <i class="fas fa-search-plus"></i>
                                            </button>
                                        </div>
                                        ${product.images && product.images.length > 1 ? `
                                            <div class="image-counter">
                                                <i class="fas fa-images"></i>
                                                +${product.images.length - 1}
                                            </div>
                                        ` : ''}
                                    </div>
                                    ${product.images && product.images.length > 1 ? `
                                        <div class="image-thumbnails">
                                            ${product.images.slice(0, 4).map((img, index) => {
                                                const imageUrl = (img && typeof img === 'object' && img.url) ? String(img.url) : 
                                                                (typeof img === 'string') ? String(img) : 
                                                                '/images/placeholder-product.png';
                                                return `
                                                <div class="thumbnail-item ${index === 0 ? 'active' : ''}" 
                                                     onclick="changeMainImage('${imageUrl}', ${index})">
                                                    <img src="${imageUrl}" alt="Thumbnail ${index + 1}" 
                                                         onerror="console.log('❌ Thumbnail failed:', this.src); this.src='/images/placeholder-product.png'; this.onerror=null;">
                                                </div>
                                            `;}).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            <div class="col-lg-8 col-md-7">
                                <div class="product-info-header">
                                    <div class="product-title-section">
                                        <h2 class="hero-title">${product.name}</h2>
                                        <div class="product-meta">
                                            <span class="product-id">
                                                <i class="fas fa-tag"></i>
                                                ID: ${product._id?.toString().slice(-8).toUpperCase() || 'N/A'}
                                            </span>
                                            <span class="product-code">
                                                <i class="fas fa-barcode"></i>
                                                ${product.code || 'Kod belgilanmagan'}
                                            </span>
                                            <span class="product-category">
                                                <i class="fas fa-folder"></i>
                                                ${product.category?.name || 'Kategoriyasiz'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div class="product-status-section">
                                        <div class="status-badges-container">
                                            <span class="status-badge-enhanced ${getStatusBadgeClass(product.status)}">
                                                <i class="fas ${getStatusIcon(product.status)}"></i>
                                                ${getStatusText(product.status)}
                                            </span>
                                            <span class="marketplace-badge-enhanced ${product.visibility === 'public' ? 'published' : 'unpublished'}">
                                                <i class="fas ${product.visibility === 'public' ? 'fa-globe' : 'fa-eye-slash'}"></i>
                                                ${product.visibility === 'public' ? 'Marketplace da' : 'Shaxsiy'}
                                            </span>
                                            <span class="stock-badge-enhanced ${getStockStatusClass(product.stockQuantity)}">
                                                <i class="fas fa-boxes"></i>
                                                ${getStockStatusText(product.stockQuantity)}
                                            </span>
                                        </div>
                                        
                                        <div class="price-section">
                                            <div class="main-price">
                                                <span class="price-label">Asosiy narx</span>
                                                <span class="price-value">${formatPriceWithCurrency(product.pricing?.basePrice || product.price || 0)}</span>
                                            </div>
                                            ${product.pricing?.discount > 0 ? `
                                                <div class="discount-info">
                                                    <span class="discount-badge">
                                                        <i class="fas fa-percentage"></i>
                                                        ${product.pricing.discount}% chegirma
                                                    </span>
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Advanced Tabbed Interface -->
                <div class="enterprise-content-tabs">
                    <div class="tabs-navigation">
                        <div class="nav nav-pills nav-justified enterprise-nav-pills" id="productTabs" role="tablist">
                            <button class="nav-link active" id="overview-tab" data-bs-toggle="pill" data-bs-target="#overview" type="button" role="tab">
                                <div class="tab-icon">
                                    <i class="fas fa-chart-pie"></i>
                                </div>
                                <div class="tab-content">
                                    <span class="tab-title">Umumiy ko'rinish</span>
                                    <span class="tab-subtitle">Asosiy ma'lumotlar</span>
                                </div>
                            </button>
                            <button class="nav-link" id="analytics-tab" data-bs-toggle="pill" data-bs-target="#analytics" type="button" role="tab">
                                <div class="tab-icon">
                                    <i class="fas fa-chart-line"></i>
                                </div>
                                <div class="tab-content">
                                    <span class="tab-title">Tahlil & Statistika</span>
                                    <span class="tab-subtitle">Performance metrics</span>
                                </div>
                            </button>
                            <button class="nav-link" id="details-tab" data-bs-toggle="pill" data-bs-target="#details" type="button" role="tab">
                                <div class="tab-icon">
                                    <i class="fas fa-list-alt"></i>
                                </div>
                                <div class="tab-content">
                                    <span class="tab-title">Tafsilotlar</span>
                                    <span class="tab-subtitle">Narx, zaxira, xususiyatlar</span>
                                </div>
                            </button>
                            <button class="nav-link" id="media-tab" data-bs-toggle="pill" data-bs-target="#media" type="button" role="tab">
                                <div class="tab-icon">
                                    <i class="fas fa-images"></i>
                                </div>
                                <div class="tab-content">
                                    <span class="tab-title">Media galereya</span>
                                    <span class="tab-subtitle">Rasmlar va fayllar</span>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    <div class="tab-content enterprise-tab-content" id="productTabsContent">
                        <!-- Overview Tab -->
                        <div class="tab-pane fade show active" id="overview" role="tabpanel">
                            <div class="overview-dashboard">
                                <!-- Quick Stats Row -->
                                <div class="quick-stats-row">
                                    <div class="row g-4">
                                        <div class="col-xl-3 col-lg-6 col-md-6">
                                            <div class="stat-card primary">
                                                <div class="stat-icon">
                                                    <i class="fas fa-eye"></i>
                                                </div>
                                                <div class="stat-details">
                                                    <h3 class="stat-number">${(product.analytics?.views || product.views || 0).toLocaleString()}</h3>
                                                    <p class="stat-label">Ko'rishlar</p>
                                                    <div class="stat-trend positive">
                                                        <i class="fas fa-arrow-up"></i>
                                                        <span>+12% bu oy</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-xl-3 col-lg-6 col-md-6">
                                            <div class="stat-card success">
                                                <div class="stat-icon">
                                                    <i class="fas fa-shopping-bag"></i>
                                                </div>
                                                <div class="stat-details">
                                                    <h3 class="stat-number">${(product.analytics?.totalOrders || product.totalOrders || 0).toLocaleString()}</h3>
                                                    <p class="stat-label">Buyurtmalar</p>
                                                    <div class="stat-trend positive">
                                                        <i class="fas fa-arrow-up"></i>
                                                        <span>+8% bu hafta</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-xl-3 col-lg-6 col-md-6">
                                            <div class="stat-card warning">
                                                <div class="stat-icon">
                                                    <i class="fas fa-coins"></i>
                                                </div>
                                                <div class="stat-details">
                                                    <h3 class="stat-number">${formatPriceWithCurrency(product.analytics?.totalRevenue || product.totalRevenue || 0)}</h3>
                                                    <p class="stat-label">Daromad</p>
                                                    <div class="stat-trend positive">
                                                        <i class="fas fa-arrow-up"></i>
                                                        <span>+15% bu oy</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-xl-3 col-lg-6 col-md-6">
                                            <div class="stat-card info">
                                                <div class="stat-icon">
                                                    <i class="fas fa-star"></i>
                                                </div>
                                                <div class="stat-details">
                                                    <h3 class="stat-number">${(product.analytics?.averageRating || 4.2).toFixed(1)}</h3>
                                                    <p class="stat-label">Reyting</p>
                                                    <div class="stat-trend positive">
                                                        <i class="fas fa-arrow-up"></i>
                                                        <span>+0.3 bu oy</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Detailed Information Cards -->
                                <div class="info-cards-grid">
                                    <div class="row g-4">
                                        <div class="col-lg-8">
                                            <div class="info-card primary-info">
                                                <div class="card-header">
                                                    <div class="header-icon">
                                                        <i class="fas fa-info-circle"></i>
                                                    </div>
                                                    <h5 class="card-title">Asosiy ma'lumotlar</h5>
                                                </div>
                                                <div class="card-body">
                                                    <div class="info-grid-enhanced">
                                                        <div class="info-row">
                                                            <div class="info-label">
                                                                <i class="fas fa-tag"></i>
                                                                Mahsulot ID
                                                            </div>
                                                            <div class="info-value">
                                                                <code>${product._id?.toString().slice(-8).toUpperCase() || 'N/A'}</code>
                                                                <button class="copy-btn" onclick="copyToClipboard('${product._id}')">
                                                                    <i class="fas fa-copy"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div class="info-row">
                                                            <div class="info-label">
                                                                <i class="fas fa-barcode"></i>
                                                                Mahsulot kodi
                                                            </div>
                                                            <div class="info-value">
                                                                <span class="product-code-display">${product.code || 'Belgilanmagan'}</span>
                                                            </div>
                                                        </div>
                                                        <div class="info-row">
                                                            <div class="info-label">
                                                                <i class="fas fa-folder"></i>
                                                                Kategoriya
                                                            </div>
                                                            <div class="info-value">
                                                                <span class="category-badge">${product.category?.name || 'Kategoriyasiz'}</span>
                                                            </div>
                                                        </div>
                                                        <div class="info-row">
                                                            <div class="info-label">
                                                                <i class="fas fa-calendar-plus"></i>
                                                                Yaratilgan
                                                            </div>
                                                            <div class="info-value">
                                                                <span class="date-display">${formatDate(product.createdAt)}</span>
                                                                <small class="text-muted ms-2">(${getRelativeTime(product.createdAt)})</small>
                                                            </div>
                                                        </div>
                                                        <div class="info-row">
                                                            <div class="info-label">
                                                                <i class="fas fa-edit"></i>
                                                                Oxirgi yangilanish
                                                            </div>
                                                            <div class="info-value">
                                                                <span class="date-display">${formatDate(product.updatedAt || product.createdAt)}</span>
                                                                <small class="text-muted ms-2">(${getRelativeTime(product.updatedAt || product.createdAt)})</small>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-lg-4">
                                            <div class="info-card status-info">
                                                <div class="card-header">
                                                    <div class="header-icon">
                                                        <i class="fas fa-chart-bar"></i>
                                                    </div>
                                                    <h5 class="card-title">Holat ma'lumotlari</h5>
                                                </div>
                                                <div class="card-body">
                                                    <div class="status-overview">
                                                        <div class="status-item">
                                                            <div class="status-label">Joriy holat</div>
                                                            <div class="status-value">
                                                                <span class="status-badge-modern ${getStatusBadgeClass(product.status)}">
                                                                    <i class="fas ${getStatusIcon(product.status)}"></i>
                                                                    ${getStatusText(product.status)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div class="status-item">
                                                            <div class="status-label">Marketplace</div>
                                                            <div class="status-value">
                                                                <span class="marketplace-badge-modern ${product.visibility === 'public' ? 'published' : 'unpublished'}">
                                                                    <i class="fas ${product.visibility === 'public' ? 'fa-globe' : 'fa-eye-slash'}"></i>
                                                                    ${product.visibility === 'public' ? 'Nashr etilgan' : 'Shaxsiy'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div class="status-item">
                                                            <div class="status-label">Zaxira holati</div>
                                                            <div class="status-value">
                                                                <span class="stock-badge-modern ${getStockStatusClass(product.stockQuantity)}">
                                                                    <i class="fas fa-boxes"></i>
                                                                    ${getStockStatusText(product.stockQuantity)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                ${product.description ? `
                                    <div class="info-card mt-3">
                                        <h6 class="info-card-title">
                                            <i class="fas fa-align-left"></i> Mahsulot ta'rifi
                                        </h6>
                                        <div class="product-description">
                                            ${product.description}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <!-- Pricing Tab -->
                        <div class="tab-pane fade" id="pricing" role="tabpanel">
                            <div class="pricing-content">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="pricing-card">
                                            <h6 class="pricing-card-title">
                                                <i class="fas fa-money-bill-wave"></i> Narx ma'lumotlari
                                            </h6>
                                            <div class="pricing-details">
                                                <div class="price-item main-price">
                                                    <span class="price-label">Asosiy narx:</span>
                                                    <span class="price-value">${formatPriceWithCurrency(product.pricing?.basePrice || product.price || 0)}</span>
                                                </div>
                                                <div class="price-item">
                                                    <span class="price-label">Minimal narx:</span>
                                                    <span class="price-value">${formatPriceWithCurrency(product.pricing?.minPrice || 0)}</span>
                                                </div>
                                                <div class="price-item">
                                                    <span class="price-label">Maksimal narx:</span>
                                                    <span class="price-value">${formatPriceWithCurrency(product.pricing?.maxPrice || 0)}</span>
                                                </div>
                                                <div class="price-item">
                                                    <span class="price-label">Chegirma:</span>
                                                    <span class="price-value">${product.pricing?.discount || 0}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="stock-card">
                                            <h6 class="stock-card-title">
                                                <i class="fas fa-boxes"></i> Zaxira ma'lumotlari
                                            </h6>
                                            <div class="stock-details">
                                                <div class="stock-item">
                                                    <span class="stock-label">Joriy zaxira:</span>
                                                    <span class="stock-value ${(product.stockQuantity || 0) < 10 ? 'low-stock' : 'normal-stock'}">
                                                        ${product.stockQuantity || 0} dona
                                                    </span>
                                                </div>
                                                <div class="stock-item">
                                                    <span class="stock-label">Minimal zaxira:</span>
                                                    <span class="stock-value">${product.minStock || 0} dona</span>
                                                </div>
                                                <div class="stock-item">
                                                    <span class="stock-label">O'lchov birligi:</span>
                                                    <span class="stock-value">${product.unit || 'Dona'}</span>
                                                </div>
                                                <div class="stock-item">
                                                    <span class="stock-label">Zaxira holati:</span>
                                                    <span class="stock-badge ${(product.stockQuantity || 0) > 10 ? 'in-stock' : (product.stockQuantity || 0) > 0 ? 'low-stock' : 'out-of-stock'}">
                                                        ${(product.stockQuantity || 0) > 10 ? 'Yetarli' : (product.stockQuantity || 0) > 0 ? 'Kam' : 'Tugagan'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Media Tab -->
                        <div class="tab-pane fade" id="media" role="tabpanel">
                            <div class="media-content">
                                <div class="images-gallery">
                                    ${generateImageGallery(product.images || [])}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Specifications Tab -->
                        <div class="tab-pane fade" id="specs" role="tabpanel">
                            <div class="specs-content">
                                ${generateSpecifications(product.specifications || product.attributes || {})}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Generate image gallery HTML
     */
    function generateImageGallery(images) {
        if (!images || images.length === 0) {
            return `
                <div class="no-images">
                    <i class="fas fa-image"></i>
                    <p>Rasmlar mavjud emas</p>
                </div>
            `;
        }
        
        return `
            <div class="gallery-grid">
                ${images.map((image, index) => `
                    <div class="gallery-item">
                        <img src="${image}" alt="Product image ${index + 1}" class="gallery-image">
                        <div class="gallery-overlay">
                            <button class="gallery-view-btn" onclick="viewImageFullscreen('${image}')">
                                <i class="fas fa-search-plus"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Generate specifications HTML
     */
    function generateSpecifications(specs) {
        if (!specs || Object.keys(specs).length === 0) {
            return `
                <div class="no-specs">
                    <i class="fas fa-cogs"></i>
                    <p>Xususiyatlar belgilanmagan</p>
                </div>
            `;
        }
        
        return `
            <div class="specs-grid">
                ${Object.entries(specs).map(([key, value]) => `
                    <div class="spec-item">
                        <span class="spec-label">${key}:</span>
                        <span class="spec-value">${value}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Show delete confirmation modal
     */
    function showDeleteModal(productId) {
        logger.log(`🗑️ Showing delete modal for product: ${productId}`);
        
        const modal = document.getElementById('deleteProductModal');
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        const productInfo = document.getElementById('deleteProductInfo');
        
        // Find product data from DOM
        const productElement = document.querySelector(`[data-product-id="${productId}"]`);
        if (productElement) {
            const productName = productElement.querySelector('.product-name')?.textContent || 'Noma\'lum mahsulot';
            const productCode = productElement.querySelector('.product-code')?.textContent || '';
            
            productInfo.innerHTML = `
                <div class="product-info-item">
                    <span class="product-info-label">Nomi:</span>
                    <span class="product-info-value">${productName}</span>
                </div>
                <div class="product-info-item">
                    <span class="product-info-label">Kod:</span>
                    <span class="product-info-value">${productCode}</span>
                </div>
            `;
        }
        
        // Set up delete confirmation
        confirmBtn.onclick = () => handleDeleteConfirm(productId);
        
        showModal('deleteProductModal');
    }

    /**
     * Handle delete confirmation
     */
    async function handleDeleteConfirm(productId) {
        logger.log(`🗑️ Confirming delete for product: ${productId}`);
        
        try {
            showToast('Mahsulot o\'chirilmoqda...', 'info');
            
            const response = await fetch(`/api/manufacturer/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getCookie('accessToken')}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to delete product');
            
            hideModal('deleteProductModal');
            showToast('Mahsulot muvaffaqiyatli o\'chirildi', 'success');
            
            // Remove product from DOM
            const productElement = document.querySelector(`[data-product-id="${productId}"]`);
            if (productElement) {
                productElement.remove();
            }
            
            // Update statistics
            await refreshProductStats();
            
        } catch (error) {
            logger.error('Error deleting product:', error);
            showToast('Mahsulotni o\'chirishda xatolik yuz berdi', 'error');
        }
    }

    /**
     * Show marketplace publish modal
     */
    function showMarketplaceModal(productId) {
        logger.log(`🏪 Showing marketplace modal for product: ${productId}`);
        
        const productIdInput = document.getElementById('marketplaceProductId');
        if (productIdInput) {
            productIdInput.value = productId;
        }
        
        // Show modal using our utility function
        showModal('marketplaceModal');
    }

    /**
     * Handle marketplace form submission
     */
    async function handleMarketplaceSubmit(event, productId, modal) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            showToast('Mahsulot sotuvga chiqarilmoqda...', 'info');
            
            const response = await fetch(`/api/manufacturer/products/${productId}/publish`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getCookie('accessToken')}`
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) throw new Error('Failed to publish product');
            
            modal.hide();
            showToast('Mahsulot sotuvga muvaffaqiyatli chiqarildi', 'success');
            
            // Refresh page to show updated status
            window.location.reload();
            
        } catch (error) {
            logger.error('Error publishing product:', error);
            showToast('Mahsulotni sotuvga chiqarishda xatolik yuz berdi', 'error');
        }
    }

    /**
     * Show duplicate product modal
     */
    function showDuplicateModal(productId) {
        logger.log(`📋 Showing duplicate modal for product: ${productId}`);
        
        const productIdInput = document.getElementById('duplicateProductId');
        const nameInput = document.getElementById('duplicateName');
        const codeInput = document.getElementById('duplicateCode');
        
        if (productIdInput) {
            productIdInput.value = productId;
        }
        
        // Pre-fill with original product data + suffix
        const productElement = document.querySelector(`[data-product-id="${productId}"]`);
        if (productElement && nameInput && codeInput) {
            const originalName = productElement.querySelector('.product-name, .table-product-name')?.textContent || '';
            const originalCode = productElement.querySelector('.product-code, .table-product-code')?.textContent || '';
            
            nameInput.value = originalName + ' (Nusxa)';
            codeInput.value = originalCode + '_copy';
        }
        
        // Show modal using our utility function
        showModal('duplicateModal');
    }

    /**
     * Handle duplicate form submission
     */
    async function handleDuplicateSubmit(event, productId, modal) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            showToast('Mahsulot nusxalanmoqda...', 'info');
            
            const response = await fetch(`/api/manufacturer/products/${productId}/duplicate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getCookie('accessToken')}`
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) throw new Error('Failed to duplicate product');
            
            const result = await response.json();
            
            modal.hide();
            showToast('Mahsulot muvaffaqiyatli nusxalandi', 'success');
            
            // Redirect to edit the new product
            window.location.href = `/manufacturer/products/edit/${result.newProductId}`;
            
        } catch (error) {
            logger.error('Error duplicating product:', error);
            showToast('Mahsulotni nusxalashda xatolik yuz berdi', 'error');
        }
    }

    /**
     * Show analytics modal
     */
    async function showAnalyticsModal(productId) {
        logger.log(`📊 Showing analytics modal for product: ${productId}`);
        
        const modal = new bootstrap.Modal(document.getElementById('analyticsModal'));
        const content = document.getElementById('analyticsContent');
        
        // Show loading state
        content.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Analitika yuklanmoqda...</span>
                </div>
                <p class="mt-2">Analitika ma'lumotlari yuklanmoqda...</p>
            </div>
        `;
        
        modal.show();
        
        try {
            const response = await fetch(`/api/manufacturer/products/${productId}/analytics`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getCookie('accessToken')}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch analytics');
            
            const analytics = await response.json();
            
            // Generate analytics content
            content.innerHTML = generateAnalyticsHTML(analytics);
            
        } catch (error) {
            logger.error('Error loading analytics:', error);
            content.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    Analitika ma'lumotlarini yuklashda xatolik yuz berdi.
                </div>
            `;
        }
    }

    /**
     * Generate analytics HTML
     */
    function generateAnalyticsHTML(analytics) {
        return `
            <div class="row">
                <div class="col-md-3">
                    <div class="text-center">
                        <h3 class="text-primary">${analytics.views || 0}</h3>
                        <p>Ko'rishlar</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="text-center">
                        <h3 class="text-success">${analytics.orders || 0}</h3>
                        <p>Buyurtmalar</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="text-center">
                        <h3 class="text-info">${analytics.inquiries || 0}</h3>
                        <p>So'rovlar</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="text-center">
                        <h3 class="text-warning">${analytics.revenue || 0}</h3>
                        <p>Daromad (UZS)</p>
                    </div>
                </div>
            </div>
            <hr>
            <div class="chart-container">
                <canvas id="productAnalyticsChart" width="400" height="200"></canvas>
            </div>
        `;
    }

    /**
     * Show status change modal
     */
    function showStatusChangeModal(productId) {
        logger.log(`🔄 Showing status change modal for product: ${productId}`);
        
        const productIdInput = document.getElementById('statusProductId');
        if (productIdInput) {
            productIdInput.value = productId;
        }
        
        // Show modal using our utility function
        showModal('statusChangeModal');
    }

    /**
     * Handle status change form submission
     */
    async function handleStatusChangeSubmit(event, productId, modal) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            showToast('Mahsulot holati o\'zgartirilmoqda...', 'info');
            
            const response = await fetch(`/api/manufacturer/products/${productId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getCookie('accessToken')}`
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) throw new Error('Failed to change status');
            
            modal.hide();
            showToast('Mahsulot holati muvaffaqiyatli o\'zgartirildi', 'success');
            
            // Refresh page to show updated status
            window.location.reload();
            
        } catch (error) {
            logger.error('Error changing status:', error);
            showToast('Mahsulot holatini o\'zgartirishda xatolik yuz berdi', 'error');
        }
    }
    
    /**
     * Handle product edit
     */
    function handleEditProduct(productId) {
        logger.log(`✏️ Editing product: ${productId}`);
        window.location.href = `/manufacturer/products/edit/${productId}`;
    }

    // ===============================================
    //           UTILITY FUNCTIONS
    // ===============================================

    /**
     * Get status badge class
     */
    function getStatusBadgeClass(status) {
        const statusClasses = {
            active: 'bg-success',
            inactive: 'bg-secondary',
            draft: 'bg-warning',
            archived: 'bg-dark'
        };
        return statusClasses[status] || 'bg-secondary';
    }

    /**
     * Get status text
     */
    function getStatusText(status) {
        const statusTexts = {
            active: 'Faol',
            inactive: 'Nofaol',
            draft: 'Qoralama',
            archived: 'Arxivlangan',
            discontinued: 'To\'xtatilgan'
        };
        return statusTexts[status] || 'Noma\'lum';
    }

    /**
     * Get status icon
     */
    function getStatusIcon(status) {
        const statusIcons = {
            active: 'fa-check-circle',
            inactive: 'fa-pause-circle',
            draft: 'fa-edit',
            archived: 'fa-archive',
            discontinued: 'fa-ban'
        };
        return statusIcons[status] || 'fa-question-circle';
    }

    /**
     * Get stock status class
     */
    function getStockStatusClass(stockQuantity) {
        const stock = parseInt(stockQuantity) || 0;
        if (stock > 50) return 'high-stock';
        if (stock > 10) return 'medium-stock';
        if (stock > 0) return 'low-stock';
        return 'out-of-stock';
    }

    /**
     * Get stock status text
     */
    function getStockStatusText(stockQuantity) {
        const stock = parseInt(stockQuantity) || 0;
        if (stock > 50) return `${stock} dona - Yetarli`;
        if (stock > 10) return `${stock} dona - O'rta`;
        if (stock > 0) return `${stock} dona - Kam`;
        return 'Tugagan';
    }

    /**
     * Get relative time
     */
    function getRelativeTime(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now - date;
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        
        if (diffInDays > 30) return `${Math.floor(diffInDays / 30)} oy oldin`;
        if (diffInDays > 0) return `${diffInDays} kun oldin`;
        if (diffInHours > 0) return `${diffInHours} soat oldin`;
        if (diffInMinutes > 0) return `${diffInMinutes} daqiqa oldin`;
        return 'Hozir';
    }

    /**
     * Copy to clipboard utility
     */
    window.copyToClipboard = function(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Clipboard ga nusxalandi', 'success');
        }).catch(() => {
            showToast('Nusxalashda xatolik', 'error');
        });
    };

    /**
     * Open image zoom
     */
    window.openImageZoom = function(imageSrc) {
        const modal = document.createElement('div');
        modal.className = 'image-zoom-modal';
        modal.innerHTML = `
            <div class="zoom-backdrop" onclick="this.parentElement.remove()">
                <div class="zoom-container">
                    <img src="${imageSrc}" alt="Zoomed view" class="zoom-image">
                    <button class="zoom-close" onclick="this.closest('.image-zoom-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="zoom-controls">
                        <button class="zoom-control" onclick="zoomImage(this, 'in')">
                            <i class="fas fa-search-plus"></i>
                        </button>
                        <button class="zoom-control" onclick="zoomImage(this, 'out')">
                            <i class="fas fa-search-minus"></i>
                        </button>
                        <button class="zoom-control" onclick="zoomImage(this, 'reset')">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    /**
     * Change main image in modal
     */
    window.changeMainImage = function(imageSrc, index) {
        const mainImage = document.querySelector('.product-hero-image');
        if (mainImage) {
            mainImage.src = imageSrc;
            
            // Update active thumbnail
            const thumbnails = document.querySelectorAll('.thumbnail-item');
            thumbnails.forEach((thumb, i) => {
                thumb.classList.toggle('active', i === index);
            });
        }
    };

    /**
     * Zoom image controls
     */
         window.zoomImage = function(button, action) {
         const img = button.closest('.zoom-container').querySelector('.zoom-image');
         const currentScale = parseFloat(img.dataset.scale || '1');
         
         let newScale = currentScale;
         switch (action) {
             case 'in':
                 newScale = Math.min(currentScale * 1.2, 3);
                 break;
             case 'out':
                 newScale = Math.max(currentScale / 1.2, 0.5);
                 break;
             case 'reset':
                 newScale = 1;
                 break;
         }
         
         img.style.transform = `scale(${newScale})`;
         img.dataset.scale = newScale;
     };

     // Old backdrop handler removed - will be rewritten

     /**
      * Enhanced modal system with backdrop support and animations
      */
     function initializeModalSystem() {
         // Add escape key handler
         document.addEventListener('keydown', function(event) {
             if (event.key === 'Escape') {
                 const activeModal = document.querySelector('.modal.show, .modal[style*="display: block"]');
                 if (activeModal) {
                     const modalId = activeModal.id;
                     logger.log('⌨️ Escape key pressed, closing modal:', modalId);
                     handleBackdropClick({ target: activeModal, currentTarget: activeModal });
                 }
             }
         });

         // Add focus trap for accessibility
         document.addEventListener('focusin', function(event) {
             const activeModal = document.querySelector('.modal.show, .modal[style*="display: block"]');
             if (activeModal && !activeModal.contains(event.target)) {
                 const firstFocusable = activeModal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                 if (firstFocusable) {
                     firstFocusable.focus();
                 }
             }
         });

         // Add professional modal animations
         const modals = document.querySelectorAll('.modal');
         modals.forEach(modal => {
             modal.addEventListener('show.bs.modal', function() {
                 this.style.animation = 'modalFadeIn 0.3s ease-out';
             });
             
             modal.addEventListener('hide.bs.modal', function() {
                 this.style.animation = 'modalFadeOut 0.2s ease-in';
             });
         });

         logger.log('✅ Professional modal system initialized with backdrop and keyboard support');
     }

     // Old modal functions removed - will be rewritten professionally

     // Initialize modal system - will be called from main init
     function initModalSystemOnReady() {
         initializeModalSystem();
         logger.log('🚀 Professional modal system ready');
     }

    /**
     * Format price with 2 decimal places (2.34 format)
     */
    function formatPrice(price) {
        if (!price && price !== 0) return '0.00';
        
        const numPrice = parseFloat(price);
        if (isNaN(numPrice)) return '0.00';
        
        // Format with exactly 2 decimal places
        return numPrice.toFixed(2);
    }

    /**
     * Format price with currency (for display)
     */
    function formatPriceWithCurrency(price) {
        return formatPrice(price) + ' UZS';
    }

    /**
     * Format date
     */
    function formatDate(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('uz-UZ', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Get cookie value
     */
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    /**
     * Refresh product statistics
     */
    async function refreshProductStats() {
        try {
            const response = await fetch('/api/manufacturer/products/stats', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getCookie('accessToken')}`
                }
            });
            
            if (response.ok) {
                const stats = await response.json();
                updateStatsDisplay(stats);
            }
        } catch (error) {
            logger.error('Error refreshing stats:', error);
        }
    }

    /**
     * Update stats display
     */
    function updateStatsDisplay(stats) {
        const statElements = {
            totalProducts: document.querySelector('[data-kpi="totalProducts"] .metric-value'),
            activeProducts: document.querySelector('[data-kpi="activeProducts"] .metric-value'),
            marketplaceProducts: document.querySelector('[data-kpi="marketplaceProducts"] .metric-value'),
            draftProducts: document.querySelector('[data-kpi="draftProducts"] .metric-value')
        };

        if (statElements.totalProducts) statElements.totalProducts.textContent = stats.totalProducts || 0;
        if (statElements.activeProducts) statElements.activeProducts.textContent = stats.activeProducts || 0;
        if (statElements.marketplaceProducts) statElements.marketplaceProducts.textContent = stats.marketplaceProducts || 0;
        if (statElements.draftProducts) statElements.draftProducts.textContent = stats.draftProducts || 0;
    }

    // ===============================================
    //    PROFESSIONAL DROPDOWN SYSTEM
    //    Senior Software Engineer Implementation
    // ===============================================

    /**
     * Professional Dropdown System Handler - FIXED
     * Handles all dropdown interactions with proper event delegation
     */
    function handleDropdownSystem(event) {
        const target = event.target;
        
        // Get the actual clicked element (button or icon inside button)
        const clickedButton = target.closest('button');
        
        if (!clickedButton) {
            // Close dropdowns when clicking outside
            if (!target.closest('.table-more-actions')) {
                closeAllDropdowns();
            }
            return false;
        }

        logger.log('🖱️ Button clicked:', clickedButton.className);

        // Handle dropdown toggle buttons
        if (clickedButton.classList.contains('dropdown-toggle')) {
            logger.log('🔽 Dropdown toggle button detected');
            handleDropdownToggle(event, clickedButton);
            return;
        }

        // Handle dropdown menu item actions
        if (clickedButton.classList.contains('table-more-item')) {
            logger.log('🎬 Dropdown action item detected');
            handleDropdownAction(event, clickedButton);
            return;
        }

        // Close dropdowns when clicking other buttons
        if (!clickedButton.closest('.table-more-actions')) {
            closeAllDropdowns();
        }
    }

    /**
     * Handle dropdown toggle with advanced logic - ENHANCED
     */
    function handleDropdownToggle(event, toggleButton) {
        const timer = PerformanceMonitor.startTimer('dropdownOperations');
        
        try {
            event.preventDefault();
            event.stopPropagation();

            logger.log('🔽 Dropdown toggle clicked');

            // Validate inputs
            if (!toggleButton) {
                throw new Error('Toggle button is required');
            }

            // Find the dropdown container and menu
            const dropdownContainer = toggleButton.closest('.table-more-actions');
            if (!dropdownContainer) {
                throw new Error('Dropdown container not found - check HTML structure');
            }

            const dropdownMenu = dropdownContainer.querySelector('.table-more-menu');
            if (!dropdownMenu) {
                throw new Error('Dropdown menu not found - check HTML structure');
            }

            const productId = toggleButton.dataset.productId;
            if (!productId) {
                logger.warn('⚠️ Product ID not found on toggle button');
            }
            
            logger.log(`🎯 Toggle dropdown for product: ${productId}`);

            // Close all other dropdowns first
            closeAllDropdowns(dropdownMenu);

            // Toggle current dropdown with animation
            const isHidden = dropdownMenu.classList.contains('hidden');
            
            if (isHidden) {
                // Open dropdown with proper sequence
                dropdownMenu.classList.remove('hidden');
                
                // Force reflow for animation
                dropdownMenu.offsetHeight;
                
                dropdownMenu.classList.add('dropdown-open');
                toggleButton.classList.add('dropdown-active');
                
                // Add accessibility attributes
                toggleButton.setAttribute('aria-expanded', 'true');
                dropdownMenu.setAttribute('aria-hidden', 'false');
                
                // Focus management for keyboard accessibility
                const firstItem = dropdownMenu.querySelector('.table-more-item');
                if (firstItem) {
                    firstItem.focus();
                }
                
                logger.log('✅ Dropdown opened successfully');
            } else {
                // Close dropdown
                closeDropdown(dropdownMenu, toggleButton);
            }
            
        } catch (error) {
            ErrorBoundary.handleError(error, 'dropdown');
        } finally {
            timer.end();
        }
        
        return true; // Dropdown action was handled
    }

    /**
     * Handle dropdown action items
     */
    function handleDropdownAction(event, actionButton) {
        event.preventDefault();
        event.stopPropagation();

        const action = actionButton.dataset.action;
        const productId = actionButton.dataset.productId;

        if (!action || !productId) {
            logger.error('❌ Missing action or productId in dropdown item');
            return;
        }

        logger.log(`🎬 Dropdown action triggered: ${action} for product: ${productId}`);

        // Close dropdown after action
        const dropdownMenu = actionButton.closest('.table-more-menu');
        const toggleButton = actionButton.closest('.table-more-actions')?.querySelector('.dropdown-toggle');
        
        if (dropdownMenu && toggleButton) {
            closeDropdown(dropdownMenu, toggleButton);
        }

        // Execute the action using existing action handler
        executeProductAction(action, productId);
    }

    /**
     * Close all dropdowns except the specified one
     */
    function closeAllDropdowns(exceptMenu = null) {
        document.querySelectorAll('.table-more-menu').forEach(menu => {
            if (menu !== exceptMenu && !menu.classList.contains('hidden')) {
                const container = menu.closest('.table-more-actions');
                const toggle = container?.querySelector('.dropdown-toggle');
                closeDropdown(menu, toggle);
            }
        });
    }

    /**
     * Close a specific dropdown with proper cleanup
     */
    function closeDropdown(menu, toggleButton) {
        if (!menu) return;

        menu.classList.add('hidden');
        menu.classList.remove('dropdown-open');
        menu.setAttribute('aria-hidden', 'true');

        if (toggleButton) {
            toggleButton.classList.remove('dropdown-active');
            toggleButton.setAttribute('aria-expanded', 'false');
        }

        logger.log('🔽 Dropdown closed');
    }

    /**
     * Execute product action with enhanced error handling
     */
    function executeProductAction(action, productId) {
        try {
            switch (action) {
                case 'view':
                    showProductDetailsModal(productId);
                    break;
                case 'edit':
                    handleEditProduct(productId);
                    break;
                case 'analytics':
                    handleProductAnalytics(productId);
                    break;
                case 'publish':
                    showMarketplaceModal(productId);
                    break;
                case 'unpublish':
                    handleMarketplaceToggle(productId, 'unpublish');
                    break;
                case 'duplicate':
                    showDuplicateModal(productId);
                    break;
                case 'status-change':
                    showStatusChangeModal(productId);
                    break;
                case 'archive':
                    handleArchiveProduct(productId);
                    break;
                case 'delete':
                    showDeleteModal(productId);
                    break;
                default:
                    logger.warn(`❌ Unknown action: ${action}`);
                    showToast(`Noma'lum amal: ${action}`, 'error');
            }
        } catch (error) {
            logger.error('❌ Error executing product action:', error);
            showToast('Amalni bajarishda xatolik yuz berdi', 'error');
        }
    }

    /**
     * Global click handler to close dropdowns when clicking outside
     */
    // Dropdown closing is now handled in unified click handler

    /**
     * Handle product analytics
     */
    function handleProductAnalytics(productId) {
        logger.log(`📊 Viewing analytics for product: ${productId}`);
        window.location.href = `/manufacturer/analytics?product=${productId}`;
    }

    /**
     * Handle product archive
     */
    async function handleArchiveProduct(productId) {
        logger.log(`📦 Archiving product: ${productId}`);
        
        if (!confirm('Ushbu mahsulotni arxivlashni xohlaysizmi?')) {
            return;
        }
        
        try {
            showToast('Mahsulot arxivlanmoqda...', 'info');
            
            const response = await fetch(`/api/manufacturer/products/${productId}/archive`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getCookie('accessToken')}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to archive product');
            
            showToast('Mahsulot muvaffaqiyatli arxivlandi', 'success');
            
            // Refresh page to show updated status
            window.location.reload();
            
        } catch (error) {
            logger.error('Error archiving product:', error);
            showToast('Mahsulotni arxivlashda xatolik yuz berdi', 'error');
        }
    }

    /**
     * Handle marketplace toggle (publish/unpublish)
     */
    async function handleMarketplaceToggle(productId, action = 'toggle') {
        logger.log(`🏪 Marketplace ${action} for product: ${productId}`);
        
        try {
            const actionText = action === 'publish' ? 'sotuvga chiqarilmoqda' : 'sotuvdan olib tashlanmoqda';
            showToast(`Mahsulot ${actionText}...`, 'info');
            
            const response = await fetch(`/api/manufacturer/products/${productId}/marketplace`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getCookie('accessToken')}`
                },
                body: JSON.stringify({ action })
            });
            
            if (!response.ok) throw new Error('Failed to toggle marketplace status');
            
            const successText = action === 'publish' ? 'sotuvga chiqarildi' : 'sotuvdan olib tashlandi';
            showToast(`Mahsulot muvaffaqiyatli ${successText}`, 'success');
            
            // Refresh page to show updated status
            window.location.reload();
            
        } catch (error) {
            logger.error('Error toggling marketplace status:', error);
            showToast('Marketplace holatini o\'zgartirishda xatolik yuz berdi', 'error');
        }
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
                }, 1500);
                
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
                
                // Remove product from both views
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
                
                // Remove product from both views with animation
                const elements = document.querySelectorAll(`[data-product-id="${productId}"]`);
                elements.forEach(element => {
                    element.style.transform = 'scale(0)';
                    element.style.opacity = '0';
                    setTimeout(() => {
                        element.remove();
                    }, 300);
                });
                
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

    // Include all other utility functions from original file...
    // (showToast, handleBulkActionsModal, updateStatisticsDisplay, etc.)

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
        
        // Auto remove with animation
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('removing');
                setTimeout(() => {
                    if (toast.parentElement) {
                        toast.remove();
                    }
                }, 300);
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

    // Old modal functions removed - will be rewritten professionally

    /**
     * Handle modal close - Enhanced for Professional Modal System
     */
    function handleModalClose(event) {
        const target = event.target;
        
        console.log('🔍 handleModalClose called with target:', {
            target: target,
            targetClasses: target.className,
            targetId: target.id
        });
        
        // Handle close button clicks
        if (target.classList.contains('btn-close') || target.classList.contains('modal-close-btn')) {
            const modal = target.closest('.professional-product-modal');
            if (modal && modalManager.activeModals.has(modal.id)) {
                console.log('🚨 CLOSE BUTTON CLICKED - CLOSING MODAL:', modal.id);
                event.preventDefault();
                event.stopPropagation();
                modalManager.hide(modal.id);
                return true;
            }
        }
        
        // Handle backdrop clicks (fallback) - COMMENTED OUT TO PREVENT CONFLICT
        /*
        if (target.classList.contains('professional-product-modal')) {
            const modalId = target.id;
            if (modalId && modalManager.activeModals.has(modalId)) {
                console.log('🚨 BACKDROP CLICK VIA handleModalClose - CLOSING:', modalId);
                event.preventDefault();
                event.stopPropagation();
                modalManager.hide(modalId);
                return true;
            }
        }
        */
        
        console.log('✅ handleModalClose - no action taken');
        return false;
    }

    /**
     * Handle more actions dropdown toggle
     */
    function handleMoreActionsToggle(event) {
        const target = event.target.closest('.card-more-toggle, .table-action-btn[title="Boshqa amallar"]');
        
        if (target && (target.classList.contains('card-more-toggle') || target.title === 'Boshqa amallar')) {
            event.stopPropagation();
            const menu = target.parentElement.querySelector('.card-more-menu, .table-more-menu');
            
            if (menu) {
                // Close all other menus
                document.querySelectorAll('.card-more-menu, .table-more-menu').forEach(m => {
                    if (m !== menu) m.classList.add('hidden');
                });
                
                // Toggle current menu
                menu.classList.toggle('hidden');
            }
        } else {
            // Close all menus when clicking outside
            document.querySelectorAll('.card-more-menu, .table-more-menu').forEach(m => {
                m.classList.add('hidden');
            });
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
                    updateMarketplaceStatus(productId, action);
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
     * Clear product selection
     */
    function clearProductSelection() {
        selectedProducts.clear();
        
        // Update UI
        document.querySelectorAll('.product-card.selected, tbody tr.selected').forEach(element => {
            element.classList.remove('selected');
        });
        
        document.querySelectorAll('.table-checkbox, .card-select-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        if (DOM.selectAllCheckbox) {
            DOM.selectAllCheckbox.checked = false;
            DOM.selectAllCheckbox.indeterminate = false;
        }
        
        updateSelectionUI();
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
        const card = document.querySelector(`[data-metric="${metric}"] .products-stat-value`);
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
     * Initialize animations
     */
    function initializeAnimations() {
        // Stagger product card animations
        const productCards = document.querySelectorAll('.product-card.card-fade-in');
        productCards.forEach((card, index) => {
            const delay = card.dataset.animationDelay || (index * 0.1);
            card.style.animationDelay = `${delay}s`;
        });
        
        // Stats cards animation
        const statCards = document.querySelectorAll('.products-stat-card');
        statCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('animate-fade-in');
        });
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
            
            // V key to toggle view
            if (event.key === 'v' && !event.ctrlKey && !event.metaKey) {
                const newView = currentView === 'card' ? 'table' : 'card';
                switchView(newView);
                localStorage.setItem('products-view-preference', newView);
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
        
        // Check every 5 minutes if user is inactive for 15 minutes
        setInterval(() => {
            const inactiveTime = Date.now() - lastActivity;
            if (inactiveTime > 15 * 60 * 1000) { // 15 minutes
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


    // Export for global access if needed
    window.ProductsManagementEnhanced = {
        showToast,
        applyFilters,
        switchView,
        refreshProducts: handleRefreshProducts,
        logger,
        selectedProducts,
        currentView
    };
    
    // =====================================================
    // PROFESSIONAL MODAL SYSTEM - ENTERPRISE EDITION
    // Senior Software Engineer Implementation
    // =====================================================
    
    /**
     * Professional Modal Manager Class
     * Handles all modal operations with enterprise-grade features
     */
    class ProfessionalModalManager {
        constructor() {
            this.activeModals = new Set();
            this.modalStack = [];
            this.animations = {
                duration: 300,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            };
            this.config = {
                closeOnBackdrop: true,
                closeOnEscape: true,
                preventBodyScroll: true,
                focusTrap: true
            };
            
            this.init();
            logger.log('🚀 Professional Modal Manager initialized');
        }
        
        /**
         * Initialize modal system with global event handlers
         */
        init() {
            // Global escape key handler
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.config.closeOnEscape) {
                    this.closeTopModal();
                }
            });
            
            // Prevent multiple initialization
            if (window.modalManagerInitialized) return;
            window.modalManagerInitialized = true;
        }
        
        /**
         * Show modal with professional animations and backdrop
         */
        async show(modalId, options = {}) {
            try {
                const modal = document.getElementById(modalId);
                if (!modal) {
                    logger.error(`❌ Modal not found: ${modalId}`);
                    return false;
                }
                
                // Merge options with defaults
                const config = { ...this.config, ...options };
                
                logger.log(`🎯 Opening modal: ${modalId}`);
                
                // Close any existing modal of same type
                if (this.activeModals.has(modalId)) {
                    await this.hide(modalId);
                }
                
                // Prepare modal for display (no separate backdrop)
                this.prepareModal(modal, modalId);
                
                // Add to active modals tracking
                this.activeModals.add(modalId);
                this.modalStack.push(modalId);
                
                // Apply body modifications
                if (config.preventBodyScroll) {
                    document.body.style.overflow = 'hidden';
                    document.body.classList.add('modal-open');
                }
                
                // Animate modal in
                await this.animateIn(modal);
                
                console.log(`✅ Modal animation completed: ${modalId}`);
                console.log('Modal element state:', {
                    id: modal.id,
                    display: modal.style.display,
                    opacity: modal.style.opacity,
                    classes: modal.className,
                    isVisible: modal.offsetParent !== null
                });
                
                // Set up focus trap
                if (config.focusTrap) {
                    this.setupFocusTrap(modal);
                }
                
                // Dispatch custom event
                modal.dispatchEvent(new CustomEvent('modal:shown', { 
                    detail: { modalId, manager: this } 
                }));
                
                logger.log(`✅ Modal opened successfully: ${modalId}`);
                
                // Add a delayed check to see if modal is still open
                setTimeout(() => {
                    if (this.activeModals.has(modalId)) {
                        console.log(`✅ Modal still open after 1 second: ${modalId}`);
            } else {
                        console.log(`❌ Modal was closed within 1 second: ${modalId}`);
                    }
                }, 1000);
                
                return true;
                
            } catch (error) {
                logger.error(`❌ Error opening modal ${modalId}:`, error);
                return false;
            }
        }
        
        /**
         * Hide modal with animations
         */
        async hide(modalId) {
            try {
                console.log(`🚨 HIDE CALLED FOR MODAL: ${modalId}`);
                console.trace('Modal hide call stack:');
                
                const modal = document.getElementById(modalId);
                if (!modal || !this.activeModals.has(modalId)) {
                    console.log(`❌ Modal not found or not active: ${modalId}`);
                    return false;
                }
                
                logger.log(`🎯 Closing modal: ${modalId}`);
                
                // Dispatch custom event
                modal.dispatchEvent(new CustomEvent('modal:hiding', { 
                    detail: { modalId, manager: this } 
                }));
                
                // Animate out
                await this.animateOut(modal);
                
                // Clean up modal
                this.cleanupModal(modal, modalId);
                
                // Remove from tracking
                this.activeModals.delete(modalId);
                this.modalStack = this.modalStack.filter(id => id !== modalId);
                
                // Restore body if no modals active
                if (this.activeModals.size === 0) {
                    document.body.style.overflow = '';
                    document.body.classList.remove('modal-open');
                }
                
                // Dispatch hidden event
                modal.dispatchEvent(new CustomEvent('modal:hidden', { 
                    detail: { modalId, manager: this } 
                }));
                
                logger.log(`✅ Modal closed successfully: ${modalId}`);
                return true;
                
            } catch (error) {
                logger.error(`❌ Error closing modal ${modalId}:`, error);
                return false;
            }
        }
        
        // Backdrop functionality is now integrated into modal container itself
        
        /**
         * Prepare modal for professional display
         */
        prepareModal(modal, modalId) {
            // Ensure modal has proper structure
            modal.classList.add('professional-modal-active');
            
            // Fix ARIA accessibility
            modal.removeAttribute('aria-hidden');
            modal.setAttribute('aria-modal', 'true');
            
            // Add backdrop click handler directly to modal with detailed debugging
            modal.addEventListener('click', (e) => {
                console.log('🔍 Modal click event:', {
                    target: e.target,
                    currentTarget: e.currentTarget,
                    modal: modal,
                    isModalItself: e.target === modal,
                    targetClasses: e.target.className,
                    modalId: modalId
                });
                
                // Only close if clicking the modal container itself, not child elements
                if (e.target === modal) {
                    console.log(`🚨 MODAL BACKDROP CLICKED - CLOSING: ${modalId}`);
                    logger.log(`🎯 Modal backdrop clicked: ${modalId}`);
                    this.hide(modalId);
            } else {
                    console.log('✅ Click on child element - NOT closing modal');
                }
            });
            
            // Set professional positioning
            Object.assign(modal.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: '9999',
                opacity: '0',
                transform: 'scale(0.9)',
                transition: `all ${this.animations.duration}ms ${this.animations.easing}`,
                pointerEvents: 'all'
            });
            
            // Find modal dialog and apply professional styling
            const dialog = modal.querySelector('.modal-dialog');
            if (dialog) {
                Object.assign(dialog.style, {
                    transform: 'translateY(-20px)',
                    transition: `transform ${this.animations.duration}ms ${this.animations.easing}`,
                    maxWidth: '70vw',
                    maxHeight: '70vh',
                    width: 'auto',
                    margin: '0',
                    pointerEvents: 'all',
                    position: 'relative',
                    zIndex: '1060'
                });
            }
        }
        
        /**
         * Professional animation in
         */
        async animateIn(modal) {
            return new Promise((resolve) => {
                // Force reflow
                modal.offsetHeight;
                
                // Animate modal
                requestAnimationFrame(() => {
                    modal.style.opacity = '1';
                    modal.style.transform = 'scale(1)';
                    
                    const dialog = modal.querySelector('.modal-dialog');
                    if (dialog) {
                        dialog.style.transform = 'translateY(0)';
                    }
                    
                    // Resolve after animation completes
                    setTimeout(resolve, this.animations.duration);
                });
            });
        }
        
        /**
         * Professional animation out
         */
        async animateOut(modal) {
            return new Promise((resolve) => {
                // Animate modal out
                modal.style.opacity = '0';
                modal.style.transform = 'scale(0.95)';
                
                const dialog = modal.querySelector('.modal-dialog');
                if (dialog) {
                    dialog.style.transform = 'translateY(-20px)';
                }
                
                // Resolve after animation completes
                setTimeout(resolve, this.animations.duration);
            });
        }
        
        /**
         * Clean up modal after hiding
         */
        cleanupModal(modal, modalId) {
            // Reset ARIA attributes
            modal.setAttribute('aria-hidden', 'true');
            modal.removeAttribute('aria-modal');
            
            // Remove all event listeners by cloning the element
            const newModal = modal.cloneNode(true);
            modal.parentNode.replaceChild(newModal, modal);
            
            // Reset styles on new element
            newModal.style.cssText = '';
            newModal.classList.remove('professional-modal-active');
            
            // Reset dialog styles
            const dialog = newModal.querySelector('.modal-dialog');
            if (dialog) {
                dialog.style.cssText = '';
            }
        }
        
        /**
         * Setup focus trap for accessibility
         */
        setupFocusTrap(modal) {
            const focusableElements = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        }
        
        /**
         * Close the topmost modal
         */
        closeTopModal() {
            if (this.modalStack.length > 0) {
                const topModal = this.modalStack[this.modalStack.length - 1];
                this.hide(topModal);
            }
        }
        
        /**
         * Check if any modal is currently active
         */
        hasActiveModal() {
            return this.activeModals.size > 0;
        }
        
        /**
         * Get all active modal IDs
         */
        getActiveModals() {
            return Array.from(this.activeModals);
        }
        
        /**
         * Force close all modals
         */
        async closeAll() {
            const promises = Array.from(this.activeModals).map(modalId => this.hide(modalId));
            await Promise.all(promises);
        }
    }
    
    // Create global modal manager instance
    const modalManager = new ProfessionalModalManager();
    
    // Global modal functions for backward compatibility
    window.showModal = function(modalId, options = {}) {
        return modalManager.show(modalId, options);
    };
    
    window.hideModal = function(modalId) {
        return modalManager.hide(modalId);
    };
    
    // Enhanced backdrop click handler - REMOVED to prevent conflicts
    // Backdrop functionality is now handled directly in modal manager
    window.handleBackdropClick = function(event) {
        console.log('🚨 DEPRECATED handleBackdropClick called - this should not happen');
        console.trace('Deprecated handleBackdropClick call stack:');
    };
    
    // Export modal manager for advanced usage
    window.modalManager = modalManager;
    
    logger.log('🚀 Professional Modal System v2.0 loaded successfully');
    
    // Global debugging functions for testing
    window.debugDropdowns = function() {
        testDropdownSystem();
        
        // Test dropdown toggle
        const firstToggle = document.querySelector('.dropdown-toggle');
        if (firstToggle) {
            logger.log('🧪 Testing first dropdown toggle...');
            firstToggle.click();
        } else {
            logger.warn('❌ No dropdown toggle found for testing');
        }
    };
    
    window.getPerformanceStats = function() {
        console.table({
            'Dropdown Operations (avg)': PerformanceMonitor.getAverageTime('dropdownOperations').toFixed(2) + 'ms',
            'Modal Operations (avg)': PerformanceMonitor.getAverageTime('modalOperations').toFixed(2) + 'ms',
            'API Calls (avg)': PerformanceMonitor.getAverageTime('apiCalls').toFixed(2) + 'ms'
        });
    };
    
    // Test marketplace API endpoints
    window.testMarketplaceAPI = async function(productId, action = 'publish') {
        console.log(`🧪 Testing marketplace API: ${action} for product ${productId}`);
        
        try {
            const response = await fetch(`/api/manufacturer/products/${productId}/marketplace/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Authorization': `Bearer ${getCookie('accessToken')}`
                },
                body: JSON.stringify({
                    productId,
                    action,
                    timestamp: Date.now()
                })
            });
            
            const result = await response.json();
            console.log('✅ API Response:', result);
            return result;
            
        } catch (error) {
            console.error('❌ API Test Failed:', error);
            return { success: false, error: error.message };
        }
    };

    /**
     * Test dropdown system - Debug function
     */
    function testDropdownSystem() {
        const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
        const dropdownMenus = document.querySelectorAll('.table-more-menu');
        
        logger.log(`🧪 Testing dropdown system:`);
        logger.log(`📊 Found ${dropdownToggles.length} dropdown toggles`);
        logger.log(`📊 Found ${dropdownMenus.length} dropdown menus`);
        
        if (dropdownToggles.length === 0) {
            logger.warn('❌ No dropdown toggles found! Check CSS class names.');
        }
        
        dropdownToggles.forEach((toggle, index) => {
            logger.log(`🔘 Toggle ${index + 1}:`, toggle);
            logger.log(`   - Classes: ${toggle.className}`);
            logger.log(`   - Product ID: ${toggle.dataset.productId}`);
            
            const container = toggle.closest('.table-more-actions');
            const menu = container?.querySelector('.table-more-menu');
            logger.log(`   - Has container: ${!!container}`);
            logger.log(`   - Has menu: ${!!menu}`);
        });
    }

    // ===============================================
    //    FORM HANDLERS FOR MODALS  
    // ===============================================

    // Status Change Form Handler
    document.addEventListener('DOMContentLoaded', function() {
        const statusForm = document.getElementById('statusChangeForm');
        if (statusForm) {
            statusForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                
                try {
                    showToast('Mahsulot holati o\'zgartirilmoqda...', 'info');
                    
                    // Simulate API call
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    hideModal('statusChangeModal');
                    showToast('Mahsulot holati muvaffaqiyatli o\'zgartirildi', 'success');
                    setTimeout(() => window.location.reload(), 1000);
                    
                } catch (error) {
                    showToast('Holat o\'zgartirishda xatolik yuz berdi', 'error');
                }
            });
        }

        // Marketplace Form Handler
        const marketplaceForm = document.getElementById('marketplaceForm');
        if (marketplaceForm) {
            marketplaceForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                
                try {
                    showToast('Mahsulot sotuvga chiqarilmoqda...', 'info');
                    
                    // Simulate API call
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    hideModal('marketplaceModal');
                    showToast('Mahsulot sotuvga muvaffaqiyatli chiqarildi', 'success');
                    setTimeout(() => window.location.reload(), 1000);
                    
                } catch (error) {
                    showToast('Sotuvga chiqarishda xatolik yuz berdi', 'error');
                }
            });
        }

        // Duplicate Form Handler
        const duplicateForm = document.getElementById('duplicateForm');
        if (duplicateForm) {
            duplicateForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                
                try {
                    showToast('Mahsulot nusxalanmoqda...', 'info');
                    
                    // Simulate API call
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    hideModal('duplicateModal');
                    showToast('Mahsulot muvaffaqiyatli nusxalandi', 'success');
                    setTimeout(() => window.location.reload(), 1000);
                    
                } catch (error) {
                    showToast('Nusxalashda xatolik yuz berdi', 'error');
                }
            });
        }
    });

})();

/**
 * Initialize Marketplace Style Modal - SIMPLE AND WORKING
 */
function initializeMarketplaceModal() {
    const modal = document.getElementById('productDetailsModal');
    const closeBtn = document.getElementById('closeProductModal');
    
    if (!modal || !closeBtn) {
        console.warn('Marketplace modal elements not found');
        return;
    }
    
    // Close modal on close button click
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore body scroll
        console.log('✅ Modal closed via close button');
    });

    // Close modal on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = ''; // Restore body scroll
            console.log('✅ Modal closed via overlay click');
        }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
            document.body.style.overflow = ''; // Restore body scroll
            console.log('✅ Modal closed via Escape key');
        }
    });
    
    console.log('✅ Marketplace style modal initialized');
}

/**
 * NEW MARKETPLACE STYLE PRODUCT DETAILS GENERATOR
 * Simple, Clean, and Working Implementation
 */
function generateProductDetailsHTML(product) {
    // Helper functions
    const formatPrice = (price) => {
        if (!price) return 'Narx so\'raladi';
        return new Intl.NumberFormat('uz-UZ', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(price);
    };
    
    const formatDate = (dateStr) => {
        if (!dateStr) return 'Noma\'lum';
        return new Date(dateStr).toLocaleDateString('uz-UZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };
    
    const getStatusBadge = (status) => {
        const statusMap = {
            'active': { class: 'success', text: 'Faol', icon: 'check-circle' },
            'inactive': { class: 'warning', text: 'Nofaol', icon: 'pause-circle' },
            'draft': { class: 'secondary', text: 'Qoralama', icon: 'edit' },
            'archived': { class: 'dark', text: 'Arxivlangan', icon: 'archive' }
        };
        const s = statusMap[status] || statusMap['active'];
        return `<span class="badge bg-${s.class}"><i class="fas fa-${s.icon}"></i> ${s.text}</span>`;
    };
    
        const getImages = () => {
        console.log('🖼️ Processing product images:', product.images);
        console.log('🔍 Product images type:', typeof product.images);
        console.log('🔍 Is array:', Array.isArray(product.images));
        
        // EXACTLY LIKE TABLE/CARD VIEW - Use product.images[0].url format
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            console.log('📸 Found images array with length:', product.images.length);
            
            const processedImages = product.images.map((img, index) => {
                console.log(`🖼️ Processing image ${index}:`, img);
                console.log(`🖼️ Image ${index} type:`, typeof img);
                
                let imageUrl;
                
                // EXACTLY LIKE EJS TEMPLATE: product.images[0].url
                if (img && typeof img === 'object' && img.url) {
                    imageUrl = String(img.url); // Convert to string explicitly
                    console.log(`✅ Found object with .url property: ${imageUrl}`);
                } 
                // Fallback for string format
                else if (typeof img === 'string') {
                    imageUrl = String(img); // Ensure it's a string
                    console.log(`✅ Found string URL: ${imageUrl}`);
                } 
                // Other object formats
                else if (img && typeof img === 'object') {
                    const altUrl = img.src || img.path || img.image;
                    imageUrl = altUrl ? String(altUrl) : null; // Convert to string
                    console.log(`🔄 Found alternative object format: ${imageUrl}`);
                } 
                else {
                    console.log(`❌ Invalid image format:`, img);
                    return null;
                }
                
                // Double check that we have a valid string URL
                if (typeof imageUrl !== 'string') {
                    console.log(`❌ imageUrl is not a string:`, typeof imageUrl, imageUrl);
                    return null;
                }
                
                // Validate URL
                if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
                    // Clean the URL
                    imageUrl = imageUrl.trim();
                    
                    console.log(`🔗 Processing URL: ${imageUrl}`);
                    
                    const finalImageObj = {
                        url: imageUrl,
                        alt: img.alt || `${product.name} - Rasm ${index + 1}`,
                        isReal: true
                    };
                    
                    console.log(`🎯 Final image object ${index}:`, finalImageObj);
                    console.log(`🔗 Final URL type:`, typeof finalImageObj.url);
                    console.log(`🔗 Final URL value:`, finalImageObj.url);
                    
                    return finalImageObj;
                }
                
                console.log(`❌ Invalid URL for image ${index}:`, imageUrl);
                return null;
            }).filter(img => img !== null);
            
            if (processedImages.length > 0) {
                console.log('✅ Successfully processed images:', processedImages.length);
                console.log('📋 Final processed images:', processedImages);
                return processedImages;
            }
        }
        
        // EXACTLY LIKE EJS TEMPLATE - Same fallback as table/card view
        console.log('⚠️ No valid images found, using same placeholder as table/card view');
        return [{
            url: '/images/placeholder-product.png',
            alt: 'Rasm mavjud emas',
            isReal: false
        }];
    };
    
    const images = getImages();
    
    console.log('🎨 Generated product details for:', product.name);
    console.log('📸 Using images:', images);
    
    return `
        <div class="product-details-container">
            <!-- Professional Hero Section -->
            <div class="product-hero-section">
                <div class="container-fluid p-0">
                    <div class="row g-4">
                        <!-- Image Gallery Section -->
                        <div class="col-lg-6">
                            <div class="product-gallery">
                                <!-- Main Image -->
                                <div class="main-image-container">
                                    <div class="image-badge">
                                        ${product.visibility === 'public' ? 
                                            '<span class="badge-marketplace"><i class="fas fa-globe"></i> Marketplace</span>' : 
                                            '<span class="badge-private"><i class="fas fa-eye-slash"></i> Private</span>'
                                        }
                                    </div>
                                    <img src="${String(images[0].url)}" 
                                         alt="${String(images[0].alt)}" 
                                         class="main-product-image"
                                         id="mainProductImage"
                                         onerror="this.src='/images/placeholder-product.png'; this.onerror=null;">
                                </div>
                                
                                <!-- Thumbnail Gallery -->
                                ${images.length > 1 ? `
                                    <div class="thumbnail-gallery">
                                        <div class="thumbnails-container">
                                            ${images.slice(0, 5).map((img, index) => `
                                                <div class="thumbnail-item ${index === 0 ? 'active' : ''}" 
                                                     onclick="changeMainImage('${String(img.url)}', ${index})">
                                                    <img src="${String(img.url)}" 
                                                         alt="${String(img.alt)}" 
                                                         class="thumbnail-image"
                                                         onerror="this.src='/images/placeholder-product.png'; this.onerror=null;">
                                                </div>
                                            `).join('')}
                                            ${images.length > 5 ? `
                                                <div class="thumbnail-item more-images-item">
                                                    <div class="more-images-count">+${images.length - 5}</div>
                                                    <small>Ko'proq</small>
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <!-- Product Information Section -->
                        <div class="col-lg-6">
                            <div class="product-details">
                                <!-- Product Header -->
                                <div class="product-header-info">
                                    <div class="product-category">
                                        <i class="fas fa-folder"></i>
                                        <span>${product.category?.name || product.category || 'Kategoriyasiz'}</span>
                                    </div>
                                    
                                    <h1 class="product-name">${product.name || 'Nomsiz mahsulot'}</h1>
                                    
                                    <div class="product-metadata">
                                        <div class="metadata-item">
                                            <span class="metadata-label">ID:</span>
                                            <span class="metadata-value">${(product._id || '').toString().slice(-8).toUpperCase() || 'N/A'}</span>
                                        </div>
                                        <div class="metadata-item">
                                            <span class="metadata-label">Kod:</span>
                                            <span class="metadata-value">${product.code || product.sku || 'Belgilanmagan'}</span>
                                        </div>
                                        <div class="metadata-item">
                                            <span class="metadata-label">Status:</span>
                                            <span class="metadata-value">${getStatusBadge(product.status)}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Price Section -->
                                <div class="product-pricing">
                                    <div class="price-container">
                                        <div class="main-price">${formatPrice(product.pricing?.basePrice || product.price)}</div>
                                        ${product.pricing?.discount ? `
                                            <div class="discount-badge">
                                                <span class="discount-percent">${product.pricing.discount}%</span>
                                                <span class="discount-text">Chegirma</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                    ${product.pricing?.minimumOrderQuantity ? `
                                        <div class="moq-info">
                                            <i class="fas fa-box"></i>
                                            <span>Eng kam: ${product.pricing.minimumOrderQuantity.toLocaleString()} dona</span>
                                        </div>
                                    ` : ''}
                                </div>
                                
                                
                                
                                <!-- Quick Stats -->
                                <div class="quick-stats">
                                    <div class="stats-grid">
                                        <div class="stat-card">
                                            <div class="stat-icon">
                                                <i class="fas fa-eye"></i>
                                            </div>
                                            <div class="stat-content">
                                                <div class="stat-number">${(product.views || 0).toLocaleString()}</div>
                                                <div class="stat-label">Ko'rishlar</div>
                                            </div>
                                        </div>
                                        
                                        <div class="stat-card">
                                            <div class="stat-icon">
                                                <i class="fas fa-star"></i>
                                            </div>
                                            <div class="stat-content">
                                                <div class="stat-number">${product.rating || '0.0'}</div>
                                                <div class="stat-label">Reyting</div>
                                            </div>
                                        </div>
                                        
                                        <div class="stat-card">
                                            <div class="stat-icon">
                                                <i class="fas fa-boxes"></i>
                                            </div>
                                            <div class="stat-content">
                                                <div class="stat-number">${(product.stockQuantity || 0).toLocaleString()}</div>
                                                <div class="stat-label">Zaxira</div>
                                            </div>
                                        </div>
                                        
                                        <div class="stat-card">
                                            <div class="stat-icon">
                                                <i class="fas fa-shopping-cart"></i>
                                            </div>
                                            <div class="stat-content">
                                                <div class="stat-number">${product.orderCount || 0}</div>
                                                <div class="stat-label">Buyurtma</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                               
                            </div>
                        </div>
                        
                         <!-- Description -->
                                ${product.description ? `
                                    <div class="product-description">
                                        <h6 class="section-title">Mahsulot haqida</h6>
                                        <p class="description-text">${product.description}</p>
                                    </div>
                                ` : ''}
                        
                    </div>
                </div>
            </div>
            
            <!-- Product Details Tabs -->
            <div class="product-tabs mt-4">
                <ul class="nav nav-tabs" id="productTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="details-tab" data-bs-toggle="tab" data-bs-target="#details" type="button" role="tab">
                            <i class="fas fa-info-circle"></i> Tafsilotlar
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="specifications-tab" data-bs-toggle="tab" data-bs-target="#specifications" type="button" role="tab">
                            <i class="fas fa-list"></i> Xususiyatlar
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="inventory-tab" data-bs-toggle="tab" data-bs-target="#inventory" type="button" role="tab">
                            <i class="fas fa-boxes"></i> Zaxira
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="analytics-tab" data-bs-toggle="tab" data-bs-target="#analytics" type="button" role="tab">
                            <i class="fas fa-chart-line"></i> Tahlil
                        </button>
                    </li>
                </ul>
                
                <div class="tab-content mt-3" id="productTabsContent">
                    <!-- Details Tab -->
                    <div class="tab-pane fade show active" id="details" role="tabpanel">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Asosiy ma'lumotlar</h6>
                                <table class="table table-sm">
                                                                            <tr>
                                            <td><strong>Nomi:</strong></td>
                                            <td>${product.name || product.title || 'Noma\'lum'}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Kodi:</strong></td>
                                            <td>${product.code || product.sku || 'Belgilanmagan'}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Kategoriya:</strong></td>
                                            <td>${product.category?.name || (typeof product.category === 'string' ? product.category : 'Kategoriyasiz')}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Holati:</strong></td>
                                            <td>${getStatusBadge(product.status)}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Yaratilgan:</strong></td>
                                            <td>${formatDate(product.createdAt)}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Yangilangan:</strong></td>
                                            <td>${formatDate(product.updatedAt || product.modifiedAt)}</td>
                                        </tr>
                                        ${product.brand ? `
                                            <tr>
                                                <td><strong>Brand:</strong></td>
                                                <td>${product.brand}</td>
                                            </tr>
                                        ` : ''}
                                        ${product.model ? `
                                            <tr>
                                                <td><strong>Model:</strong></td>
                                                <td>${product.model}</td>
                                            </tr>
                                        ` : ''}
                                        ${product.weight ? `
                                            <tr>
                                                <td><strong>Og'irlik:</strong></td>
                                                <td>${product.weight} kg</td>
                                            </tr>
                                        ` : ''}
                                </table>
                            </div>
                            <div class="col-md-6">
                                <h6>Narx ma'lumotlari</h6>
                                <table class="table table-sm">
                                    <tr>
                                        <td><strong>Asosiy narx:</strong></td>
                                        <td>${formatPrice(product.pricing?.basePrice || product.price || product.basePrice)}</td>
                                    </tr>
                                    ${(product.pricing?.discount || product.discount) ? `
                                        <tr>
                                            <td><strong>Chegirma:</strong></td>
                                            <td>${product.pricing?.discount || product.discount}%</td>
                                        </tr>
                                    ` : ''}
                                    ${(product.pricing?.minimumOrderQuantity || product.minimumOrderQuantity || product.minQuantity) ? `
                                        <tr>
                                            <td><strong>Eng kam buyurtma:</strong></td>
                                            <td>${product.pricing?.minimumOrderQuantity || product.minimumOrderQuantity || product.minQuantity} dona</td>
                                        </tr>
                                    ` : ''}
                                    <tr>
                                        <td><strong>Valyuta:</strong></td>
                                        <td>${product.pricing?.currency || product.currency || 'USD'}</td>
                                    </tr>
                                    ${(product.pricing?.wholesalePrice || product.wholesalePrice) ? `
                                        <tr>
                                            <td><strong>Ulgurji narx:</strong></td>
                                            <td>${formatPrice(product.pricing?.wholesalePrice || product.wholesalePrice)}</td>
                                        </tr>
                                    ` : ''}
                                    ${(product.pricing?.retailPrice || product.retailPrice) ? `
                                        <tr>
                                            <td><strong>Chakana narx:</strong></td>
                                            <td>${formatPrice(product.pricing?.retailPrice || product.retailPrice)}</td>
                                        </tr>
                                    ` : ''}
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Specifications Tab -->
                    <div class="tab-pane fade" id="specifications" role="tabpanel">
                        ${product.specifications && product.specifications.length > 0 ? `
                            <div class="specifications-container">
                                <div class="specifications-header">
                                    <h6 class="specifications-title">
                                        <i class="fas fa-list-alt"></i>
                                        Mahsulot xususiyatlari
                                    </h6>
                                    <span class="specifications-count">${product.specifications.length} ta xususiyat</span>
                                </div>
                                
                                <div class="specifications-list">
                                    ${product.specifications.map(spec => `
                                        <div class="specification-item">
                                            <div class="spec-label">
                                                <span class="spec-name">${spec.name || spec.key}</span>
                                                ${spec.unit ? `<span class="spec-unit">(${spec.unit})</span>` : ''}
                                            </div>
                                            <div class="spec-separator"></div>
                                            <div class="spec-value">
                                                <span class="value-text">${spec.value}</span>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                                
                                <div class="specifications-footer">
                                    <div class="spec-note">
                                        <i class="fas fa-info-circle"></i>
                                        <span>Barcha xususiyatlar standart o'lchovlar bo'yicha</span>
                                    </div>
                                </div>
                            </div>
                        ` : `
                            <div class="no-specifications">
                                <div class="no-specs-icon">
                                    <i class="fas fa-list-alt"></i>
                                </div>
                                <h6>Xususiyatlar belgilanmagan</h6>
                                <p class="text-muted">Bu mahsulot uchun xususiyatlar hali qo'shilmagan.</p>
                                <button class="btn btn-outline-primary btn-sm" onclick="editProduct('${product._id}')">
                                    <i class="fas fa-plus"></i>
                                    Xususiyatlar qo'shish
                                </button>
                            </div>
                        `}
                    </div>
                    
                    <!-- Inventory Tab -->
                    <div class="tab-pane fade" id="inventory" role="tabpanel">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Zaxira holati</h6>
                                <div class="card">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <span>Umumiy zaxira:</span>
                                            <strong>${(product.inventory?.totalStock || product.stockQuantity || 0).toLocaleString()} dona</strong>
                                        </div>
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <span>Mavjud:</span>
                                            <strong>${(product.inventory?.availableStock || product.stockQuantity || 0).toLocaleString()} dona</strong>
                                        </div>
                                        <div class="d-flex justify-content-between align-items-center">
                                            <span>Rezerv:</span>
                                            <strong>${(product.inventory?.reservedStock || 0).toLocaleString()} dona</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6>Yetkazib berish</h6>
                                <div class="card">
                                    <div class="card-body">
                                        ${product.shipping?.leadTime ? `
                                            <div class="d-flex justify-content-between align-items-center mb-2">
                                                <span>Yetkazish muddati:</span>
                                                <strong>${product.shipping.leadTime.min}-${product.shipping.leadTime.max} kun</strong>
                                            </div>
                                        ` : ''}
                                        ${product.shipping?.weight ? `
                                            <div class="d-flex justify-content-between align-items-center mb-2">
                                                <span>Og'irlik:</span>
                                                <strong>${product.shipping.weight} kg</strong>
                                            </div>
                                        ` : ''}
                                        ${product.shipping?.dimensions ? `
                                            <div class="d-flex justify-content-between align-items-center">
                                                <span>O'lcham:</span>
                                                <strong>${product.shipping.dimensions.length}×${product.shipping.dimensions.width}×${product.shipping.dimensions.height} sm</strong>
                                            </div>
                                        ` : ''}
                                        ${!product.shipping?.leadTime && !product.shipping?.weight && !product.shipping?.dimensions ? 
                                            '<p class="text-muted mb-0">Yetkazish ma\'lumotlari belgilanmagan.</p>' : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Analytics Tab -->
                    <div class="tab-pane fade" id="analytics" role="tabpanel">
                        <div class="row g-3">
                            <div class="col-lg-2 col-md-3 col-sm-6 col-6 mb-3">
                                <div class="card text-center">
                                    <div class="card-body">
                                        <i class="fas fa-eye fa-2x text-primary mb-2"></i>
                                        <h5>${(product.analytics?.views || product.metrics?.views || product.views || 0).toLocaleString()}</h5>
                                        <small class="text-muted">Ko'rishlar</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-2 col-md-3 col-sm-6 col-6 mb-3">
                                <div class="card text-center">
                                    <div class="card-body">
                                        <i class="fas fa-shopping-cart fa-2x text-success mb-2"></i>
                                        <h5>${(product.analytics?.totalOrders || product.metrics?.totalOrders || product.orderCount || product.totalOrders || 0).toLocaleString()}</h5>
                                        <small class="text-muted">Buyurtmalar</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-2 col-md-3 col-sm-6 col-6 mb-3">
                                <div class="card text-center">
                                    <div class="card-body">
                                        <i class="fas fa-star fa-2x text-warning mb-2"></i>
                                        <h5>${(product.analytics?.averageRating || product.metrics?.averageRating || product.rating || product.averageRating || 0).toFixed(1)}</h5>
                                        <small class="text-muted">Reyting</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-2 col-md-3 col-sm-6 col-6 mb-3">
                                <div class="card text-center">
                                    <div class="card-body">
                                        <i class="fas fa-dollar-sign fa-2x text-info mb-2"></i>
                                        <h5>${formatPrice(product.analytics?.totalRevenue || product.metrics?.totalRevenue || product.totalRevenue || 0)}</h5>
                                        <small class="text-muted">Daromad</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-2 col-md-3 col-sm-6 col-6 mb-3">
                                <div class="card text-center">
                                    <div class="card-body">
                                        <i class="fas fa-box fa-2x text-primary mb-2"></i>
                                        <h5>${(product.inventory?.totalStock || product.stockQuantity || product.stock || 0).toLocaleString()}</h5>
                                        <small class="text-muted">Zaxira</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-2 col-md-3 col-sm-6 col-6 mb-3">
                                <div class="card text-center">
                                    <div class="card-body">
                                        <i class="fas fa-calendar fa-2x text-secondary mb-2"></i>
                                        <h5>${product.analytics?.lastOrderDate || product.metrics?.lastOrderDate ? formatDate(product.analytics?.lastOrderDate || product.metrics?.lastOrderDate) : 'Hech qachon'}</h5>
                                        <small class="text-muted">Oxirgi buyurtma</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="product-actions mt-4 pt-3 border-top">
                <div class="d-flex gap-2 flex-wrap justify-content-center justify-md-start">
                    <button class="btn btn-primary" onclick="handleEditProduct('${product._id}')">
                        <i class="fas fa-edit"></i> Tahrirlash
                    </button>
                    <button class="btn btn-success" onclick="handleDuplicateProduct('${product._id}')">
                        <i class="fas fa-copy"></i> Nusxa olish
                    </button>
                    <button class="btn btn-info" onclick="handleProductAnalytics('${product._id}')">
                        <i class="fas fa-chart-line"></i> Tahlil
                    </button>
                    <button class="btn btn-warning" onclick="handleMarketplaceToggle('${product._id}')">
                        <i class="fas fa-globe"></i> Marketplace
                    </button>
                    <button class="btn btn-outline-danger" onclick="handleDeleteProduct('${product._id}')">
                        <i class="fas fa-trash"></i> O'chirish
                    </button>
                </div>
            </div>
        </div>
        
                <script>
            function changeMainImage(imageUrl, index) {
                console.log('🔄 Changing main image to:', imageUrl, 'index:', index);
                console.log('🔍 imageUrl type:', typeof imageUrl);

                // Ensure imageUrl is a string
                const safeImageUrl = String(imageUrl);
                console.log('✅ Safe image URL:', safeImageUrl);

                const mainImg = document.getElementById('mainProductImage');
                if (mainImg) {
                    mainImg.src = safeImageUrl;
                    console.log('✅ Main image src updated to:', mainImg.src);
                } else {
                    console.log('❌ Main image element not found');
                }

                // Update active thumbnail using new class structure
                document.querySelectorAll('.thumbnail-item').forEach((item, i) => {
                    if (i === index) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
            }
        </script>
    `;
}