/**
 * Manufacturer Dashboard JavaScript
 * Professional manufacturing dashboard with real-time features
 * Senior Software Engineer level implementation
 */

class ManufacturerDashboard {
    constructor(options = {}) {
        this.options = {
            currentPage: 'dashboard',
            userId: null,
            userName: '',
            companyName: '',
            theme: 'light',
            autoRefresh: true,
            refreshInterval: 300000, // 5 minutes
            apiEndpoints: {
                dashboardStats: '/manufacturer/api/dashboard-stats',
                productionMetrics: '/manufacturer/api/production-metrics',
                salesAnalytics: '/manufacturer/api/sales-analytics',
                productionOrders: '/manufacturer/api/production-orders',
                equipmentStatus: '/manufacturer/api/equipment-status',
                qualityMetrics: '/manufacturer/api/quality-metrics',
                notifications: '/manufacturer/api/notifications',
                distributorInquiries: '/manufacturer/api/distributor-inquiries',
                communicationCenter: '/manufacturer/api/communication-center',
                inventoryManagement: '/manufacturer/api/inventory-management'
            },
            ...options
        };

        this.charts = {};
        this.refreshTimers = {};
        this.isInitialized = false;
        this.logger = console;
    }

    /**
     * Initialize the manufacturer dashboard
     */
    async init() {
        try {
            this.logger.log('🏭 Initializing Manufacturer Dashboard...');

            // Initialize core components
            this.initializeElements();
            this.setupEventListeners();
            // Theme and sidebar already initialized by dashboard-init.js
            
            // Load page-specific content
            await this.loadPageContent();
            
            // Start auto-refresh if enabled
            if (this.options.autoRefresh) {
                this.startAutoRefresh();
            }

            this.isInitialized = true;
            this.logger.log('✅ Manufacturer Dashboard initialized successfully');

            // Dispatch ready event
            this.dispatchEvent('dashboard-ready', {
                dashboard: this,
                options: this.options
            });

        } catch (error) {
            this.logger.error('❌ Dashboard initialization failed:', error);
            this.showError('Failed to initialize dashboard');
        }
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.elements = {
            // Layout elements
            sidebar: document.getElementById('manufacturerSidebar'),
            header: document.getElementById('manufacturerHeader'),
            sidebarToggle: document.getElementById('sidebarToggle'),
            mobileMenuToggle: document.getElementById('mobileMenuToggle'),
            
            // Theme elements
            themeToggle: document.getElementById('themeToggle'),
            themeIcon: document.getElementById('themeIcon'),
            
            // Navigation elements
            navItems: document.querySelectorAll('.nav-item'),
            submenuItems: document.querySelectorAll('.nav-submenu'),
            
            // Header elements
            currentTime: document.getElementById('currentTime'),
            globalSearch: document.getElementById('globalSearch'),
            searchSuggestions: document.getElementById('searchSuggestions'),
            notificationBtn: document.getElementById('notificationBtn'),
            notificationMenu: document.getElementById('notificationMenu'),
            profileBtn: document.getElementById('profileBtn'),
            profileMenu: document.getElementById('profileMenu'),
            
            // Quick actions
            quickActionsBtn: document.getElementById('quickActionsBtn'),
            fabMenu: document.getElementById('fabMenu'),
            newProductionOrderBtn: document.getElementById('newProductionOrderBtn'),
            qualityCheckBtn: document.getElementById('qualityCheckBtn'),
            equipmentStatusBtn: document.getElementById('equipmentStatusBtn'),
            
            // Dashboard widgets
            productionOutput: document.getElementById('productionOutput'),
            overallEfficiency: document.getElementById('overallEfficiency'),
            qualityScore: document.getElementById('qualityScore'),
            monthlyRevenue: document.getElementById('monthlyRevenue'),
            
            // Charts
            productionChart: document.getElementById('productionChart'),
            revenueSparkline: document.getElementById('revenueSparkline'),
            
            // Modals
            newProductionOrderModal: document.getElementById('newProductionOrderModal'),
            newProductionOrderForm: document.getElementById('newProductionOrderForm'),
            submitProductionOrder: document.getElementById('submitProductionOrder')
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Sidebar toggle
        if (this.elements.sidebarToggle) {
            this.elements.sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Mobile menu toggle
        if (this.elements.mobileMenuToggle) {
            this.elements.mobileMenuToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        // Theme toggle
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Navigation submenu toggles
        this.elements.submenuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSubmenu(item);
            });
        });

        // Global search
        if (this.elements.globalSearch) {
            this.elements.globalSearch.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });

            this.elements.globalSearch.addEventListener('focus', () => {
                this.showSearchSuggestions();
            });

            this.elements.globalSearch.addEventListener('blur', () => {
                setTimeout(() => this.hideSearchSuggestions(), 200);
            });
        }

        // Notification dropdown
        if (this.elements.notificationBtn) {
            this.elements.notificationBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNotifications();
            });
        }

        // Profile dropdown
        if (this.elements.profileBtn) {
            this.elements.profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleProfile();
            });
        }

        // Quick actions FAB
        if (this.elements.quickActionsBtn) {
            this.elements.quickActionsBtn.addEventListener('click', () => {
                this.toggleQuickActions();
            });
        }

        // Production order modal
        if (this.elements.newProductionOrderBtn) {
            this.elements.newProductionOrderBtn.addEventListener('click', () => {
                this.showNewProductionOrderModal();
            });
        }

        if (this.elements.submitProductionOrder) {
            this.elements.submitProductionOrder.addEventListener('click', () => {
                this.submitProductionOrder();
            });
        }

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            this.closeAllDropdowns(e);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Window resize handler
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Update current time
        this.updateCurrentTime();
        setInterval(() => this.updateCurrentTime(), 1000);
    }

    /**
     * Initialize theme
     */
    initializeTheme() {
        const savedTheme = localStorage.getItem('manufacturer-theme') || this.options.theme;
        this.setTheme(savedTheme);
    }

    /**
     * Set theme
     */
    setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('manufacturer-theme', theme);
        
        if (this.elements.themeIcon) {
            this.elements.themeIcon.className = theme === 'dark' ? 'las la-sun' : 'las la-moon';
        }
        
        this.options.theme = theme;
    }

    /**
     * Toggle theme
     */
    toggleTheme() {
        const currentTheme = this.options.theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    /**
     * Setup sidebar functionality
     */
    setupSidebar() {
        // Sidebar resize handle
        const resizeHandle = document.getElementById('sidebarResizeHandle');
        if (resizeHandle) {
            this.setupSidebarResize(resizeHandle);
        }

        // Load sidebar stats
        this.loadSidebarStats();
    }

    /**
     * Setup header functionality
     */
    setupHeader() {
        // Load header metrics
        this.loadHeaderMetrics();
        
        // Setup header progress bar
        this.setupProgressBar();
    }

    /**
     * Toggle sidebar collapsed state
     */
    toggleSidebar() {
                        document.body.classList.toggle('sidebar-collapsed');
                localStorage.setItem('sidebarCollapsed',
                document.body.classList.contains('sidebar-collapsed'));
    }

    /**
     * Toggle mobile menu
     */
    toggleMobileMenu() {
        if (this.elements.sidebar) {
            this.elements.sidebar.classList.toggle('show');
        }
    }

    /**
     * Toggle submenu
     */
    toggleSubmenu(submenuItem) {
        submenuItem.classList.toggle('open');
        
        // Close other submenus
        this.elements.submenuItems.forEach(item => {
            if (item !== submenuItem) {
                item.classList.remove('open');
            }
        });
    }

    /**
     * Handle search input
     */
    handleSearch(query) {
        if (query.length >= 2) {
            this.performSearch(query);
        } else {
            this.hideSearchSuggestions();
        }
    }

    /**
     * Perform search
     */
    async performSearch(query) {
        try {
            // Mock search results - replace with real API call
            const results = [
                { type: 'order', title: `Production Order ${query}`, url: `/manufacturer/production/orders/${query}` },
                { type: 'product', title: `${query} Products`, url: `/manufacturer/products?search=${query}` },
                { type: 'equipment', title: `${query} Equipment`, url: `/manufacturer/operations/equipment?search=${query}` }
            ];

            this.showSearchResults(results);
        } catch (error) {
            this.logger.error('Search failed:', error);
        }
    }

    /**
     * Show search suggestions
     */
    showSearchSuggestions() {
        if (this.elements.searchSuggestions) {
            this.elements.searchSuggestions.style.display = 'block';
        }
    }

    /**
     * Hide search suggestions
     */
    hideSearchSuggestions() {
        if (this.elements.searchSuggestions) {
            this.elements.searchSuggestions.style.display = 'none';
        }
    }

    /**
     * Show search results
     */
    showSearchResults(results) {
        // Implementation for showing search results
        this.showSearchSuggestions();
    }

    /**
     * Toggle notifications dropdown
     */
    toggleNotifications() {
        if (this.elements.notificationMenu) {
            this.elements.notificationMenu.classList.toggle('show');
            this.elements.profileMenu?.classList.remove('show');
        }
    }

    /**
     * Toggle profile dropdown
     */
    toggleProfile() {
        if (this.elements.profileMenu) {
            this.elements.profileMenu.classList.toggle('show');
            this.elements.notificationMenu?.classList.remove('show');
        }
    }

    /**
     * Toggle quick actions FAB
     */
    toggleQuickActions() {
        const fabContainer = document.querySelector('.fab-container');
        if (fabContainer) {
            fabContainer.classList.toggle('open');
        }
    }

    /**
     * Close all dropdowns
     */
    closeAllDropdowns(e) {
        if (!e.target.closest('.notification-dropdown')) {
            this.elements.notificationMenu?.classList.remove('show');
        }
        
        if (!e.target.closest('.profile-dropdown')) {
            this.elements.profileMenu?.classList.remove('show');
        }
        
        if (!e.target.closest('.fab-container')) {
            document.querySelector('.fab-container')?.classList.remove('open');
        }
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.elements.globalSearch?.focus();
        }
        
        // Ctrl/Cmd + Shift + N for new production order
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
            e.preventDefault();
            this.showNewProductionOrderModal();
        }
        
        // Ctrl/Cmd + Shift + D for dashboard
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            window.location.href = '/manufacturer/dashboard';
        }
        
        // Escape to close modals and dropdowns
        if (e.key === 'Escape') {
            this.closeAllDropdowns({ target: document.body });
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Update chart sizes
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.resize) {
                chart.resize();
            }
        });
        
        // Update mobile menu state
        if (window.innerWidth > 992) {
            this.elements.sidebar?.classList.remove('show');
        }
    }

    /**
     * Update current time
     */
    updateCurrentTime() {
        if (this.elements.currentTime) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            });
            this.elements.currentTime.textContent = timeString;
        }
    }

    /**
     * Load page content based on current page
     */
    async loadPageContent() {
        switch (this.options.currentPage) {
            case 'dashboard':
                await this.loadDashboardContent();
                break;
            case 'production':
                await this.loadProductionContent();
                break;
            case 'products':
                await this.loadProductsContent();
                break;
            default:
                this.logger.log(`Loading content for page: ${this.options.currentPage}`);
        }
    }

    /**
     * Load dashboard content
     */
    async loadDashboardContent() {
        try {
            // Load dashboard data in parallel
            const promises = [
                this.loadDashboardStats(),
                this.loadSalesChart(),
                this.loadProductionMetrics(),
                this.loadSalesAnalytics(),
                this.loadNotifications(),
                this.loadDistributorInquiries(),
                this.loadCommunicationCenter(),
                this.loadInventoryManagement()
            ];

            await Promise.all(promises);
            
            this.logger.log('✅ Dashboard content loaded');
        } catch (error) {
            this.logger.error('❌ Failed to load dashboard content:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    /**
     * Load dashboard statistics from backend API
     */
    async loadDashboardStats() {
        try {
            this.logger.log('🔄 Loading dashboard stats from API...');
            
            // Call real API endpoint
            const response = await this.apiCall(this.options.apiEndpoints.dashboardStats);
            
            if (response.success && response.data) {
                this.updateDashboardMetrics(response.data);
                this.updateKPICards(response.data);
                this.logger.log('✅ Dashboard stats loaded successfully');
            } else {
                throw new Error(response.error || 'Failed to load dashboard stats');
            }
        } catch (error) {
            this.logger.error('❌ Failed to load dashboard stats:', error);
            this.showError('Dashboard malumotlarini yuklashda xatolik yuz berdi');
        }
    }

    /**
     * Update dashboard metrics with enhanced error handling
     */
    updateDashboardMetrics(stats) {
        try {
            this.logger.log('🔄 Updating dashboard metrics with stats:', stats);

            // Update production output with safe data access
            if (this.elements.productionOutput) {
                const valueElement = this.elements.productionOutput.querySelector('.value');
                if (valueElement && stats?.production?.dailyOutput !== undefined) {
                    this.animateValue(valueElement, 0, stats.production.dailyOutput, 1000);
                    this.logger.log('✅ Production output updated:', stats.production.dailyOutput);
                } else {
                    this.logger.warn('⚠️ Production output element not found or no data');
                }
            }

            // Update efficiency with safe data access
            if (this.elements.overallEfficiency) {
                const valueElement = this.elements.overallEfficiency.querySelector('.value');
                if (valueElement && stats?.efficiency?.value !== undefined) {
                    this.animateValue(valueElement, 0, stats.efficiency.value, 1000, 1);
                    this.logger.log('✅ Efficiency updated:', stats.efficiency.value);
                } else {
                    this.logger.warn('⚠️ Efficiency element not found or no data');
                }
            }

            // Update quality score with safe data access
            if (this.elements.qualityScore) {
                const valueElement = this.elements.qualityScore.querySelector('.value');
                if (valueElement && stats?.quality?.score !== undefined) {
                    this.animateValue(valueElement, 0, stats.quality.score, 1000, 1);
                    this.logger.log('✅ Quality score updated:', stats.quality.score);
                } else {
                    this.logger.warn('⚠️ Quality score element not found or no data');
                }
            }

            // Update revenue with safe data access
            if (this.elements.monthlyRevenue) {
                const valueElement = this.elements.monthlyRevenue.querySelector('.value');
                if (valueElement && stats?.revenue?.monthly !== undefined) {
                    const formattedRevenue = new Intl.NumberFormat('en-US', { 
                        style: 'currency', 
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    }).format(stats.revenue.monthly);
                    valueElement.textContent = formattedRevenue;
                    this.logger.log('✅ Revenue updated:', formattedRevenue);
                } else {
                    this.logger.warn('⚠️ Revenue element not found or no data');
                }
            }

            this.logger.log('✅ Dashboard metrics update completed');
            
        } catch (error) {
            this.logger.error('❌ Failed to update dashboard metrics:', error);
        }
    }

    /**
     * Animate numeric values
     */
    animateValue(element, start, end, duration, decimals = 0) {
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = start + (end - start) * this.easeOutQuart(progress);
            element.textContent = decimals > 0 ? 
                current.toFixed(decimals) : 
                Math.floor(current).toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    /**
     * Easing function
     */
    easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }

    /**
     * Load production chart
     */
    async loadProductionChart() {
        if (!this.elements.productionChart) return;

        try {
            const ctx = this.elements.productionChart.getContext('2d');
            
            // Mock chart data
            const data = {
                labels: ['Jan 24', 'Jan 25', 'Jan 26', 'Jan 27', 'Jan 28', 'Jan 29', 'Jan 30'],
                datasets: [{
                    label: 'Production Output',
                    data: [2200, 2350, 2180, 2400, 2520, 2450, 2380],
                    borderColor: '#7c3aed',
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Quality Score',
                    data: [97.2, 97.8, 98.1, 97.9, 98.3, 98.2, 98.5],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1'
                }]
            };

            this.charts.production = new Chart(ctx, {
                type: 'line',
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    },
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            grid: {
                                drawOnChartArea: false,
                            },
                        }
                    }
                }
            });
        } catch (error) {
            this.logger.error('Failed to load production chart:', error);
        }
    }

    /**
     * Load equipment status
     */
    async loadEquipmentStatus() {
        // Implementation for loading equipment status
        this.logger.log('Loading equipment status...');
    }

    /**
     * Load recent alerts
     */
    async loadRecentAlerts() {
        // Implementation for loading recent alerts
        this.logger.log('Loading recent alerts...');
    }

    /**
     * Load sidebar stats
     */
    async loadSidebarStats() {
        // Implementation for loading sidebar statistics
        const sidebarStats = document.getElementById('sidebarStats');
        if (sidebarStats) {
            // Update sidebar stats
        }
    }

    /**
     * Load header metrics
     */
    async loadHeaderMetrics() {
        // Implementation for loading header metrics
        const headerMetrics = document.querySelectorAll('.metric-value');
        if (headerMetrics.length > 0) {
            // Update header metrics
        }
    }

    /**
     * Setup progress bar
     */
    setupProgressBar() {
        this.progressBar = document.getElementById('headerProgress');
    }

    /**
     * Show progress
     */
    showProgress() {
        if (this.progressBar) {
            this.progressBar.classList.add('active');
        }
    }

    /**
     * Hide progress
     */
    hideProgress() {
        if (this.progressBar) {
            this.progressBar.classList.remove('active');
        }
    }

    /**
     * Show new production order modal
     */
    showNewProductionOrderModal() {
        if (this.elements.newProductionOrderModal) {
            const modal = new bootstrap.Modal(this.elements.newProductionOrderModal);
            modal.show();
        }
    }

    /**
     * Submit production order
     */
    async submitProductionOrder() {
        try {
            const formData = new FormData(this.elements.newProductionOrderForm);
            const orderData = Object.fromEntries(formData.entries());

            this.showProgress();

            // Mock API call - replace with real implementation
            await new Promise(resolve => setTimeout(resolve, 1000));

            this.hideProgress();
            this.showSuccess('Production order created successfully');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(this.elements.newProductionOrderModal);
            modal?.hide();
            
            // Refresh dashboard data
            await this.loadDashboardContent();

        } catch (error) {
            this.hideProgress();
            this.logger.error('Failed to create production order:', error);
            this.showError('Failed to create production order');
        }
    }

    /**
     * Start auto-refresh
     */
    startAutoRefresh() {
        if (this.refreshTimers.dashboard) {
            clearInterval(this.refreshTimers.dashboard);
        }

        this.refreshTimers.dashboard = setInterval(() => {
            this.refreshDashboardData();
        }, this.options.refreshInterval);
    }

    /**
     * Stop auto-refresh
     */
    stopAutoRefresh() {
        Object.values(this.refreshTimers).forEach(timer => {
            clearInterval(timer);
        });
        this.refreshTimers = {};
    }

    /**
     * Refresh dashboard data
     */
    async refreshDashboardData() {
        try {
            await this.loadDashboardStats();
            this.logger.log('Dashboard data refreshed');
        } catch (error) {
            this.logger.error('Failed to refresh dashboard data:', error);
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
        const toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) return;

        const toastId = 'toast-' + Date.now();
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-bg-${type === 'error' ? 'danger' : type} border-0`;
        toast.id = toastId;
        toast.setAttribute('role', 'alert');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        toastContainer.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        // Remove toast after it's hidden
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    /**
     * Make API call with error handling and token management
     */
    async apiCall(url, options = {}) {
        try {
            const defaultOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include' // Include cookies for JWT
            };

            const response = await fetch(url, { ...defaultOptions, ...options });
            
            if (!response.ok) {
                if (response.status === 401) {
                    this.logger.warn('⚠️ Authentication required, redirecting to login...');
                    window.location.href = '/login';
                    return;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            this.logger.error('❌ API call failed:', error);
            throw error;
        }
    }

    /**
     * Update KPI cards with backend data
     */
    updateKPICards(stats) {
        try {
            this.logger.log('🔄 Updating KPI cards with data:', stats);

            // Update Total Sales card - try both selector methods
            const totalSalesElement = document.getElementById('totalSalesValue') || 
                                    document.querySelector('[data-kpi="totalSales"] .kpi-value');
            if (totalSalesElement && stats.totalSales) {
                const formattedValue = new Intl.NumberFormat('en-US', { 
                    style: 'currency', 
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(stats.totalSales);
                
                totalSalesElement.innerHTML = formattedValue;
                totalSalesElement.classList.add('updated');
                this.logger.log(`✅ Total Sales updated: ${formattedValue}`);
            } else {
                this.logger.warn('❌ Total Sales element not found or no data');
            }

            // Update Active Orders card  
            const activeOrdersElement = document.getElementById('activeOrdersValue') || 
                                      document.querySelector('[data-kpi="activeOrders"] .kpi-value');
            if (activeOrdersElement && stats.activeOrders !== undefined) {
                activeOrdersElement.innerHTML = stats.activeOrders.toLocaleString();
                activeOrdersElement.classList.add('updated');
                this.logger.log(`✅ Active Orders updated: ${stats.activeOrders}`);
            } else {
                this.logger.warn('❌ Active Orders element not found or no data');
            }

            // Update Total Products card
            const totalProductsElement = document.getElementById('totalProductsValue') || 
                                        document.querySelector('[data-kpi="totalProducts"] .kpi-value');
            if (totalProductsElement && stats.totalProducts !== undefined) {
                totalProductsElement.innerHTML = stats.totalProducts.toLocaleString();
                totalProductsElement.classList.add('updated');
                this.logger.log(`✅ Total Products updated: ${stats.totalProducts}`);
            } else {
                this.logger.warn('❌ Total Products element not found or no data');
            }

            // Update Inquiries card
            const inquiriesElement = document.getElementById('inquiriesValue') || 
                                   document.querySelector('[data-kpi="inquiries"] .kpi-value');
            if (inquiriesElement && stats.inquiries !== undefined) {
                inquiriesElement.innerHTML = stats.inquiries.toLocaleString();
                inquiriesElement.classList.add('updated');
                this.logger.log(`✅ Inquiries updated: ${stats.inquiries}`);
            } else {
                this.logger.warn('❌ Inquiries element not found or no data');
            }

            // Update platform status metrics
            this.updatePlatformStatusMetrics(stats);

            // Update trend indicators
            this.updateTrendIndicators(stats);

            // Update top products if data is available
            if (stats.topProducts) {
                this.updateTopProductsWidget(stats.topProducts);
            }

            // Update recent orders if data is available  
            if (stats.recentOrders) {
                this.updateRecentOrdersWidget(stats.recentOrders);
            }

            this.logger.log('✅ All KPI cards updated successfully');
        } catch (error) {
            this.logger.error('❌ Failed to update KPI cards:', error);
        }
    }

    /**
     * Update platform status metrics
     */
    updatePlatformStatusMetrics(stats) {
        try {
            // Update marketplace activity
            const marketplaceActivityElement = document.getElementById('marketplaceActivity');
            if (marketplaceActivityElement && stats.marketplaceActivity !== undefined) {
                marketplaceActivityElement.innerHTML = `${stats.marketplaceActivity}%`;
                marketplaceActivityElement.classList.add('updated');
            }

            // Update inquiry conversion
            const inquiryConversionElement = document.getElementById('inquiryConversion');
            if (inquiryConversionElement && stats.inquiryConversion !== undefined) {
                inquiryConversionElement.innerHTML = `${stats.inquiryConversion}%`;
                inquiryConversionElement.classList.add('updated');
            }

            // Update active distributors
            const activeDistributorsElement = document.getElementById('activeDistributors');
            if (activeDistributorsElement && stats.activeDistributors !== undefined) {
                activeDistributorsElement.innerHTML = stats.activeDistributors.toLocaleString();
                activeDistributorsElement.classList.add('updated');
            }

            this.logger.log('✅ Platform status metrics updated');
        } catch (error) {
            this.logger.error('❌ Failed to update platform status metrics:', error);
        }
    }

    /**
     * Update trend indicators for KPI cards
     */
    updateTrendIndicators(stats) {
        if (stats.trends) {
            // Update sales trend
            const salesTrendElement = document.querySelector('[data-kpi="totalSales"] .kpi-trend');
            if (salesTrendElement && stats.revenueGrowth) {
                salesTrendElement.textContent = `+${stats.revenueGrowth}%`;
                salesTrendElement.className = 'kpi-trend trend-up';
            }

            // Update orders trend  
            const ordersTrendElement = document.querySelector('[data-kpi="activeOrders"] .kpi-trend');
            if (ordersTrendElement && stats.trends.ordersTrend) {
                const growth = this.calculateGrowth(stats.trends.ordersTrend);
                ordersTrendElement.textContent = `${growth > 0 ? '+' : ''}${growth}%`;
                ordersTrendElement.className = `kpi-trend ${growth > 0 ? 'trend-up' : 'trend-down'}`;
            }
        }
    }

    /**
     * Calculate growth percentage from trend array
     */
    calculateGrowth(trendArray) {
        if (!trendArray || trendArray.length < 2) return 0;
        const current = trendArray[trendArray.length - 1];
        const previous = trendArray[trendArray.length - 2];
        return Math.round(((current - previous) / previous) * 100);
    }

    /**
     * Animate number values with formatted output
     */
    animateValue(element, start, end, duration, formatter = null) {
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = start + (end - start) * easeOutQuart;
            
            if (formatter) {
                element.textContent = formatter(Math.round(current));
            } else {
                element.textContent = Math.round(current).toLocaleString('uz-UZ');
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    /**
     * Load and update sales analytics chart
     */
    async loadSalesChart() {
        try {
            this.logger.log('🔄 Loading sales chart data...');
            
            const response = await this.apiCall(this.options.apiEndpoints.productionMetrics);
            
            if (response.success && response.data) {
                this.updateSalesChart(response.data);
                this.logger.log('✅ Sales chart loaded successfully');
            }
        } catch (error) {
            this.logger.error('❌ Failed to load sales chart:', error);
        }
    }

    /**
     * Update sales chart with real data
     */
    updateSalesChart(data) {
        const chartCanvas = document.getElementById('salesChart');
        if (!chartCanvas) return;

        const ctx = chartCanvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.charts.salesChart) {
            this.charts.salesChart.destroy();
        }

        // Create new chart with real data
        this.charts.salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May'],
                datasets: [
                    {
                        label: 'B2B Savdo hajmi',
                        data: data.trends?.salesTrend || [98000, 105000, 112000, 118000, 125450],
                        borderColor: 'rgb(124, 58, 237)',
                        backgroundColor: 'rgba(124, 58, 237, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Distributorlar so\'rovlari',
                        data: data.trends?.inquiriesTrend || [38, 42, 45, 43, 45],
                        borderColor: 'rgb(34, 197, 94)',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Savdo hajmi ($)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'So\'rovlar soni'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'B2B Marketplace Performance'
                    },
                    legend: {
                        display: true
                    }
                }
            }
        });
    }

    /**
     * Load production metrics data
     */
    async loadProductionMetrics() {
        try {
            this.logger.log('🔄 Loading production metrics...');
            
            const response = await this.apiCall(this.options.apiEndpoints.productionMetrics);
            
            if (response.success && response.data) {
                this.updateProductionMetrics(response.data);
                this.logger.log('✅ Production metrics loaded successfully');
            }
        } catch (error) {
            this.logger.error('❌ Failed to load production metrics:', error);
        }
    }

    /**
     * Load sales analytics data
     */
    async loadSalesAnalytics() {
        try {
            this.logger.log('🔄 Loading sales analytics...');
            
            const response = await this.apiCall(this.options.apiEndpoints.salesAnalytics);
            
            if (response.success && response.data) {
                this.updateSalesAnalytics(response.data);
                this.logger.log('✅ Sales analytics loaded successfully');
            }
        } catch (error) {
            this.logger.error('❌ Failed to load sales analytics:', error);
        }
    }

    /**
     * Update sales analytics display
     */
    updateSalesAnalytics(data) {
        try {
            // Update revenue analytics
            if (data.revenue) {
                const revenueCard = document.querySelector('[data-kpi="revenue"] .kpi-value');
                if (revenueCard) {
                    this.animateValue(revenueCard, 0, data.revenue.current, 1500, (val) => 
                        new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'USD' }).format(val)
                    );
                }
            }

            // Update customer metrics
            if (data.customers) {
                const customersCard = document.querySelector('[data-kpi="customers"] .kpi-value');
                if (customersCard) {
                    this.animateValue(customersCard, 0, data.customers.total, 1000);
                }
            }

            // Update geographical distribution chart if available
            if (data.geographical && window.Chart) {
                this.updateGeographicalChart(data.geographical);
            }

            this.logger.log('✅ Sales analytics updated successfully');
        } catch (error) {
            this.logger.error('❌ Failed to update sales analytics:', error);
        }
    }

    /**
     * Update production metrics display
     */
    updateProductionMetrics(metrics) {
        // Update recent orders widget
        const recentOrdersContainer = document.querySelector('.recent-orders-list');
        if (recentOrdersContainer && metrics.recentOrders) {
            this.updateRecentOrders(metrics.recentOrders);
        }

        // Update top products widget  
        const topProductsContainer = document.querySelector('.product-list');
        if (topProductsContainer && metrics.topProducts) {
            this.updateTopProducts(metrics.topProducts);
        }
    }

    /**
     * Update recent orders widget
     */
    updateRecentOrders(orders) {
        const container = document.querySelector('.recent-orders-list');
        if (!container) return;

        container.innerHTML = orders.map(order => `
            <div class="order-item">
                <div class="order-header">
                    <span class="order-id">${order.id}</span>
                    <span class="order-status status-${order.status}">${this.getStatusText(order.status)}</span>
                </div>
                <div class="order-company">${order.distributor}</div>
                <div class="order-amount">$${order.amount.toLocaleString()}</div>
            </div>
        `).join('');
    }

    /**
     * Update top products widget
     */
    updateTopProducts(products) {
        const container = document.querySelector('.product-list');
        if (!container) return;

        container.innerHTML = products.map(product => `
            <div class="product-item">
                <div class="product-info">
                    <h4 class="product-name">${product.name}</h4>
                    <div class="product-stats">
                        <span class="product-sales">$${product.sales.toLocaleString()}</span>
                        <span class="product-units">${product.units}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Update top products widget with real data
     */
    updateTopProductsWidget(products) {
        try {
            const container = document.querySelector('.top-products-list');
            if (!container || !products || products.length === 0) return;

            container.innerHTML = products.map((product, index) => `
                <div class="product-item">
                    <div class="product-info">
                        <div class="product-rank">#${index + 1}</div>
                        <div class="product-details">
                            <h4 class="product-name">${product.name}</h4>
                            <p class="product-sales">${product.units} sotildi</p>
                        </div>
                    </div>
                    <div class="product-stats">
                        <span class="revenue">$${product.sales.toLocaleString()}</span>
                        <div class="rating">
                            <i class="fas fa-star"></i> ${(4.5 + Math.random() * 0.4).toFixed(1)}
                        </div>
                    </div>
                </div>
            `).join('');

            this.logger.log('✅ Top products widget updated with real data');
        } catch (error) {
            this.logger.error('❌ Failed to update top products widget:', error);
        }
    }

    /**
     * Update recent orders widget with real data
     */
    updateRecentOrdersWidget(orders) {
        try {
            const container = document.querySelector('.orders-list');
            if (!container || !orders || orders.length === 0) return;

            container.innerHTML = orders.map((order, index) => {
                const statusClass = this.getStatusClass(order.status);
                const progress = this.getProgressByStatus(order.status);
                
                return `
                    <div class="order-item">
                        <div class="order-header">
                            <span class="order-id">${order.id}</span>
                            <span class="order-date">${this.getRelativeTime(new Date())}</span>
                        </div>
                        <div class="order-body">
                            <h4 class="order-product">Buyurtma - ${order.id}</h4>
                            <div class="order-client">
                                <i class="fas fa-store"></i> ${order.distributor}
                            </div>
                            <div class="order-amount">$${order.amount.toLocaleString()}</div>
                        </div>
                        <div class="order-footer">
                            <span class="status-badge status-${statusClass}">${this.getStatusText(order.status)}</span>
                            <div class="order-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill ${statusClass === 'success' ? 'success' : ''}" style="width: ${progress}%"></div>
                                </div>
                                <span class="progress-text">${progress}%</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            this.logger.log('✅ Recent orders widget updated with real data');
        } catch (error) {
            this.logger.error('❌ Failed to update recent orders widget:', error);
        }
    }

    /**
     * Get status CSS class
     */
    getStatusClass(status) {
        const statusMap = {
            pending: 'warning',
            confirmed: 'info', 
            processing: 'info',
            shipped: 'success',
            delivered: 'success',
            cancelled: 'danger'
        };
        return statusMap[status] || 'info';
    }

    /**
     * Get progress percentage by status
     */
    getProgressByStatus(status) {
        const progressMap = {
            pending: 25,
            confirmed: 50,
            processing: 75,
            shipped: 90,
            delivered: 100,
            cancelled: 0
        };
        return progressMap[status] || 25;
    }

    /**
     * Get relative time string
     */
    getRelativeTime(date) {
        const now = new Date();
        const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffHours < 1) return 'Hozirgina';
        if (diffHours < 24) return `${diffHours} soat oldin`;
        return `${Math.floor(diffHours / 24)} kun oldin`;
    }

    /**
     * Load notifications
     */
    async loadNotifications() {
        try {
            this.logger.log('🔄 Loading notifications...');
            
            const response = await this.apiCall(this.options.apiEndpoints.notifications);
            
            if (response.success && response.data) {
                this.updateNotificationsBadge(response.data.unreadCount);
                this.logger.log('✅ Notifications loaded successfully');
            }
        } catch (error) {
            this.logger.error('❌ Failed to load notifications:', error);
        }
    }

    /**
     * Update notifications badge
     */
    updateNotificationsBadge(unreadCount) {
        const badge = document.querySelector('.notification-badge');
        if (badge && unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'block';
        } else if (badge) {
            badge.style.display = 'none';
        }
    }

    /**
     * Get status text in Uzbek
     */
    getStatusText(status) {
        const statusMap = {
            processing: 'Jarayonda',
            shipped: 'Yuborildi',
            pending: 'Kutilmoqda',
            completed: 'Tugallandi',
            cancelled: 'Bekor qilindi'
        };
        return statusMap[status] || status;
    }

    /**
     * Load distributor inquiries data
     */
    async loadDistributorInquiries() {
        try {
            this.logger.log('🔍 Loading distributor inquiries...');
            
            const response = await this.apiCall(this.options.apiEndpoints.distributorInquiries);
            
            if (response.success && response.data) {
                this.updateDistributorInquiries(response.data);
                this.logger.log('✅ Distributor inquiries loaded successfully');
            }
        } catch (error) {
            this.logger.error('❌ Failed to load distributor inquiries:', error);
        }
    }

    /**
     * Update distributor inquiries display
     */
    updateDistributorInquiries(data) {
        try {
            const inquiriesContainer = document.querySelector('.widget-content');
            if (!inquiriesContainer) return;

            // Clear existing inquiries
            inquiriesContainer.innerHTML = '';
            
            if (data.inquiries && data.inquiries.length > 0) {
                data.inquiries.forEach(inquiry => {
                    const inquiryElement = this.createInquiryElement(inquiry);
                    inquiriesContainer.appendChild(inquiryElement);
                });
            }
            
            this.logger.log('✅ Distributor inquiries updated');
        } catch (error) {
            this.logger.error('❌ Failed to update distributor inquiries:', error);
        }
    }

    /**
     * Create inquiry element
     */
    createInquiryElement(inquiry) {
        const div = document.createElement('div');
        div.className = `inquiry-card ${inquiry.priority}-priority`;
        
        const timeAgo = this.getTimeAgo(inquiry.timestamp);
        
        div.innerHTML = `
            <div class="inquiry-info">
                <div class="company-section">
                    <div class="company-logo-placeholder">
                        <i class="fas fa-building"></i>
                    </div>
                    <div class="company-details">
                        <h4 class="company-title">${inquiry.companyName}</h4>
                        <span class="inquiry-timestamp">${timeAgo}</span>
                    </div>
                </div>
                <div class="priority-label ${inquiry.priority}">${this.getPriorityLabel(inquiry.priority)}</div>
            </div>
            <div class="inquiry-message">
                <p>${inquiry.message}</p>
                <div class="order-specs">
                    ${inquiry.specs.map(spec => `<span class="spec-tag">${spec}</span>`).join('')}
                </div>
            </div>
            <div class="inquiry-buttons">
                <button class="btn-respond">Javob berish</button>
                <button class="btn-quote">Narx yuborish</button>
            </div>
        `;
        
        return div;
    }

    /**
     * Load communication center data
     */
    async loadCommunicationCenter() {
        try {
            this.logger.log('💬 Loading communication center...');
            
            const response = await this.apiCall(this.options.apiEndpoints.communicationCenter);
            
            if (response.success && response.data) {
                this.updateCommunicationCenter(response.data);
                this.logger.log('✅ Communication center loaded successfully');
            }
        } catch (error) {
            this.logger.error('❌ Failed to load communication center:', error);
        }
    }

    /**
     * Update communication center display
     */
    updateCommunicationCenter(data) {
        try {
            // Update chat previews
            const chatList = document.querySelector('.chat-preview-list');
            if (chatList && data.chatPreviews) {
                chatList.innerHTML = '';
                
                data.chatPreviews.forEach(chat => {
                    const chatElement = this.createChatElement(chat);
                    chatList.appendChild(chatElement);
                });
            }

            // Update communication stats
            if (data.stats) {
                const statsContainer = document.querySelector('.communication-stats');
                if (statsContainer) {
                    statsContainer.innerHTML = `
                        <div class="stat-item">
                            <span class="stat-label">Faol suhbatlar</span>
                            <span class="stat-value">${data.stats.activeChats}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">O'rtacha javob vaqti</span>
                            <span class="stat-value">${data.stats.averageResponseTime}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Bugungi xabarlar</span>
                            <span class="stat-value">${data.stats.todayMessages}</span>
                        </div>
                    `;
                }
            }
            
            this.logger.log('✅ Communication center updated');
        } catch (error) {
            this.logger.error('❌ Failed to update communication center:', error);
        }
    }

    /**
     * Create chat element
     */
    createChatElement(chat) {
        const div = document.createElement('div');
        div.className = `chat-preview ${chat.unreadCount > 0 ? 'unread' : ''}`;
        
        const statusClass = chat.status === 'online' ? 'online-indicator' : 
                          chat.status === 'away' ? 'away-indicator' : 'offline-indicator';
        
        div.innerHTML = `
            <div class="chat-avatar">
                <div class="chat-avatar-placeholder">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="${statusClass}"></div>
            </div>
            <div class="chat-content">
                <div class="chat-header">
                    <h4 class="chat-company">${chat.companyName}</h4>
                    <span class="chat-time">${chat.timestamp}</span>
                </div>
                <p class="chat-message">${chat.lastMessage}</p>
                <div class="chat-meta">
                    ${chat.unreadCount > 0 ? `<span class="message-count">${chat.unreadCount}</span>` : ''}
                    ${chat.isTyping ? '<span class="typing-indicator">yozmoqda...</span>' : ''}
                    ${!chat.unreadCount && !chat.isTyping ? '<span class="read-indicator">O\'qildi</span>' : ''}
                </div>
            </div>
        `;
        
        return div;
    }

    /**
     * Load inventory management data
     */
    async loadInventoryManagement() {
        try {
            this.logger.log('📦 Loading inventory management...');
            
            const response = await this.apiCall(this.options.apiEndpoints.inventoryManagement);
            
            if (response.success && response.data) {
                this.updateInventoryManagement(response.data);
                this.logger.log('✅ Inventory management loaded successfully');
            }
        } catch (error) {
            this.logger.error('❌ Failed to load inventory management:', error);
        }
    }

    /**
     * Update inventory management display
     */
    updateInventoryManagement(data) {
        try {
            // Update stock summary
            const stockSummary = document.querySelector('.stock-summary');
            if (stockSummary && data.stockSummary) {
                stockSummary.innerHTML = `
                    <div class="summary-item good">
                        <div class="summary-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="summary-info">
                            <h4 class="summary-title">${data.stockSummary.normal.label}</h4>
                            <span class="summary-count">${data.stockSummary.normal.count} mahsulot</span>
                        </div>
                    </div>
                    <div class="summary-item warning">
                        <div class="summary-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="summary-info">
                            <h4 class="summary-title">${data.stockSummary.low.label}</h4>
                            <span class="summary-count">${data.stockSummary.low.count} mahsulot</span>
                        </div>
                    </div>
                    <div class="summary-item danger">
                        <div class="summary-icon">
                            <i class="fas fa-times-circle"></i>
                        </div>
                        <div class="summary-info">
                            <h4 class="summary-title">${data.stockSummary.outOfStock.label}</h4>
                            <span class="summary-count">${data.stockSummary.outOfStock.count} mahsulot</span>
                        </div>
                    </div>
                `;
            }

            // Update critical stock items
            const criticalStock = document.querySelector('.critical-stock');
            if (criticalStock && data.criticalItems) {
                const itemsHtml = data.criticalItems.map(item => `
                    <div class="stock-item ${item.level}">
                        <div class="item-info">
                            <h5 class="item-name">${item.name}</h5>
                            <p class="item-sku">${item.sku}</p>
                        </div>
                        <div class="item-stock">
                            <span class="stock-level ${item.level}">${item.currentStock} rulon</span>
                            <span class="stock-action">${item.action}</span>
                        </div>
                    </div>
                `).join('');
                
                criticalStock.innerHTML = `
                    <h4 class="section-title">Diqqat talab qiladi</h4>
                    ${itemsHtml}
                `;
            }
            
            this.logger.log('✅ Inventory management updated');
        } catch (error) {
            this.logger.error('❌ Failed to update inventory management:', error);
        }
    }

    /**
     * Get time ago string
     */
    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        
        if (diffHours < 1) return 'Hozirgina';
        if (diffHours === 1) return '1 soat oldin';
        if (diffHours < 24) return `${diffHours} soat oldin`;
        return '1 kun oldin';
    }

    /**
     * Get priority label
     */
    getPriorityLabel(priority) {
        const labels = {
            urgent: 'Shoshilinch',
            new: 'Yangi',
            followup: 'Kuzatuv'
        };
        return labels[priority] || 'Yangi';
    }

    /**
     * Dispatch custom event
     */
    dispatchEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.stopAutoRefresh();
        
        // Destroy charts
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        
        this.isInitialized = false;
        this.logger.log('Manufacturer Dashboard destroyed');
    }
}

// Export for global use
window.ManufacturerDashboard = ManufacturerDashboard;

// Auto-initialize if elements exist
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('manufacturerSidebar')) {
        window.manufacturerDashboard = new ManufacturerDashboard();
    }
});