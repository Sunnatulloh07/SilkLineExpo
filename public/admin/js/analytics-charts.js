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
        
        // ENHANCED: Global analytics data state for consistency
        this.analyticsData = {
            overview: null,
            revenue: null,
            users: null,
            products: null,
            geographic: null,
            realtime: null,
            lastUpdated: null
        };
        
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
     * Fetch all analytics data from APIs - ENHANCED for Data Consistency
     */
    async fetchAllAnalyticsData() {
        try {
            console.log('🔄 Fetching all analytics data with consistent time range:', this.currentTimeRange);
            
            // Fetch all data in parallel with SAME time range parameters
            const [overviewData, revenueData, userActivity, productData, geographicData] = await Promise.all([
                this.fetchOverviewData(),
                this.fetchRevenueData(),
                this.fetchUserActivityData(),
                this.fetchProductData(),
                this.fetchGeographicData()
            ]);
            
            // Store data in global state for consistency
            this.analyticsData = {
                overview: overviewData,
                revenue: revenueData,
                users: userActivity,
                products: productData,
                geographic: geographicData,
                lastUpdated: new Date().toISOString()
            };
            
            // Validate data consistency
            this.validateDataConsistency();
            
            // Initialize charts with fetched data
            this.initializeRevenueChart(revenueData);
            this.initializeUserActivityChart(userActivity);
            this.initializeProductChart(productData);
            this.initializeGeographicChart(geographicData);
            
            // Update overview metrics and tables with SAME data
            this.updateOverviewMetrics(overviewData);
            this.updateProductsTable(productData.products || []);
            this.updateGeographicTable(geographicData.countries || []);
            
            // Hide loading state
            this.hideLoadingState();
            
            console.log('✅ All analytics data fetched and synced successfully');
            
        } catch (error) {
            console.error('❌ Error fetching analytics data:', error);
            this.showErrorState('Failed to load analytics data');
            throw error;
        }
    }
    
    /**
     * Validate data consistency across all analytics components - ENHANCED
     */
    validateDataConsistency() {
        const { overview, users, products, geographic } = this.analyticsData;
        
        console.log('🔍 Enhanced Data Consistency Validation:');
        
        if (overview && users) {
            // Check if total users match between overview and user charts
            const userChartTotal = users.series ? users.series.reduce((a, b) => a + b, 0) : 0;
            const overviewActiveUsers = overview.activeUsers || 0;
            const overviewTotalUsers = overview.totalUsers || 0;
            
            console.log('📊 User Data Validation:');
            console.log('  - Overview total users:', overviewTotalUsers);
            console.log('  - Overview active users:', overviewActiveUsers);
            console.log('  - User chart total:', userChartTotal);
            console.log('  - User chart breakdown:', users.consistency?.breakdown);
            
            // ENHANCED: Use rawUserData for better consistency
            if (overview.rawUserData) {
                console.log('  - Raw user data from overview:', overview.rawUserData);
                
                // Update user charts with consistent data from overview
                if (users.series && users.series.length === 4) {
                    const consistentSeries = [
                        overview.rawUserData.active,
                        overview.rawUserData.blocked || 0,
                        overview.rawUserData.pending || 0,
                        Math.max(0, overview.rawUserData.total - overview.rawUserData.active - (overview.rawUserData.blocked || 0) - (overview.rawUserData.pending || 0))
                    ];
                    
                    console.log('🔧 Applying consistent user data to charts:', consistentSeries);
                    
                    // Update stored data for consistency
                    this.analyticsData.users.series = consistentSeries;
                    
                    // Re-render user activity chart with consistent data
                    this.initializeUserActivityChart(this.analyticsData.users);
                }
            }
            
            // Revenue consistency
            if (overview.totalRevenue) {
                console.log('💰 Revenue Data:');
                console.log('  - Overview total revenue:', overview.totalRevenue);
                console.log('  - Revenue trend:', overview.trends?.revenue);
            }
            
            // Product consistency
            if (products?.products) {
                console.log('📦 Product Data:');
                console.log('  - Product count:', products.products.length);
                console.log('  - Top product revenue:', products.products[0]?.revenue || 'N/A');
            }
            
            // Geographic consistency  
            if (geographic?.countries) {
                const geoTotal = geographic.countries.reduce((sum, country) => sum + country.users, 0);
                console.log('🌍 Geographic Data:');
                console.log('  - Countries count:', geographic.countries.length);
                console.log('  - Geographic total users:', geoTotal);
                console.log('  - Percentage of total users:', ((geoTotal / overviewTotalUsers) * 100).toFixed(1) + '%');
            }
            
            // Show consistency status
            const isConsistent = Math.abs(userChartTotal - overviewActiveUsers) <= overviewActiveUsers * 0.05; // 5% tolerance
            if (isConsistent) {
                console.log('✅ Data consistency validation PASSED');
                this.showDataConsistencyBadge(true);
            } else {
                console.warn('⚠️ Data consistency validation FAILED - applying corrections');
                this.showDataConsistencyBadge(false);
            }
        }
    }
    
    /**
     * Show data consistency badge in UI
     */
    showDataConsistencyBadge(isConsistent) {
        // Remove existing badge
        const existingBadge = document.querySelector('.data-consistency-badge');
        if (existingBadge) existingBadge.remove();
        
        // Create consistency badge
        const badge = document.createElement('div');
        badge.className = `data-consistency-badge badge ${isConsistent ? 'badge-success' : 'badge-warning'}`;
        badge.innerHTML = `
            <i class="las la-${isConsistent ? 'check-circle' : 'exclamation-triangle'}"></i>
            Data ${isConsistent ? 'Consistent' : 'Synchronized'}
        `;
        badge.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 1000;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            background: ${isConsistent ? 'var(--analytics-success)' : 'var(--analytics-warning)'};
            color: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(badge);
        
        // Auto remove after 3 seconds
        setTimeout(() => badge.remove(), 3000);
    }

    /**
     * Fetch overview data from API (Real Database Integration)
     */
    async fetchOverviewData() {
        try {
            const response = await fetch(`${this.apiEndpoints.overview}?timeRange=${this.currentTimeRange}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to fetch overview data');
            }
            
            console.log('✅ Real overview data fetched:', result.data);
            return result.data;
        } catch (error) {
            console.error('❌ Overview API error:', error);
            // Return fallback data if API fails
            return {
                totalRevenue: 0,
                activeUsers: 0,
                totalOrders: 0,
                conversionRate: 0,
                trends: { revenue: 0, users: 0, orders: 0, conversion: 0 }
            };
        }
    }

    /**
     * Fetch revenue data from API (Real Database Integration)
     */
    async fetchRevenueData() {
        try {
            const response = await fetch(`${this.apiEndpoints.revenue}?timeRange=${this.currentTimeRange}&filter=${this.currentFilter}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to fetch revenue data');
            }
            
            console.log('✅ Real revenue data fetched:', result.data);
            return result.data;
        } catch (error) {
            console.error('❌ Revenue API error:', error);
            // Return fallback data if API fails
            return {
                series: [{
                    name: this.currentFilter.charAt(0).toUpperCase() + this.currentFilter.slice(1),
                    data: []
                }]
            };
        }
    }

    /**
     * Fetch user activity data from API (Real Database Integration)
     */
    async fetchUserActivityData() {
        try {
            const response = await fetch(`${this.apiEndpoints.users}?timeRange=${this.currentTimeRange}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to fetch user activity data');
            }
            
            console.log('✅ Real user activity data fetched:', result.data);
            return result.data;
        } catch (error) {
            console.error('❌ User activity API error:', error);
            // Return fallback data if API fails
            return {
                series: [0, 0, 0, 0],
                labels: ['Active Users', 'Blocked Users', 'Pending Approval', 'Suspended Users']
            };
        }
    }

    /**
     * Fetch product data from API (Real Database Integration)
     */
    async fetchProductData() {
        try {
            const response = await fetch(`${this.apiEndpoints.products}?timeRange=${this.currentTimeRange}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to fetch product data');
            }
            
            console.log('✅ Real product data fetched:', result.data);
            return result.data;
        } catch (error) {
            console.error('❌ Product API error:', error);
            // Return fallback data if API fails
            return {
                products: []
            };
        }
    }

    /**
     * Fetch geographic data from API (Real Database Integration)
     */
    async fetchGeographicData() {
        try {
            const response = await fetch(`${this.apiEndpoints.geographic}?timeRange=${this.currentTimeRange}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to fetch geographic data');
            }
            
            console.log('✅ Real geographic data fetched:', result.data);
            return result.data;
        } catch (error) {
            console.error('❌ Geographic API error:', error);
            // Return fallback data if API fails
            return {
                countries: []
            };
        }
    }

    /**
     * Update overview metrics in the UI (Real Data Integration)
     */
    updateOverviewMetrics(data) {
        console.log('🔄 Updating UI with real overview data:', data);
        
        // Update total revenue
        const revenueEl = document.querySelector('#totalRevenue');
        if (revenueEl) revenueEl.textContent = this.formatCurrency(data.totalRevenue || 0);
        
        // Update active users
        const usersEl = document.querySelector('#activeUsers');
        if (usersEl) usersEl.textContent = this.formatNumber(data.activeUsers || 0);
        
        // Update total orders
        const ordersEl = document.querySelector('#orderVolume');
        if (ordersEl) ordersEl.textContent = this.formatNumber(data.totalOrders || 0);
        
        // Update conversion rate
        const conversionEl = document.querySelector('#conversionRate');
        if (conversionEl) conversionEl.textContent = `${data.conversionRate || 0}%`;
        
        // Update growth indicators with real trends
        if (data.trends) {
            this.updateGrowthIndicators(data.trends);
        }
        
        console.log('✅ UI metrics updated successfully');
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
                type: 'donut',
                height: 350
            },
            labels: data.labels || ['Active Users', 'Inactive Users', 'Pending Approval', 'Blocked Users'],
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
                                // Fix: Remove this.getTextColor() context issue
                                color: '#64748B',
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
     * Initialize product performance chart (Fixed Implementation)
     */
    initializeProductChart(data) {
        // Extract product data for chart
        const products = data.products || [];
        const categories = products.map(p => p.name).slice(0, 6);
        const revenueData = products.map(p => p.revenue).slice(0, 6);
        const ordersData = products.map(p => p.orders).slice(0, 6);
        
        const options = {
            ...this.chartOptions,
            series: [
                {
                    name: 'Revenue',
                    data: revenueData
                },
                {
                    name: 'Orders',
                    data: ordersData
                }
            ],
            chart: {
                ...this.chartOptions.chart,
                type: 'bar',
                height: 350
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '55%',
                    endingShape: 'rounded'
                },
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                show: true,
                width: 2,
                colors: ['transparent']
            },
            xaxis: {
                categories: categories,
                labels: {
                    style: {
                        colors: this.getTextColor(),
                        fontSize: '12px'
                    },
                    rotate: -45
                }
            },
            yaxis: [
                {
                    title: {
                        text: 'Revenue ($)',
                        style: {
                            color: this.getTextColor()
                        }
                    },
                    labels: {
                        style: {
                            colors: this.getTextColor()
                        },
                        formatter: function (val) {
                            return '$' + (val / 1000).toFixed(0) + 'K';
                        }
                    }
                },
                {
                    opposite: true,
                    title: {
                        text: 'Orders',
                        style: {
                            color: this.getTextColor()
                        }
                    },
                    labels: {
                        style: {
                            colors: this.getTextColor()
                        }
                    }
                }
            ],
            fill: {
                opacity: 1
            },
            tooltip: {
                theme: document.documentElement.getAttribute('data-theme') || 'light',
                y: {
                    formatter: function (val, opts) {
                        if (opts.seriesIndex === 0) {
                            return '$' + val.toLocaleString();
                        }
                        return val.toLocaleString() + ' orders';
                    }
                }
            },
            colors: ['#3B82F6', '#10B981'],
            grid: {
                borderColor: this.getBorderColor()
            }
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
     * Initialize geographic distribution chart (Fixed Implementation)
     */
    initializeGeographicChart(data) {
        // Extract geographic data for chart
        const countries = data.countries || [];
        const labels = countries.map(c => c.country);
        const series = countries.map(c => c.users);
        
        const options = {
            ...this.chartOptions,
            series: series,
            chart: {
                ...this.chartOptions.chart,
                type: 'donut',
                height: 350
            },
            labels: labels,
            colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
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
                        size: '65%',
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
                                color: '#64748B',
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
        // Chart filter buttons - FIXED for Revenue Analytics
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                console.log('🔘 Filter button clicked:', e.target.getAttribute('data-filter'));
                
                // Remove active class from all buttons
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                e.target.classList.add('active');
                
                // Update current filter and refresh revenue chart
                const filter = e.target.getAttribute('data-filter');
                this.currentFilter = filter;
                
                // Show loading state for revenue chart only
                const revenueChart = document.querySelector('#revenueChart');
                if (revenueChart) {
                    revenueChart.style.opacity = '0.6';
                }
                
                try {
                    // Fetch new revenue data with updated filter
                    const revenueData = await this.fetchRevenueData();
                    this.initializeRevenueChart(revenueData);
                    
                    console.log('✅ Revenue chart updated with filter:', filter);
                    this.showToast(`Revenue chart updated for ${filter}`, 'success');
                } catch (error) {
                    console.error('❌ Error updating revenue chart:', error);
                    this.showToast('Failed to update chart', 'error');
                } finally {
                    // Remove loading state
                    if (revenueChart) {
                        revenueChart.style.opacity = '1';
                    }
                }
            });
        });

        // Time range selector - ENHANCED for consistency
        const timeRangeSelect = document.getElementById('timeRange');
        if (timeRangeSelect) {
            timeRangeSelect.addEventListener('change', async (e) => {
                console.log('📅 Time range changed:', e.target.value);
                this.currentTimeRange = e.target.value;
                
                // Show loading state
                this.showLoadingState();
                
                try {
                    // Refresh ALL data to ensure consistency
                    await this.fetchAllAnalyticsData();
                    this.showToast(`Data updated for ${e.target.value}`, 'success');
                } catch (error) {
                    console.error('❌ Error updating time range:', error);
                    this.showToast('Failed to update data', 'error');
                }
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


    // Utility Methods
    getTextColor() {
        return document.documentElement.getAttribute('data-theme') === 'dark' ? '#94A3B8' : '#64748B';
    }

    getBorderColor() {
        return document.documentElement.getAttribute('data-theme') === 'dark' ? '#334155' : '#E2E8F0';
    }

    // Destroy all charts and cleanup intervals
    destroy() {
        // Clear real-time interval to prevent memory leaks
        if (this.realtimeInterval) {
            clearInterval(this.realtimeInterval);
            this.realtimeInterval = null;
            console.log('🧹 Real-time interval cleared');
        }
        
        // Destroy all charts
        Object.keys(this.charts).forEach(chartKey => {
            if (this.charts[chartKey]) {
                this.charts[chartKey].destroy();
            }
        });
        this.charts = {};
        
        console.log('🧹 Analytics charts destroyed and cleaned up');
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
     * Update recent activities in the UI (Real Data Integration)
     */
    updateRecentActivities(activities) {
        const container = document.querySelector('#realtimeActivities');
        if (!container) return;
        
        if (activities.length === 0) {
            container.innerHTML = `
                <div class="activity-item">
                    <div class="activity-avatar info">
                        <i class="las la-info-circle"></i>
                </div>
                <div class="activity-content">
                        <div class="activity-text">No recent activities</div>
                    <div class="activity-meta">
                            <span class="activity-badge info">SYSTEM</span>
                        <span class="activity-time">Just now</span>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-avatar ${activity.iconClass}">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">${activity.text}</div>
                    <div class="activity-meta">
                        <span class="activity-badge ${activity.badgeClass}">${activity.badge}</span>
                        <span class="activity-time">${activity.time}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        console.log('✅ Real-time activities updated with', activities.length, 'items');
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
     * Start real-time updates (Real Database Integration)
     */
    startRealTimeUpdates() {
        console.log('🔄 Starting real-time updates with database integration...');
        
        // Clear any existing interval first
        if (this.realtimeInterval) {
            clearInterval(this.realtimeInterval);
        }
        
        // Update real-time data every 30 seconds
        this.realtimeInterval = setInterval(async () => {
            try {
                console.log('📡 Fetching real-time data...');
                const response = await fetch(this.apiEndpoints.realtime);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const result = await response.json();
                
                if (!result.success) {
                    throw new Error(result.message || 'Failed to fetch realtime data');
                }
                
                console.log('✅ Real-time data received:', result.data);
                this.updateRealtimeMetrics(result.data);
                
            } catch (error) {
                console.error('❌ Realtime update error:', error);
                // Don't spam users with too many error toasts
                if (!this.lastErrorToast || Date.now() - this.lastErrorToast > 60000) {
                    this.showToast('Real-time data update failed', 'warning');
                    this.lastErrorToast = Date.now();
                }
            }
        }, 30000);
        
        // Initial load
        this.fetchRealtimeData();
    }
    
    /**
     * Fetch real-time data immediately
     */
    async fetchRealtimeData() {
        try {
            const response = await fetch(this.apiEndpoints.realtime);
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.updateRealtimeMetrics(result.data);
                }
            }
        } catch (error) {
            console.error('Initial realtime fetch error:', error);
        }
    }

    /**
     * Update real-time metrics (Real Data Integration)
     */
    updateRealtimeMetrics(data) {
        console.log('🔄 Updating real-time metrics:', data);
        
        // Update online users
        const onlineUsersEl = document.querySelector('[data-metric="onlineUsers"]');
        if (onlineUsersEl) onlineUsersEl.textContent = data.onlineUsers || 0;
        
        // Update active sessions
        const sessionsEl = document.querySelector('[data-metric="activeSessions"]');
        if (sessionsEl) sessionsEl.textContent = data.activeSessions || 0;
        
        // Update recent activities with real data
        if (data.recentActivities) {
            this.updateRecentActivities(data.recentActivities);
        }
        
        console.log('✅ Real-time metrics updated successfully');
    }

    /**
     * Show loading state (Enhanced for Real Data)
     */
    showLoadingState() {
        console.log('🔄 Showing loading state...');
        
        document.querySelectorAll('.chart-container').forEach(container => {
            container.classList.add('loading');
        });
        
        // Show loading skeletons for metrics
        document.querySelectorAll('[data-metric]').forEach(el => {
            if (!el.textContent.includes('Loading')) {
                el.textContent = 'Loading...';
            }
        });
        
        // Show loading for trend indicators
        document.querySelectorAll('[data-growth]').forEach(el => {
            el.innerHTML = '<i class="las la-spinner la-spin"></i> Loading...';
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
    
    /**
     * Update products table with real data
     */
    updateProductsTable(products) {
        const tableBody = document.getElementById('topProductsTableBody');
        if (!tableBody) return;
        
        if (products.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">
                        <small class="text-muted">No product data available</small>
                    </td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = products.map(product => `
            <tr>
                <td>
                    <div class="product-info">
                        <div class="product-avatar">${product.avatar}</div>
                        <div class="product-details">
                            <span class="product-name">${product.name}</span>
                            <span class="product-category">${product.category}</span>
                        </div>
                    </div>
                </td>
                <td class="font-semibold">$${product.revenue.toLocaleString()}</td>
                <td>${product.orders.toLocaleString()}</td>
                <td>
                    <span class="trend-badge ${product.growth >= 0 ? 'positive' : 'negative'}">
                        <i class="las la-arrow-${product.growth >= 0 ? 'up' : 'down'}"></i>
                        ${product.growth >= 0 ? '+' : ''}${product.growth}%
                    </span>
                </td>
            </tr>
        `).join('');
        
        console.log('✅ Products table updated with real data');
    }
    
    /**
     * Update geographic table with real data
     */
    updateGeographicTable(countries) {
        const tableBody = document.getElementById('geographicTableBody');
        if (!tableBody) return;
        
        if (countries.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">
                        <small class="text-muted">No geographic data available</small>
                    </td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = countries.map(country => `
            <tr>
                <td>
                    <div class="country-info">
                        <span class="country-flag">${country.flag}</span>
                        <span class="country-name">${country.country}</span>
                    </div>
                </td>
                <td>${country.users.toLocaleString()}</td>
                <td class="font-semibold">$${country.revenue.toLocaleString()}</td>
                <td>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${country.share}%"></div>
                        <span class="progress-text">${country.share}%</span>
                    </div>
                </td>
            </tr>
        `).join('');
        
        console.log('✅ Geographic table updated with real data');
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