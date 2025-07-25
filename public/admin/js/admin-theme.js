/**
 * SLEX Admin Theme JavaScript
 * Handles sidebar, dropdowns, and general admin functionality
 */

class AdminTheme {
    constructor() {
        this.sidebar = document.getElementById('adminSidebar');
        this.sidebarOverlay = document.getElementById('sidebarOverlay');
        this.mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        
        this.init();
    }

    init() {
        this.initSidebar();
        this.initDropdowns();
        this.initSubmenuToggle();
        this.initGlobalSearch();
        this.initNotifications();
        
        console.log('Admin theme initialized');
    }

    initSidebar() {
        // Mobile sidebar toggle
        if (this.mobileSidebarToggle) {
            this.mobileSidebarToggle.addEventListener('click', () => {
                this.toggleMobileSidebar();
            });
        }

        // Sidebar close button
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => {
                this.closeMobileSidebar();
            });
        }

        // Overlay click to close
        if (this.sidebarOverlay) {
            this.sidebarOverlay.addEventListener('click', () => {
                this.closeMobileSidebar();
            });
        }

        // Close sidebar on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileSidebar();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 992) {
                this.closeMobileSidebar();
            }
        });
    }

    toggleMobileSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.toggle('active');
        }
        if (this.sidebarOverlay) {
            this.sidebarOverlay.classList.toggle('active');
        }
        document.body.style.overflow = this.sidebar?.classList.contains('active') ? 'hidden' : '';
    }

    closeMobileSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.remove('active');
        }
        if (this.sidebarOverlay) {
            this.sidebarOverlay.classList.remove('active');
        }
        document.body.style.overflow = '';
    }

    initDropdowns() {
        // Notification dropdown
        const notificationToggle = document.getElementById('notificationToggle');
        const notificationMenu = document.getElementById('notificationMenu');
        if (notificationToggle && notificationMenu) {
            this.initDropdown(notificationToggle, notificationMenu, 'notification-dropdown');
        }

        // Language dropdown
        const languageToggle = document.getElementById('languageToggle');
        const languageMenu = document.getElementById('languageMenu');
        if (languageToggle && languageMenu) {
            this.initDropdown(languageToggle, languageMenu, 'language-dropdown');
        }

        // User dropdown
        const userMenuToggle = document.getElementById('userMenuToggle');
        const userMenu = document.getElementById('userMenu');
        if (userMenuToggle && userMenu) {
            this.initDropdown(userMenuToggle, userMenu, 'user-dropdown');
        }
    }

    initDropdown(toggle, menu, containerClass) {
        const container = toggle.closest(`.${containerClass}`);
        
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Close other dropdowns
            document.querySelectorAll('.notification-dropdown, .language-dropdown, .user-dropdown').forEach(dropdown => {
                if (dropdown !== container) {
                    dropdown.classList.remove('active');
                }
            });
            
            // Toggle current dropdown
            container.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                container.classList.remove('active');
            }
        });

        // Close dropdown on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                container.classList.remove('active');
            }
        });
    }

    initSubmenuToggle() {
        const submenuToggles = document.querySelectorAll('.submenu-toggle');
        
        submenuToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                const parentItem = toggle.closest('.has-submenu');
                parentItem.classList.toggle('active');
            });
        });
    }

    initGlobalSearch() {
        const searchInput = document.getElementById('globalSearch');
        if (!searchInput) return;

        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) return;
            
            searchTimeout = setTimeout(() => {
                this.performGlobalSearch(query);
            }, 300);
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = e.target.value.trim();
                if (query.length >= 2) {
                    this.performGlobalSearch(query);
                }
            }
        });
    }

    async performGlobalSearch(query) {
        try {
            // Show loading state
            this.showSearchLoading();
            
            const response = await fetch(`/admin/api/search?q=${encodeURIComponent(query)}`);
            if (response.ok) {
                const results = await response.json();
                this.displaySearchResults(results.data);
            } else {
                console.warn('Search failed:', response.statusText);
                this.showSearchError();
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showSearchError();
        }
    }

    showSearchLoading() {
        // Implementation for search loading state
        console.log('Search loading...');
    }

    displaySearchResults(results) {
        // Implementation for displaying search results
        console.log('Search results:', results);
    }

    showSearchError() {
        // Implementation for search error state
        console.log('Search error occurred');
    }

    initNotifications() {
        // Mark notification as read
        const markAllReadBtn = document.querySelector('.mark-all-read');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', () => {
                this.markAllNotificationsRead();
            });
        }

        // Individual notification clicks
        const notificationItems = document.querySelectorAll('.notification-item.unread');
        notificationItems.forEach(item => {
            item.addEventListener('click', () => {
                this.markNotificationRead(item);
            });
        });

        // Auto-refresh notifications
        this.startNotificationPolling();
    }

    async markAllNotificationsRead() {
        try {
            const response = await fetch('/admin/api/notifications/mark-all-read', {
                method: 'POST'
            });
            
            if (response.ok) {
                // Update UI
                document.querySelectorAll('.notification-item.unread').forEach(item => {
                    item.classList.remove('unread');
                });
                
                // Update badge
                const badge = document.getElementById('notificationCount');
                if (badge) {
                    badge.textContent = '0';
                    badge.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Failed to mark notifications as read:', error);
        }
    }

    markNotificationRead(item) {
        item.classList.remove('unread');
        
        // Update badge count
        const badge = document.getElementById('notificationCount');
        if (badge) {
            const currentCount = parseInt(badge.textContent) || 0;
            const newCount = Math.max(0, currentCount - 1);
            badge.textContent = newCount.toString();
            
            if (newCount === 0) {
                badge.style.display = 'none';
            }
        }
    }

    startNotificationPolling() {
        // Poll for new notifications every 30 seconds
        setInterval(async () => {
            try {
                const response = await fetch('/admin/api/notifications/count');
                if (response.ok) {
                    const result = await response.json();
                    this.updateNotificationBadge(result.data.unreadCount);
                }
            } catch (error) {
                console.error('Failed to fetch notification count:', error);
            }
        }, 30000);
    }

    updateNotificationBadge(count) {
        const badge = document.getElementById('notificationCount');
        if (badge) {
            badge.textContent = count.toString();
            badge.style.display = count > 0 ? 'block' : 'none';
        }
    }

    // Utility methods
    showToast(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `admin-toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="las la-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="las la-times"></i>
            </button>
        `;
        
        // Add styles if not exist
        if (!document.querySelector('#admin-toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'admin-toast-styles';
            styles.textContent = `
                .admin-toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 16px 20px;
                    border-radius: 12px;
                    color: white;
                    font-weight: 500;
                    z-index: 10000;
                    animation: slideInRight 0.3s ease;
                    max-width: 400px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                }
                .toast-success { background: #10b981; }
                .toast-error { background: #ef4444; }
                .toast-warning { background: #f59e0b; }
                .toast-info { background: #3b82f6; }
                .toast-content { display: flex; align-items: center; gap: 8px; flex: 1; }
                .toast-close { 
                    background: none; 
                    border: none; 
                    color: white; 
                    cursor: pointer; 
                    padding: 4px;
                    border-radius: 4px;
                    opacity: 0.8;
                    transition: opacity 0.2s;
                }
                .toast-close:hover { opacity: 1; }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(toast);
        
        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'slideInRight 0.3s ease reverse';
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    }

    confirmAction(message, callback) {
        const modal = document.createElement('div');
        modal.className = 'admin-confirm-modal';
        modal.innerHTML = `
            <div class="confirm-overlay"></div>
            <div class="confirm-dialog">
                <div class="confirm-header">
                    <h5>Confirm Action</h5>
                </div>
                <div class="confirm-body">
                    <p>${message}</p>
                </div>
                <div class="confirm-footer">
                    <button class="btn btn-outline-secondary" onclick="this.closest('.admin-confirm-modal').remove()">
                        Cancel
                    </button>
                    <button class="btn btn-danger" onclick="this.closest('.admin-confirm-modal').remove(); (${callback})()">
                        Confirm
                    </button>
                </div>
            </div>
        `;
        
        // Add styles if not exist
        if (!document.querySelector('#admin-confirm-styles')) {
            const styles = document.createElement('style');
            styles.id = 'admin-confirm-styles';
            styles.textContent = `
                .admin-confirm-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .confirm-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                }
                .confirm-dialog {
                    background: white;
                    border-radius: 12px;
                    max-width: 400px;
                    width: 90%;
                    position: relative;
                    z-index: 1;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                }
                .confirm-header {
                    padding: 20px 24px 16px;
                    border-bottom: 1px solid #e5e7eb;
                }
                .confirm-header h5 {
                    margin: 0;
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: #1f2937;
                }
                .confirm-body {
                    padding: 20px 24px;
                }
                .confirm-body p {
                    margin: 0;
                    color: #6b7280;
                    line-height: 1.5;
                }
                .confirm-footer {
                    padding: 16px 24px 20px;
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(modal);
        
        // Close on overlay click
        modal.querySelector('.confirm-overlay').addEventListener('click', () => {
            modal.remove();
        });
    }
}

// Initialize admin theme when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.adminTheme = new AdminTheme();
});

// Global utility functions
window.showToast = function(message, type = 'info', duration = 5000) {
    if (window.adminTheme) {
        window.adminTheme.showToast(message, type, duration);
    }
};

window.confirmAction = function(message, callback) {
    if (window.adminTheme) {
        window.adminTheme.confirmAction(message, callback);
    }
};