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
        this.filters = {
            status: '',
            level: '',
            parentCategory: '',
            search: '',
            featured: '',
            productCount: '',
            dateRange: '',
            sortBy: 'createdAt',
            sortOrder: 'desc'
        };
        this.selectedCategories = new Set();
        this.categories = [];
        this.statistics = {};
        this.isLoading = false;
        this.sortState = {};
        
        // API endpoints
        this.endpoints = {
            categories: '/admin/api/categories',
            statistics: '/admin/api/categories/statistics',
            hierarchy: '/admin/api/categories/hierarchy',
            bulk: '/admin/api/categories/bulk',
            export: '/admin/api/categories/export',
            analytics: '/admin/api/categories/{id}/analytics'
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
        this.levelFilter = document.getElementById('levelFilter');
        this.parentCategoryFilter = document.getElementById('parentCategoryFilter');
        this.featuredFilter = document.getElementById('featuredFilter');
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
        this.rootCategoriesTab = document.getElementById('rootCategoriesTab');
        this.tableResultsCount = document.getElementById('tableResultsCount');
    }

    /**
     * Initialize categories management system
     */
    async init() {
        try {
            
            await this.setupEventListeners();
            await this.loadParentCategories();
            await this.loadInitialData();
            this.setupThemeListener(); // Add theme listener setup
            this.setupDropdownManager(); // Professional dropdown management
            
        } catch (error) {
            console.error('❌ Error initializing Categories Management:', error);
            this.showError('Failed to initialize categories management system');
        }
    }

    /**
     * Setup event listeners
     */
    async setupEventListeners() {
        // Search input with debounce
        if (this.searchInput) {
            this.searchInput.addEventListener('input', this.debounce(() => {
                this.filters.search = this.searchInput.value.trim();
                this.applyFilters();
            }, 500));
        }

        // Filter dropdowns
        const filterElements = [
            { element: this.levelFilter, key: 'level' },
            { element: this.parentCategoryFilter, key: 'parentCategory' },
            { element: this.featuredFilter, key: 'featured' },
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

        this.handleResponsiveView();
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
        const level = clickedTab.dataset.level;

        if (status !== undefined) {
            this.filters.status = status;
            this.filters.level = '';
        } else if (level !== undefined) {
            this.filters.level = level;
            this.filters.status = '';
        }

        this.applyFilters();
    }

    /**
     * Load parent categories for filter dropdown
     */
    async loadParentCategories() {
        try {
            const response = await this.makeRequest(`${this.endpoints.hierarchy}?language=en`);
            if (response.success && this.parentCategoryFilter) {
                this.populateParentCategoryFilter(response.data);
            }
        } catch (error) {
            console.error('Error loading parent categories:', error);
        }
    }

    /**
     * Populate parent category filter dropdown
     */
    populateParentCategoryFilter(hierarchy, level = 0) {
        if (!this.parentCategoryFilter) return;

        hierarchy.forEach(category => {
            const option = document.createElement('option');
            option.value = category._id;
            option.textContent = '  '.repeat(level) + category.name;
            this.parentCategoryFilter.appendChild(option);

            if (category.children && category.children.length > 0) {
                this.populateParentCategoryFilter(category.children, level + 1);
            }
        });
    }

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
                this.updateResultsCount();
            } else {
                throw new Error(response.error || 'Failed to load categories');
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            this.showError('Failed to load categories');
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
        if (this.rootCategoriesTab) {
            const rootCount = this.statistics.levelDistribution?.find(level => level.level === 0)?.count || 0;
            this.rootCategoriesTab.textContent = rootCount;
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
                                    ${category.settings?.isFeatured ? '<span class="badge badge-featured"><i class="las la-star"></i>Featured</span>' : ''}
                                    ${category.status === 'active' ? '<span class="badge badge-success">Active</span>' : 
                                      category.status === 'inactive' ? '<span class="badge badge-warning">Inactive</span>' : 
                                      category.status === 'draft' ? '<span class="badge badge-secondary">Draft</span>' : 
                                      '<span class="badge badge-danger">Archived</span>'}
                                </div>
                            </div>
                            <p class="category-description">${this.escapeHtml(category.shortDescription || category.description || '').substring(0, 100)}${(category.description?.length > 100) ? '...' : ''}</p>
                            <div class="category-meta">
                                <span class="meta-item">
                                    <i class="las la-tag"></i>
                                    Slug: ${category.slug}
                                </span>
                                ${category.parentCategoryName ? `
                                    <span class="meta-item">
                                        <i class="las la-sitemap"></i>
                                        Parent: ${category.parentCategoryName}
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </td>
                <td class="td-hierarchy">
                    <div class="hierarchy-info">
                        <div class="level-indicator">
                            <span class="level-badge level-${category.level}">
                                Level ${category.level}
                            </span>
                        </div>
                        <div class="hierarchy-path">
                            ${category.path ? this.escapeHtml(category.path) : 'Root'}
                        </div>
                        <div class="hierarchy-stats">
                            <span class="stat-item">
                                <i class="las la-layer-group"></i>
                                ${category.level === 0 ? 'Root Category' : `Child of Level ${category.level - 1}`}
                            </span>
                        </div>
                    </div>
                </td>
                <td class="td-products">
                    <div class="products-analytics">
                        <div class="product-counts">
                            <div class="count-item primary">
                                <span class="count-value">${category.productStats?.total || 0}</span>
                                <span class="count-label">Total Products</span>
                            </div>
                            <div class="count-item success">
                                <span class="count-value">${category.productStats?.active || 0}</span>
                                <span class="count-label">Active</span>
                            </div>
                        </div>
                        <div class="analytics-chart">
                            <div class="mini-progress">
                                <div class="progress-bar" style="width: ${category.productStats?.total > 0 ? (category.productStats.active / category.productStats.total * 100) : 0}%"></div>
                            </div>
                            <span class="progress-label">
                                ${category.productStats?.total > 0 ? Math.round(category.productStats.active / category.productStats.total * 100) : 0}% Active
                            </span>
                        </div>
                    </div>
                </td>
                <td class="td-business">
                    <div class="business-metrics">
                        <div class="revenue-info">
                            <span class="revenue-value">$${(category.productStats?.revenue || 0).toLocaleString()}</span>
                            <span class="revenue-label">Total Revenue</span>
                        </div>
                        <div class="business-stats">
                            <div class="stat-row">
                                <i class="las la-chart-line text-success"></i>
                                <span>Growth: +${category.metrics?.monthlyGrowth || 0}%</span>
                            </div>
                            <div class="stat-row">
                                <i class="las la-star text-warning"></i>
                                <span>Score: ${category.metrics?.popularityScore || 0}/100</span>
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
                                ${category.settings?.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span class="detail-item ${category.settings?.isVisible ? 'text-info' : 'text-muted'}">
                                <i class="las ${category.settings?.isVisible ? 'la-eye' : 'la-eye-slash'}"></i>
                                ${category.settings?.isVisible ? 'Visible' : 'Hidden'}
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
                                ${category.creatorName || 'Unknown'}
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
                        <button class="btn-action btn-view" onclick="window.categoriesManager.viewCategory('${category._id}')" title="View Details">
                            <i class="las la-eye"></i>
                        </button>
                        <button class="btn-action btn-edit" onclick="window.categoriesManager.editCategory('${category._id}')" title="Edit Category">
                            <i class="las la-edit"></i>
                        </button>
                        <button class="btn-action btn-analytics" onclick="window.categoriesManager.viewAnalytics('${category._id}')" title="View Analytics">
                            <i class="las la-chart-bar"></i>
                        </button>
                        <div class="category-dropdown" data-category-id="${category._id}">
                            <button class="btn-action btn-more" data-dropdown-trigger="${category._id}" title="More Actions">
                                <i class="las la-ellipsis-v"></i>
                            </button>
                            <ul class="category-dropdown-menu" data-dropdown-menu="${category._id}">
                                <li><a class="dropdown-item" href="#" data-action="toggle-status" data-category-id="${category._id}">
                                    <i class="las ${category.settings?.isActive ? 'la-pause' : 'la-play'}"></i>
                                    ${category.settings?.isActive ? 'Deactivate' : 'Activate'}
                                </a></li>
                                <li><a class="dropdown-item" href="#" data-action="toggle-feature" data-category-id="${category._id}">
                                    <i class="las ${category.settings?.isFeatured ? 'la-star-o' : 'la-star'}"></i>
                                    ${category.settings?.isFeatured ? 'Unfeature' : 'Feature'}
                                </a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item" href="#" data-action="duplicate" data-category-id="${category._id}">
                                    <i class="las la-copy"></i>
                                    Duplicate
                                </a></li>
                                <li><a class="dropdown-item text-danger" href="#" data-action="archive" data-category-id="${category._id}">
                                    <i class="las la-archive"></i>
                                    Archive
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
                                ${category.settings?.isFeatured ? '<span class="badge badge-featured"><i class="las la-star"></i>Featured</span>' : ''}
                            </div>
                        </div>
                    </div>
                    
                    <p class="category-description">${this.escapeHtml(category.shortDescription || category.description || '').substring(0, 80)}${(category.description?.length > 80) ? '...' : ''}</p>
                    
                    <div class="category-stats">
                        <div class="stat-item">
                            <i class="las la-layer-group"></i>
                            <span>Level ${category.level}</span>
                        </div>
                        <div class="stat-item">
                            <i class="las la-boxes"></i>
                            <span>${category.productStats?.total || 0} Products</span>
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
                            ${category.creatorName || 'Unknown'}
                        </span>
                    </div>
                </div>
                
                <div class="card-actions">
                    <button class="btn btn-sm btn-outline-primary" onclick="window.categoriesManager.viewCategory('${category._id}')">
                        <i class="las la-eye"></i>
                        View
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="window.categoriesManager.editCategory('${category._id}')">
                        <i class="las la-edit"></i>
                        Edit
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="window.categoriesManager.viewAnalytics('${category._id}')">
                        <i class="las la-chart-bar"></i>
                        Analytics
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
            level: '',
            parentCategory: '',
            search: '',
            featured: '',
            productCount: '',
            dateRange: '',
            sortBy: 'createdAt',
            sortOrder: 'desc'
        };
        
        // Reset form elements
        if (this.searchInput) this.searchInput.value = '';
        if (this.levelFilter) this.levelFilter.value = '';
        if (this.parentCategoryFilter) this.parentCategoryFilter.value = '';
        if (this.featuredFilter) this.featuredFilter.value = '';
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
     * Category action methods
     */
    async viewCategory(categoryId) {
        // Implementation for viewing category details
        this.showNotification('Category details view - To be implemented', 'info');
    }

    async editCategory(categoryId) {
        // Implementation for editing category
        this.showNotification('Category edit modal - To be implemented', 'info');
    }

    async viewAnalytics(categoryId) {
        try {
            const response = await this.makeRequest(this.endpoints.analytics.replace('{id}', categoryId));
            if (response.success) {
                this.showNotification('Category analytics loaded successfully', 'success');
                // Implementation for showing analytics modal/page
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.showError('Failed to load category analytics');
        }
    }

    async toggleCategoryStatus(categoryId) {
        try {
            const category = this.categories.find(c => c._id === categoryId);
            if (!category) return;

            const action = category.settings?.isActive ? 'deactivate' : 'activate';
            
            const response = await this.makeRequest(`${this.endpoints.bulk}`, {
                method: 'POST',
                body: JSON.stringify({
                    categoryIds: [categoryId],
                    action: action,
                    reason: `Category ${action}d by admin`
                })
            });

            if (response.success) {
                this.showNotification(`Category ${action}d successfully`, 'success');
                await this.loadCategories();
                await this.loadStatistics();
            }
        } catch (error) {
            console.error('Error toggling category status:', error);
            this.showError('Failed to update category status');
        }
    }

    async toggleFeatureStatus(categoryId) {
        try {
            const category = this.categories.find(c => c._id === categoryId);
            if (!category) return;

            const action = category.settings?.isFeatured ? 'unfeature' : 'feature';
            
            const response = await this.makeRequest(`${this.endpoints.bulk}`, {
                method: 'POST',
                body: JSON.stringify({
                    categoryIds: [categoryId],
                    action: action,
                    reason: `Category ${action}d by admin`
                })
            });

            if (response.success) {
                this.showNotification(`Category ${action}d successfully`, 'success');
                await this.loadCategories();
                await this.loadStatistics();
            }
        } catch (error) {
            console.error('Error toggling feature status:', error);
            this.showError('Failed to update feature status');
        }
    }

    async duplicateCategory(categoryId) {
        this.showNotification('Category duplication - To be implemented', 'info');
    }

    async archiveCategory(categoryId) {
        if (!confirm('Are you sure you want to archive this category?')) return;

        try {
            const response = await this.makeRequest(`${this.endpoints.bulk}`, {
                method: 'POST',
                body: JSON.stringify({
                    categoryIds: [categoryId],
                    action: 'archive',
                    reason: 'Category archived by admin'
                })
            });

            if (response.success) {
                this.showNotification('Category archived successfully', 'success');
                await this.loadCategories();
                await this.loadStatistics();
            }
        } catch (error) {
            console.error('Error archiving category:', error);
            this.showError('Failed to archive category');
        }
    }

    /**
     * Bulk operations
     */
    async bulkAction(action) {
        const selectedIds = Array.from(this.selectedCategories);
        if (selectedIds.length === 0) {
            this.showError('Please select categories first');
            return;
        }

        const confirmMessage = `Are you sure you want to ${action} ${selectedIds.length} selected categories?`;
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
                this.showNotification(`${selectedIds.length} categories ${action}d successfully`, 'success');
                this.selectedCategories.clear();
                this.updateBulkActionsVisibility();
                await this.loadCategories();
                await this.loadStatistics();
            }
        } catch (error) {
            console.error(`Error in bulk ${action}:`, error);
            this.showError(`Failed to ${action} selected categories`);
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
            this.showNotification('Export started successfully', 'success');
        } catch (error) {
            console.error('Error in bulk export:', error);
            this.showError('Failed to export categories');
        }
    }

    /**
     * Modal operations
     */
    async showCreateModal() {
        
        try {
            // Load parent categories for dropdown
            await this.loadParentCategoriesForModal();
            
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
            }, 10);
            
        } catch (error) {
            console.error('❌ Error opening create modal:', error);
            this.showError('Failed to open create category modal');
        }
    }

    /**
     * Load parent categories for modal dropdown
     */
    async loadParentCategoriesForModal() {
        try {
            const response = await fetch(`${this.endpoints.categories}?status=active&level=lt:3&pageSize=100`);
            if (!response.ok) throw new Error('Failed to load parent categories');
            
            const result = await response.json();
            this.parentCategories = result.data?.categories || [];
        } catch (error) {
            console.error('Error loading parent categories:', error);
            this.parentCategories = [];
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
     */
    createCategoryModal() {
        const modal = document.createElement('div');
        modal.className = 'professional-modal-overlay';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'modalTitle');
        modal.setAttribute('aria-modal', 'true');
        
        modal.innerHTML = this.generateProfessionalModalHTML();
        return modal;
    }

    /**
     * Generate comprehensive professional modal HTML
     */
    generateProfessionalModalHTML() {
        return `
            <div class="professional-modal" data-modal-type="category-create">
                ${this.generateModalHeader()}
                
                <div class="modal-progress-bar">
                    <div class="progress-track">
                        <div class="progress-fill" data-progress="0"></div>
                    </div>
                    <div class="progress-steps">
                        <div class="step active" data-step="1">Basic</div>
                        <div class="step" data-step="2">Design</div>
                        <div class="step" data-step="3">Settings</div>
                        <div class="step" data-step="4">Review</div>
                    </div>
                </div>

                <form class="professional-form" id="createCategoryForm" novalidate>
                    <div class="modal-content-container">
                        ${this.generateFormSteps()}
                    </div>
                    
                    ${this.generateModalFooter()}
                </form>
                
                <!-- Professional Loading Overlay -->
                <div class="modal-loading-overlay" data-loading="false">
                    <div class="loading-spinner">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                    </div>
                    <div class="loading-text">Processing your request...</div>
                </div>
            </div>
        `;
    }

    /**
     * Generate professional modal header
     */
    generateModalHeader() {
        return `
            <div class="modal-header professional-header">
                <div class="header-content">
                    <div class="header-icon-wrapper">
                        <div class="header-icon">
                            <i class="las la-plus-circle"></i>
                        </div>
                        <div class="icon-pulse"></div>
                    </div>
                    <div class="header-text">
                        <h2 class="modal-title" id="modalTitle">Create New Category</h2>
                        <p class="modal-subtitle">Build a comprehensive category structure for your marketplace</p>
                    </div>
                </div>
                <div class="header-actions">
                    <button type="button" class="modal-minimize" title="Minimize" aria-label="Minimize modal">
                        <i class="las la-minus"></i>
                    </button>
                    <button type="button" class="modal-close" title="Close" aria-label="Close modal">
                        <i class="las la-times"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Generate multi-step form with professional UX
     */
    generateFormSteps() {
        return `
            <!-- Step 1: Basic Information -->
            <div class="form-step active" data-step="1">
                <div class="step-header">
                    <h3 class="step-title">
                        <i class="las la-info-circle"></i>
                        Basic Information
                    </h3>
                    <p class="step-description">Essential details about your category</p>
                </div>
                
                <div class="professional-form-grid">
                    <div class="form-group-enhanced required">
                        <label for="categoryName" class="professional-label">
                            <span class="label-text">Category Name</span>
                            <span class="label-required">*</span>
                        </label>
                        <div class="input-wrapper">
                            <input type="text" id="categoryName" name="name" class="professional-input" 
                                   placeholder="e.g., Electronics, Food & Beverages" 
                                   autocomplete="off" spellcheck="true" required
                                   data-validation="required|min:2|max:100">
                            <div class="input-icon">
                                <i class="las la-tag"></i>
                            </div>
                            <div class="input-feedback"></div>
                        </div>
                        <div class="field-help">Choose a clear, descriptive name that represents your category</div>
                    </div>
                    
                    <div class="form-group-enhanced">
                        <label for="categorySlug" class="professional-label">
                            <span class="label-text">URL Slug</span>
                            <span class="label-status">Auto-generated</span>
                        </label>
                        <div class="input-wrapper">
                            <input type="text" id="categorySlug" name="slug" class="professional-input" 
                                   placeholder="auto-generated-from-name" readonly tabindex="-1">
                            <div class="input-icon">
                                <i class="las la-link"></i>
                            </div>
                        </div>
                        <div class="field-help">URL-friendly version automatically created from name</div>
                    </div>
                    
                    <div class="form-group-enhanced required full-width">
                        <label for="categoryDescription" class="professional-label">
                            <span class="label-text">Description</span>
                            <span class="label-required">*</span>
                            <span class="character-counter" data-target="categoryDescription">0/1000</span>
                        </label>
                        <div class="textarea-wrapper">
                            <textarea id="categoryDescription" name="description" class="professional-textarea" 
                                      placeholder="Provide a comprehensive description that helps users understand what products belong in this category..."
                                      rows="4" maxlength="1000" required
                                      data-validation="required|min:10|max:1000"></textarea>
                            <div class="textarea-tools">
                                <button type="button" class="text-tool" title="Bold" data-tool="bold">
                                    <i class="las la-bold"></i>
                                </button>
                                <button type="button" class="text-tool" title="Italic" data-tool="italic">
                                    <i class="las la-italic"></i>
                                </button>
                                <button type="button" class="text-tool" title="Clear" data-tool="clear">
                                    <i class="las la-eraser"></i>
                                </button>
                            </div>
                            <div class="input-feedback"></div>
                        </div>
                        <div class="field-help">Detailed description for SEO and user understanding</div>
                    </div>
                    
                    <div class="form-group-enhanced full-width">
                        <label for="categoryShortDescription" class="professional-label">
                            <span class="label-text">Short Description</span>
                            <span class="character-counter" data-target="categoryShortDescription">0/200</span>
                        </label>
                        <div class="textarea-wrapper">
                            <textarea id="categoryShortDescription" name="shortDescription" class="professional-textarea" 
                                      placeholder="Brief summary for category listings and previews..." 
                                      rows="2" maxlength="200"
                                      data-validation="max:200"></textarea>
                            <div class="input-feedback"></div>
                        </div>
                        <div class="field-help">Concise summary displayed in category listings</div>
                    </div>
                </div>
            </div>
            
            <!-- Step 2: Design & Hierarchy -->
            <div class="form-step" data-step="2">
                <div class="step-header">
                    <h3 class="step-title">
                        <i class="las la-palette"></i>
                        Design & Structure
                    </h3>
                    <p class="step-description">Visual design and category hierarchy</p>
                </div>
                
                <div class="professional-form-grid">
                    <div class="form-group-enhanced">
                        <label class="professional-label">
                            <span class="label-text">Parent Category</span>
                        </label>
                        <div class="select-wrapper">
                            <select id="parentCategory" name="parentCategory" class="professional-select">
                                <option value="">🏠 Root Category (Top Level)</option>
                                ${this.generateParentCategoryOptions()}
                            </select>
                            <div class="select-icon">
                                <i class="las la-chevron-down"></i>
                            </div>
                        </div>
                        <div class="field-help">Choose parent category or leave as root level</div>
                    </div>
                    
                    <div class="form-group-enhanced">
                        <label for="sortOrder" class="professional-label">
                            <span class="label-text">Sort Order</span>
                        </label>
                        <div class="input-wrapper">
                            <input type="number" id="sortOrder" name="sortOrder" class="professional-input" 
                                   min="0" max="999" value="0" placeholder="0"
                                   data-validation="numeric|min:0|max:999">
                            <div class="input-icon">
                                <i class="las la-sort-numeric-up"></i>
                            </div>
                            <div class="input-feedback"></div>
                        </div>
                        <div class="field-help">Lower numbers appear first in listings (0-999)</div>
                    </div>
                    
                    <div class="form-group-enhanced">
                        <label class="professional-label">
                            <span class="label-text">Category Icon</span>
                        </label>
                        <div class="icon-selector-professional">
                            <div class="icon-input-wrapper">
                                <input type="text" id="categoryIcon" name="icon" class="professional-input" 
                                       value="las la-folder" placeholder="las la-folder"
                                       data-validation="icon">
                                <div class="input-icon">
                                    <i class="las la-icons"></i>
                                </div>
                            </div>
                            <div class="icon-preview-professional">
                                <div class="icon-display" id="iconPreview">
                                    <i class="las la-folder"></i>
                                </div>
                            </div>
                            <button type="button" class="icon-browser-btn" data-action="browse-icons">
                                <i class="las la-search"></i>
                                Browse Icons
                            </button>
                        </div>
                        <div class="field-help">Line Awesome icon class for visual identification</div>
                    </div>
                    
                    <div class="form-group-enhanced">
                        <label class="professional-label">
                            <span class="label-text">Brand Color</span>
                        </label>
                        <div class="color-selector-professional">
                            <div class="color-input-group">
                                <input type="color" id="categoryColor" name="color" class="professional-color-picker" value="#3B82F6">
                                <input type="text" id="categoryColorText" class="professional-input color-text" value="#3B82F6">
                            </div>
                            <div class="color-presets">
                                <button type="button" class="color-preset" data-color="#3B82F6" style="background:#3B82F6" title="Blue"></button>
                                <button type="button" class="color-preset" data-color="#10B981" style="background:#10B981" title="Green"></button>
                                <button type="button" class="color-preset" data-color="#F59E0B" style="background:#F59E0B" title="Orange"></button>
                                <button type="button" class="color-preset" data-color="#EF4444" style="background:#EF4444" title="Red"></button>
                                <button type="button" class="color-preset" data-color="#8B5CF6" style="background:#8B5CF6" title="Purple"></button>
                                <button type="button" class="color-preset" data-color="#06B6D4" style="background:#06B6D4" title="Cyan"></button>
                            </div>
                        </div>
                        <div class="field-help">Primary color for category identification and theming</div>
                    </div>
                </div>
                
                <!-- Live Preview -->
                <div class="category-preview-panel">
                    <h4 class="preview-title">
                        <i class="las la-eye"></i>
                        Live Preview
                    </h4>
                    <div class="category-preview-card" id="categoryPreview">
                        <div class="preview-icon">
                            <i class="las la-folder"></i>
                        </div>
                        <div class="preview-content">
                            <h5 class="preview-name">Category Name</h5>
                            <p class="preview-description">Category description will appear here...</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Step 3: Advanced Settings -->
            <div class="form-step" data-step="3">
                <div class="step-header">
                    <h3 class="step-title">
                        <i class="las la-cogs"></i>
                        Advanced Settings
                    </h3>
                    <p class="step-description">Configure category behavior and permissions</p>
                </div>
                
                <div class="settings-professional-grid">
                    <div class="settings-section">
                        <h4 class="settings-section-title">
                            <i class="las la-toggle-on"></i>
                            Visibility & Status
                        </h4>
                        
                        <div class="professional-toggle-group">
                            <div class="professional-toggle-item">
                                <div class="toggle-wrapper">
                                    <input type="checkbox" id="isActive" name="isActive" class="professional-toggle" checked>
                                    <label for="isActive" class="toggle-label">
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="toggle-content">
                                    <div class="toggle-title">Active Status</div>
                                    <div class="toggle-description">Category is active and functional</div>
                                </div>
                                <div class="toggle-status" data-toggle="isActive">
                                    <span class="status-indicator active"></span>
                                    <span class="status-text">Active</span>
                                </div>
                            </div>
                            
                            <div class="professional-toggle-item">
                                <div class="toggle-wrapper">
                                    <input type="checkbox" id="isVisible" name="isVisible" class="professional-toggle" checked>
                                    <label for="isVisible" class="toggle-label">
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="toggle-content">
                                    <div class="toggle-title">Public Visibility</div>
                                    <div class="toggle-description">Show in public category listings</div>
                                </div>
                                <div class="toggle-status" data-toggle="isVisible">
                                    <span class="status-indicator active"></span>
                                    <span class="status-text">Visible</span>
                                </div>
                            </div>
                            
                            <div class="professional-toggle-item">
                                <div class="toggle-wrapper">
                                    <input type="checkbox" id="isFeatured" name="isFeatured" class="professional-toggle">
                                    <label for="isFeatured" class="toggle-label">
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="toggle-content">
                                    <div class="toggle-title">Featured Category</div>
                                    <div class="toggle-description">Highlight in featured sections</div>
                                </div>
                                <div class="toggle-status" data-toggle="isFeatured">
                                    <span class="status-indicator inactive"></span>
                                    <span class="status-text">Normal</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h4 class="settings-section-title">
                            <i class="las la-shield-alt"></i>
                            Business Rules
                        </h4>
                        
                        <div class="business-rules-grid">
                            <div class="form-group-enhanced">
                                <label class="professional-label">
                                    <span class="label-text">Allowed Company Types</span>
                                </label>
                                <div class="multi-select-wrapper">
                                    <div class="multi-select-tags" id="companyTypeTags"></div>
                                    <select id="allowedCompanyTypes" name="allowedCompanyTypes" class="professional-multi-select" multiple>
                                        <option value="manufacturer" selected>🏭 Manufacturer</option>
                                        <option value="distributor" selected>📦 Distributor</option>
                                        <option value="wholesaler">🏪 Wholesaler</option>
                                        <option value="retailer">🛍️ Retailer</option>
                                        <option value="trading_company">🤝 Trading Company</option>
                                    </select>
                                </div>
                                <div class="field-help">Select which company types can list products in this category</div>
                            </div>
                            
                            <div class="form-group-enhanced">
                                <label for="minimumOrderQuantity" class="professional-label">
                                    <span class="label-text">Minimum Order Quantity</span>
                                </label>
                                <div class="input-wrapper">
                                    <input type="number" id="minimumOrderQuantity" name="minimumOrderQuantity" 
                                           class="professional-input" min="1" value="1"
                                           data-validation="numeric|min:1">
                                    <div class="input-icon">
                                        <i class="las la-calculator"></i>
                                    </div>
                                    <div class="input-suffix">units</div>
                                    <div class="input-feedback"></div>
                                </div>
                                <div class="field-help">Default minimum order quantity for products</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Step 4: Review & Confirmation -->
            <div class="form-step" data-step="4">
                <div class="step-header">
                    <h3 class="step-title">
                        <i class="las la-check-circle"></i>
                        Review & Create
                    </h3>
                    <p class="step-description">Review your category details before creating</p>
                </div>
                
                <div class="review-panel">
                    <div class="review-sections">
                        <div class="review-section">
                            <h4 class="review-section-title">Basic Information</h4>
                            <div class="review-items" id="reviewBasic">
                                <!-- Populated by JavaScript -->
                            </div>
                        </div>
                        
                        <div class="review-section">
                            <h4 class="review-section-title">Design & Structure</h4>
                            <div class="review-items" id="reviewDesign">
                                <!-- Populated by JavaScript -->
                            </div>
                        </div>
                        
                        <div class="review-section">
                            <h4 class="review-section-title">Settings & Rules</h4>
                            <div class="review-items" id="reviewSettings">
                                <!-- Populated by JavaScript -->
                            </div>
                        </div>
                    </div>
                    
                    <div class="final-preview">
                        <h4 class="preview-title">Final Category Preview</h4>
                        <div class="final-category-card" id="finalPreview">
                            <!-- Populated by JavaScript -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate professional modal footer
     */
    generateModalFooter() {
        return `
            <div class="modal-footer professional-footer">
                <div class="footer-left">
                    <button type="button" class="btn-professional btn-secondary modal-close-action">
                        <i class="las la-times"></i>
                        <span>Cancel</span>
                    </button>
                </div>
                
                <div class="footer-center">
                    <div class="step-indicator">
                        <span class="current-step">1</span> of <span class="total-steps">4</span>
                    </div>
                </div>
                
                <div class="footer-right">
                    <button type="button" class="btn-professional btn-outline" id="prevStepBtn" disabled>
                        <i class="las la-chevron-left"></i>
                        <span>Previous</span>
                    </button>
                    
                    <button type="button" class="btn-professional btn-primary" id="nextStepBtn">
                        <span class="btn-text">Next</span>
                        <i class="las la-chevron-right"></i>
                    </button>
                    
                    <button type="submit" class="btn-professional btn-success" id="createCategoryBtn" style="display: none;">
                        <i class="las la-plus"></i>
                        <span class="btn-text">Create Category</span>
                        <span class="btn-loading">
                            <div class="btn-spinner"></div>
                            <span>Creating...</span>
                        </span>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Generate parent category options with professional formatting
     */
    generateParentCategoryOptions() {
        if (!this.parentCategories || this.parentCategories.length === 0) {
            return '<option value="" disabled style="color: #999; font-style: italic;">📂 No parent categories available</option>';
        }
        
        return this.parentCategories.map(category => {
            const level = category.level || 0;
            const indent = '  '.repeat(level);
            const levelIcon = this.getCategoryLevelIcon(level);
            const statusIcon = category.status === 'active' ? '✅' : '⚠️';
            
            return `<option value="${category._id}" data-level="${level}">
                ${indent}${levelIcon} ${category.name} ${statusIcon}
            </option>`;
        }).join('');
    }

    /**
     * Get appropriate icon for category level
     */
    getCategoryLevelIcon(level) {
        const icons = {
            0: '🏠', // Root
            1: '📁', // Level 1
            2: '📂', // Level 2
            3: '🗂️', // Level 3
            4: '🏷️', // Level 4
            5: '🔖'  // Level 5
        };
        return icons[level] || '📄';
    }

    /**
     * Generate multi-language form sections
     */
    generateLanguageForms() {
        const languages = [
            { code: 'uz', name: "O'zbek" },
            { code: 'en', name: 'English' },
            { code: 'ru', name: 'Русский' },
            { code: 'tr', name: 'Türkçe' },
            { code: 'fa', name: 'فارسی' },
            { code: 'zh', name: '中文' }
        ];
        
        return languages.map((lang, index) => `
            <div class="lang-content ${index === 0 ? 'active' : ''}" data-lang="${lang.code}">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="name_${lang.code}" class="form-label">Name (${lang.name})</label>
                        <input type="text" id="name_${lang.code}" name="translations.${lang.code}.name" 
                               class="form-control" placeholder="Category name in ${lang.name}">
                    </div>
                    
                    <div class="form-group full-width">
                        <label for="description_${lang.code}" class="form-label">Description (${lang.name})</label>
                        <textarea id="description_${lang.code}" name="translations.${lang.code}.description" 
                                  class="form-control" rows="3" placeholder="Description in ${lang.name}"></textarea>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Initialize modal features and event listeners
     */
    initializeModalFeatures(modal) {
        
        // Auto-generate slug from name
        this.setupSlugGeneration(modal);
        
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
        
    }

    /**
     * Setup automatic slug generation
     */
    setupSlugGeneration(modal) {
        const nameInput = modal.querySelector('#categoryName');
        const slugInput = modal.querySelector('#categorySlug');
        
        if (nameInput && slugInput) {
            nameInput.addEventListener('input', (e) => {
                const slug = this.generateSlug(e.target.value);
                slugInput.value = slug;
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
        const colorText = modal.querySelector('.color-text');
        
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
        const form = modal.querySelector('#createCategoryForm');
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
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';
        
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = `${this.getFieldLabel(field)} is required`;
        } else if (field.type === 'email' && value && !this.isValidEmail(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        } else if (field.name === 'slug' && value && !this.isValidSlug(value)) {
            isValid = false;
            errorMessage = 'Slug can only contain lowercase letters, numbers, and hyphens';
        } else if (field.maxLength && value.length > field.maxLength) {
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
        const form = modal.querySelector('#createCategoryForm');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleCategoryCreation(form, modal);
        });
    }

    /**
     * Handle category creation
     */
    async handleCategoryCreation(form, modal) {
        
        try {
            // Validate form
            if (!this.validateForm(form)) {
                this.showError('Please fix the validation errors before submitting');
                return;
            }
            
            // Show loading state
            this.setModalLoadingState(true);
            
            // Collect form data
            const formData = this.collectFormData(form);
            
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
            
            if (result.success) {
                // Success - close modal and refresh table
                modal.remove();
                this.showNotification('Category created successfully!', 'success');
                await this.refreshData();
                
                // Update theme for any remaining modals
                this.updateModalTheme();
                
            } else {
                // Handle validation errors
                this.handleServerErrors(result, form);
            }
            
        } catch (error) {
            console.error('❌ Error creating category:', error);
            this.showError('Failed to create category. Please try again.');
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
        const data = {};
        
        // Basic fields
        for (const [key, value] of formData.entries()) {
            if (key.includes('.')) {
                // Handle nested fields (translations)
                this.setNestedValue(data, key, value);
            } else if (key === 'allowedCompanyTypes') {
                // Handle multiple select
                if (!data[key]) data[key] = [];
                data[key].push(value);
            } else {
                data[key] = value;
            }
        }
        
        // Handle checkboxes
        const checkboxes = form.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            const value = checkbox.checked;
            if (checkbox.name.includes('.')) {
                this.setNestedValue(data, checkbox.name, value);
            } else {
                data[checkbox.name] = value;
            }
        });
        
        // Structure data according to schema
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
        return {
            // Basic Information
            name: data.name,
            slug: data.slug,
            description: data.description,
            shortDescription: data.shortDescription || '',
            
            // Hierarchy
            parentCategory: data.parentCategory || null,
            
            // Visual
            icon: data.icon || 'las la-folder',
            color: data.color || '#3B82F6',
            
            // Multi-language
            translations: data.translations || {},
            
            // SEO
            seo: {
                metaTitle: data.metaTitle || '',
                metaDescription: data.metaDescription || '',
                metaKeywords: data.metaKeywords ? data.metaKeywords.split(',').map(k => k.trim()) : []
            },
            
            // Settings
            settings: {
                isActive: data.isActive || false,
                isVisible: data.isVisible || false,
                isFeatured: data.isFeatured || false,
                allowProducts: data.allowProducts || false,
                sortOrder: parseInt(data.sortOrder) || 0
            },
            
            // Business Rules
            businessRules: {
                allowedCompanyTypes: data.allowedCompanyTypes || ['manufacturer', 'distributor'],
                minimumOrderQuantity: parseInt(data.minimumOrderQuantity) || 1
            }
        };
    }

    /**
     * Set modal loading state
     */
    setModalLoadingState(loading) {
        const btn = document.querySelector('#createCategoryBtn');
        const btnText = btn?.querySelector('.btn-text');
        const btnLoading = btn?.querySelector('.btn-loading');
        
        if (btn && btnText && btnLoading) {
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
            this.showError(result.message || 'Validation failed');
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
            this.showNotification('Data refreshed successfully', 'success');
        } catch (error) {
            console.error('Error refreshing data:', error);
            this.showError('Failed to refresh data');
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
            this.showNotification('Export started successfully', 'success');
        } catch (error) {
            console.error('Error exporting categories:', error);
            this.showError('Failed to export categories');
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
        // Create or update notification
        let notification = document.getElementById('categories-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'categories-notification';
            notification.className = 'toast-notification';
            document.body.appendChild(notification);
        }

        notification.className = `toast-notification toast-${type} show`;
        notification.innerHTML = `
            <div class="toast-content">
                <i class="las la-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.classList.remove('show')">
                <i class="las la-times"></i>
            </button>
        `;

        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * API helper methods
     */
    async makeRequest(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
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
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
        return `${Math.ceil(diffDays / 365)} years ago`;
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
        
        this.activeDropdown = null;
        this.dropdownState = new Map();
        
        // Remove any existing event listeners to avoid duplicates
        this.removeDropdownListeners();
        
        // Setup professional event delegation
        this.setupDropdownDelegation();
        
        // Setup outside click handler
        this.setupOutsideClickHandler();
        
    }

    /**
     * Setup dropdown event delegation with senior engineer approach
     */
    setupDropdownDelegation() {
        // Professional event delegation for dropdown triggers
        document.addEventListener('click', (e) => {
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
        });
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
     */
    closeDropdown(categoryId) {
        try {
            const dropdownMenu = document.querySelector(`[data-dropdown-menu="${categoryId}"]`);
            const trigger = document.querySelector(`[data-dropdown-trigger="${categoryId}"]`);
            
            if (dropdownMenu) {
                dropdownMenu.classList.remove('show', 'dropdown-menu-animated');
                dropdownMenu.setAttribute('aria-hidden', 'true');
            }
            
            if (trigger) {
                trigger.classList.remove('dropdown-active');
                trigger.setAttribute('aria-expanded', 'false');
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
     */
    closeAllDropdowns() {
        try {
            // Close all category dropdowns
            document.querySelectorAll('.category-dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show', 'dropdown-menu-animated');
                menu.setAttribute('aria-hidden', 'true');
            });
            
            // Clean up all triggers
            document.querySelectorAll('[data-dropdown-trigger]').forEach(trigger => {
                trigger.classList.remove('dropdown-active');
                trigger.setAttribute('aria-expanded', 'false');
            });
            
            // Reset state
            this.activeDropdown = null;
            this.dropdownState.clear();
            
        } catch (error) {
            console.error('❌ Close all dropdowns error:', error);
        }
    }

    /**
     * Professional dropdown positioning with viewport detection
     */
    positionDropdown(dropdownMenu, trigger) {
        try {
            const rect = trigger.getBoundingClientRect();
            const menuRect = dropdownMenu.getBoundingClientRect();
            const viewport = {
                width: window.innerWidth,
                height: window.innerHeight
            };
            
            // Reset positioning classes
            dropdownMenu.classList.remove('dropdown-up', 'dropdown-left', 'dropdown-right');
            
            // Check if dropdown fits below trigger
            const fitsBelow = rect.bottom + menuRect.height <= viewport.height - 20;
            const fitsRight = rect.right + menuRect.width <= viewport.width - 20;
            
            if (!fitsBelow) {
                dropdownMenu.classList.add('dropdown-up');
            }
            
            if (!fitsRight) {
                dropdownMenu.classList.add('dropdown-right');
            }
            
            
        } catch (error) {
            console.error('❌ Dropdown positioning error:', error);
        }
    }

    /**
     * Setup outside click handler for professional UX
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
            
            switch (action) {
                case 'toggle-status':
                    this.toggleCategoryStatus(categoryId);
                    break;
                case 'toggle-feature':
                    this.toggleFeatureStatus(categoryId);
                    break;
                case 'duplicate':
                    this.duplicateCategory(categoryId);
                    break;
                case 'archive':
                    this.archiveCategory(categoryId);
                    break;
                default:
                    console.warn(`⚠️ Unknown dropdown action: ${action}`);
                    this.showError(`Unknown action: ${action}`);
            }
            
        } catch (error) {
            console.error(`❌ Error executing action ${action}:`, error);
            this.showError(`Failed to execute ${action}`);
        }
    }

    /**
     * Remove existing dropdown listeners to prevent duplicates
     */
    removeDropdownListeners() {
        // Clean up any existing listeners
        const existingTriggers = document.querySelectorAll('[data-dropdown-trigger]');
        existingTriggers.forEach(trigger => {
            // Clone node to remove all event listeners
            const newTrigger = trigger.cloneNode(true);
            trigger.parentNode.replaceChild(newTrigger, trigger);
        });
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (typeof CategoriesManagement !== 'undefined') {
        window.categoriesManager = new CategoriesManagement();
        window.categoriesManager.init();
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CategoriesManagement;
}