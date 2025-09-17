/**
 * Buyer Suppliers Management JavaScript
 */
class BuyerSuppliers {
    constructor() {
        this.apiBase = '/buyer/api';
        this.filters = {};
        this.suppliers = [];
        this.init();
    }

    init() {
        this.loadSuppliers();
        this.setupEventListeners();
    }

    async loadSuppliers() {
        try {
            const params = new URLSearchParams(this.filters);
            const response = await fetch(`${this.apiBase}/buyer-suppliers?${params}`);
            const result = await response.json();
            
            if (result.success) {
                this.suppliers = result.data;
                this.renderSuppliersGrid(result.data);
            }
        } catch (error) {
            // console.error('Error loading suppliers:', error);
        }
    }

    renderSuppliersGrid(suppliers) {
        const grid = document.getElementById('suppliersGrid');
        if (!grid) return;

        const loader = grid.querySelector('.loading-placeholder-grid');
        if (loader) loader.remove();

        if (!suppliers.length) {
            grid.innerHTML = `
                <div class="no-data" style="grid-column: 1 / -1;">
                    <div class="no-data-icon"><i class="fas fa-handshake"></i></div>
                    <h4>No Suppliers Found</h4>
                    <p>Try adjusting your filters or explore new suppliers.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = suppliers.map(supplier => `
            <div class="supplier-card" data-supplier-id="${supplier.id}">
                ${supplier.favorite ? '<div class="favorite-badge active"><i class="fas fa-heart"></i></div>' : ''}
                
                <div class="supplier-card-header">
                    <div class="supplier-logo">${supplier.name.charAt(0)}</div>
                    <div class="supplier-info">
                        <h4>${supplier.name}</h4>
                        <div class="supplier-location">
                            <i class="fas fa-map-marker-alt"></i>
                            ${supplier.location}
                        </div>
                    </div>
                </div>
                
                <div class="supplier-rating">
                    <div class="rating-stars">${this.renderStars(supplier.rating)}</div>
                    <span class="rating-value">${supplier.rating}</span>
                    <span class="rating-count">(${supplier.reviewCount})</span>
                </div>
                
                <div class="supplier-categories">
                    <div class="category-tags">
                        ${supplier.categories.slice(0, 2).map(cat => 
                            `<span class="category-tag">${cat}</span>`
                        ).join('')}
                        ${supplier.categories.length > 2 ? `<span class="category-tag">+${supplier.categories.length - 2}</span>` : ''}
                    </div>
                </div>
                
                <div class="supplier-stats">
                    <div class="stat-item">
                        <span class="stat-value">${supplier.totalOrders}</span>
                        <span class="stat-label">Orders</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${supplier.onTimeDelivery}%</span>
                        <span class="stat-label">On Time</span>
                    </div>
                </div>
                
                <div class="supplier-actions">
                    <button class="btn-supplier btn-primary" onclick="contactSupplier('${supplier.id}')">
                        <i class="fas fa-comments"></i>
                        Contact
                    </button>
                    <button class="btn-supplier btn-secondary" onclick="viewSupplierDetails('${supplier.id}')">
                        <i class="fas fa-info-circle"></i>
                        Details
                    </button>
                </div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Search
        const searchInput = document.getElementById('supplierSearch');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.filters.search = searchInput.value;
                this.loadSuppliers();
            }, 500));
        }

        // Filters
        ['categoryFilter', 'ratingFilter', 'locationFilter'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    this.filters[id.replace('Filter', '')] = element.value;
                    this.loadSuppliers();
                });
            }
        });

        // Favorite toggle
        document.addEventListener('click', (e) => {
            if (e.target.closest('.favorite-badge')) {
                const supplierId = e.target.closest('.supplier-card').dataset.supplierId;
                this.toggleFavorite(supplierId);
            }
        });
    }

    async toggleFavorite(supplierId) {
        try {
            const supplier = this.suppliers.find(s => s.id === supplierId);
            const method = supplier.favorite ? 'DELETE' : 'POST';
            const endpoint = supplier.favorite 
                ? `/api/remove-favorite-supplier/${supplierId}`
                : '/api/add-favorite-supplier';

            const response = await fetch(`${this.apiBase}${endpoint}`, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: method === 'POST' ? JSON.stringify({ supplierId }) : undefined
            });

            const result = await response.json();
            if (result.success) {
                supplier.favorite = !supplier.favorite;
                this.loadSuppliers(); // Refresh grid
            }
        } catch (error) {
            // console.error('Error toggling favorite:', error);
        }
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - Math.ceil(rating);
        
        let starsHTML = '';
        for (let i = 0; i < fullStars; i++) starsHTML += '<i class="fas fa-star rating-star"></i>';
        if (hasHalfStar) starsHTML += '<i class="fas fa-star-half-alt rating-star"></i>';
        for (let i = 0; i < emptyStars; i++) starsHTML += '<i class="far fa-star rating-star empty"></i>';
        
        return starsHTML;
    }

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
}

// Global functions
window.viewSupplierDetails = (supplierId) => {
    // Implementation for supplier details modal
};

window.contactSupplier = (supplierId) => {
    window.location.href = `/buyer/messages?supplier=${supplierId}`;
};

window.openSupplierDiscovery = () => {
    // Implementation for supplier discovery
};

window.exportSuppliers = () => {
    // Implementation for export functionality
};

window.loadMoreSuppliers = () => {
    // Implementation for pagination
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.buyerSuppliers = new BuyerSuppliers();
});
