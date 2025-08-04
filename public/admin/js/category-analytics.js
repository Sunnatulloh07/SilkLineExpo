/**
 * Category Analytics Dashboard - Professional JavaScript
 * SLEX B2B Digital Marketplace Platform
 * Senior Software Engineer Level Implementation
 * 
 * Features:
 * - Real-time category performance analytics
 * - Interactive charts and visualizations
 * - Hierarchical analysis and insights
 * - Business intelligence dashboard
 * - Advanced filtering and date ranges
 * - Export functionality
 */

class CategoryAnalytics {
    constructor() {
        this.dateRange = '30d';
        this.currentMetric = 'revenue';
        this.charts = {};
        this.data = {
            overview: {},
            performance: [],
            distribution: [],
            topCategories: [],
            hierarchy: {}
        };
        
        // API endpoints
        this.endpoints = {
            overview: '/admin/api/categories/analytics/overview',
            performance: '/admin/api/categories/analytics/performance',
            distribution: '/admin/api/categories/analytics/distribution',
            hierarchy: '/admin/api/categories/analytics/hierarchy',
            export: '/admin/api/categories/analytics/export'
        };

        console.log('✅ CategoryAnalytics initialized successfully');
    }

    /**
     * Initialize analytics dashboard
     */
    async init() {
        try {
            console.log('🚀 Initializing Category Analytics Dashboard...');
            
            this.setupEventListeners();
            await this.loadAllData();
            this.initializeCharts();
            
            console.log('✅ Category Analytics Dashboard initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing Category Analytics:', error);
            this.showError('Failed to initialize analytics dashboard');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Date range selector
        const dateRangeSelect = document.getElementById('dateRangeSelect');
        if (dateRangeSelect) {
            dateRangeSelect.addEventListener('change', (e) => {
                this.dateRange = e.target.value;
                this.refreshAllData();
            });
        }

        // Performance metric selector
        const performanceMetric = document.getElementById('performanceMetric');
        if (performanceMetric) {
            performanceMetric.addEventListener('change', (e) => {
                this.currentMetric = e.target.value;
                this.updatePerformanceChart();
            });
        }

        // Top categories metric selector
        const topCategoriesMetric = document.getElementById('topCategoriesMetric');
        if (topCategoriesMetric) {
            topCategoriesMetric.addEventListener('change', (e) => {
                this.loadTopCategories(e.target.value);
            });
        }
    }

    /**
     * Load all analytics data
     */
    async loadAllData() {
        try {
            this.showLoading(true);

            const [overviewData, performanceData, distributionData, hierarchyData] = await Promise.all([
                this.loadOverviewData(),
                this.loadPerformanceData(),
                this.loadDistributionData(),
                this.loadHierarchyData()
            ]);

            this.data.overview = overviewData;
            this.data.performance = performanceData;
            this.data.distribution = distributionData;
            this.data.hierarchy = hierarchyData;

            this.updateOverviewCards();
            this.updateHierarchyAnalysis();
            await this.loadTopCategories();

        } catch (error) {
            console.error('Error loading analytics data:', error);
            this.showError('Failed to load analytics data');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Load overview statistics
     */
    async loadOverviewData() {
        try {
            // Mock data for now - replace with actual API call
            return {
                totalCategories: 156,
                totalProducts: 3429,
                totalRevenue: 892456.78,
                totalManufacturers: 234,
                growth: {
                    categories: 12.5,
                    products: 18.3,
                    revenue: 22.1,
                    manufacturers: 8.7
                }
            };
        } catch (error) {
            console.error('Error loading overview data:', error);
            return {};
        }
    }

    /**
     * Load performance trends data
     */
    async loadPerformanceData() {
        try {
            // Mock data for now - replace with actual API call
            const labels = [];
            const revenueData = [];
            const productsData = [];
            const ordersData = [];

            // Generate mock data for the last 30 days
            for (let i = 29; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                
                revenueData.push(Math.floor(Math.random() * 50000) + 10000);
                productsData.push(Math.floor(Math.random() * 100) + 20);
                ordersData.push(Math.floor(Math.random() * 200) + 50);
            }

            return {
                labels,
                datasets: {
                    revenue: revenueData,
                    products: productsData,
                    orders: ordersData
                }
            };
        } catch (error) {
            console.error('Error loading performance data:', error);
            return { labels: [], datasets: {} };
        }
    }

    /**
     * Load distribution data
     */
    async loadDistributionData() {
        try {
            // Mock data for now - replace with actual API call
            return [
                { label: 'Electronics', value: 25.4, count: 45, color: '#3B82F6' },
                { label: 'Food & Beverages', value: 18.7, count: 32, color: '#10B981' },
                { label: 'Textiles & Clothing', value: 15.2, count: 28, color: '#8B5CF6' },
                { label: 'Machinery & Equipment', value: 12.8, count: 22, color: '#F59E0B' },
                { label: 'Chemicals', value: 11.3, count: 18, color: '#EF4444' },
                { label: 'Others', value: 16.6, count: 11, color: '#6B7280' }
            ];
        } catch (error) {
            console.error('Error loading distribution data:', error);
            return [];
        }
    }

    /**
     * Load hierarchy analysis data
     */
    async loadHierarchyData() {
        try {
            // Mock data for now - replace with actual API call
            return {
                level0: { count: 12, avgProducts: 285.7, avgRevenue: 74234.56 },
                level1: { count: 48, avgProducts: 71.4, avgRevenue: 18558.64 },
                deeper: { count: 96, avgProducts: 35.7, avgRevenue: 9279.32 }
            };
        } catch (error) {
            console.error('Error loading hierarchy data:', error);
            return {};
        }
    }

    /**
     * Load top categories data
     */
    async loadTopCategories(metric = 'revenue') {
        try {
            // Mock data for now - replace with actual API call
            const mockCategories = [
                {
                    rank: 1,
                    name: 'Consumer Electronics',
                    level: 1,
                    products: 342,
                    revenue: 156789.45,
                    manufacturers: 28,
                    growth: 24.5,
                    performance: 'high',
                    color: '#3B82F6'
                },
                {
                    rank: 2,
                    name: 'Food Processing',
                    level: 1,
                    products: 289,
                    revenue: 134567.89,
                    manufacturers: 34,
                    growth: 18.2,
                    performance: 'high',
                    color: '#10B981'
                },
                {
                    rank: 3,
                    name: 'Textile Manufacturing',
                    level: 0,
                    products: 234,
                    revenue: 98765.43,
                    manufacturers: 19,
                    growth: 15.7,
                    performance: 'medium',
                    color: '#8B5CF6'
                },
                {
                    rank: 4,
                    name: 'Industrial Machinery',
                    level: 1,
                    products: 198,
                    revenue: 87654.32,
                    manufacturers: 15,
                    growth: 12.3,
                    performance: 'medium',
                    color: '#F59E0B'
                },
                {
                    rank: 5,
                    name: 'Chemical Products',
                    level: 2,
                    products: 156,
                    revenue: 76543.21,
                    manufacturers: 22,
                    growth: 9.8,
                    performance: 'medium',
                    color: '#EF4444'
                }
            ];

            this.renderTopCategoriesTable(mockCategories);
            return mockCategories;
        } catch (error) {
            console.error('Error loading top categories:', error);
            this.renderTopCategoriesTable([]);
            return [];
        }
    }

    /**
     * Initialize all charts
     */
    initializeCharts() {
        this.initializePerformanceChart();
        this.initializeDistributionChart();
    }

    /**
     * Initialize performance chart
     */
    initializePerformanceChart() {
        const ctx = document.getElementById('categoryPerformanceChart');
        if (!ctx) return;

        this.charts.performance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.data.performance.labels || [],
                datasets: [{
                    label: 'Revenue ($)',
                    data: this.data.performance.datasets?.revenue || [],
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                if (context.datasetIndex === 0) {
                                    return `Revenue: $${value.toLocaleString()}`;
                                }
                                return `${context.dataset.label}: ${value.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Value'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    /**
     * Initialize distribution chart
     */
    initializeDistributionChart() {
        const ctx = document.getElementById('categoryDistributionChart');
        if (!ctx) return;

        const distributionData = this.data.distribution || [];

        this.charts.distribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: distributionData.map(item => item.label),
                datasets: [{
                    data: distributionData.map(item => item.value),
                    backgroundColor: distributionData.map(item => item.color),
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            generateLabels: function(chart) {
                                const data = chart.data;
                                return data.labels.map((label, index) => {
                                    const value = data.datasets[0].data[index];
                                    const count = distributionData[index]?.count || 0;
                                    return {
                                        text: `${label} (${value}% - ${count} categories)`,
                                        fillStyle: data.datasets[0].backgroundColor[index],
                                        hidden: false,
                                        index: index
                                    };
                                });
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const item = distributionData[context.dataIndex];
                                return `${item.label}: ${item.value}% (${item.count} categories)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Update performance chart with selected metric
     */
    updatePerformanceChart() {
        if (!this.charts.performance) return;

        const chart = this.charts.performance;
        const datasets = this.data.performance.datasets || {};
        
        let label, data, color;
        
        switch (this.currentMetric) {
            case 'products':
                label = 'Products';
                data = datasets.products || [];
                color = '#10B981';
                break;
            case 'orders':
                label = 'Orders';
                data = datasets.orders || [];
                color = '#F59E0B';
                break;
            default:
                label = 'Revenue ($)';
                data = datasets.revenue || [];
                color = '#3B82F6';
        }

        chart.data.datasets[0] = {
            label: label,
            data: data,
            borderColor: color,
            backgroundColor: color + '20',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        };

        chart.update('active');
    }

    /**
     * Update overview cards
     */
    updateOverviewCards() {
        const overview = this.data.overview;
        
        // Update values
        this.updateElementText('totalCategoriesAnalytics', overview.totalCategories?.toLocaleString() || '0');
        this.updateElementText('totalProductsAnalytics', overview.totalProducts?.toLocaleString() || '0');
        this.updateElementText('totalRevenueAnalytics', '$' + (overview.totalRevenue?.toLocaleString() || '0'));
        this.updateElementText('totalManufacturersAnalytics', overview.totalManufacturers?.toLocaleString() || '0');
        
        // Update growth percentages
        if (overview.growth) {
            this.updateElementText('categoriesGrowth', '+' + (overview.growth.categories || 0) + '%');
            this.updateElementText('productsGrowth', '+' + (overview.growth.products || 0) + '%');
            this.updateElementText('revenueGrowth', '+' + (overview.growth.revenue || 0) + '%');
            this.updateElementText('manufacturersGrowth', '+' + (overview.growth.manufacturers || 0) + '%');
        }
    }

    /**
     * Update hierarchy analysis
     */
    updateHierarchyAnalysis() {
        const hierarchy = this.data.hierarchy;
        
        if (hierarchy.level0) {
            this.updateElementText('level0Count', hierarchy.level0.count);
            this.updateElementText('level0AvgProducts', Math.round(hierarchy.level0.avgProducts));
            this.updateElementText('level0AvgRevenue', '$' + Math.round(hierarchy.level0.avgRevenue).toLocaleString());
        }
        
        if (hierarchy.level1) {
            this.updateElementText('level1Count', hierarchy.level1.count);
            this.updateElementText('level1AvgProducts', Math.round(hierarchy.level1.avgProducts));
            this.updateElementText('level1AvgRevenue', '$' + Math.round(hierarchy.level1.avgRevenue).toLocaleString());
        }
        
        if (hierarchy.deeper) {
            this.updateElementText('deeperLevelsCount', hierarchy.deeper.count);
            this.updateElementText('deeperLevelsAvgProducts', Math.round(hierarchy.deeper.avgProducts));
            this.updateElementText('deeperLevelsAvgRevenue', '$' + Math.round(hierarchy.deeper.avgRevenue).toLocaleString());
        }
    }

    /**
     * Render top categories table
     */
    renderTopCategoriesTable(categories) {
        const tableBody = document.getElementById('topCategoriesTableBody');
        if (!tableBody) return;

        if (categories.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4">
                        <div class="empty-state">
                            <i class="las la-chart-bar text-muted" style="font-size: 3rem;"></i>
                            <p class="text-muted mt-2">No category data available</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = categories.map(category => `
            <tr class="category-row">
                <td class="rank-cell">
                    <div class="rank-badge rank-${category.rank}">
                        ${category.rank}
                    </div>
                </td>
                <td class="category-cell">
                    <div class="category-info">
                        <div class="category-color" style="background-color: ${category.color}"></div>
                        <div class="category-details">
                            <div class="category-name">${this.escapeHtml(category.name)}</div>
                            <div class="category-level">Level ${category.level}</div>
                        </div>
                    </div>
                </td>
                <td class="level-cell">
                    <span class="level-badge level-${category.level}">
                        Level ${category.level}
                    </span>
                </td>
                <td class="products-cell">
                    <div class="metric-value">${category.products.toLocaleString()}</div>
                </td>
                <td class="revenue-cell">
                    <div class="metric-value">$${category.revenue.toLocaleString()}</div>
                </td>
                <td class="manufacturers-cell">
                    <div class="metric-value">${category.manufacturers}</div>
                </td>
                <td class="growth-cell">
                    <div class="growth-indicator ${category.growth >= 0 ? 'positive' : 'negative'}">
                        <i class="las la-arrow-${category.growth >= 0 ? 'up' : 'down'}"></i>
                        ${Math.abs(category.growth)}%
                    </div>
                </td>
                <td class="performance-cell">
                    <span class="performance-badge performance-${category.performance}">
                        ${this.capitalizeFirst(category.performance)}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Refresh all analytics data
     */
    async refreshAllData() {
        await this.loadAllData();
        
        // Update charts
        if (this.charts.performance) {
            this.charts.performance.data.labels = this.data.performance.labels;
            this.updatePerformanceChart();
        }
        
        if (this.charts.distribution) {
            const distributionData = this.data.distribution || [];
            this.charts.distribution.data.labels = distributionData.map(item => item.label);
            this.charts.distribution.data.datasets[0].data = distributionData.map(item => item.value);
            this.charts.distribution.data.datasets[0].backgroundColor = distributionData.map(item => item.color);
            this.charts.distribution.update('active');
        }
    }

    /**
     * Export analytics report
     */
    async exportReport() {
        try {
            this.showNotification('Preparing analytics report...', 'info');
            
            // Mock export functionality
            setTimeout(() => {
                this.showNotification('Analytics report exported successfully', 'success');
            }, 2000);
            
        } catch (error) {
            console.error('Error exporting report:', error);
            this.showError('Failed to export analytics report');
        }
    }

    /**
     * Utility Methods
     */
    updateElementText(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    }

    showLoading(show) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            if (show) {
                loadingOverlay.classList.remove('d-none');
            } else {
                loadingOverlay.classList.add('d-none');
            }
        }
    }

    showNotification(message, type = 'info') {
        // Create or update notification
        let notification = document.getElementById('analytics-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'analytics-notification';
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
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (typeof CategoryAnalytics !== 'undefined') {
        window.categoryAnalytics = new CategoryAnalytics();
        // Note: init() will be called from the EJS template
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CategoryAnalytics;
}