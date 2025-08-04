/**
 * Manufacturer Common JavaScript
 * Shared utilities and functions for manufacturer dashboard
 */

// Common utility functions for manufacturer dashboard
window.ManufacturerUtils = {
    /**
     * Format number with commas
     */
    formatNumber(num) {
        if (typeof num !== 'number') return num;
        return num.toLocaleString();
    },

    /**
     * Format currency
     */
    formatCurrency(amount, currency = 'USD') {
        if (typeof amount !== 'number') return amount;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },

    /**
     * Format percentage
     */
    formatPercentage(value, decimals = 1) {
        if (typeof value !== 'number') return value;
        return `${value.toFixed(decimals)}%`;
    },

    /**
     * Format date
     */
    formatDate(date, options = {}) {
        if (!date) return '';
        const defaultOptions = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        };
        return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
    },

    /**
     * Get status color class
     */
    getStatusColor(status) {
        const statusColors = {
            'active': 'success',
            'in_progress': 'warning',
            'completed': 'success',
            'scheduled': 'info',
            'cancelled': 'danger',
            'blocked': 'danger',
            'suspended': 'warning',
            'maintenance': 'warning',
            'breakdown': 'danger',
            'operational': 'success'
        };
        return statusColors[status] || 'secondary';
    },

    /**
     * Debounce function
     */
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
    },

    /**
     * Throttle function
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Show loading state
     */
    showLoading(element) {
        if (!element) return;
        element.classList.add('loading');
        element.setAttribute('disabled', 'disabled');
    },

    /**
     * Hide loading state
     */
    hideLoading(element) {
        if (!element) return;
        element.classList.remove('loading');
        element.removeAttribute('disabled');
    },

    /**
     * Copy text to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Failed to copy text: ', err);
            return false;
        }
    },

    /**
     * Generate random ID
     */
    generateId(prefix = 'id') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Get relative time string
     */
    getRelativeTime(date) {
        if (!date) return '';
        
        const now = new Date();
        const diff = now - new Date(date);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    },

    /**
     * Get equipment status icon
     */
    getEquipmentIcon(status) {
        const icons = {
            'operational': 'las la-check-circle',
            'maintenance': 'las la-wrench',
            'breakdown': 'las la-exclamation-triangle',
            'offline': 'las la-times-circle'
        };
        return icons[status] || 'las la-question-circle';
    },

    /**
     * Calculate production efficiency
     */
    calculateEfficiency(actual, target) {
        if (!target || target === 0) return 0;
        return Math.min((actual / target) * 100, 100);
    },

    /**
     * Get priority level color
     */
    getPriorityColor(priority) {
        const priorities = {
            'low': 'info',
            'medium': 'warning',
            'high': 'danger',
            'urgent': 'danger'
        };
        return priorities[priority] || 'secondary';
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.ManufacturerUtils;
}