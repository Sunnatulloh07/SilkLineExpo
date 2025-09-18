/**
 * Manufacturer Dashboard Header JavaScript
 * Handles all header interactions and functionality
 */

// Check if ManufacturerHeader already exists
if (typeof window.ManufacturerHeader !== 'undefined') {
} else {

class ManufacturerHeader {
    constructor() {
        this.init();
    }

    init() {
        // Check if dashboard-init.js has already initialized to prevent conflicts
        if (window.sidebarInitialized) {
            
            // Only initialize non-conflicting functions
            this.initSearchBar();
            this.initNotifications();
            this.initMessages();
        } else {
            
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
    }

    /**
     * Theme Toggle Functionality
     */
    initThemeToggle() {
        // Check if Universal Theme Manager is available
        if (window.UniversalTheme) {
            // Universal Theme Manager will handle theme toggle
            return;
        }

        // Fallback implementation
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

        // Get saved theme or default to light
        const savedTheme = localStorage.getItem('dashboard-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('dashboard-theme', newTheme);
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
            
            
            if (adminHeader) {
                if (collapsed) {
                    adminHeader.classList.add('sidebar-collapsed');
                } else {
                    adminHeader.classList.remove('sidebar-collapsed');
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
        // This would typically make an API call for search suggestions
    }

    /**
     * Initialize All Dropdowns
     */
    initDropdowns() {
        // Close dropdowns on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.header-dropdown') && !e.target.closest('.header-user-dropdown') && !e.target.closest('.language-dropdown')) {
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.classList.add('hidden');
                });
            }
        });

        // Close dropdowns on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
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
            if (menu !== dropdown) {
                menu.classList.add('hidden');
            }
        });
        
        // Toggle current dropdown
        if (wasHidden) {
            dropdown.classList.remove('hidden');
            
            // If it's messages dropdown, always load messages
            if (dropdown.id === 'messagesDropdown') {
                this.loadMessages();
            }
        } else {
            dropdown.classList.add('hidden');
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

        // Language options - now using direct links, no need for click handlers
        // The links will handle language change automatically
    }

    changeLanguage(lang) {
        try {
            // Validate language code
            const supportedLanguages = ['uz', 'en', 'ru', 'tr', 'fa', 'zh'];
            if (!supportedLanguages.includes(lang)) {
                // console.error('❌ Unsupported language:', lang);
                return;
            }

            // Set consistent language cookies
            const cookieOptions = `path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
            document.cookie = `i18next=${lang}; ${cookieOptions}`;
            document.cookie = `selectedLanguage=${lang}; ${cookieOptions}`;
            document.cookie = `language=${lang}; ${cookieOptions}`;
            
            // Use unified API route instead of old route
            const redirectUrl = `/api/language/${lang}`;
            
            // Show loading state
            const languageToggle = document.getElementById('languageToggle');
            if (languageToggle) {
                languageToggle.style.opacity = '0.5';
                languageToggle.disabled = true;
            }
            
            // Navigate to unified language API route
            window.location.href = redirectUrl;
            
        } catch (error) {
            // console.error('❌ Language change error:', error);
        }
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
        this.loadInquiriesAndOrders();
        this.updateNotificationsBadge();
        
        // Refresh notifications every 30 seconds
        setInterval(() => {
            this.loadNotifications();
            this.loadInquiriesAndOrders();
            this.updateNotificationsBadge();
        }, 30000);
        
        // Also refresh when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.loadMessages();
                this.loadInquiriesAndOrders();
                this.updateNotificationsBadge();
                this.updateSidebarMessagesBadge();
            }
        });
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
            // console.error('Failed to load notifications:', error);
        }
    }

    async updateNotificationsBadge() {
        try {
            // FIX: Use API unreadCount instead of calculating
            const notificationsResponse = await fetch('/manufacturer/api/notifications?unread=true');
            const notificationsData = await notificationsResponse.json();
            
            if (notificationsData.success && notificationsData.data) {
                const totalCount = notificationsData.data.unreadCount || 0;
                
                // Update header notification badge
            this.updateNotificationBadge(totalCount);
                
                // ✅ CRITICAL: Update sidebar menu badges
                this.updateSidebarMenuBadges(notificationsData.data);
            } else {
                // Fallback: hide all badges
                this.updateNotificationBadge(0);
                this.hideAllSidebarBadges();
            }
        } catch (error) {
            console.error('Error updating notifications badge:', error);
            // Fallback: hide all badges on error
            this.updateNotificationBadge(0);
        }
    }

    async loadInquiriesAndOrders() {
        try {
            // FIX: Use same API call as badge to ensure consistency
            const notificationsResponse = await fetch('/manufacturer/api/notifications?unread=true&limit=10');
            const notificationsData = await notificationsResponse.json();
            
            let notifications = notificationsData.success ? (notificationsData.data?.notifications || []) : [];
            
            // Don't filter here since API already returns unread only
            // notifications = notifications.filter(notification => !notification.read);
            
            // Limit to 6 items total (3 inquiries + 3 orders)
            notifications = notifications.slice(0, 6);
            
            this.renderInquiriesAndOrders(notifications);
        } catch (error) {
            console.error('Error loading inquiries and orders:', error);
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
                    <p>${this.getTranslation('admin.header.notifications.no_notifications', 'Hozircha yangi bildirishnomalar yo\'q')}</p>
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

    renderInquiriesAndOrders(notifications) {
        const container = document.getElementById('notificationsContent');
        if (!container) {
            return;
        }

        // FIX: Use notifications data instead of separate inquiries and orders
        if (!notifications || notifications.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell-slash"></i>
                    <p>${this.getTranslation('admin.header.notifications.no_notifications', 'Hozircha yangi xabarlar yo\'q')}</p>
                </div>
            `;
            return;
        }

        // Group notifications by type
        const inquiries = notifications.filter(n => n.type === 'inquiry');
        const orders = notifications.filter(n => n.type === 'order');
        const otherNotifications = notifications.filter(n => !['inquiry', 'order'].includes(n.type));

        let content = '';

        // Add inquiries section
        if (inquiries.length > 0) {
            content += `
                <div class="notifications-section">
                    <h5 class="section-title">
                        <i class="fas fa-envelope text-primary"></i>
                        ${this.getTranslation('admin.header.notifications.new_inquiries', 'Yangi So\'rovlar')} (${inquiries.length})
                    </h5>
            `;
            
            inquiries.forEach(notification => {
                content += `
                    <div class="notification-item inquiry-item ${!notification.read ? 'unread' : ''}" data-item-id="${notification.metadata?.inquiryId || notification.id}" data-item-type="inquiry" data-action-url="${notification.actionUrl || '/manufacturer/inquiries'}">
                        <div class="notification-icon info">
                            <i class="fas fa-envelope"></i>
                        </div>
                        <div class="notification-content">
                            <h4 class="notification-title">${notification.title}</h4>
                            <p class="notification-text">${notification.message}</p>
                            <span class="notification-time">${this.formatTime(notification.createdAt)}</span>
                        </div>
                    </div>
                `;
            });
            
            content += '</div>';
        }

        // Add orders section
        if (orders.length > 0) {
            content += `
                <div class="notifications-section">
                    <h5 class="section-title">
                        <i class="fas fa-shopping-cart text-success"></i>
                        ${this.getTranslation('admin.header.notifications.new_orders', 'Yangi Buyurtmalar')} (${orders.length})
                    </h5>
            `;
            
            orders.forEach(notification => {
                content += `
                    <div class="notification-item order-item ${!notification.read ? 'unread' : ''}" data-item-id="${notification.metadata?.orderId || notification.id}" data-item-type="order" data-action-url="${notification.actionUrl || '/manufacturer/orders'}">
                        <div class="notification-icon order">
                            <i class="fas fa-shopping-cart"></i>
                        </div>
                        <div class="notification-content">
                            <h4 class="notification-title">${notification.title}</h4>
                            <p class="notification-text">${notification.message}</p>
                            <span class="notification-time">${this.formatTime(notification.createdAt)}</span>
                        </div>
                    </div>
                `;
            });
            
            content += '</div>';
        }

        // Add other notifications section
        if (otherNotifications.length > 0) {
            content += `
                <div class="notifications-section">
                    <h5 class="section-title">
                        <i class="fas fa-bell text-info"></i>
                        ${this.getTranslation('admin.header.notifications.other_notifications', 'Boshqa Bildirishnomalar')} (${otherNotifications.length})
                    </h5>
            `;
            
            otherNotifications.forEach(notification => {
                content += `
                    <div class="notification-item other-item ${!notification.read ? 'unread' : ''}" data-item-id="${notification.id}" data-item-type="${notification.type}" data-action-url="${notification.actionUrl || '#'}">
                        <div class="notification-icon ${notification.type}">
                            <i class="fas fa-${this.getNotificationIcon(notification.type)}"></i>
                        </div>
                        <div class="notification-content">
                            <h4 class="notification-title">${notification.title}</h4>
                            <p class="notification-text">${notification.message}</p>
                            <span class="notification-time">${this.formatTime(notification.createdAt)}</span>
                        </div>
                </div>
            `;
            });
            
            content += '</div>';
        }

        // Add Mark All as Read button if there are unread items
        const unreadCount = notifications.filter(n => !n.read).length;
        
        if (unreadCount > 0) {
            content += `
                <div class="mark-all-read-section">
                    <button class="btn btn-sm btn-outline-primary mark-all-read-btn" onclick="window.markAllNotificationsRead()">
                        <i class="fas fa-check-double"></i>
                        ${this.getTranslation('admin.header.notifications.mark_all_read', 'Barchasini o\'qilgan deb belgilash')} (${unreadCount})
                    </button>
                </div>
            `;
        }

        container.innerHTML = content;
        
        // Add click handlers for notification items
        const notificationItems = container.querySelectorAll('.notification-item');
        notificationItems.forEach((item, index) => {
            item.addEventListener('click', async () => {
                const notificationData = this.extractNotificationData(item);
                
                // Add loading state
                item.classList.add('loading');
                
                try {
                    // Mark individual item as read
                    await this.markNotificationAsRead(notificationData);
                    
                    // Update UI
                    this.updateNotificationItemUI(item);
                    
                    // Navigate to appropriate page
                    this.navigateToNotificationPage(notificationData);
                    
                } catch (error) {
                    console.error('Error handling notification click:', error);
                    // Still navigate even if marking as read fails
                    this.navigateToNotificationPage(notificationData);
                }
            });
        });
    }

    /**
     * Extract notification data from DOM element
     * @param {HTMLElement} item - The notification item element
     * @returns {Object} Notification data
     */
    extractNotificationData(item) {
        const itemType = item.classList.contains('inquiry-item') ? 'inquiry' : 
                        item.classList.contains('order-item') ? 'order' : 'other';
        
        return {
            type: itemType,
            id: item.dataset.itemId,
            actionUrl: item.dataset.actionUrl,
            element: item
        };
    }

    /**
     * Mark notification as read via API
     * @param {Object} notificationData - The notification data
     * @returns {Promise<void>}
     */
    async markNotificationAsRead(notificationData) {
        const { type, id } = notificationData;
        
        const apiEndpoints = {
            inquiry: '/manufacturer/api/inquiries/mark-read',
            order: '/manufacturer/api/orders/mark-read',
            other: '/manufacturer/api/notifications/mark-read'
        };
        
        const requestBodies = {
            inquiry: { inquiryId: id },
            order: { orderId: id },
            other: { notificationId: id }
        };
        
        const endpoint = apiEndpoints[type];
        const body = requestBodies[type];
        
        if (!endpoint) {
            throw new Error(`Unknown notification type: ${type}`);
        }
        
        const response = await fetch(endpoint, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
                        });
                        
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }
                        
                        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Failed to mark notification as read');
        }
    }

    /**
     * Update notification item UI after marking as read
     * @param {HTMLElement} item - The notification item element
     */
    updateNotificationItemUI(item) {
                            item.classList.remove('unread');
        item.classList.remove('loading');
        // This will update both header and sidebar badges
                            this.updateNotificationsBadge();
    }

    /**
     * Navigate to appropriate page based on notification data
     * @param {Object} notificationData - The notification data
     */
    navigateToNotificationPage(notificationData) {
        const { actionUrl, type, id } = notificationData;
        
        // Professional notification navigation logic
        const defaultUrls = {
            inquiry: '/manufacturer/inquiries', // General inquiries page
            order: '/manufacturer/orders',      // General orders page
            other: '#'
        };
        
        // ✅ CRITICAL FIX: Always use default URLs for notifications, ignore actionUrl
        // Notifications should go to general pages, not specific IDs
        // This ensures proper separation between notifications and messages navigation
        const targetUrl = defaultUrls[type] || '#';
        
        
        if (targetUrl !== '#') {
            window.location.href = targetUrl;
        }
    }

    /**
     * Update sidebar menu badges based on notification data
     * @param {Object} notificationData - The notification data from API
     */
    updateSidebarMenuBadges(notificationData) {
        try {
            // Validate input data
            if (!this.isValidNotificationData(notificationData)) {
                console.warn('Invalid notification data provided to updateSidebarMenuBadges');
                return;
            }
            
            const { summary } = notificationData;
            const { byType } = summary;
            
            // Configuration-driven badge updates
            const badgeConfig = this.getSidebarBadgeConfig();
            
            Object.entries(badgeConfig).forEach(([menuType, config]) => {
                const count = byType[config.notificationType] || 0;
                this.updateSidebarBadge(menuType, count);
            });
            
                } catch (error) {
            console.error('Error updating sidebar badges:', error);
            // Fallback: hide all badges on error
            this.hideAllSidebarBadges();
        }
    }

    /**
     * Get sidebar badge configuration
     * @returns {Object} Badge configuration object
     */
    getSidebarBadgeConfig() {
        return {
            inquiries: {
                notificationType: 'inquiry',
                badgeClass: 'badge-info',
                href: '/manufacturer/inquiries'
            },
            orders: {
                notificationType: 'order',
                badgeClass: 'badge-danger',
                href: '/manufacturer/orders'
            },
            messages: {
                notificationType: 'message',
                badgeClass: 'badge-primary',
                href: '/manufacturer/messages'
            }
        };
    }

    /**
     * Validate notification data structure
     * @param {Object} notificationData - The notification data to validate
     * @returns {boolean} True if valid, false otherwise
     */
    isValidNotificationData(notificationData) {
        return notificationData && 
               notificationData.summary && 
               notificationData.summary.byType &&
               typeof notificationData.summary.byType === 'object';
    }

    /**
     * Hide all sidebar badges
     */
    hideAllSidebarBadges() {
        try {
            const badgeConfig = this.getSidebarBadgeConfig();
            Object.keys(badgeConfig).forEach(menuType => {
                this.updateSidebarBadge(menuType, 0);
            });
        } catch (error) {
            console.error('Error hiding all sidebar badges:', error);
        }
    }

    /**
     * Update specific sidebar badge
     * @param {string} menuType - The menu type (inquiries, orders, messages)
     * @param {number} count - The badge count
     */
    updateSidebarBadge(menuType, count) {
        try {
            // Validate inputs
            if (!menuType || typeof count !== 'number' || count < 0) {
                console.warn(`Invalid parameters for updateSidebarBadge: menuType=${menuType}, count=${count}`);
                return;
            }
            
            // Get badge configuration
            const badgeConfig = this.getSidebarBadgeConfig();
            const config = badgeConfig[menuType];
            
            if (!config) {
                console.warn(`Unknown menu type: ${menuType}`);
                return;
            }
            
            // Find the sidebar menu item
            const menuItem = document.querySelector(`a[href="${config.href}"]`);
            
            if (!menuItem) {
                console.warn(`Menu item not found for: ${config.href}`);
                return;
            }
            
            // Find or create badge element
            let badge = menuItem.querySelector('.nav-badge');
            
            if (count > 0) {
                if (!badge) {
                    // Create new badge with proper configuration
                    badge = this.createSidebarBadge(config.badgeClass);
                    menuItem.appendChild(badge);
                }
                
                // Update badge content and visibility
                this.updateBadgeContent(badge, count);
                
            } else if (badge) {
                // Hide badge if count is 0
                this.hideBadge(badge);
            }
            
        } catch (error) {
            console.error(`Error updating ${menuType} sidebar badge:`, error);
        }
    }

    /**
     * Create a new sidebar badge element
     * @param {string} badgeClass - The CSS class for the badge
     * @returns {HTMLElement} The created badge element
     */
    createSidebarBadge(badgeClass) {
        const badge = document.createElement('span');
        badge.className = `nav-badge ${badgeClass}`;
        badge.setAttribute('aria-label', 'Notification count');
        return badge;
    }

    /**
     * Update badge content and make it visible
     * @param {HTMLElement} badge - The badge element
     * @param {number} count - The count to display
     */
    updateBadgeContent(badge, count) {
        badge.textContent = count;
        badge.style.display = 'inline-block';
        badge.setAttribute('aria-label', `${count} unread notifications`);
    }

    /**
     * Hide a badge element
     * @param {HTMLElement} badge - The badge element to hide
     */
    hideBadge(badge) {
        badge.style.display = 'none';
        badge.removeAttribute('aria-label');
    }

    /**
     * B2B Messages System
     */
    initMessages() {
        // Initialize messages dropdown
        const messagesBtn = document.getElementById('messagesBtn');
        const messagesDropdown = document.getElementById('messagesDropdown');
        
        if (messagesBtn && messagesDropdown) {
            // Remove any existing event listeners to prevent conflicts
            const newMessagesBtn = messagesBtn.cloneNode(true);
            messagesBtn.parentNode.replaceChild(newMessagesBtn, messagesBtn);
            
            // Add fresh event listener
            newMessagesBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleDropdown(messagesDropdown);
            });
        }
        
        this.loadMessages();
        this.updateSidebarMessagesBadge();
        
        // Refresh messages every 30 seconds
        setInterval(() => {
            this.loadMessages();
            this.updateSidebarMessagesBadge();
        }, 30000);
    }

    /**
     * Get translation function
     */
    getTranslation(key, fallback = '') {
        // Try to get translation from global i18next
        if (typeof window.i18next !== 'undefined' && window.i18next.t) {
            const translation = window.i18next.t(key);
            // If translation is the same as key, it means translation not found
            if (translation !== key) {
                return translation;
            }
        }
        
        // Try to get translation from global t function
        if (typeof window.t !== 'undefined') {
            const translation = window.t(key);
            // If translation is the same as key, it means translation not found
            if (translation !== key) {
                return translation;
            }
        }
        
        // Return fallback if available, otherwise return key
        return fallback || key;
    }

    async loadMessages() {
        try {
            const response = await fetch('/manufacturer/api/messages?unread=true');
            const data = await response.json();
            
            if (data.success) {
                const messagesBadge = document.getElementById('messagesBadge');
                
                // Fix: Handle different response structures
                let messages = data.messages;
                let count = data.count;
                
                                // Check if data is nested in 'data' object
                if (data.data && data.data.messages) {
                    messages = data.data.messages;
                }
                
                if (data.data && data.data.count !== undefined) {
                    count = data.data.count;
                }
                
                // Check if data has chatPreviews (alternative structure)
                if (data.data && data.data.chatPreviews && Array.isArray(data.data.chatPreviews)) {
                    messages = data.data.chatPreviews.map(chat => ({
                        id: chat.id,
                        sender: chat.companyName || this.getTranslation('admin.header.messages.unknown_sender', 'Noma\'lum'),
                        content: chat.lastMessage || this.getTranslation('admin.header.messages.no_message', 'Xabar yo\'q'),
                        time: this.formatTime(chat.lastMessageTime),
                        orderNumber: this.getTranslation('admin.header.messages.not_available', 'Mavjud emas'),
                        isUnread: chat.isUnread || false
                    }));
                }
                
                if (data.data && data.data.stats && data.data.stats.totalUnread !== undefined) {
                    count = data.data.stats.totalUnread;
                }
                
                // Filter only unread messages
                if (Array.isArray(messages)) {
                    messages = messages.filter(msg => msg.isUnread !== false);
                }
                
                if (messagesBadge) {
                    messagesBadge.textContent = count || 0;
                    messagesBadge.style.display = count > 0 ? 'flex' : 'none';
                }
                
                this.renderMessages(messages || []);
            } else {
            }
        } catch (error) {
            // Use fallback data
            const messagesBadge = document.getElementById('messagesBadge');
            if (messagesBadge) {
                messagesBadge.textContent = '0';
                messagesBadge.style.display = 'none';
            }
        }
    }

    renderMessages(messages) {
        const container = document.querySelector('#messagesDropdown .dropdown-content');
        
        if (!container) {
            return;
        }

        // Handle null/undefined messages
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            // Show no messages state
            container.innerHTML = `
                <div class="no-messages">
                    <i class="fas fa-inbox text-muted"></i>
                    <p class="text-muted">${this.getTranslation('admin.header.messages.no_messages', 'Hozircha xabarlar yo\'q')}</p>
                </div>
            `;
            return;
        }

     
        // Render dynamic messages with proper data attributes
        const messagesHTML = messages.map(message => {
            const messageData = this.extractMessageData(message);
            return this.createMessageHTML(messageData);
        }).join('');
        
        container.innerHTML = messagesHTML;

        // Add click handlers for messages
        const messageItems = container.querySelectorAll('.message-item');
        
        messageItems.forEach((item, index) => {
            item.addEventListener('click', async () => {
                const messageId = item.dataset.messageId;
                const messageType = item.dataset.messageType;
                const orderId = item.dataset.orderId;
                const inquiryId = item.dataset.inquiryId;
                
                
                // Add loading state
                item.classList.add('loading');
                
                try {
                    // Mark individual message as read
                    const response = await fetch('/manufacturer/api/messages/mark-read', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ messageId: messageId })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    const result = await response.json();
                    if (result.success) {
                        // Remove unread class and update badge
                        item.classList.remove('unread');
                        this.updateSidebarMessagesBadge();
                    }
                    
                    // ✅ CRITICAL: Navigate to specific conversation based on type
                    this.navigateToMessageConversation(messageType, orderId, inquiryId);
                    
                } catch (error) {
                    console.error('Error marking message as read:', error);
                    // Still navigate even if marking as read fails
                    this.navigateToMessageConversation(messageType, orderId, inquiryId);
                }
            });
        });
    }

    /**
     * Extract and validate message data for rendering
     * @param {Object} message - The raw message object
     * @returns {Object} Processed message data
     */
    extractMessageData(message) {
        const messageConfig = this.getMessageConfig();
        
        return {
            id: message.id || '',
            type: this.validateMessageType(message.type) || messageConfig.defaultType,
            orderId: message.orderId || '',
            inquiryId: message.inquiryId || '',
            sender: message.sender || this.getTranslation('admin.header.messages.unknown_sender', 'Noma\'lum'),
            content: message.content || this.getTranslation('admin.header.messages.no_message', 'Xabar yo\'q'),
            time: message.time || this.getTranslation('admin.header.messages.not_available', 'Mavjud emas'),
            orderNumber: this.processOrderNumber(message.orderNumber),
            isUnread: Boolean(message.isUnread)
        };
    }

    /**
     * Process and clean order number data
     * @param {any} orderNumber - The raw order number
     * @returns {string} Processed order number
     */
    processOrderNumber(orderNumber) {
        // If orderNumber is null, undefined, or empty, return empty string
        if (!orderNumber) {
            return '';
        }
        
        // Convert to string and trim
        const processedOrderNumber = String(orderNumber).trim();
        
        // If it's empty after processing, return empty string
        if (!processedOrderNumber) {
            return '';
        }
        
        // Return the processed order number
        return processedOrderNumber;
    }

    /**
     * Create HTML for a single message item
     * @param {Object} messageData - The processed message data
     * @returns {string} HTML string for the message item
     */
    createMessageHTML(messageData) {
        const { id, type, orderId, inquiryId, sender, content, time, orderNumber, isUnread } = messageData;
        
        const unreadClass = isUnread ? 'unread' : '';
        const orderInfo = this.createOrderInfoHTML(orderNumber);
        
        return `
            <div class="message-item ${unreadClass}" 
                 data-message-id="${id}" 
                 data-message-type="${type}" 
                 data-order-id="${orderId}" 
                 data-inquiry-id="${inquiryId}">
                <div class="message-avatar-placeholder">
                    <i class="fas fa-user"></i>
                </div>
                <div class="message-content">
                    <h4 class="message-sender">${sender}</h4>
                    <p class="message-text">${content}</p>
                    <span class="message-time">${time}</span>
                    ${orderInfo}
                </div>
            </div>
        `;
    }

    /**
     * Create order information HTML if available
     * @param {string} orderNumber - The order number
     * @returns {string} HTML string for order info
     */
    createOrderInfoHTML(orderNumber) {
        const orderPrefix = this.getTranslation('admin.header.messages.order_prefix', 'Buyurtma');
        
        // Professional validation: check if orderNumber is valid and meaningful
        if (this.isValidOrderNumber(orderNumber)) {
            return `<small class="message-order">${orderPrefix}: ${orderNumber}</small>`;
        }
        return '';
    }

    /**
     * Validate if order number is meaningful and should be displayed
     * @param {any} orderNumber - The order number to validate
     * @returns {boolean} True if order number is valid and meaningful
     */
    isValidOrderNumber(orderNumber) {
        // Check for null, undefined, empty string, or whitespace-only
        if (!orderNumber || typeof orderNumber !== 'string') {
            return false;
        }
        
        // Trim whitespace and check if empty after trimming
        const trimmedOrderNumber = orderNumber.trim();
        if (!trimmedOrderNumber) {
            return false;
        }
        
        // Check against common "not available" values
        const notAvailableValues = [
            'N/A',
            'n/a', 
            'NA',
            'na',
            'null',
            'undefined',
            'Mavjud emas',
            'mavjud emas',
            'Not Available',
            'not available',
            'N/A',
            'N/A',
            '-',
            '--',
            '...',
            'N/A',
            'N/A'
        ];
        
        // Check if order number matches any "not available" pattern
        if (notAvailableValues.includes(trimmedOrderNumber.toLowerCase())) {
            return false;
        }
        
        // Check if it's a meaningful order number (contains alphanumeric characters)
        const hasAlphanumeric = /[a-zA-Z0-9]/.test(trimmedOrderNumber);
        if (!hasAlphanumeric) {
            return false;
        }
        
        // Check minimum length (order numbers should be at least 3 characters)
        if (trimmedOrderNumber.length < 3) {
            return false;
        }
        
        return true;
    }

    /**
     * Get message configuration
     * @returns {Object} Message configuration object
     */
    getMessageConfig() {
        return {
            defaultType: 'inquiry',
            validTypes: ['inquiry', 'order'],
            fallbackUrl: '/manufacturer/messages'
        };
    }

    /**
     * Validate message type
     * @param {string} type - The message type to validate
     * @returns {string|null} Valid type or null
     */
    validateMessageType(type) {
        const config = this.getMessageConfig();
        return config.validTypes.includes(type) ? type : null;
    }

    /**
     * Navigate to specific message conversation based on type
     * @param {string} messageType - The message type (inquiry, order)
     * @param {string} orderId - The order ID (if applicable)
     * @param {string} inquiryId - The inquiry ID (if applicable)
     */
    navigateToMessageConversation(messageType, orderId, inquiryId) {
        try {
            // Validate inputs
            if (!this.isValidNavigationInput(messageType, orderId, inquiryId)) {
                console.warn('Invalid navigation input provided');
                this.navigateToFallback();
                return;
            }
            
            // Get target URL using configuration-driven approach
            const targetUrl = this.buildConversationUrl(messageType, orderId, inquiryId);
            
            // Navigate to the target URL
            window.location.href = targetUrl;
            
        } catch (error) {
            console.error('Error navigating to message conversation:', error);
            this.navigateToFallback();
        }
    }

    /**
     * Validate navigation input parameters
     * @param {string} messageType - The message type
     * @param {string} orderId - The order ID
     * @param {string} inquiryId - The inquiry ID
     * @returns {boolean} True if valid, false otherwise
     */
    isValidNavigationInput(messageType, orderId, inquiryId) {
        const config = this.getMessageConfig();
        
        // At least one ID should be provided
        if (!orderId && !inquiryId) {
            return false;
        }
        
        // If type is provided, it should be valid
        if (messageType && !config.validTypes.includes(messageType)) {
            return false;
        }
        
        return true;
    }

    /**
     * Build conversation URL based on message data
     * @param {string} messageType - The message type
     * @param {string} orderId - The order ID
     * @param {string} inquiryId - The inquiry ID
     * @returns {string} The target URL
     */
    buildConversationUrl(messageType, orderId, inquiryId) {
        const config = this.getMessageConfig();
        
        // Priority-based URL building
        if (messageType === 'order' && orderId) {
            return `/manufacturer/messages/order/${orderId}`;
        }
        
        if (messageType === 'inquiry' && inquiryId) {
            return `/manufacturer/messages/inquiry/${inquiryId}`;
        }
        
        // Fallback logic based on available IDs
        if (orderId) {
            return `/manufacturer/messages/order/${orderId}`;
        }
        
        if (inquiryId) {
            return `/manufacturer/messages/inquiry/${inquiryId}`;
        }
        
        // Ultimate fallback
        return config.fallbackUrl;
    }

    /**
     * Navigate to fallback URL
     */
    navigateToFallback() {
        const config = this.getMessageConfig();
        window.location.href = config.fallbackUrl;
    }

    /**
     * Update sidebar messages badge with unread count
     */
    async updateSidebarMessagesBadge() {
        try {
            const response = await fetch('/manufacturer/api/unread-messages-count');
            const data = await response.json();
            
            if (data.success) {
                const sidebarMessagesLink = document.querySelector('a[href="/manufacturer/messages"]');
                
                if (sidebarMessagesLink) {
                    // Remove existing badge
                    const existingBadge = sidebarMessagesLink.querySelector('.nav-badge');
                    if (existingBadge) {
                        existingBadge.remove();
                    }
                    
                    // Add new badge if count > 0
                    if (data.count > 0) {
                        const badge = document.createElement('span');
                        badge.className = 'nav-badge badge-primary';
                        badge.textContent = data.count;
                        sidebarMessagesLink.appendChild(badge);
                    }
                }
                
                // Also update header badge - FIX: Prevent initial flash
                const headerBadge = document.getElementById('messagesBadge');
                if (headerBadge) {
                    // Set count first
                    headerBadge.textContent = data.count || 0;
                    
                    // Then set visibility to prevent flash
                    if (data.count > 0) {
                        headerBadge.style.display = 'flex';
                        headerBadge.classList.add('show');
                    } else {
                        headerBadge.style.display = 'none';
                        headerBadge.classList.remove('show');
                    }
                }
                
            }
        } catch (error) {
            // console.error('Failed to update messages badge:', error);
        }
    }

    /**
     * Utility Functions
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return this.getTranslation('admin.header.common.time_ago.just_now', 'Just now');
        if (diff < 3600) return `${Math.floor(diff / 60)} ${this.getTranslation('admin.header.common.time_ago.minutes', 'minutes ago')}`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} ${this.getTranslation('admin.header.common.time_ago.hours', 'hours ago')}`;
        return date.toLocaleDateString();
    }
}

// Initialize on DOM ready with delay to allow dashboard-init.js to load first
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure dashboard-init.js has time to initialize
    setTimeout(() => {
        if (typeof ManufacturerHeader !== 'undefined' && !window.manufacturerHeader) {
            window.manufacturerHeader = new ManufacturerHeader();
        }
        
        // Sync sidebar state on page load
        setTimeout(() => {
            if (typeof window.syncSidebarState === 'function') {
                window.syncSidebarState();
            }
        }, 100);
    }, 50);

    // Direct event listener as backup - ENHANCED
    const messagesBtn = document.getElementById('messagesBtn');
    const messagesDropdown = document.getElementById('messagesDropdown');
    
    if (messagesBtn && messagesDropdown) {
        // Remove any existing listeners first
        const newMessagesBtn = messagesBtn.cloneNode(true);
        messagesBtn.parentNode.replaceChild(newMessagesBtn, messagesBtn);
        
        newMessagesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Close all other dropdowns
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                if (menu !== messagesDropdown) {
                    menu.classList.add('hidden');
                }
            });
            
            // Toggle dropdown
            const wasHidden = messagesDropdown.classList.contains('hidden');
            if (wasHidden) {
                messagesDropdown.classList.remove('hidden');
            } else {
                messagesDropdown.classList.add('hidden');
            }
        });
    }
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
        // Mark orders, inquiries, and notifications as read
        const [ordersResult, inquiriesResult, notificationsResult] = await Promise.all([
            fetch('/manufacturer/api/orders/mark-all-read', { method: 'POST' }),
            fetch('/manufacturer/api/inquiries/mark-all-read', { method: 'POST' }),
            fetch('/manufacturer/api/notifications/mark-all-read', { method: 'POST' })
        ]);
        
        const ordersData = await ordersResult.json();
        const inquiriesData = await inquiriesResult.json();
        const notificationsData = await notificationsResult.json();
        
        // Refresh all notification data
        if (window.manufacturerHeader) {
            // Force refresh all notification data
            await Promise.all([
                window.manufacturerHeader.loadInquiriesAndOrders(),
                window.manufacturerHeader.updateNotificationsBadge(), // This now updates sidebar badges too
                window.manufacturerHeader.updateSidebarMessagesBadge()
            ]);
        }
        
        // Show success message using toast instead of alert
        const totalUpdated = (ordersData.updatedCount || 0) + (inquiriesData.updatedCount || 0) + (notificationsData.updatedCount || 0);
        if (totalUpdated > 0) {
            const successMsg = window.manufacturerHeader?.getTranslation('admin.header.common.success.notifications_marked_read', 'Barcha bildirishnomalar o\'qilgan deb belgilandi') || 'Barcha bildirishnomalar o\'qilgan deb belgilandi';
            if (typeof showToast === 'function') {
                showToast(successMsg, 'success');
            }
        } else {
            const alreadyReadMsg = window.manufacturerHeader?.getTranslation('admin.header.common.success.all_already_read', 'Barcha bildirishnomalar allaqachon o\'qilgan') || 'Barcha bildirishnomalar allaqachon o\'qilgan';
            if (typeof showToast === 'function') {
                showToast(alreadyReadMsg, 'info');
            }
        }
        
    } catch (error) {
        console.error('Failed to mark notifications as read:', error);
        if (typeof showToast === 'function') {
            showToast(window.manufacturerHeader?.getTranslation('admin.header.common.errors.general_error', 'Xatolik yuz berdi') || 'Xatolik yuz berdi', 'error');
        }
    }
};

window.markAllMessagesRead = async function() {
    try {
        const response = await fetch('/manufacturer/api/messages/mark-all-read', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            // Refresh messages
            if (window.manufacturerHeader) {
                window.manufacturerHeader.loadMessages();
                window.manufacturerHeader.updateSidebarMessagesBadge();
            }
            
            // Show success message
            if (data.updatedCount > 0) {
                const successMsg = window.manufacturerHeader?.getTranslation('admin.header.common.success.messages_marked_read', 'ta xabar o\'qilgan deb belgilandi!') || 'ta xabar o\'qilgan deb belgilandi!';
                alert(`✅ ${data.updatedCount} ${successMsg}`);
            } else {
                const alreadyReadMsg = window.manufacturerHeader?.getTranslation('admin.header.common.success.all_messages_read', 'Barcha xabarlar allaqachon o\'qilgan!') || 'Barcha xabarlar allaqachon o\'qilgan!';
                alert(`ℹ️ ${alreadyReadMsg}`);
            }
        } else {
            // console.error('API error:', data.error);
            alert(window.manufacturerHeader?.getTranslation('admin.header.common.errors.general_error', 'Xatolik yuz berdi!') || 'Xatolik yuz berdi!');
        }
    } catch (error) {
        // console.error('Failed to mark messages as read:', error);
        alert(window.manufacturerHeader?.getTranslation('admin.header.common.errors.general_error', 'Xatolik yuz berdi!') || 'Xatolik yuz berdi!');
    }
};

} // End of ManufacturerHeader class definition check
