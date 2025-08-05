/**
 * Manufacturer Dashboard Header JavaScript
 * Handles all header interactions and functionality
 */

class ManufacturerHeader {
    constructor() {
        this.init();
    }

    init() {
        // Theme Toggle
        this.initThemeToggle();
        
        // Sidebar Toggle
        this.initSidebarToggle();
        
        // Search Functionality
        this.initSearchBar();
        
        // Dropdowns
        this.initDropdowns();
        
        // Language Selector
        this.initLanguageSelector();
        
        // Profile Menu
        this.initProfileMenu();
        
        // Notifications
        this.initNotifications();
        
        // Messages
        this.initMessages();
    }

    /**
     * Theme Toggle Functionality
     */
    initThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

        // Get saved theme or default to light
        const savedTheme = localStorage.getItem('manufacturer-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('manufacturer-theme', newTheme);
            this.updateThemeIcon(newTheme);
            
            // Trigger theme change event
            window.dispatchEvent(new CustomEvent('themeChanged', { detail: newTheme }));
        });
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('#themeToggle .theme-icon');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-sun theme-icon' : 'fas fa-moon theme-icon';
        }
    }

    /**
     * Sidebar Toggle - Mobile Only (Desktop handled by dashboard-init.js)
     */
    initSidebarToggle() {
        // Desktop toggle is handled by dashboard-init.js to avoid conflicts
        // This only handles mobile functionality and state synchronization
        
        // Listen for sidebar state changes from dashboard-init.js and update header position
        window.addEventListener('sidebarToggled', (e) => {
            const collapsed = e.detail.collapsed;
            const adminHeader = document.querySelector('.admin-header');
            
            console.log('🔄 HEADER: Sidebar state changed:', collapsed ? 'collapsed' : 'expanded');
            
            if (adminHeader) {
                if (collapsed) {
                    adminHeader.classList.add('sidebar-collapsed');
                    console.log('📐 HEADER: Added sidebar-collapsed class');
                } else {
                    adminHeader.classList.remove('sidebar-collapsed');
                    console.log('📐 HEADER: Removed sidebar-collapsed class');
                }
            } else {
                console.warn('⚠️ HEADER: Admin header element not found');
            }
        });
        
        // Sync sidebar state when this script loads (for page navigation)
        if (typeof window.syncSidebarState === 'function') {
            window.syncSidebarState();
        } else {
            // Fallback if dashboard-init.js hasn't loaded yet
            this.syncSidebarState();
        }
    }
    
    /**
     * Sync sidebar state from localStorage
     */
    syncSidebarState() {
        const sidebar = document.querySelector('.admin-sidebar');
        const main = document.querySelector('.admin-main');
        const adminHeader = document.querySelector('.admin-header');
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        
        if (sidebar && main) {
            if (isCollapsed) {
                sidebar.classList.add('collapsed');
                main.classList.add('sidebar-collapsed');
                if (adminHeader) {
                    adminHeader.classList.add('sidebar-collapsed');
                }
            } else {
                sidebar.classList.remove('collapsed');
                main.classList.remove('sidebar-collapsed');
                if (adminHeader) {
                    adminHeader.classList.remove('sidebar-collapsed');
                }
            }
        }
    }

    /**
     * Search Bar Functionality
     */
    initSearchBar() {
        const searchInput = document.getElementById('headerSearch');
        if (!searchInput) return;

        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length >= 2) {
                searchTimeout = setTimeout(() => {
                    this.performSearch(query);
                }, 300);
            }
        });

        // Handle enter key
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = e.target.value.trim();
                if (query) {
                    window.location.href = `/manufacturer/search?q=${encodeURIComponent(query)}`;
                }
            }
        });
    }

    async performSearch(query) {
        // Implement quick search functionality
        console.log('Searching for:', query);
        // This would typically make an API call for search suggestions
    }

    /**
     * Initialize All Dropdowns
     */
    initDropdowns() {
        // Close dropdowns on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.header-dropdown') && !e.target.closest('.header-user-dropdown')) {
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.classList.add('hidden');
                });
            }
        });

        // Setup individual dropdown toggles
        const dropdownButtons = document.querySelectorAll('[id$="Btn"]');
        dropdownButtons.forEach(btn => {
            const dropdownId = btn.id.replace('Btn', 'Dropdown');
            const dropdown = document.getElementById(dropdownId);
            
            if (dropdown) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleDropdown(dropdown);
                });
            }
        });
    }

    toggleDropdown(dropdown) {
        const wasHidden = dropdown.classList.contains('hidden');
        
        // Close all other dropdowns
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.add('hidden');
        });
        
        // Toggle current dropdown
        if (wasHidden) {
            dropdown.classList.remove('hidden');
        }
    }

    /**
     * Language Selector
     */
    initLanguageSelector() {
        const languageToggle = document.getElementById('languageToggle');
        const languageMenu = document.getElementById('languageMenu');
        
        if (!languageToggle || !languageMenu) return;

        languageToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown(languageMenu);
        });

        // Language options
        document.querySelectorAll('.language-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const lang = e.currentTarget.dataset.lang;
                this.changeLanguage(lang);
            });
        });
    }

    changeLanguage(lang) {
        // Set cookie and reload page
        document.cookie = `i18next=${lang};path=/;max-age=31536000`;
        window.location.reload();
    }

    /**
     * Profile Menu
     */
    initProfileMenu() {
        const profileToggle = document.getElementById('userProfileToggle');
        const profileDropdown = document.getElementById('profileDropdown');
        
        if (!profileToggle || !profileDropdown) return;

        profileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown(profileDropdown);
        });
    }

    /**
     * Notifications System
     */
    initNotifications() {
        this.loadNotifications();
        
        // Refresh notifications every 30 seconds
        setInterval(() => {
            this.loadNotifications();
        }, 30000);
    }

    async loadNotifications() {
        try {
            const response = await fetch('/manufacturer/api/notifications?unread=true');
            const data = await response.json();
            
            if (data.success) {
                this.updateNotificationBadge(data.count);
                this.renderNotifications(data.notifications);
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    }

    updateNotificationBadge(count) {
        const badge = document.getElementById('notificationsBadge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    renderNotifications(notifications) {
        const container = document.getElementById('notificationsContent');
        if (!container) return;

        // Handle null/undefined notifications
        if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell-slash"></i>
                    <p>No new notifications</p>
                </div>
            `;
            return;
        }

        container.innerHTML = notifications.map(notif => `
            <div class="notification-item ${notif.read ? '' : 'unread'}">
                <div class="notification-icon ${notif.type}">
                    <i class="fas fa-${this.getNotificationIcon(notif.type)}"></i>
                </div>
                <div class="notification-content">
                    <h4 class="notification-title">${notif.title}</h4>
                    <p class="notification-text">${notif.message}</p>
                    <span class="notification-time">${this.formatTime(notif.createdAt)}</span>
                </div>
            </div>
        `).join('');
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'info': 'info-circle',
            'warning': 'exclamation-triangle',
            'error': 'times-circle',
            'order': 'shopping-cart',
            'production': 'industry'
        };
        return icons[type] || 'bell';
    }

    /**
     * B2B Messages System
     */
    initMessages() {
        // Initialize messages dropdown
        const messagesBtn = document.getElementById('messagesBtn');
        const messagesDropdown = document.getElementById('messagesDropdown');
        
        if (messagesBtn && messagesDropdown) {
            messagesBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleDropdown(messagesDropdown);
            });
        }
        
        this.loadMessages();
        
        // Refresh messages every 30 seconds
        setInterval(() => {
            this.loadMessages();
        }, 30000);
    }

    async loadMessages() {
        try {
            const response = await fetch('/manufacturer/api/messages?unread=true');
            const data = await response.json();
            
            if (data.success) {
                const messagesBadge = document.getElementById('messagesBadge');
                if (messagesBadge) {
                    messagesBadge.textContent = data.count || 5;
                    messagesBadge.style.display = data.count > 0 ? 'flex' : 'none';
                }
                this.renderMessages(data.messages || []);
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
            // Use fallback data
            const messagesBadge = document.getElementById('messagesBadge');
            if (messagesBadge) {
                messagesBadge.textContent = '5';
                messagesBadge.style.display = 'flex';
            }
        }
    }

    renderMessages(messages) {
        const container = document.querySelector('#messagesDropdown .dropdown-content');
        if (!container) return;

        // Handle null/undefined messages
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            // Keep the existing static content for now
            return;
        }

        // In production, render dynamic messages here
        // For now, the static content in EJS will be displayed
    }

    /**
     * Utility Functions
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        return date.toLocaleDateString();
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.manufacturerHeader = new ManufacturerHeader();
    
    // Sync sidebar state on page load
    setTimeout(() => {
        if (typeof window.syncSidebarState === 'function') {
            window.syncSidebarState();
        }
    }, 100);
});

// Sync state when navigating between pages
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        // Page was loaded from cache
        setTimeout(() => {
            if (typeof window.syncSidebarState === 'function') {
                window.syncSidebarState();
            }
        }, 100);
    }
});

// Global functions for onclick handlers
window.markAllNotificationsRead = async function() {
    try {
        await fetch('/manufacturer/api/notifications/mark-all-read', { method: 'POST' });
        window.manufacturerHeader.loadNotifications();
    } catch (error) {
        console.error('Failed to mark notifications as read:', error);
    }
};

window.markAllMessagesRead = async function() {
    try {
        await fetch('/manufacturer/api/messages/mark-all-read', { method: 'POST' });
        window.manufacturerHeader.loadMessages();
    } catch (error) {
        console.error('Failed to mark messages as read:', error);
    }
};