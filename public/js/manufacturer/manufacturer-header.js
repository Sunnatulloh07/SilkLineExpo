/**
 * Manufacturer Dashboard Header JavaScript
 * Handles all header interactions and functionality
 */

// Check if ManufacturerHeader already exists
if (typeof window.ManufacturerHeader !== 'undefined') {
    console.log('⚠️ ManufacturerHeader already exists, skipping redefinition');
} else {

class ManufacturerHeader {
    constructor() {
        this.init();
    }

    init() {
        // Check if dashboard-init.js has already initialized to prevent conflicts
        if (window.sidebarInitialized) {
            console.log('📰 Header: dashboard-init.js already initialized, skipping conflicting functions');
            
            // Only initialize non-conflicting functions
            this.initSearchBar();
            this.initNotifications();
            this.initMessages();
        } else {
            console.log('📰 Header: dashboard-init.js not detected, initializing all functions');
            
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
            console.log('🎨 Header: Using Universal Theme Manager');
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
            menu.classList.add('hidden');
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
        // Set language cookies first (like buyer navigation)
        document.cookie = `i18next=${lang}; path=/; max-age=${30 * 24 * 60 * 60}`;
        document.cookie = `selectedLanguage=${lang}; path=/; max-age=${30 * 24 * 60 * 60}`;
        
        // Get current URL and add language parameter
        const currentUrl = window.location.pathname + window.location.search;
        const redirectUrl = `/language/${lang}?redirect=${encodeURIComponent(currentUrl)}`;
        
        // Navigate to language change route
        window.location.href = redirectUrl;
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
            console.error('Failed to load notifications:', error);
        }
    }

    async updateNotificationsBadge() {
        try {
            // Get total count from inquiries and orders
            const [inquiriesResponse, ordersResponse] = await Promise.all([
                fetch('/manufacturer/api/recent-inquiries?limit=50'),
                fetch('/manufacturer/api/orders?limit=50')
            ]);
            
            const inquiriesData = await inquiriesResponse.json();
            const ordersData = await ordersResponse.json();
            
            let inquiries = inquiriesData.success ? (inquiriesData.data || inquiriesData.inquiries || []) : [];
            let orders = ordersData.success ? (ordersData.data || ordersData.orders || []) : [];
            
            // Filter only unread items
            inquiries = inquiries.filter(inquiry => !inquiry.readByManufacturer && inquiry.status !== 'archived');
            orders = orders.filter(order => !order.readBySeller && order.status !== 'archived');
            
            const inquiriesCount = inquiries.length;
            const ordersCount = orders.length;
            const totalCount = inquiriesCount + ordersCount;
            
            this.updateNotificationBadge(totalCount);
        } catch (error) {
            console.error('Error updating notifications badge:', error);
        }
    }

    async loadInquiriesAndOrders() {
        try {
            // Load inquiries
            const inquiriesResponse = await fetch('/manufacturer/api/recent-inquiries?limit=10');
            const inquiriesData = await inquiriesResponse.json();
            
            // Load recent orders
            const ordersResponse = await fetch('/manufacturer/api/orders?limit=10');
            const ordersData = await ordersResponse.json();
            
            // Extract data from responses
            let inquiries = inquiriesData.success ? (inquiriesData.data || inquiriesData.inquiries || []) : [];
            let orders = ordersData.success ? (ordersData.data || ordersData.orders || []) : [];
            
            // Filter only unread items
            inquiries = inquiries.filter(inquiry => !inquiry.readByManufacturer && inquiry.status !== 'archived');
            orders = orders.filter(order => !order.readBySeller && order.status !== 'archived');
            
            // Limit to 3 items each
            inquiries = inquiries.slice(0, 3);
            orders = orders.slice(0, 3);
            
            this.renderInquiriesAndOrders(inquiries, orders);
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

    renderInquiriesAndOrders(inquiries, orders) {
        const container = document.getElementById('notificationsContent');
        if (!container) {
            return;
        }

        let content = '';

        // Add inquiries section
        if (inquiries && inquiries.length > 0) {
            content += `
                <div class="notifications-section">
                    <h5 class="section-title">
                        <i class="fas fa-envelope text-primary"></i>
                        Yangi So'rovlar (${inquiries.length})
                    </h5>
            `;
            
            inquiries.forEach(inquiry => {
                const isUnread = !inquiry.readByManufacturer && inquiry.status !== 'archived';
                content += `
                    <div class="notification-item inquiry-item ${isUnread ? 'unread' : ''}" data-item-id="${inquiry._id || inquiry.id}" data-item-type="inquiry">
                        <div class="notification-icon info">
                            <i class="fas fa-envelope"></i>
                        </div>
                        <div class="notification-content">
                            <h4 class="notification-title">${inquiry.subject || inquiry.title || 'Yangi so\'rov'}</h4>
                            <p class="notification-text">${inquiry.message || inquiry.description || 'So\'rov yuborildi'}</p>
                            <span class="notification-time">${this.formatTime(inquiry.createdAt)}</span>
                        </div>
                    </div>
                `;
            });
            
            content += '</div>';
        }

        // Add orders section
        if (orders && orders.length > 0) {
            content += `
                <div class="notifications-section">
                    <h5 class="section-title">
                        <i class="fas fa-shopping-cart text-success"></i>
                        Yangi Buyurtmalar (${orders.length})
                    </h5>
            `;
            
            orders.forEach(order => {
                const isUnread = !order.readBySeller && order.status !== 'archived';
                content += `
                    <div class="notification-item order-item ${isUnread ? 'unread' : ''}" data-item-id="${order._id || order.id}" data-item-type="order">
                        <div class="notification-icon order">
                            <i class="fas fa-shopping-cart"></i>
                        </div>
                        <div class="notification-content">
                            <h4 class="notification-title">Buyurtma #${order.orderNumber || order._id}</h4>
                            <p class="notification-text">${order.status || 'Yangi buyurtma'}</p>
                            <span class="notification-time">${this.formatTime(order.createdAt)}</span>
                        </div>
                    </div>
                `;
            });
            
            content += '</div>';
        }

        // If no content, show empty state
        if (!content) {
            content = `
                <div class="empty-state">
                    <i class="fas fa-bell-slash"></i>
                    <p>Hozircha yangi xabarlar yo'q</p>
                </div>
            `;
        }

        // Add Mark All as Read button if there are unread items
        const unreadInquiries = inquiries.filter(inquiry => !inquiry.readByManufacturer && inquiry.status !== 'archived');
        const unreadOrders = orders.filter(order => !order.readBySeller && order.status !== 'archived');
        
        if (unreadInquiries.length > 0 || unreadOrders.length > 0) {
            content += `
                <div class="mark-all-read-section">
                    <button class="btn btn-sm btn-outline-primary mark-all-read-btn" onclick="window.markAllNotificationsRead()">
                        <i class="fas fa-check-double"></i>
                        Barchasini o'qilgan deb belgilash (${unreadInquiries.length + unreadOrders.length})
                    </button>
                </div>
            `;
        }

        container.innerHTML = content;
        
        // Add click handlers for notification items
        const notificationItems = container.querySelectorAll('.notification-item');
        notificationItems.forEach((item, index) => {
            item.addEventListener('click', async () => {
                const itemType = item.classList.contains('inquiry-item') ? 'inquiry' : 'order';
                const itemId = item.dataset.itemId;
                
                // Add loading state
                item.classList.add('loading');
                
                try {
                    // Mark individual item as read
                    if (itemType === 'inquiry') {
                        const response = await fetch('/manufacturer/api/inquiries/mark-read', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ inquiryId: itemId })
                        });
                        
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }
                        
                        const result = await response.json();
                        if (result.success) {
                            // Remove unread class and update badge
                            item.classList.remove('unread');
                            this.updateNotificationsBadge();
                        }
                    } else if (itemType === 'order') {
                        const response = await fetch('/manufacturer/api/orders/mark-read', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ orderId: itemId })
                        });
                        
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }
                        
                        const result = await response.json();
                        if (result.success) {
                            // Remove unread class and update badge
                            item.classList.remove('unread');
                            this.updateNotificationsBadge();
                        }
                    }
                    
                    // Redirect after marking as read
                    if (itemType === 'inquiry') {
                        window.location.href = '/manufacturer/inquiries';
                    } else if (itemType === 'order') {
                        window.location.href = '/manufacturer/orders';
                    }
                } catch (error) {
                    console.error('Error marking item as read:', error);
                    // Still redirect even if marking as read fails
                    if (itemType === 'inquiry') {
                        window.location.href = '/manufacturer/inquiries';
                    } else if (itemType === 'order') {
                        window.location.href = '/manufacturer/orders';
                    }
                }
            });
        });
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
        this.updateSidebarMessagesBadge();
        
        // Refresh messages every 30 seconds
        setInterval(() => {
            this.loadMessages();
            this.updateSidebarMessagesBadge();
        }, 30000);
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
                        sender: chat.companyName || 'Unknown',
                        content: chat.lastMessage || 'No message',
                        time: this.formatTime(chat.lastMessageTime),
                        orderNumber: 'N/A',
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
                    <p class="text-muted">Hozircha xabarlar yo'q</p>
                </div>
            `;
            return;
        }

        // Add Mark All as Read button
        const markAllReadButton = `
            <div class="mark-all-read-section">
                <button class="btn btn-sm btn-outline-primary mark-all-read-btn" onclick="window.markAllMessagesRead()">
                    <i class="fas fa-check-double"></i>
                    Barchasini o'qilgan deb belgilash
                </button>
            </div>
        `;

        // Render dynamic messages
        const messagesHTML = messages.map(message => `
            <div class="message-item ${message.isUnread ? 'unread' : ''}" data-message-id="${message.id}">
                <div class="message-avatar-placeholder">
                    <i class="fas fa-user"></i>
                </div>
                <div class="message-content">
                    <h4 class="message-sender">${message.sender}</h4>
                    <p class="message-text">${message.content}</p>
                    <span class="message-time">${message.time}</span>
                    ${message.orderNumber !== 'N/A' ? `<small class="message-order">Buyurtma: ${message.orderNumber}</small>` : ''}
                </div>
            </div>
        `).join('');
        
        container.innerHTML = markAllReadButton + messagesHTML;

        // Add click handlers for messages
        const messageItems = container.querySelectorAll('.message-item');
        
        messageItems.forEach((item, index) => {
            item.addEventListener('click', async () => {
                const messageId = item.dataset.messageId;
                
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
                    
                    // Navigate to messages page
                    window.location.href = '/manufacturer/messages';
                } catch (error) {
                    console.error('Error marking message as read:', error);
                    // Still navigate even if marking as read fails
                    window.location.href = '/manufacturer/messages';
                }
            });
        });
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
                
                // Also update header badge
                const headerBadge = document.getElementById('messagesBadge');
                if (headerBadge) {
                    headerBadge.textContent = data.count || 0;
                    headerBadge.style.display = data.count > 0 ? 'flex' : 'none';
                }
                
            }
        } catch (error) {
            console.error('Failed to update messages badge:', error);
        }
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

    // Direct event listener as backup
    const messagesBtn = document.getElementById('messagesBtn');
    const messagesDropdown = document.getElementById('messagesDropdown');
    
    if (messagesBtn && messagesDropdown) {
        messagesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
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
        // Mark only orders and inquiries as read (not messages)
        const [ordersResult, inquiriesResult] = await Promise.all([
            fetch('/manufacturer/api/orders/mark-all-read', { method: 'POST' }),
            fetch('/manufacturer/api/inquiries/mark-all-read', { method: 'POST' })
        ]);
        
        const ordersData = await ordersResult.json();
        const inquiriesData = await inquiriesResult.json();
        
        // Refresh notifications data only
        if (window.manufacturerHeader) {
            window.manufacturerHeader.loadInquiriesAndOrders();
            window.manufacturerHeader.updateNotificationsBadge();
        }
        
        // Show success message
        const totalUpdated = (ordersData.updatedCount || 0) + (inquiriesData.updatedCount || 0);
        if (totalUpdated > 0) {
            alert(`✅ ${totalUpdated} ta bildirishnoma o'qilgan deb belgilandi!\n\n• Buyurtmalar: ${ordersData.updatedCount || 0}\n• So'rovlar: ${inquiriesData.updatedCount || 0}`);
        } else {
            alert('ℹ️ Barcha bildirishnomalar allaqachon o\'qilgan!');
        }
        
    } catch (error) {
        console.error('Failed to mark notifications as read:', error);
        alert('Xatolik yuz berdi!');
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
                alert(`✅ ${data.updatedCount} ta xabar o'qilgan deb belgilandi!`);
            } else {
                alert('ℹ️ Barcha xabarlar allaqachon o\'qilgan!');
            }
        } else {
            console.error('API error:', data.error);
            alert('Xatolik yuz berdi!');
        }
    } catch (error) {
        console.error('Failed to mark messages as read:', error);
        alert('Xatolik yuz berdi!');
    }
};

} // End of ManufacturerHeader class definition check