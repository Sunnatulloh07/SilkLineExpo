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
            this.showError('Kategoriyalar boshqaruvi tizimini ishga tushirishda xatolik');
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
                                    ${category.settings?.isFeatured ? '<span class="badge badge-featured"><i class="las la-star"></i>Taniqli</span>' : ''}
                                    ${category.status === 'active' ? '<span class="badge badge-success">Faol</span>' : 
                                      category.status === 'inactive' ? '<span class="badge badge-warning">Nofaol</span>' : 
                                      category.status === 'draft' ? '<span class="badge badge-secondary">Loyiha</span>' : 
                                      '<span class="badge badge-danger">Arxivlangan</span>'}
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
                                        Ota: ${category.parentCategoryName}
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
                        <button class="btn-action btn-view" onclick="window.categoriesManager.viewCategory('${category._id}')" title="Tafsilotlarni ko'rish">
                            <i class="las la-eye"></i>
                        </button>
                        <button class="btn-action btn-edit" onclick="window.categoriesManager.editCategory('${category._id}')" title="Kategoriyani tahrirlash">
                            <i class="las la-edit"></i>
                        </button>
                        <button class="btn-action btn-analytics" onclick="window.categoriesManager.viewAnalytics('${category._id}')" title="Analitikani ko'rish">
                            <i class="las la-chart-bar"></i>
                        </button>
                        <div class="category-dropdown" data-category-id="${category._id}">
                            <button class="btn-action btn-more" data-dropdown-trigger="${category._id}" title="Ko'proq amallar">
                                <i class="las la-ellipsis-v"></i>
                            </button>
                            <ul class="category-dropdown-menu" data-dropdown-menu="${category._id}">
                                <li><a class="dropdown-item" href="#" data-action="toggle-status" data-category-id="${category._id}">
                                    <i class="las ${category.settings?.isActive ? 'la-pause' : 'la-play'}"></i>
                                    ${category.settings?.isActive ? 'Deaktivlashtirish' : 'Faollashtirish'}
                                </a></li>
                                <li><a class="dropdown-item" href="#" data-action="toggle-feature" data-category-id="${category._id}">
                                    <i class="las ${category.settings?.isFeatured ? 'la-star-o' : 'la-star'}"></i>
                                    ${category.settings?.isFeatured ? 'Taniqli qilmaslik' : 'Taniqli qilish'}
                                </a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item" href="#" data-action="duplicate" data-category-id="${category._id}">
                                    <i class="las la-copy"></i>
                                    Nusxalash
                                </a></li>
                                <li><a class="dropdown-item text-danger" href="#" data-action="archive" data-category-id="${category._id}">
                                    <i class="las la-archive"></i>
                                    Arxivlash
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
                                ${category.settings?.isFeatured ? '<span class="badge badge-featured"><i class="las la-star"></i>Taniqli</span>' : ''}
                            </div>
                        </div>
                    </div>
                    
                    <p class="category-description">${this.escapeHtml(category.shortDescription || category.description || '').substring(0, 80)}${(category.description?.length > 80) ? '...' : ''}</p>
                    
                    <div class="category-stats">
                        <div class="stat-item">
                            <i class="las la-layer-group"></i>
                            <span>Daraja ${category.level}</span>
                        </div>
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
        this.showNotification('Kategoriya tafsilotlari ko\'rinishi - amalga oshirilishi kerak', 'info');
    }

    async editCategory(categoryId) {
        try {
            await this.showEditModal(categoryId);
        } catch (error) {
            console.error('Error opening edit modal:', error);
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
                this.showNotification(`Kategoriya muvaffaqiyatli ${action} qilindi`, 'success');
                await this.loadCategories();
                await this.loadStatistics();
            }
        } catch (error) {
            console.error('Error toggling category status:', error);
            this.showError('Kategoriya holatini yangilashda xatolik');
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
                this.showNotification(`Kategoriya muvaffaqiyatli ${action} qilindi`, 'success');
                await this.loadCategories();
                await this.loadStatistics();
            }
        } catch (error) {
            console.error('Error toggling feature status:', error);
            this.showError('Taniqli holatini yangilashda xatolik');
        }
    }

    async duplicateCategory(categoryId) {
        this.showNotification('Kategoriya nusxalash - amalga oshirilishi kerak', 'info');
    }

    async archiveCategory(categoryId) {
        if (!confirm('Bu kategoriyani arxivlashni xohlaysizmi?')) return;

        try {
            const response = await this.makeRequest(`${this.endpoints.bulk}`, {
                method: 'POST',
                body: JSON.stringify({
                    categoryIds: [categoryId],
                    action: 'archive',
                    reason: 'Kategoriya admin tomonidan arxivlandi'
                })
            });

            if (response.success) {
                this.showNotification('Kategoriya muvaffaqiyatli arxivlandi', 'success');
                await this.loadCategories();
                await this.loadStatistics();
            }
        } catch (error) {
            console.error('Error archiving category:', error);
            this.showError('Kategoriyani arxivlashda xatolik');
        }
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
     * Modal operations
     */
    async showCreateModal() {
        try {
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
            this.showError('Kategoriya yaratish modali ochishda xatolik');
        }
    }

    /**
     * Show edit category modal
     */
    async showEditModal(categoryId) {
        try {
            // Load category data
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
            }, 10);
            
        } catch (error) {
            console.error('❌ Error opening edit modal:', error);
            this.showError('Kategoriya tahrirlash modali ochishda xatolik');
        }
    }

    /**
     * Load category data for editing
     */
    async loadCategoryData(categoryId) {
        try {
            const response = await fetch(`${this.endpoints.categories}/${categoryId}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            return result.data || result;
        } catch (error) {
            console.error('Error loading category data:', error);
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
            
            .toggle-label {
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: pointer;
                width: 100%;
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
            <div class="professional-modal" data-modal-type="${modalType}" data-category-id="${categoryData?.id || ''}">
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
                    <div class="form-group">
                        <label for="categoryName" class="form-label required">
                            Kategoriya nomi
                        </label>
                        <input type="text" id="categoryName" name="name" class="form-input" 
                               placeholder="masalan, Elektronika, Oziq-ovqat va ichimliklar" 
                               value="${categoryData?.name || ''}"
                               required>
                        <div class="field-help">Kategoriyangizni ifodalovchi aniq va tavsiflovchi nom tanlang</div>
                    </div>
                    
                    <div class="form-group">
                        <label for="categorySlug" class="form-label">
                            URL slug
                        </label>
                        <input type="text" id="categorySlug" name="slug" class="form-input" 
                               placeholder="nomdan-avtomatik-yaratiladi" 
                               value="${categoryData?.slug || ''}"
                               readonly>
                        <div class="field-help">URL uchun mos versiya nomdan avtomatik yaratiladi</div>
                    </div>
                    
                    <div class="form-group">
                        <label for="categoryDescription" class="form-label required">
                            Tavsif
                        </label>
                        <textarea id="categoryDescription" name="description" class="form-textarea bg-transparent" 
                                  placeholder="Foydalanuvchilarga ushbu kategoriyaga qaysi mahsulotlar tegishli ekanligini tushunishga yordam beradigan to'liq tavsif kiriting..."
                                  rows="4" required>${categoryData?.description || ''}</textarea>
                        <div class="field-help">SEO va foydalanuvchi tushunishi uchun batafsil tavsif</div>
                    </div>
                    
            
                    
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
                                       ${categoryData?.settings?.isActive !== false ? 'checked' : ''}>
                                <label for="isActive" class="toggle-label">
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-text">
                                        <strong>Faol holat</strong>
                                        <small>Kategoriya faol va ishlaydi</small>
                                    </span>
                                </label>
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
     * Generate parent category options with professional formatting
     */
    generateParentCategoryOptions() {
        if (!this.parentCategories || this.parentCategories.length === 0) {
            return '<option value="" disabled style="color: #999; font-style: italic;">📂 Ota kategoriya mavjud emas</option>';
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

    /**
     * Initialize modal features and event listeners
     */
    initializeModalFeatures(modal) {
        
        // Setup ESC key to close modal
        this.setupModalKeyboardEvents(modal);
        
        // Setup modal close events
        this.setupModalCloseEvents(modal);
        
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
            errorMessage = 'To\'g\'ri email manzilini kiriting';
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
            
            if (result.success) {
                // Success - close modal and refresh table
                modal.remove();
                this.showNotification('Kategoriya muvaffaqiyatli yangilandi!', 'success');
                await this.refreshData();
                
                // Update theme for any remaining modals
                this.updateModalTheme();
                
            } else {
                // Handle validation errors
                this.handleServerErrors(result, form);
            }
            
        } catch (error) {
            console.error('Error updating category:', error);
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
                this.showNotification('Kategoriya muvaffaqiyatli yaratildi!', 'success');
                await this.refreshData();
                
                // Update theme for any remaining modals
                this.updateModalTheme();
                
            } else {
                // Handle validation errors
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
                isActive: data.isActive !== false, // Default to true
                isVisible: data.isVisible !== false, // Default to true
                isFeatured: data.isFeatured || false,
                allowProducts: data.allowProducts !== false, // Default to true
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