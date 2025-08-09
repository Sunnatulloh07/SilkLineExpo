/**
 * Professional Orders Management System
 * Senior Software Engineer Level Implementation
 * B2B Marketplace Integration Standards
 */

(function() {
    'use strict';

    // ===============================================
    //    PROFESSIONAL LOGGING SYSTEM
    // ===============================================
    const logger = {
        log: (message, ...args) => {
            if (window.DEBUG_MODE || localStorage.getItem('debug_orders') === 'true') {
                console.log(`[OrdersManager] ${message}`, ...args);
            }
        },
        error: (message, ...args) => {
            console.error(`[OrdersManager] ${message}`, ...args);
        },
        warn: (message, ...args) => {
            console.warn(`[OrdersManager] ${message}`, ...args);
        }
    };

    // ===============================================
    //    ORDERS MANAGEMENT CORE CLASS
    // ===============================================
    class OrdersManager {
        constructor() {
            this.currentView = 'table';
            this.selectedOrders = new Set();
            this.filters = {};
            this.sortBy = 'createdAt_desc';
            this.currentPage = 1;
            this.pageSize = 25;
            this.isLoading = false;
            
            this.init();
        }

        async init() {
            logger.log('🚀 Initializing Professional Orders Management...');
            
            try {
                this.setupEventListeners();
                this.setupViewToggle();
                this.setupFilters();
                this.setupModals();
                this.setupDropdowns();
                this.setupKeyboardShortcuts();
                
                // Load initial data
                await this.loadOrdersData();
                
                logger.log('✅ Orders Management initialized successfully');
            } catch (error) {
                logger.error('❌ Failed to initialize Orders Management:', error);
                this.showToast('Orders Management yuxolanishda xatolik', 'error');
            }
        }

        // ===============================================
        //    EVENT LISTENERS SETUP
        // ===============================================
        setupEventListeners() {
            // Header action buttons
            document.getElementById('exportOrdersBtn')?.addEventListener('click', () => this.handleExportOrders());
            document.getElementById('bulkOrderActionsBtn')?.addEventListener('click', () => this.handleBulkActions());
            document.getElementById('refreshOrdersBtn')?.addEventListener('click', () => this.refreshOrders());
            document.getElementById('refreshOrdersBtn2')?.addEventListener('click', () => this.refreshOrders());

            // Filter controls
            document.getElementById('searchOrdersFiltersBtn')?.addEventListener('click', (e) => {
                e.preventDefault();
                this.applyFilters();
            });
            document.getElementById('clearOrdersFiltersBtn')?.addEventListener('click', () => this.clearFilters());
            document.getElementById('resetOrdersFiltersBtn')?.addEventListener('click', () => this.clearFilters());

            // Form submission
            document.getElementById('ordersFiltersForm')?.addEventListener('submit', (e) => {
                e.preventDefault();
                this.applyFilters();
            });
            document.getElementById('ordersSearchBtn')?.addEventListener('click', () => this.performSearch());
            
            // Search input enter key
            document.getElementById('ordersSearchInput')?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });

            // Sort change
            document.getElementById('ordersSortSelect')?.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.loadOrdersData();
            });

            // Select all checkbox
            document.getElementById('selectAllOrders')?.addEventListener('change', (e) => {
                this.handleSelectAll(e.target.checked);
            });

            // Filters toggle
            document.getElementById('toggleOrdersFilters')?.addEventListener('click', () => {
                this.toggleFiltersPanel();
            });

            // Dynamic order event delegation
            document.addEventListener('click', (e) => this.handleOrderActions(e));
            document.addEventListener('change', (e) => this.handleOrderSelections(e));
            
            // Close dropdowns when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.table-more-actions') && !e.target.closest('.card-more-actions')) {
                    document.querySelectorAll('.table-more-menu, .card-more-menu').forEach(menu => {
                        menu.classList.add('hidden');
                    });
                }
            });
        }

        setupViewToggle() {
            const viewButtons = document.querySelectorAll('.products-view-btn');
            viewButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const view = btn.dataset.view;
                    this.switchView(view);
                });
            });
        }

        setupFilters() {
            // Date range filter change
            document.getElementById('dateRangeFilter')?.addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    this.showCustomDatePicker();
                }
            });

            // Auto-apply filters on certain changes
            const autoApplyFilters = ['statusFilter', 'customerFilter', 'amountFilter'];
            autoApplyFilters.forEach(filterId => {
                document.getElementById(filterId)?.addEventListener('change', () => {
                    // Debounce auto-apply
                    clearTimeout(this.filterTimeout);
                    this.filterTimeout = setTimeout(() => this.applyFilters(), 500);
                });
            });
        }

        setupModals() {
            // Status change modal
            document.getElementById('closeStatusModal')?.addEventListener('click', () => {
                this.closeModal('statusChangeModal');
            });

            document.getElementById('cancelStatusChange')?.addEventListener('click', () => {
                this.closeModal('statusChangeModal');
            });

            document.getElementById('statusChangeForm')?.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleStatusChange();
            });

            // Close modals on outside click
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-overlay')) {
                    this.closeModal(e.target.id);
                }
            });
        }

        setupDropdowns() {
            // Close dropdowns on outside click
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.table-more-actions') && 
                    !e.target.closest('.card-more-actions')) {
                    this.closeAllDropdowns();
                }
            });
        }

        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                // Ctrl/Cmd + R: Refresh
                if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                    e.preventDefault();
                    this.refreshOrders();
                }

                // Ctrl/Cmd + A: Select All
                if ((e.ctrlKey || e.metaKey) && e.key === 'a' && e.target.tagName !== 'INPUT') {
                    e.preventDefault();
                    this.handleSelectAll(true);
                }

                // Escape: Close modals and dropdowns
                if (e.key === 'Escape') {
                    this.closeAllModals();
                    this.closeAllDropdowns();
                }

                // F: Focus search
                if (e.key === 'f' && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT') {
                    e.preventDefault();
                    document.getElementById('ordersSearchInput')?.focus();
                }
            });
        }

        // ===============================================
        //    VIEW MANAGEMENT
        // ===============================================
        switchView(view) {
            this.currentView = view;
            
            // Update active button
            document.querySelectorAll('.products-view-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`[data-view="${view}"]`)?.classList.add('active');

            // Show/hide view containers
            document.querySelectorAll('.products-view-container').forEach(container => {
                container.classList.add('hidden');
            });
            document.getElementById(`${view}View`)?.classList.remove('hidden');

            logger.log(`📊 Switched to ${view} view`);
        }

        toggleFiltersPanel() {
            const content = document.getElementById('ordersFiltersContent');
            const toggle = document.getElementById('toggleOrdersFilters');
            
            if (content && toggle) {
                content.classList.toggle('hidden');
                
                const icon = toggle.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-chevron-down');
                    icon.classList.toggle('fa-chevron-up');
                }
            }
        }

        // ===============================================
        //    DATA LOADING AND MANAGEMENT
        // ===============================================
        async loadOrdersData() {
            if (this.isLoading) return;
            
            this.isLoading = true;
            this.showLoadingState();

            try {
                logger.log('📊 Loading orders data...');
                
                const params = new URLSearchParams({
                    page: this.currentPage,
                    limit: this.pageSize,
                    sort: this.sortBy,
                    ...this.filters
                });

                const response = await fetch(`/api/manufacturer/orders?${params}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getCookie('accessToken')}`
                    },
                    credentials: 'same-origin'
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                
                if (data.success) {
                    this.renderOrders(data.orders || []);
                    this.updateOrdersCount(data.pagination?.total || 0);
                    this.updatePagination(data.pagination);
                    
                    logger.log('✅ Orders data loaded successfully', data);
                } else {
                    throw new Error(data.message || 'Failed to load orders');
                }

            } catch (error) {
                logger.error('❌ Error loading orders:', error);
                this.showErrorState();
                this.showToast('Buyurtmalarni yuklashda xatolik', 'error');
            } finally {
                this.isLoading = false;
                this.hideLoadingState();
            }
        }

        async refreshOrders() {
            logger.log('🔄 Refreshing orders...');
            this.selectedOrders.clear();
            this.updateSelectAllCheckbox();
            await this.loadOrdersData();
            this.showToast('Buyurtmalar yangilandi', 'success');
        }

        // ===============================================
        //    FILTERS AND SEARCH
        // ===============================================
        applyFilters() {
            const form = document.getElementById('ordersFiltersForm');
            if (!form) return;

            const formData = new FormData(form);
            this.filters = {
                status: formData.get('status') || '',
                dateRange: formData.get('dateRange') || '',
                customer: formData.get('customer') || '',
                amount: formData.get('amount') || '',
                search: formData.get('search')?.trim() || '',
                sortBy: formData.get('sortBy') || 'createdAt',
                sortOrder: formData.get('sortOrder') || 'desc'
            };

            // Remove empty filters
            Object.keys(this.filters).forEach(key => {
                if (!this.filters[key]) {
                    delete this.filters[key];
                }
            });

            this.currentPage = 1; // Reset to first page
            this.loadOrdersData();

            logger.log('🔍 Applied filters:', this.filters);
        }

        clearFilters() {
            // Reset filter form
            const form = document.getElementById('ordersFiltersForm');
            if (form) {
                form.reset();
            }

            this.filters = {};
            this.currentPage = 1;
            this.loadOrdersData();

            logger.log('🗑️ Filters cleared');
            this.showToast('Filterlar tozalandi', 'info');
        }

        performSearch() {
            const searchTerm = document.getElementById('ordersSearchInput')?.value?.trim();
            if (searchTerm) {
                this.filters.search = searchTerm;
                this.currentPage = 1;
                this.loadOrdersData();
                logger.log('🔍 Search performed:', searchTerm);
            }
        }

        showCustomDatePicker() {
            // Implement custom date range picker
            logger.log('📅 Opening custom date picker...');
            // This would integrate with a date picker library
        }

        // ===============================================
        //    ORDER ACTIONS HANDLING
        // ===============================================
        handleOrderActions(event) {
            // Debug click event
            logger.log('🖱️ Order actions click event:', {
                target: event.target,
                className: event.target.className,
                closest_dropdown: event.target.closest('.dropdown-toggle'),
                closest_card_toggle: event.target.closest('.card-more-toggle')
            });

            // Handle expand/collapse buttons for multi-product orders
            if (event.target.closest('.expand-order-btn')) {
                const expandBtn = event.target.closest('.expand-order-btn');
                const orderId = expandBtn.dataset.orderId;
                this.toggleOrderExpansion(orderId, expandBtn);
                return;
            }

            // Handle dropdown toggle buttons (Table view)
            if (event.target.closest('.dropdown-toggle')) {
                const toggleBtn = event.target.closest('.dropdown-toggle');
                const dropdown = toggleBtn.nextElementSibling;
                logger.log('🔽 Table dropdown toggle clicked:', { toggleBtn, dropdown });
                this.toggleActionDropdown(dropdown, toggleBtn);
                event.stopPropagation();
                return;
            }

            // Handle card dropdown toggle buttons (Card view)
            if (event.target.closest('.card-more-toggle')) {
                const toggleBtn = event.target.closest('.card-more-toggle');
                const dropdown = toggleBtn.nextElementSibling;
                logger.log('🔽 Card dropdown toggle clicked:', { toggleBtn, dropdown });
                this.toggleCardDropdown(dropdown, toggleBtn);
                event.stopPropagation();
                return;
            }

            // Handle table header sorting
            if (event.target.closest('.sortable')) {
                this.handleTableSort(event);
                return;
            }

            // Handle regular action buttons
            const target = event.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;
            const orderId = target.dataset.orderId;

            logger.log(`🎯 Order action: ${action} for order: ${orderId}`);

            switch (action) {
                case 'view':
                    this.viewOrderDetails(orderId);
                    break;
                case 'edit':
                    this.editOrder(orderId);
                    break;
                case 'duplicate':
                    this.duplicateOrder(orderId);
                    break;
                case 'status-change':
                    this.showStatusChangeModal(orderId);
                    break;
                case 'track-shipment':
                    this.trackShipment(orderId);
                    break;
                case 'communication':
                    this.openCommunication(orderId);
                    break;
                case 'add-note':
                    this.addOrderNote(orderId);
                    break;
                case 'print-invoice':
                    this.printInvoice(orderId);
                    break;
                case 'download-documents':
                    this.downloadDocuments(orderId);
                    break;
                case 'cancel':
                    this.cancelOrder(orderId);
                    break;
                case 'refund':
                    this.processRefund(orderId);
                    break;
                default:
                    logger.warn('Unknown action:', action);
            }
        }

        // ===============================================
        //    TABLE INTERACTION FUNCTIONS
        // ===============================================
        toggleOrderExpansion(orderId, expandBtn) {
            const detailsRow = document.querySelector(`[data-parent-order="${orderId}"]`);
            if (!detailsRow) {
                logger.warn(`Details row not found for order: ${orderId}`);
                return;
            }

            const isExpanded = !detailsRow.classList.contains('hidden');
            const chevronIcon = expandBtn.querySelector('i');
            
            if (isExpanded) {
                // Collapse
                detailsRow.classList.add('hidden');
                expandBtn.classList.remove('expanded');
                if (chevronIcon) {
                    chevronIcon.style.transform = 'rotate(0deg)';
                }
                expandBtn.setAttribute('title', `${expandBtn.textContent.trim()} ta mahsulotni ko'rish`);
                logger.log(`📊 Order ${orderId} collapsed`);
            } else {
                // Expand
                detailsRow.classList.remove('hidden');
                expandBtn.classList.add('expanded');
                if (chevronIcon) {
                    chevronIcon.style.transform = 'rotate(180deg)';
                }
                expandBtn.setAttribute('title', 'Mahsulotlarni yashirish');
                logger.log(`📊 Order ${orderId} expanded`);
            }
        }

        toggleActionDropdown(dropdown, toggleBtn) {
            if (!dropdown) return;

            // Close all other open dropdowns
            document.querySelectorAll('.table-more-menu, .card-more-menu').forEach(menu => {
                if (menu !== dropdown && !menu.classList.contains('hidden')) {
                    menu.classList.add('hidden');
                }
            });

            // Toggle current dropdown
            dropdown.classList.toggle('hidden');

            logger.log(`🔽 Table action dropdown toggled`);
        }

        toggleCardDropdown(dropdown, toggleBtn) {
            if (!dropdown) return;

            // Close all other open dropdowns
            document.querySelectorAll('.table-more-menu, .card-more-menu').forEach(menu => {
                if (menu !== dropdown && !menu.classList.contains('hidden')) {
                    menu.classList.add('hidden');
                }
            });

            // Toggle current dropdown
            dropdown.classList.toggle('hidden');

            logger.log(`🔽 Card action dropdown toggled`);
        }

        // ===============================================
        //    TABLE SORTING
        // ===============================================
        handleTableSort(event) {
            const sortBtn = event.target.closest('.sortable');
            if (!sortBtn) return;

            event.preventDefault();
            
            const sortField = sortBtn.dataset.sort;
            const currentSort = this.currentSort || { field: null, direction: 'asc' };

            // Determine new sort direction
            let newDirection = 'asc';
            if (currentSort.field === sortField) {
                newDirection = currentSort.direction === 'asc' ? 'desc' : 'asc';
            }

            // Update sort state
            this.currentSort = {
                field: sortField,
                direction: newDirection
            };

            // Update UI
            this.updateSortUI(sortBtn, newDirection);

            // Apply sorting
            this.applySorting();

            logger.log(`📊 Table sorted by ${sortField} ${newDirection}`);
        }

        updateSortUI(activeBtn, direction) {
            // Clear all sort indicators
            document.querySelectorAll('.sortable').forEach(btn => {
                btn.classList.remove('sort-asc', 'sort-desc');
            });

            // Set active sort indicator
            activeBtn.classList.add(`sort-${direction}`);
        }

        applySorting() {
            // Update filters with sort parameters
            this.filters.sortBy = this.currentSort.field;
            this.filters.sortOrder = this.currentSort.direction;

            // Reload data with new sorting
            this.loadOrdersData();
        }

        handleOrderSelections(event) {
            if (event.target.classList.contains('order-checkbox')) {
                const orderId = event.target.dataset.orderId;
                if (event.target.checked) {
                    this.selectedOrders.add(orderId);
                } else {
                    this.selectedOrders.delete(orderId);
                }
                this.updateBulkActionsState();
                this.updateSelectAllCheckbox();
            }
        }

        handleSelectAll(selectAll) {
            const checkboxes = document.querySelectorAll('.order-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = selectAll;
                const orderId = checkbox.dataset.orderId;
                if (selectAll) {
                    this.selectedOrders.add(orderId);
                } else {
                    this.selectedOrders.delete(orderId);
                }
            });
            this.updateBulkActionsState();
        }

        // ===============================================
        //    SPECIFIC ORDER ACTIONS
        // ===============================================
        viewOrderDetails(orderId) {
            if (orderId) {
                logger.log('👁️ Redirecting to order details page:', orderId);
                window.location.href = `/manufacturer/orders/${orderId}`;
            }
        }

        editOrder(orderId) {
            logger.log('✏️ Redirecting to edit order:', orderId);
            window.location.href = `/manufacturer/orders/${orderId}/edit`;
        }

        async duplicateOrder(orderId) {
            if (!confirm('Bu buyurtmani nusxalashni xohlaysizmi?')) return;

            try {
                const response = await fetch(`/api/manufacturer/orders/${orderId}/duplicate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getCookie('accessToken')}`
                    }
                });

                if (!response.ok) throw new Error('Failed to duplicate order');
                
                const data = await response.json();
                this.showToast('Buyurtma muvaffaqiyatli nusxalandi', 'success');
                this.refreshOrders();

            } catch (error) {
                logger.error('❌ Error duplicating order:', error);
                this.showToast('Buyurtmani nusxalashda xatolik', 'error');
            }
        }

        showStatusChangeModal(orderId) {
            this.currentOrderForStatusChange = orderId;
            this.showModal('statusChangeModal');
        }

        async handleStatusChange() {
            const newStatus = document.getElementById('newStatusSelect').value;
            const note = document.getElementById('statusChangeNote').value.trim();

            if (!newStatus) {
                this.showToast('Yangi holatni tanlang', 'warning');
                return;
            }

            try {
                const response = await fetch(`/api/manufacturer/orders/${this.currentOrderForStatusChange}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getCookie('accessToken')}`
                    },
                    body: JSON.stringify({
                        status: newStatus,
                        note: note
                    })
                });

                if (!response.ok) throw new Error('Failed to update order status');
                
                this.showToast('Buyurtma holati yangilandi', 'success');
                this.closeModal('statusChangeModal');
                this.refreshOrders();

            } catch (error) {
                logger.error('❌ Error updating order status:', error);
                this.showToast('Buyurtma holatini yangilashda xatolik', 'error');
            }
        }

        openCommunication(orderId) {
            logger.log('💬 Opening communication for order:', orderId);
            window.location.href = `/manufacturer/messages?order=${orderId}`;
        }

        async cancelOrder(orderId) {
            if (!confirm('Bu buyurtmani bekor qilishni xohlaysizmi? Bu amalni bekor qilib bo\'lmaydi.')) return;

            try {
                const response = await fetch(`/api/manufacturer/orders/${orderId}/cancel`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getCookie('accessToken')}`
                    }
                });

                if (!response.ok) throw new Error('Failed to cancel order');
                
                this.showToast('Buyurtma bekor qilindi', 'warning');
                this.refreshOrders();

            } catch (error) {
                logger.error('❌ Error canceling order:', error);
                this.showToast('Buyurtmani bekor qilishda xatolik', 'error');
            }
        }

        // ===============================================
        //    BULK ACTIONS
        // ===============================================
        handleBulkActions() {
            if (this.selectedOrders.size === 0) {
                this.showToast('Birorta buyurtma tanlanmagan', 'warning');
                return;
            }

            // Show bulk actions menu
            this.showBulkActionsMenu();
        }

        showBulkActionsMenu() {
            const selectedCount = this.selectedOrders.size;
            const actions = [
                { label: `${selectedCount} ta buyurtmani export qilish`, action: 'export' },
                { label: 'Holatni o\'zgartirish', action: 'status-change' },
                { label: 'Bekor qilish', action: 'cancel', danger: true }
            ];

            this.showActionMenu(actions, (action) => this.executeBulkAction(action));
        }

        async executeBulkAction(action) {
            const orderIds = Array.from(this.selectedOrders);
            
            try {
                switch (action) {
                    case 'export':
                        await this.exportSelectedOrders(orderIds);
                        break;
                    case 'status-change':
                        this.showBulkStatusChangeModal(orderIds);
                        break;
                    case 'cancel':
                        await this.cancelSelectedOrders(orderIds);
                        break;
                }
            } catch (error) {
                logger.error('❌ Bulk action failed:', error);
                this.showToast('Ommaviy amal bajarishda xatolik', 'error');
            }
        }

        // ===============================================
        //    EXPORT FUNCTIONALITY
        // ===============================================
        async handleExportOrders() {
            try {
                logger.log('📊 Exporting orders...');
                
                const response = await fetch('/api/manufacturer/orders/export', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getCookie('accessToken')}`
                    },
                    body: JSON.stringify({
                        filters: this.filters,
                        format: 'excel' // or 'csv'
                    })
                });

                if (!response.ok) throw new Error('Export failed');
                
                // Download file
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `orders-export-${new Date().toISOString().split('T')[0]}.xlsx`;
                a.click();
                window.URL.revokeObjectURL(url);

                this.showToast('Buyurtmalar export qilindi', 'success');

            } catch (error) {
                logger.error('❌ Export failed:', error);
                this.showToast('Export qilishda xatolik', 'error');
            }
        }

        async exportSelectedOrders(orderIds) {
            // Similar to handleExportOrders but with specific order IDs
            logger.log('📊 Exporting selected orders:', orderIds);
            // Implementation here
        }

        // ===============================================
        //    UI HELPERS
        // ===============================================
        renderOrders(orders) {
            // This would typically update the DOM with the orders data
            // In a real implementation, this would integrate with the EJS template
            // or use client-side templating
            logger.log('🎨 Rendering orders:', orders.length);
        }



        updateOrdersCount(count) {
            const countElement = document.getElementById('ordersCountText');
            if (countElement) {
                countElement.textContent = `${count.toLocaleString()} buyurtma`;
            }
        }

        updatePagination(pagination) {
            // Update pagination controls
            if (pagination) {
                logger.log('📄 Updating pagination:', pagination);
            }
        }

        updateBulkActionsState() {
            const bulkBtn = document.getElementById('bulkOrderActionsBtn');
            if (bulkBtn) {
                bulkBtn.disabled = this.selectedOrders.size === 0;
                const text = this.selectedOrders.size > 0 
                    ? `${this.selectedOrders.size} tanlangan`
                    : 'Ommaviy Amallar';
                bulkBtn.querySelector('span').textContent = text;
            }
        }

        updateSelectAllCheckbox() {
            const selectAllCheckbox = document.getElementById('selectAllOrders');
            if (selectAllCheckbox) {
                const totalCheckboxes = document.querySelectorAll('.order-checkbox').length;
                selectAllCheckbox.checked = this.selectedOrders.size === totalCheckboxes && totalCheckboxes > 0;
                selectAllCheckbox.indeterminate = this.selectedOrders.size > 0 && this.selectedOrders.size < totalCheckboxes;
            }
        }

        // ===============================================
        //    MODAL MANAGEMENT
        // ===============================================
        showModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
                
                // Focus management
                const firstFocusable = modal.querySelector('input, button, select, textarea');
                if (firstFocusable) {
                    setTimeout(() => firstFocusable.focus(), 100);
                }
            }
        }

        closeModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        }

        closeAllModals() {
            document.querySelectorAll('.modal-overlay').forEach(modal => {
                modal.classList.remove('active');
            });
            document.body.style.overflow = '';
        }

        // ===============================================
        //    DROPDOWN MANAGEMENT
        // ===============================================
        toggleDropdown(button) {
            const menu = button.parentElement.querySelector('.table-more-menu, .card-more-menu');
            if (menu) {
                const wasHidden = menu.classList.contains('hidden');
                
                // Close all other dropdowns
                this.closeAllDropdowns();
                
                // Toggle current dropdown
                if (wasHidden) {
                    menu.classList.remove('hidden');
                }
            }
        }

        closeAllDropdowns() {
            document.querySelectorAll('.table-more-menu, .card-more-menu').forEach(menu => {
                menu.classList.add('hidden');
            });
        }

        // ===============================================
        //    LOADING AND ERROR STATES
        // ===============================================
        showLoadingState() {
            // Show loading indicators
            logger.log('⏳ Showing loading state...');
        }

        hideLoadingState() {
            // Hide loading indicators
            logger.log('✅ Hiding loading state...');
        }

        showErrorState() {
            // Show error state
            logger.log('❌ Showing error state...');
        }

        // ===============================================
        //    UTILITY METHODS
        // ===============================================
        getCookie(name) {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
            return null;
        }

        getStatusText(status) {
            const statusTexts = {
                'pending': 'Kutayotgan',
                'confirmed': 'Tasdiqlangan',
                'processing': 'Jarayonda',
                'manufacturing': 'Ishlab chiqarilmoqda',
                'ready_to_ship': 'Jo\'natishga tayyor',
                'shipped': 'Jo\'natilgan',
                'delivered': 'Yetkazilgan',
                'completed': 'Yakunlangan',
                'cancelled': 'Bekor qilingan'
            };
            return statusTexts[status] || status;
        }

        showToast(message, type = 'info') {
            // Create and show toast notification
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.innerHTML = `
                <div class="toast-content">
                    <i class="fas fa-${this.getToastIcon(type)}"></i>
                    <span>${message}</span>
                </div>
                <button class="toast-close" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            `;

            const container = document.getElementById('toastContainer');
            if (container) {
                container.appendChild(toast);
                
                // Auto remove after 5 seconds
                setTimeout(() => {
                    if (toast.parentElement) {
                        toast.remove();
                    }
                }, 5000);
            }
        }

        getToastIcon(type) {
            const icons = {
                'success': 'check-circle',
                'error': 'exclamation-circle',
                'warning': 'exclamation-triangle',
                'info': 'info-circle'
            };
            return icons[type] || 'info-circle';
        }

        showActionMenu(actions, callback) {
            // Create and show contextual action menu
            logger.log('📋 Showing action menu:', actions);
            // Implementation would create a dynamic menu
        }

        // ===============================================
        //    NEW ORDER ACTION METHODS
        // ===============================================
        
        /**
         * Track shipment for order
         */
        trackShipment(orderId) {
            logger.log(`📦 Tracking shipment for order: ${orderId}`);
            window.location.href = `/manufacturer/orders/${orderId}/tracking`;
        }

        /**
         * Add note to order
         */
        addOrderNote(orderId) {
            logger.log(`📝 Adding note to order: ${orderId}`);
            window.location.href = `/manufacturer/orders/${orderId}/detail#notes`;
        }

        /**
         * Print invoice for order
         */
        printInvoice(orderId) {
            logger.log(`🖨️ Printing invoice for order: ${orderId}`);
            const printUrl = `/manufacturer/orders/${orderId}/invoice?print=true`;
            const printWindow = window.open(printUrl, '_blank', 'width=800,height=600');
            
            if (printWindow) {
                printWindow.onload = function() {
                    printWindow.print();
                    setTimeout(() => printWindow.close(), 1000);
                };
            } else {
                // Fallback - direct link
                window.open(printUrl, '_blank');
            }
            this.showToast('Hisob-faktura chop etish uchun ochildi', 'info');
        }

        /**
         * Download documents for order
         */
        downloadDocuments(orderId) {
            logger.log(`📄 Downloading documents for order: ${orderId}`);
            const downloadUrl = `/api/manufacturer/orders/${orderId}/documents/download`;
            
            // Create temporary download link
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `order-${orderId}-documents.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showToast('Hujjatlar yuklab olinmoqda...', 'info');
        }

        /**
         * Process refund for order
         */
        processRefund(orderId) {
            logger.log(`💰 Processing refund for order: ${orderId}`);
            
            if (confirm('Haqiqatan ham bu buyurtma uchun pulni qaytarishni xohlaysizmi?')) {
                this.showToast('Pulni qaytarish jarayoni boshlandi...', 'warning');
                
                // Redirect to refund page
                setTimeout(() => {
                    window.location.href = `/manufacturer/orders/${orderId}/refund`;
                }, 2000);
            }
        }
    }

    // ===============================================
    //    INITIALIZATION
    // ===============================================
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.ordersManager = new OrdersManager();
        });
    } else {
        window.ordersManager = new OrdersManager();
    }

    // Export for testing and external access
    window.OrdersManager = OrdersManager;

})();

// ===============================================
//    GLOBAL HELPER FUNCTIONS
// ===============================================

// Format currency
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('uz-UZ', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount);
}

// Format date
function formatDate(date, options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return new Intl.DateTimeFormat('uz-UZ', { ...defaultOptions, ...options }).format(new Date(date));
}

// Debounce function
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
