/**
 * Manufacturer Dashboard Handler
 * Handles all dashboard functionality and data loading
 */

class ManufacturerDashboard {
    constructor() {
        this.apiBase = '/manufacturer/api';
        this.refreshInterval =  300000; // 5 minutes
        this.init();
    }

    async init() {
        // Initialize theme from localStorage
        this.initTheme();
        
        // Initialize language from cookie
        this.initLanguage();
        
        // Initialize sidebar toggle
        this.initSidebarToggle();
        
        // Initialize user menu
        this.initUserMenu();
        
        // Load dashboard data
        await this.loadDashboardData();
        
        // Start real-time updates
        this.startRealTimeUpdates();
        
        // Initialize charts
        this.initCharts();
    }

    /**
     * Theme Management
     */
    initTheme() {
        const savedTheme = localStorage.getItem('dashboard-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('dashboard-theme', newTheme);
                
                // Update icon
                const icon = themeToggle.querySelector('i');
                icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            });
        }
    }

    /**
     * Language Management
     */
    initLanguage() {
        // Read i18next cookie
        const cookies = document.cookie.split(';');
        let currentLang = 'uz';
        
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'i18next') {
                currentLang = value;
                break;
            }
        }
        
        // Update language selector if exists
        const langOptions = document.querySelectorAll('.language-option');
        langOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const lang = e.currentTarget.dataset.lang;
                document.cookie = `i18next=${lang};path=/;max-age=31536000`;
                window.location.reload();
            });
        });
    }

    /**
     * Sidebar Toggle
     */
    initSidebarToggle() {
        const sidebar = document.querySelector('.admin-sidebar');
        const main = document.querySelector('.admin-main');
        const toggleBtn = document.getElementById('sidebarToggle');
        const mobileToggle = document.getElementById('mobileMenuToggle');
        
        // Desktop toggle
        if (toggleBtn && sidebar && main) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                main.classList.toggle('sidebar-collapsed');
                
                // Save state
                const isCollapsed = sidebar.classList.contains('collapsed');
                localStorage.setItem('sidebarCollapsed', isCollapsed);
            });
            
            // Restore state
            const savedState = localStorage.getItem('sidebarCollapsed') === 'true';
            if (savedState) {
                sidebar.classList.add('collapsed');
                main.classList.add('sidebar-collapsed');
            }
        }
        
        // Mobile toggle
        if (mobileToggle && sidebar) {
            mobileToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                
                // Create overlay
                let overlay = document.querySelector('.sidebar-overlay');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.className = 'sidebar-overlay';
                    document.body.appendChild(overlay);
                }
                
                overlay.classList.toggle('active');
                
                // Close on overlay click
                overlay.addEventListener('click', () => {
                    sidebar.classList.remove('open');
                    overlay.classList.remove('active');
                });
            });
        }
    }

    /**
     * User Menu
     */
    initUserMenu() {
        const userBtn = document.querySelector('.user-profile-btn');
        const dropdown = document.getElementById('profileDropdown');
        
        if (userBtn && dropdown) {
            userBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('hidden');
            });
            
            // Close on outside click
            document.addEventListener('click', () => {
                dropdown.classList.add('hidden');
            });
        }
    }

    /**
     * Load Dashboard Data from Backend
     */
    async loadDashboardData() {
        try {
            // Show loading state
            this.showLoadingState();
            
            // Fetch dashboard stats
            const response = await fetch(`${this.apiBase}/dashboard-stats`);
            const data = await response.json();
            
            if (data.success) {
                this.updateDashboardStats(data.data);
            }
            
            // Load other dashboard data
            await Promise.all([
                this.loadProductionMetrics(),
                this.loadEquipmentStatus(),
                this.loadRecentOrders(),
                this.loadQualityMetrics()
            ]);
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showErrorState();
        }
    }

    /**
     * Update Dashboard Statistics
     */
    updateDashboardStats(stats) {
        // Production Output
        const productionCard = document.querySelector('[data-stat="productionOutput"]');
        if (productionCard && stats.productionOutput) {
            productionCard.querySelector('.stat-value').textContent = stats.productionOutput.toLocaleString();
            this.updateStatChange(productionCard, stats.productionChange);
        }
        
        // Active Lines
        const linesCard = document.querySelector('[data-stat="activeLines"]');
        if (linesCard && stats.activeLines) {
            linesCard.querySelector('.stat-value').textContent = `${stats.activeLines}/${stats.totalLines}`;
        }
        
        // Pending Orders
        const ordersCard = document.querySelector('[data-stat="pendingOrders"]');
        if (ordersCard && stats.pendingOrders !== undefined) {
            ordersCard.querySelector('.stat-value').textContent = stats.pendingOrders.toLocaleString();
        }
        
        // Monthly Revenue
        const revenueCard = document.querySelector('[data-stat="revenue"]');
        if (revenueCard && stats.monthlyRevenue) {
            revenueCard.querySelector('.stat-value').textContent = `$${(stats.monthlyRevenue / 1000000).toFixed(2)}M`;
            this.updateStatChange(revenueCard, stats.revenueChange);
        }
    }

    updateStatChange(card, change) {
        const changeEl = card.querySelector('.stat-change');
        if (changeEl && change !== undefined) {
            changeEl.classList.remove('positive', 'negative');
            changeEl.classList.add(change > 0 ? 'positive' : 'negative');
            
            const icon = changeEl.querySelector('i');
            icon.className = `fas fa-arrow-${change > 0 ? 'up' : 'down'} stat-change-icon`;
            
            const text = changeEl.querySelector('span');
            text.textContent = `${change > 0 ? '+' : ''}${change}% from yesterday`;
        }
    }

    /**
     * Load Production Metrics
     */
    async loadProductionMetrics() {
        try {
            const response = await fetch(`${this.apiBase}/production-metrics`);
            const data = await response.json();
            
            if (data.success && this.productionChart) {
                this.updateProductionChart(data.data);
            }
        } catch (error) {
            console.error('Failed to load production metrics:', error);
        }
    }

    /**
     * Load Equipment Status
     */
    async loadEquipmentStatus() {
        try {
            const response = await fetch(`${this.apiBase}/equipment-status`);
            const data = await response.json();
            
            if (data.success) {
                this.renderEquipmentStatus(data.data);
            }
        } catch (error) {
            console.error('Failed to load equipment status:', error);
        }
    }

    renderEquipmentStatus(equipment) {
        const container = document.querySelector('.equipment-list');
        if (!container) return;
        
        container.innerHTML = equipment.map(item => `
            <div class="equipment-item">
                <div class="equipment-info">
                    <div class="equipment-icon">
                        <i class="fas fa-${item.icon || 'industry'}"></i>
                    </div>
                    <div class="equipment-details">
                        <h4 class="equipment-name">${item.name}</h4>
                        <p class="equipment-type">${item.type}</p>
                    </div>
                </div>
                <div class="equipment-status">
                    <span class="status-badge status-${item.status.toLowerCase()}">${item.statusText}</span>
                    <div class="equipment-metric">${item.efficiency}% Efficiency</div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Load Recent Orders
     */
    async loadRecentOrders() {
        try {
            const response = await fetch(`${this.apiBase}/production-orders?limit=5`);
            const data = await response.json();
            
            if (data.success) {
                this.renderRecentOrders(data.data.orders || data.data);
            }
        } catch (error) {
            console.error('Failed to load recent orders:', error);
        }
    }

    renderRecentOrders(orders) {
        const container = document.querySelector('.orders-list');
        if (!container) return;
        
        container.innerHTML = orders.map(order => `
            <div class="order-item">
                <div class="order-header">
                    <span class="order-id">#${order.id}</span>
                    <span class="order-date">${this.formatDate(order.createdAt)}</span>
                </div>
                <div class="order-body">
                    <h4 class="order-product">${order.product} - ${order.quantity}</h4>
                    <div class="order-client">
                        <i class="fas fa-building"></i> ${order.client}
                    </div>
                </div>
                <div class="order-footer">
                    <span class="status-badge status-${order.status.toLowerCase()}">${order.statusText}</span>
                    <div class="order-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${order.progress}%"></div>
                        </div>
                        <span class="progress-text">${order.progress}%</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Load Quality Metrics
     */
    async loadQualityMetrics() {
        try {
            const response = await fetch(`${this.apiBase}/quality-metrics`);
            const data = await response.json();
            
            if (data.success) {
                this.renderQualityMetrics(data.data);
            }
        } catch (error) {
            console.error('Failed to load quality metrics:', error);
        }
    }

    renderQualityMetrics(metrics) {
        const container = document.querySelector('.metric-list');
        if (!container) return;
        
        container.innerHTML = metrics.map(metric => `
            <div class="metric-item">
                <div class="metric-info">
                    <h4 class="metric-label">${metric.label}</h4>
                    <div class="metric-value">${metric.value}</div>
                    <div class="metric-change ${metric.change > 0 ? 'positive' : 'negative'}">
                        <i class="fas fa-arrow-${metric.change > 0 ? 'up' : 'down'}"></i>
                        ${metric.change > 0 ? '+' : ''}${metric.change}${metric.unit || '%'}
                    </div>
                </div>
                <div class="metric-progress">
                    <div class="progress-bar">
                        <div class="progress-fill ${metric.status}" style="width: ${metric.percentage}%"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Initialize Charts
     */
    initCharts() {
        const ctx = document.getElementById('productionChart');
        if (ctx) {
            this.productionChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Production Output',
                        data: [],
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--color-primary'),
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0,0,0,0.05)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }
    }

    updateProductionChart(data) {
        if (!this.productionChart) return;
        
        this.productionChart.data.labels = data.labels;
        this.productionChart.data.datasets[0].data = data.values;
        this.productionChart.update();
    }

    /**
     * Real-time Updates
     */
    startRealTimeUpdates() {
        setInterval(() => {
            this.loadDashboardData();
        }, this.refreshInterval);
    }

    /**
     * Utility Functions
     */
    showLoadingState() {
        document.querySelectorAll('.stat-value').forEach(el => {
            if (!el.querySelector('.loading-spinner')) {
                el.innerHTML = '<div class="loading-spinner"></div>';
            }
        });
    }

    showErrorState() {
        console.error('Failed to load dashboard data');
        // Show error message to user
    }

    formatDate(date) {
        const d = new Date(date);
        const now = new Date();
        const diff = Math.floor((now - d) / 1000 / 60); // minutes
        
        if (diff < 60) return `${diff} minutes ago`;
        if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`;
        
        return d.toLocaleDateString();
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.manufacturerDashboard = new ManufacturerDashboard();
});