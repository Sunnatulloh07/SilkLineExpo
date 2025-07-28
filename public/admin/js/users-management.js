/**
 * Professional Users Management System
 * Senior Software Engineer Level Implementation
 * Production-Ready with Advanced Features
 */

class UsersManagement {
    constructor() {
        // Core state management
        this.currentTab = 'all';
        this.currentStatus = '';
        this.selectedUsers = new Set();
        this.currentPage = 1;
        this.pageSize = 20;
        this.totalPages = 0;
        this.totalUsers = 0;
        
        // Filter state - Now stored separately until search is triggered
        this.pendingFilters = {
            search: '',
            country: '',
            companyType: '',
            activityType: '',
            dateRange: '',
            emailVerified: ''
        };
        
        this.activeFilters = {
            search: '',
            country: '',
            companyType: '',
            activityType: '',
            dateRange: '',
            emailVerified: ''
        };
        
        // Performance optimization
        this.debounceTimer = null;
        this.isLoading = false;
        this.autoRefreshInterval = null;
        
        // API endpoints
        this.endpoints = {
            users: '/admin/api/users',
            userAction: '/admin/api/users/action',
            bulkAction: '/admin/api/users/bulk-action',
            statistics: '/admin/api/users/statistics',
            export: '/admin/api/users/export'
        };
        
        // UI state
        this.isMobile = window.innerWidth <= 768;
        this.isTablet = window.innerWidth <= 1024;
    }

    /**
     * Initialize the Users Management System
     */
    init() {
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.loadUsers(false);
        this.updateTabCounts();
        this.setupAutoRefresh();
        this.setupResponsiveHandlers();
        
        // Restore state from URL parameters
        this.restoreState();
        
        console.log('🚀 Users Management System initialized successfully');
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
            'countryFilter',
            'companyTypeFilter', 
            'activityTypeFilter',
            'dateRangeFilter',
            'emailVerifiedFilter'
        ];

        filterInputs.forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element) {
                // Only update pending filters, don't trigger search
                element.addEventListener('change', (e) => {
                    const filterKey = filterId.replace('Filter', '').replace('companyType', 'companyType')
                        .replace('activityType', 'activityType').replace('dateRange', 'dateRange')
                        .replace('emailVerified', 'emailVerified');
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
                this.loadUsers(true);
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
                this.loadUsers(true);
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
        
        // Load users for this tab
        this.loadUsers();
        
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
        
        // Load users with new filters
        this.loadUsers();
        
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
     * Load users with current state
     */
    async loadUsers(silent = false) {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            
            if (!silent) {
                this.showTableLoading();
            }
            
            const queryParams = this.buildQueryParams();
            const fullUrl = `${this.endpoints.users}?${queryParams}`;
            console.log('🔍 Fetching users from:', fullUrl);
            
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
            if (!data || !data.pagination || !data.users) {
                console.error('❌ Invalid response structure:', { data, response_data });
                throw new Error('Invalid API response structure');
            }
            
            // Update state with fallbacks
            this.totalUsers = data.pagination.total || data.pagination.totalCount || 0;
            this.totalPages = data.pagination.totalPages || Math.ceil(this.totalUsers / (data.pagination.limit || 20));
            this.currentPage = data.pagination.currentPage || 1;
            
            // Render users
            this.renderUsers(data.users);
            
            // Update UI components
            this.updatePagination(data.pagination);
            this.updateStats(data.statistics);
            this.updateResultsCount(data.pagination.total);
            this.updateTabCounts(data.statistics);
            
            if (!silent) {
                this.showSuccess(`Loaded ${data.users.length} users successfully`);
            }
            
        } catch (error) {
            console.error('❌ Error loading users:', error);
            this.showError('Failed to load users. Please try again.');
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
        params.set('limit', this.pageSize.toString());
        
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
            country: '',
            companyType: '',
            activityType: '',
            dateRange: '',
            emailVerified: ''
        };
        
        this.activeFilters = {
            search: '',
            country: '',
            companyType: '',
            activityType: '',
            dateRange: '',
            emailVerified: ''
        };
        
        // Clear form inputs
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        
        const filterSelects = [
            'countryFilter',
            'companyTypeFilter',
            'activityTypeFilter', 
            'dateRangeFilter',
            'emailVerifiedFilter'
        ];
        
        filterSelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) select.value = '';
        });
        
        // Reset to first page
        this.currentPage = 1;
        
        // Reload users
        this.loadUsers();
        
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
        this.loadUsers();
        this.updateTabCounts();
        this.showSuccess('Data refreshed');
    }

    /**
     * Render users in the table
     */
    renderUsers(users) {
        const tableBody = document.getElementById('usersTableBody');
        const mobileView = document.getElementById('mobileCardsView');
        
        if (!tableBody) return;
        
        if (!users || users.length === 0) {
            this.renderEmptyState('empty');
            return;
        }
        
        // Map flat structure to nested structure for compatibility
        const mappedUsers = users.map(user => this.mapUserStructure(user));
        
        // Hide empty state and loading
        this.hideEmptyState();
        
        // Render desktop table
        tableBody.innerHTML = mappedUsers.map(user => this.renderUserRow(user)).join('');
        
        // Render mobile cards
        if (mobileView) {
            mobileView.innerHTML = mappedUsers.map(user => this.renderMobileCard(user)).join('');
        }
        
        // Apply fade-in animation
        tableBody.classList.add('fade-in');
        
        // Update bulk actions state
        this.updateBulkActions();
        
        // Setup row event listeners
        this.setupRowEventListeners();
    }

    /**
     * Render mobile card for responsive view
     */
    renderMobileCard(user) {
        const isSelected = this.selectedUsers.has(user._id);
        const profileScore = this.calculateProfileScore(user);
        
        return `
            <div class="mobile-user-card ${isSelected ? 'selected' : ''}" data-user-id="${user._id}">
                <div class="mobile-card-header">
                    <div class="professional-user-info">
                        ${this.renderProfessionalAvatar(user)}
                        <div class="professional-user-details">
                            <div class="professional-company-name">${this.escapeHtml(user.companyInfo?.name || 'N/A')}</div>
                            <div class="professional-company-email">${this.escapeHtml(user.contactInfo?.email || 'N/A')}</div>
                        </div>
                    </div>
                    <div class="mobile-card-select">
                        <label class="modern-checkbox">
                            <input type="checkbox" 
                                   value="${user._id}"
                                   ${isSelected ? 'checked' : ''}
                                   onchange="usersManagement.toggleUserSelection('${user._id}', this.checked)">
                            <span class="checkbox-mark"></span>
                        </label>
                    </div>
                </div>
                
                <div class="mobile-card-info">
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">Status</span>
                        <span class="mobile-card-value">${this.renderProfessionalStatusBadge(user.status)}</span>
                    </div>
                    
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">Business Type</span>
                        <span class="mobile-card-value">${this.renderProfessionalBusinessBadge(user)}</span>
                    </div>
                    
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">Location</span>
                        <span class="mobile-card-value">
                            <div class="professional-location">
                                ${this.renderProfessionalCountryFlag(user.locationInfo?.country)}
                                <span class="professional-country-name">${this.escapeHtml(user.locationInfo?.country || 'N/A')}</span>
                            </div>
                        </span>
                    </div>
                    
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">Profile</span>
                        <span class="mobile-card-value">
                            <div class="professional-progress">
                                <div class="professional-progress-bar">
                                    <div class="professional-progress-fill" style="width: ${profileScore}%"></div>
                                </div>
                                <span class="professional-progress-text">${profileScore}%</span>
                            </div>
                        </span>
                    </div>
                    
                    <div class="mobile-card-row">
                        <span class="mobile-card-label">Joined</span>
                        <span class="mobile-card-value">
                            <div class="professional-date ${this.getDateClass(user.createdAt)}">${this.formatDate(user.createdAt)}</div>
                        </span>
                    </div>
                </div>
                
                <div class="mobile-card-actions">
                    ${this.renderProfessionalActions(user)}
                </div>
            </div>
        `;
    }

    /**
     * Map flat user structure to nested structure for compatibility
     */
    mapUserStructure(user) {
        return {
            ...user,
            companyInfo: {
                name: user.companyName || user.companyInfo?.name,
                type: user.companyType || user.companyInfo?.type,
                logo: user.companyLogo?.url || user.companyInfo?.logo
            },
            contactInfo: {
                email: user.email || user.contactInfo?.email,
                phone: user.phone || user.contactInfo?.phone,
                contactPerson: user.contactPerson || user.contactInfo?.contactPerson
            },
            locationInfo: {
                country: user.country || user.locationInfo?.country,
                city: user.city || user.locationInfo?.city,
                address: user.address || user.locationInfo?.address
            }
        };
    }

    /**
     * Render a single user row - Professional Style
     */
    renderUserRow(user) {
        const isSelected = this.selectedUsers.has(user._id);
        const profileScore = this.calculateProfileScore(user);
        
        return `
            <tr class="${isSelected ? 'selected' : ''}" data-user-id="${user._id}">
                <td>
                    <label class="modern-checkbox">
                        <input type="checkbox" 
                               value="${user._id}"
                               ${isSelected ? 'checked' : ''}
                               onchange="usersManagement.toggleUserSelection('${user._id}', this.checked)">
                        <span class="checkbox-mark"></span>
                    </label>
                </td>
                <td>
                    <div class="professional-user-info">
                        ${this.renderProfessionalAvatar(user)}
                        <div class="professional-user-details">
                            <div class="professional-company-name">${this.escapeHtml(user.companyInfo?.name || 'N/A')}</div>
                            <div class="professional-company-email">${this.escapeHtml(user.contactInfo?.email || 'N/A')}</div>
                            <div class="professional-user-id">#${user._id.slice(-8)}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="professional-contact">
                        <div class="professional-contact-email">${this.escapeHtml(user.contactInfo?.email || 'N/A')}</div>
                        <div class="professional-contact-phone">${this.escapeHtml(user.contactInfo?.phone || 'N/A')}</div>
                    </div>
                </td>
                <td>
                    ${this.renderProfessionalBusinessBadge(user)}
                </td>
                <td>
                    <div class="professional-location">
                        ${this.renderProfessionalCountryFlag(user.locationInfo?.country)}
                        <span class="professional-country-name">${this.escapeHtml(user.locationInfo?.country || 'N/A')}</span>
                    </div>
                </td>
                <td>
                    ${this.renderProfessionalStatusBadge(user.status)}
                </td>
                <td>
                    <div class="professional-progress">
                        <div class="professional-progress-bar">
                            <div class="professional-progress-fill" style="width: ${profileScore}%"></div>
                        </div>
                        <span class="professional-progress-text">${profileScore}%</span>
                    </div>
                </td>
                <td>
                    <div class="professional-date ${this.getDateClass(user.createdAt)}">${this.formatDate(user.createdAt)}</div>
                </td>
                <td>
                    ${this.renderProfessionalActions(user)}
                </td>
            </tr>
        `;
    }

    /**
     * Render professional avatar
     */
    renderProfessionalAvatar(user) {
        const logoUrl = user.companyInfo?.logo;
        const companyName = user.companyInfo?.name || 'Unknown';
        const initials = this.getInitials(companyName);
        
        return `
            <div class="professional-avatar">
                ${logoUrl ? 
                    `<img src="${logoUrl}" alt="${this.escapeHtml(companyName)}" onerror="this.style.display='none'; this.parentElement.innerText='${initials}';">` :
                    initials
                }
            </div>
        `;
    }

    /**
     * Render professional status badge
     */
    renderProfessionalStatusBadge(status) {
        return `
            <div class="professional-status-badge ${status}">
                <span class="status-icon-dot"></span>
                ${this.formatStatusText(status)}
            </div>
        `;
    }

    /**
     * Render professional business badge
     */
    renderProfessionalBusinessBadge(user) {
        const type = user.companyInfo?.type || user.companyType || 'N/A';
        const activity = user.activityType || 'N/A';
        
        return `
            <div class="professional-business-badge">
                ${this.escapeHtml(type)}
            </div>
        `;
    }

    /**
     * Render professional country flag
     */
    renderProfessionalCountryFlag(country) {
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
        
        return `<span class="professional-country-flag">${flag}</span>`;
    }

    /**
     * Render professional actions
     */
    renderProfessionalActions(user) {
        return `
            <div class="professional-actions">
                <button class="professional-action-btn" onclick="usersManagement.viewUser('${user._id}')" title="View Details">
                    <i class="las la-eye"></i>
                </button>
                <button class="professional-action-btn" onclick="usersManagement.editUser('${user._id}')" title="Edit User">
                    <i class="las la-edit"></i>
                </button>
                ${this.renderActionBasedOnStatus(user)}
            </div>
        `;
    }

    /**
     * Render action button based on user status
     */
    renderActionBasedOnStatus(user) {
        switch (user.status) {
            case 'pending':
                return `
                    <button class="professional-action-btn success" onclick="usersManagement.approveUser('${user._id}')" title="Approve">
                        <i class="las la-check"></i>
                    </button>`;
            case 'active':
                return `
                    <button class="professional-action-btn danger" onclick="usersManagement.blockUser('${user._id}')" title="Block">
                        <i class="las la-ban"></i>
                    </button>`;
            case 'blocked':
                return `
                    <button class="professional-action-btn success" onclick="usersManagement.unblockUser('${user._id}')" title="Unblock">
                        <i class="las la-check-circle"></i>
                    </button>`;
            default:
                return `
                    <button class="professional-action-btn danger" onclick="usersManagement.deleteUser('${user._id}')" title="Delete">
                        <i class="las la-trash"></i>
                    </button>`;
        }
    }

    /**
     * Format status text
     */
    formatStatusText(status) {
        const statusMap = {
            'pending': 'Pending',
            'active': 'Active',
            'blocked': 'Blocked',
            'suspended': 'Suspended'
        };
        return statusMap[status] || status;
    }

    /**
     * Get date class for styling
     */
    getDateClass(dateString) {
        if (!dateString) return 'old';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.ceil((now - date) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 7) return 'recent';
        if (diffDays <= 30) return '';
        return 'old';
    }

    /**
     * Render user avatar (Legacy support)
     */
    renderUserAvatar(user) {
        const logoUrl = user.companyInfo?.logo;
        const companyName = user.companyInfo?.name || 'Unknown';
        const initials = this.getInitials(companyName);
        
        return `
            <div class="user-avatar">
                ${logoUrl ? 
                    `<img src="${logoUrl}" alt="${this.escapeHtml(companyName)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                     <div class="user-avatar-placeholder" style="display: none;">${initials}</div>` :
                    `<div class="user-avatar-placeholder">${initials}</div>`
                }
            </div>
        `;
    }

    /**
     * Render status badge
     */
    renderStatusBadge(status) {
        const statusConfig = {
            pending: { icon: 'clock', label: 'Pending' },
            active: { icon: 'check-circle', label: 'Active' },
            blocked: { icon: 'ban', label: 'Blocked' },
            suspended: { icon: 'pause', label: 'Suspended' }
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
     * Render company type badge
     */
    renderTypeBadge(type) {
        if (!type || type === 'N/A') {
            return '<span class="text-muted">N/A</span>';
        }
        
        return `<div class="type-badge ${type.toLowerCase()}">${this.escapeHtml(type)}</div>`;
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
     * Render user actions dropdown
     */
    renderUserActions(user) {
        return `
            <div class="actions-dropdown">
                <button class="actions-trigger" onclick="usersManagement.toggleActionMenu('${user._id}')">
                    <i class="las la-ellipsis-v"></i>
                </button>
                <div class="actions-menu" id="actions-${user._id}">
                    <button class="action-item" onclick="usersManagement.viewUser('${user._id}')">
                        <i class="las la-eye"></i>
                        View Details
                    </button>
                    <button class="action-item" onclick="usersManagement.editUser('${user._id}')">
                        <i class="las la-edit"></i>
                        Edit User
                    </button>
                    <div class="action-divider"></div>
                    ${this.getUserStatusActions(user)}
                    <div class="action-divider"></div>
                    <button class="action-item danger" onclick="usersManagement.deleteUser('${user._id}')">
                        <i class="las la-trash"></i>
                        Delete User
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Get context-sensitive status actions for user
     */
    getUserStatusActions(user) {
        const actions = [];
        
        switch (user.status) {
            case 'pending':
                actions.push(`
                    <button class="action-item success" onclick="usersManagement.approveUser('${user._id}')">
                        <i class="las la-check"></i>
                        Approve User
                    </button>
                    <button class="action-item danger" onclick="usersManagement.rejectUser('${user._id}')">
                        <i class="las la-times"></i>
                        Reject User
                    </button>
                `);
                break;
                
            case 'active':
                actions.push(`
                    <button class="action-item" onclick="usersManagement.suspendUser('${user._id}')">
                        <i class="las la-pause"></i>
                        Suspend User
                    </button>
                    <button class="action-item danger" onclick="usersManagement.blockUser('${user._id}')">
                        <i class="las la-ban"></i>
                        Block User
                    </button>
                `);
                break;
                
            case 'blocked':
                actions.push(`
                    <button class="action-item success" onclick="usersManagement.unblockUser('${user._id}')">
                        <i class="las la-check"></i>
                        Unblock User
                    </button>
                `);
                break;
                
            case 'suspended':
                actions.push(`
                    <button class="action-item success" onclick="usersManagement.activateUser('${user._id}')">
                        <i class="las la-play"></i>
                        Activate User
                    </button>
                    <button class="action-item danger" onclick="usersManagement.blockUser('${user._id}')">
                        <i class="las la-ban"></i>
                        Block User
                    </button>
                `);
                break;
        }
        
        return actions.join('');
    }

    /**
     * Setup row event listeners
     */
    setupRowEventListeners() {
        // Double-click to view user details
        document.querySelectorAll('#usersTableBody tr').forEach(row => {
            row.addEventListener('dblclick', (e) => {
                if (!e.target.closest('input, button, .actions-dropdown')) {
                    const userId = row.dataset.userId;
                    if (userId) {
                        this.viewUser(userId);
                    }
                }
            });
        });
    }

    /**
     * Render empty state
     */
    renderEmptyState(type = 'empty') {
        const tableBody = document.getElementById('usersTableBody');
        const mobileView = document.getElementById('mobileCardsView');
        const emptyState = document.getElementById('tableEmptyState');
        const loadingOverlay = document.getElementById('tableLoadingOverlay');
        
        // Clear content
        if (tableBody) {
            tableBody.innerHTML = '';
        }
        if (mobileView) {
            mobileView.innerHTML = '';
        }
        
        // Hide loading
        if (loadingOverlay) {
            loadingOverlay.classList.remove('show');
        }
        
        // Show empty state
        if (emptyState) {
            const emptyStateTitle = emptyState.querySelector('.empty-state-title');
            const emptyStateDescription = emptyState.querySelector('.empty-state-description');
            const emptyStateIcon = emptyState.querySelector('.empty-state-icon i');
            const emptyStateButton = emptyState.querySelector('button');
            
            if (type === 'error') {
                if (emptyStateTitle) emptyStateTitle.textContent = 'Error Loading Users';
                if (emptyStateDescription) emptyStateDescription.textContent = 'There was a problem loading users. Please try again.';
                if (emptyStateIcon) {
                    emptyStateIcon.className = 'las la-exclamation-triangle';
                }
                if (emptyStateButton) {
                    emptyStateButton.innerHTML = '<i class="las la-refresh"></i> Try Again';
                    emptyStateButton.onclick = () => this.loadUsers();
                }
            } else {
                if (emptyStateTitle) emptyStateTitle.textContent = 'No Users Found';
                if (emptyStateDescription) emptyStateDescription.textContent = 'No users match your current filter criteria.';
                if (emptyStateIcon) {
                    emptyStateIcon.className = 'las la-users';
                }
                if (emptyStateButton) {
                    emptyStateButton.innerHTML = '<i class="las la-refresh"></i> Reset Filters';
                    emptyStateButton.onclick = () => this.clearAllFilters();
                }
            }
            
            emptyState.classList.remove('hidden');
        }
    }

    /**
     * Hide empty state
     */
    hideEmptyState() {
        const emptyState = document.getElementById('tableEmptyState');
        if (emptyState) {
            emptyState.classList.add('hidden');
        }
    }

    /**
     * Update pagination
     */
    updatePagination(pagination) {
        this.updateElement('paginationStart', ((pagination.currentPage - 1) * pagination.limit + 1).toString());
        this.updateElement('paginationEnd', Math.min(pagination.currentPage * pagination.limit, pagination.total).toString());
        this.updateElement('paginationTotal', pagination.total.toString());
        
        const paginationControls = document.getElementById('paginationControls');
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
            <button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" 
                    onclick="usersManagement.goToPage(${currentPage - 1})"
                    ${currentPage === 1 ? 'disabled' : ''}>
                <i class="las la-chevron-left"></i>
                <span class="d-none d-md-inline">Previous</span>
            </button>
        `;
        
        // Page numbers (mobile-friendly)
        if (this.isMobile) {
            // Mobile: Show current page and total
            html += `
                <span class="page-btn active">
                    ${currentPage} / ${totalPages}
                </span>
            `;
        } else {
            // Desktop: Show page numbers with ellipsis
            const maxVisiblePages = this.isTablet ? 5 : 7;
            const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            // First page and ellipsis
            if (startPage > 1) {
                html += `<button class="page-btn" onclick="usersManagement.goToPage(1)">1</button>`;
                if (startPage > 2) {
                    html += `<span class="page-btn disabled">...</span>`;
                }
            }
            
            // Page numbers
            for (let i = startPage; i <= endPage; i++) {
                html += `
                    <button class="page-btn ${i === currentPage ? 'active' : ''}" 
                            onclick="usersManagement.goToPage(${i})">
                        ${i}
                    </button>
                `;
            }
            
            // Last page and ellipsis
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    html += `<span class="page-btn disabled">...</span>`;
                }
                html += `<button class="page-btn" onclick="usersManagement.goToPage(${totalPages})">${totalPages}</button>`;
            }
        }
        
        // Next button
        html += `
            <button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                    onclick="usersManagement.goToPage(${currentPage + 1})"
                    ${currentPage === totalPages ? 'disabled' : ''}>
                <span class="d-none d-md-inline">Next</span>
                <i class="las la-chevron-right"></i>
            </button>
        `;
        
        return html;
    }

    /**
     * Update statistics
     */
    updateStats(statistics) {
        if (!statistics) return;
        
        this.updateElement('totalUsersCount', statistics.total?.toString() || '0');
        
        // Update individual status counts
        const statusCounts = {
            active: statistics.statuses?.find(s => s.label === 'active')?.count || 0,
            pending: statistics.statuses?.find(s => s.label === 'pending')?.count || 0,
            blocked: statistics.statuses?.find(s => s.label === 'blocked')?.count || 0,
            suspended: statistics.statuses?.find(s => s.label === 'suspended')?.count || 0
        };
        
        this.updateElement('activeUsersCount', statusCounts.active.toString());
        this.updateElement('pendingUsersCount', statusCounts.pending.toString());
        this.updateElement('blockedUsersCount', statusCounts.blocked.toString());
    }

    /**
     * Update tab counts
     */
    updateTabCounts(statistics) {
        if (!statistics) return;
        
        this.updateElement('allUsersTab', statistics.total?.toString() || '0');
        
        const statusCounts = {
            active: statistics.statuses?.find(s => s.label === 'active')?.count || 0,
            pending: statistics.statuses?.find(s => s.label === 'pending')?.count || 0,
            blocked: statistics.statuses?.find(s => s.label === 'blocked')?.count || 0,
            suspended: statistics.statuses?.find(s => s.label === 'suspended')?.count || 0
        };
        
        this.updateElement('activeUsersTab', statusCounts.active.toString());
        this.updateElement('pendingUsersTab', statusCounts.pending.toString());
        this.updateElement('blockedUsersTab', statusCounts.blocked.toString());
        this.updateElement('suspendedUsersTab', statusCounts.suspended.toString());
    }

    /**
     * Update results count
     */
    updateResultsCount(count) {
        this.updateElement('tableResultsCount', `(${count} results)`);
    }

    /**
     * Go to specific page
     */
    goToPage(page) {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        
        this.currentPage = page;
        this.updateBrowserState();
        this.loadUsers();
        
        // Scroll to table top
        const tableContainer = document.getElementById('tableContainer');
        if (tableContainer) {
            tableContainer.scrollTop = 0;
        }
    }

    /**
     * Toggle select all
     */
    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.user-checkbox');
        const userIds = Array.from(checkboxes).map(cb => cb.value);
        
        if (checked) {
            userIds.forEach(userId => this.selectedUsers.add(userId));
        } else {
            userIds.forEach(userId => this.selectedUsers.delete(userId));
        }
        
        // Update checkbox states and row styles
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            const row = checkbox.closest('tr');
            if (row) {
                row.classList.toggle('selected', checked);
            }
        });
        
        this.updateBulkActions();
    }

    /**
     * Toggle user selection
     */
    toggleUserSelection(userId, selected) {
        if (selected) {
            this.selectedUsers.add(userId);
        } else {
            this.selectedUsers.delete(userId);
        }
        
        // Update row style
        const row = document.querySelector(`tr[data-user-id="${userId}"]`);
        if (row) {
            row.classList.toggle('selected', selected);
        }
        
        this.updateBulkActions();
        this.updateSelectAllState();
    }

    /**
     * Update bulk actions visibility and state
     */
    updateBulkActions() {
        const bulkActions = document.getElementById('bulkActions');
        const selectedCount = document.getElementById('selectedCount');
        
        if (this.selectedUsers.size > 0) {
            bulkActions?.classList.remove('hidden');
            if (selectedCount) {
                selectedCount.textContent = `${this.selectedUsers.size} selected`;
            }
        } else {
            bulkActions?.classList.add('hidden');
        }
    }

    /**
     * Update select all checkbox state
     */
    updateSelectAllState() {
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        const visibleCheckboxes = document.querySelectorAll('.user-checkbox');
        
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

    /**
     * Clear selection
     */
    clearSelection() {
        this.selectedUsers.clear();
        
        document.querySelectorAll('.user-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        document.querySelectorAll('#usersTableBody tr').forEach(row => {
            row.classList.remove('selected');
        });
        
        this.updateBulkActions();
    }

    /**
     * Select all visible users
     */
    selectAllVisible() {
        const checkboxes = document.querySelectorAll('.user-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
            this.selectedUsers.add(checkbox.value);
            const row = checkbox.closest('tr');
            if (row) {
                row.classList.add('selected');
            }
        });
        
        this.updateBulkActions();
    }

    // ===== USER MANAGEMENT ACTIONS =====

    /**
     * View user details
     */
    async viewUser(userId) {
        try {
            console.log('👁️ View user:', userId);
            
            // Get user data
            const user = await this.getUserData(userId);
            if (user) {
                this.showUserDetailsModal(user);
            }
        } catch (error) {
            console.error('Error viewing user:', error);
            this.showError('Failed to load user details');
        }
    }

    /**
     * Edit user
     */
    async editUser(userId) {
        try {
            console.log('✏️ Edit user:', userId);
            
            // Get user data
            const user = await this.getUserData(userId);
            if (user) {
                this.showUserEditModal(user);
            }
        } catch (error) {
            console.error('Error loading user for edit:', error);
            this.showError('Failed to load user data for editing');
        }
    }

    /**
     * Approve user
     */
    async approveUser(userId) {
        const confirmed = await this.confirmAction(
            'Approve User',
            'Are you sure you want to approve this user?',
            'approve'
        );
        
        if (confirmed) {
            await this.performUserAction(userId, 'approve');
        }
    }

    /**
     * Reject user
     */
    async rejectUser(userId) {
        const reason = await this.promptForReason('Rejection Reason', 'Please provide a reason for rejection:');
        
        if (reason) {
            await this.performUserAction(userId, 'reject', { reason });
        }
    }

    /**
     * Block user
     */
    async blockUser(userId) {
        const reason = await this.promptForReason('Block User', 'Please provide a reason for blocking:');
        
        if (reason) {
            await this.performUserAction(userId, 'block', { reason });
        }
    }

    /**
     * Unblock user
     */
    async unblockUser(userId) {
        const confirmed = await this.confirmAction(
            'Unblock User',
            'Are you sure you want to unblock this user?',
            'unblock'
        );
        
        if (confirmed) {
            await this.performUserAction(userId, 'unblock');
        }
    }

    /**
     * Suspend user
     */
    async suspendUser(userId) {
        const reason = await this.promptForReason('Suspend User', 'Please provide a reason for suspension:');
        
        if (reason) {
            await this.performUserAction(userId, 'suspend', { reason });
        }
    }

    /**
     * Activate user
     */
    async activateUser(userId) {
        const confirmed = await this.confirmAction(
            'Activate User',
            'Are you sure you want to activate this user?',
            'activate'
        );
        
        if (confirmed) {
            await this.performUserAction(userId, 'activate');
        }
    }

    /**
     * Delete user (soft delete)
     */
    async deleteUser(userId) {
        const confirmed = await this.confirmAction(
            'Delete User',
            'Are you sure you want to delete this user? This action can be undone.',
            'delete'
        );
        
        if (confirmed) {
            await this.performUserAction(userId, 'delete');
        }
    }

    /**
     * Perform user action
     */
    async performUserAction(userId, action, data = {}) {
        try {
            this.showLoading(`${action.charAt(0).toUpperCase() + action.slice(1)}ing user...`);
            
            const response = await this.fetchWithRetry(this.endpoints.userAction, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    action,
                    ...data
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            this.showSuccess(`User ${action}ed successfully`);
            this.loadUsers(true); // Reload users
            this.updateTabCounts(); // Update counts
            
            // Clear selection if user was selected
            this.selectedUsers.delete(userId);
            this.updateBulkActions();
            
            // Track action
            this.trackEvent('user_action', { action, userId });
            
        } catch (error) {
            console.error(`❌ Error ${action}ing user:`, error);
            this.showError(`Failed to ${action} user. Please try again.`);
        } finally {
            this.hideLoading();
        }
    }

    // ===== BULK OPERATIONS =====

    /**
     * Bulk approve users
     */
    async bulkApproveUsers() {
        if (this.selectedUsers.size === 0) return;
        
        const confirmed = await this.confirmAction(
            'Bulk Approve',
            `Are you sure you want to approve ${this.selectedUsers.size} selected users?`,
            'approve'
        );
        
        if (confirmed) {
            await this.performBulkAction('approve');
        }
    }

    /**
     * Bulk block users
     */
    async bulkBlockUsers() {
        if (this.selectedUsers.size === 0) return;
        
        const reason = await this.promptForReason('Bulk Block', 'Please provide a reason for blocking:');
        
        if (reason) {
            await this.performBulkAction('block', { reason });
        }
    }

    /**
     * Bulk delete users
     */
    async bulkDeleteUsers() {
        if (this.selectedUsers.size === 0) return;
        
        const confirmed = await this.confirmAction(
            'Bulk Delete',
            `Are you sure you want to delete ${this.selectedUsers.size} selected users? This action can be undone.`,
            'delete'
        );
        
        if (confirmed) {
            await this.performBulkAction('delete');
        }
    }

    /**
     * Bulk export users
     */
    async bulkExportUsers() {
        if (this.selectedUsers.size === 0) return;
        
        try {
            this.showLoading('Preparing export...');
            
            const userIds = Array.from(this.selectedUsers);
            const response = await this.fetchWithRetry(this.endpoints.export, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userIds })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const filename = `users_export_${new Date().toISOString().split('T')[0]}.xlsx`;
            
            this.downloadFile(url, filename);
            this.showSuccess(`${userIds.length} users exported successfully`);
            
            // Track export
            this.trackEvent('bulk_export', { count: userIds.length });
            
        } catch (error) {
            console.error('❌ Error exporting users:', error);
            this.showError('Failed to export users. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Perform bulk action
     */
    async performBulkAction(action, data = {}) {
        if (this.selectedUsers.size === 0) return;
        
        try {
            this.showLoading(`${action.charAt(0).toUpperCase() + action.slice(1)}ing ${this.selectedUsers.size} users...`);
            
            const userIds = Array.from(this.selectedUsers);
            const response = await this.fetchWithRetry(this.endpoints.bulkAction, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userIds,
                    action,
                    ...data
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            this.showSuccess(`${userIds.length} users ${action}ed successfully`);
            this.loadUsers(true); // Reload users
            this.updateTabCounts(); // Update counts
            this.clearSelection(); // Clear selection
            
            // Track bulk action
            this.trackEvent('bulk_action', { action, count: userIds.length });
            
        } catch (error) {
            console.error(`❌ Error performing bulk ${action}:`, error);
            this.showError(`Failed to ${action} users. Please try again.`);
        } finally {
            this.hideLoading();
        }
    }

    // ===== UTILITY METHODS =====

    /**
     * Export users (general export)
     */
    async exportUsers() {
        try {
            this.showLoading('Preparing export...');
            
            const queryParams = this.buildQueryParams();
            const response = await this.fetchWithRetry(`${this.endpoints.export}?${queryParams}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const filename = `users_export_${this.currentTab}_${new Date().toISOString().split('T')[0]}.xlsx`;
            
            this.downloadFile(url, filename);
            this.showSuccess('Users exported successfully');
            
            // Track export
            this.trackEvent('export_users', { tab: this.currentTab, filters: this.activeFilters });
            
        } catch (error) {
            console.error('❌ Error exporting users:', error);
            this.showError('Failed to export users. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Get initials from name
     */
    getInitials(name) {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'U';
    }

    /**
     * Calculate profile completion score
     */
    calculateProfileScore(user) {
        // Use backend calculated score if available
        if (user.profileCompletionScore) {
            return user.profileCompletionScore;
        }
        
        // Fallback calculation
        let score = 0;
        const fields = [
            user.companyInfo?.name,
            user.companyInfo?.logo,
            user.contactInfo?.email,
            user.contactInfo?.phone,
            user.locationInfo?.country,
            user.businessInfo?.description,
            user.emailVerified
        ];
        
        fields.forEach(field => {
            if (field) score += 100 / fields.length;
        });
        
        return Math.round(score);
    }

    /**
     * Format date for display
     */
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

    /**
     * Show table loading state
     */
    showTableLoading() {
        const loadingOverlay = document.getElementById('tableLoadingOverlay');
        const emptyState = document.getElementById('tableEmptyState');
        
        if (loadingOverlay) {
            loadingOverlay.classList.add('show');
        }
        
        if (emptyState) {
            emptyState.classList.add('hidden');
        }
    }

    /**
     * Hide table loading state
     */
    hideTableLoading() {
        const loadingOverlay = document.getElementById('tableLoadingOverlay');
        
        if (loadingOverlay) {
            loadingOverlay.classList.remove('show');
        }
    }

    /**
     * Show global loading overlay
     */
    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        const text = document.getElementById('loadingText');
        
        if (overlay) {
            overlay.classList.remove('d-none');
            if (text) text.textContent = message;
        }
    }

    /**
     * Hide global loading overlay
     */
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('d-none');
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showToast(message, 'success');
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showToast(message, 'error');
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Create toast if it doesn't exist
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
        
        // Create toast element
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
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.getElementById(toastId)) {
                toast.style.animation = 'slideOutRight 0.3s ease-in forwards';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
        
        // Add CSS animations if not already added
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

    /**
     * Confirm action with user
     */
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
                approve: '#10B981',
                unblock: '#10B981',
                activate: '#10B981'
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
            
            // Close on overlay click
            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.remove();
                    resolve(false);
                }
            };
        });
    }

    /**
     * Prompt user for reason/input
     */
    async promptForReason(title, message, placeholder = '') {
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
            
            modal.innerHTML = `
                <div style="background: white; border-radius: 12px; padding: 24px; max-width: 500px; width: 90%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
                    <h3 style="margin: 0 0 16px 0; color: #374151; font-size: 1.25rem; font-weight: 600;">${title}</h3>
                    <p style="color: #6B7280; margin: 0 0 16px 0; line-height: 1.5;">${message}</p>
                    <textarea id="reasonInput" placeholder="${placeholder}" 
                             style="width: 100%; height: 80px; padding: 12px; border: 2px solid #E5E7EB; border-radius: 8px; resize: vertical; font-family: inherit;"
                             maxlength="500"></textarea>
                    <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px;">
                        <button id="cancelBtn" style="padding: 8px 16px; border: 1px solid #D1D5DB; background: white; color: #374151; border-radius: 6px; cursor: pointer; font-weight: 500;">
                            Cancel
                        </button>
                        <button id="submitBtn" style="padding: 8px 16px; border: none; background: #3B82F6; color: white; border-radius: 6px; cursor: pointer; font-weight: 500;">
                            Submit
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const input = modal.querySelector('#reasonInput');
            input.focus();
            
            modal.querySelector('#cancelBtn').onclick = () => {
                modal.remove();
                resolve(null);
            };
            
            modal.querySelector('#submitBtn').onclick = () => {
                const value = input.value.trim();
                if (value) {
                    modal.remove();
                    resolve(value);
                } else {
                    input.style.borderColor = '#EF4444';
                    input.focus();
                }
            };
            
            // Submit on Enter (Ctrl+Enter for new line)
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.ctrlKey) {
                    e.preventDefault();
                    modal.querySelector('#submitBtn').click();
                }
            });
            
            // Close on overlay click
            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.remove();
                    resolve(null);
                }
            };
        });
    }

    /**
     * Download file
     */
    downloadFile(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Close all action menus
     */
    closeAllActionMenus() {
        document.querySelectorAll('.actions-menu.show').forEach(menu => {
            menu.classList.remove('show');
        });
    }

    /**
     * Toggle action menu for user
     */
    toggleActionMenu(userId) {
        const menu = document.getElementById(`actions-${userId}`);
        if (menu) {
            const isVisible = menu.classList.contains('show');
            
            // Close all other menus
            this.closeAllActionMenus();
            
            // Toggle this menu
            if (!isVisible) {
                menu.classList.add('show');
            }
        }
    }

    /**
     * Update browser state for navigation
     */
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

    /**
     * Restore state from URL parameters
     */
    restoreState() {
        const params = new URLSearchParams(window.location.search);
        
        // Restore tab
        const tab = params.get('tab');
        if (tab) {
            const tabElement = document.querySelector(`[data-tab="${tab}"]`);
            if (tabElement) {
                this.switchTab(tabElement);
            }
        }
        
        // Restore page
        const page = parseInt(params.get('page'));
        if (page && page > 0) {
            this.currentPage = page;
        }
        
        // Restore filters
        Object.keys(this.activeFilters).forEach(key => {
            const value = params.get(key);
            if (value) {
                this.activeFilters[key] = value;
                this.pendingFilters[key] = value;
                
                // Update form inputs
                const inputId = key === 'search' ? 'searchInput' : `${key}Filter`;
                const input = document.getElementById(inputId);
                if (input) {
                    input.value = value;
                }
            }
        });
    }

    /**
     * Track analytics event
     */
    trackEvent(event, data = {}) {
        // Implementation depends on analytics service
        console.log('📊 Analytics:', event, data);
        
        // Example: Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', event, {
                custom_parameter_1: data.tab,
                custom_parameter_2: JSON.stringify(data)
            });
        }
    }

    /**
     * Fetch with retry logic
     */
    async fetchWithRetry(url, options = {}, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                // Get JWT token from cookie (accessToken is the JWT token)
                const token = this.getCookie('accessToken');
                
                const response = await fetch(url, {
                    ...options,
                    credentials: 'include', // Include cookies in request
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
                
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            }
        }
    }

    /**
     * Get cookie value by name
     */
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    /**
     * Get user data from API
     */
    async getUserData(userId) {
        try {
            const response = await this.fetchWithRetry(`${this.endpoints.users}/${userId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const responseData = await response.json();
            return responseData.success ? responseData.data : responseData;
            
        } catch (error) {
            console.error('Error fetching user data:', error);
            throw error;
        }
    }

    /**
     * Show user details modal
     */
    showUserDetailsModal(user) {
        const modal = document.createElement('div');
        modal.className = 'professional-modal-overlay';
        modal.innerHTML = `
            <div class="professional-modal user-details-modal">
                <div class="modal-header">
                    <div class="modal-title">
                        <i class="las la-user"></i>
                        User Details
                    </div>
                    <button class="modal-close" onclick="this.closest('.professional-modal-overlay').remove()">
                        <i class="las la-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="user-details-grid">
                        <div class="user-overview">
                            <div class="user-avatar-large">
                                ${user.companyInfo?.logo ? 
                                    `<img src="${user.companyInfo.logo}" alt="${this.escapeHtml(user.companyInfo?.name || 'Company')}">` :
                                    `<div class="avatar-placeholder-large">${this.getInitials(user.companyInfo?.name || 'Unknown')}</div>`
                                }
                            </div>
                            <div class="user-basic-info">
                                <h3>${this.escapeHtml(user.companyInfo?.name || 'N/A')}</h3>
                                <p class="user-email">${this.escapeHtml(user.contactInfo?.email || 'N/A')}</p>
                                <div class="user-status-large">
                                    ${this.renderProfessionalStatusBadge(user.status)}
                                </div>
                            </div>
                        </div>
                        
                        <div class="user-details-sections">
                            <div class="details-section">
                                <h4><i class="las la-building"></i> Company Information</h4>
                                <div class="details-grid">
                                    <div class="detail-item">
                                        <label>Company Name</label>
                                        <span>${this.escapeHtml(user.companyInfo?.name || 'N/A')}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Company Type</label>
                                        <span>${this.escapeHtml(user.companyInfo?.type || user.companyType || 'N/A')}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Activity Type</label>
                                        <span>${this.escapeHtml(user.activityType || 'N/A')}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Tax Number</label>
                                        <span>${this.escapeHtml(user.taxNumber || 'N/A')}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="details-section">
                                <h4><i class="las la-phone"></i> Contact Information</h4>
                                <div class="details-grid">
                                    <div class="detail-item">
                                        <label>Email</label>
                                        <span>${this.escapeHtml(user.contactInfo?.email || user.email || 'N/A')}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Phone</label>
                                        <span>${this.escapeHtml(user.contactInfo?.phone || user.phone || 'N/A')}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Contact Person</label>
                                        <span>${this.escapeHtml(user.contactInfo?.contactPerson || user.contactPerson || 'N/A')}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Website</label>
                                        <span>${user.website ? `<a href="${user.website}" target="_blank">${this.escapeHtml(user.website)}</a>` : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="details-section">
                                <h4><i class="las la-map-marker"></i> Location Information</h4>
                                <div class="details-grid">
                                    <div class="detail-item">
                                        <label>Country</label>
                                        <span>
                                            ${this.renderProfessionalCountryFlag(user.locationInfo?.country || user.country)}
                                            ${this.escapeHtml(user.locationInfo?.country || user.country || 'N/A')}
                                        </span>
                                    </div>
                                    <div class="detail-item">
                                        <label>City</label>
                                        <span>${this.escapeHtml(user.locationInfo?.city || user.city || 'N/A')}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Address</label>
                                        <span>${this.escapeHtml(user.locationInfo?.address || user.address || 'N/A')}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="details-section">
                                <h4><i class="las la-chart-bar"></i> Statistics</h4>
                                <div class="details-grid">
                                    <div class="detail-item">
                                        <label>Profile Completion</label>
                                        <span>
                                            <div class="professional-progress">
                                                <div class="professional-progress-bar">
                                                    <div class="professional-progress-fill" style="width: ${user.profileCompletionScore || 0}%"></div>
                                                </div>
                                                <span class="professional-progress-text">${user.profileCompletionScore || 0}%</span>
                                            </div>
                                        </span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Registration Date</label>
                                        <span>${this.formatDate(user.createdAt)}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Last Login</label>
                                        <span>${user.lastLoginAt ? this.formatDate(user.lastLoginAt) : 'Never'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Total Products</label>
                                        <span>${user.totalProducts || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-outline-secondary" onclick="this.closest('.professional-modal-overlay').remove()">
                        Close
                    </button>
                    <button class="btn btn-primary" onclick="usersManagement.editUser('${user._id}'); this.closest('.professional-modal-overlay').remove();">
                        <i class="las la-edit"></i>
                        Edit User
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Add escape key to close
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    /**
     * Show user edit modal
     */
    showUserEditModal(user) {
        const modal = document.createElement('div');
        modal.className = 'professional-modal-overlay';
        modal.innerHTML = `
            <div class="professional-modal user-edit-modal">
                <div class="modal-header">
                    <div class="modal-title">
                        <i class="las la-edit"></i>
                        Edit User
                    </div>
                    <button class="modal-close" onclick="this.closest('.professional-modal-overlay').remove()">
                        <i class="las la-times"></i>
                    </button>
                </div>
                
                <form class="modal-body user-edit-form" onsubmit="return usersManagement.handleUserUpdate(event, '${user._id}')">
                    <div class="form-sections">
                        <div class="form-section">
                            <h4><i class="las la-building"></i> Company Information</h4>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="edit_companyName">Company Name *</label>
                                    <input type="text" id="edit_companyName" name="companyName" value="${this.escapeHtml(user.companyInfo?.name || user.companyName || '')}" required>
                                </div>
                                <div class="form-group">
                                    <label for="edit_companyType">Company Type</label>
                                    <select id="edit_companyType" name="companyType">
                                        <option value="manufacturer" ${(user.companyInfo?.type || user.companyType) === 'manufacturer' ? 'selected' : ''}>Manufacturer</option>
                                        <option value="distributor" ${(user.companyInfo?.type || user.companyType) === 'distributor' ? 'selected' : ''}>Distributor</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="edit_activityType">Activity Type</label>
                                    <select id="edit_activityType" name="activityType">
                                        <option value="">Select Activity</option>
                                        <option value="food_beverages" ${user.activityType === 'food_beverages' ? 'selected' : ''}>Food & Beverages</option>
                                        <option value="textiles_clothing" ${user.activityType === 'textiles_clothing' ? 'selected' : ''}>Textiles & Clothing</option>
                                        <option value="electronics" ${user.activityType === 'electronics' ? 'selected' : ''}>Electronics</option>
                                        <option value="machinery_equipment" ${user.activityType === 'machinery_equipment' ? 'selected' : ''}>Machinery & Equipment</option>
                                        <option value="chemicals" ${user.activityType === 'chemicals' ? 'selected' : ''}>Chemicals</option>
                                        <option value="agriculture" ${user.activityType === 'agriculture' ? 'selected' : ''}>Agriculture</option>
                                        <option value="construction_materials" ${user.activityType === 'construction_materials' ? 'selected' : ''}>Construction Materials</option>
                                        <option value="automotive" ${user.activityType === 'automotive' ? 'selected' : ''}>Automotive</option>
                                        <option value="pharmaceuticals" ${user.activityType === 'pharmaceuticals' ? 'selected' : ''}>Pharmaceuticals</option>
                                        <option value="other" ${user.activityType === 'other' ? 'selected' : ''}>Other</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="edit_taxNumber">Tax Number</label>
                                    <input type="text" id="edit_taxNumber" name="taxNumber" value="${this.escapeHtml(user.taxNumber || '')}">
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <h4><i class="las la-phone"></i> Contact Information</h4>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="edit_email">Email *</label>
                                    <input type="email" id="edit_email" name="email" value="${this.escapeHtml(user.contactInfo?.email || user.email || '')}" required>
                                </div>
                                <div class="form-group">
                                    <label for="edit_phone">Phone</label>
                                    <input type="tel" id="edit_phone" name="phone" value="${this.escapeHtml(user.contactInfo?.phone || user.phone || '')}">
                                </div>
                                <div class="form-group">
                                    <label for="edit_contactPerson">Contact Person</label>
                                    <input type="text" id="edit_contactPerson" name="contactPerson" value="${this.escapeHtml(user.contactInfo?.contactPerson || user.contactPerson || '')}">
                                </div>
                                <div class="form-group">
                                    <label for="edit_website">Website</label>
                                    <input type="url" id="edit_website" name="website" value="${this.escapeHtml(user.website || '')}">
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <h4><i class="las la-map-marker"></i> Location Information</h4>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="edit_country">Country</label>
                                    <select id="edit_country" name="country">
                                        <option value="">Select Country</option>
                                        <option value="Uzbekistan" ${(user.locationInfo?.country || user.country) === 'Uzbekistan' ? 'selected' : ''}>Uzbekistan</option>
                                        <option value="Kazakhstan" ${(user.locationInfo?.country || user.country) === 'Kazakhstan' ? 'selected' : ''}>Kazakhstan</option>
                                        <option value="China" ${(user.locationInfo?.country || user.country) === 'China' ? 'selected' : ''}>China</option>
                                        <option value="Tajikistan" ${(user.locationInfo?.country || user.country) === 'Tajikistan' ? 'selected' : ''}>Tajikistan</option>
                                        <option value="Turkmenistan" ${(user.locationInfo?.country || user.country) === 'Turkmenistan' ? 'selected' : ''}>Turkmenistan</option>
                                        <option value="Afghanistan" ${(user.locationInfo?.country || user.country) === 'Afghanistan' ? 'selected' : ''}>Afghanistan</option>
                                        <option value="Kyrgyzstan" ${(user.locationInfo?.country || user.country) === 'Kyrgyzstan' ? 'selected' : ''}>Kyrgyzstan</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="edit_city">City</label>
                                    <input type="text" id="edit_city" name="city" value="${this.escapeHtml(user.locationInfo?.city || user.city || '')}">
                                </div>
                                <div class="form-group full-width">
                                    <label for="edit_address">Address</label>
                                    <textarea id="edit_address" name="address" rows="3">${this.escapeHtml(user.locationInfo?.address || user.address || '')}</textarea>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <h4><i class="las la-cog"></i> Status & Settings</h4>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="edit_status">Status</label>
                                    <select id="edit_status" name="status">
                                        <option value="pending" ${user.status === 'pending' ? 'selected' : ''}>Pending</option>
                                        <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                                        <option value="blocked" ${user.status === 'blocked' ? 'selected' : ''}>Blocked</option>
                                        <option value="suspended" ${user.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="edit_preferredLanguage">Preferred Language</label>
                                    <select id="edit_preferredLanguage" name="preferredLanguage">
                                        <option value="uz" ${user.preferredLanguage === 'uz' ? 'selected' : ''}>Uzbek</option>
                                        <option value="en" ${user.preferredLanguage === 'en' ? 'selected' : ''}>English</option>
                                        <option value="ru" ${user.preferredLanguage === 'ru' ? 'selected' : ''}>Russian</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" onclick="this.closest('.professional-modal-overlay').remove()">
                        Cancel
                    </button>
                    <button type="submit" class="btn btn-primary" form="userEditForm">
                        <i class="las la-save"></i>
                        Save Changes
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add form id for submit button
        const form = modal.querySelector('.user-edit-form');
        form.id = 'userEditForm';
        
        // Add click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Add escape key to close
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    /**
     * Handle user update form submission
     */
    async handleUserUpdate(event, userId) {
        event.preventDefault();
        
        try {
            this.showLoading('Updating user...');
            
            const formData = new FormData(event.target);
            const userData = Object.fromEntries(formData);
            
            const response = await this.fetchWithRetry(`${this.endpoints.users}/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.showSuccess('User updated successfully');
            this.loadUsers(true); // Reload users
            
            // Close modal
            const modal = event.target.closest('.professional-modal-overlay');
            if (modal) modal.remove();
            
        } catch (error) {
            console.error('Error updating user:', error);
            this.showError('Failed to update user. Please try again.');
        } finally {
            this.hideLoading();
        }
        
        return false;
    }

    /**
     * Debounce function calls
     */
    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * Update element content safely
     */
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Modal placeholder methods (TODO: Implement)
     */
    showUserDetailsModal(userId) {
        console.log('TODO: Implement user details modal for user:', userId);
        this.showToast('User details modal - Coming soon!', 'info');
    }

    showUserEditModal(userId) {
        console.log('TODO: Implement user edit modal for user:', userId);
        this.showToast('User edit modal - Coming soon!', 'info');
    }

    /**
     * Cleanup when component is destroyed
     */
    destroy() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResponsiveLayout);
        window.removeEventListener('popstate', this.restoreState);
        document.removeEventListener('visibilitychange', this.loadUsers);
        
        console.log('🧹 Users Management System destroyed');
    }
}

// Global instance and functions for window scope
let usersManagement;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    usersManagement = new UsersManagement();
    usersManagement.init();
});

// Global functions for inline event handlers
window.usersManagement = usersManagement;

// Expose global functions
window.toggleSelectAll = (checked) => usersManagement?.toggleSelectAll(checked);
window.clearAllFilters = () => usersManagement?.clearAllFilters();
window.applyFilters = () => usersManagement?.applyFilters();
window.refreshData = () => usersManagement?.refreshData();
window.exportUsers = () => usersManagement?.exportUsers();
window.bulkApproveUsers = () => usersManagement?.bulkApproveUsers();
window.bulkBlockUsers = () => usersManagement?.bulkBlockUsers();
window.bulkDeleteUsers = () => usersManagement?.bulkDeleteUsers();
window.bulkExportUsers = () => usersManagement?.bulkExportUsers();
window.openCreateUserModal = () => {
    console.log('TODO: Implement create user modal');
    usersManagement?.showToast('Create user modal - Coming soon!', 'info');
};

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    usersManagement?.destroy();
});

console.log('✅ Users Management JavaScript loaded successfully'); 