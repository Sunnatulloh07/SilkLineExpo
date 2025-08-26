/**
 * Buyer Orders JavaScript
 * Handles orders page interactions and filtering
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize orders page
    initializeOrdersPage();
});

/**
 * Initialize orders page
 */
function initializeOrdersPage() {
    // Set up event listeners
    setupEventListeners();
    
    // Load orders
    loadOrders();
}

/**
 * Load orders
 */
function loadOrders() {
    // Get filter values
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const dateFilter = document.getElementById('dateFilter')?.value || 'all';
    const searchQuery = document.getElementById('orderSearch')?.value || '';
    
    // Build query parameters
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (dateFilter !== 'all') params.append('date', dateFilter);
    if (searchQuery) params.append('search', searchQuery);
    
    fetch(`/distributor/api/buyer-orders?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderOrders(data.data.orders);
                updatePagination(data.data.pagination);
            }
        })
        .catch(error => {
            console.error('Error loading orders:', error);
        });
}

/**
 * Render orders list
 */
function renderOrders(orders) {
    // In a real implementation, this would render the orders
    console.log('Orders loaded:', orders);
}

/**
 * Update pagination
 */
function updatePagination(pagination) {
    // In a real implementation, this would update the pagination controls
    console.log('Pagination:', pagination);
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', loadOrders);
    }
    
    // Date filter
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        dateFilter.addEventListener('change', loadOrders);
    }
    
    // Search input
    const orderSearch = document.getElementById('orderSearch');
    if (orderSearch) {
        orderSearch.addEventListener('input', debounce(loadOrders, 300));
    }
    
    // New order button
    const newOrderBtn = document.getElementById('newOrderBtn');
    if (newOrderBtn) {
        newOrderBtn.addEventListener('click', function() {
            // In a real implementation, this would open a new order modal or redirect
            alert('New order functionality would be implemented here');
        });
    }
}

/**
 * Debounce function to limit API calls
 */
function debounce(func, wait) {
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

// Global functions
window.viewOrderDetails = (orderId) => {
    console.log('Viewing order:', orderId);
    // Implementation for order details modal
};

window.contactSupplier = (supplierId) => {
    window.location.href = `/distributor/communication?supplier=${supplierId}`;
};

window.createNewOrder = () => {
    console.log('Creating new order');
    // Implementation for new order modal
};

window.exportOrders = () => {
    console.log('Exporting orders');
    // Implementation for export functionality
};

window.refreshOrders = () => {
    window.buyerOrders.loadOrders(window.buyerOrders.currentPage);
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.buyerOrders = new BuyerOrders();
});