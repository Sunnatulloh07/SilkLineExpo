/**
 * Categories Management - Professional JavaScript
 * SLEX B2B Digital Marketplace Platform
 * Senior Software Engineer Level Implementation
 * 
 * Features:
 * - Professional table management with advanced filtering
 * - Hierarchical category display
 * - Bulk operations with confirmation
 * - Real-time statistics updates
 * - Mobile responsive design
 * - Advanced search and pagination
 * - Multi-language support
 * - Professional error handling
 */

class CategoriesManagement {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 25;
        this.totalPages = 1;
        this.totalItems = 0;
        this.isCreatingModal = false; // Flag to prevent duplicate modal creation
        this.filters = {
            status: '',
            search: '',
            productCount: '',
            dateRange: '',
            sortBy: 'createdAt',
            sortOrder: 'desc'
        };
        this.selectedCategories = new Set();
        this.categories = [];
        this.softDeletedCategories = [];
        this.statistics = {};
        this.isLoading = false;
        this.sortState = {};
        this.dropdownManagerSetup = false; // Flag to prevent duplicate dropdown setup
        
        // API endpoints
        this.endpoints = {
            categories: '/admin/api/categories',
            statistics: '/admin/api/categories/statistics',
            bulk: '/admin/api/categories/bulk',
            export: '/admin/api/categories/export',
            analytics: '/admin/api/categories/{id}/analytics',
            deleted: '/admin/api/categories/deleted'
        };

        // Initialize DOM elements
        this.initializeElements();
        
    }

    /**
     * Initialize DOM elements and event listeners
     */
    initializeElements() {
        // Main containers
        this.tableContainer = document.getElementById('tableContainer');
        this.categoriesTableBody = document.getElementById('categoriesTableBody');
        this.mobileCardsView = document.getElementById('mobileCardsView');
        this.loadingOverlay = document.getElementById('tableLoadingOverlay');
        this.emptyState = document.getElementById('tableEmptyState');
        
        // Filters
        this.searchInput = document.getElementById('searchInput');
        this.productCountFilter = document.getElementById('productCountFilter');
        this.dateRangeFilter = document.getElementById('dateRangeFilter');
        
        // Bulk actions
        this.selectAllCheckbox = document.getElementById('selectAllCheckbox');
        this.bulkActions = document.getElementById('bulkActions');
        this.selectedCount = document.getElementById('selectedCount');
        
        // Pagination
        this.paginationSection = document.getElementById('paginationSection');
        this.paginationControls = document.getElementById('paginationControls');
        this.paginationStart = document.getElementById('paginationStart');
        this.paginationEnd = document.getElementById('paginationEnd');
        this.paginationTotal = document.getElementById('paginationTotal');
        
        // Statistics elements
        this.totalCategoriesCount = document.getElementById('totalCategoriesCount');
        this.activeCategoriesCount = document.getElementById('activeCategoriesCount');
        this.totalProductsCount = document.getElementById('totalProductsCount');
        this.totalRevenueCount = document.getElementById('totalRevenueCount');
        
        // Tab elements
        this.allCategoriesTab = document.getElementById('allCategoriesTab');
        this.activeCategoriesTab = document.getElementById('activeCategoriesTab');
        this.draftCategoriesTab = document.getElementById('draftCategoriesTab');
        this.inactiveCategoriesTab = document.getElementById('inactiveCategoriesTab');
        this.tableResultsCount = document.getElementById('tableResultsCount');
    }

    /**
     * Initialize categories management system
     */
    async init() {
        try {
            
            await this.setupEventListeners();
            await this.loadInitialData();
            this.setupThemeListener(); // Add theme listener setup
            
        } catch (error) {
            console.error('❌ Error initializing Categories Management:', error);
            this.showError('Kategoriyalar boshqaruvi tizimini ishga tushirishda xatolik');
        }
    }

    /**
     * Remove existing event listeners to prevent duplicates
     */
    removeEventListeners() {
        // Remove all event listeners from elements
        const elements = [
            this.searchInput,
            this.productCountFilter,
            this.dateRangeFilter,
            this.selectAllCheckbox
        ];
        
        elements.forEach(element => {
            if (element) {
                // Clone element to remove all event listeners
                const newElement = element.cloneNode(true);
                element.parentNode.replaceChild(newElement, element);
            }
        });
        
        // Remove tab event listeners
        document.querySelectorAll('.tab-item').forEach(tab => {
            const newTab = tab.cloneNode(true);
            tab.parentNode.replaceChild(newTab, tab);
        });
    }

    /**
     * Setup event listeners
     */
    async setupEventListeners() {
        // Remove existing event listeners first
        this.removeEventListeners();
        
        // Search input with debounce
        if (this.searchInput) {
            this.searchInput.addEventListener('input', this.debounce(() => {
                this.filters.search = this.searchInput.value.trim();
                this.applyFilters();
            }, 500));
        }

        // Filter dropdowns
        const filterElements = [
            { element: this.productCountFilter, key: 'productCount' },
            { element: this.dateRangeFilter, key: 'dateRange' }
        ];

        filterElements.forEach(({ element, key }) => {
            if (element) {
                element.addEventListener('change', () => {
                    this.filters[key] = element.value;
                    this.applyFilters();
                });
            }
        });

        // Tab navigation
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleTabClick(tab);
            });
        });

        // Select all checkbox
        if (this.selectAllCheckbox) {
            this.selectAllCheckbox.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }

        // Responsive table handling
        window.addEventListener('resize', this.debounce(() => {
            this.handleResponsiveView();
        }, 250));

        // Setup dropdown event listeners
        this.setupDropdownEventListeners();

        this.handleResponsiveView();
    }

    /**
     * Setup dropdown event listeners
     */
    setupDropdownEventListeners() {
        // Remove existing dropdown listeners first
        this.removeDropdownListeners();
        
        // Setup professional dropdown management
        this.setupDropdownManager();
    }

    /**
     * Handle tab clicks
     */
    handleTabClick(clickedTab) {
        // Remove active class from all tabs
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.classList.remove('active');
        });

        // Add active class to clicked tab
        clickedTab.classList.add('active');

        // Update filters based on tab
        const status = clickedTab.dataset.status;
        const tabType = clickedTab.dataset.tab;

        // Handle deleted tab specially
        if (tabType === 'deleted') {
            this.showSoftDeletedCategories();
            return;
        }

        // Handle all categories tab specially
        if (tabType === 'all') {
            this.showAllCategories();
            return;
        }

        // Hide soft deleted container and show main table
        const softDeletedContainer = document.getElementById('softDeletedCategoriesContainer');
        const tableContainer = document.getElementById('tableContainer');
        
        if (softDeletedContainer) softDeletedContainer.style.display = 'none';
        if (tableContainer) tableContainer.style.display = 'block';

        if (status !== undefined) {
            this.filters.status = status;
        }

        this.applyFilters();
    }

    /**
     * Load parent categories for filter dropdown
     */


    /**
     * Load initial data
     */
    async loadInitialData() {
        await Promise.all([
            this.loadCategories(),
            this.loadStatistics()
        ]);
    }

    /**
     * Load categories with current filters
     */
    async loadCategories() {
        if (this.isLoading) return;

        try {
            this.isLoading = true;
            this.showLoading(true);

            const queryParams = new URLSearchParams({
                page: this.currentPage,
                pageSize: this.pageSize,
                ...this.filters
            });

            const response = await this.makeRequest(`${this.endpoints.categories}?${queryParams}`);
            
            if (response.success) {
                this.categories = response.data.categories;
                this.updatePaginationInfo(response.data.pagination);
                this.renderCategories();
                
                // Update deleted categories count
                await this.updateDeletedCategoriesCount();
                this.updateResultsCount();
            } else {
                throw new Error(response.error || 'Kategoriyalarni yuklashda xatolik');
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            this.showError('Kategoriyalarni yuklashda xatolik');
            this.renderEmptyState();
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    /**
     * Load category statistics
     */
    async loadStatistics() {
        try {
            const response = await this.makeRequest(this.endpoints.statistics);
            
            if (response.success) {
                this.statistics = response.data;
                this.updateStatisticsDisplay();
                this.updateTabCounts();
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }

    /**
     * Update statistics display
     */
    updateStatisticsDisplay() {
        const stats = this.statistics.overview || {};
        const businessMetrics = this.statistics.businessMetrics || {};

        if (this.totalCategoriesCount) {
            this.totalCategoriesCount.textContent = stats.total || 0;
        }
        if (this.activeCategoriesCount) {
            this.activeCategoriesCount.textContent = stats.active || 0;
        }
        if (this.totalProductsCount) {
            this.totalProductsCount.textContent = businessMetrics.totalProducts || 0;
        }
        if (this.totalRevenueCount) {
            this.totalRevenueCount.textContent = '$' + (businessMetrics.totalRevenue ? Math.round(businessMetrics.totalRevenue).toLocaleString() : '0');
        }
    }

    /**
     * Update tab counts
     */
    updateTabCounts() {
        const stats = this.statistics.overview || {};

        if (this.allCategoriesTab) {
            this.allCategoriesTab.textContent = stats.total || 0;
        }
        if (this.activeCategoriesTab) {
            this.activeCategoriesTab.textContent = stats.active || 0;
        }
        if (this.draftCategoriesTab) {
            this.draftCategoriesTab.textContent = stats.draft || 0;
        }
        if (this.inactiveCategoriesTab) {
            this.inactiveCategoriesTab.textContent = stats.inactive || 0;
        }
    }

    /**
     * Render categories in table/card format
     */
    renderCategories() {
        if (this.categories.length === 0) {
            this.renderEmptyState();
            return;
        }

        this.hideEmptyState();
        
        // Render desktop table
        if (this.categoriesTableBody) {
            this.categoriesTableBody.innerHTML = this.categories.map(category => 
                this.renderCategoryRow(category)
            ).join('');
        }

        // Render mobile cards
        if (this.mobileCardsView) {
            this.mobileCardsView.innerHTML = this.categories.map(category => 
                this.renderCategoryCard(category)
            ).join('');
        }

        this.updateBulkActionsVisibility();
    }

    /**
     * Render single category row
     */
    renderCategoryRow(category) {
        const isSelected = this.selectedCategories.has(category._id);
        
        return `
            <tr class="table-row ${isSelected ? 'selected' : ''}" data-category-id="${category._id}">
                <td class="td-select">
                    <label class="modern-checkbox">
                        <input type="checkbox" ${isSelected ? 'checked' : ''} 
                               onchange="window.categoriesManager.toggleCategorySelection('${category._id}', this.checked)">
                        <span class="checkbox-mark"></span>
                    </label>
                </td>
                <td class="td-category">
                    <div class="category-info-cell">
                        <div class="category-visual">
                            <div class="category-icon" style="background-color: ${category.color || '#3B82F6'}">
                                <i class="${category.icon || 'las la-folder'}"></i>
                            </div>
                            ${category.image?.url ? `<img src="${category.image.url}" alt="${category.image.alt || category.name}" class="category-thumbnail">` : ''}
                        </div>
                        <div class="category-details">
                            <div class="category-name-container">
                                <h4 class="category-name">${this.escapeHtml(category.name || 'N/A')}</h4>
                                <div class="category-badges">
                                    ${category.status === 'active' ? '<span class="badge badge-success">Faol</span>' : 
                                      category.status === 'inactive' ? '<span class="badge badge-warning">Nofaol</span>' : 
                                      '<span class="badge badge-secondary">Loyiha</span>'}
                                </div>
                            </div>
                            <p class="category-description">${this.escapeHtml(category.shortDescription || category.description || '').substring(0, 100)}${(category.description?.length > 100) ? '...' : ''}</p>
                            <div class="category-meta">
                                <span class="meta-item">
                                    <i class="las la-tag"></i>
                                    Slug: ${this.escapeHtml(category.slug)}
                                </span>
                            </div>
                        </div>
                    </div>
                </td>
                <td class="td-products">
                    <div class="products-analytics">
                        <div class="product-counts">
                            <div class="count-item primary">
                                <span class="count-value">${category.productStats?.total || 0}</span>
                                <span class="count-label">Jami mahsulotlar</span>
                            </div>
                            <div class="count-item success">
                                <span class="count-value">${category.productStats?.active || 0}</span>
                                <span class="count-label">Faol</span>
                            </div>
                        </div>
                        <div class="analytics-chart">
                            <div class="mini-progress">
                                <div class="progress-bar" style="width: ${category.productStats?.total > 0 ? (category.productStats.active / category.productStats.total * 100) : 0}%"></div>
                            </div>
                            <span class="progress-label">
                                ${category.productStats?.total > 0 ? Math.round(category.productStats.active / category.productStats.total * 100) : 0}% Faol
                            </span>
                        </div>
                    </div>
                </td>
                <td class="td-business">
                    <div class="business-metrics">
                        <div class="revenue-info">
                            <span class="revenue-value">$${(category.productStats?.revenue || 0).toLocaleString()}</span>
                            <span class="revenue-label">Jami daromad</span>
                        </div>
                        <div class="business-stats">
                            <div class="stat-row">
                                <i class="las la-chart-line text-success"></i>
                                <span>O'sish: +${category.metrics?.monthlyGrowth || 0}%</span>
                            </div>
                            <div class="stat-row">
                                <i class="las la-star text-warning"></i>
                                <span>Ball: ${category.metrics?.popularityScore || 0}/100</span>
                            </div>
                        </div>
                    </div>
                </td>
                <td class="td-status">
                    <div class="status-info">
                        <span class="status-badge status-${category.status}">
                            ${this.getStatusIcon(category.status)}
                            ${this.capitalizeFirst(category.status)}
                        </span>
                        <div class="status-details">
                            <span class="detail-item ${category.settings?.isActive ? 'text-success' : 'text-muted'}">
                                <i class="las ${category.settings?.isActive ? 'la-check-circle' : 'la-times-circle'}"></i>
                                ${category.settings?.isActive ? 'Faol' : 'Nofaol'}
                            </span>
                            <span class="detail-item ${category.settings?.isVisible ? 'text-info' : 'text-muted'}">
                                <i class="las ${category.settings?.isVisible ? 'la-eye' : 'la-eye-slash'}"></i>
                                ${category.settings?.isVisible ? 'Ko\'rinadi' : 'Yashirin'}
                            </span>
                        </div>
                    </div>
                </td>
                <td class="td-date">
                    <div class="date-info">
                        <div class="created-date">
                            <span class="date-value">${this.formatDate(category.createdAt)}</span>
                            <span class="date-label">Created</span>
                        </div>
                        <div class="date-details">
                            <span class="detail-item">
                                <i class="las la-user"></i>
                                ${category.creatorName || 'Noma\'lum'}
                            </span>
                            <span class="detail-item">
                                <i class="las la-clock"></i>
                                ${this.getRelativeTime(category.createdAt)}
                            </span>
                        </div>
                    </div>
                </td>
                <td class="td-actions">
                    <div class="action-buttons">
                        <div class="category-dropdown" data-category-id="${category._id}">
                            <button class="btn-action btn-more" data-dropdown-trigger="${category._id}" title="Amallar">
                                <i class="las la-ellipsis-v"></i>
                            </button>
                            <ul class="category-dropdown-menu" data-dropdown-menu="${category._id}">
                                <li><a class="dropdown-item" href="#" data-action="edit" data-category-id="${category._id}">
                                    <i class="las la-edit"></i>
                                    Tahrirlash
                                </a></li>
                                <li><a class="dropdown-item" href="#" data-action="analytics" data-category-id="${category._id}">
                                    <i class="las la-chart-bar"></i>
                                    Analitika
                                </a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item" href="#" data-action="toggle-active" data-category-id="${category._id}">
                                    <i class="las ${category.settings?.isActive ? 'la-pause' : 'la-play'}"></i>
                                    ${category.settings?.isActive ? 'Deaktivlashtirish' : 'Faollashtirish'}
                                </a></li>
                                <li><a class="dropdown-item" href="#" data-action="toggle-visibility" data-category-id="${category._id}">
                                    <i class="las ${category.settings?.isVisible ? 'la-eye-slash' : 'la-eye'}"></i>
                                    ${category.settings?.isVisible ? 'Yashirish' : 'Ko\'rsatish'}
                                </a></li>
                                <li><a class="dropdown-item" href="#" data-action="toggle-main-status" data-category-id="${category._id}">
                                    <i class="las ${category.status === 'active' ? 'la-pause-circle' : 'la-play-circle'}"></i>
                                    ${category.status === 'active' ? 'To\'xtatish' : 'Faollashtirish'}
                                </a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item" href="#" data-action="duplicate" data-category-id="${category._id}">
                                    <i class="las la-copy"></i>
                                    Nusxalash
                                </a></li>
                                <li><a class="dropdown-item danger" href="#" data-action="delete" data-category-id="${category._id}">
                                    <i class="las la-trash"></i>
                                    O'chirish
                                </a></li>
                            </ul>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Render category card for mobile view
     */
    renderCategoryCard(category) {
        const isSelected = this.selectedCategories.has(category._id);
        
        return `
            <div class="category-card ${isSelected ? 'selected' : ''}" data-category-id="${category._id}">
                <div class="card-header">
                    <div class="card-select">
                        <label class="modern-checkbox">
                            <input type="checkbox" ${isSelected ? 'checked' : ''} 
                                   onchange="window.categoriesManager.toggleCategorySelection('${category._id}', this.checked)">
                            <span class="checkbox-mark"></span>
                        </label>
                    </div>
                    <div class="card-status">
                        <span class="status-badge status-${category.status}">
                            ${this.getStatusIcon(category.status)}
                            ${this.capitalizeFirst(category.status)}
                        </span>
                    </div>
                </div>
                
                <div class="card-content">
                    <div class="category-header">
                        <div class="category-icon" style="background-color: ${category.color || '#3B82F6'}">
                            <i class="${category.icon || 'las la-folder'}"></i>
                        </div>
                        <div class="category-title">
                            <h4 class="category-name">${this.escapeHtml(category.name || 'N/A')}</h4>
                            <div class="category-badges">
                            </div>
                        </div>
                    </div>
                    
                    <p class="category-description">${this.escapeHtml(category.shortDescription || category.description || '').substring(0, 80)}${(category.description?.length > 80) ? '...' : ''}</p>
                    
                    <div class="category-stats">
                        <div class="stat-item">
                            <i class="las la-boxes"></i>
                            <span>${category.productStats?.total || 0} Mahsulot</span>
                        </div>
                        <div class="stat-item">
                            <i class="las la-dollar-sign"></i>
                            <span>$${(category.productStats?.revenue || 0).toLocaleString()}</span>
                        </div>
                    </div>
                    
                    <div class="category-meta">
                        <span class="meta-date">
                            <i class="las la-calendar"></i>
                            ${this.formatDate(category.createdAt)}
                        </span>
                        <span class="meta-creator">
                            <i class="las la-user"></i>
                            ${category.creatorName || 'Noma\'lum'}
                        </span>
                    </div>
                </div>
                
                <div class="card-actions">
                    <button class="btn btn-sm btn-outline-secondary" onclick="window.categoriesManager.editCategory('${category._id}')">
                        <i class="las la-edit"></i>
                        Tahrirlash
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="window.categoriesManager.viewAnalytics('${category._id}')">
                        <i class="las la-chart-bar"></i>
                        Analitika
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Handle responsive view switching
     */
    handleResponsiveView() {
        const isMobile = window.innerWidth <= 768;
        const desktopView = document.querySelector('.desktop-table-view');
        const mobileView = document.querySelector('.mobile-cards-view');
        
        if (desktopView && mobileView) {
            if (isMobile) {
                desktopView.style.display = 'none';
                mobileView.style.display = 'block';
            } else {
                desktopView.style.display = 'block';
                mobileView.style.display = 'none';
            }
        }
    }

    /**
     * Toggle category selection
     */
    toggleCategorySelection(categoryId, isSelected) {
        if (isSelected) {
            this.selectedCategories.add(categoryId);
        } else {
            this.selectedCategories.delete(categoryId);
        }
        
        this.updateRowSelection(categoryId, isSelected);
        this.updateBulkActionsVisibility();
        this.updateSelectAllState();
    }

    /**
     * Toggle select all
     */
    toggleSelectAll(selectAll) {
        this.selectedCategories.clear();
        
        if (selectAll) {
            this.categories.forEach(category => {
                this.selectedCategories.add(category._id);
            });
        }
        
        // Update all checkboxes
        document.querySelectorAll('input[type="checkbox"][onchange*="toggleCategorySelection"]').forEach(checkbox => {
            checkbox.checked = selectAll;
        });
        
        // Update row selections
        this.categories.forEach(category => {
            this.updateRowSelection(category._id, selectAll);
        });
        
        this.updateBulkActionsVisibility();
    }

    /**
     * Update row selection state
     */
    updateRowSelection(categoryId, isSelected) {
        const row = document.querySelector(`[data-category-id="${categoryId}"]`);
        if (row) {
            if (isSelected) {
                row.classList.add('selected');
            } else {
                row.classList.remove('selected');
            }
        }
    }

    /**
     * Update select all checkbox state
     */
    updateSelectAllState() {
        if (!this.selectAllCheckbox) return;
        
        const totalCategories = this.categories.length;
        const selectedCount = this.selectedCategories.size;
        
        if (selectedCount === 0) {
            this.selectAllCheckbox.checked = false;
            this.selectAllCheckbox.indeterminate = false;
        } else if (selectedCount === totalCategories) {
            this.selectAllCheckbox.checked = true;
            this.selectAllCheckbox.indeterminate = false;
        } else {
            this.selectAllCheckbox.checked = false;
            this.selectAllCheckbox.indeterminate = true;
        }
    }

    /**
     * Update bulk actions visibility
     */
    updateBulkActionsVisibility() {
        const selectedCount = this.selectedCategories.size;
        
        if (this.bulkActions) {
            if (selectedCount > 0) {
                this.bulkActions.classList.remove('hidden');
                if (this.selectedCount) {
                    this.selectedCount.textContent = `${selectedCount} selected`;
                }
            } else {
                this.bulkActions.classList.add('hidden');
            }
        }
    }

    /**
     * Apply filters
     */
    async applyFilters() {
        this.currentPage = 1;
        this.selectedCategories.clear();
        this.updateBulkActionsVisibility();
        await this.loadCategories();
    }

    /**
     * Clear all filters
     */
    clearAllFilters() {
        this.filters = {
            status: '',
            search: '',
            productCount: '',
            dateRange: '',
            sortBy: 'createdAt',
            sortOrder: 'desc'
        };
        
        // Reset form elements
        if (this.searchInput) this.searchInput.value = '';
        if (this.productCountFilter) this.productCountFilter.value = '';
        if (this.dateRangeFilter) this.dateRangeFilter.value = '';
        
        // Reset active tab
        document.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));
        document.querySelector('.tab-item[data-tab="all"]')?.classList.add('active');
        
        this.applyFilters();
    }

    /**
     * Sort table by column
     */
    sortTable(column) {
        if (this.filters.sortBy === column) {
            this.filters.sortOrder = this.filters.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.filters.sortBy = column;
            this.filters.sortOrder = 'asc';
        }
        
        this.updateSortIndicators(column, this.filters.sortOrder);
        this.applyFilters();
    }

    /**
     * Update sort indicators
     */
    updateSortIndicators(activeColumn, order) {
        document.querySelectorAll('.sort-indicator .sort-icon').forEach(icon => {
            icon.className = 'las la-sort sort-icon';
        });
        
        const activeHeader = document.querySelector(`[data-column="${activeColumn}"] .sort-icon`);
        if (activeHeader) {
            activeHeader.className = `las la-sort-${order === 'asc' ? 'up' : 'down'} sort-icon`;
        }
    }

    /**
     * Pagination methods
     */
    updatePaginationInfo(pagination) {
        this.currentPage = pagination.currentPage;
        this.totalPages = pagination.totalPages;
        this.totalItems = pagination.totalItems;
        
        this.renderPagination();
        this.updatePaginationText();
    }

    renderPagination() {
        if (!this.paginationControls) return;
        
        const pagination = this.generatePaginationHTML();
        this.paginationControls.innerHTML = pagination;
    }

    generatePaginationHTML() {
        if (this.totalPages <= 1) return '';
        
        let html = '';
        
        // Previous button
        html += `
            <button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                    onclick="window.categoriesManager.goToPage(${this.currentPage - 1})"
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                <i class="las la-chevron-left"></i>
                Previous
            </button>
        `;
        
        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);
        
        if (startPage > 1) {
            html += `<button class="pagination-btn" onclick="window.categoriesManager.goToPage(1)">1</button>`;
            if (startPage > 2) {
                html += '<span class="pagination-ellipsis">...</span>';
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="window.categoriesManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }
        
        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                html += '<span class="pagination-ellipsis">...</span>';
            }
            html += `<button class="pagination-btn" onclick="window.categoriesManager.goToPage(${this.totalPages})">${this.totalPages}</button>`;
        }
        
        // Next button
        html += `
            <button class="pagination-btn ${this.currentPage === this.totalPages ? 'disabled' : ''}" 
                    onclick="window.categoriesManager.goToPage(${this.currentPage + 1})"
                    ${this.currentPage === this.totalPages ? 'disabled' : ''}>
                Next
                <i class="las la-chevron-right"></i>
            </button>
        `;
        
        return html;
    }

    updatePaginationText() {
        const start = ((this.currentPage - 1) * this.pageSize) + 1;
        const end = Math.min(this.currentPage * this.pageSize, this.totalItems);
        
        if (this.paginationStart) this.paginationStart.textContent = start;
        if (this.paginationEnd) this.paginationEnd.textContent = end;
        if (this.paginationTotal) this.paginationTotal.textContent = this.totalItems;
    }

    goToPage(page) {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        
        this.currentPage = page;
        this.loadCategories();
    }

    updateResultsCount() {
        if (this.tableResultsCount) {
            this.tableResultsCount.textContent = `(${this.totalItems} results)`;
        }
    }

    /**
     * Update deleted categories count in tab
     */
    async updateDeletedCategoriesCount() {
        try {
            // Use statistics endpoint instead of separate API call for better performance
            const response = await this.makeRequest(this.endpoints.statistics, {
                method: 'GET'
            });

            if (response.success && response.data?.overview?.deleted !== undefined) {
                const deletedCount = response.data.overview.deleted;
                const deletedTab = document.getElementById('deletedCategoriesTab');
                if (deletedTab) {
                    deletedTab.textContent = deletedCount;
                }
            }
        } catch (error) {
            console.error('Error updating deleted categories count:', error);
        }
    }

    /**
     * Category action methods
     */

    async editCategory(categoryId) {
        try {
            // Check if modal is already being created
            if (this.isCreatingModal) {
                return;
            }
            
            await this.showEditModal(categoryId);
        } catch (error) {
            console.error('❌ Error in editCategory:', error);
            this.showError('Kategoriya tahrirlash modali ochishda xatolik');
        }
    }

    async viewAnalytics(categoryId) {
        try {
            const response = await this.makeRequest(this.endpoints.analytics.replace('{id}', categoryId));
            if (response.success) {
                this.showNotification('Kategoriya analitikasi muvaffaqiyatli yuklandi', 'success');
                // Implementation for showing analytics modal/page
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.showError('Kategoriya analitikasini yuklashda xatolik');
        }
    }

    async toggleCategoryActive(categoryId) {
        try {
            // Validate categoryId
            if (!categoryId || !categoryId.match(/^[0-9a-fA-F]{24}$/)) {
                this.showError('Noto\'g\'ri kategoriya ID');
                return;
            }

            const category = this.categories.find(c => c._id === categoryId);
            if (!category) {
                this.showError('Kategoriya topilmadi');
                return;
            }

            const currentStatus = category.settings?.isActive;
            const newStatus = !currentStatus;
            const actionText = newStatus ? 'faollashtirildi' : 'deaktivlashtirildi';

            // Find and update the toggle button to show loading state
            const toggleButton = document.querySelector(`[data-action="toggle-status"][data-category-id="${categoryId}"]`);
            if (toggleButton) {
                const originalContent = toggleButton.innerHTML;
                toggleButton.innerHTML = '<i class="las la-spinner la-spin"></i> Yangilanmoqda...';
                toggleButton.style.pointerEvents = 'none';
                toggleButton.style.opacity = '0.6';
            }

            // Call the new dedicated toggle status API
            const response = await this.makeRequest(`${this.endpoints.categories}/${categoryId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({
                    isActive: newStatus
                })
            });

            if (response.success) {
                this.showNotification(`Kategoriya muvaffaqiyatli ${actionText}`, 'success');
                
                // Update local data immediately for better UX
                category.settings.isActive = newStatus;
                
                // Refresh the table to show updated status
                await this.loadCategories();
                await this.loadStatistics();
            } else {
                throw new Error(response.message || 'Kategoriya holatini yangilashda xatolik');
            }
        } catch (error) {
            console.error('Error toggling category status:', error);
            
            // Handle different types of errors
            let errorMessage = 'Kategoriya holatini yangilashda xatolik';
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Internet aloqasi xatoligi. Qayta urinib ko\'ring';
            } else if (error.message.includes('404')) {
                errorMessage = 'Kategoriya topilmadi';
            } else if (error.message.includes('403')) {
                errorMessage = 'Bu kategoriyani o\'zgartirish uchun ruxsat yo\'q';
            } else if (error.message.includes('500')) {
                errorMessage = 'Server xatoligi. Qayta urinib ko\'ring';
            } else if (error.message.includes('Too many updates')) {
                errorMessage = 'Juda ko\'p o\'zgarishlar. Biroz kutib, qayta urinib ko\'ring';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            this.showError(errorMessage);
            
            // Restore button state on error
            const toggleButton = document.querySelector(`[data-action="toggle-active"][data-category-id="${categoryId}"]`);
            if (toggleButton) {
                const category = this.categories.find(c => c._id === categoryId);
                if (category) {
                    const isActive = category.settings?.isActive;
                    toggleButton.innerHTML = `
                        <i class="las ${isActive ? 'la-pause' : 'la-play'}"></i>
                        ${isActive ? 'Deaktivlashtirish' : 'Faollashtirish'}
                    `;
                }
                toggleButton.style.pointerEvents = 'auto';
                toggleButton.style.opacity = '1';
            }
        }
    }


    async toggleCategoryVisibility(categoryId) {
        try {
            // Validate categoryId
            if (!categoryId || !categoryId.match(/^[0-9a-fA-F]{24}$/)) {
                this.showError('Noto\'g\'ri kategoriya ID');
                return;
            }

            const category = this.categories.find(c => c._id === categoryId);
            if (!category) {
                this.showError('Kategoriya topilmadi');
                return;
            }

            const currentVisibility = category.settings?.isVisible ?? true;
            const newVisibility = !currentVisibility;
            const actionText = newVisibility ? 'ko\'rsatildi' : 'yashirildi';

            // Find and update the toggle button to show loading state
            const toggleButton = document.querySelector(`[data-action="toggle-visibility"][data-category-id="${categoryId}"]`);
            if (toggleButton) {
                const originalContent = toggleButton.innerHTML;
                toggleButton.innerHTML = '<i class="las la-spinner la-spin"></i> Yangilanmoqda...';
                toggleButton.style.pointerEvents = 'none';
                toggleButton.style.opacity = '0.6';
            }

            // Call the visibility toggle API
            const response = await this.makeRequest(`${this.endpoints.categories}/${categoryId}/visibility`, {
                method: 'PATCH',
                body: JSON.stringify({
                    isVisible: newVisibility
                })
            });

            if (response.success) {
                this.showNotification(`Kategoriya muvaffaqiyatli ${actionText}`, 'success');
                
                // Update local data immediately for better UX
                category.settings.isVisible = newVisibility;
                
                // Refresh the table to show updated status
                await this.loadCategories();
                await this.loadStatistics();
            } else {
                throw new Error(response.message || 'Kategoriya ko\'rinishini yangilashda xatolik');
            }
        } catch (error) {
            console.error('Error toggling category visibility:', error);
            
            // Handle different types of errors
            let errorMessage = 'Kategoriya ko\'rinishini yangilashda xatolik';
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Internet aloqasi xatoligi. Qayta urinib ko\'ring';
            } else if (error.message.includes('404')) {
                errorMessage = 'Kategoriya topilmadi';
            } else if (error.message.includes('403')) {
                errorMessage = 'Bu kategoriyani o\'zgartirish uchun ruxsat yo\'q';
            } else if (error.message.includes('500')) {
                errorMessage = 'Server xatoligi. Qayta urinib ko\'ring';
            } else if (error.message.includes('Too many updates')) {
                errorMessage = 'Juda ko\'p o\'zgarishlar. Biroz kutib, qayta urinib ko\'ring';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            this.showError(errorMessage);
            
            // Restore button state on error
            const toggleButton = document.querySelector(`[data-action="toggle-visibility"][data-category-id="${categoryId}"]`);
            if (toggleButton) {
                const category = this.categories.find(c => c._id === categoryId);
                if (category) {
                    const isVisible = category.settings?.isVisible ?? true;
                    toggleButton.innerHTML = `
                        <i class="las ${isVisible ? 'la-eye-slash' : 'la-eye'}"></i>
                        ${isVisible ? 'Yashirish' : 'Ko\'rsatish'}
                    `;
                }
                toggleButton.style.pointerEvents = 'auto';
                toggleButton.style.opacity = '1';
            }
        }
    }

    async toggleCategoryMainStatus(categoryId) {
        try {
            // Validate categoryId
            if (!categoryId || !categoryId.match(/^[0-9a-fA-F]{24}$/)) {
                this.showError('Noto\'g\'ri kategoriya ID');
                return;
            }

            const category = this.categories.find(c => c._id === categoryId);
            if (!category) {
                this.showError('Kategoriya topilmadi');
                return;
            }

            const currentStatus = category.status;
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            const actionText = newStatus === 'active' ? 'faollashtirildi' : 'to\'xtatildi';

            // Find and update the toggle button to show loading state
            const toggleButton = document.querySelector(`[data-action="toggle-main-status"][data-category-id="${categoryId}"]`);
            if (toggleButton) {
                const originalContent = toggleButton.innerHTML;
                toggleButton.innerHTML = '<i class="las la-spinner la-spin"></i> Yangilanmoqda...';
                toggleButton.style.pointerEvents = 'none';
                toggleButton.style.opacity = '0.6';
            }

            // Call the main status toggle API
            const response = await this.makeRequest(`${this.endpoints.categories}/${categoryId}/main-status`, {
                method: 'PATCH',
                body: JSON.stringify({
                    status: newStatus
                })
            });

            if (response.success) {
                this.showNotification(`Kategoriya asosiy holati muvaffaqiyatli ${actionText}`, 'success');
                
                // Update local data immediately for better UX
                category.status = newStatus;
                
                // Refresh the table to show updated status
                await this.loadCategories();
                await this.loadStatistics();
            } else {
                throw new Error(response.message || 'Kategoriya asosiy holatini yangilashda xatolik');
            }
        } catch (error) {
            console.error('Error toggling category main status:', error);
            
            // Handle different types of errors
            let errorMessage = 'Kategoriya asosiy holatini yangilashda xatolik';
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Internet aloqasi xatoligi. Qayta urinib ko\'ring';
            } else if (error.message.includes('404')) {
                errorMessage = 'Kategoriya topilmadi';
            } else if (error.message.includes('403')) {
                errorMessage = 'Bu kategoriyani o\'zgartirish uchun ruxsat yo\'q';
            } else if (error.message.includes('500')) {
                errorMessage = 'Server xatoligi. Qayta urinib ko\'ring';
            } else if (error.message.includes('Too many updates')) {
                errorMessage = 'Juda ko\'p o\'zgarishlar. Biroz kutib, qayta urinib ko\'ring';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            this.showError(errorMessage);
            
            // Restore button state on error
            const toggleButton = document.querySelector(`[data-action="toggle-main-status"][data-category-id="${categoryId}"]`);
            if (toggleButton) {
                const category = this.categories.find(c => c._id === categoryId);
                if (category) {
                    const status = category.status;
                    toggleButton.innerHTML = `
                        <i class="las ${status === 'active' ? 'la-pause-circle' : 'la-play-circle'}"></i>
                        ${status === 'active' ? 'To\'xtatish' : 'Faollashtirish'}
                    `;
                }
                toggleButton.style.pointerEvents = 'auto';
                toggleButton.style.opacity = '1';
            }
        }
    }

    /**
     * Delete category with safety checks
     * Senior Software Engineer Implementation
     */
    async deleteCategory(categoryId) {
        try {
            // Validate categoryId
            if (!categoryId || !categoryId.match(/^[0-9a-fA-F]{24}$/)) {
                this.showError('Noto\'g\'ri kategoriya ID');
                return;
            }

            const category = this.categories.find(c => c._id === categoryId);
            if (!category) {
                this.showError('Kategoriya topilmadi');
                return;
            }

            // Get deletion safety info first
            this.showNotification('Kategoriya o\'chirish xavfsizligi tekshirilmoqda...', 'info');
            
            const safetyInfo = await this.getCategoryDeletionInfo(categoryId);
            
            if (!safetyInfo.success) {
                throw new Error(safetyInfo.message || 'Xavfsizlik ma\'lumotlarini olishda xatolik');
            }

            const { canDelete, warnings, productCount, childCount, isSystemDefault } = safetyInfo.data;

            // Show confirmation modal with safety info
            const confirmed = await this.showDeleteConfirmationModal(category, {
                canDelete,
                warnings,
                productCount,
                childCount,
                isSystemDefault
            });

            if (!confirmed) {
                return; // User cancelled
            }

            // Perform deletion
            const deleteButton = document.querySelector(`[data-action="delete"][data-category-id="${categoryId}"]`);
            if (deleteButton) {
                const originalContent = deleteButton.innerHTML;
                deleteButton.innerHTML = '<i class="las la-spinner la-spin"></i> O\'chirilmoqda...';
                deleteButton.style.pointerEvents = 'none';
                deleteButton.style.opacity = '0.6';
            }

            const response = await this.makeRequest(`${this.endpoints.categories}/${categoryId}`, {
                method: 'DELETE',
                body: JSON.stringify({
                    forceDelete: !canDelete // Force delete if not safe
                })
            });

            if (response.success) {
                this.showNotification(`Kategoriya "${this.escapeHtml(category.name)}" muvaffaqiyatli o'chirildi`, 'success');
                
                // Remove from local data
                this.categories = this.categories.filter(c => c._id !== categoryId);
                
                // Refresh data
                await this.loadCategories();
                await this.loadStatistics();
            } else {
                throw new Error(response.message || 'Kategoriyani o\'chirishda xatolik');
            }

        } catch (error) {
            console.error('Error deleting category:', error);
            
            // Handle different types of errors
            let errorMessage = 'Kategoriyani o\'chirishda xatolik';
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Internet aloqasi xatoligi. Qayta urinib ko\'ring';
            } else if (error.message.includes('404')) {
                errorMessage = 'Kategoriya topilmadi';
            } else if (error.message.includes('403')) {
                errorMessage = 'Bu kategoriyani o\'chirish uchun ruxsat yo\'q';
            } else if (error.message.includes('500')) {
                errorMessage = 'Server xatoligi. Qayta urinib ko\'ring';
            } else if (error.message.includes('Cannot delete category')) {
                errorMessage = error.message; // Show specific safety error
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            this.showError(errorMessage);
            
            // Restore button state on error
            const deleteButton = document.querySelector(`[data-action="delete"][data-category-id="${categoryId}"]`);
            if (deleteButton) {
                deleteButton.innerHTML = '<i class="las la-trash"></i> O\'chirish';
                deleteButton.style.pointerEvents = 'auto';
                deleteButton.style.opacity = '1';
            }
        }
    }

    /**
     * Get category deletion safety info
     */
    async getCategoryDeletionInfo(categoryId) {
        try {
            const response = await this.makeRequest(`${this.endpoints.categories}/${categoryId}/deletion-info`, {
                method: 'GET'
            });

            return response;
        } catch (error) {
            console.error('Error getting deletion info:', error);
            return {
                success: false,
                message: error.message || 'Xavfsizlik ma\'lumotlarini olishda xatolik'
            };
        }
    }

    /**
     * Show delete confirmation modal with safety info
     */
    async showDeleteConfirmationModal(category, safetyInfo) {
        return new Promise((resolve) => {
            const { canDelete, warnings, productCount, childCount, isSystemDefault } = safetyInfo;
            
            const modal = document.createElement('div');
            modal.className = 'professional-modal-overlay';
            modal.innerHTML = `
                <div class="professional-modal" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3 class="modal-title">
                            <i class="las la-exclamation-triangle text-warning"></i>
                            Kategoriyani o'chirish
                        </h3>
                        <button class="modal-close" onclick="this.closest('.professional-modal-overlay').remove()">
                            <i class="las la-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="alert alert-warning">
                            <strong>Ogohlantirish:</strong> Bu amalni bekor qilib bo'lmaydi!
                        </div>
                        
                        <div class="category-info">
                            <h4>Kategoriya ma'lumotlari:</h4>
                            <p><strong>Nomi:</strong> ${this.escapeHtml(category.name)}</p>
                            <p><strong>Slug:</strong> ${this.escapeHtml(category.slug)}</p>
                            <p><strong>Holat:</strong> ${category.status}</p>
                        </div>
                        
                        ${!canDelete ? `
                            <div class="alert alert-danger">
                                <h5><i class="las la-ban"></i> O'chirish mumkin emas!</h5>
                                <ul class="mb-0">
                                    ${warnings.map(warning => `<li>${warning}</li>`).join('')}
                                </ul>
                            </div>
                            
                            <div class="force-delete-warning">
                                <label class="checkbox-container">
                                    <input type="checkbox" id="forceDeleteCheckbox">
                                    <span class="checkmark"></span>
                                    <strong>Majburiy o'chirish</strong> - Barcha bog'liq ma'lumotlar bilan birga o'chirish
                                </label>
                                <small class="text-muted">Bu kategoriyada ${productCount} ta mahsulot va ${childCount} ta kichik kategoriya mavjud.</small>
                            </div>
                        ` : `
                            <div class="alert alert-info">
                                <i class="las la-info-circle"></i>
                                Bu kategoriya xavfsiz o'chirilishi mumkin.
                            </div>
                        `}
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.professional-modal-overlay').remove(); window.deleteConfirmationResult = false;">
                            Bekor qilish
                        </button>
                        <button type="button" class="btn btn-danger" id="confirmDeleteBtn">
                            <i class="las la-trash"></i>
                            ${canDelete ? 'O\'chirish' : 'Majburiy o\'chirish'}
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Show modal
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);

            // Handle confirm button
            const confirmBtn = modal.querySelector('#confirmDeleteBtn');
            const forceDeleteCheckbox = modal.querySelector('#forceDeleteCheckbox');
            
            confirmBtn.addEventListener('click', () => {
                if (!canDelete && forceDeleteCheckbox && !forceDeleteCheckbox.checked) {
                    this.showError('Majburiy o\'chirish uchun checkbox\'ni belgilang');
                    return;
                }
                
                modal.remove();
                window.deleteConfirmationResult = true;
            });

            // Handle close button
            modal.querySelector('.modal-close').addEventListener('click', () => {
                modal.remove();
                window.deleteConfirmationResult = false;
            });

            // Handle overlay click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                    window.deleteConfirmationResult = false;
                }
            });

            // Wait for result
            const checkResult = () => {
                if (window.deleteConfirmationResult !== undefined) {
                    const result = window.deleteConfirmationResult;
                    delete window.deleteConfirmationResult;
                    resolve(result);
                } else {
                    setTimeout(checkResult, 100);
                }
            };
            checkResult();
        });
    }

    /**
     * Load soft deleted categories
     */
    async loadSoftDeletedCategories() {
        try {
            this.isLoading = true;
            
            const response = await this.makeRequest(`${this.endpoints.deleted}?page=1&limit=50`, {
                method: 'GET'
            });

            if (response.success) {
                this.softDeletedCategories = response.data.categories;
                this.renderSoftDeletedCategories();
            } else {
                throw new Error(response.message || 'Soft deleted categories yuklashda xatolik');
            }
        } catch (error) {
            console.error('Error loading soft deleted categories:', error);
            this.showNotification('Soft deleted categories yuklashda xatolik', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Show all categories (active, inactive, and soft deleted)
     */
    async showAllCategories() {
        // Show main table
        const tableContainer = document.getElementById('tableContainer');
        const softDeletedContainer = document.getElementById('softDeletedCategoriesContainer');
        
        if (tableContainer) tableContainer.style.display = 'block';
        if (softDeletedContainer) softDeletedContainer.style.display = 'none';

        // Load all categories (including soft deleted)
        await this.loadAllCategories();
    }

    /**
     * Load all categories including soft deleted
     */
    async loadAllCategories() {
        try {
            this.isLoading = true;
            
            // Load regular categories
            await this.loadCategories();
            
            // Load soft deleted categories
            await this.loadSoftDeletedCategories();
            
            // Combine both lists
            this.allCategories = [...this.categories, ...this.softDeletedCategories];
            
            // Render combined list
            this.renderAllCategories();
            
        } catch (error) {
            console.error('Error loading all categories:', error);
            this.showNotification('Barcha kategoriyalarni yuklashda xatolik', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Render all categories (active, inactive, and soft deleted)
     */
    renderAllCategories() {
        if (!this.allCategories || this.allCategories.length === 0) {
            this.renderEmptyState();
            return;
        }

        this.hideEmptyState();
        
        // Render desktop table
        if (this.categoriesTableBody) {
            this.categoriesTableBody.innerHTML = this.allCategories.map(category => 
                this.renderAllCategoryRow(category)
            ).join('');
        }

        // Render mobile cards
        if (this.mobileCardsView) {
            this.mobileCardsView.innerHTML = this.allCategories.map(category => 
                this.renderAllCategoryCard(category)
            ).join('');
        }

        this.updateBulkActionsVisibility();
    }

    /**
     * Render single category row for all categories view
     */
    renderAllCategoryRow(category) {
        const isSelected = this.selectedCategories.has(category._id);
        const isDeleted = category.status === 'deleted';
        
        return `
            <tr class="table-row ${isSelected ? 'selected' : ''}" data-category-id="${category._id}">
                <td class="td-select">
                    <label class="modern-checkbox">
                        <input type="checkbox" ${isSelected ? 'checked' : ''} 
                               onchange="window.categoriesManager.toggleCategorySelection('${category._id}', this.checked)">
                        <span class="checkbox-mark"></span>
                    </label>
                </td>
                <td class="td-category">
                    <div class="category-info-cell">
                        <div class="category-visual">
                            <div class="category-icon" style="background-color: ${category.color || '#3B82F6'}">
                                <i class="${category.icon || 'las la-folder'}"></i>
                            </div>
                            ${category.image?.url ? `<img src="${category.image.url}" alt="${category.image.alt || category.name}" class="category-thumbnail">` : ''}
                        </div>
                        <div class="category-details">
                            <div class="category-name-container">
                                <h4 class="category-name">${this.escapeHtml(category.name || 'N/A')}</h4>
                                <div class="category-badges">
                                    ${isDeleted ? '<span class="badge badge-danger">O\'chirilgan</span>' :
                                      category.status === 'active' ? '<span class="badge badge-success">Faol</span>' : 
                                      category.status === 'inactive' ? '<span class="badge badge-warning">Nofaol</span>' : 
                                      '<span class="badge badge-secondary">Loyiha</span>'}
                                </div>
                            </div>
                            <p class="category-description">${this.escapeHtml(category.shortDescription || category.description || '').substring(0, 100)}${(category.description?.length > 100) ? '...' : ''}</p>
                            <div class="category-meta">
                                <span class="meta-item">
                                    <i class="las la-tag"></i>
                                    Slug: ${this.escapeHtml(category.slug)}
                                </span>
                                ${isDeleted ? `
                                    <span class="meta-item">
                                        <i class="las la-calendar-times"></i>
                                        O'chirilgan: ${this.formatDate(category.deletedAt)}
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </td>
                <td class="td-products">
                    <div class="products-analytics">
                        <div class="product-counts">
                            <div class="count-item primary">
                                <span class="count-value">${category.productStats?.total || category.metrics?.totalProducts || 0}</span>
                                <span class="count-label">Jami mahsulotlar</span>
                            </div>
                            <div class="count-item success">
                                <span class="count-value">${category.productStats?.active || 0}</span>
                                <span class="count-label">Faol</span>
                            </div>
                        </div>
                        <div class="analytics-chart">
                            <div class="mini-progress">
                                <div class="progress-bar" style="width: ${(category.productStats?.total || category.metrics?.totalProducts || 0) > 0 ? ((category.productStats?.active || 0) / (category.productStats?.total || category.metrics?.totalProducts || 1) * 100) : 0}%"></div>
                            </div>
                            <span class="progress-label">
                                ${(category.productStats?.total || category.metrics?.totalProducts || 0) > 0 ? Math.round((category.productStats?.active || 0) / (category.productStats?.total || category.metrics?.totalProducts || 1) * 100) : 0}% Faol
                            </span>
                        </div>
                    </div>
                </td>
                <td class="td-business">
                    <div class="business-metrics">
                        <div class="revenue-info">
                            <span class="revenue-value">$${(category.productStats?.revenue || category.metrics?.totalRevenue || 0).toLocaleString()}</span>
                            <span class="revenue-label">Jami daromad</span>
                        </div>
                        <div class="business-stats">
                            <div class="stat-row">
                                <i class="las la-chart-line text-success"></i>
                                <span>O'sish: +${category.metrics?.monthlyGrowth || 0}%</span>
                            </div>
                            <div class="stat-row">
                                <i class="las la-star text-warning"></i>
                                <span>Ball: ${category.metrics?.popularityScore || 0}/100</span>
                            </div>
                        </div>
                    </div>
                </td>
                <td class="td-status">
                    <div class="status-info">
                        <span class="status-badge status-${category.status}">
                            ${this.getStatusIcon(category.status)}
                            ${isDeleted ? 'O\'chirilgan' : this.capitalizeFirst(category.status)}
                        </span>
                        <div class="status-details">
                            ${!isDeleted ? `
                                <span class="detail-item ${category.settings?.isActive ? 'text-success' : 'text-muted'}">
                                    <i class="las ${category.settings?.isActive ? 'la-check-circle' : 'la-times-circle'}"></i>
                                    ${category.settings?.isActive ? 'Faol' : 'Nofaol'}
                                </span>
                                <span class="detail-item ${category.settings?.isVisible ? 'text-info' : 'text-muted'}">
                                    <i class="las ${category.settings?.isVisible ? 'la-eye' : 'la-eye-slash'}"></i>
                                    ${category.settings?.isVisible ? 'Ko\'rinadi' : 'Yashirin'}
                                </span>
                            ` : `
                                <span class="detail-item text-danger">
                                    <i class="las la-trash"></i>
                                    O'chirilgan
                                </span>
                            `}
                        </div>
                    </div>
                </td>
                <td class="td-date">
                    <div class="date-info">
                        <div class="created-date">
                            <span class="date-value">${this.formatDate(isDeleted ? category.deletedAt : category.createdAt)}</span>
                            <span class="date-label">${isDeleted ? 'Deleted' : 'Created'}</span>
                        </div>
                        <div class="date-details">
                            <span class="detail-item">
                                <i class="las la-user"></i>
                                ${isDeleted ? (category.deletedBy?.name || 'Noma\'lum') : (category.creatorName || 'Noma\'lum')}
                            </span>
                            <span class="detail-item">
                                <i class="las la-clock"></i>
                                ${this.getRelativeTime(isDeleted ? category.deletedAt : category.createdAt)}
                            </span>
                        </div>
                    </div>
                </td>
                <td class="td-actions">
                    <div class="action-buttons">
                        <div class="category-dropdown" data-category-id="${category._id}">
                            <button class="btn-action btn-more" data-dropdown-trigger="${category._id}" title="Amallar">
                                <i class="las la-ellipsis-v"></i>
                            </button>
                            <ul class="category-dropdown-menu" data-dropdown-menu="${category._id}">
                                ${isDeleted ? `
                                    <li><a class="dropdown-item" href="#" data-action="restore" data-category-id="${category._id}">
                                        <i class="las la-undo"></i>
                                        Qayta tiklash
                                    </a></li>
                                    <li><a class="dropdown-item danger" href="#" data-action="permanent-delete" data-category-id="${category._id}">
                                        <i class="las la-trash-alt"></i>
                                        Butunlay o'chirish
                                    </a></li>
                                ` : `
                                    <li><a class="dropdown-item" href="#" data-action="edit" data-category-id="${category._id}">
                                        <i class="las la-edit"></i>
                                        Tahrirlash
                                    </a></li>
                                    <li><a class="dropdown-item" href="#" data-action="analytics" data-category-id="${category._id}">
                                        <i class="las la-chart-bar"></i>
                                        Analitika
                                    </a></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item" href="#" data-action="toggle-active" data-category-id="${category._id}">
                                        <i class="las ${category.settings?.isActive ? 'la-pause' : 'la-play'}"></i>
                                        ${category.settings?.isActive ? 'Deaktivlashtirish' : 'Faollashtirish'}
                                    </a></li>
                                    <li><a class="dropdown-item" href="#" data-action="toggle-visibility" data-category-id="${category._id}">
                                        <i class="las ${category.settings?.isVisible ? 'la-eye-slash' : 'la-eye'}"></i>
                                        ${category.settings?.isVisible ? 'Yashirish' : 'Ko\'rsatish'}
                                    </a></li>
                                    <li><a class="dropdown-item" href="#" data-action="toggle-main-status" data-category-id="${category._id}">
                                        <i class="las ${category.status === 'active' ? 'la-pause-circle' : 'la-play-circle'}"></i>
                                        ${category.status === 'active' ? 'To\'xtatish' : 'Faollashtirish'}
                                    </a></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item" href="#" data-action="duplicate" data-category-id="${category._id}">
                                        <i class="las la-copy"></i>
                                        Nusxalash
                                    </a></li>
                                    <li><a class="dropdown-item danger" href="#" data-action="delete" data-category-id="${category._id}">
                                        <i class="las la-trash"></i>
                                        O'chirish
                                    </a></li>
                                `}
                            </ul>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Render single category card for all categories view (mobile)
     */
    renderAllCategoryCard(category) {
        const isSelected = this.selectedCategories.has(category._id);
        const isDeleted = category.status === 'deleted';
        
        return `
            <div class="category-card ${isSelected ? 'selected' : ''}" data-category-id="${category._id}">
                <div class="card-header">
                    <div class="category-visual">
                        <div class="category-icon" style="background-color: ${category.color || '#3B82F6'}">
                            <i class="${category.icon || 'las la-folder'}"></i>
                        </div>
                        ${category.image?.url ? `<img src="${category.image.url}" alt="${category.image.alt || category.name}" class="category-thumbnail">` : ''}
                    </div>
                    <div class="category-info">
                        <h4 class="category-name">${this.escapeHtml(category.name || 'N/A')}</h4>
                        <div class="category-badges">
                            ${isDeleted ? '<span class="badge badge-danger">O\'chirilgan</span>' :
                              category.status === 'active' ? '<span class="badge badge-success">Faol</span>' : 
                              category.status === 'inactive' ? '<span class="badge badge-warning">Nofaol</span>' : 
                              '<span class="badge badge-secondary">Loyiha</span>'}
                        </div>
                    </div>
                    <div class="card-actions">
                        <label class="modern-checkbox">
                            <input type="checkbox" ${isSelected ? 'checked' : ''} 
                                   onchange="window.categoriesManager.toggleCategorySelection('${category._id}', this.checked)">
                            <span class="checkbox-mark"></span>
                        </label>
                        <div class="category-dropdown" data-category-id="${category._id}">
                            <button class="btn-action btn-more" data-dropdown-trigger="${category._id}" title="Amallar">
                                <i class="las la-ellipsis-v"></i>
                            </button>
                            <ul class="category-dropdown-menu" data-dropdown-menu="${category._id}">
                                ${isDeleted ? `
                                    <li><a class="dropdown-item" href="#" data-action="restore" data-category-id="${category._id}">
                                        <i class="las la-undo"></i>
                                        Qayta tiklash
                                    </a></li>
                                    <li><a class="dropdown-item danger" href="#" data-action="permanent-delete" data-category-id="${category._id}">
                                        <i class="las la-trash-alt"></i>
                                        Butunlay o'chirish
                                    </a></li>
                                ` : `
                                    <li><a class="dropdown-item" href="#" data-action="edit" data-category-id="${category._id}">
                                        <i class="las la-edit"></i>
                                        Tahrirlash
                                    </a></li>
                                    <li><a class="dropdown-item" href="#" data-action="analytics" data-category-id="${category._id}">
                                        <i class="las la-chart-bar"></i>
                                        Analitika
                                    </a></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item" href="#" data-action="toggle-active" data-category-id="${category._id}">
                                        <i class="las ${category.settings?.isActive ? 'la-pause' : 'la-play'}"></i>
                                        ${category.settings?.isActive ? 'Deaktivlashtirish' : 'Faollashtirish'}
                                    </a></li>
                                    <li><a class="dropdown-item" href="#" data-action="toggle-visibility" data-category-id="${category._id}">
                                        <i class="las ${category.settings?.isVisible ? 'la-eye-slash' : 'la-eye'}"></i>
                                        ${category.settings?.isVisible ? 'Yashirish' : 'Ko\'rsatish'}
                                    </a></li>
                                    <li><a class="dropdown-item" href="#" data-action="toggle-main-status" data-category-id="${category._id}">
                                        <i class="las ${category.status === 'active' ? 'la-pause-circle' : 'la-play-circle'}"></i>
                                        ${category.status === 'active' ? 'To\'xtatish' : 'Faollashtirish'}
                                    </a></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item" href="#" data-action="duplicate" data-category-id="${category._id}">
                                        <i class="las la-copy"></i>
                                        Nusxalash
                                    </a></li>
                                    <li><a class="dropdown-item danger" href="#" data-action="delete" data-category-id="${category._id}">
                                        <i class="las la-trash"></i>
                                        O'chirish
                                    </a></li>
                                `}
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <p class="category-description">${this.escapeHtml(category.shortDescription || category.description || '').substring(0, 150)}${(category.description?.length > 150) ? '...' : ''}</p>
                    <div class="category-meta">
                        <span class="meta-item">
                            <i class="las la-tag"></i>
                            Slug: ${this.escapeHtml(category.slug)}
                        </span>
                        ${isDeleted ? `
                            <span class="meta-item">
                                <i class="las la-calendar-times"></i>
                                O'chirilgan: ${this.formatDate(category.deletedAt)}
                            </span>
                        ` : ''}
                    </div>
                </div>
                <div class="card-footer">
                    <div class="stats-row">
                        <div class="stat-item">
                            <span class="stat-value">${category.productStats?.total || category.metrics?.totalProducts || 0}</span>
                            <span class="stat-label">Mahsulotlar</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">$${(category.productStats?.revenue || category.metrics?.totalRevenue || 0).toLocaleString()}</span>
                            <span class="stat-label">Daromad</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${this.formatDate(isDeleted ? category.deletedAt : category.createdAt)}</span>
                            <span class="stat-label">${isDeleted ? 'O\'chirilgan' : 'Yaratilgan'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Show soft deleted categories
     */
    async showSoftDeletedCategories() {
        // Hide main table and show soft deleted container
        const tableContainer = document.getElementById('tableContainer');
        const softDeletedContainer = document.getElementById('softDeletedCategoriesContainer');
        
        if (tableContainer) tableContainer.style.display = 'none';
        if (softDeletedContainer) softDeletedContainer.style.display = 'block';

        // Load soft deleted categories
        await this.loadSoftDeletedCategories();
    }

    /**
     * Render soft deleted categories in professional table format
     */
    renderSoftDeletedCategories() {
        const container = document.getElementById('softDeletedCategoriesContainer');
        if (!container) return;

        if (!this.softDeletedCategories || this.softDeletedCategories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="las la-trash-restore"></i>
                    <h3>O'chirilgan kategoriyalar yo'q</h3>
                    <p>Hozircha o'chirilgan kategoriyalar mavjud emas</p>
                </div>
            `;
            return;
        }

        const categoriesHTML = this.softDeletedCategories.map(category => `
            <tr class="table-row" data-category-id="${category._id}">
                <td class="td-select">
                    <div class="td-content">
                        <label class="modern-checkbox">
                            <input type="checkbox" class="category-checkbox" value="${category._id}"
                                   onchange="window.categoriesManager.toggleCategorySelection('${category._id}', this.checked)">
                            <span class="checkbox-mark"></span>
                        </label>
                    </div>
                </td>
                <td class="td-category">
                    <div class="category-info-cell">
                        <div class="category-visual">
                            <div class="category-icon" style="background-color: ${category.color || '#3B82F6'}">
                                <i class="${category.icon || 'las la-folder'}"></i>
                            </div>
                            ${category.image?.url ? `<img src="${category.image.url}" alt="${category.image.alt || category.name}" class="category-thumbnail">` : ''}
                        </div>
                        <div class="category-details">
                            <div class="category-name-container">
                                <h4 class="category-name">${this.escapeHtml(category.name || 'N/A')}</h4>
                                <div class="category-badges">
                                    <span class="badge badge-danger">O'chirilgan</span>
                                </div>
                            </div>
                            <p class="category-description">${this.escapeHtml(category.shortDescription || category.description || '').substring(0, 100)}${(category.description?.length > 100) ? '...' : ''}</p>
                            <div class="category-meta">
                                <span class="meta-item">
                                    <i class="las la-tag"></i>
                                    Slug: ${this.escapeHtml(category.slug)}
                                </span>
                                <span class="meta-item">
                                    <i class="las la-calendar-times"></i>
                                    O'chirilgan: ${this.formatDate(category.deletedAt)}
                                </span>
                            </div>
                        </div>
                    </div>
                </td>
                <td class="td-products">
                    <div class="products-analytics">
                        <div class="product-counts">
                            <div class="count-item primary">
                                <span class="count-value">${category.productStats?.total || category.metrics?.totalProducts || 0}</span>
                                <span class="count-label">Jami mahsulotlar</span>
                            </div>
                            <div class="count-item success">
                                <span class="count-value">${category.productStats?.active || 0}</span>
                                <span class="count-label">Faol</span>
                            </div>
                        </div>
                        <div class="analytics-chart">
                            <div class="mini-progress">
                                <div class="progress-bar" style="width: ${(category.productStats?.total || category.metrics?.totalProducts || 0) > 0 ? ((category.productStats?.active || 0) / (category.productStats?.total || category.metrics?.totalProducts || 1) * 100) : 0}%"></div>
                            </div>
                            <span class="progress-label">
                                ${(category.productStats?.total || category.metrics?.totalProducts || 0) > 0 ? Math.round((category.productStats?.active || 0) / (category.productStats?.total || category.metrics?.totalProducts || 1) * 100) : 0}% Faol
                            </span>
                        </div>
                    </div>
                </td>
                <td class="td-business">
                    <div class="business-metrics">
                        <div class="metric-item">
                            <span class="metric-label">Daromad:</span>
                            <span class="metric-value">$${(category.metrics?.totalRevenue || 0).toLocaleString()}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Mahsulotlar:</span>
                            <span class="metric-value">${category.metrics?.totalProducts || 0}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">O'rtacha narx:</span>
                            <span class="metric-value">$${((category.metrics?.totalRevenue || 0) / Math.max(category.metrics?.totalProducts || 1, 1)).toFixed(2)}</span>
                        </div>
                    </div>
                </td>
                <td class="td-status">
                    <div class="status-info">
                        <span class="status-badge status-deleted">
                            <i class="las la-trash"></i>
                            O'chirilgan
                        </span>
                        <div class="status-details">
                            <small class="text-muted">
                                ${this.formatDate(category.deletedAt)}
                            </small>
                        </div>
                    </div>
                </td>
                <td class="td-date">
                    <div class="date-info">
                        <span class="date-primary">${this.formatDate(category.createdAt)}</span>
                        <small class="text-muted">
                            ${this.getRelativeTime(category.createdAt)}
                        </small>
                    </div>
                </td>
                <td class="td-actions">
                    <div class="action-buttons">
                        <div class="category-dropdown" data-category-id="${category._id}">
                            <button class="btn-action btn-more" data-dropdown-trigger="${category._id}" title="Amallar">
                                <i class="las la-ellipsis-v"></i>
                            </button>
                            <ul class="category-dropdown-menu" data-dropdown-menu="${category._id}">
                                <li><a class="dropdown-item" href="#" data-action="restore" data-category-id="${category._id}">
                                    <i class="las la-undo"></i>
                                    Qayta tiklash
                                </a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item danger" href="#" data-action="permanent-delete" data-category-id="${category._id}">
                                    <i class="las la-trash-alt"></i>
                                    Butunlay o'chirish
                                </a></li>
                            </ul>
                        </div>
                    </div>
                </td>
            </tr>
        `).join('');

        container.innerHTML = `
            <div class="professional-table-container">
                <div class="desktop-table-view">
                    <table class="professional-categories-table">
                        <thead class="table-header-sticky">
                            <tr class="header-row">
                                <th class="th-select" data-column="select">
                                    <div class="th-content">
                                        <label class="modern-checkbox">
                                            <input type="checkbox" id="selectAllDeletedCheckbox" onchange="toggleSelectAllDeleted(this.checked)">
                                            <span class="checkbox-mark"></span>
                                        </label>
                                    </div>
                                </th>
                                <th class="th-category" data-column="category" onclick="sortTable('name')">
                                    <div class="th-content sortable">
                                        <span class="th-label">Kategoriya ma'lumotlari</span>
                                        <span class="sort-indicator">
                                            <i class="las la-sort sort-icon"></i>
                                        </span>
                                    </div>
                                </th>
                                <th class="th-products" data-column="products" onclick="sortTable('metrics.totalProducts')">
                                    <div class="th-content sortable">
                                        <span class="th-label">Mahsulotlar va analitika</span>
                                        <span class="sort-indicator">
                                            <i class="las la-sort sort-icon"></i>
                                        </span>
                                    </div>
                                </th>
                                <th class="th-business" data-column="business">
                                    <div class="th-content">
                                        <span class="th-label">Biznes ko'rsatkichlari</span>
                                    </div>
                                </th>
                                <th class="th-status" data-column="status" onclick="sortTable('status')">
                                    <div class="th-content sortable">
                                        <span class="th-label">Holat</span>
                                        <span class="sort-indicator">
                                            <i class="las la-sort sort-icon"></i>
                                        </span>
                                    </div>
                                </th>
                                <th class="th-date" data-column="date" onclick="sortTable('createdAt')">
                                    <div class="th-content sortable">
                                        <span class="th-label">Yaratilgan</span>
                                        <span class="sort-indicator">
                                            <i class="las la-sort sort-icon"></i>
                                        </span>
                                    </div>
                                </th>
                                <th class="th-actions" data-column="actions">
                                    <div class="th-content">
                                        <span class="th-label">Amallar</span>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody class="table-body">
                            ${categoriesHTML}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /**
     * Restore soft deleted category
     */
    async restoreCategory(categoryId) {
        try {
            // Validate categoryId
            if (!categoryId || !categoryId.match(/^[0-9a-fA-F]{24}$/)) {
                this.showError('Noto\'g\'ri kategoriya ID');
                return;
            }

            const category = this.softDeletedCategories?.find(c => c._id === categoryId);
            if (!category) {
                this.showError('Kategoriya topilmadi');
                return;
            }

            // Show confirmation
            const confirmed = await this.showRestoreConfirmationModal(category);
            if (!confirmed) {
                return;
            }

            // Show loading state
            this.showNotification('Kategoriya qayta tiklanmoqda...', 'info');

            const response = await this.makeRequest(`${this.endpoints.categories}/${categoryId}/restore`, {
                method: 'POST'
            });

            if (response.success) {
                this.showNotification(`Kategoriya "${this.escapeHtml(category.name)}" muvaffaqiyatli qayta tiklandi`, 'success');
                
                // Remove from soft deleted list
                this.softDeletedCategories = this.softDeletedCategories.filter(c => c._id !== categoryId);
                this.renderSoftDeletedCategories();
                
                // Refresh main categories
                await this.loadCategories();
                await this.loadStatistics();
            } else {
                throw new Error(response.message || 'Kategoriyani qayta tiklashda xatolik');
            }

        } catch (error) {
            console.error('Error restoring category:', error);
            
            let errorMessage = 'Kategoriyani qayta tiklashda xatolik';
            if (error.message.includes('already exists')) {
                errorMessage = 'Bu nom yoki slug bilan kategoriya allaqachon mavjud';
            } else if (error.message.includes('not deleted')) {
                errorMessage = 'Bu kategoriya o\'chirilmagan';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            this.showError(errorMessage);
        }
    }

    /**
     * Permanently delete category
     */
    async permanentDeleteCategory(categoryId) {
        try {
            // Validate categoryId
            if (!categoryId || !categoryId.match(/^[0-9a-fA-F]{24}$/)) {
                this.showError('Noto\'g\'ri kategoriya ID');
                return;
            }

            const category = this.softDeletedCategories?.find(c => c._id === categoryId);
            if (!category) {
                this.showError('Kategoriya topilmadi');
                return;
            }

            // Show confirmation
            const confirmed = await this.showPermanentDeleteConfirmationModal(category);
            if (!confirmed) {
                return;
            }

            // Show loading state
            this.showNotification('Kategoriya butunlay o\'chirilmoqda...', 'info');

            const response = await this.makeRequest(`${this.endpoints.categories}/${categoryId}/permanent`, {
                method: 'DELETE'
            });

            if (response.success) {
                this.showNotification(`Kategoriya "${this.escapeHtml(category.name)}" butunlay o'chirildi`, 'success');
                
                // Remove from soft deleted list
                this.softDeletedCategories = this.softDeletedCategories.filter(c => c._id !== categoryId);
                this.renderSoftDeletedCategories();
                
                // Refresh statistics
                await this.loadStatistics();
            } else {
                throw new Error(response.message || 'Kategoriyani butunlay o\'chirishda xatolik');
            }

        } catch (error) {
            console.error('Error permanently deleting category:', error);
            
            let errorMessage = 'Kategoriyani butunlay o\'chirishda xatolik';
            if (error.message.includes('products associated')) {
                errorMessage = 'Bu kategoriyada hali mahsulotlar mavjud. Avval mahsulotlarni boshqaring';
            } else if (error.message.includes('not deleted')) {
                errorMessage = 'Faqat o\'chirilgan kategoriyalar butunlay o\'chirilishi mumkin';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            this.showError(errorMessage);
        }
    }

    /**
     * Show restore confirmation modal
     */
    async showRestoreConfirmationModal(category) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'professional-modal-overlay';
            modal.innerHTML = `
                <div class="professional-modal" style="max-width: 450px;">
                    <div class="modal-header">
                        <h3 class="modal-title">
                            <i class="las la-undo text-success"></i>
                            Kategoriyani qayta tiklash
                        </h3>
                        <button class="modal-close" onclick="this.closest('.professional-modal-overlay').remove()">
                            <i class="las la-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="las la-info-circle"></i>
                            Bu kategoriya qayta tiklanadi va faol holatga qaytariladi.
                        </div>
                        
                        <div class="category-info">
                            <h4>Kategoriya ma'lumotlari:</h4>
                            <p><strong>Nomi:</strong> ${this.escapeHtml(category.name)}</p>
                            <p><strong>Slug:</strong> ${this.escapeHtml(category.slug)}</p>
                            <p><strong>O'chirilgan:</strong> ${this.formatDate(category.deletedAt)}</p>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.professional-modal-overlay').remove(); window.restoreConfirmationResult = false;">
                            Bekor qilish
                        </button>
                        <button type="button" class="btn btn-success" id="confirmRestoreBtn">
                            <i class="las la-undo"></i>
                            Qayta tiklash
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Show modal
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);

            // Handle confirm button
            const confirmBtn = modal.querySelector('#confirmRestoreBtn');
            confirmBtn.addEventListener('click', () => {
                modal.remove();
                window.restoreConfirmationResult = true;
            });

            // Handle close button
            modal.querySelector('.modal-close').addEventListener('click', () => {
                modal.remove();
                window.restoreConfirmationResult = false;
            });

            // Handle overlay click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                    window.restoreConfirmationResult = false;
                }
            });

            // Wait for result
            const checkResult = () => {
                if (window.restoreConfirmationResult !== undefined) {
                    const result = window.restoreConfirmationResult;
                    delete window.restoreConfirmationResult;
                    resolve(result);
                } else {
                    setTimeout(checkResult, 100);
                }
            };
            checkResult();
        });
    }

    /**
     * Show permanent delete confirmation modal
     */
    async showPermanentDeleteConfirmationModal(category) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'professional-modal-overlay';
            modal.innerHTML = `
                <div class="professional-modal" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3 class="modal-title">
                            <i class="las la-exclamation-triangle text-danger"></i>
                            Butunlay o'chirish
                        </h3>
                        <button class="modal-close" onclick="this.closest('.professional-modal-overlay').remove()">
                            <i class="las la-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="alert alert-danger">
                            <strong>DIQQAT:</strong> Bu amalni bekor qilib bo'lmaydi!
                        </div>
                        
                        <div class="category-info">
                            <h4>Kategoriya ma'lumotlari:</h4>
                            <p><strong>Nomi:</strong> ${this.escapeHtml(category.name)}</p>
                            <p><strong>Slug:</strong> ${this.escapeHtml(category.slug)}</p>
                            <p><strong>O'chirilgan:</strong> ${this.formatDate(category.deletedAt)}</p>
                        </div>
                        
                        <div class="permanent-delete-warning">
                            <label class="checkbox-container">
                                <input type="checkbox" id="permanentDeleteCheckbox">
                                <span class="checkmark"></span>
                                <strong>Men tushundim</strong> - Bu kategoriya butunlay o'chiriladi va qayta tiklab bo'lmaydi
                            </label>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.professional-modal-overlay').remove(); window.permanentDeleteConfirmationResult = false;">
                            Bekor qilish
                        </button>
                        <button type="button" class="btn btn-danger" id="confirmPermanentDeleteBtn">
                            <i class="las la-trash-alt"></i>
                            Butunlay o'chirish
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Show modal
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);

            // Handle confirm button
            const confirmBtn = modal.querySelector('#confirmPermanentDeleteBtn');
            const permanentDeleteCheckbox = modal.querySelector('#permanentDeleteCheckbox');
            
            confirmBtn.addEventListener('click', () => {
                if (!permanentDeleteCheckbox.checked) {
                    this.showError('Tasdiqlash uchun checkbox\'ni belgilang');
                    return;
                }
                
                modal.remove();
                window.permanentDeleteConfirmationResult = true;
            });

            // Handle close button
            modal.querySelector('.modal-close').addEventListener('click', () => {
                modal.remove();
                window.permanentDeleteConfirmationResult = false;
            });

            // Handle overlay click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                    window.permanentDeleteConfirmationResult = false;
                }
            });

            // Wait for result
            const checkResult = () => {
                if (window.permanentDeleteConfirmationResult !== undefined) {
                    const result = window.permanentDeleteConfirmationResult;
                    delete window.permanentDeleteConfirmationResult;
                    resolve(result);
                } else {
                    setTimeout(checkResult, 100);
                }
            };
            checkResult();
        });
    }

    /**
     * Toggle select all for soft deleted categories
     */
    toggleSelectAllDeleted(checked) {
        const checkboxes = document.querySelectorAll('#softDeletedCategoriesContainer .category-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });
        
        // Update selected categories set
        if (checked) {
            checkboxes.forEach(checkbox => {
                this.selectedCategories.add(checkbox.value);
            });
        } else {
            checkboxes.forEach(checkbox => {
                this.selectedCategories.delete(checkbox.value);
            });
        }
    }

    async duplicateCategory(categoryId) {
        this.showNotification('Kategoriya nusxalash - amalga oshirilishi kerak', 'info');
    }


    /**
     * Bulk operations
     */
    async bulkAction(action) {
        const selectedIds = Array.from(this.selectedCategories);
        if (selectedIds.length === 0) {
            this.showError('Avval kategoriyalarni tanlang');
            return;
        }

        const confirmMessage = `${selectedIds.length} ta tanlangan kategoriyani ${action} qilishni xohlaysizmi?`;
        if (!confirm(confirmMessage)) return;

        try {
            const response = await this.makeRequest(`${this.endpoints.bulk}`, {
                method: 'POST',
                body: JSON.stringify({
                    categoryIds: selectedIds,
                    action: action,
                    reason: `Bulk ${action} operation by admin`
                })
            });

            if (response.success) {
                this.showNotification(`${selectedIds.length} ta kategoriya muvaffaqiyatli ${action} qilindi`, 'success');
                this.selectedCategories.clear();
                this.updateBulkActionsVisibility();
                await this.loadCategories();
                await this.loadStatistics();
            }
        } catch (error) {
            console.error(`Error in bulk ${action}:`, error);
            this.showError(`Tanlangan kategoriyalarni ${action} qilishda xatolik`);
        }
    }

    async bulkExport() {
        const selectedIds = Array.from(this.selectedCategories);
        
        try {
            let url = `${this.endpoints.export}?format=csv`;
            if (selectedIds.length > 0) {
                url += `&ids=${selectedIds.join(',')}`;
            }

            // Apply current filters to export
            Object.entries(this.filters).forEach(([key, value]) => {
                if (value) {
                    url += `&${key}=${encodeURIComponent(value)}`;
                }
            });

            window.open(url, '_blank');
            this.showNotification('Eksport muvaffaqiyatli boshlandi', 'success');
        } catch (error) {
            console.error('Error in bulk export:', error);
            this.showError('Kategoriyalarni eksport qilishda xatolik');
        }
    }

    /**
     * Remove existing modals to prevent duplicates
     */
    removeExistingModals() {
        // Remove all possible modal variations
        const existingModals = document.querySelectorAll('.professional-modal-overlay, .professional-modal, .modal-overlay, .modal');
        existingModals.forEach(modal => {
            modal.remove();
        });
        
        // Also remove any modal-related elements
        const modalElements = document.querySelectorAll('[data-modal-type]');
        modalElements.forEach(element => {
            element.remove();
        });
        
        // Wait a bit to ensure DOM is updated
        return new Promise(resolve => setTimeout(resolve, 100));
    }


    /**
     * Modal operations
     */
    async showCreateModal() {
        try {
            // Check if modal is already being created
            if (this.isCreatingModal) {
                return;
            }
            
            this.isCreatingModal = true;
            
            // Remove any existing modals first
            await this.removeExistingModals();
            
            // Create and show modal
            const modal = this.createCategoryModal();
            document.body.appendChild(modal);
            
            // Initialize modal functionality
            this.initializeModalFeatures(modal);
            
            // Apply current theme to modal
            this.updateModalTheme();
            
            // Show modal with animation
            setTimeout(() => {
                modal.classList.add('show');
                this.isCreatingModal = false;
            }, 10);
            
        } catch (error) {
            console.error('❌ Error opening create modal:', error);
            this.showError('Kategoriya yaratish modali ochishda xatolik');
            this.isCreatingModal = false;
        }
    }

    /**
     * Show edit category modal
     */
    async showEditModal(categoryId) {
        try {
            // Check if modal is already being created
            if (this.isCreatingModal) {
                return;
            }
            
            this.isCreatingModal = true;
            
            // Remove any existing modals first
            await this.removeExistingModals();
            
            // Load category data with proper error handling
            const categoryData = await this.loadCategoryData(categoryId);
            
            // Create and show modal with category data
            const modal = this.createCategoryModal(categoryData);
            
            document.body.appendChild(modal);
            
            // Initialize modal functionality
            this.initializeModalFeatures(modal);
            
            // Apply current theme to modal
            this.updateModalTheme();
            
            // Show modal with animation
            setTimeout(() => {
                modal.classList.add('show');
                this.isCreatingModal = false;
            }, 10);
            
        } catch (error) {
            console.error('❌ Error opening edit modal:', error);
            
            // Provide specific error messages based on error type
            let errorMessage = 'Kategoriya tahrirlash modali ochishda xatolik';
            if (error.message.includes('404')) {
                errorMessage = 'Kategoriya topilmadi';
            } else if (error.message.includes('403')) {
                errorMessage = 'Bu kategoriyani tahrirlash uchun ruxsat yo\'q';
            } else if (error.message.includes('500')) {
                errorMessage = 'Server xatoligi. Qayta urinib ko\'ring';
            } else if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
                errorMessage = 'Internet aloqasi xatoligi. Qayta urinib ko\'ring';
            }
            
            this.showError(errorMessage);
            this.isCreatingModal = false;
        }
    }

    /**
     * Load category data for editing
     */
    async loadCategoryData(categoryId) {
        try {
            // Get CSRF token
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            
            // Get auth token from localStorage or cookies
            const authToken = localStorage.getItem('adminToken') || this.getCookie('adminToken');
            
            const response = await fetch(`${this.endpoints.categories}/${categoryId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                    'Authorization': authToken ? `Bearer ${authToken}` : '',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    // Use default error message if JSON parsing fails
                }
                
                throw new Error(errorMessage);
            }
            
            const result = await response.json();
            
           // Validate response structure
            if (!result || (result.success === false)) {
                throw new Error(result.message || 'Invalid response format');
            }
            
            const categoryData = result.data || result;
            
            return categoryData;
        } catch (error) {
            throw error;
        }
    }


    /**
     * Create PROFESSIONAL category modal - Senior Engineer Level
     * Features:
     * - Modern Material Design principles
     * - Advanced animations and transitions
     * - Professional accessibility support
     * - Real-time validation and feedback
     * - Responsive design patterns
     * - Progressive disclosure UX
     * - Scrollable content with proper overflow handling
     */
    createCategoryModal(categoryData = null) {
        const modal = document.createElement('div');
        modal.className = 'professional-modal-overlay';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'modalTitle');
        modal.setAttribute('aria-modal', 'true');
        modal.onclick = (event) => {
            if (event.target === modal) {
                modal.remove();
            }
        };
        
        // Add CSS styles for scrollable modal
        this.addModalStyles();
        
        modal.innerHTML = this.generateProfessionalModalHTML(categoryData);
        return modal;
    }

    /**
     * Add professional modal styles with scroll functionality
     */
    addModalStyles() {
        if (document.getElementById('categoryModalStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'categoryModalStyles';
        style.textContent = `
            .professional-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(8px);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                cursor: pointer;
            }
            
            .professional-modal-overlay .professional-modal {
                cursor: default;
            }
            
            .professional-modal-overlay.show {
                opacity: 1;
                visibility: visible;
            }
            
            .professional-modal {
                background: var(--bg-card, #ffffff);
                border-radius: 16px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                width: 90%;
                max-width: 900px;
                max-height: 90vh;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                transform: scale(0.9) translateY(20px);
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .professional-modal-overlay.show .professional-modal {
                transform: scale(1) translateY(0);
            }
            
            .modal-header {
                padding: 24px 32px;
                border-bottom: 1px solid var(--border-color, #e5e7eb);
                flex-shrink: 0;
                background: var(--bg-primary, #ffffff);
            }
            
            .modal-progress-bar {
                padding: 16px 32px;
                border-bottom: 1px solid var(--border-color, #e5e7eb);
                flex-shrink: 0;
                background: var(--bg-secondary, #f9fafb);
            }
            
            .modal-content-container {
                flex: 1;
                overflow-y: auto;
                overflow-x: hidden;
                padding: 0;
                max-height: calc(90vh - 200px);
                scrollbar-width: thin;
                scrollbar-color: var(--color-primary, #3b82f6) transparent;
            }
            
            .modal-content-container::-webkit-scrollbar {
                width: 6px;
            }
            
            .modal-content-container::-webkit-scrollbar-track {
                background: transparent;
            }
            
            .modal-content-container::-webkit-scrollbar-thumb {
                background: var(--color-primary, #3b82f6);
                border-radius: 3px;
            }
            
            .modal-content-container::-webkit-scrollbar-thumb:hover {
                background: var(--color-primary-dark, #2563eb);
            }
            
            .form-content {
                padding: 32px;
            }
            
            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 24px;
            }
            
            .professional-input.error,
            .professional-textarea.error {
                border-color: var(--color-danger, #ef4444);
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
            }
            
            .input-feedback.error {
                color: var(--color-danger, #ef4444);
                font-size: 12px;
                margin-top: 4px;
            }
            
            /* Form Styles */
            .form-fields {
                display: flex;
                flex-direction: column;
                gap: 24px;
            }
            
            .form-group {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .form-label {
                font-weight: 600;
                color: var(--text-primary, #1f2937);
                font-size: 14px;
            }
            
            .form-label.required::after {
                content: ' *';
                color: var(--color-danger, #ef4444);
            }
            
            .form-input,
            .form-select,
            .form-textarea {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid var(--border-color, #e5e7eb);
                border-radius: 8px;
                font-size: 14px;
                transition: all 0.2s ease;
                background: var(--bg-input, #ffffff);
            }
            
            .form-input:focus,
            .form-select:focus,
            .form-textarea:focus {
                outline: none;
                border-color: var(--color-primary, #3b82f6);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            .form-input.error,
            .form-textarea.error {
                border-color: var(--color-danger, #ef4444);
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
            }
            
            .field-help {
                font-size: 12px;
                color: var(--text-secondary, #6b7280);
                margin-top: 4px;
            }
            
            .field-error {
                color: var(--color-danger, #ef4444);
                font-size: 12px;
                margin-top: 4px;
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .field-error::before {
                content: '⚠️';
                font-size: 10px;
            }
            
            /* Color Picker */
            .color-input-group {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .color-picker {
                width: 50px;
                height: 40px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
            }
            
            /* Toggle Switches */
            .toggle-group {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            
            .toggle-item {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .toggle-item {
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: pointer;
                padding: 8px;
                border-radius: 8px;
                transition: background-color 0.2s ease;
                pointer-events: auto;
                user-select: none;
            }
            
            .toggle-item:hover {
                background-color: var(--bg-secondary, #f8fafc);
            }
            
            .toggle-label {
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: pointer;
                flex: 1;
                pointer-events: auto;
                user-select: none;
            }
            
            .toggle-slider {
                pointer-events: auto;
                cursor: pointer;
                flex-shrink: 0;
            }
            
            .toggle-input {
                display: none;
            }
            
            .toggle-slider {
                width: 44px;
                height: 24px;
                background: var(--border-color, #e5e7eb);
                border-radius: 12px;
                position: relative;
                transition: all 0.2s ease;
            }
            
            .toggle-slider::before {
                content: '';
                position: absolute;
                width: 20px;
                height: 20px;
                background: white;
                border-radius: 50%;
                top: 2px;
                left: 2px;
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .toggle-input:checked + .toggle-slider {
                background: var(--color-primary, #3b82f6);
            }
            
            .toggle-input:checked + .toggle-slider::before {
                transform: translateX(20px);
            }
            
            .toggle-text {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            
            .toggle-text strong {
                font-size: 14px;
                color: var(--text-primary, #1f2937);
            }
            
            .toggle-text small {
                font-size: 12px;
                color: var(--text-secondary, #6b7280);
            }
            
            /* Button Styles */
            .btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                text-decoration: none;
            }
            
            .btn-primary {
                background: var(--color-primary, #3b82f6);
                color: white;
            }
            
            .btn-primary:hover {
                background: var(--color-primary-dark, #2563eb);
                transform: translateY(-1px);
            }
            
            .btn-secondary {
                background: var(--bg-secondary, #f9fafb);
                color: var(--text-primary, #1f2937);
                border: 1px solid var(--border-color, #e5e7eb);
            }
            
            .btn-secondary:hover {
                background: var(--border-color, #e5e7eb);
            }
            
            /* Modal Close Buttons */
            .modal-close {
                background: none;
                border: none;
                color: var(--text-secondary, #6b7280);
                cursor: pointer;
                padding: 8px;
                border-radius: 6px;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
            }
            
            .modal-close:hover {
                background: var(--color-danger-light, #fef2f2);
                color: var(--color-danger, #ef4444);
                transform: scale(1.1);
            }
            
            .modal-minimize {
                background: none;
                border: none;
                color: var(--text-secondary, #6b7280);
                cursor: pointer;
                padding: 8px;
                border-radius: 6px;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                margin-right: 8px;
            }
            
            .modal-minimize:hover {
                background: var(--color-warning-light, #fffbeb);
                color: var(--color-warning, #f59e0b);
                transform: scale(1.1);
            }
            
            .btn-loading {
                display: none;
                align-items: center;
                gap: 8px;
            }
            
            .btn-spinner {
                width: 16px;
                height: 16px;
                border: 2px solid transparent;
                border-top: 2px solid currentColor;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .modal-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 24px 32px;
                border-top: 1px solid var(--border-color, #e5e7eb);
                background: var(--bg-primary, #ffffff);
            }
            
            .modal-footer {
                padding: 24px 32px;
                border-top: 1px solid var(--border-color, #e5e7eb);
                flex-shrink: 0;
                background: var(--bg-primary, #ffffff);
            }
            
            /* Language Selector Styles */
            .language-selector-wrapper {
                margin-bottom: 24px;
                padding: 16px;
                background: var(--bg-secondary, #f8fafc);
                border-radius: 8px;
                border: 1px solid var(--border-color, #e5e7eb);
            }

            .language-select {
                font-size: 16px;
                font-weight: 500;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 12px center;
                padding-right: 40px;
            }

            .lang-fields {
                animation: fadeIn 0.3s ease;
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .multi-lang-fields {
                margin-bottom: 24px;
            }

            .seo-section {
                margin-top: 24px;
                padding-top: 24px;
                border-top: 1px solid var(--border-color, #e5e7eb);
            }

            .seo-section .section-title {
                font-size: 14px;
                font-weight: 600;
                color: var(--text-secondary, #6b7280);
                margin-bottom: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .seo-section .section-title i {
                font-size: 18px;
            }

            @media (max-width: 768px) {
                .professional-modal {
                    width: 95%;
                    max-height: 95vh;
                    margin: 16px;
                }
                
                .modal-content-container {
                    max-height: calc(95vh - 180px);
                }
                
                .form-step {
                    padding: 24px 20px;
                }
                
                .modal-header,
                .modal-footer {
                    padding: 20px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Generate comprehensive professional modal HTML
     */
    generateProfessionalModalHTML(categoryData = null) {
        const isEditMode = categoryData !== null;
        const modalType = isEditMode ? 'category-edit' : 'category-create';
        const title = isEditMode ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya yaratish';
        const subtitle = isEditMode ? 'Mavjud kategoriya ma\'lumotlarini yangilang' : 'Marketplaceingiz uchun to\'liq kategoriya tuzilmasini yarating';
        
        
        return `
            <div class="professional-modal" data-modal-type="${modalType}" data-category-id="${categoryData?._id || categoryData?.id || ''}">
                ${this.generateModalHeader(title, subtitle)}
                

                <form class="professional-form" id="${isEditMode ? 'editCategoryForm' : 'createCategoryForm'}" novalidate>
                    <div class="modal-content-container">
                        ${this.generateFormSteps(categoryData)}
                    </div>
                    
                    ${this.generateModalFooter(isEditMode)}
                </form>
                
                <!-- Professional Loading Overlay -->
                <div class="modal-loading-overlay" data-loading="false">
                    <div class="loading-spinner">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                    </div>
                    <div class="loading-text">So'rovingiz qayta ishlanmoqda...</div>
                </div>
            </div>
        `;
    }

    /**
     * Generate professional modal header
     */
    generateModalHeader(title = 'Yangi kategoriya yaratish', subtitle = 'Marketplaceingiz uchun to\'liq kategoriya tuzilmasini yarating') {
        return `
            <div class="modal-header professional-header">
                <div class="header-content">
                    <div class="header-icon-wrapper">
                        <div class="header-icon">
                            <i class="las la-${title.includes('tahrirlash') ? 'edit' : 'plus-circle'}"></i>
                        </div>
                        <div class="icon-pulse"></div>
                    </div>
                    <div class="header-text">
                        <h2 class="modal-title" id="modalTitle">${title}</h2>
                        <p class="modal-subtitle">${subtitle}</p>
                    </div>
                </div>
                <div class="header-actions">
                    <button type="button" class="modal-close" title="Yopish" aria-label="Modali yopish">
                        <i class="las la-times"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Generate multi-step form with professional UX
     */
    generateFormSteps(categoryData = null) {
        return `
            <div class="form-content">
                <div class="form-fields">
                    <!-- Language Selector -->
                    <div class="language-selector-wrapper">
                        <label class="form-label">
                            <i class="las la-language"></i> Til tanlash
                        </label>
                        <select id="languageSelector" class="form-select language-select">
                            <option value="uz" selected>🇺🇿 O'zbek tili</option>
                            <option value="en">🇬🇧 English</option>
                            <option value="ru">🇷🇺 Русский</option>
                            <option value="tr">🇹🇷 Türkçe</option>
                            <option value="fa">🇮🇷 فارسی</option>
                            <option value="zh">🇨🇳 中文</option>
                        </select>
                        <div class="field-help">
                            <i class="las la-info-circle"></i>
                            O'zbek tili majburiy, qolgan tillar ixtiyoriy
                        </div>
                    </div>

                    <!-- Multi-language fields container -->
                    <div class="multi-lang-fields">
                        ${this.generateLanguageFields('uz', categoryData, true)}
                        ${this.generateLanguageFields('en', categoryData, false)}
                        ${this.generateLanguageFields('ru', categoryData, false)}
                        ${this.generateLanguageFields('tr', categoryData, false)}
                        ${this.generateLanguageFields('fa', categoryData, false)}
                        ${this.generateLanguageFields('zh', categoryData, false)}
                    </div>
                    
                    <!-- Non-translatable fields -->
                    ${this.generateNonTranslatableFields(categoryData)}
                </div>
            </div>
        `;
    }

    generateLanguageFields(lang, categoryData, isRequired) {
        const langNames = {
            uz: "O'zbek",
            en: 'English',
            ru: 'Русский',
            tr: 'Türkçe',
            fa: 'فارسی',
            zh: '中文'
        };
        
        // Debug: Log full categoryData and SEO data
        console.log(`🔍 Full categoryData for modal:`, categoryData);
        console.log(`🔍 Translations for ${lang}:`, categoryData?.translations?.[lang]);
        console.log(`🔍 SEO Translations for ${lang}:`, categoryData?.seoTranslations?.[lang]);
        
        // Get SEO values with proper escaping
        const metaTitle = categoryData?.seoTranslations?.[lang]?.metaTitle || '';
        const metaDesc = categoryData?.seoTranslations?.[lang]?.metaDescription || '';
        const keywords = categoryData?.seoTranslations?.[lang]?.metaKeywords || [];
        const keywordsStr = Array.isArray(keywords) ? keywords.join(', ') : '';
        
        console.log(`📋 Meta Title (${lang}):`, metaTitle);
        console.log(`📝 Meta Desc (${lang}):`, metaDesc);
        console.log(`🔑 Keywords (${lang}):`, keywordsStr);
        
        return `
            <div class="lang-fields" data-lang="${lang}" style="display: ${lang === 'uz' ? 'block' : 'none'}">
                <div class="form-group">
                    <label class="form-label ${isRequired ? 'required' : ''}">
                        Kategoriya nomi (${langNames[lang]})
                    </label>
                    <input type="text" name="translations[${lang}][name]" 
                           class="form-input lang-name-input" 
                           data-lang="${lang}"
                           ${isRequired ? 'required' : ''}
                           value="${categoryData?.translations?.[lang]?.name || ''}"
                           placeholder="Kategoriya nomini kiriting">
                </div>

                <div class="form-group">
                    <label class="form-label ${isRequired ? 'required' : ''}">
                        Tavsif (${langNames[lang]})
                    </label>
                    <textarea name="translations[${lang}][description]" 
                              class="form-textarea"
                              ${isRequired ? 'required' : ''}
                              rows="4"
                              placeholder="Kategoriya tavsifini kiriting">${categoryData?.translations?.[lang]?.description || ''}</textarea>
                </div>

                <div class="seo-section" style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 20px;">
                    <h4 class="section-title" style="color: #1f2937; font-weight: 600; margin-bottom: 16px;">
                        <i class="las la-search" style="color: #3b82f6;"></i> SEO Ma'lumotlari (${langNames[lang]})
                    </h4>
                    
                    <div class="form-group">
                        <label class="form-label">📋 Meta sarlavha</label>
                        <input type="text" name="seoTranslations[${lang}][metaTitle]"
                               class="form-input seo-meta-title" 
                               maxlength="60"
                               value="${this.escapeHtml(metaTitle)}"
                               data-lang="${lang}"
                               placeholder="SEO uchun sahifa sarlavhasi (masalan: Eng yaxshi mahsulotlar)">
                        <div class="field-help">SEO uchun sahifa sarlavhasi (60 belgigacha)</div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">📝 Meta tavsif</label>
                        <textarea name="seoTranslations[${lang}][metaDescription]"
                                  class="form-textarea seo-meta-desc" 
                                  rows="3" 
                                  maxlength="160"
                                  data-lang="${lang}"
                                  placeholder="Qidiruv natijalarida ko'rsatiladigan tavsif">${this.escapeHtml(metaDesc)}</textarea>
                        <div class="field-help">Qidiruv natijalarida ko'rsatiladigan tavsif (160 belgigacha)</div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">🔑 Kalit so'zlar</label>
                        <input type="text" name="seoTranslations[${lang}][keywords]"
                               class="form-input seo-keywords"
                               value="${this.escapeHtml(keywordsStr)}"
                               data-lang="${lang}"
                               placeholder="kategoriya, mahsulot, kalit so'z">
                        <div class="field-help">Vergul bilan ajratilgan kalit so'zlar</div>
                    </div>
                </div>
            </div>
        `;
    }

    generateNonTranslatableFields(categoryData) {
        return `
            <div class="form-row">
                <div class="form-group">
                    <label for="categoryIcon" class="form-label">
                        Kategoriya ikonkasi
                    </label>
                    <input type="text" id="categoryIcon" name="icon" class="form-input" 
                           value="${categoryData?.icon || 'las la-folder'}" 
                           placeholder="las la-folder">
                    <div class="field-help">Line Awesome ikonka klassi</div>
                </div>
                
                <div class="form-group">
                    <label for="categoryColor" class="form-label">
                        Brend rangi
                    </label>
                    <div class="color-input-group">
                        <input type="color" id="categoryColor" name="color" class="color-picker" 
                               value="${categoryData?.color || '#3B82F6'}">
                        <input type="text" id="categoryColorText" class="form-input" 
                               value="${categoryData?.color || '#3B82F6'}">
                    </div>
                    <div class="field-help">Kategoriya identifikatsiyasi uchun rang</div>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">
                    Kategoriya holati
                </label>
                <div class="toggle-group">
                    <div class="toggle-item">
                        <input type="checkbox" id="isActive" name="isActive" class="toggle-input" 
                               ${(categoryData?.settings?.isActive === true || categoryData?.settings?.isActive === undefined) ? 'checked' : ''} 
                               value="true">
                        <span class="toggle-slider"></span>
                        <label for="isActive" class="toggle-label">
                            <span class="toggle-text">
                                <strong>Faol holat</strong>
                                <small>Kategoriya faol va ishlaydi</small>
                            </span>
                        </label>
                    </div>
                    
                    <div class="toggle-item">
                        <input type="checkbox" id="isVisible" name="isVisible" class="toggle-input" 
                               ${(categoryData?.settings?.isVisible === true || categoryData?.settings?.isVisible === undefined) ? 'checked' : ''} 
                               value="true">
                        <span class="toggle-slider"></span>
                        <label for="isVisible" class="toggle-label">
                            <span class="toggle-text">
                                <strong>Ko'rinish</strong>
                                <small>Foydalanuvchilar uchun ko'rinadi</small>
                            </span>
                        </label>
                    </div>
                    
                    <div class="toggle-item">
                        <input type="checkbox" id="allowProducts" name="allowProducts" class="toggle-input" 
                               ${(categoryData?.settings?.allowProducts === true || categoryData?.settings?.allowProducts === undefined) ? 'checked' : ''} 
                               value="true">
                        <span class="toggle-slider"></span>
                        <label for="allowProducts" class="toggle-label">
                            <span class="toggle-text">
                                <strong>Mahsulot qo'shish</strong>
                                <small>Bu kategoriyaga mahsulot qo'shishga ruxsat</small>
                            </span>
                        </label>
                    </div>
                    
                    <div class="toggle-item">
                        <input type="checkbox" id="mainStatus" name="mainStatus" class="toggle-input" 
                               ${(categoryData?.status === 'active' || categoryData?.status === undefined) ? 'checked' : ''} 
                               value="active">
                        <span class="toggle-slider"></span>
                        <label for="mainStatus" class="toggle-label">
                            <span class="toggle-text">
                                <strong>Asosiy holat</strong>
                                <small>Kategoriya asosiy holati (active/inactive)</small>
                            </span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate professional modal footer
     */
    generateModalFooter(isEditMode = false) {
        const submitButtonId = isEditMode ? 'updateCategoryBtn' : 'createCategoryBtn';
        const submitButtonText = isEditMode ? 'Kategoriyani yangilash' : 'Kategoriya yaratish';
        const submitButtonIcon = isEditMode ? 'la-save' : 'la-plus';
        const loadingText = isEditMode ? 'Yangilanmoqda...' : 'Yaratilmoqda...';
        
        return `
            <div class="modal-footer">
                <div class="footer-left">
                    <button type="button" class="btn btn-secondary modal-close-action">
                        <i class="las la-times"></i>
                        <span>Bekor qilish</span>
                    </button>
                </div>
                
                <div class="footer-right">
                    <button type="submit" class="btn btn-primary" id="${submitButtonId}">
                        <i class="las ${submitButtonIcon}"></i>
                        <span class="btn-text">${submitButtonText}</span>
                        <span class="btn-loading">
                            <div class="btn-spinner"></div>
                            <span>${loadingText}</span>
                        </span>
                    </button>
                </div>
            </div>
        `;
    }


    /**
     * Generate multi-language form sections
     */
    generateLanguageForms() {
        const languages = [
            { code: 'uz', name: "O'zbek" },
            { code: 'en', name: 'Ingliz tili' },
            { code: 'ru', name: 'Русский' },
            { code: 'tr', name: 'Türkçe' },
            { code: 'fa', name: 'فارسی' },
            { code: 'zh', name: '中文' }
        ];
        
        return languages.map((lang, index) => `
            <div class="lang-content ${index === 0 ? 'active' : ''}" data-lang="${lang.code}">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="name_${lang.code}" class="form-label">Nomi (${lang.name})</label>
                        <input type="text" id="name_${lang.code}" name="translations.${lang.code}.name" 
                               class="form-control" placeholder="${lang.name} tilida kategoriya nomi">
                    </div>
                    
                    <div class="form-group full-width">
                        <label for="description_${lang.code}" class="form-label">Tavsif (${lang.name})</label>
                        <textarea id="description_${lang.code}" name="translations.${lang.code}.description" 
                                  class="form-control" rows="3" placeholder="${lang.name} tilida tavsif"></textarea>
                    </div>
                </div>
            </div>
        `).join('');
    }

    initializeLanguageSwitcher(modal) {
        const selector = modal.querySelector('#languageSelector');
        const langFields = modal.querySelectorAll('.lang-fields');
        
        if (!selector) return;
        
        selector.addEventListener('change', (e) => {
            const selectedLang = e.target.value;
            
            langFields.forEach(field => {
                field.style.display = field.dataset.lang === selectedLang ? 'block' : 'none';
            });
        });
    }

    parseMultiLanguageFormData(formData) {
        const data = {
            translations: {},
            seoTranslations: {},
            settings: {}
        };
        
        const langs = ['uz', 'en', 'ru', 'tr', 'fa', 'zh'];
        
        langs.forEach(lang => {
            const name = formData.get(`translations[${lang}][name]`);
            const desc = formData.get(`translations[${lang}][description]`);
            
            console.log(`🔍 Parsing ${lang} - name: "${name}", desc: "${desc}"`);
            
            // Always create translations object for consistency
            if (name || desc) {
                data.translations[lang] = {
                    name: name || '',
                    description: desc || ''
                };
            }
            
            const metaTitle = formData.get(`seoTranslations[${lang}][metaTitle]`);
            const metaDesc = formData.get(`seoTranslations[${lang}][metaDescription]`);
            const keywords = formData.get(`seoTranslations[${lang}][keywords]`);
            
            // Always create seoTranslations object, even if values are empty
            // This ensures all fields are present in the database
            data.seoTranslations[lang] = {
                metaTitle: metaTitle || '',
                metaDescription: metaDesc || '',
                metaKeywords: keywords ? keywords.split(',').map(k => k.trim()).filter(k => k) : []
            };
            
            console.log(`💾 Parsing SEO for ${lang}:`, {
                metaTitle: metaTitle || '(empty)',
                metaDescription: metaDesc || '(empty)',
                keywords: keywords || '(empty)'
            });
        });
        
        data.icon = formData.get('icon');
        data.color = formData.get('color');
        data.settings.isActive = formData.get('isActive') === 'true';
        data.settings.isVisible = formData.get('isVisible') === 'true';
        
        const mainStatus = formData.get('mainStatus');
        if (mainStatus) {
            data.status = mainStatus === 'active' ? 'active' : 'inactive';
        }
        
        console.log('✅ Final seoTranslations:', data.seoTranslations);
        
        return data;
    }

    /**
     * Initialize modal features and event listeners
     */
    initializeModalFeatures(modal) {
        try {
            // Setup ESC key to close modal
            this.setupModalKeyboardEvents(modal);
            
            // Setup modal close events
            this.setupModalCloseEvents(modal);
        
        // Auto-generate slug from name
        this.setupSlugGeneration(modal);
        
        // Setup language switcher
        this.initializeLanguageSwitcher(modal);
        
        // Setup language tabs
        this.setupLanguageTabs(modal);
        
        // Setup icon preview
        this.setupIconPreview(modal);
        
        // Setup color picker
        this.setupColorPicker(modal);
        
        // Setup form validation
        this.setupFormValidation(modal);
        
        // Setup form submission
        this.setupFormSubmission(modal);
        
            // Setup toggle switches
            this.setupToggleSwitches(modal);
            
        } catch (error) {
            console.error('❌ Error initializing modal features:', error);
            throw error;
        }
    }

    /**
     * Setup modal keyboard events (ESC to close)
     */
    setupModalKeyboardEvents(modal) {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        
        // Clean up event listener when modal is removed
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.removedNodes.forEach((node) => {
                    if (node === modal || (node.nodeType === 1 && node.contains(modal))) {
                        document.removeEventListener('keydown', handleKeyDown);
                        observer.disconnect();
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * Setup modal close events
     */
    setupModalCloseEvents(modal) {
        // Close button in header
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.remove();
            });
        }
        
        // Minimize button in header
        const minimizeBtn = modal.querySelector('.modal-minimize');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
                // You can implement minimize functionality here
                // For now, we'll just hide the modal
            });
        }
        
        // Cancel button in footer
        const cancelBtn = modal.querySelector('.modal-close-action');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.remove();
            });
        }
    }

    /**
     * Show field error
     */
    showFieldError(field, message) {
        const feedback = field.parentNode.querySelector('.input-feedback');
        if (feedback) {
            feedback.textContent = message;
            feedback.classList.add('error');
        }
        field.classList.add('error');
    }

    /**
     * Clear field error
     */
    clearFieldError(field) {
        const feedback = field.parentNode.querySelector('.input-feedback');
        if (feedback) {
            feedback.textContent = '';
            feedback.classList.remove('error');
        }
        field.classList.remove('error');
    }

    /**
     * Setup automatic slug generation
     */
    setupSlugGeneration(modal) {
        const nameInput = modal.querySelector('input[name="translations[uz][name]"]');
        const oldNameInput = modal.querySelector('#categoryName');
        
        if (nameInput) {
            nameInput.addEventListener('input', (e) => {
                const slug = this.generateSlug(e.target.value);
                console.log('Generated slug from Uzbek name:', slug);
            });
        } else if (oldNameInput) {
            oldNameInput.addEventListener('input', (e) => {
                const slug = this.generateSlug(e.target.value);
                console.log('Generated slug from old name:', slug);
            });
        }
    }

    /**
     * Generate URL-friendly slug from name
     */
    generateSlug(name) {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    }

    /**
     * Setup language tabs functionality
     */
    setupLanguageTabs(modal) {
        const langTabs = modal.querySelectorAll('.lang-tab');
        const langContents = modal.querySelectorAll('.lang-content');
        
        langTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active from all tabs and contents
                langTabs.forEach(t => t.classList.remove('active'));
                langContents.forEach(c => c.classList.remove('active'));
                
                // Add active to clicked tab
                tab.classList.add('active');
                
                // Show corresponding content
                const targetLang = tab.dataset.lang;
                const targetContent = modal.querySelector(`[data-lang="${targetLang}"].lang-content`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }

    /**
     * Setup icon preview functionality
     */
    setupIconPreview(modal) {
        const iconInput = modal.querySelector('#categoryIcon');
        const iconPreview = modal.querySelector('#iconPreview');
        
        if (iconInput && iconPreview) {
            iconInput.addEventListener('input', (e) => {
                const iconClass = e.target.value || 'las la-folder';
                iconPreview.className = iconClass;
            });
        }
    }

    /**
     * Setup color picker functionality
     */
    setupColorPicker(modal) {
        const colorPicker = modal.querySelector('#categoryColor');
        const colorText = modal.querySelector('#categoryColorText');
        
        if (colorPicker && colorText) {
            colorPicker.addEventListener('input', (e) => {
                colorText.value = e.target.value.toUpperCase();
            });
        }
    }

    /**
     * Setup form validation
     */
    setupFormValidation(modal) {
        const form = modal.querySelector('#createCategoryForm') || modal.querySelector('#editCategoryForm');
        if (!form) {
            console.warn('Form not found in modal');
            return;
        }
        const requiredFields = form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            // Real-time validation on blur
            field.addEventListener('blur', () => {
                this.validateField(field);
            });
            
            // Clear validation errors on input
            field.addEventListener('input', () => {
                this.clearFieldError(field);
            });
        });
    }

    /**
     * Validate individual field
     */
    validateField(field) {
        // Handle different field types properly
        let value = '';
        if (field.type === 'textarea') {
            value = field.value.trim().replace(/\n\s*/g, ' ').trim();
        } else {
            value = field.value.trim();
        }
        
        let isValid = true;
        let errorMessage = '';
        
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = `${this.getFieldLabel(field)} majburiy`;
        } else if (field.type === 'email' && value && !this.isValidEmail(value)) {
            isValid = false;
            errorMessage = 'To\'g\'ri email manzilini kiriting';
        } else if (field.name === 'slug' && value && !this.isValidSlug(value)) {
            isValid = false;
            errorMessage = 'Slug can only contain lowercase letters, numbers, and hyphens';
        } else if (field.maxLength && field.maxLength > 0 && value.length > field.maxLength) {
            isValid = false;
            errorMessage = `Maximum ${field.maxLength} characters allowed`;
        }
        
        if (!isValid) {
            this.showFieldError(field, errorMessage);
        } else {
            this.clearFieldError(field);
        }
        
        return isValid;
    }

    /**
     * Get field label for validation messages
     */
    getFieldLabel(field) {
        const label = field.closest('.form-group')?.querySelector('.form-label');
        if (label) {
            return label.textContent.replace('*', '').trim();
        }
        
        // Fallback to field name or id
        return field.name || field.id || 'Maydon';
    }

    /**
     * Show field validation error
     */
    showFieldError(field, message) {
        field.classList.add('error');
        
        // Remove existing error
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    /**
     * Clear field validation error
     */
    clearFieldError(field) {
        field.classList.remove('error');
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    /**
     * Get field label text
     */
    getFieldLabel(field) {
        const label = field.parentNode.querySelector('label');
        return label ? label.textContent.replace('*', '').trim() : field.name;
    }

    /**
     * Setup form submission
     */
    setupFormSubmission(modal) {
        const createForm = modal.querySelector('#createCategoryForm');
        const editForm = modal.querySelector('#editCategoryForm');
        
        if (createForm) {
            createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
                await this.handleCategoryCreation(createForm, modal);
            });
        }
        
        if (editForm) {
            editForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleCategoryUpdate(editForm, modal);
            });
        }
    }

    /**
     * Setup toggle switches functionality
     * Professional implementation with proper event handling
     */
    setupToggleSwitches(modal) {
        const toggleItems = modal.querySelectorAll('.toggle-item');
        
        toggleItems.forEach((toggleItem) => {
            const toggleInput = toggleItem.querySelector('.toggle-input');
            const toggleLabel = toggleItem.querySelector('.toggle-label');
            
            if (toggleInput && toggleLabel) {
                // Unified click handler for toggle functionality
                const handleToggleClick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Toggle the checkbox state
                    toggleInput.checked = !toggleInput.checked;
                    
                    // Trigger change event for form validation
                    const changeEvent = new Event('change', { bubbles: true });
                    toggleInput.dispatchEvent(changeEvent);
                };
                
                // Add click handlers to both toggle item and label
                toggleItem.addEventListener('click', handleToggleClick);
                toggleLabel.addEventListener('click', handleToggleClick);
            }
        });
    }

    /**
     * Handle category update
     */
    async handleCategoryUpdate(form, modal) {
        try {
            // Validate form
            if (!this.validateForm(form)) {
                this.showError('Yuborishdan oldin validatsiya xatolarini tuzating');
                return;
            }
            
            // Show loading state
            this.setModalLoadingState(true);
            
            // Collect form data
            const formData = this.collectFormData(form);
            const categoryId = modal.querySelector('[data-category-id]').getAttribute('data-category-id');
            
            // Debug: Log update data
            console.log('📤 Updating category:', categoryId);
            console.log('📋 Update data:', JSON.stringify(formData, null, 2));
            
            // Submit to backend
            const response = await fetch(`${this.endpoints.categories}/${categoryId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            console.log('📥 Update response:', result);
            
            if (result.success) {
                // Success - close modal and refresh table
                modal.remove();
                this.showNotification('Kategoriya muvaffaqiyatli yangilandi!', 'success');
                await this.refreshData();
                
                // Update theme for any remaining modals
                this.updateModalTheme();
                
            } else {
                // Handle validation errors
                console.error('❌ Update validation errors:', result);
                if (result.message) {
                    this.showError(result.message);
                }
                this.handleServerErrors(result, form);
            }
            
        } catch (error) {
            console.error('❌ Error updating category:', error);
            this.showError('Kategoriyani yangilashda xatolik. Qayta urinib ko\'ring.');
        } finally {
            this.setModalLoadingState(false);
        }
    }

    /**
     * Handle category creation
     */
    async handleCategoryCreation(form, modal) {
        
        try {
            // Validate form
            if (!this.validateForm(form)) {
                this.showError('Yuborishdan oldin validatsiya xatolarini tuzating');
                return;
            }
            
            // Show loading state
            this.setModalLoadingState(true);
            
            // Collect form data
            const formData = this.collectFormData(form);
            
            // Debug: Log data being sent
            console.log('📤 Sending category data:', JSON.stringify(formData, null, 2));
            
            // Submit to backend
            const response = await fetch(this.endpoints.categories, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            console.log('📥 Backend response:', result);
            
            if (result.success) {
                // Success - close modal and refresh table
                modal.remove();
                this.showNotification('Kategoriya muvaffaqiyatli yaratildi!', 'success');
                await this.refreshData();
                
                // Update theme for any remaining modals
                this.updateModalTheme();
                
            } else {
                // Handle validation errors
                console.error('❌ Backend validation errors:', result);
                console.error('❌ Error details:', result.details || result.errors);
                
                if (result.details && Array.isArray(result.details)) {
                    result.details.forEach(detail => {
                        console.error(`   - ${detail.field || detail.param}: ${detail.message || detail.msg}`);
                    });
                }
                
                if (result.message) {
                    this.showError(result.message);
                }
                this.handleServerErrors(result, form);
            }
            
        } catch (error) {
            console.error('❌ Error creating category:', error);
            this.showError('Kategoriya yaratishda xatolik. Qayta urinib ko\'ring.');
        } finally {
            this.setModalLoadingState(false);
        }
    }

    /**
     * Validate entire form
     */
    validateForm(form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        return isValid;
    }

    /**
     * Collect form data for submission
     */
    collectFormData(form) {
        const formData = new FormData(form);
        
        const uzName = formData.get('translations[uz][name]');
        const uzDesc = formData.get('translations[uz][description]');
        
        if (!uzName || !uzName.trim()) {
            this.showError('O\'zbek tilida kategoriya nomi majburiy');
            const langSelector = form.querySelector('#languageSelector');
            if (langSelector) langSelector.value = 'uz';
            form.querySelectorAll('.lang-fields').forEach(field => {
                field.style.display = field.dataset.lang === 'uz' ? 'block' : 'none';
            });
            throw new Error('Uzbek name is required');
        }
        
        if (!uzDesc || !uzDesc.trim()) {
            this.showError('O\'zbek tilida kategoriya tavsifi majburiy');
            const langSelector = form.querySelector('#languageSelector');
            if (langSelector) langSelector.value = 'uz';
            form.querySelectorAll('.lang-fields').forEach(field => {
                field.style.display = field.dataset.lang === 'uz' ? 'block' : 'none';
            });
            throw new Error('Uzbek description is required');
        }
        
        const multiLangData = this.parseMultiLanguageFormData(formData);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            if (key.includes('.')) {
                this.setNestedValue(data, key, value);
            } else if (key === 'allowedCompanyTypes') {
                if (!data[key]) data[key] = [];
                data[key].push(value);
            } else {
                data[key] = value;
            }
        }
        
        const checkboxes = form.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            const value = checkbox.checked;
            if (checkbox.name.includes('.')) {
                this.setNestedValue(data, checkbox.name, value);
            } else {
                data[checkbox.name] = value;
            }
        });
        
        data.translations = multiLangData.translations;
        data.seoTranslations = multiLangData.seoTranslations;
        
        console.log('📦 Collected data before structuring:', {
            translations: data.translations,
            hasUzName: !!data.translations?.uz?.name,
            hasUzDesc: !!data.translations?.uz?.description
        });
        
        // Auto-generate slug from Uzbek name if not provided
        if (!data.slug || !data.slug.trim()) {
            data.slug = this.generateSlug(uzName);
        }
        
        return this.structureCategoryData(data);
    }

    /**
     * Set nested object value from dot notation
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
    }

    /**
     * Structure data according to Category schema
     */
    structureCategoryData(data) {
        console.log('🔧 structureCategoryData input:', data);
        console.log('🔧 data.translations:', data.translations);
        
        const uzName = data.translations?.uz?.name || '';
        const uzDescription = data.translations?.uz?.description || '';
        
        console.log('🔧 Extracted uzName:', uzName);
        console.log('🔧 Extracted uzDescription:', uzDescription);
        
        // Determine boolean values (handle checkbox true/false and checkbox checked/unchecked)
        const isActiveValue = data.isActive === true || data.isActive === 'true';
        const isVisibleValue = data.isVisible === true || data.isVisible === 'true';
        const isFeaturedValue = data.isFeatured === true || data.isFeatured === 'true';
        
        console.log('🔧 Before structuring - seoTranslations:', data.seoTranslations);
        
        const structuredData = {
            // Basic Information (required by backend validation)
            name: uzName,
            description: uzDescription,
            slug: data.slug,
            
            // Visual
            icon: data.icon || 'las la-folder',
            color: data.color || '#3B82F6',
            
            // Boolean flags at root level (for backend validation)
            isActive: isActiveValue,
            isVisible: isVisibleValue,
            isFeatured: isFeaturedValue,
            
            // Multi-language (full translations object)
            translations: data.translations || {},
            
            // Multi-language SEO
            seoTranslations: data.seoTranslations || {},
            
            // SEO (legacy/default SEO fields)
            seo: {
                metaTitle: data.seoTranslations?.uz?.metaTitle || data.metaTitle || '',
                metaDescription: data.seoTranslations?.uz?.metaDescription || data.metaDescription || '',
                metaKeywords: data.seoTranslations?.uz?.metaKeywords || (data.metaKeywords ? data.metaKeywords.split(',').map(k => k.trim()) : [])
            },
            
            // Settings (also include for backwards compatibility)
            settings: {
                isActive: isActiveValue,
                isVisible: isVisibleValue,
                isFeatured: isFeaturedValue,
                allowProducts: data.allowProducts !== false,
                sortOrder: parseInt(data.sortOrder) || 0
            },
            
            // Main Status
            status: data.mainStatus ? 'active' : 'inactive',
            
            // Business Rules
            businessRules: {
                allowedCompanyTypes: data.allowedCompanyTypes || ['manufacturer', 'distributor'],
                minimumOrderQuantity: parseInt(data.minimumOrderQuantity) || 1
            }
        };
        
        console.log('✅ Final structured data seoTranslations:', structuredData.seoTranslations);
        console.log('✅ Final structured data seo (legacy):', structuredData.seo);
        
        return structuredData;
    }

    /**
     * Set modal loading state
     */
    setModalLoadingState(loading) {
        const createBtn = document.querySelector('#createCategoryBtn');
        const updateBtn = document.querySelector('#updateCategoryBtn');
        
        [createBtn, updateBtn].forEach(btn => {
            if (btn) {
                const btnText = btn.querySelector('.btn-text');
                const btnLoading = btn.querySelector('.btn-loading');
                
                if (btnText && btnLoading) {
            btn.disabled = loading;
            
            if (loading) {
                btnText.classList.add('d-none');
                btnLoading.classList.remove('d-none');
            } else {
                btnText.classList.remove('d-none');
                btnLoading.classList.add('d-none');
            }
        }
            }
        });
    }

    /**
     * Handle server validation errors
     */
    handleServerErrors(result, form) {
        if (result.errors && Array.isArray(result.errors)) {
            result.errors.forEach(error => {
                const field = form.querySelector(`[name="${error.field}"]`);
                if (field) {
                    this.showFieldError(field, error.message);
                }
            });
        } else {
            this.showError(result.message || 'Validatsiya xatoligi');
        }
    }

    /**
     * Utility validation methods
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidSlug(slug) {
        const slugRegex = /^[a-z0-9-_]+$/;
        return slugRegex.test(slug);
    }

    /**
     * Refresh data
     */
    async refreshData() {
        try {
            this.selectedCategories.clear();
            this.updateBulkActionsVisibility();
            await this.loadInitialData();
            this.showNotification('Ma\'lumotlar muvaffaqiyatli yangilandi', 'success');
        } catch (error) {
            console.error('Error refreshing data:', error);
            this.showError('Ma\'lumotlarni yangilashda xatolik');
        }
    }

    /**
     * Export categories
     */
    async exportCategories() {
        try {
            let url = `${this.endpoints.export}?format=csv`;
            
            // Apply current filters to export
            Object.entries(this.filters).forEach(([key, value]) => {
                if (value) {
                    url += `&${key}=${encodeURIComponent(value)}`;
                }
            });

            window.open(url, '_blank');
            this.showNotification('Eksport muvaffaqiyatli boshlandi', 'success');
        } catch (error) {
            console.error('Error exporting categories:', error);
            this.showError('Kategoriyalarni eksport qilishda xatolik');
        }
    }

    /**
     * UI helper methods
     */
    showLoading(show) {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }

    renderEmptyState() {
        if (this.emptyState) {
            this.emptyState.classList.remove('hidden');
        }
        if (this.categoriesTableBody) {
            this.categoriesTableBody.innerHTML = '';
        }
        if (this.mobileCardsView) {
            this.mobileCardsView.innerHTML = '';
        }
    }

    hideEmptyState() {
        if (this.emptyState) {
            this.emptyState.classList.add('hidden');
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications to prevent memory leaks
        const existingNotifications = document.querySelectorAll('.toast-notification');
        existingNotifications.forEach(notification => {
            notification.remove();
        });

        // Create new notification with unique ID
        const notificationId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const notification = document.createElement('div');
        notification.id = notificationId;
        notification.className = `toast-notification toast-${type}`;
        
        notification.innerHTML = `
            <div class="toast-content">
                <i class="las la-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${this.escapeHtml(message)}</span>
            </div>
            <button class="toast-close" onclick="this.closest('.toast-notification').remove()">
                <i class="las la-times"></i>
            </button>
        `;

        document.body.appendChild(notification);

        // Show with animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification && notification.parentNode) {
            notification.classList.remove('show');
                setTimeout(() => {
                    if (notification && notification.parentNode) {
                        notification.remove();
                    }
                }, 300); // Wait for animation to complete
            }
        }, 5000);
    }

    showError(message) {
        this.showNotification(message, 'error');
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
     * Get cookie value by name
     */
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    /**
     * API helper methods
     */
    async makeRequest(url, options = {}) {
        // Get CSRF token
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        
        // Get auth token from localStorage or cookies
        const authToken = localStorage.getItem('adminToken') || this.getCookie('adminToken');
        
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken,
                'Authorization': authToken ? `Bearer ${authToken}` : '',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        };

        // Merge headers properly to avoid overwriting
        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...(options.headers || {})
            }
        };

        try {
            const response = await fetch(url, finalOptions);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    /**
     * Utility methods
     */
    debounce(func, wait) {
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

    escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }

    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    getRelativeTime(dateString) {
        if (!dateString) return 'Noma\'lum';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Kecha';
        if (diffDays < 7) return `${diffDays} kun oldin`;    
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} hafta oldin`;
        if (diffDays < 365) return `${Math.ceil(diffDays / 30)} oy oldin`;
        return `${Math.ceil(diffDays / 365)} yil oldin`;
    }

    getStatusIcon(status) {
        const icons = {
            active: '<i class="las la-check-circle"></i>',
            inactive: '<i class="las la-pause-circle"></i>',
            draft: '<i class="las la-edit"></i>',
            archived: '<i class="las la-archive"></i>'
        };
        return icons[status] || '<i class="las la-question-circle"></i>';
    }

    // Theme management for categories page
    updateModalTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const modals = document.querySelectorAll('.category-modal, .modal-overlay');
        
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

    // ===============================================
    // PROFESSIONAL DROPDOWN MANAGEMENT SYSTEM
    // ===============================================

    /**
     * Setup professional dropdown management with proper event delegation
     */
    setupDropdownManager() {
        // Only setup once to avoid duplicate event listeners
        if (this.dropdownManagerSetup) {
            return;
        }
        
        this.activeDropdown = null;
        this.dropdownState = new Map();
        
        // Remove any existing event listeners to avoid duplicates
        this.removeDropdownListeners();
        
        // Setup professional event delegation
        this.setupDropdownDelegation();
        
        // Setup outside click handler
        this.setupOutsideClickHandler();
        
        // Mark as setup
        this.dropdownManagerSetup = true;
    }

    /**
     * Setup dropdown event delegation with senior engineer approach
     */
    setupDropdownDelegation() {
        // Remove existing event listener first
        if (this.dropdownClickHandler) {
            document.removeEventListener('click', this.dropdownClickHandler);
        }
        
        // Professional event delegation for dropdown triggers
        this.dropdownClickHandler = (e) => {
            const trigger = e.target.closest('[data-dropdown-trigger]');
            if (trigger) {
                e.preventDefault();
                e.stopPropagation();
                
                const categoryId = trigger.getAttribute('data-dropdown-trigger');
                this.toggleDropdown(categoryId, trigger);
                return;
            }
            
            // Handle dropdown item clicks
            const dropdownItem = e.target.closest('[data-action]');
            if (dropdownItem && dropdownItem.hasAttribute('data-category-id')) {
                e.preventDefault();
                e.stopPropagation();
                
                const action = dropdownItem.getAttribute('data-action');
                const categoryId = dropdownItem.getAttribute('data-category-id');
                
                // Close dropdown before executing action
                this.closeAllDropdowns();
                
                // Execute the action with professional error handling
                this.executeDropdownAction(action, categoryId);
                return;
            }
        };
        
        // Add the event listener with higher priority (capture mode)
        document.addEventListener('click', this.dropdownClickHandler, true);
    }

    /**
     * Professional dropdown toggle with state management
     */
    toggleDropdown(categoryId, trigger) {
        try {
            if (!categoryId || !trigger) {
                console.error('❌ Invalid dropdown toggle parameters:', { categoryId, trigger });
                return;
            }
            
            const dropdownMenu = document.querySelector(`[data-dropdown-menu="${categoryId}"]`);
            if (!dropdownMenu) {
                console.error(`❌ Dropdown menu not found for category: ${categoryId}`);
                return;
            }
            
            const isCurrentlyOpen = this.activeDropdown === categoryId;
            
            // Always close all dropdowns first
            this.closeAllDropdowns();
            
            // If it wasn't open, open it with professional positioning
            if (!isCurrentlyOpen) {
                this.openDropdown(categoryId, dropdownMenu, trigger);
            }
            
            
        } catch (error) {
            console.error('❌ Dropdown toggle error:', error);
            this.closeAllDropdowns(); // Fallback safety
        }
    }

    /**
     * Open dropdown with professional positioning and state management
     */
    openDropdown(categoryId, dropdownMenu, trigger) {
        try {
            // Set active state
            this.activeDropdown = categoryId;
            this.dropdownState.set(categoryId, { isOpen: true, timestamp: Date.now() });
            
            // Add visual classes
            dropdownMenu.classList.add('show', 'dropdown-menu-animated');
            trigger.classList.add('dropdown-active');
            
            // Professional positioning with viewport detection
            this.positionDropdown(dropdownMenu, trigger);
            
            // Add ARIA accessibility
            trigger.setAttribute('aria-expanded', 'true');
            dropdownMenu.setAttribute('aria-hidden', 'false');
            
            // Setup keyboard navigation
            this.setupKeyboardNavigation(dropdownMenu);
            
            
        } catch (error) {
            console.error('❌ Open dropdown error:', error);
            this.closeDropdown(categoryId);
        }
    }

    /**
     * Close specific dropdown with cleanup
     * ENHANCED: Better cleanup including parent row class and inline styles
     */
    closeDropdown(categoryId) {
        try {
            const dropdownMenu = document.querySelector(`[data-dropdown-menu="${categoryId}"]`);
            const trigger = document.querySelector(`[data-dropdown-trigger="${categoryId}"]`);
            
            if (dropdownMenu) {
                dropdownMenu.classList.remove('show', 'dropdown-menu-animated');
                dropdownMenu.setAttribute('aria-hidden', 'true');
                
                // ENHANCED: Clear inline positioning styles (for fixed positioning)
                dropdownMenu.style.top = '';
                dropdownMenu.style.left = '';
                dropdownMenu.style.right = '';
                dropdownMenu.style.bottom = '';
            }
            
            if (trigger) {
                trigger.classList.remove('dropdown-active');
                trigger.setAttribute('aria-expanded', 'false');
                
                // ENHANCED: Clean up parent row class
                const parentRow = trigger.closest('tr');
                if (parentRow) {
                    parentRow.classList.remove('has-active-dropdown');
                }
            }
            
            // Clean up state
            if (this.activeDropdown === categoryId) {
                this.activeDropdown = null;
            }
            this.dropdownState.delete(categoryId);
            
        } catch (error) {
            console.error('❌ Close dropdown error:', error);
        }
    }

    /**
     * Close all dropdowns - professional cleanup
     * ENHANCED: Complete cleanup including parent rows and inline styles
     */
    closeAllDropdowns() {
        try {
            // Close all category dropdowns
            document.querySelectorAll('.category-dropdown-menu.show').forEach(menu => {
                // Remove focus from any focused element inside the dropdown
                const focusedElement = menu.querySelector(':focus');
                if (focusedElement) {
                    focusedElement.blur();
                }
                
                menu.classList.remove('show', 'dropdown-menu-animated');
                menu.setAttribute('aria-hidden', 'true');
                
                // ENHANCED: Clear inline positioning styles (for fixed positioning)
                menu.style.top = '';
                menu.style.left = '';
                menu.style.right = '';
                menu.style.bottom = '';
            });
            
            // Clean up all triggers
            document.querySelectorAll('[data-dropdown-trigger]').forEach(trigger => {
                trigger.classList.remove('dropdown-active');
                trigger.setAttribute('aria-expanded', 'false');
                
                // ENHANCED: Clean up parent row class
                const parentRow = trigger.closest('tr');
                if (parentRow) {
                    parentRow.classList.remove('has-active-dropdown');
                }
            });
            
            // Reset state
            this.activeDropdown = null;
            if (this.dropdownState && typeof this.dropdownState.clear === 'function') {
                this.dropdownState.clear();
            }
            
        } catch (error) {
            console.error('❌ Close all dropdowns error:', error);
        }
    }

    /**
     * Professional dropdown positioning with viewport detection
     * ENHANCED: FIXED positioning to escape ALL parent overflow constraints
     */
    positionDropdown(dropdownMenu, trigger) {
        try {
            // Get trigger position relative to viewport (for fixed positioning)
            const rect = trigger.getBoundingClientRect();
            const viewport = {
                width: window.innerWidth,
                height: window.innerHeight
            };
            
            // Force browser reflow to get accurate menu dimensions
            dropdownMenu.style.display = 'block';
            const menuRect = dropdownMenu.getBoundingClientRect();
            dropdownMenu.style.display = '';
            
            // Menu dimensions with padding
            const menuWidth = 200; // min-width from CSS
            const menuHeight = menuRect.height || 300; // fallback estimate
            
            // Reset positioning classes
            dropdownMenu.classList.remove('dropdown-up');
            
            // Calculate positions with intelligent viewport detection
            const buffer = 20; // Safety margin from viewport edge
            
            // VERTICAL POSITIONING
            let top = rect.bottom + 4; // Default: below trigger
            const fitsBelow = rect.bottom + menuHeight <= viewport.height - buffer;
            
            if (!fitsBelow) {
                // Position above if doesn't fit below
                top = rect.top - menuHeight - 4;
                dropdownMenu.classList.add('dropdown-up');
                
                // If doesn't fit above either, position at top of viewport
                if (top < buffer) {
                    top = buffer;
                    dropdownMenu.classList.remove('dropdown-up');
                }
            }
            
            // HORIZONTAL POSITIONING
            let left = rect.right - menuWidth; // Default: align to right edge of trigger
            
            // Check if fits on right side
            if (left < buffer) {
                // Align to left edge of trigger if doesn't fit
                left = rect.left;
                
                // If still doesn't fit, align to viewport edge
                if (left + menuWidth > viewport.width - buffer) {
                    left = viewport.width - menuWidth - buffer;
                }
            }
            
            // Apply fixed positioning via inline styles
            dropdownMenu.style.top = `${top}px`;
            dropdownMenu.style.left = `${left}px`;
            dropdownMenu.style.right = 'auto'; // Override CSS
            dropdownMenu.style.bottom = 'auto'; // Override CSS
            
            // Add parent row class for visual indication
            const parentRow = trigger.closest('tr');
            if (parentRow) {
                parentRow.classList.add('has-active-dropdown');
            }
            
            console.log('✅ Dropdown positioned:', { top, left, viewport, menuSize: { width: menuWidth, height: menuHeight } });
            
        } catch (error) {
            console.error('❌ Dropdown positioning error:', error);
        }
    }

    /**
     * Setup outside click handler for professional UX
     * ENHANCED: Added scroll listener for fixed positioning
     */
    setupOutsideClickHandler() {
        document.addEventListener('click', (e) => {
            // Don't close if clicking on dropdown elements
            if (e.target.closest('.category-dropdown')) {
                return;
            }
            
            // Close all dropdowns when clicking outside
            if (this.activeDropdown) {
                this.closeAllDropdowns();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeDropdown) {
                this.closeAllDropdowns();
                // Return focus to trigger
                const trigger = document.querySelector(`[data-dropdown-trigger="${this.activeDropdown}"]`);
                if (trigger) trigger.focus();
            }
        });
        
        // ENHANCED: Close dropdowns on scroll (for fixed positioning)
        let scrollTimeout;
        const handleScroll = () => {
            // Debounce scroll events for performance
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                // Close dropdowns when scrolling (fixed position may become misaligned)
                if (this.activeDropdown) {
                    this.closeAllDropdowns();
                }
            }, 100);
        };
        
        // Listen to all scroll events (window and table container)
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Also listen to table scroll
        const tableContainer = document.querySelector('.desktop-table-view');
        if (tableContainer) {
            tableContainer.addEventListener('scroll', handleScroll, { passive: true });
        }
        
        // Listen to admin content scroll
        const adminContent = document.querySelector('.admin-content');
        if (adminContent) {
            adminContent.addEventListener('scroll', handleScroll, { passive: true });
        }
    }

    /**
     * Setup keyboard navigation for accessibility
     */
    setupKeyboardNavigation(dropdownMenu) {
        const items = dropdownMenu.querySelectorAll('.dropdown-item');
        let currentIndex = -1;
        
        dropdownMenu.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    currentIndex = Math.min(currentIndex + 1, items.length - 1);
                    items[currentIndex]?.focus();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    currentIndex = Math.max(currentIndex - 1, 0);
                    items[currentIndex]?.focus();
                    break;
                case 'Enter':
                    e.preventDefault();
                    items[currentIndex]?.click();
                    break;
            }
        });
    }

    /**
     * Execute dropdown actions with professional error handling
     */
    executeDropdownAction(action, categoryId) {
        try {
            // Check if action is already being executed
            const actionKey = `${action}_${categoryId}`;
            if (window.executingActions && window.executingActions.has(actionKey)) {
                return;
            }
            
            // Initialize executing actions set if not exists
            if (!window.executingActions) {
                window.executingActions = new Set();
            }
            
            // Add action to executing set
            window.executingActions.add(actionKey);
            
            switch (action) {
                case 'edit':
                    this.editCategory(categoryId);
                    break;
                case 'analytics':
                    this.viewAnalytics(categoryId);
                    break;
                case 'toggle-active':
                    this.toggleCategoryActive(categoryId);
                    break;
                case 'toggle-visibility':
                    this.toggleCategoryVisibility(categoryId);
                    break;
                case 'toggle-main-status':
                    this.toggleCategoryMainStatus(categoryId);
                    break;
                case 'duplicate':
                    this.duplicateCategory(categoryId);
                    break;
                case 'delete':
                    this.deleteCategory(categoryId);
                    break;
                case 'restore':
                    this.restoreCategory(categoryId);
                    break;
                case 'permanent-delete':
                    this.permanentDeleteCategory(categoryId);
                    break;
                default:
                    console.warn(`⚠️ Unknown dropdown action: ${action}`);
                    this.showError(`Unknown action: ${action}`);
            }
            
            // Remove action from executing set after completion
            setTimeout(() => {
                if (window.executingActions) {
                    window.executingActions.delete(actionKey);
                }
            }, 1000); // Wait 1 second before allowing same action again
            
        } catch (error) {
            console.error(`❌ Error executing action ${action}:`, error);
            this.showError(`Failed to execute ${action}`);
            
            // Remove action from executing set on error
            if (window.executingActions) {
                window.executingActions.delete(actionKey);
            }
        }
    }

    /**
     * Remove existing dropdown listeners to prevent duplicates
     */
    removeDropdownListeners() {
        // Remove document-level event listener
        if (this.dropdownClickHandler) {
            document.removeEventListener('click', this.dropdownClickHandler, true);
            this.dropdownClickHandler = null;
        }
        
        // Remove outside click handler
        if (this.outsideClickHandler) {
            document.removeEventListener('click', this.outsideClickHandler, true);
            this.outsideClickHandler = null;
        }
        
        // Close all open dropdowns
        this.closeAllDropdowns();
    }

    /**
     * Escape HTML to prevent XSS attacks
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (typeof CategoriesManagement !== 'undefined') {
        window.categoriesManager = new CategoriesManagement();
        window.categoriesManager.init();
        
        // Global function for EJS onclick
        window.openCreateCategoryModal = function() {
            if (window.categoriesManager) {
                // Check if modal is already being created
                if (window.categoriesManager.isCreatingModal) {
                    return;
                }
                window.categoriesManager.showCreateModal();
            } else {
                console.error('❌ categoriesManager not found');
            }
        };
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CategoriesManagement;
}