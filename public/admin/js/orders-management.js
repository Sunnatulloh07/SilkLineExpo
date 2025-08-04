/**
 * SLEX Orders Management System
 * Professional B2B Order Management Interface
 * Senior Software Engineer Implementation
 */

class OrdersManagement {
    constructor() {
        this.currentTab = 'all';
        this.currentPage = 1;
        this.pageSize = 20;
        this.sortBy = 'createdAt';
        this.sortOrder = 'desc';
        this.filters = {};
        this.selectedOrders = new Set();
        this.orders = [];
        this.statistics = {};
        
        // API endpoints
        this.endpoints = {
            orders: '/admin/api/orders',
            orderDetails: '/admin/api/orders/:id',
            updateStatus: '/admin/api/orders/:id/status',
            bulkAction: '/admin/api/orders/bulk',
            export: '/admin/api/orders/export',
            statistics: '/admin/api/orders/statistics'
        };
        
        // Debounce timers
        this.searchDebounce = null;
        this.filterDebounce = null;
        
        this.init();
    }
    
    /**
     * Initialize the Orders Management System
     */
    init() {
        if (window.DEBUG_MODE) console.log('Initializing Orders Management System...');
        
        this.bindEvents();
        this.loadStatistics();
        this.loadOrders();
        this.setupRealTimeUpdates();
        
        if (window.DEBUG_MODE) console.log('Orders Management System initialized successfully');
    }
    
    /**
     * Bind all event listeners
     */
    bindEvents() {
        // Tab navigation
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const status = e.currentTarget.dataset.status;
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName, status);
            });
        });
        
        // Search input with debounce
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(this.searchDebounce);
                this.searchDebounce = setTimeout(() => {
                    this.filters.search = e.target.value;
                    this.currentPage = 1;
                    this.loadOrders();
                }, 300);
            });
        }
        
        // Filter inputs
        this.bindFilterEvents();
        
        // Sort headers
        document.querySelectorAll('.th-content.sortable').forEach(header => {
            header.addEventListener('click', (e) => {
                const column = e.currentTarget.closest('th').dataset.column;
                this.handleSort(this.getSortField(column));
            });
        });
        
        // Select all checkbox
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // Window resize for responsive handling
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    /**
     * Bind filter events
     */
    bindFilterEvents() {
        const filterInputs = [
            'countryFilter',
            'valueRangeFilter', 
            'paymentStatusFilter',
            'dateRangeFilter',
            'shippingFilter'
        ];
        
        filterInputs.forEach(filterId => {
            const filterElement = document.getElementById(filterId);
            if (filterElement) {
                filterElement.addEventListener('change', (e) => {
                    this.handleFilterChange(filterId, e.target.value);
                });
            }
        });
    }
    
    /**
     * Handle filter changes with debounce
     */
    handleFilterChange(filterType, value) {
        clearTimeout(this.filterDebounce);
        this.filterDebounce = setTimeout(() => {
            this.filters[filterType] = value;
            this.currentPage = 1;
            this.loadOrders();
        }, 300);
    }
    
    /**
     * Switch between tabs
     */
    switchTab(tabName, status) {
        // Update tab UI
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update current tab and filters
        this.currentTab = tabName;
        this.filters.status = status || '';
        this.currentPage = 1;
        this.selectedOrders.clear();
        this.updateSelectAllState();
        
        // Load orders for this tab
        this.loadOrders();
        
        if (window.DEBUG_MODE) console.log(`Switched to tab: ${tabName}, status: ${status}`);
    }
    
    /**
     * Load orders with current filters
     */
    async loadOrders() {
        this.showTableLoading(true);
        
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.pageSize,
                sortBy: this.sortBy,
                sortOrder: this.sortOrder,
                ...this.filters
            });
            
            if (window.DEBUG_MODE) console.log('Loading orders with params:', Object.fromEntries(params));
            
            const response = await fetch(`${this.endpoints.orders}?${params}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (window.DEBUG_MODE) console.log('Orders loaded successfully:', {
                total: data.total,
                orders: data.orders?.length || 0,
                page: data.page
            });
            
            this.orders = data.orders || [];
            this.renderOrders();
            this.renderPagination(data.pagination || {});
            this.updateResultsCount(data.total || 0);
            
        } catch (error) {
            console.error('Error loading orders:', error);
            this.showError('Failed to load orders. Please try again.');
            this.renderEmptyState();
        } finally {
            this.showTableLoading(false);
        }
    }
    
    /**
     * Load statistics
     */
    async loadStatistics() {
        try {
            const response = await fetch(this.endpoints.statistics);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.statistics = data;
            this.renderStatistics(data);
            this.updateTabBadges(data.statusCounts || {});
            
            console.log('Statistics loaded:', data);
            
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }
    
    /**
     * Render orders in table
     */
    renderOrders() {
        const tableBody = document.getElementById('ordersTableBody');
        const mobileCards = document.getElementById('mobileCardsView');
        
        if (!tableBody || !mobileCards) {
            console.error('Table containers not found');
            return;
        }
        
        if (this.orders.length === 0) {
            this.renderEmptyState();
            return;
        }
        
        // Desktop table view
        tableBody.innerHTML = this.orders.map(order => this.renderOrderRow(order)).join('');
        
        // Mobile cards view
        mobileCards.innerHTML = this.orders.map(order => this.renderOrderCard(order)).join('');
        
        // Bind row events
        this.bindOrderRowEvents();
        
        if (window.DEBUG_MODE) console.log(`Rendered ${this.orders.length} orders`);
    }
    
    /**
     * Render individual order row
     */
    renderOrderRow(order) {
        const isSelected = this.selectedOrders.has(order._id);
        const createdDate = new Date(order.createdAt);
        
        return `
            <tr class="order-row ${isSelected ? 'selected' : ''}" data-order-id="${order._id}">
                <td class="cell-checkbox">
                    <label class="modern-checkbox">
                        <input type="checkbox" ${isSelected ? 'checked' : ''} 
                               onchange="window.ordersManager.toggleOrderSelection('${order._id}', this.checked)">
                        <span class="checkbox-mark"></span>
                    </label>
                </td>
                <td class="cell-order">
                    <a href="#" class="order-number" onclick="window.ordersManager.showOrderDetails('${order._id}')"
                       title="View order details">
                        ${order.orderNumber}
                    </a>
                    <div class="order-created">
                        <i class="las la-calendar"></i>
                        ${createdDate.toLocaleDateString()}
                    </div>
                </td>
                <td class="cell-parties">
                    <div class="party-info">
                        <span class="party-label">Buyer:</span>
                        <span class="party-name" title="${order.buyer?.companyName || 'N/A'}">
                            ${order.buyer?.companyName || 'N/A'}
                        </span>
                        <span class="party-country">
                            <i class="las la-flag"></i>
                            ${order.buyer?.country || 'N/A'}
                        </span>
                    </div>
                    <div class="party-info">
                        <span class="party-label">Seller:</span>
                        <span class="party-name" title="${order.seller?.companyName || 'N/A'}">
                            ${order.seller?.companyName || 'N/A'}
                        </span>
                        <span class="party-country">
                            <i class="las la-flag"></i>
                            ${order.seller?.country || 'N/A'}
                        </span>
                    </div>
                </td>
                <td class="cell-items">
                    <div class="items-count">
                        ${order.items?.length || 0} item${(order.items?.length || 0) !== 1 ? 's' : ''}
                    </div>
                    <div class="items-preview">
                        ${this.getItemsPreview(order.items)}
                    </div>
                </td>
                <td class="cell-value">
                    <div class="order-total">
                        $${(order.totalAmount || 0).toLocaleString()}
                    </div>
                    <div class="order-currency">
                        ${order.currency || 'USD'}
                    </div>
                </td>
                <td class="cell-status">
                    <span class="status-badge ${order.status}">
                        <i class="status-icon ${this.getStatusIcon(order.status)}"></i>
                        ${this.formatStatus(order.status)}
                    </span>
                </td>
                <td class="cell-payment">
                    <div class="payment-status">
                        <span class="payment-badge ${order.payment?.status || 'pending'}">
                            ${this.formatPaymentStatus(order.payment?.status)}
                        </span>
                        <span class="payment-method">
                            ${this.formatPaymentMethod(order.payment?.method)}
                        </span>
                    </div>
                </td>
                <td class="cell-date">
                    <div class="order-date">
                        ${createdDate.toLocaleDateString()}
                    </div>
                    <div class="order-time">
                        ${createdDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                </td>
                <td class="cell-actions">
                    <div class="action-buttons">
                        ${this.renderOrderActions(order)}
                    </div>
                </td>
            </tr>
        `;
    }
    
    /**
     * Render mobile order card
     */
    renderOrderCard(order) {
        const isSelected = this.selectedOrders.has(order._id);
        const createdDate = new Date(order.createdAt);
        
        return `
            <div class="mobile-order-card ${isSelected ? 'selected' : ''}" data-order-id="${order._id}">
                <div class="mobile-card-header">
                    <div>
                        <a href="#" class="order-number" onclick="window.ordersManager.showOrderDetails('${order._id}')">
                            ${order.orderNumber}
                        </a>
                        <div class="order-created">
                            ${createdDate.toLocaleDateString()}
                        </div>
                    </div>
                    <label class="modern-checkbox">
                        <input type="checkbox" ${isSelected ? 'checked' : ''} 
                               onchange="window.ordersManager.toggleOrderSelection('${order._id}', this.checked)">
                        <span class="checkbox-mark"></span>
                    </label>
                </div>
                <div class="mobile-card-body">
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">Buyer</span>
                        <span class="mobile-card-value">${order.buyer?.companyName || 'N/A'}</span>
                    </div>
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">Items</span>
                        <span class="mobile-card-value">${order.items?.length || 0} items</span>
                    </div>
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">Total</span>
                        <span class="mobile-card-value">$${(order.totalAmount || 0).toLocaleString()}</span>
                    </div>
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">Status</span>
                        <span class="status-badge ${order.status}">
                            ${this.formatStatus(order.status)}
                        </span>
                    </div>
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">Payment</span>
                        <span class="payment-badge ${order.payment?.status || 'pending'}">
                            ${this.formatPaymentStatus(order.payment?.status)}
                        </span>
                    </div>
                </div>
                <div class="mobile-card-actions">
                    ${this.renderOrderActions(order, true)}
                </div>
            </div>
        `;
    }
    
    /**
     * Render order action buttons
     */
    renderOrderActions(order, isMobile = false) {
        const buttonSize = isMobile ? 'btn-sm' : '';
        let actions = [];
        
        // View details
        actions.push(`
            <button class="action-btn primary ${buttonSize}" 
                    onclick="window.ordersManager.showOrderDetails('${order._id}')"
                    title="View Details">
                <i class="las la-eye"></i>
                ${isMobile ? ' View' : ''}
            </button>
        `);
        
        // Status-specific actions
        switch (order.status) {
            case 'pending':
                actions.push(`
                    <button class="action-btn success ${buttonSize}" 
                            onclick="window.ordersManager.quickStatusChange('${order._id}', 'confirmed')"
                            title="Confirm Order">
                        <i class="las la-check"></i>
                        ${isMobile ? ' Confirm' : ''}
                    </button>
                `);
                break;
                
            case 'confirmed':
            case 'processing':
                actions.push(`
                    <button class="action-btn primary ${buttonSize}" 
                            onclick="window.ordersManager.quickStatusChange('${order._id}', 'shipped')"
                            title="Mark as Shipped">
                        <i class="las la-shipping-fast"></i>
                        ${isMobile ? ' Ship' : ''}
                    </button>
                `);
                break;
                
            case 'shipped':
                actions.push(`
                    <button class="action-btn success ${buttonSize}" 
                            onclick="window.ordersManager.quickStatusChange('${order._id}', 'completed')"
                            title="Mark as Completed">
                        <i class="las la-check-double"></i>
                        ${isMobile ? ' Complete' : ''}
                    </button>
                `);
                break;
        }
        
        // More actions dropdown
        actions.push(`
            <div class="dropdown">
                <button class="action-btn ${buttonSize}" 
                        onclick="window.ordersManager.showOrderActions('${order._id}')"
                        title="More Actions">
                    <i class="las la-ellipsis-v"></i>
                    ${isMobile ? ' More' : ''}
                </button>
            </div>
        `);
        
        return actions.join('');
    }
    
    /**
     * Get items preview text
     */
    getItemsPreview(items) {
        if (!items || items.length === 0) return 'No items';
        
        if (items.length === 1) {
            return items[0].product?.name || 'Product';
        }
        
        const firstItem = items[0].product?.name || 'Product';
        return `${firstItem} +${items.length - 1} more`;
    }
    
    /**
     * Get status icon class
     */
    getStatusIcon(status) {
        const icons = {
            'pending': 'las la-clock',
            'confirmed': 'las la-check',
            'processing': 'las la-cog',
            'shipped': 'las la-shipping-fast',
            'completed': 'las la-check-double',
            'cancelled': 'las la-times'
        };
        return icons[status] || 'las la-question';
    }
    
    /**
     * Format status text
     */
    formatStatus(status) {
        const statusMap = {
            'pending': 'Pending',
            'confirmed': 'Confirmed',
            'processing': 'Processing',
            'shipped': 'Shipped',
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        };
        return statusMap[status] || status;
    }
    
    /**
     * Format payment status
     */
    formatPaymentStatus(status) {
        const statusMap = {
            'pending': 'Pending',
            'partial': 'Partial',
            'paid': 'Paid',
            'overdue': 'Overdue'
        };
        return statusMap[status] || 'Pending';
    }
    
    /**
     * Format payment method
     */
    formatPaymentMethod(method) {
        const methodMap = {
            'bank_transfer': 'Bank Transfer',
            'letter_of_credit': 'Letter of Credit',
            'cash_on_delivery': 'Cash on Delivery',
            'escrow': 'Escrow',
            'crypto': 'Cryptocurrency'
        };
        return methodMap[method] || 'Bank Transfer';
    }
    
    /**
     * Bind order row events
     */
    bindOrderRowEvents() {
        // Row click for selection (excluding action buttons)
        document.querySelectorAll('.order-row').forEach(row => {
            row.addEventListener('click', (e) => {
                if (!e.target.closest('.cell-actions') && !e.target.closest('.cell-checkbox') && !e.target.closest('.order-number')) {
                    const orderId = row.dataset.orderId;
                    const checkbox = row.querySelector('input[type="checkbox"]');
                    const isSelected = !checkbox.checked;
                    checkbox.checked = isSelected;
                    this.toggleOrderSelection(orderId, isSelected);
                }
            });
        });
    }
    
    /**
     * Toggle order selection
     */
    toggleOrderSelection(orderId, isSelected) {
        if (isSelected) {
            this.selectedOrders.add(orderId);
        } else {
            this.selectedOrders.delete(orderId);
        }
        
        this.updateSelectionUI();
        this.updateBulkActions();
    }
    
    /**
     * Toggle select all orders
     */
    toggleSelectAll(selectAll) {
        this.selectedOrders.clear();
        
        if (selectAll) {
            this.orders.forEach(order => {
                this.selectedOrders.add(order._id);
            });
        }
        
        // Update checkboxes
        document.querySelectorAll('input[type="checkbox"]:not(#selectAllCheckbox)').forEach(checkbox => {
            checkbox.checked = selectAll;
        });
        
        this.updateSelectionUI();
        this.updateBulkActions();
    }
    
    /**
     * Update selection UI
     */
    updateSelectionUI() {
        // Update row styles
        document.querySelectorAll('.order-row, .mobile-order-card').forEach(row => {
            const orderId = row.dataset.orderId;
            if (this.selectedOrders.has(orderId)) {
                row.classList.add('selected');
            } else {
                row.classList.remove('selected');
            }
        });
        
        this.updateSelectAllState();
    }
    
    /**
     * Update select all checkbox state
     */
    updateSelectAllState() {
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        if (!selectAllCheckbox) return;
        
        const totalOrders = this.orders.length;
        const selectedCount = this.selectedOrders.size;
        
        if (selectedCount === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (selectedCount === totalOrders) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    }
    
    /**
     * Update bulk actions visibility and content
     */
    updateBulkActions() {
        const bulkActions = document.getElementById('bulkActions');
        const selectedCount = document.getElementById('selectedCount');
        
        if (!bulkActions || !selectedCount) return;
        
        const count = this.selectedOrders.size;
        
        if (count > 0) {
            bulkActions.classList.remove('hidden');
            selectedCount.textContent = `${count} selected`;
        } else {
            bulkActions.classList.add('hidden');
        }
    }
    
    /**
     * Handle sorting
     */
    handleSort(field) {
        if (this.sortBy === field) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortBy = field;
            this.sortOrder = 'desc';
        }
        
        this.updateSortUI();
        this.loadOrders();
        
        console.log(`Sorting by ${field} ${this.sortOrder}`);
    }
    
    /**
     * Get sort field from column
     */
    getSortField(column) {
        const fieldMap = {
            'order': 'orderNumber',
            'value': 'totalAmount',
            'status': 'status',
            'date': 'createdAt'
        };
        return fieldMap[column] || column;
    }
    
    /**
     * Update sort UI indicators
     */
    updateSortUI() {
        document.querySelectorAll('.sort-icon').forEach(icon => {
            icon.className = 'las la-sort sort-icon';
        });
        
        const currentSortHeader = document.querySelector(`[data-column="${this.getColumnFromField(this.sortBy)}"] .sort-icon`);
        if (currentSortHeader) {
            currentSortHeader.className = `las la-sort-${this.sortOrder === 'asc' ? 'up' : 'down'} sort-icon`;
        }
    }
    
    /**
     * Get column name from sort field
     */
    getColumnFromField(field) {
        const columnMap = {
            'orderNumber': 'order',
            'totalAmount': 'value',
            'status': 'status',
            'createdAt': 'date'
        };
        return columnMap[field] || field;
    }
    
    /**
     * Show/hide table loading state
     */
    showTableLoading(show) {
        const overlay = document.getElementById('tableLoadingOverlay');
        const emptyState = document.getElementById('tableEmptyState');
        
        if (overlay) {
            if (show) {
                overlay.classList.remove('hidden');
                emptyState?.classList.add('hidden');
            } else {
                overlay.classList.add('hidden');
            }
        }
    }
    
    /**
     * Render empty state
     */
    renderEmptyState() {
        const tableBody = document.getElementById('ordersTableBody');
        const mobileCards = document.getElementById('mobileCardsView');
        const emptyState = document.getElementById('tableEmptyState');
        
        if (tableBody) tableBody.innerHTML = '';
        if (mobileCards) mobileCards.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
    }
    
    /**
     * Update results count
     */
    updateResultsCount(total) {
        const resultCount = document.getElementById('tableResultsCount');
        if (resultCount) {
            resultCount.textContent = `(${total.toLocaleString()} results)`;
        }
    }
    
    /**
     * Render statistics
     */
    renderStatistics(stats) {
        const elements = {
            totalOrdersCount: stats.total || 0,
            completedOrdersCount: stats.statusCounts?.completed || 0,
            pendingOrdersCount: stats.statusCounts?.pending || 0,
            totalRevenue: stats.totalRevenue || 0
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                if (id === 'totalRevenue') {
                    element.textContent = `$${Math.round(value).toLocaleString()}`;
                } else {
                    element.textContent = value.toLocaleString();
                }
            }
        });
    }
    
    /**
     * Update tab badges
     */
    updateTabBadges(statusCounts) {
        const badgeMap = {
            allOrdersTab: statusCounts.total || 0,
            pendingOrdersTab: statusCounts.pending || 0,
            confirmedOrdersTab: statusCounts.confirmed || 0,
            processingOrdersTab: statusCounts.processing || 0,
            shippedOrdersTab: statusCounts.shipped || 0,
            completedOrdersTab: statusCounts.completed || 0
        };
        
        Object.entries(badgeMap).forEach(([id, count]) => {
            const badge = document.getElementById(id);
            if (badge) {
                badge.textContent = count;
            }
        });
    }
    
    /**
     * Render pagination
     */
    renderPagination(pagination) {
        const paginationSection = document.getElementById('paginationSection');
        const paginationControls = document.getElementById('paginationControls');
        const paginationInfo = {
            start: document.getElementById('paginationStart'),
            end: document.getElementById('paginationEnd'),
            total: document.getElementById('paginationTotal')
        };
        
        if (!pagination.totalPages || pagination.totalPages <= 1) {
            paginationSection?.classList.add('hidden');
            return;
        }
        
        paginationSection?.classList.remove('hidden');
        
        // Update pagination info
        const start = ((pagination.currentPage - 1) * this.pageSize) + 1;
        const end = Math.min(pagination.currentPage * this.pageSize, pagination.total);
        
        if (paginationInfo.start) paginationInfo.start.textContent = start;
        if (paginationInfo.end) paginationInfo.end.textContent = end;
        if (paginationInfo.total) paginationInfo.total.textContent = pagination.total;
        
        // Render pagination controls
        if (paginationControls) {
            paginationControls.innerHTML = this.generatePaginationHTML(pagination);
        }
    }
    
    /**
     * Generate pagination HTML
     */
    generatePaginationHTML(pagination) {
        const { currentPage, totalPages } = pagination;
        let html = '';
        
        // Previous button
        html += `
            <button class="pagination-btn" 
                    ${currentPage <= 1 ? 'disabled' : ''} 
                    onclick="window.ordersManager.goToPage(${currentPage - 1})">
                <i class="las la-chevron-left"></i>
            </button>
        `;
        
        // Page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        
        if (startPage > 1) {
            html += `<button class="pagination-btn" onclick="window.ordersManager.goToPage(1)">1</button>`;
            if (startPage > 2) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                        onclick="window.ordersManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
            html += `<button class="pagination-btn" onclick="window.ordersManager.goToPage(${totalPages})">${totalPages}</button>`;
        }
        
        // Next button
        html += `
            <button class="pagination-btn" 
                    ${currentPage >= totalPages ? 'disabled' : ''} 
                    onclick="window.ordersManager.goToPage(${currentPage + 1})">
                <i class="las la-chevron-right"></i>
            </button>
        `;
        
        return html;
    }
    
    /**
     * Go to specific page
     */
    goToPage(page) {
        if (page < 1 || page === this.currentPage) return;
        
        this.currentPage = page;
        this.loadOrders();
        
        // Scroll to top of table
        document.querySelector('.table-section')?.scrollIntoView({ behavior: 'smooth' });
    }
    
    /**
     * Clear all filters
     */
    clearAllFilters() {
        // Reset filter inputs
        document.getElementById('searchInput').value = '';
        document.getElementById('countryFilter').value = '';
        document.getElementById('valueRangeFilter').value = '';
        document.getElementById('paymentStatusFilter').value = '';
        document.getElementById('dateRangeFilter').value = '';
        document.getElementById('shippingFilter').value = '';
        
        // Reset filters object
        this.filters = { status: this.filters.status }; // Keep status filter from tab
        this.currentPage = 1;
        
        // Reload orders
        this.loadOrders();
        
        console.log('All filters cleared');
    }
    
    /**
     * Apply current filters (called by filter button)
     */
    applyFilters() {
        this.currentPage = 1;
        this.loadOrders();
        console.log('Filters applied:', this.filters);
    }
    
    /**
     * Refresh data
     */
    refreshData() {
        this.selectedOrders.clear();
        this.updateBulkActions();
        this.loadStatistics();
        this.loadOrders();
        console.log('Data refreshed');
    }
    
    /**
     * Export orders
     */
    async exportOrders() {
        try {
            const params = new URLSearchParams({
                ...this.filters,
                format: 'xlsx' // Default to Excel format
            });
            
            const response = await fetch(`${this.endpoints.export}?${params}`);
            
            if (!response.ok) {
                throw new Error('Export failed');
            }
            
            // Download file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `orders-export-${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            console.log('Orders exported successfully');
            
        } catch (error) {
            console.error('Export error:', error);
            this.showError('Failed to export orders. Please try again.');
        }
    }
    
    /**
     * Show order details modal
     */
    async showOrderDetails(orderId) {
        try {
            const response = await fetch(this.endpoints.orderDetails.replace(':id', orderId));
            
            if (!response.ok) {
                throw new Error('Failed to load order details');
            }
            
            const order = await response.json();
            this.renderOrderDetailsModal(order);
            
            console.log('Order details loaded:', orderId);
            
        } catch (error) {
            console.error('Error loading order details:', error);
            this.showError('Failed to load order details.');
        }
    }
    
    /**
     * Quick status change
     */
    async quickStatusChange(orderId, newStatus) {
        try {
            const response = await fetch(this.endpoints.updateStatus.replace(':id', orderId), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    status: newStatus,
                    notes: `Status changed to ${newStatus} via quick action`
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update order status');
            }
            
            // Refresh data to show updated status
            this.refreshData();
            
            console.log(`Order ${orderId} status changed to ${newStatus}`);
            
        } catch (error) {
            console.error('Error updating order status:', error);
            this.showError('Failed to update order status.');
        }
    }
    
    /**
     * Bulk actions
     */
    async bulkAction(action) {
        if (this.selectedOrders.size === 0) {
            this.showError('Please select orders first.');
            return;
        }
        
        const orderIds = Array.from(this.selectedOrders);
        
        try {
            const response = await fetch(this.endpoints.bulkAction, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    orderIds,
                    action
                })
            });
            
            if (!response.ok) {
                throw new Error('Bulk action failed');
            }
            
            const result = await response.json();
            
            this.selectedOrders.clear();
            this.refreshData();
            
            console.log(`Bulk action ${action} completed:`, result);
            
        } catch (error) {
            console.error('Bulk action error:', error);
            this.showError(`Failed to ${action} selected orders.`);
        }
    }
    
    /**
     * Bulk export selected orders
     */
    async bulkExport() {
        if (this.selectedOrders.size === 0) {
            this.showError('Please select orders first.');
            return;
        }
        
        try {
            const orderIds = Array.from(this.selectedOrders);
            const params = new URLSearchParams({
                orderIds: orderIds.join(','),
                format: 'xlsx'
            });
            
            const response = await fetch(`${this.endpoints.export}?${params}`);
            
            if (!response.ok) {
                throw new Error('Export failed');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `selected-orders-${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            console.log('Selected orders exported successfully');
            
        } catch (error) {
            console.error('Export error:', error);
            this.showError('Failed to export selected orders.');
        }
    }
    
    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + A: Select all
        if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            this.toggleSelectAll(true);
        }
        
        // Escape: Clear selection
        if (e.key === 'Escape') {
            this.selectedOrders.clear();
            this.updateSelectionUI();
            this.updateBulkActions();
        }
        
        // F5 or Ctrl/Cmd + R: Refresh (allow default but also refresh our data)
        if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key === 'r')) {
            setTimeout(() => this.refreshData(), 100);
        }
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        // Any responsive adjustments can be handled here
        // For now, the CSS handles most responsive behavior
    }
    
    /**
     * Setup real-time updates (WebSocket or polling)
     */
    setupRealTimeUpdates() {
        // For now, implement simple polling every 30 seconds
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.loadStatistics();
                // Only refresh orders if no selection is active
                if (this.selectedOrders.size === 0) {
                    this.loadOrders();
                }
            }
        }, 30000);
    }
    
    /**
     * Show error message
     */
    showError(message) {
        console.error(message);
        
        // Try to use existing project's notification system
        if (window.showNotification) {
            window.showNotification(message, 'error');
        } else if (window.toast) {
            window.toast.error(message);
        } else {
            // Fallback to alert for now
            alert('Xatolik: ' + message);
        }
    }
    
    /**
     * Show success message
     */
    showSuccess(message) {
        if (window.DEBUG_MODE) console.log(message);
        
        if (window.showNotification) {
            window.showNotification(message, 'success');
        } else if (window.toast) {
            window.toast.success(message);
        }
    }
    
    /**
     * Placeholder methods for modal functionality
     */
    renderOrderDetailsModal(order) {
        if (window.DEBUG_MODE) console.log('Order details modal would show here:', order);
        // For now, show order details in a simple alert
        // This should be replaced with proper modal implementation
        const details = `
Order: ${order.orderNumber || 'N/A'}
Status: ${order.status || 'N/A'}
Total: $${(order.totalAmount || 0).toLocaleString()}
Items: ${order.items?.length || 0}
Created: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
        `.trim();
        
        alert(details);
    }
    
    showOrderActions(orderId) {
        if (window.DEBUG_MODE) console.log('Order actions dropdown would show here for:', orderId);
        // Temporary implementation - should be replaced with dropdown menu
        const actions = [
            'View Details',
            'Change Status', 
            'Add Note',
            'Print Invoice',
            'Download PDF'
        ];
        
        const action = prompt('Select action:\n' + actions.map((a, i) => `${i+1}. ${a}`).join('\n'));
        if (action) {
            this.showSuccess(`Action "${actions[parseInt(action)-1]}" selected for order ${orderId}`);
        }
    }
    
    showCreateModal() {
        if (window.DEBUG_MODE) console.log('Create order modal would show here');
        // Temporary implementation
        const confirm = window.confirm('Create new order?\n\nNote: This will redirect to order creation page.');
        if (confirm) {
            window.location.href = '/admin/orders/create';
        }
    }
}

// Initialize when DOM is loaded
if (typeof window !== 'undefined') {
    window.OrdersManagement = OrdersManagement;
}