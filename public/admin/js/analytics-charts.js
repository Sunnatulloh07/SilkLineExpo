// SLEX Analytics Dashboard Charts
// Senior Software Engineer Level Implementation

class AnalyticsCharts {
    constructor() {
        this.charts = {};
        this.chartOptions = {
            chart: {
                fontFamily: 'Inter, sans-serif',
                background: 'transparent',
                toolbar: {
                    show: false
                },
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800
                }
            },
            theme: {
                mode: document.documentElement.getAttribute('data-theme') || 'light'
            }
        };
        
        // Store current time range and filters
        this.currentTimeRange = '30d';
        this.currentFilter = 'revenue';
        
        // API endpoints
        this.apiEndpoints = {
            overview: '/admin/api/analytics/overview',
            revenue: '/admin/api/analytics/revenue',
            users: '/admin/api/analytics/users',
            products: '/admin/api/analytics/products',
            geographic: '/admin/api/analytics/geographic',
            realtime: '/admin/api/analytics/realtime'
        };
        
        this.init();
    }

    async init() {
        try {
            // Show loading state
            this.showLoadingState();
            
            // Fetch all initial data
            await this.fetchAllAnalyticsData();
            
            // Setup event listeners
        this.setupEventListeners();
            
            // Start real-time updates
        this.startRealTimeUpdates();
        } catch (error) {
            console.error('Analytics initialization error:', error);
            this.showErrorState('Failed to load analytics data');
        }
    }

    /**
     * Fetch all analytics data from APIs
     */
    async fetchAllAnalyticsData() {
        try {
            const [overviewData, revenueData, userActivity, productData, geographicData] = await Promise.all([
                this.fetchOverviewData(),
                this.fetchRevenueData(),
                this.fetchUserActivityData(),
                this.fetchProductData(),
                this.fetchGeographicData()
            ]);
            
            // Initialize charts with fetched data
            this.initializeRevenueChart(revenueData);
            this.initializeUserActivityChart(userActivity);
            this.initializeProductChart(productData);
            this.initializeGeographicChart(geographicData);
            
            // Update overview metrics
            this.updateOverviewMetrics(overviewData);
            
            // Hide loading state
            this.hideLoadingState();
            
        } catch (error) {
            console.error('Error fetching analytics data:', error);
            throw error;
        }
    }

    /**
     * Fetch overview data from API
     */
    async fetchOverviewData() {
        const response = await fetch(`${this.apiEndpoints.overview}?timeRange=${this.currentTimeRange}`);
        if (!response.ok) throw new Error('Failed to fetch overview data');
        const result = await response.json();
        return result.data;
    }

    /**
     * Fetch revenue data from API
     */
    async fetchRevenueData() {
        const response = await fetch(`${this.apiEndpoints.revenue}?timeRange=${this.currentTimeRange}&filter=${this.currentFilter}`);
        if (!response.ok) throw new Error('Failed to fetch revenue data');
        const result = await response.json();
        return result.data;
    }

    /**
     * Fetch user activity data from API
     */
    async fetchUserActivityData() {
        const response = await fetch(`${this.apiEndpoints.users}?timeRange=${this.currentTimeRange}`);
        if (!response.ok) throw new Error('Failed to fetch user activity data');
        const result = await response.json();
        return result.data;
    }

    /**
     * Fetch product data from API
     */
    async fetchProductData() {
        const response = await fetch(`${this.apiEndpoints.products}?timeRange=${this.currentTimeRange}`);
        if (!response.ok) throw new Error('Failed to fetch product data');
        const result = await response.json();
        return result.data;
    }

    /**
     * Fetch geographic data from API
     */
    async fetchGeographicData() {
        const response = await fetch(`${this.apiEndpoints.geographic}?timeRange=${this.currentTimeRange}`);
        if (!response.ok) throw new Error('Failed to fetch geographic data');
        const result = await response.json();
        return result.data;
    }

    /**
     * Update overview metrics in the UI
     */
    updateOverviewMetrics(data) {
        // Update total revenue
        const revenueEl = document.querySelector('[data-metric="totalRevenue"]');
        if (revenueEl) revenueEl.textContent = this.formatCurrency(data.totalRevenue);
        
        // Update active users
        const usersEl = document.querySelector('[data-metric="activeUsers"]');
        if (usersEl) usersEl.textContent = this.formatNumber(data.activeUsers);
        
        // Update total orders
        const ordersEl = document.querySelector('[data-metric="totalOrders"]');
        if (ordersEl) ordersEl.textContent = this.formatNumber(data.totalOrders);
        
        // Update conversion rate
        const conversionEl = document.querySelector('[data-metric="conversionRate"]');
        if (conversionEl) conversionEl.textContent = `${data.conversionRate}%`;
        
        // Update growth indicators
        if (data.growth) {
            this.updateGrowthIndicators(data.growth);
        }
    }

    /**
     * Update growth indicators in UI
     */
    updateGrowthIndicators(growth) {
        // Revenue growth
        const revenueGrowthEl = document.querySelector('[data-growth="revenue"]');
        if (revenueGrowthEl && growth.revenue) {
            revenueGrowthEl.innerHTML = this.formatGrowth(growth.revenue);
        }
        
        // Users growth
        const usersGrowthEl = document.querySelector('[data-growth="users"]');
        if (usersGrowthEl && growth.users) {
            usersGrowthEl.innerHTML = this.formatGrowth(growth.users);
        }
        
        // Orders growth
        const ordersGrowthEl = document.querySelector('[data-growth="orders"]');
        if (ordersGrowthEl && growth.orders) {
            ordersGrowthEl.innerHTML = this.formatGrowth(growth.orders);
        }
        
        // Conversion growth
        const conversionGrowthEl = document.querySelector('[data-growth="conversion"]');
        if (conversionGrowthEl && growth.conversion) {
            conversionGrowthEl.innerHTML = this.formatGrowth(growth.conversion);
        }
    }

    /**
     * Format growth percentage with arrow
     */
    formatGrowth(value) {
        const isPositive = value >= 0;
        const arrow = isPositive ? '↑' : '↓';
        const color = isPositive ? 'text-success' : 'text-danger';
        return `<span class="${color}">${arrow} ${Math.abs(value)}%</span>`;
    }

    /**
     * Initialize revenue chart with real data
     */
    initializeRevenueChart(data) {
        const options = {
            ...this.chartOptions,
            series: data.series || [{
                name: 'Revenue',
                data: data.chartData || []
            }],
            chart: {
                ...this.chartOptions.chart,
                type: 'area',
                height: 350
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth',
                width: 3,
                colors: ['#3B82F6']
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.7,
                    opacityTo: 0.1,
                    stops: [0, 90, 100]
                },
                colors: ['#3B82F6']
            },
            xaxis: {
                type: 'category',
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                labels: {
                    style: {
                        colors: this.getTextColor(),
                        fontSize: '12px'
                    }
                },
                axisBorder: {
                    show: false
                },
                axisTicks: {
                    show: false
                }
            },
            yaxis: {
                labels: {
                    style: {
                        colors: this.getTextColor(),
                        fontSize: '12px'
                    },
                    formatter: function (val) {
                        return '$' + (val / 1000).toFixed(0) + 'K';
                    }
                }
            },
            grid: {
                borderColor: this.getBorderColor(),
                strokeDashArray: 5,
                xaxis: {
                    lines: {
                        show: false
                    }
                }
            },
            tooltip: {
                theme: document.documentElement.getAttribute('data-theme') || 'light',
                x: {
                    format: 'MMM'
                },
                y: {
                    formatter: function (val) {
                        return '$' + val.toLocaleString();
                    }
                }
            },
            colors: ['#3B82F6'],
            markers: {
                size: 6,
                colors: ['#3B82F6'],
                strokeColors: '#ffffff',
                strokeWidth: 2,
                hover: {
                    size: 8
                }
            }
        };

        if (this.charts.revenue) {
            this.charts.revenue.updateOptions(options);
        } else {
            this.charts.revenue = new ApexCharts(
                document.querySelector("#revenueChart"), 
                options
            );
        this.charts.revenue.render();
        }
    }

    /**
     * Initialize user activity chart with real data
     */
    initializeUserActivityChart(data) {
        const options = {
            ...this.chartOptions,
            series: data.series || [],
            chart: {
                ...this.chartOptions.chart,
                type: 'line',
                height: 350
            },
            labels: ['Active Users', 'Inactive Users', 'Pending Approval', 'Blocked Users'],
            colors: ['#10B981', '#F59E0B', '#3B82F6', '#EF4444'],
            legend: {
                position: 'bottom',
                horizontalAlign: 'center',
                fontSize: '12px',
                labels: {
                    colors: this.getTextColor()
                },
                markers: {
                    width: 12,
                    height: 12,
                    radius: 6
                }
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '70%',
                        labels: {
                            show: true,
                            name: {
                                show: true,
                                fontSize: '16px',
                                fontWeight: 600,
                                color: this.getTextColor()
                            },
                            value: {
                                show: true,
                                fontSize: '24px',
                                fontWeight: 700,
                                color: this.getTextColor(),
                                formatter: function (val) {
                                    return parseInt(val).toLocaleString();
                                }
                            },
                            total: {
                                show: true,
                                showAlways: true,
                                label: 'Total Users',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: this.getTextColor(),
                                formatter: function (w) {
                                    const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                                    return total.toLocaleString();
                                }
                            }
                        }
                    }
                }
            },
            dataLabels: {
                enabled: false
            },
            tooltip: {
                theme: document.documentElement.getAttribute('data-theme') || 'light',
                y: {
                    formatter: function (val) {
                        return val.toLocaleString() + ' users';
                    }
                }
            },
            stroke: {
                width: 0
            }
        };

        if (this.charts.userActivity) {
            this.charts.userActivity.updateOptions(options);
        } else {
            this.charts.userActivity = new ApexCharts(
                document.querySelector("#userActivityChart"), 
                options
            );
        this.charts.userActivity.render();
        }
    }

    /**
     * Initialize product performance chart
     */
    initializeProductChart(data) {
        const options = {
            ...this.chartOptions,
            series: data.series || [],
            chart: {
                ...this.chartOptions.chart,
                type: 'bar',
                height: 350
            },
            // ... existing code ...
        };

        if (this.charts.products) {
            this.charts.products.updateOptions(options);
        } else {
            this.charts.products = new ApexCharts(
                document.querySelector("#productChart"), 
                options
            );
            this.charts.products.render();
        }
    }

    /**
     * Initialize geographic distribution chart
     */
    initializeGeographicChart(data) {
        const options = {
            ...this.chartOptions,
            series: data.series || [],
            chart: {
                ...this.chartOptions.chart,
                type: 'donut',
                height: 350
            },
            labels: data.labels || []
        };

        if (this.charts.geographic) {
            this.charts.geographic.updateOptions(options);
        } else {
            this.charts.geographic = new ApexCharts(
                document.querySelector("#geographicChart"), 
                options
            );
            this.charts.geographic.render();
        }
    }

    // Setup Event Listeners
    setupEventListeners() {
        // Chart filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                e.target.classList.add('active');
                
                // Update chart based on filter
                const filter = e.target.getAttribute('data-filter');
                this.updateChartData(filter);
            });
        });

        // Time range selector
        const timeRangeSelect = document.getElementById('timeRange');
        if (timeRangeSelect) {
            timeRangeSelect.addEventListener('change', (e) => {
                this.updateChartsForTimeRange(e.target.value);
            });
        }

        // Theme change listener
        document.addEventListener('themeChanged', (e) => {
            this.updateThemeForAllCharts(e.detail.theme);
        });

        /**
         * Setup event listeners for filters and interactions
         */
        // Time range selector
        const timeRangeSelector = document.querySelector('#timeRangeSelector');
        if (timeRangeSelector) {
            timeRangeSelector.addEventListener('change', async (e) => {
                this.currentTimeRange = e.target.value;
                await this.refreshAllCharts();
            });
        }

        // Filter selector
        const filterSelector = document.querySelector('#revenueFilterSelector');
        if (filterSelector) {
            filterSelector.addEventListener('change', async (e) => {
                this.currentFilter = e.target.value;
                await this.refreshRevenueChart();
            });
        }

        // Refresh button
        const refreshBtn = document.querySelector('[data-action="refresh-analytics"]');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshAllCharts());
        }

        // Export button
        const exportBtn = document.querySelector('[data-action="export-analytics"]');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportAnalytics());
        }
    }

    // Update Chart Data based on filter
    updateChartData(filter) {
        let newData, newTitle;
        
        switch (filter) {
            case 'revenue':
                newData = [44000, 55000, 57000, 56000, 61000, 58000, 63000, 60000, 66000, 67000, 69000, 73000];
                newTitle = 'Revenue Analytics';
                break;
            case 'orders':
                newData = [420, 550, 570, 560, 610, 580, 630, 600, 660, 670, 690, 730];
                newTitle = 'Order Analytics';
                break;
            case 'users':
                newData = [44, 55, 57, 56, 61, 58, 63, 60, 66, 67, 69, 73];
                newTitle = 'User Analytics';
                break;
            default:
                return;
        }

        // Update chart data
        this.charts.revenue.updateSeries([{
            name: filter.charAt(0).toUpperCase() + filter.slice(1),
            data: newData.map((value, index) => ({
                x: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index],
                y: value
            }))
        }]);

        // Update chart title
        document.querySelector('.chart-title').textContent = newTitle;
    }

    // Update Charts for Time Range
    updateChartsForTimeRange(timeRange) {
        
        // Simulate data update based on time range
        let multiplier = 1;
        switch (timeRange) {
            case '7d':
                multiplier = 0.3;
                break;
            case '30d':
                multiplier = 1;
                break;
            case '90d':
                multiplier = 2.5;
                break;
            case '1y':
                multiplier = 12;
                break;
        }

        // Update revenue chart
        const baseData = [44000, 55000, 57000, 56000, 61000, 58000, 63000, 60000, 66000, 67000, 69000, 73000];
        const newData = baseData.map(value => Math.round(value * multiplier));
        
        this.charts.revenue.updateSeries([{
            name: 'Revenue',
            data: newData.map((value, index) => ({
                x: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index],
                y: value
            }))
        }]);

        // Update user activity chart
        const baseUserData = [1247, 342, 156, 89];
        const newUserData = baseUserData.map(value => Math.round(value * multiplier * 0.1));
        this.charts.userActivity.updateSeries(newUserData);
    }

    // Update Theme for All Charts
    updateThemeForAllCharts(theme) {
        Object.keys(this.charts).forEach(chartKey => {
            this.charts[chartKey].updateOptions({
                theme: {
                    mode: theme
                },
                xaxis: {
                    labels: {
                        style: {
                            colors: this.getTextColor()
                        }
                    }
                },
                yaxis: {
                    labels: {
                        style: {
                            colors: this.getTextColor()
                        }
                    }
                },
                legend: {
                    labels: {
                        colors: this.getTextColor()
                    }
                },
                grid: {
                    borderColor: this.getBorderColor()
                },
                tooltip: {
                    theme: theme
                }
            });
        });
    }

    // Start Real-time Updates
    startRealTimeUpdates() {
        setInterval(() => {
            this.updateRealTimeData();
        }, 30000); // Update every 30 seconds
    }

    // Update Real-time Data
    updateRealTimeData() {
        // Simulate real-time data updates
        const currentTime = new Date();
        
        // Update metrics
        this.updateMetrics();
        
        // Add new activity
        this.addRealtimeActivity();
    }

    // Update Metrics
    updateMetrics() {
        const metrics = [
            { id: 'totalRevenue', baseValue: 284750, variance: 0.02 },
            { id: 'activeUsers', baseValue: 1847, variance: 0.01 },
            { id: 'orderVolume', baseValue: 3247, variance: 0.015 },
            { id: 'conversionRate', baseValue: 24.8, variance: 0.005, isPercentage: true }
        ];

        metrics.forEach(metric => {
            const element = document.getElementById(metric.id);
            if (element) {
                const change = (Math.random() - 0.5) * 2 * metric.variance;
                const newValue = metric.baseValue * (1 + change);
                
                if (metric.isPercentage) {
                    element.textContent = newValue.toFixed(1) + '%';
                } else if (metric.id === 'totalRevenue') {
                    element.textContent = '$' + Math.round(newValue).toLocaleString();
                } else {
                    element.textContent = Math.round(newValue).toLocaleString();
                }
            }
        });
    }

    // Add Real-time Activity
    addRealtimeActivity() {
        const activities = [
            {
                icon: 'las la-shopping-cart',
                iconClass: 'success',
                text: 'New order #' + Math.floor(Math.random() * 9999) + ' placed by <strong>Central Asian Traders</strong>',
                badge: '+$' + Math.floor(Math.random() * 5000 + 1000),
                badgeClass: 'success'
            },
            {
                icon: 'las la-user-plus',
                iconClass: 'primary',
                text: 'New company registration: <strong>Uzbek Export Hub</strong>',
                badge: 'NEW USER',
                badgeClass: 'primary'
            },
            {
                icon: 'las la-credit-card',
                iconClass: 'info',
                text: 'Payment processed for order #' + Math.floor(Math.random() * 9999),
                badge: 'PAID',
                badgeClass: 'success'
            }
        ];

        const randomActivity = activities[Math.floor(Math.random() * activities.length)];
        const activitiesList = document.getElementById('realtimeActivities');
        
        if (activitiesList) {
            const activityElement = document.createElement('div');
            activityElement.className = 'activity-item';
            activityElement.innerHTML = `
                <div class="activity-avatar ${randomActivity.iconClass}">
                    <i class="${randomActivity.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">
                        ${randomActivity.text}
                    </div>
                    <div class="activity-meta">
                        <span class="activity-badge ${randomActivity.badgeClass}">${randomActivity.badge}</span>
                        <span class="activity-time">Just now</span>
                    </div>
                </div>
            `;

            // Add animation
            activityElement.style.opacity = '0';
            activityElement.style.transform = 'translateY(-10px)';
            
            // Insert at the beginning
            activitiesList.insertBefore(activityElement, activitiesList.firstChild);
            
            // Animate in
            setTimeout(() => {
                activityElement.style.transition = 'all 0.3s ease';
                activityElement.style.opacity = '1';
                activityElement.style.transform = 'translateY(0)';
            }, 100);

            // Remove old activities if more than 10
            const activities = activitiesList.querySelectorAll('.activity-item');
            if (activities.length > 10) {
                activities[activities.length - 1].remove();
            }
        }
    }

    // Utility Methods
    getTextColor() {
        return document.documentElement.getAttribute('data-theme') === 'dark' ? '#94A3B8' : '#64748B';
    }

    getBorderColor() {
        return document.documentElement.getAttribute('data-theme') === 'dark' ? '#334155' : '#E2E8F0';
    }

    // Destroy all charts
    destroy() {
        Object.keys(this.charts).forEach(chartKey => {
            if (this.charts[chartKey]) {
                this.charts[chartKey].destroy();
            }
        });
        this.charts = {};
    }

    /**
     * Refresh all charts with new data
     */
    async refreshAllCharts() {
        try {
            this.showLoadingState();
            await this.fetchAllAnalyticsData();
            this.showToast('Analytics data refreshed successfully', 'success');
        } catch (error) {
            console.error('Error refreshing charts:', error);
            this.showToast('Failed to refresh analytics data', 'error');
        }
    }

    /**
     * Refresh revenue chart only
     */
    async refreshRevenueChart() {
        try {
            const revenueData = await this.fetchRevenueData();
            this.initializeRevenueChart(revenueData);
        } catch (error) {
            console.error('Error refreshing revenue chart:', error);
            this.showToast('Failed to refresh revenue data', 'error');
        }
    }

    /**
     * Update recent activities in the UI
     */
    updateRecentActivities(activities) {
        const container = document.querySelector('#recentActivitiesList');
        if (!container) return;
        
        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">
                    <i class="${activity.icon || 'fas fa-circle'}"></i>
                </div>
                <div class="activity-content">
                    <p class="activity-text">${activity.text}</p>
                    <span class="activity-time">${activity.time}</span>
                </div>
            </div>
        `).join('');
    }

    /**
     * Export analytics data
     */
    async exportAnalytics() {
        try {
            this.showToast('Preparing analytics report...', 'info');
            
            // In a real implementation, this would call a backend API
            // to generate a PDF or Excel report
            setTimeout(() => {
                this.showToast('Analytics report exported successfully!', 'success');
            }, 2000);
            
        } catch (error) {
            console.error('Export error:', error);
            this.showToast('Failed to export analytics', 'error');
        }
    }

    /**
     * Start real-time updates
     */
    startRealTimeUpdates() {
        // Update real-time data every 30 seconds
        this.realtimeInterval = setInterval(async () => {
            try {
                const response = await fetch(this.apiEndpoints.realtime);
                if (response.ok) {
                    const result = await response.json();
                    this.updateRealtimeMetrics(result.data);
                }
            } catch (error) {
                console.error('Realtime update error:', error);
            }
        }, 30000);
    }

    /**
     * Update real-time metrics
     */
    updateRealtimeMetrics(data) {
        // Update online users
        const onlineUsersEl = document.querySelector('[data-metric="onlineUsers"]');
        if (onlineUsersEl) onlineUsersEl.textContent = data.onlineUsers || 0;
        
        // Update active sessions
        const sessionsEl = document.querySelector('[data-metric="activeSessions"]');
        if (sessionsEl) sessionsEl.textContent = data.activeSessions || 0;
        
        // Update recent activities
        if (data.recentActivities) {
            this.updateRecentActivities(data.recentActivities);
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        document.querySelectorAll('.chart-container').forEach(container => {
            container.classList.add('loading');
        });
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        document.querySelectorAll('.chart-container').forEach(container => {
            container.classList.remove('loading');
        });
    }

    /**
     * Show error state
     */
    showErrorState(message) {
        this.hideLoadingState();
        this.showToast(message, 'error');
    }

    /**
     * Utility functions
     */
    formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    formatNumber(value) {
        return new Intl.NumberFormat('en-US').format(value);
    }

    showToast(message, type = 'info') {
        // Use existing toast system
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`${type}: ${message}`);
        }
    }
}

// Global Functions for Analytics Page
function exportAnalytics() {    
    // Show loading state
    const exportBtn = document.querySelector('button[onclick="exportAnalytics()"]');
    const originalText = exportBtn.innerHTML;
    exportBtn.innerHTML = '<i class="las la-spinner la-spin"></i> Exporting...';
    exportBtn.disabled = true;
    
    // Simulate export process
    setTimeout(() => {
        // Reset button
        exportBtn.innerHTML = originalText;
        exportBtn.disabled = false;
        
        // Show success message
        showToast('Analytics report exported successfully!', 'success');
    }, 2000);
}

function refreshAnalytics() {    
    // Show loading state
    const refreshBtn = document.querySelector('button[onclick="refreshAnalytics()"]');
    const originalText = refreshBtn.innerHTML;
    refreshBtn.innerHTML = '<i class="las la-spinner la-spin"></i> Refreshing...';
    refreshBtn.disabled = true;
    
    // Simulate refresh process
    setTimeout(() => {
        // Reset button
        refreshBtn.innerHTML = originalText;
        refreshBtn.disabled = false;
        
        // Refresh charts if analytics instance exists
        if (window.analyticsCharts) {
            window.analyticsCharts.updateRealTimeData();
        }
        
        // Show success message
        showToast('Analytics data refreshed!', 'success');
    }, 1500);
}

function pauseRealtime() {    
    const pauseBtn = document.querySelector('button[onclick="pauseRealtime()"]');
    const isCurrentlyPaused = pauseBtn.textContent.trim().includes('Resume');
    
    if (isCurrentlyPaused) {
        pauseBtn.innerHTML = '<i class="las la-pause"></i> Pause';
        showToast('Real-time updates resumed', 'info');
    } else {
        pauseBtn.innerHTML = '<i class="las la-play"></i> Resume';
        showToast('Real-time updates paused', 'warning');
    }
}

// Toast Notification Function
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="las la-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Initialize Analytics Charts when DOM is loaded
function initializeAnalyticsCharts() {
    if (document.querySelector('#revenueChart')) {
        window.analyticsCharts = new AnalyticsCharts();
    }
}

// Initialize Responsive Handlers
function initializeResponsiveHandlers() {
    // Mobile sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.admin-sidebar');
    const adminMain = document.querySelector('.admin-main');
    
    if (sidebarToggle && sidebar && adminMain) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('open');
            adminMain.classList.toggle('sidebar-open');
        });
        
        // Close sidebar when clicking outside on mobile
        adminMain.addEventListener('click', function(e) {
            if (window.innerWidth <= 1024 && 
                adminMain.classList.contains('sidebar-open') && 
                !sidebar.contains(e.target) && 
                !sidebarToggle.contains(e.target)) {
                sidebar.classList.remove('open');
                adminMain.classList.remove('sidebar-open');
            }
        });
    }
}

// Initialize Real-time Data
function initializeRealtimeData() {
    // Start with initial real-time activity simulation
    setTimeout(() => {
        if (window.analyticsCharts) {
            window.analyticsCharts.addRealtimeActivity();
        }
    }, 5000);
}

// Initialize Theme Toggle
function initializeThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    // Get current theme
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
    
    // Theme toggle event
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        // Update theme
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        
        // Dispatch theme change event
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: newTheme }
        }));
        
        // Update charts theme
        if (window.analyticsCharts) {
            window.analyticsCharts.updateThemeForAllCharts(newTheme);
        }
        
        showToast(`Switched to ${newTheme} mode`, 'info');
    });
}

// Update Theme Icon
function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        icon.className = theme === 'light' ? 'las la-moon' : 'las la-sun';
    }
}

// CSS for Toast Notifications
const toastStyles = `
    <style>
        .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            padding: 12px 16px;
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
        }
        
        .toast.show {
            transform: translateX(0);
        }
        
        .toast-content {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--text-primary);
            font-size: 14px;
        }
        
        .toast-success .toast-content i { color: var(--analytics-success); }
        .toast-warning .toast-content i { color: var(--analytics-warning); }
        .toast-info .toast-content i { color: var(--analytics-info); }
    </style>
`;

// Add toast styles to head
document.head.insertAdjacentHTML('beforeend', toastStyles);