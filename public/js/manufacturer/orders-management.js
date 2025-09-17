/**
 * Professional Orders Management System
 * Senior Software Engineer Level Implementation
 * B2B Marketplace Integration Standards
 */

(function() {
    'use strict';


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
            try {
                this.setupEventListeners();
                this.setupViewToggle();
                this.setupFilters();
                this.setupModals();
                this.setupDropdowns();
                this.setupKeyboardShortcuts();
                
                // Load initial data
                await this.loadOrdersData();
            } catch (error) {
                console.error('Failed to initialize Orders Management:', error);
                this.showToast(this.getTranslation('admin.orders.messages.management_error', 'Orders Management yuxolanishda xatolik'), 'error');
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

            // Close dropdowns on scroll to prevent positioning issues
            window.addEventListener('scroll', () => {
                this.closeAllDropdowns();
            }, { passive: true });

            // Close dropdowns on window resize
            window.addEventListener('resize', () => {
                this.closeAllDropdowns();
            }, { passive: true });
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
                // Build comprehensive query parameters
                const params = new URLSearchParams({
                    page: this.currentPage,
                    limit: this.pageSize,
                    sort: this.sortBy,
                    ...this.filters
                });

                // Remove empty parameters
                for (let [key, value] of params.entries()) {
                    if (!value || value.trim() === '') {
                        params.delete(key);
                    }
                }

                // Add cache-busting for fresh data
                params.append('_t', Date.now());

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
                    // Handle new comprehensive data structure
                    const orders = data.data?.orders || data.orders || [];
                    const pagination = data.data?.pagination || data.pagination || {};
                    const statusDistribution = data.data?.filters?.available?.statusDistribution || {};
                    
                    this.renderOrders(orders);
                    this.updateOrdersCount(pagination.total || 0);
                    this.updatePagination(pagination);
                    this.updateStatusDistribution(statusDistribution);
                    
                    // Update comprehensive orders display
                    this.updateComprehensiveOrdersDisplay(data.data || data);
                } else {
                    throw new Error(data.message || 'Failed to load orders');
                }

            } catch (error) {
                console.error('Error loading orders:', error);
                this.showErrorState();
                this.showToast(this.getTranslation('admin.orders.messages.loading_error', 'Buyurtmalarni yuklashda xatolik'), 'error');
            } finally {
                this.isLoading = false;
                this.hideLoadingState();
            }
        }

        async refreshOrders() {
            this.selectedOrders.clear();
            this.updateSelectAllCheckbox();
            await this.loadOrdersData();
            this.showToast(this.getTranslation('admin.orders.messages.refresh_success', 'Buyurtmalar yangilandi'), 'success');
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

            this.showToast(this.getTranslation('manufacturer.orders.js_messages.filters_cleared', 'Filterlar tozalandi'), 'info');
        }

        performSearch() {
            const searchTerm = document.getElementById('ordersSearchInput')?.value?.trim();
            if (searchTerm) {
                this.filters.search = searchTerm;
                this.currentPage = 1;
                this.loadOrdersData();
            }
        }

        showCustomDatePicker() {
            // Simple date range picker implementation
            const startDate = prompt('Boshlanish sanasi (YYYY-MM-DD):');
            const endDate = prompt('Tugash sanasi (YYYY-MM-DD):');
            
            if (startDate && endDate) {
                this.filters.startDate = startDate;
                this.filters.endDate = endDate;
                this.loadOrdersData();
            }
        }

        // ===============================================
        //    ORDER ACTIONS HANDLING
        // ===============================================
        handleOrderActions(event) {
       
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
                this.toggleActionDropdown(dropdown, toggleBtn);
                event.stopPropagation();
                return;
            }

            // Handle card dropdown toggle buttons (Card view)
            if (event.target.closest('.card-more-toggle')) {
                const toggleBtn = event.target.closest('.card-more-toggle');
                const dropdown = toggleBtn.nextElementSibling;
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

            switch (action) {
                case 'view':
                    this.viewOrderDetails(orderId);
                    break;
                case 'duplicate':
                    this.duplicateOrder(orderId);
                    break;
                case 'status-change':
                    this.showStatusChangeModal(orderId);
                    break;
                case 'communication':
                    this.openCommunication(orderId);
                    break;
                case 'cancel':
                    this.cancelOrder(orderId);
                    break;
                default:
                    console.warn('Unknown action:', action);
            }
        }

        // ===============================================
        //    TABLE INTERACTION FUNCTIONS
        // ===============================================
        toggleOrderExpansion(orderId, expandBtn) {
            const detailsRow = document.querySelector(`[data-parent-order="${orderId}"]`);
            if (!detailsRow) {
                console.warn(`Details row not found for order: ${orderId}`);
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
               } else {
                // Expand
                detailsRow.classList.remove('hidden');
                expandBtn.classList.add('expanded');
                if (chevronIcon) {
                    chevronIcon.style.transform = 'rotate(180deg)';
                }
                expandBtn.setAttribute('title', 'Mahsulotlarni yashirish');
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

            // Check if dropdown was hidden before
            const wasHidden = dropdown.classList.contains('hidden');

            // Toggle current dropdown
            dropdown.classList.toggle('hidden');

            // Position dropdown outside container when showing
            if (wasHidden) {
                this.positionTableDropdown(dropdown, toggleBtn);
            }
        }

        toggleCardDropdown(dropdown, toggleBtn) {
            if (!dropdown) return;

            // Close all other open dropdowns
            document.querySelectorAll('.table-more-menu, .card-more-menu').forEach(menu => {
                if (menu !== dropdown && !menu.classList.contains('hidden')) {
                    menu.classList.add('hidden');
                }
            });

            // Check if dropdown was hidden before
            const wasHidden = dropdown.classList.contains('hidden');

            // Toggle current dropdown
            dropdown.classList.toggle('hidden');

            // Position dropdown outside card when showing
            if (wasHidden) {
                this.positionCardDropdown(dropdown, toggleBtn);
            }
 }

        positionTableDropdown(dropdown, toggleBtn) {
            if (!dropdown || !toggleBtn) return;

            // Get button position
            const btnRect = toggleBtn.getBoundingClientRect();
            const dropdownRect = dropdown.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;

            // Calculate optimal position
            let top = btnRect.bottom + 5;
            let left = btnRect.right - 180; // dropdown min-width is 180px

            // Adjust if dropdown goes below viewport
            if (top + dropdownRect.height > viewportHeight) {
                top = btnRect.top - dropdownRect.height - 5;
            }

            // Adjust if dropdown goes outside left edge
            if (left < 10) {
                left = 10;
            }

            // Adjust if dropdown goes outside right edge
            if (left + 180 > viewportWidth - 10) {
                left = viewportWidth - 190;
            }

            // Apply position
            dropdown.style.top = `${top}px`;
            dropdown.style.left = `${left}px`;
        }

        positionCardDropdown(dropdown, toggleBtn) {
            if (!dropdown || !toggleBtn) return;

            // Get button position
            const btnRect = toggleBtn.getBoundingClientRect();
            const dropdownRect = dropdown.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;

            // Calculate optimal position
            let top = btnRect.bottom + 5;
            let left = btnRect.right - 180; // dropdown min-width is 180px

            // Adjust if dropdown goes below viewport
            if (top + dropdownRect.height > viewportHeight) {
                top = btnRect.top - dropdownRect.height - 5;
            }

            // Adjust if dropdown goes outside left edge
            if (left < 10) {
                left = 10;
            }

            // Adjust if dropdown goes outside right edge
            if (left + 180 > viewportWidth - 10) {
                left = viewportWidth - 190;
            }

            // Apply position
            dropdown.style.top = `${top}px`;
            dropdown.style.left = `${left}px`;
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
                window.location.href = `/manufacturer/orders/${orderId}`;
            }
        }


        async duplicateOrder(orderId) {
            if (!confirm(this.getTranslation('manufacturer.orders.js_messages.confirm_duplicate', 'Bu buyurtmani nusxalashni xohlaysizmi?'))) return;

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
                this.showToast(this.getTranslation('manufacturer.orders.js_messages.order_duplicated', 'Buyurtma muvaffaqiyatli nusxalandi'), 'success');
                this.refreshOrders();

            } catch (error) {
                console.error('Error duplicating order:', error);
                this.showToast(this.getTranslation('manufacturer.orders.js_messages.duplicate_error', 'Buyurtmani nusxalashda xatolik'), 'error');
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
                this.showToast(this.getTranslation('manufacturer.orders.js_messages.select_new_status', 'Yangi holatni tanlang'), 'warning');
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
                
                this.showToast(this.getTranslation('manufacturer.orders.js_messages.status_updated', 'Buyurtma holati yangilandi'), 'success');
                this.closeModal('statusChangeModal');
                this.refreshOrders();

            } catch (error) {
                console.error('Error updating order status:', error);
                this.showToast(this.getTranslation('manufacturer.orders.js_messages.status_update_error', 'Buyurtma holatini yangilashda xatolik'), 'error');
            }
        }

        openCommunication(orderId) {
            window.location.href = `/manufacturer/messages?order=${orderId}`;
        }

        async cancelOrder(orderId) {
            if (!confirm(this.getTranslation('manufacturer.orders.js_messages.confirm_cancel', 'Bu buyurtmani bekor qilishni xohlaysizmi? Bu amalni bekor qilib bo\'lmaydi.'))) return;

            try {
                const response = await fetch(`/api/manufacturer/orders/${orderId}/cancel`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getCookie('accessToken')}`
                    }
                });

                if (!response.ok) throw new Error('Failed to cancel order');
                
                this.showToast(this.getTranslation('manufacturer.orders.js_messages.order_cancelled', 'Buyurtma bekor qilindi'), 'warning');
                this.refreshOrders();

            } catch (error) {
                console.error('Error canceling order:', error);
                this.showToast(this.getTranslation('manufacturer.orders.js_messages.cancel_error', 'Buyurtmani bekor qilishda xatolik'), 'error');
            }
        }

        // ===============================================
        //    BULK ACTIONS
        // ===============================================
        handleBulkActions() {
            if (this.selectedOrders.size === 0) {
                this.showToast(this.getTranslation('manufacturer.orders.js_messages.no_orders_selected', 'Birorta buyurtma tanlanmagan'), 'warning');
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

            // Show simple confirmation for bulk actions
            const action = prompt(`Tanlang:\n1. Export\n2. Status o'zgartirish\n3. Bekor qilish\n\nRaqam kiriting (1-3):`);
            
            switch (action) {
                case '1':
                    this.executeBulkAction('export');
                    break;
                case '2':
                    this.executeBulkAction('status-change');
                    break;
                case '3':
                    this.executeBulkAction('cancel');
                    break;
                default:
                    this.showToast('Noto\'g\'ri tanlov', 'warning');
            }
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
                console.error('Bulk action failed:', error);
                this.showToast(this.getTranslation('manufacturer.orders.js_messages.bulk_action_error', 'Ommaviy amal bajarishda xatolik'), 'error');
            }
        }

        // ===============================================
        //    EXPORT FUNCTIONALITY
        // ===============================================
        async handleExportOrders() {
            try {
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

                this.showToast(this.getTranslation('manufacturer.orders.js_messages.orders_exported', 'Buyurtmalar export qilindi'), 'success');

            } catch (error) {
                console.error('Export failed:', error);
                this.showToast(this.getTranslation('manufacturer.orders.js_messages.export_error', 'Export qilishda xatolik'), 'error');
            }
        }

        async exportSelectedOrders(orderIds) {
            try {
                const response = await fetch('/api/manufacturer/orders/export', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getCookie('accessToken')}`
                    },
                    body: JSON.stringify({
                        orderIds: orderIds,
                        format: 'excel'
                    })
                });

                if (!response.ok) throw new Error('Export failed');
                
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `selected-orders-export-${new Date().toISOString().split('T')[0]}.xlsx`;
                a.click();
                window.URL.revokeObjectURL(url);

                this.showToast(this.getTranslation('manufacturer.orders.js_messages.orders_exported', 'Tanlangan buyurtmalar export qilindi'), 'success');
            } catch (error) {
                console.error('Export failed:', error);
                this.showToast(this.getTranslation('manufacturer.orders.js_messages.export_error', 'Export qilishda xatolik'), 'error');
            }
        }

        showBulkStatusChangeModal(orderIds) {
            this.currentBulkOrderIds = orderIds;
            this.showModal('bulkStatusChangeModal');
        }

        async cancelSelectedOrders(orderIds) {
            if (!confirm(this.getTranslation('manufacturer.orders.js_messages.confirm_cancel', `Haqiqatan ham ${orderIds.length} ta buyurtmani bekor qilishni xohlaysizmi?`))) return;

            try {
                const response = await fetch('/api/manufacturer/orders/bulk-cancel', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getCookie('accessToken')}`
                    },
                    body: JSON.stringify({ orderIds })
                });

                if (!response.ok) throw new Error('Bulk cancel failed');
                
                this.showToast(`${orderIds.length} ta buyurtma bekor qilindi`, 'warning');
                this.refreshOrders();
            } catch (error) {
                console.error('Bulk cancel failed:', error);
                this.showToast('Ommaviy bekor qilishda xatolik', 'error');
            }
        }

        // ===============================================
        //    UI HELPERS
        // ===============================================
        renderOrders(orders) {
            // Update orders count display
            this.updateOrdersCount(orders.length);
            
            // Update order checkboxes state
            this.updateSelectAllCheckbox();
            
            // Update bulk actions state
            this.updateBulkActionsState();
            
            // In a real implementation, this would update the DOM with new orders data
            // For now, the EJS template handles the initial rendering
        }

        updateOrdersCount(count) {
            const countElement = document.getElementById('ordersCountText');
            if (countElement) {
                countElement.textContent = `${count.toLocaleString()} buyurtma`;
            }
        }

        updatePagination(pagination) {
            if (!pagination) return;
            
            // Update pagination info
            const paginationInfo = document.getElementById('paginationInfo');
            if (paginationInfo) {
                const start = (pagination.page - 1) * pagination.limit + 1;
                const end = Math.min(pagination.page * pagination.limit, pagination.total);
                paginationInfo.textContent = `${start}-${end} of ${pagination.total}`;
            }
            
            // Update pagination buttons
            const prevBtn = document.getElementById('prevPageBtn');
            const nextBtn = document.getElementById('nextPageBtn');
            
            if (prevBtn) {
                prevBtn.disabled = pagination.page <= 1;
            }
            if (nextBtn) {
                nextBtn.disabled = pagination.page >= pagination.pages;
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
            const loadingElements = document.querySelectorAll('.loading-placeholder');
            loadingElements.forEach(el => {
                el.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            });
            
            // Disable action buttons
            const actionButtons = document.querySelectorAll('.orders-btn, .table-action-btn, .card-action-btn');
            actionButtons.forEach(btn => btn.disabled = true);
        }

        hideLoadingState() {
            // Hide loading indicators
            const loadingElements = document.querySelectorAll('.loading-placeholder');
            loadingElements.forEach(el => {
                el.innerHTML = '...';
            });
            
            // Enable action buttons
            const actionButtons = document.querySelectorAll('.orders-btn, .table-action-btn, .card-action-btn');
            actionButtons.forEach(btn => btn.disabled = false);
        }

        showErrorState() {
            // Show error state
            const errorContainer = document.getElementById('ordersErrorContainer');
            if (errorContainer) {
                errorContainer.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Xatolik yuz berdi</h3>
                        <p>Buyurtmalarni yuklashda xatolik yuz berdi. Qaytadan urinib ko'ring.</p>
                        <button class="orders-btn orders-btn-primary" onclick="window.ordersManager.refreshOrders()">
                            <i class="fas fa-refresh"></i>
                            Qaytadan yuklash
                        </button>
                    </div>
                `;
                errorContainer.classList.remove('hidden');
            }
        }

        showEmptyState() {
            // Show empty state
            const emptyState = document.querySelector('.orders-empty-state');
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            
            const ordersContainer = document.getElementById('ordersContainer');
            if (ordersContainer) {
                ordersContainer.style.display = 'none';
            }
        }

        hideEmptyState() {
            // Hide empty state
            const emptyState = document.querySelector('.orders-empty-state');
            if (emptyState) {
                emptyState.style.display = 'none';
            }
            
            const ordersContainer = document.getElementById('ordersContainer');
            if (ordersContainer) {
                ordersContainer.style.display = 'block';
            }
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

        getTranslation(key, fallback = '') {
            if (typeof window.i18next !== 'undefined' && window.i18next.t) {
                return window.i18next.t(key);
            }
            if (typeof window.t !== 'undefined') {
                return window.t(key);
            }
            return fallback || key;
        }

        getStatusText(status) {
            const statusTexts = {
                'pending': this.getTranslation('manufacturer.orders.js_messages.status_pending', 'Kutayotgan'),
                'confirmed': this.getTranslation('manufacturer.orders.js_messages.status_confirmed', 'Tasdiqlangan'),
                'processing': this.getTranslation('manufacturer.orders.js_messages.status_processing', 'Jarayonda'),
                'manufacturing': this.getTranslation('manufacturer.orders.js_messages.status_manufacturing', 'Ishlab chiqarilmoqda'),
                'ready_to_ship': this.getTranslation('manufacturer.orders.js_messages.status_ready_to_ship', 'Jo\'natishga tayyor'),
                'shipped': this.getTranslation('manufacturer.orders.js_messages.status_shipped', 'Jo\'natilgan'),
                'delivered': this.getTranslation('manufacturer.orders.js_messages.status_delivered', 'Yetkazilgan'),
                'completed': this.getTranslation('manufacturer.orders.js_messages.status_completed', 'Yakunlangan'),
                'cancelled': this.getTranslation('manufacturer.orders.js_messages.status_cancelled', 'Bekor qilingan')
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

        // Update status distribution for filter options
        updateStatusDistribution(statusDistribution) {
            // Update status filter options with counts
            const statusSelect = document.querySelector('select[name="status"]');
            if (statusSelect && statusDistribution) {
                Array.from(statusSelect.options).forEach(option => {
                    if (option.value && statusDistribution[option.value]) {
                        option.textContent = `${option.dataset.label || option.textContent} (${statusDistribution[option.value]})`;
                    }
                });
            }
        }

        // Update comprehensive orders display
        updateComprehensiveOrdersDisplay(data) {
            // Update orders count with detailed breakdown
            const totalOrders = data.totalOrders || 0;
            const activeOrders = data.activeOrders || 0;
            const cancelledOrders = data.statusBreakdown?.cancelled || 0;
            
            // Update header display
            const headerElements = document.querySelectorAll('.orders-header-count, .orders-total-display');
            headerElements.forEach(element => {
                if (totalOrders > 0) {
                    element.innerHTML = `
                        <span class="total-count">${totalOrders} buyurtma</span>
                        <span class="breakdown">(${activeOrders} faol${cancelledOrders > 0 ? `, ${cancelledOrders} bekor qilingan` : ''})</span>
                    `;
                } else {
                    element.innerHTML = '0 buyurtma';
                }
            });
            
            // Update empty state if no orders - only if elements exist
            if (totalOrders === 0) {
                // Check if empty state element exists before showing
                const emptyState = document.querySelector('.orders-empty-state');
                if (emptyState) {
                    this.showEmptyState();
                }
            } else {
                // Check if orders container exists before hiding empty state
                const ordersContainer = document.getElementById('ordersContainer');
                if (ordersContainer) {
                    this.hideEmptyState();
                }
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
