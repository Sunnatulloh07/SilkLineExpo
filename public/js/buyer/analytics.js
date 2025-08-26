/**
 * Buyer Analytics JavaScript
 */
class BuyerAnalytics {
    constructor() {
        this.apiBase = '/distributor/api';
        this.charts = {};
        this.init();
    }

    init() {
        this.loadAnalyticsData();
        this.setupEventListeners();
    }

    async loadAnalyticsData() {
        try {
            const response = await fetch(`${this.apiBase}/buyer-analytics`);
            const result = await response.json();
            
            if (result.success) {
                this.initializeCharts(result.data);
                this.updateTopSuppliers(result.data.topSuppliers);
                this.updateDeliveryMetrics(result.data.deliveryPerformance);
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }

    initializeCharts(data) {
        this.initSpendingTrendsChart(data.spendingTrends);
        this.initCategoryChart(data.categoryDistribution);
        this.initDeliveryChart(data.deliveryPerformance);
    }

    initSpendingTrendsChart(data) {
        const canvas = document.getElementById('spendingTrendsChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (this.charts.spending) this.charts.spending.destroy();

        this.charts.spending = new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { callback: value => '$' + (value / 1000) + 'K' }
                    }
                }
            }
        });
    }

    initCategoryChart(data) {
        const canvas = document.getElementById('categoryDistributionChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (this.charts.category) this.charts.category.destroy();

        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    initDeliveryChart(data) {
        const canvas = document.getElementById('deliveryPerformanceChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (this.charts.delivery) this.charts.delivery.destroy();

        this.charts.delivery = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['On Time', 'Early', 'Delayed'],
                datasets: [{
                    data: [data.onTime, data.early, data.delayed],
                    backgroundColor: ['#10b981', '#06b6d4', '#f59e0b']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    updateTopSuppliers(suppliers) {
        const container = document.getElementById('topSuppliersList');
        if (!container) return;

        const loader = container.querySelector('.loading-placeholder');
        if (loader) loader.remove();

        container.innerHTML = suppliers.map((supplier, index) => `
            <div class="supplier-rank-item">
                <div class="supplier-rank ${index < 3 ? 'top-3' : ''}">${index + 1}</div>
                <div class="supplier-rank-info">
                    <div class="supplier-rank-name">${supplier.name}</div>
                    <div class="supplier-rank-category">${supplier.category}</div>
                </div>
                <div class="supplier-rank-spend">
                    ${this.formatCurrency(supplier.spend)}
                    <div class="supplier-rank-change ${supplier.change > 0 ? 'positive' : 'negative'}">
                        ${supplier.change > 0 ? '+' : ''}${supplier.change}%
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateDeliveryMetrics(metrics) {
        document.getElementById('onTimeRate').textContent = metrics.onTime + '%';
        document.getElementById('earlyRate').textContent = metrics.early + '%';
        document.getElementById('delayedRate').textContent = metrics.delayed + '%';
    }

    setupEventListeners() {
        // Period filter for spending chart
        const periodFilter = document.getElementById('spendingPeriodFilter');
        if (periodFilter) {
            periodFilter.addEventListener('change', () => {
                this.loadAnalyticsData();
            });
        }

        // Category chart toggle
        const categoryToggle = document.getElementById('categoryChartToggle');
        if (categoryToggle) {
            categoryToggle.addEventListener('click', () => {
                this.toggleCategoryChartType();
            });
        }

        // Top suppliers filter
        const suppliersFilter = document.getElementById('topSuppliersFilter');
        if (suppliersFilter) {
            suppliersFilter.addEventListener('change', () => {
                this.loadAnalyticsData();
            });
        }
    }

    toggleCategoryChartType() {
        if (this.charts.category) {
            const newType = this.charts.category.config.type === 'doughnut' ? 'bar' : 'doughnut';
            this.charts.category.config.type = newType;
            this.charts.category.update();
        }
    }

    formatCurrency(amount) {
        if (amount >= 1000000) return '$' + (amount / 1000000).toFixed(1) + 'M';
        if (amount >= 1000) return '$' + (amount / 1000).toFixed(0) + 'K';
        return '$' + amount.toLocaleString();
    }
}

// Global functions
window.exportReport = () => {
    console.log('Exporting analytics report');
};

window.scheduleReport = () => {
    console.log('Scheduling report');
};

window.runPriceAnalysis = () => {
    console.log('Running price analysis');
};

window.refreshMarketData = () => {
    console.log('Refreshing market data');
};

window.generateRecommendations = () => {
    console.log('Generating AI recommendations');
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.buyerAnalytics = new BuyerAnalytics();
});