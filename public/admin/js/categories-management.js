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
        
        console.log('✅ CategoriesManagement initialized successfully');
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
            console.log('🚀 Initializing Categories Management...');
            
            await this.setupEventListeners();
            await this.loadParentCategories();
            await this.loadInitialData();
            this.setupThemeListener(); // Add theme listener setup
            
            console.log('✅ Categories Management initialized successfully');
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
                        <div class="dropdown">
                            <button class="btn-action btn-more dropdown-toggle" data-bs-toggle="dropdown" title="More Actions">
                                <i class="las la-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#" onclick="window.categoriesManager.toggleCategoryStatus('${category._id}')">
                                    <i class="las ${category.settings?.isActive ? 'la-pause' : 'la-play'}"></i>
                                    ${category.settings?.isActive ? 'Deactivate' : 'Activate'}
                                </a></li>
                                <li><a class="dropdown-item" href="#" onclick="window.categoriesManager.toggleFeatureStatus('${category._id}')">
                                    <i class="las ${category.settings?.isFeatured ? 'la-star-o' : 'la-star'}"></i>
                                    ${category.settings?.isFeatured ? 'Unfeature' : 'Feature'}
                                </a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item" href="#" onclick="window.categoriesManager.duplicateCategory('${category._id}')">
                                    <i class="las la-copy"></i>
                                    Duplicate
                                </a></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="window.categoriesManager.archiveCategory('${category._id}')">
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
        console.log('Viewing category:', categoryId);
        // Implementation for viewing category details
        this.showNotification('Category details view - To be implemented', 'info');
    }

    async editCategory(categoryId) {
        console.log('Editing category:', categoryId);
        // Implementation for editing category
        this.showNotification('Category edit modal - To be implemented', 'info');
    }

    async viewAnalytics(categoryId) {
        try {
            const response = await this.makeRequest(this.endpoints.analytics.replace('{id}', categoryId));
            if (response.success) {
                console.log('Category analytics:', response.data);
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
        console.log('Duplicating category:', categoryId);
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
        console.log('🎨 Opening create category modal...');
        
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
            
            console.log('✅ Create category modal opened successfully');
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
            console.log(`📦 Loaded ${this.parentCategories.length} parent categories for modal`);
        } catch (error) {
            console.error('Error loading parent categories:', error);
            this.parentCategories = [];
        }
    }

    /**
     * Create comprehensive category modal
     */
    createCategoryModal() {
        const modal = document.createElement('div');
        modal.className = 'category-modal-overlay';
        modal.innerHTML = `
            <div class="category-modal">
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="las la-plus-circle text-primary"></i>
                        Create New Category
                    </h2>
                    <button type="button" class="modal-close-btn" onclick="this.closest('.category-modal-overlay').remove()">
                        <i class="las la-times"></i>
                    </button>
                </div>
                
                <form class="category-form" id="createCategoryForm">
                    <div class="modal-body">
                        
                        <!-- Basic Information Section -->
                        <div class="form-section">
                            <div class="section-header">
                                <h3 class="section-title">
                                    <i class="las la-info-circle"></i>
                                    Basic Information
                                </h3>
                            </div>
                            <div class="form-grid">
                                <div class="form-group required">
                                    <label for="categoryName" class="form-label">Category Name</label>
                                    <input type="text" id="categoryName" name="name" class="form-control" 
                                           placeholder="e.g., Electronics, Food & Beverages" required>
                                    <div class="field-help">Primary display name for the category</div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="categorySlug" class="form-label">URL Slug</label>
                                    <input type="text" id="categorySlug" name="slug" class="form-control" 
                                           placeholder="auto-generated-from-name" readonly>
                                    <div class="field-help">Automatically generated from name</div>
                                </div>
                                
                                <div class="form-group required full-width">
                                    <label for="categoryDescription" class="form-label">Description</label>
                                    <textarea id="categoryDescription" name="description" class="form-control" rows="3" 
                                              placeholder="Detailed description of the category and its purpose" required></textarea>
                                    <div class="field-help">Comprehensive description for SEO and user understanding</div>
                                </div>
                                
                                <div class="form-group full-width">
                                    <label for="categoryShortDescription" class="form-label">Short Description</label>
                                    <textarea id="categoryShortDescription" name="shortDescription" class="form-control" rows="2" 
                                              placeholder="Brief summary for listings and previews"></textarea>
                                    <div class="field-help">Brief summary displayed in category listings</div>
                                </div>
                            </div>
                        </div>

                        <!-- Hierarchy Section -->
                        <div class="form-section">
                            <div class="section-header">
                                <h3 class="section-title">
                                    <i class="las la-sitemap"></i>
                                    Category Hierarchy
                                </h3>
                            </div>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="parentCategory" class="form-label">Parent Category</label>
                                    <select id="parentCategory" name="parentCategory" class="form-control">
                                        <option value="">-- Root Category --</option>
                                        ${this.generateParentCategoryOptions()}
                                    </select>
                                    <div class="field-help">Leave empty to create a top-level category</div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="sortOrder" class="form-label">Sort Order</label>
                                    <input type="number" id="sortOrder" name="sortOrder" class="form-control" 
                                           min="0" max="999" value="0" placeholder="0">
                                    <div class="field-help">Lower numbers appear first in listings</div>
                                </div>
                            </div>
                        </div>

                        <!-- Visual Design Section -->
                        <div class="form-section">
                            <div class="section-header">
                                <h3 class="section-title">
                                    <i class="las la-palette"></i>
                                    Visual Design
                                </h3>
                            </div>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="categoryIcon" class="form-label">Icon</label>
                                    <div class="icon-selector">
                                        <input type="text" id="categoryIcon" name="icon" class="form-control" 
                                               value="las la-folder" placeholder="las la-folder">
                                        <div class="icon-preview">
                                            <i class="las la-folder" id="iconPreview"></i>
                                        </div>
                                    </div>
                                    <div class="field-help">Line Awesome icon class (e.g., las la-folder)</div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="categoryColor" class="form-label">Brand Color</label>
                                    <div class="color-input-wrapper">
                                        <input type="color" id="categoryColor" name="color" class="form-control color-picker" value="#3B82F6">
                                        <input type="text" class="color-text" value="#3B82F6" readonly>
                                    </div>
                                    <div class="field-help">Primary color for category identification</div>
                                </div>
                            </div>
                        </div>

                        <!-- Multi-language Support -->
                        <div class="form-section">
                            <div class="section-header">
                                <h3 class="section-title">
                                    <i class="las la-globe"></i>
                                    Multi-language Support
                                </h3>
                                <div class="language-tabs">
                                    <button type="button" class="lang-tab active" data-lang="uz">O'zbek</button>
                                    <button type="button" class="lang-tab" data-lang="en">English</button>
                                    <button type="button" class="lang-tab" data-lang="ru">Русский</button>
                                    <button type="button" class="lang-tab" data-lang="tr">Türkçe</button>
                                    <button type="button" class="lang-tab" data-lang="fa">فارسی</button>
                                    <button type="button" class="lang-tab" data-lang="zh">中文</button>
                                </div>
                            </div>
                            
                            ${this.generateLanguageForms()}
                        </div>

                        <!-- SEO Optimization -->
                        <div class="form-section">
                            <div class="section-header">
                                <h3 class="section-title">
                                    <i class="las la-search"></i>
                                    SEO Optimization
                                </h3>
                            </div>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="metaTitle" class="form-label">Meta Title</label>
                                    <input type="text" id="metaTitle" name="metaTitle" class="form-control" 
                                           maxlength="60" placeholder="SEO-optimized title">
                                    <div class="field-help">Recommended: 50-60 characters</div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="metaDescription" class="form-label">Meta Description</label>
                                    <textarea id="metaDescription" name="metaDescription" class="form-control" rows="2" 
                                              maxlength="160" placeholder="SEO-optimized description"></textarea>
                                    <div class="field-help">Recommended: 150-160 characters</div>
                                </div>
                                
                                <div class="form-group full-width">
                                    <label for="metaKeywords" class="form-label">Meta Keywords</label>
                                    <input type="text" id="metaKeywords" name="metaKeywords" class="form-control" 
                                           placeholder="keyword1, keyword2, keyword3">
                                    <div class="field-help">Comma-separated keywords for search optimization</div>
                                </div>
                            </div>
                        </div>

                        <!-- Category Settings -->
                        <div class="form-section">
                            <div class="section-header">
                                <h3 class="section-title">
                                    <i class="las la-cogs"></i>
                                    Category Settings 
                                </h3>
                            </div>
                            <div class="settings-grid">
                                <div class="setting-item">
                                    <label class="switch-label">
                                        <input type="checkbox" name="isActive" checked>
                                        <span class="switch-slider"></span>
                                        <span class="switch-text">Active</span>
                                    </label>
                                    <div class="setting-help">Category is active and visible to users</div>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="switch-label">
                                        <input type="checkbox" name="isVisible" checked>
                                        <span class="switch-slider"></span>
                                        <span class="switch-text">Visible</span>
                                    </label>
                                    <div class="setting-help">Show in public category listings</div>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="switch-label">
                                        <input type="checkbox" name="isFeatured">
                                        <span class="switch-slider"></span>
                                        <span class="switch-text">Featured</span>
                                    </label>
                                    <div class="setting-help">Highlight in featured sections</div>
                                </div>
                                
                                <div class="setting-item">
                                    <label class="switch-label">
                                        <input type="checkbox" name="allowProducts" checked>
                                        <span class="switch-slider"></span>
                                        <span class="switch-text">Allow Products</span>
                                    </label>
                                    <div class="setting-help">Allow products to be added to this category</div>
                                </div>
                            </div>
                        </div>

                        <!-- Business Rules -->
                        <div class="form-section">
                            <div class="section-header">
                                <h3 class="section-title">
                                    <i class="las la-briefcase"></i>
                                    Business Rules
                                </h3>
                            </div>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="allowedCompanyTypes" class="form-label">Allowed Company Types</label>
                                    <select id="allowedCompanyTypes" name="allowedCompanyTypes" class="form-control" multiple>
                                        <option value="manufacturer" selected>Manufacturer</option>
                                        <option value="distributor" selected>Distributor</option>
                                        <option value="wholesaler">Wholesaler</option>
                                        <option value="retailer">Retailer</option>
                                    </select>
                                    <div class="field-help">Company types allowed to list products in this category</div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="minimumOrderQuantity" class="form-label">Minimum Order Quantity</label>
                                    <input type="number" id="minimumOrderQuantity" name="minimumOrderQuantity" 
                                           class="form-control" min="1" value="1">
                                    <div class="field-help">Default minimum order quantity for products</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.category-modal-overlay').remove()">
                            <i class="las la-times"></i>
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary" id="createCategoryBtn">
                            <i class="las la-plus"></i>
                            <span class="btn-text">Create Category</span>
                            <span class="btn-loading d-none">
                                <i class="las la-spinner la-spin"></i>
                                Creating...
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        return modal;
    }

    /**
     * Generate parent category options for dropdown
     */
    generateParentCategoryOptions() {
        if (!this.parentCategories || this.parentCategories.length === 0) {
            return '<option value="" disabled>No parent categories available</option>';
        }
        
        return this.parentCategories.map(category => {
            const indent = '—'.repeat(category.level || 0);
            return `<option value="${category._id}">${indent} ${category.name}</option>`;
        }).join('');
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
        console.log('🎯 Initializing modal features...');
        
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
        
        console.log('✅ Modal features initialized successfully');
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
        console.log('🚀 Starting category creation process...');
        
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
            console.log('📋 Collected form data:', formData);
            
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
            console.log('📡 Server response:', result);
            
            if (result.success) {
                // Success - close modal and refresh table
                modal.remove();
                this.showNotification('Category created successfully!', 'success');
                await this.refreshData();
                
                // Update theme for any remaining modals
                this.updateModalTheme();
                
                console.log('✅ Category created successfully:', result.data.category);
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
            console.log('Categories page received theme change:', newTheme);
            this.updateModalTheme();
        });

        // Listen for storage events (theme changes from other tabs)
        window.addEventListener('storage', (event) => {
            if (event.key === 'theme') {
                console.log('Categories page received theme change from storage:', event.newValue);
                this.updateModalTheme();
            }
        });

        // Initial theme setup
        this.updateModalTheme();
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