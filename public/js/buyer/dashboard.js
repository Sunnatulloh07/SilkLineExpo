/**
 * Buyer Dashboard Main JavaScript
 */
class BuyerDashboard {
    constructor() {
        this.apiBase = '/buyer/api';
        this.init();
    }

    init() {
        this.loadDashboardStats();
        this.loadRecentOrders();
        this.setupEventListeners();
    }

    async loadDashboardStats() {
        try {
            const response = await fetch(`${this.apiBase}/dashboard-stats`);
            const result = await response.json();
            
            if (result.success) {
                this.updateKPICards(result.data);
            }
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }

    updateKPICards(stats) {
        const updates = [
            { id: 'totalOrdersValue', value: stats.totalOrders },
            { id: 'activeOrdersValue', value: stats.activeOrders },
            { id: 'totalSpentValue', value: this.formatCurrency(stats.totalSpent) },
            { id: 'activeSuppliersValue', value: stats.activeSuppliers }
        ];

        updates.forEach(update => {
            const element = document.getElementById(update.id);
            if (element) {
                element.textContent = update.value;
                element.classList.add('updated');
            }
        });
    }

    async loadRecentOrders() {
        try {
            const response = await fetch(`${this.apiBase}/buyer-orders?limit=5`);
            const result = await response.json();
            
            if (result.success) {
                this.renderRecentOrders(result.data.orders);
            }
        } catch (error) {
            console.error('Error loading recent orders:', error);
        }
    }

    renderRecentOrders(orders) {
        const container = document.getElementById('recentOrdersList');
        if (!container) return;

        const loader = container.querySelector('.loading-placeholder');
        if (loader) loader.remove();

        if (!orders.length) {
            container.innerHTML = `
                <div class="no-data">
                    <div class="no-data-icon"><i class="fas fa-shopping-cart"></i></div>
                    <h4>No Recent Orders</h4>
                    <p>Start shopping to see your order history here.</p>
                </div>
            `;
            return;
        }

        const ordersHTML = orders.map(order => `
            <div class="order-item">
                <div class="order-header">
                    <div class="order-id">${order.id}</div>
                    <span class="order-status status-${order.status}">${this.formatOrderStatus(order.status)}</span>
                </div>
                <div class="order-supplier">${order.supplier}</div>
                <div class="order-details">
                    <span class="order-amount">${this.formatCurrency(order.totalAmount)}</span>
                    <span class="order-date">${this.formatDate(order.orderDate)}</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = ordersHTML;
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action]')) {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            }
        });
    }

    handleQuickAction(action) {
        const routes = {
            'create-order': '/buyer/orders',
            'view-suppliers': '/buyer/suppliers', 
            'send-message': '/buyer/messages',
            'view-analytics': '/buyer/analytics'
        };
        
        if (routes[action]) {
            window.location.href = routes[action];
        }
    }

    formatCurrency(amount) {
        if (amount >= 1000000) return '$' + (amount / 1000000).toFixed(1) + 'M';
        if (amount >= 1000) return '$' + (amount / 1000).toFixed(0) + 'K';
        return '$' + amount.toLocaleString();
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric'
        });
    }

    formatOrderStatus(status) {
        const statusMap = {
            'pending': 'Pending',
            'confirmed': 'Confirmed', 
            'in_production': 'In Production',
            'shipped': 'Shipped',
            'delivered': 'Delivered'
        };
        return statusMap[status] || status;
    }
}

// Global functions
window.viewOrderDetails = (orderId) => window.location.href = `/buyer/orders?view=${orderId}`;
window.contactSupplier = (supplierId) => window.location.href = `/buyer/messages?supplier=${supplierId}`;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.buyerDashboard = new BuyerDashboard();
});