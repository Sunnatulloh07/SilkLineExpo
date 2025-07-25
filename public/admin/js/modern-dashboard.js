/**
 * SLEX Modern Dashboard - Interactive dashboard functionality
 * Handles charts, real-time data updates, and dashboard-specific interactions
 * Optimized for 2024+ design standards with modern data visualization
 */

class ModernDashboard {
    constructor() {
        this.charts = {};
        this.updateInterval = null;
        this.init();
    }

    init() {
        this.initializeCharts();
        this.bindEvents();
        this.startRealTimeUpdates();
        this.initializeAnimations();
    }

    bindEvents() {
        // Metric card interactions
        document.querySelectorAll('.metric-card').forEach(card => {
            card.addEventListener('mouseenter', () => this.animateMetricCard(card));
        });

        // Quick action interactions
        document.querySelectorAll('.quick-action-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleQuickAction(e, item));
        });

        // Chart period selectors
        document.querySelectorAll('[data-period]').forEach(btn => {
            btn.addEventListener('click', () => this.handlePeriodChange(btn));
        });

        // Activity item actions
        document.querySelectorAll('.activity-item .btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleActivityAction(e, btn));
        });

        // System status refresh
        const refreshBtn = document.querySelector('[data-bs-toggle="tooltip"][title="Refresh Data"]');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshSystemStatus());
        }
    }

    // Chart initialization and management
    initializeCharts() {
        this.initMetricCharts();
        this.initAnalyticsChart();
        this.initGeographicChart();
    }

    initMetricCharts() {
        const metricChartConfigs = [
            { id: 'companiesChart', data: this.generateSparklineData(), color: '#3b82f6' },
            { id: 'activeChart', data: this.generateSparklineData(true), color: '#10b981' },
            { id: 'pendingChart', data: this.generateSparklineData(false), color: '#f59e0b' },
            { id: 'productsChart', data: this.generateSparklineData(true), color: '#0ea5e9' }
        ];

        metricChartConfigs.forEach(config => {
            const canvas = document.getElementById(config.id);
            if (canvas) {
                this.charts[config.id] = this.createSparklineChart(canvas, config);
            }
        });
    }

    createSparklineChart(canvas, config) {
        const ctx = canvas.getContext('2d');
        
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: config.data.labels,
                datasets: [{
                    data: config.data.values,
                    borderColor: config.color,
                    backgroundColor: `${config.color}20`,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointHoverBorderWidth: 2,
                    pointHoverBackgroundColor: '#ffffff',
                    pointHoverBorderColor: config.color
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: config.color,
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            title: () => '',
                            label: (context) => `Value: ${context.parsed.y}`
                        }
                    }
                },
                scales: {
                    x: { display: false },
                    y: { display: false }
                },
                elements: {
                    point: { radius: 0 }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    initAnalyticsChart() {
        const canvas = document.getElementById('analyticsChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = this.generateAnalyticsData();

        this.charts.analyticsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'New Registrations',
                        data: data.registrations,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        pointBackgroundColor: '#ffffff',
                        pointBorderColor: '#3b82f6',
                        pointBorderWidth: 2
                    },
                    {
                        label: 'Active Companies',
                        data: data.active,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        pointBackgroundColor: '#ffffff',
                        pointBorderColor: '#10b981',
                        pointBorderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        align: 'end',
                        labels: {
                            usePointStyle: true,
                            pointStyle: 'circle',
                            padding: 20,
                            font: { size: 12, weight: '500' }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#3b82f6',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            title: (tooltipItems) => {
                                return `Date: ${tooltipItems[0].label}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            borderColor: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            font: { size: 11 },
                            color: '#6b7280'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            borderColor: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            font: { size: 11 },
                            color: '#6b7280'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    initGeographicChart() {
        const canvas = document.getElementById('geoChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = this.generateGeographicData();

        this.charts.geoChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        '#3b82f6',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444',
                        '#8b5cf6',
                        '#06b6d4'
                    ],
                    borderWidth: 3,
                    borderColor: '#ffffff',
                    hoverBorderWidth: 4,
                    hoverBorderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#3b82f6',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} companies (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Data generation methods
    generateSparklineData(positive = null) {
        const days = 30;
        const labels = [];
        const values = [];
        const baseValue = Math.random() * 100 + 50;

        for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString());

            let trend = positive === null ? (Math.random() - 0.5) : (positive ? 0.1 : -0.1);
            const value = Math.max(0, baseValue + (Math.random() - 0.5) * 20 + trend * i);
            values.push(Math.round(value));
        }

        return { labels, values };
    }

    generateAnalyticsData() {
        const days = 30;
        const labels = [];
        const registrations = [];
        const active = [];

        for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

            registrations.push(Math.floor(Math.random() * 15) + 5);
            active.push(Math.floor(Math.random() * 25) + 10);
        }

        return { labels, registrations, active };
    }

    generateGeographicData() {
        return {
            labels: ['Uzbekistan', 'Kazakhstan', 'China', 'Tajikistan', 'Turkey', 'Others'],
            values: [89, 64, 52, 28, 18, 16]
        };
    }

    // Update methods
    updateAnalyticsChart(period) {
        const chart = this.charts.analyticsChart;
        if (!chart) return;

        // Generate new data based on period
        const data = this.generateAnalyticsData(period);
        
        chart.data.labels = data.labels;
        chart.data.datasets[0].data = data.registrations;
        chart.data.datasets[1].data = data.active;
        
        chart.update('active');
    }

    updateMetricValue(elementId, value, animated = true) {
        const element = document.getElementById(elementId);
        if (!element) return;

        if (animated) {
            this.animateNumber(element, parseInt(element.textContent) || 0, value);
        } else {
            element.textContent = value;
        }
    }

    // Event handlers
    handleQuickAction(e, item) {
        const href = item.getAttribute('href');
        if (href && href !== '#') {
            return; // Let default navigation happen
        }

        e.preventDefault();
        
        const actionTitle = item.querySelector('.action-title')?.textContent;
        window.modernTheme?.showToast(`Opening ${actionTitle}...`, 'info');
        
        // Add visual feedback
        item.style.transform = 'scale(0.98)';
        setTimeout(() => {
            item.style.transform = '';
        }, 150);
    }

    handlePeriodChange(btn) {
        const period = btn.dataset.period;
        
        // Update button states
        btn.parentElement.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update chart
        this.updateAnalyticsChart(period);
        
        window.modernTheme?.showToast(`Updated to ${period} view`, 'success', 2000);
    }

    handleActivityAction(e, btn) {
        e.preventDefault();
        e.stopPropagation();
        
        const actionText = btn.textContent.trim();
        window.modernTheme?.showToast(`${actionText} action triggered`, 'info');
        
        // Add processing state
        const originalText = btn.textContent;
        btn.textContent = 'Processing...';
        btn.disabled = true;
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
        }, 1500);
    }

    // Real-time updates
    startRealTimeUpdates() {
        this.updateInterval = setInterval(() => {
            this.updateDashboardData();
        }, 30000); // Update every 30 seconds
    }

    stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    updateDashboardData() {
        // Simulate real-time data updates
        const updates = [
            { id: 'totalCompanies', value: Math.floor(Math.random() * 10) + 240 },
            { id: 'activeCompanies', value: Math.floor(Math.random() * 10) + 185 },
            { id: 'pendingCompanies', value: Math.floor(Math.random() * 5) + 15 },
            { id: 'totalProducts', value: Math.floor(Math.random() * 50) + 1400 },
            { id: 'activeSessions', value: Math.floor(Math.random() * 20) + 110 }
        ];

        updates.forEach(update => {
            this.updateMetricValue(update.id, update.value, true);
        });

        // Update trend indicators
        this.updateTrendIndicators();
    }

    updateTrendIndicators() {
        const trends = document.querySelectorAll('.trend-indicator');
        trends.forEach(trend => {
            const isPositive = Math.random() > 0.3; // 70% chance of positive trend
            const value = (Math.random() * 10).toFixed(1);
            
            trend.className = `trend-indicator ${isPositive ? 'positive' : 'negative'}`;
            trend.innerHTML = `
                <i class="las la-arrow-${isPositive ? 'up' : 'down'}"></i>
                <span>${isPositive ? '+' : '-'}${value}%</span>
            `;
        });
    }

    refreshSystemStatus() {
        const statusItems = document.querySelectorAll('.status-item');
        
        statusItems.forEach((item, index) => {
            setTimeout(() => {
                const dot = item.querySelector('.status-dot');
                const value = item.querySelector('.status-value');
                
                // Simulate status check
                dot.className = 'status-dot status-online';
                value.textContent = 'Checking...';
                
                setTimeout(() => {
                    const statuses = ['Operational', 'Healthy', 'Available', 'Active'];
                    value.textContent = statuses[Math.floor(Math.random() * statuses.length)];
                }, 1000);
                
            }, index * 200);
        });

        window.modernTheme?.showToast('System status refreshed', 'success');
    }

    // Animation methods
    initializeAnimations() {
        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe dashboard cards
        document.querySelectorAll('.dashboard-card, .metric-card').forEach(card => {
            observer.observe(card);
        });
    }

    animateMetricCard(card) {
        const chart = card.querySelector('canvas');
        if (chart && this.charts[chart.id]) {
            // Add subtle hover animation to chart
            this.charts[chart.id].update('none');
        }
    }

    animateNumber(element, from, to, duration = 1000) {
        const startTime = performance.now();
        const difference = to - from;

        const updateNumber = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            
            const currentValue = Math.round(from + (difference * easedProgress));
            element.textContent = currentValue.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        };

        requestAnimationFrame(updateNumber);
    }

    // Public API methods
    refreshData() {
        this.updateDashboardData();
        
        // Refresh all charts
        Object.values(this.charts).forEach(chart => {
            chart.update('active');
        });
        
        window.modernTheme?.showToast('Dashboard data refreshed', 'success');
    }

    exportData() {
        const data = {
            timestamp: new Date().toISOString(),
            metrics: {
                totalCompanies: document.getElementById('totalCompanies')?.textContent || '0',
                activeCompanies: document.getElementById('activeCompanies')?.textContent || '0',
                pendingCompanies: document.getElementById('pendingCompanies')?.textContent || '0',
                totalProducts: document.getElementById('totalProducts')?.textContent || '0'
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        window.modernTheme?.showToast('Dashboard data exported', 'success');
    }

    // Cleanup
    destroy() {
        this.stopRealTimeUpdates();
        
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        
        this.charts = {};
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the dashboard page
    if (document.querySelector('.dashboard-grid')) {
        window.modernDashboard = new ModernDashboard();
        
        // Add global keyboard shortcuts for dashboard
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + R for refresh (prevent default browser refresh)
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                window.modernDashboard.refreshData();
            }
            
            // Ctrl/Cmd + E for export
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                window.modernDashboard.exportData();
            }
        });
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (window.modernDashboard) {
        if (document.hidden) {
            window.modernDashboard.stopRealTimeUpdates();
        } else {
            window.modernDashboard.startRealTimeUpdates();
            window.modernDashboard.refreshData();
        }
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModernDashboard };
}