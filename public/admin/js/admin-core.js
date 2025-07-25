/**
 * SLEX Admin Core JavaScript
 * Essential functions for admin dashboard
 */

// Global admin object
window.SlexAdmin = {
    // Configuration
    config: {
        sidebarWidth: 280,
        mobileBreakpoint: 1024,
        animationDuration: 300
    },
    
    // State management
    state: {
        sidebarOpen: false,
        currentTheme: 'light',
        isMobile: false
    },
    
    // Initialize admin dashboard
    init: function() {
        this.checkMobile();
        this.initSidebar();
        this.initTheme();
        this.initDropdowns();
        this.initTooltips();
        this.bindEvents();
        
        console.log('✅ SLEX Admin initialized');
    },
    
    // Check if mobile device
    checkMobile: function() {
        this.state.isMobile = window.innerWidth < this.config.mobileBreakpoint;
    },
    
    // Initialize sidebar
    initSidebar: function() {
        const sidebar = document.getElementById('adminSidebar');
        if (!sidebar) return;
        
        // Set initial state
        if (this.state.isMobile) {
            sidebar.classList.remove('show');
            this.state.sidebarOpen = false;
        } else {
            sidebar.classList.add('show');
            this.state.sidebarOpen = true;
        }
        
        // Add active states to navigation
        this.setActiveNavigation();
    },
    
    // Set active navigation item
    setActiveNavigation: function() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && currentPath.startsWith(href)) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },
    
    // Initialize theme (SLEX uses inverted theme logic)
    initTheme: function() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
    },
    
    // Set theme (SLEX inverted logic: data-theme="light" = dark mode)
    setTheme: function(theme) {
        this.state.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update theme icons with SLEX inverted logic
        const themeIcons = document.querySelectorAll('.theme-toggle-icon');
        themeIcons.forEach(icon => {
            if (theme === 'light') {
                icon.className = 'las la-sun theme-toggle-icon';
            } else {
                icon.className = 'las la-moon theme-toggle-icon';
            }
        });
    },
    
    // Toggle theme
    toggleTheme: function() {
        const newTheme = this.state.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    },
    
    // Initialize dropdowns
    initDropdowns: function() {
        const dropdownToggles = document.querySelectorAll('[data-dropdown]');
        
        dropdownToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const targetId = toggle.getAttribute('data-dropdown');
                this.toggleDropdown(targetId);
            });
        });
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            this.closeAllDropdowns();
        });
    },
    
    // Toggle dropdown
    toggleDropdown: function(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;
        
        // Close other dropdowns
        this.closeAllDropdowns(dropdownId);
        
        // Toggle current dropdown
        dropdown.classList.toggle('show');
    },
    
    // Close all dropdowns
    closeAllDropdowns: function(except = null) {
        const dropdowns = document.querySelectorAll('.dropdown-menu.show');
        dropdowns.forEach(dropdown => {
            if (!except || dropdown.id !== except) {
                dropdown.classList.remove('show');
            }
        });
    },
    
    // Initialize tooltips
    initTooltips: function() {
        const tooltipElements = document.querySelectorAll('[title]');
        tooltipElements.forEach(element => {
            element.setAttribute('data-tooltip', element.getAttribute('title'));
            element.removeAttribute('title');
        });
    },
    
    // Toggle sidebar
    toggleSidebar: function() {
        const sidebar = document.getElementById('adminSidebar');
        const backdrop = document.querySelector('.sidebar-backdrop');
        
        if (!sidebar) return;
        
        this.state.sidebarOpen = !this.state.sidebarOpen;
        
        if (this.state.sidebarOpen) {
            sidebar.classList.add('show');
            if (backdrop) backdrop.classList.add('show');
        } else {
            sidebar.classList.remove('show');
            if (backdrop) backdrop.classList.remove('show');
        }
    },
    
    // Bind events
    bindEvents: function() {
        // Window resize
        window.addEventListener('resize', () => {
            this.checkMobile();
            if (!this.state.isMobile && !this.state.sidebarOpen) {
                this.toggleSidebar();
            }
        });
        
        // Sidebar backdrop click
        const backdrop = document.querySelector('.sidebar-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }
        
        // Navigation link clicks
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (this.state.isMobile) {
                    this.toggleSidebar();
                }
            });
        });
    },
    
    // Show toast notification
    showToast: function(message, type = 'info', duration = 5000) {
        const container = document.getElementById('toastContainer') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">
                    <i class="las la-${this.getToastIcon(type)}"></i>
                </div>
                <div class="toast-message">${message}</div>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="las la-times"></i>
                </button>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Auto remove
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);
    },
    
    // Create toast container
    createToastContainer: function() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    },
    
    // Get toast icon
    getToastIcon: function(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-triangle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    },
    
    // Show loading state
    showLoading: function(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.classList.add('loading');
        }
    },
    
    // Hide loading state
    hideLoading: function(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.classList.remove('loading');
        }
    },
    
    // Refresh dashboard
    refreshDashboard: function() {
        this.showToast('Refreshing dashboard...', 'info', 2000);
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    },
    
    // API helper
    api: {
        // Make API request
        request: async function(url, options = {}) {
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };
            
            const config = { ...defaultOptions, ...options };
            
            try {
                const response = await fetch(url, config);
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Request failed');
                }
                
                return data;
            } catch (error) {
                console.error('API Error:', error);
                SlexAdmin.showToast(error.message, 'error');
                throw error;
            }
        },
        
        // GET request
        get: function(url) {
            return this.request(url);
        },
        
        // POST request
        post: function(url, data) {
            return this.request(url, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },
        
        // PUT request
        put: function(url, data) {
            return this.request(url, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },
        
        // DELETE request
        delete: function(url) {
            return this.request(url, {
                method: 'DELETE'
            });
        }
    }
};

// Global functions for backward compatibility
window.toggleSidebar = function() {
    SlexAdmin.toggleSidebar();
};

window.toggleTheme = function() {
    SlexAdmin.toggleTheme();
};

window.refreshDashboard = function() {
    SlexAdmin.refreshDashboard();
};

window.openQuickActions = function() {
    SlexAdmin.showToast('Quick actions feature coming soon!', 'info');
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    SlexAdmin.init();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SlexAdmin;
}