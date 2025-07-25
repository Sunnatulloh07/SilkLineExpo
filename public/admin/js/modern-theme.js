/**
 * SLEX Modern Admin Theme - Core JavaScript
 * Handles theme switching, sidebar functionality, and UI interactions
 * Optimized for 2024+ design standards with clean, modern functionality
 */

class ModernTheme {
    constructor() {
        this.init();
        this.bindEvents();
        this.initTheme();
    }

    init() {
        // Initialize theme state
        this.sidebar = document.getElementById('modernSidebar');
        this.sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');
        this.mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
        this.sidebarOverlay = document.getElementById('sidebarOverlay');
        this.themeToggle = document.getElementById('themeToggle');
        
        // Initialize dropdown states
        this.dropdowns = {
            search: {
                trigger: document.getElementById('searchTrigger'),
                container: document.getElementById('searchContainer'),
                close: document.getElementById('searchClose')
            },
            notifications: {
                trigger: document.getElementById('notificationToggle'),
                panel: document.getElementById('notificationPanel')
            },
            language: {
                trigger: document.getElementById('languageToggle'),
                panel: document.getElementById('languagePanel')
            },
            profile: {
                trigger: document.getElementById('profileToggle'),
                panel: document.getElementById('profilePanel')
            }
        };

        // Initialize sidebar search
        this.sidebarSearch = document.getElementById('sidebarSearch');
        
        // Initialize submenu toggles
        this.submenuToggles = document.querySelectorAll('.submenu-toggle');
        
        // Get saved preferences
        this.sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        this.currentTheme = localStorage.getItem('theme') || 'light';
        
        // Apply initial states
        this.applySidebarState();
        this.applyTheme();
    }

    bindEvents() {
        // Sidebar controls
        if (this.sidebarCollapseBtn) {
            this.sidebarCollapseBtn.addEventListener('click', () => this.toggleSidebar());
        }
        
        if (this.mobileSidebarToggle) {
            this.mobileSidebarToggle.addEventListener('click', () => this.toggleMobileSidebar());
        }
        
        if (this.sidebarOverlay) {
            this.sidebarOverlay.addEventListener('click', () => this.closeMobileSidebar());
        }

        // Theme toggle
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Dropdown controls
        Object.entries(this.dropdowns).forEach(([key, dropdown]) => {
            if (dropdown.trigger && dropdown.panel) {
                dropdown.trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleDropdown(key);
                });
            }
            
            if (dropdown.close) {
                dropdown.close.addEventListener('click', () => this.closeDropdown(key));
            }
        });

        // Sidebar search functionality
        if (this.sidebarSearch) {
            this.sidebarSearch.addEventListener('input', (e) => this.filterNavigation(e.target.value));
        }

        // Submenu toggles
        this.submenuToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSubmenu(toggle.closest('.has-submenu'));
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => this.closeAllDropdowns());
        
        // Prevent dropdown close when clicking inside
        Object.values(this.dropdowns).forEach(dropdown => {
            if (dropdown.panel) {
                dropdown.panel.addEventListener('click', (e) => e.stopPropagation());
            }
            if (dropdown.container) {
                dropdown.container.addEventListener('click', (e) => e.stopPropagation());
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Window resize handler
        window.addEventListener('resize', () => this.handleResize());
        
        // Quick action buttons
        this.bindQuickActions();
        
        // Notification actions
        this.bindNotificationActions();
    }

    // Sidebar functionality
    toggleSidebar() {
        this.sidebarCollapsed = !this.sidebarCollapsed;
        this.applySidebarState();
        localStorage.setItem('sidebarCollapsed', this.sidebarCollapsed);
    }

    toggleMobileSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.toggle('active');
            this.sidebarOverlay.classList.toggle('active');
        }
    }

    closeMobileSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.remove('active');
            this.sidebarOverlay.classList.remove('active');
        }
    }

    applySidebarState() {
        if (this.sidebarCollapsed) {
            document.body.classList.add('sidebar-collapsed');
        } else {
            document.body.classList.remove('sidebar-collapsed');
        }
    }

    // Theme functionality
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('theme', this.currentTheme);
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        
        if (this.themeToggle) {
            const icon = this.themeToggle.querySelector('i');
            if (icon) {
                icon.className = this.currentTheme === 'light' ? 'las la-moon' : 'las la-sun';
            }
        }
    }

    initTheme() {
        // Check for system preference if no saved theme
        if (!localStorage.getItem('theme')) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.currentTheme = prefersDark ? 'dark' : 'light';
        }
        this.applyTheme();
    }

    // Dropdown functionality
    toggleDropdown(dropdownKey) {
        const dropdown = this.dropdowns[dropdownKey];
        if (!dropdown || !dropdown.panel) return;

        const isOpen = dropdown.panel.classList.contains('active');
        
        // Close all other dropdowns
        this.closeAllDropdowns();
        
        // Toggle current dropdown
        if (!isOpen) {
            dropdown.panel.classList.add('active');
            dropdown.trigger.setAttribute('aria-expanded', 'true');
            
            // Focus search input if it's the search dropdown
            if (dropdownKey === 'search') {
                const searchInput = dropdown.container.querySelector('.search-input');
                if (searchInput) {
                    setTimeout(() => searchInput.focus(), 100);
                }
            }
        }
    }

    closeDropdown(dropdownKey) {
        const dropdown = this.dropdowns[dropdownKey];
        if (!dropdown || !dropdown.panel) return;

        dropdown.panel.classList.remove('active');
        dropdown.trigger.setAttribute('aria-expanded', 'false');
    }

    closeAllDropdowns() {
        Object.keys(this.dropdowns).forEach(key => this.closeDropdown(key));
    }

    // Navigation search
    filterNavigation(query) {
        const navItems = document.querySelectorAll('.nav-item');
        const searchQuery = query.toLowerCase().trim();

        navItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            const shouldShow = !searchQuery || text.includes(searchQuery);
            
            item.style.display = shouldShow ? '' : 'none';
        });

        // Show/hide sections based on visible items
        const sections = document.querySelectorAll('.nav-section');
        sections.forEach(section => {
            const visibleItems = section.querySelectorAll('.nav-item:not([style*="display: none"])');
            section.style.display = visibleItems.length > 0 ? '' : 'none';
        });
    }

    // Submenu functionality
    toggleSubmenu(submenuItem) {
        if (!submenuItem) return;
        
        const isActive = submenuItem.classList.contains('active');
        
        // Close other submenus
        document.querySelectorAll('.has-submenu.active').forEach(item => {
            if (item !== submenuItem) {
                item.classList.remove('active');
            }
        });
        
        // Toggle current submenu
        submenuItem.classList.toggle('active', !isActive);
    }

    // Keyboard shortcuts
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + / for search
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            this.toggleDropdown('search');
        }
        
        // Ctrl/Cmd + Shift + S for sidebar toggle
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            this.toggleSidebar();
        }
        
        // Ctrl/Cmd + Shift + T for theme toggle
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
            e.preventDefault();
            this.toggleTheme();
        }
        
        // Escape to close dropdowns
        if (e.key === 'Escape') {
            this.closeAllDropdowns();
        }
    }

    // Window resize handler
    handleResize() {
        const isMobile = window.innerWidth < 992;
        
        if (isMobile) {
            // On mobile, always close sidebar
            this.closeMobileSidebar();
        } else {
            // On desktop, remove mobile classes
            if (this.sidebar) {
                this.sidebar.classList.remove('active');
                this.sidebarOverlay.classList.remove('active');
            }
        }
    }

    // Quick actions
    bindQuickActions() {
        const refreshBtn = document.getElementById('refreshData');
        const exportBtn = document.getElementById('exportReport');

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportReport());
        }
    }

    refreshData() {
        // Show loading state
        const refreshBtn = document.getElementById('refreshData');
        if (refreshBtn) {
            const icon = refreshBtn.querySelector('i');
            icon.classList.add('la-spin');
            
            // Simulate data refresh
            setTimeout(() => {
                icon.classList.remove('la-spin');
                this.showToast('Data refreshed successfully', 'success');
            }, 1500);
        }
    }

    exportReport() {
        this.showToast('Preparing report for export...', 'info');
        
        // Simulate export process
        setTimeout(() => {
            this.showToast('Report exported successfully', 'success');
        }, 2000);
    }

    // Notification actions
    bindNotificationActions() {
        const notificationTabs = document.querySelectorAll('.notification-tab');
        const notificationActions = document.querySelectorAll('.notification-action');

        notificationTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchNotificationTab(tab));
        });

        notificationActions.forEach(action => {
            action.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleNotificationAction(action);
            });
        });
    }

    switchNotificationTab(activeTab) {
        const tabs = document.querySelectorAll('.notification-tab');
        tabs.forEach(tab => tab.classList.remove('active'));
        activeTab.classList.add('active');

        const tabType = activeTab.dataset.tab;
        this.filterNotifications(tabType);
    }

    filterNotifications(type) {
        const notifications = document.querySelectorAll('.notification-item');
        
        notifications.forEach(notification => {
            let shouldShow = true;
            
            if (type === 'unread') {
                shouldShow = notification.classList.contains('unread');
            } else if (type === 'mentions') {
                shouldShow = notification.textContent.includes('@');
            }
            
            notification.style.display = shouldShow ? '' : 'none';
        });
    }

    handleNotificationAction(action) {
        if (action.hasAttribute('data-bs-toggle')) return; // Let Bootstrap handle tooltips
        
        const title = action.getAttribute('title');
        if (title === 'Mark all as read') {
            this.markAllNotificationsAsRead();
        }
    }

    markAllNotificationsAsRead() {
        const unreadNotifications = document.querySelectorAll('.notification-item.unread');
        unreadNotifications.forEach(notification => {
            notification.classList.remove('unread');
        });

        const badge = document.getElementById('notificationCount');
        if (badge) {
            badge.textContent = '0';
            badge.style.display = 'none';
        }

        this.showToast('All notifications marked as read', 'success');
    }

    // Toast notifications
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="las ${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="las la-times"></i>
            </button>
        `;

        // Add toast styles if not already added
        if (!document.querySelector('#toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'toast-styles';
            styles.textContent = `
                .toast {
                    position: fixed;
                    top: 1rem;
                    right: 1rem;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-primary);
                    border-radius: var(--radius-lg);
                    padding: 0.75rem 1rem;
                    box-shadow: var(--shadow-lg);
                    z-index: var(--z-tooltip);
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    max-width: 400px;
                    animation: slideInRight 0.3s ease-out;
                }
                .toast-success { border-left: 4px solid var(--success-500); }
                .toast-error { border-left: 4px solid var(--danger-500); }
                .toast-warning { border-left: 4px solid var(--warning-500); }
                .toast-info { border-left: 4px solid var(--info-500); }
                .toast-content { display: flex; align-items: center; gap: 0.5rem; flex: 1; }
                .toast-close { 
                    background: none; border: none; color: var(--text-secondary); 
                    cursor: pointer; padding: 0.25rem; border-radius: var(--radius-sm);
                    transition: var(--transition-fast);
                }
                .toast-close:hover { background: var(--bg-tertiary); }
                @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(toast);

        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);
    }

    getToastIcon(type) {
        const icons = {
            success: 'la-check-circle',
            error: 'la-exclamation-triangle',
            warning: 'la-exclamation-triangle',
            info: 'la-info-circle'
        };
        return icons[type] || icons.info;
    }

    // Utility methods
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

    // Public API methods
    getSidebarState() {
        return this.sidebarCollapsed;
    }

    getTheme() {
        return this.currentTheme;
    }

    setTheme(theme) {
        if (['light', 'dark'].includes(theme)) {
            this.currentTheme = theme;
            this.applyTheme();
            localStorage.setItem('theme', theme);
        }
    }

    expandSidebar() {
        this.sidebarCollapsed = false;
        this.applySidebarState();
        localStorage.setItem('sidebarCollapsed', false);
    }

    collapseSidebar() {
        this.sidebarCollapsed = true;
        this.applySidebarState();
        localStorage.setItem('sidebarCollapsed', true);
    }
}

// Global logout handler
async function handleLogout() {
    try {
        // Show confirmation dialog
        const confirmed = await showConfirmDialog(
            'Sign Out',
            'Are you sure you want to sign out?',
            'Yes, Sign Out',
            'Cancel'
        );
        
        if (!confirmed) return;
        
        // Show loading state
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            const originalContent = logoutBtn.innerHTML;
            logoutBtn.innerHTML = `
                <i class="las la-spinner la-spin"></i>
                <span>Signing out...</span>
            `;
            logoutBtn.disabled = true;
        }
        
        // Send logout request
        const response = await fetch('/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Show success message
            window.modernTheme?.showToast('Signed out successfully', 'success');
            
            // Redirect after short delay
            setTimeout(() => {
                window.location.href = data.data?.redirectUrl || '/auth/login?message=logged_out';
            }, 1000);
        } else {
            throw new Error(data.message || 'Logout failed');
        }
        
    } catch (error) {
        console.error('Logout error:', error);
        window.modernTheme?.showToast('Logout failed. Please try again.', 'error');
        
        // Reset logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.innerHTML = `
                <i class="las la-sign-out-alt"></i>
                <span>Sign Out</span>
            `;
            logoutBtn.disabled = false;
        }
    }
}

// Confirmation dialog helper
function showConfirmDialog(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
    return new Promise((resolve) => {
        // Create modal HTML
        const modalHtml = `
            <div class="confirm-modal-overlay" id="confirmModal">
                <div class="confirm-modal">
                    <div class="confirm-modal-header">
                        <h5 class="confirm-modal-title">${title}</h5>
                    </div>
                    <div class="confirm-modal-body">
                        <p class="confirm-modal-message">${message}</p>
                    </div>
                    <div class="confirm-modal-footer">
                        <button type="button" class="confirm-btn confirm-btn-secondary" onclick="closeConfirmModal(false)">
                            ${cancelText}
                        </button>
                        <button type="button" class="confirm-btn confirm-btn-primary" onclick="closeConfirmModal(true)">
                            ${confirmText}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal styles if not present
        if (!document.querySelector('#confirm-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'confirm-modal-styles';
            styles.textContent = `
                .confirm-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: var(--z-modal);
                    animation: fadeIn 0.2s ease-out;
                }
                .confirm-modal {
                    background: var(--bg-secondary);
                    border-radius: var(--radius-lg);
                    box-shadow: var(--shadow-xl);
                    max-width: 400px;
                    width: calc(100% - 2rem);
                    margin: 1rem;
                    animation: slideIn 0.3s ease-out;
                }
                .confirm-modal-header {
                    padding: 1.5rem 1.5rem 0;
                }
                .confirm-modal-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0;
                }
                .confirm-modal-body {
                    padding: 1rem 1.5rem;
                }
                .confirm-modal-message {
                    color: var(--text-secondary);
                    margin: 0;
                    line-height: 1.5;
                }
                .confirm-modal-footer {
                    padding: 0 1.5rem 1.5rem;
                    display: flex;
                    gap: 0.75rem;
                    justify-content: flex-end;
                }
                .confirm-btn {
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: var(--radius);
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: var(--transition-fast);
                }
                .confirm-btn-secondary {
                    background: var(--bg-tertiary);
                    color: var(--text-secondary);
                }
                .confirm-btn-secondary:hover {
                    background: var(--gray-300);
                    color: var(--text-primary);
                }
                .confirm-btn-primary {
                    background: var(--danger-600);
                    color: white;
                }
                .confirm-btn-primary:hover {
                    background: var(--danger-700);
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideIn {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Store resolve function globally
        window._confirmResolve = resolve;
        
        // Focus confirm button
        setTimeout(() => {
            document.querySelector('.confirm-btn-primary')?.focus();
        }, 100);
    });
}

// Close confirmation modal
function closeConfirmModal(result) {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.2s ease-in';
        setTimeout(() => {
            modal.remove();
            if (window._confirmResolve) {
                window._confirmResolve(result);
                delete window._confirmResolve;
            }
        }, 200);
    }
}

// Add fadeOut animation
if (!document.querySelector('#fadeout-styles')) {
    const styles = document.createElement('style');
    styles.id = 'fadeout-styles';
    styles.textContent = `
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(styles);
}

// Global search functionality
class GlobalSearch {
    constructor() {
        this.searchInput = document.getElementById('globalSearch');
        this.searchSuggestions = document.getElementById('searchSuggestions');
        this.initializeSearch();
    }

    initializeSearch() {
        if (!this.searchInput) return;

        this.searchInput.addEventListener('input', this.debounce((e) => {
            this.performSearch(e.target.value);
        }, 300));

        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.executeSearch(e.target.value);
            }
        });
    }

    performSearch(query) {
        if (!query.trim()) {
            this.showDefaultSuggestions();
            return;
        }

        // Simulate API search
        this.showSearchResults(query);
    }

    showDefaultSuggestions() {
        if (!this.searchSuggestions) return;

        this.searchSuggestions.innerHTML = `
            <div class="suggestion-section">
                <h6 class="suggestion-title">Quick Actions</h6>
                <a href="/admin/pending-approvals" class="suggestion-item">
                    <i class="las la-user-check"></i>
                    <span>Pending Approvals</span>
                </a>
                <a href="/admin/users/new" class="suggestion-item">
                    <i class="las la-plus"></i>
                    <span>Add New User</span>
                </a>
                <a href="/admin/reports" class="suggestion-item">
                    <i class="las la-chart-bar"></i>
                    <span>Generate Report</span>
                </a>
            </div>
        `;
    }

    showSearchResults(query) {
        if (!this.searchSuggestions) return;

        // Simulate search results
        const mockResults = [
            { type: 'company', name: 'Silk Road Textiles', url: '/admin/companies/1' },
            { type: 'user', name: 'Admin User', url: '/admin/users/1' },
            { type: 'product', name: 'Cotton Fabric', url: '/admin/products/1' }
        ].filter(item => item.name.toLowerCase().includes(query.toLowerCase()));

        if (mockResults.length === 0) {
            this.searchSuggestions.innerHTML = `
                <div class="suggestion-section">
                    <p class="text-center text-muted py-3">No results found for "${query}"</p>
                </div>
            `;
            return;
        }

        const resultsHTML = mockResults.map(result => `
            <a href="${result.url}" class="suggestion-item">
                <i class="las la-${this.getResultIcon(result.type)}"></i>
                <span>${result.name}</span>
                <small class="text-muted">${result.type}</small>
            </a>
        `).join('');

        this.searchSuggestions.innerHTML = `
            <div class="suggestion-section">
                <h6 class="suggestion-title">Search Results</h6>
                ${resultsHTML}
            </div>
        `;
    }

    getResultIcon(type) {
        const icons = {
            company: 'building',
            user: 'user',
            product: 'box',
            order: 'shopping-cart'
        };
        return icons[type] || 'file';
    }

    executeSearch(query) {
        if (query.trim()) {
            window.location.href = `/admin/search?q=${encodeURIComponent(query)}`;
        }
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme system
    window.modernTheme = new ModernTheme();
    
    // Initialize global search
    window.globalSearch = new GlobalSearch();
    
    // Initialize tooltips if Bootstrap is available
    if (typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    // Initialize notification tab functionality
    const notificationTabs = document.querySelectorAll('.notification-tab');
    notificationTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            notificationTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });
    
    // Initialize language selector
    const languageOptions = document.querySelectorAll('.language-option');
    languageOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            const lang = option.getAttribute('href').split('/').pop();
            window.location.href = `/language/${lang}`;
        });
    });
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModernTheme, GlobalSearch };
}