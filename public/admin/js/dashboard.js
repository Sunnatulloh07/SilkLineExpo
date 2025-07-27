/**
 * SLEX Super Admin Dashboard JavaScript
 * Modern, professional dashboard functionality
 * Following Senior Software Engineer principles
 */

class SLEXDashboard {
  constructor() {
    this.init();
    this.setupEventListeners();
    this.initializeCharts();
    this.startRealTimeUpdates();
  }

  // ===============================================
  // 1. Initialization
  // ===============================================
  init() {
    // Theme initialization
    this.setupTheme();
    
    // Sidebar state
    this.sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    this.applySidebarState();
    
    // Language setup (PUBLIC PAGES COMPATIBLE)
    this.currentLanguage = this.getCurrentLanguage();
    this.updateLanguageDisplay(this.currentLanguage);
    
    // Mobile detection
    this.isMobile = window.innerWidth <= 768;
    
    // Initialize components
    this.initializeTooltips();
    this.initializeDropdowns();
    this.setupQuickActions();
    this.setupMessagesAndNotifications();
    this.setupPendingApprovalsTable();
    this.setupHeaderDropdowns();
    
     }

  // ===============================================
  // 2. Theme Management (PUBLIC PAGES COMPATIBLE)
  // ===============================================
  setupTheme() {
    // Use exact same logic as public pages (main.js)
    const currentTheme = localStorage.getItem('theme');
    
    if (currentTheme) {
      document.documentElement.setAttribute('data-theme', currentTheme);
      this.currentTheme = currentTheme;
    } else {
      // Default to light theme like public pages
      this.currentTheme = 'light';
      document.documentElement.setAttribute('data-theme', 'light');
    }
    
    // Update theme toggle button
    this.updateThemeToggleButton();
    
  }

  updateThemeToggleButton() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      const icon = themeToggle.querySelector('i');
      if (icon) {
        icon.className = this.currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
      }
    }
  }

  toggleTheme() {
    // Use exact same logic as public pages switchTheme function
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    
    // Apply theme exactly like public pages
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update internal state
    this.currentTheme = newTheme;
    
    // Update toggle button
    this.updateThemeToggleButton();
  
    
    // Trigger theme change event for charts
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
    
    // Broadcast to other tabs (like public pages)
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'theme',
      newValue: newTheme,
      url: window.location.href
    }));
  }

  // ===============================================
  // 3. Sidebar Management
  // ===============================================
  applySidebarState() {
    const sidebar = document.querySelector('.admin-sidebar');
    const main = document.querySelector('.admin-main');
    const header = document.querySelector('.admin-header');
    const isMobile = window.innerWidth <= 1024;
    
    if (isMobile) {
      // Mobile: manage open/close state
      if (this.sidebarCollapsed) {
        sidebar?.classList.remove('open');
        main?.classList.remove('sidebar-open');
        document.body.style.overflow = 'auto';
      } else {
        sidebar?.classList.add('open');
        main?.classList.add('sidebar-open');
        document.body.style.overflow = 'hidden';
      }
    } else {
      // Desktop: manage collapsed/expanded state
      if (this.sidebarCollapsed) {
        sidebar?.classList.add('collapsed');
        main?.classList.add('sidebar-collapsed');
        header?.classList.add('sidebar-collapsed');
      } else {
        sidebar?.classList.remove('collapsed');
        main?.classList.remove('sidebar-collapsed');
        header?.classList.remove('sidebar-collapsed');
      }
      
      // Ensure mobile classes are removed on desktop
      sidebar?.classList.remove('open');
      main?.classList.remove('sidebar-open');
      document.body.style.overflow = 'auto';
    }
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    localStorage.setItem('sidebarCollapsed', this.sidebarCollapsed);
    this.applySidebarState();
  }

  // ===============================================
  // 4. Language Management (PUBLIC PAGES COMPATIBLE)
  // ===============================================
  changeLanguage(langCode, langName) {
    if (langCode === this.currentLanguage) return;
  
    
    // Show loading state
    this.showLanguageLoading();
    
    // Update button immediately for better UX
    this.updateLanguageButton(langCode, langName);
    
    // Store language like PUBLIC PAGES (only i18next cookie)
    this.currentLanguage = langCode;
    
    // Set only i18next cookie (like public pages)
    this.setCookie('i18next', langCode, 30);
    
    // Close dropdown
    this.closeLanguageDropdown();
    
    // Use PUBLIC PAGES STYLE routing for maximum compatibility
    const languageUrl = `/language/${langCode}`;
    
    // Try backend API first, then fallback to public pages routing
    fetch('/admin/set-language', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({ 
        language: langCode,
        source: 'admin_dashboard'
      })
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Backend language change failed');
    })
    .then(data => {
      // Reload admin dashboard with language parameter
      setTimeout(() => {
        window.location.href = '/admin/dashboard?lng=' + langCode;
      }, 300);
    })
    .catch(error => {
      console.warn('⚠️ Backend failed, using PUBLIC PAGES STYLE routing:', error);
      // Fallback to public pages style language routing (GUARANTEED TO WORK)
      setTimeout(() => {
        window.location.href = languageUrl + '?redirect=' + encodeURIComponent('/admin/dashboard');
      }, 300);
    })
    .finally(() => {
      this.hideLanguageLoading();
    });
  }

  // Cookie utility function (like public pages)
  setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  }

  // Get cookie utility function (like public pages)
  getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  // Get current language (PUBLIC PAGES COMPATIBLE - only i18next)
  getCurrentLanguage() {
    // Priority order: URL param -> i18next Cookie -> Default
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lng');
    if (urlLang) return urlLang;
    
    const i18nextCookie = this.getCookie('i18next');
    if (i18nextCookie) return i18nextCookie;
    
    return 'uz'; // Default fallback
  }

  showLanguageLoading() {
    const langToggle = document.getElementById('languageToggle');
    const langChevron = document.querySelector('.lang-chevron');
    
    if (langToggle) {
      langToggle.disabled = true;
      langToggle.style.opacity = '0.7';
    }
    
    if (langChevron) {
      langChevron.className = 'fas fa-spinner fa-spin';
      langChevron.style.fontSize = '10px';
    }
  }

  hideLanguageLoading() {
    const langToggle = document.getElementById('languageToggle');
    const langChevron = document.querySelector('.lang-chevron');
    
    if (langToggle) {
      langToggle.disabled = false;
      langToggle.style.opacity = '1';
    }
    
    if (langChevron) {
      langChevron.className = 'fas fa-chevron-down';
      langChevron.style.fontSize = '10px';
    }
  }

  updateLanguageDisplay(langCode) {
    const langFlags = {
      'uz': '🇺🇿',
      'en': '🇺🇸',
      'ru': '🇷🇺', 
      'tr': '🇹🇷',
      'fa': '🇮🇷',
      'zh': '🇨🇳'
    };
    
    const currentFlag = document.querySelector('.current-lang-flag');
    const langSelect = document.getElementById('languageSelect');
    
    if (currentFlag) {
      currentFlag.textContent = langFlags[langCode] || '🇺🇿';
    }
    
    if (langSelect) {
      langSelect.value = langCode;
    }
    
    // Store in localStorage for persistence
    localStorage.setItem('selectedLanguage', langCode);
    this.currentLanguage = langCode;
  }

  // ===============================================
  // 5. Chart Initialization & Activity Filters
  // ===============================================
  initializeCharts() {
    this.setupGrowthChart();
    this.setupChartFilters();
    this.setupActivityFilters();
  }

  // ===============================================
  // 6. Header Dropdowns Management
  // ===============================================
  setupHeaderDropdowns() {

    // Messages dropdown
    const messagesBtn = document.getElementById('messagesBtn');
    const messagesDropdown = document.getElementById('messagesDropdown');

    // Notifications dropdown  
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');

    // User menu dropdown
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');

    // Language dropdown
    const languageToggle = document.getElementById('languageToggle');
    const languageMenu = document.getElementById('languageMenu');

    if (messagesBtn && messagesDropdown) {
      messagesBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleDropdown(messagesDropdown);
        this.closeOtherDropdowns(messagesDropdown);
        this.loadMessages();
      });
    }

    if (notificationBtn && notificationDropdown) {
      notificationBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleDropdown(notificationDropdown);
        this.closeOtherDropdowns(notificationDropdown);
        this.loadNotifications();
      });
    }

    if (userMenuBtn && userDropdown) {
      userMenuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleDropdown(userDropdown);
        this.closeOtherDropdowns(userDropdown);
      });
    }

    if (languageToggle && languageMenu) {
      languageToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleDropdown(languageMenu);
        this.closeOtherDropdowns(languageMenu);
      });

      // Language option clicks
      languageMenu.querySelectorAll('.language-option').forEach(option => {
        option.addEventListener('click', (e) => {
          const langCode = e.target.dataset.lang;
          if (langCode) {
            this.changeLanguage(langCode);
            this.closeDropdown(languageMenu);
          }
        });
      });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.header-dropdown')) {
        this.closeAllDropdowns();
      }
    });

    // Close dropdowns on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllDropdowns();
      }
    });

  }

  toggleDropdown(dropdown) {
    if (!dropdown) return;
    
    const isHidden = dropdown.classList.contains('hidden');
    if (isHidden) {
      this.openDropdown(dropdown);
    } else {
      this.closeDropdown(dropdown);
    }
  }

  openDropdown(dropdown) {
    if (!dropdown) return;
    dropdown.classList.remove('hidden');
    dropdown.style.visibility = 'visible';
    dropdown.style.opacity = '1';
  }

  closeDropdown(dropdown) {
    if (!dropdown) return;
    dropdown.classList.add('hidden');
    dropdown.style.visibility = 'hidden';
    dropdown.style.opacity = '0';
  }

  closeOtherDropdowns(keepOpen) {
    const allDropdowns = document.querySelectorAll('.dropdown-menu');
    allDropdowns.forEach(dropdown => {
      if (dropdown !== keepOpen) {
        this.closeDropdown(dropdown);
      }
    });
  }

  closeAllDropdowns() {
    const allDropdowns = document.querySelectorAll('.dropdown-menu');
    allDropdowns.forEach(dropdown => {
      this.closeDropdown(dropdown);
    });
  }

  /**
   * Load messages from backend with professional error handling
   * @returns {Promise<void>}
   */
  async loadMessages() {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) {
      console.warn('Messages container not found');
      return;
    }

    this.showLoadingState(messagesContainer, 'messages');

    try {
      const response = await this.makeAPIRequest('/admin/api/messages');
      
      if (response.success) {
        this.renderMessages(response.data);
        this.updateMessagesBadge(response.data);
      } else {
        throw new Error(response.message || 'Failed to load messages');
      }
    } catch (error) {
      console.error('❌ Messages loading failed:', error);
      this.showErrorState(messagesContainer, 'Failed to load messages', 'messages');
      this.showToast('error', 'Could not load messages. Please try again.');
    }
  }

  /**
   * Render messages with professional UI and interactions
   * @param {Array} messages - Messages array from backend
   */
  renderMessages(messages) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) {
      console.warn('Messages container not found');
      return;
    }

    // Handle empty state
    if (!messages || messages.length === 0) {
      messagesContainer.innerHTML = this.getEmptyStateHTML('messages', 'No messages found', 'fa-inbox');
      return;
    }

    // Render messages with professional styling
    const messagesHTML = messages.map(message => this.createMessageItemHTML(message)).join('');
    messagesContainer.innerHTML = messagesHTML;

    // Add professional event handlers
    this.attachMessageEventHandlers(messagesContainer);
    
  }

  /**
   * Create HTML for a single message item
   * @param {Object} message - Message object
   * @returns {string} HTML string
   */
  createMessageItemHTML(message) {
    const isUnread = !message.read;
    const avatarText = message.fromAvatar || this.getInitials(message.from);
    const timeText = this.formatMessageTime(message.timestamp);
    
    return `
      <div class="message-item ${isUnread ? 'unread' : 'read'}" 
           data-message-id="${message.id}"
           data-message-type="${message.type || 'general'}"
           tabindex="0"
           role="button"
           aria-label="Message from ${message.from}: ${message.subject}">
        <div class="message-avatar ${message.type || 'default'}">
          ${avatarText}
        </div>
        <div class="message-content">
          <div class="message-from">${this.escapeHTML(message.from)}</div>
          <div class="message-subject">${this.escapeHTML(message.subject)}</div>
          <div class="message-preview">${this.escapeHTML(message.preview)}</div>
          <div class="message-time">${timeText}</div>
        </div>
        ${isUnread ? '<div class="unread-indicator" title="Unread message"></div>' : ''}
        <div class="message-actions">
          <button class="btn-icon" onclick="event.stopPropagation(); markMessageAsRead('${message.id}')" 
                  title="Mark as read" ${!isUnread ? 'style="display:none"' : ''}>
            <i class="fas fa-check"></i>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Attach professional event handlers to messages
   * @param {Element} container - Messages container
   */
  attachMessageEventHandlers(container) {
    container.querySelectorAll('.message-item').forEach(item => {
      // Click handler for message selection
      item.addEventListener('click', async (e) => {
        if (e.target.closest('.message-actions')) return; // Skip if clicking on actions
        
        const messageId = item.dataset.messageId;
        const messageType = item.dataset.messageType;
        
        // Add visual feedback
        item.classList.add('message-selected');
        setTimeout(() => item.classList.remove('message-selected'), 200);
        
        // Handle message click based on type
        await this.handleMessageClick(messageId, messageType);
      });

      // Keyboard support
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          item.click();
        }
      });

      // Hover effects
      item.addEventListener('mouseenter', () => {
        item.classList.add('message-hover');
      });

      item.addEventListener('mouseleave', () => {
        item.classList.remove('message-hover');
      });
    });
  }

  /**
   * Load notifications from backend with professional error handling
   * @returns {Promise<void>}
   */
  async loadNotifications() {
    const notificationsContainer = document.getElementById('notificationsContainer');
    if (!notificationsContainer) {
      console.warn('Notifications container not found');
      return;
    }

    this.showLoadingState(notificationsContainer, 'notifications');

    try {
      const response = await this.makeAPIRequest('/admin/api/notifications');
      
      if (response.success) {
        this.renderNotifications(response.data);
        this.updateNotificationBadge(response.data);
      } else {
        throw new Error(response.message || 'Failed to load notifications');
      }
    } catch (error) {
      console.error('❌ Notifications loading failed:', error);
      this.showErrorState(notificationsContainer, 'Failed to load notifications', 'notifications');
      this.showToast('error', 'Could not load notifications. Please try again.');
    }
  }

  /**
   * Render notifications with professional UI and interactions
   * @param {Array} notifications - Notifications array from backend
   */
  renderNotifications(notifications) {
    const notificationsContainer = document.getElementById('notificationsContainer');
    if (!notificationsContainer) {
      console.warn('Notifications container not found');
      return;
    }

    // Handle empty state
    if (!notifications || notifications.length === 0) {
      notificationsContainer.innerHTML = this.getEmptyStateHTML('notifications', 'No notifications found', 'fa-bell-slash');
      return;
    }

    // Render notifications with professional styling
    const notificationsHTML = notifications.map(notification => this.createNotificationItemHTML(notification)).join('');
    notificationsContainer.innerHTML = notificationsHTML;

    // Add professional event handlers
    this.attachNotificationEventHandlers(notificationsContainer, notifications);
    
  }

  /**
   * Create HTML for a single notification item
   * @param {Object} notification - Notification object
   * @returns {string} HTML string
   */
  createNotificationItemHTML(notification) {
    const isUnread = !notification.read;
    const iconClass = this.getNotificationIcon(notification.type);
    const timeText = this.formatMessageTime(notification.timestamp);
    
    return `
      <div class="notification-item ${isUnread ? 'unread' : 'read'}" 
           data-notification-id="${notification.id}"
           data-notification-type="${notification.type}"
           data-action-url="${notification.actionUrl || ''}"
           tabindex="0"
           role="button"
           aria-label="Notification: ${notification.title}">
        <div class="notification-icon ${notification.type}">
          <i class="fas ${iconClass}"></i>
        </div>
        <div class="notification-content">
          <div class="notification-title">${this.escapeHTML(notification.title)}</div>
          <div class="notification-text">${this.escapeHTML(notification.message)}</div>
          <div class="notification-time">${timeText}</div>
        </div>
        ${isUnread ? '<div class="unread-indicator" title="Unread notification"></div>' : ''}
        <div class="notification-actions">
          <button class="btn-icon" onclick="event.stopPropagation(); markNotificationAsRead('${notification.id}')" 
                  title="Mark as read" ${!isUnread ? 'style="display:none"' : ''}>
            <i class="fas fa-check"></i>
          </button>
          ${notification.actionUrl ? `
            <button class="btn-icon" onclick="event.stopPropagation(); window.open('${notification.actionUrl}', '_blank')" 
                    title="Open link">
              <i class="fas fa-external-link-alt"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Attach professional event handlers to notifications
   * @param {Element} container - Notifications container
   * @param {Array} notifications - Notifications array for reference
   */
  attachNotificationEventHandlers(container, notifications) {
    container.querySelectorAll('.notification-item').forEach(item => {
      // Click handler for notification selection
      item.addEventListener('click', async (e) => {
        if (e.target.closest('.notification-actions')) return; // Skip if clicking on actions
        
        const notificationId = item.dataset.notificationId;
        const notificationType = item.dataset.notificationType;
        const actionUrl = item.dataset.actionUrl;
        
        // Add visual feedback
        item.classList.add('notification-selected');
        setTimeout(() => item.classList.remove('notification-selected'), 200);
        
        // Handle notification click
        await this.handleNotificationClick(notificationId, notificationType, actionUrl);
      });

      // Keyboard support
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          item.click();
        }
      });

      // Hover effects
      item.addEventListener('mouseenter', () => {
        item.classList.add('notification-hover');
      });

      item.addEventListener('mouseleave', () => {
        item.classList.remove('notification-hover');
      });
    });
  }

  /**
   * Handle notification click based on type and context
   * @param {string} notificationId - Notification ID
   * @param {string} notificationType - Notification type
   * @param {string} actionUrl - Optional action URL
   */
  async handleNotificationClick(notificationId, notificationType, actionUrl) {
    try {
      // Mark as read first
      await this.markNotificationRead(notificationId);
      
      // Handle action URL if exists
      if (actionUrl) {
        // For internal links, navigate directly
        if (actionUrl.startsWith('/')) {
          window.location.href = actionUrl;
        } else {
          // For external links, open in new tab
          window.open(actionUrl, '_blank');
        }
        return;
      }
      
      // Handle different notification types
      switch (notificationType) {
        case 'approval':
          window.location.href = '/admin/users?status=pending';
          break;
        case 'system':
          window.location.href = '/admin/system/logs';
          break;
        case 'security':
          window.location.href = '/admin/system/security';
          break;
        default:
          this.showToast('info', 'Notification processed successfully');
      }
    } catch (error) {
      console.error('Handle notification click error:', error);
      this.showToast('error', 'Could not process notification');
    }
  }

  getNotificationIcon(type) {
    const icons = {
      approval: 'fa-clock',
      system: 'fa-cog',
      info: 'fa-info-circle',
      warning: 'fa-exclamation-triangle',
      success: 'fa-check-circle'
    };
    return icons[type] || 'fa-bell';
  }

  updateNotificationBadge(notifications) {
    const badge = document.querySelector('#notificationBtn .notification-badge');
    if (!badge) return;

    const unreadCount = notifications.filter(n => !n.read).length;
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }

  /**
   * Mark message as read with professional UI updates
   * @param {string} messageId - Message ID
   * @returns {Promise<boolean>} Success status
   */
  async markMessageRead(messageId) {
    try {
      const response = await this.makeAPIRequest(`/admin/api/messages/${messageId}/read`, {
        method: 'POST'
      });

      if (response.success) {
        this.updateMessageReadStatus(messageId, true);
        this.showToast('success', 'Message marked as read');
        return true;
      } else {
        throw new Error(response.message || 'Failed to mark message as read');
      }
    } catch (error) {
      console.error('❌ Mark message read failed:', error);
      this.showToast('error', 'Could not mark message as read');
      return false;
    }
  }

  /**
   * Mark notification as read with professional UI updates
   * @param {string} notificationId - Notification ID
   * @returns {Promise<boolean>} Success status
   */
  async markNotificationRead(notificationId) {
    try {
      const response = await this.makeAPIRequest(`/admin/api/notifications/${notificationId}/read`, {
        method: 'POST'
      });

      if (response.success) {
        this.updateNotificationReadStatus(notificationId, true);
        this.showToast('success', 'Notification marked as read');
        return true;
      } else {
        throw new Error(response.message || 'Failed to mark notification as read');
      }
    } catch (error) {
      console.error('❌ Mark notification read failed:', error);
      this.showToast('error', 'Could not mark notification as read');
      return false;
    }
  }

  /**
   * Update message read status in UI
   * @param {string} messageId - Message ID
   * @param {boolean} isRead - Read status
   */
  updateMessageReadStatus(messageId, isRead) {
    const messageItem = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageItem) return;

    // Update classes
    messageItem.classList.toggle('unread', !isRead);
    messageItem.classList.toggle('read', isRead);

    // Handle unread indicator
    const indicator = messageItem.querySelector('.unread-indicator');
    if (isRead && indicator) {
      indicator.remove();
    } else if (!isRead && !indicator) {
      const newIndicator = document.createElement('div');
      newIndicator.className = 'unread-indicator';
      newIndicator.title = 'Unread message';
      messageItem.appendChild(newIndicator);
    }

    // Update mark as read button
    const markReadBtn = messageItem.querySelector('.message-actions .btn-icon');
    if (markReadBtn) {
      markReadBtn.style.display = isRead ? 'none' : 'block';
    }

    // Update badge count
    this.updateMessagesCounter();
  }

  /**
   * Update notification read status in UI
   * @param {string} notificationId - Notification ID
   * @param {boolean} isRead - Read status
   */
  updateNotificationReadStatus(notificationId, isRead) {
    const notificationItem = document.querySelector(`[data-notification-id="${notificationId}"]`);
    if (!notificationItem) return;

    // Update classes
    notificationItem.classList.toggle('unread', !isRead);
    notificationItem.classList.toggle('read', isRead);

    // Handle unread indicator
    const indicator = notificationItem.querySelector('.unread-indicator');
    if (isRead && indicator) {
      indicator.remove();
    } else if (!isRead && !indicator) {
      const newIndicator = document.createElement('div');
      newIndicator.className = 'unread-indicator';
      newIndicator.title = 'Unread notification';
      notificationItem.appendChild(newIndicator);
    }

    // Update mark as read button
    const markReadBtn = notificationItem.querySelector('.notification-actions .btn-icon');
    if (markReadBtn) {
      markReadBtn.style.display = isRead ? 'none' : 'block';
    }

    // Update badge count
    this.updateNotificationsCounter();
  }

  /**
   * Update messages counter badge
   */
  updateMessagesCounter() {
    const unreadMessages = document.querySelectorAll('.message-item.unread').length;
    const badge = document.getElementById('messagesBadge');
    
    if (badge) {
      if (unreadMessages > 0) {
        badge.textContent = unreadMessages > 99 ? '99+' : unreadMessages;
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  /**
   * Update notifications counter badge
   */
  updateNotificationsCounter() {
    const unreadNotifications = document.querySelectorAll('.notification-item.unread').length;
    const badge = document.querySelector('#notificationBtn .notification-badge');
    
    if (badge) {
      if (unreadNotifications > 0) {
        badge.textContent = unreadNotifications > 99 ? '99+' : unreadNotifications;
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  formatMessageTime(timestamp) {
    if (!timestamp) return 'Unknown time';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} min ago`;
    return 'Just now';
  }

  // ===============================================
  // Professional Utility Methods - Senior Level
  // ===============================================

  /**
   * Make standardized API request with error handling
   * @param {string} url - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Response object
   */
  async makeAPIRequest(url, options = {}) {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API Request failed for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Show professional loading state
   * @param {Element} container - Container element
   * @param {string} type - Type of content being loaded
   */
  showLoadingState(container, type) {
    if (!container) return;
    
    const loadingHTML = `
      <div class="${type}-loading">
        <div class="loading-spinner"></div>
        <span>Loading ${type}...</span>
      </div>
    `;
    
    container.innerHTML = loadingHTML;
  }

  /**
   * Show professional error state
   * @param {Element} container - Container element
   * @param {string} message - Error message
   * @param {string} type - Type of content
   */
  showErrorState(container, message, type) {
    if (!container) return;
    
    const errorHTML = `
      <div class="${type}-error">
        <i class="fas fa-exclamation-triangle"></i>
        <span>${message}</span>
        <button class="btn-sm btn-primary" onclick="location.reload()">
          <i class="fas fa-refresh"></i> Retry
        </button>
      </div>
    `;
    
    container.innerHTML = errorHTML;
  }

  /**
   * Show professional toast notification
   * @param {string} type - success, error, warning, info
   * @param {string} message - Toast message
   */
  showToast(type, message) {
    // Create toast container if not exists
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    }[type] || 'fa-info-circle';

    toast.innerHTML = `
      <i class="fas ${icon}"></i>
      <span>${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;

    toastContainer.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);
  }

  /**
   * Update messages badge with unread count
   * @param {Array} messages - Messages array
   */
  updateMessagesBadge(messages) {
    const badge = document.getElementById('messagesBadge');
    if (!badge) return;

    const unreadCount = messages.filter(m => !m.read).length;
    
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
         }
   }

  /**
   * Handle message click based on type and context
   * @param {string} messageId - Message ID
   * @param {string} messageType - Message type
   */
  async handleMessageClick(messageId, messageType) {
    try {
      // Mark as read first
      await this.markMessageRead(messageId);
      
      // Handle different message types
      switch (messageType) {
        case 'system':
          this.showToast('info', 'System message details will be shown here');
          break;
        case 'support':
          window.open('/admin/support/messages/' + messageId, '_blank');
          break;
        case 'compliance':
          window.location.href = '/admin/compliance/documents';
          break;
        default:
          this.showToast('info', 'Message opened successfully');
      }
    } catch (error) {
      console.error('Handle message click error:', error);
      this.showToast('error', 'Could not open message');
    }
  }

  /**
   * Get empty state HTML
   * @param {string} type - Type of content
   * @param {string} message - Empty message
   * @param {string} icon - FontAwesome icon class
   * @returns {string} HTML string
   */
  getEmptyStateHTML(type, message, icon) {
    return `
      <div class="${type}-empty">
        <i class="fas ${icon}"></i>
        <span>${message}</span>
        <button class="btn-sm btn-primary" onclick="location.reload()">
          <i class="fas fa-refresh"></i> Refresh
        </button>
      </div>
    `;
  }

  /**
   * Get initials from a name
   * @param {string} name - Full name
   * @returns {string} Initials
   */
  getInitials(name) {
    if (!name) return 'U';
    return name.split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHTML(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  setupGrowthChart() {
    const chartContainer = document.getElementById('growthChart');
    if (!chartContainer) {
      console.warn('Chart container not found');
      return;
    }


    // Show loading initially
    this.showChartLoading();

    // Wait for DOM and data to be ready
    setTimeout(() => {
      try {
        // Get chart data from window.dashboardData
        const chartData = this.getChartData();

        // Get current theme for dynamic colors
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDarkMode ? '#E5E7EB' : '#374151';
        const borderColor = isDarkMode ? '#374151' : '#E5E7EB';
        const tooltipTheme = isDarkMode ? 'dark' : 'light';
        
        // Chart configuration with dynamic theme support
        const options = {
          series: chartData.series,
          chart: {
            type: 'area',
            height: 300,
            fontFamily: 'Inter, system-ui, sans-serif',
            toolbar: {
              show: true,
              tools: {
                download: true,
                selection: false,
                zoom: false,
                zoomin: false,
                zoomout: false,
                pan: false,
                reset: false
              }
            },
            background: 'transparent',
            animations: {
              enabled: true,
              easing: 'easeinout',
              speed: 800
            }
          },
          colors: ['#3B82F6', '#10B981', '#F59E0B'],
          dataLabels: {
            enabled: false
          },
          stroke: {
            curve: 'smooth',
            width: 3
          },
          xaxis: {
            categories: chartData.categories,
            labels: {
              style: {
                colors: textColor,
                fontSize: '12px',
                fontWeight: 500
              }
            },
            axisBorder: {
              color: borderColor
            },
            axisTicks: {
              color: borderColor
            }
          },
          yaxis: {
            labels: {
              style: {
                colors: textColor,
                fontSize: '12px',
                fontWeight: 500
              },
              formatter: function (val) {
                return Math.round(val);
              }
            }
          },
          grid: {
            borderColor: borderColor,
            strokeDashArray: 3,
            xaxis: {
              lines: {
                show: true
              }
            },
            yaxis: {
              lines: {
                show: true
              }
            }
          },
          legend: {
            position: 'top',
            horizontalAlign: 'left',
            fontSize: '14px',
            fontWeight: 500,
            labels: {
              colors: textColor
            },
            markers: {
              radius: 6
            }
          },
          fill: {
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.4,
              opacityTo: 0.1,
              stops: [0, 100]
            }
          },
          tooltip: {
            theme: tooltipTheme,
            style: {
              fontSize: '12px'
            },
            y: {
              formatter: function (val, { seriesIndex, dataPointIndex, w }) {
                return val + ' users';
              }
            }
          },
          responsive: [{
            breakpoint: 768,
            options: {
              chart: {
                height: 250
              },
              legend: {
                position: 'bottom'
              }
            }
          }]
        };

        // Clear container and hide loading
        chartContainer.innerHTML = '';
        this.hideChartLoading();

        // Initialize chart
        this.growthChart = new ApexCharts(chartContainer, options);
        this.growthChart.render().then(() => {
        });

      } catch (error) {
        console.error('Chart initialization error:', error);
        this.hideChartLoading();
        this.showChartError('Failed to load chart data');
      }
    }, 500); // Small delay to ensure DOM is ready
  }

  setupActivityFilters() {
    const filterButton = document.querySelector('.btn-filter');
    const viewAllButton = document.querySelector('.btn-view-all');

    if (filterButton) {
      filterButton.addEventListener('click', () => {
        this.showActivityFilterMenu();
      });
    }

    if (viewAllButton) {
      viewAllButton.addEventListener('click', (e) => {
        if (!e.target.href) {
          e.preventDefault();
          this.viewAllActivity();
        }
      });
    }

  }

  showActivityFilterMenu() {
    const filterButton = document.querySelector('.btn-filter');
    if (!filterButton) return;

    // Remove existing filter menu
    const existingMenu = document.querySelector('.activity-filter-menu');
    if (existingMenu) {
      existingMenu.remove();
      return;
    }

    // Create filter menu
    const filterMenu = document.createElement('div');
    filterMenu.className = 'activity-filter-menu';
    filterMenu.innerHTML = `
      <div class="filter-option" data-filter="all">
        <i class="fas fa-list"></i>
        <span>All Activity</span>
      </div>
      <div class="filter-option" data-filter="registrations">
        <i class="fas fa-user-plus"></i>
        <span>Registrations</span>
      </div>
      <div class="filter-option" data-filter="approvals">
        <i class="fas fa-check-circle"></i>
        <span>Approvals</span>
      </div>
      <div class="filter-option" data-filter="system">
        <i class="fas fa-cog"></i>
        <span>System Events</span>
      </div>
      <div class="filter-option" data-filter="today">
        <i class="fas fa-calendar-day"></i>
        <span>Today Only</span>
      </div>
    `;

    // Position and show menu
    const rect = filterButton.getBoundingClientRect();
    filterMenu.style.position = 'absolute';
    filterMenu.style.top = (rect.bottom + window.scrollY + 5) + 'px';
    filterMenu.style.left = rect.left + 'px';
    filterMenu.style.zIndex = '1000';

    document.body.appendChild(filterMenu);

    // Add click handlers to filter options
    filterMenu.querySelectorAll('.filter-option').forEach(option => {
      option.addEventListener('click', () => {
        const filter = option.dataset.filter;
        this.filterActivity(filter);
        filterMenu.remove();
      });
    });

    // Close menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!filterMenu.contains(e.target) && !filterButton.contains(e.target)) {
          filterMenu.remove();
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 100);
  }

  async filterActivity(filterType) {
    const activityContainer = document.querySelector('.activity-list');
    if (!activityContainer) return;

    // Show loading
    activityContainer.innerHTML = `
      <div class="activity-loading">
        <div class="loading-spinner"></div>
        <span>Loading activities...</span>
      </div>
    `;

    try {
      // Fetch filtered activity data
      const response = await fetch(`/admin/api/recent-activity?filter=${filterType}`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.renderFilteredActivity(result.data, filterType);
          
          // Update filter button text
          const filterButton = document.querySelector('.btn-filter');
          if (filterButton) {
            const filterNames = {
              all: 'All Activity',
              registrations: 'Registrations',
              approvals: 'Approvals',
              system: 'System Events',
              today: 'Today Only'
            };
            filterButton.innerHTML = `<i class="fas fa-filter"></i> ${filterNames[filterType] || 'Filter'}`;
          }
        } else {
          throw new Error(result.message || 'Failed to filter activity');
        }
      } else {
        throw new Error('Network error');
      }
    } catch (error) {
      console.error('Activity filter error:', error);
      activityContainer.innerHTML = `
        <div class="activity-error">
          <i class="fas fa-exclamation-triangle"></i>
          <span>Failed to load activity data</span>
        </div>
      `;
    }
  }

  renderFilteredActivity(activities, filterType) {
    const activityContainer = document.querySelector('.activity-list');
    if (!activityContainer) return;

    if (!activities || activities.length === 0) {
      activityContainer.innerHTML = `
        <div class="activity-empty">
          <i class="fas fa-inbox"></i>
          <span>No activities found for this filter</span>
        </div>
      `;
      return;
    }

    const activityHTML = activities.map(activity => `
      <div class="activity-item">
        <div class="activity-avatar">
          ${activity.companyName ? activity.companyName.charAt(0).toUpperCase() : activity.type === 'system' ? 'S' : 'U'}
        </div>
        <div class="activity-content">
          <div class="activity-text">
            <strong>${activity.companyName || activity.title || 'System'}</strong> 
            ${activity.description || activity.action || 'performed an action'}
          </div>
          <div class="activity-meta">
            <span class="activity-badge ${this.getActivityBadgeClass(activity.type)}">
              ${activity.type || 'ACTIVITY'}
            </span>
            <span data-timestamp="${activity.timestamp || activity.createdAt}">
              ${this.formatActivityTime(activity.timestamp || activity.createdAt)}
            </span>
          </div>
        </div>
      </div>
    `).join('');

    activityContainer.innerHTML = activityHTML;
  }

  getActivityBadgeClass(type) {
    const badges = {
      registration: 'badge-primary',
      approval: 'badge-success',
      system: 'badge-secondary',
      user: 'badge-primary',
      admin: 'badge-warning'
    };
    return badges[type] || 'badge-primary';
  }

  formatActivityTime(timestamp) {
    if (!timestamp) return 'Unknown time';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} min ago`;
    return 'Just now';
  }

  async viewAllActivity() {
    // Redirect to full activity page or show modal
    window.location.href = '/admin/activity';
  }

  setupChartFilters() {
    const periodFilter = document.getElementById('chartPeriodFilter');
    const refreshButton = document.getElementById('refreshChart');

    if (periodFilter) {
      periodFilter.addEventListener('change', (e) => {
        this.filterChartData(e.target.value);
      });
    }

    if (refreshButton) {
      refreshButton.addEventListener('click', () => {
        this.refreshChartData();
      });
    }
  }

  async filterChartData(period) {
    this.showChartLoading();
    
    try {
      // Fetch filtered data from backend
      const response = await fetch(`/admin/api/dashboard-stats?period=${period}`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Update chart with new data
          const chartData = this.processChartData(result.data, period);
          await this.updateChart(chartData);
        }
      } else {
        throw new Error('Failed to fetch filtered data');
      }
    } catch (error) {
      console.error('Chart filter error:', error);
      this.showChartError('Failed to filter chart data');
    } finally {
      this.hideChartLoading();
    }
  }

  async refreshChartData() {
    const refreshBtn = document.getElementById('refreshChart');
    if (refreshBtn) {
      refreshBtn.classList.add('loading');
    }

    try {
      const period = document.getElementById('chartPeriodFilter')?.value || '90';
      await this.filterChartData(period);
    } catch (error) {
      console.error('Chart refresh error:', error);
    } finally {
      if (refreshBtn) {
        refreshBtn.classList.remove('loading');
      }
    }
  }

  getChartData() {
    // Get data from window.dashboardData or use defaults
    const stats = window.dashboardData?.stats || {};
    
    if (stats.trends && stats.trends.monthlyRegistrations) {
      return this.processChartData(stats, '90');
    }

    // Default/sample data
    return {
      series: [
        {
          name: 'Total Users',
          data: [30, 40, 35, 50, 49, 60, 70, 91, 125, 140, 160, 180]
        },
        {
          name: 'Active Users', 
          data: [20, 30, 25, 40, 39, 50, 60, 81, 105, 120, 140, 160]
        }
      ],
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    };
  }

  processChartData(stats, period) {
    if (!stats.trends || !stats.trends.monthlyRegistrations) {
      return this.getChartData(); // Fallback to default
    }

    const monthlyData = stats.trends.monthlyRegistrations;
    const categories = monthlyData.map(item => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return monthNames[item._id.month - 1] || `Month ${item._id.month}`;
    });

    return {
      series: [
        {
          name: 'Total Registrations',
          data: monthlyData.map(item => item.total || 0)
        },
        {
          name: 'Approved Users',
          data: monthlyData.map(item => item.approved || 0)
        },
        {
          name: 'Pending Approval',
          data: monthlyData.map(item => (item.total || 0) - (item.approved || 0))
        }
      ],
      categories
    };
  }

  async updateChart(chartData) {
    if (this.growthChart) {
      await this.growthChart.updateSeries(chartData.series);
      await this.growthChart.updateOptions({
        xaxis: {
          categories: chartData.categories
        }
      });
    }
  }

  showChartLoading() {
    const chartContainer = document.getElementById('growthChart');
    if (chartContainer) {
      chartContainer.innerHTML = `
        <div class="chart-loading">
          <div class="loading-spinner"></div>
          <span>Loading analytics...</span>
        </div>
      `;
    }
  }

  hideChartLoading() {
    // Loading will be hidden when chart renders
  }

  showChartError(message) {
    const chartContainer = document.getElementById('growthChart');
    if (chartContainer) {
      chartContainer.innerHTML = `
        <div class="chart-error">
          <i class="fas fa-exclamation-triangle"></i>
          <span>${message}</span>
        </div>
      `;
    }
  }

  // ===============================================
  // 6. Real-time Updates
  // ===============================================
  startRealTimeUpdates() {
    // Update dashboard data every 30 seconds
    this.updateInterval = setInterval(() => {
      this.updateDashboardData();
    }, 30000);

  }

  async updateDashboardData() {
    try {
      const response = await fetch('/admin/api/dashboard-stats', {
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Update global data
          window.dashboardData.stats = result.data;
          
          // Update UI components
          this.updateStatCards(result.data);
          this.updateRecentActivity(result.data);
          this.updateSystemStatus(result.data);
          
        }
      }
    } catch (error) {
      console.error('Real-time update error:', error);
    }
  }

  updateStatCards(stats) {
    if (!stats || !stats.overview) return;
     
    const { overview } = stats;
    
    // Update total users
    this.updateStatValue('[data-stat="totalUsers"] .stat-value', overview.totalUsers);
    
    // Update active users  
    this.updateStatValue('[data-stat="activeUsers"] .stat-value', overview.activeUsers);
    
    // Update pending approvals
    this.updateStatValue('[data-stat="pendingApprovals"] .stat-value', overview.pendingApprovals);
    
    // Update revenue (calculated based on users)
    const revenue = (overview.totalUsers || 0) * 50; // $50 per user assumption
    this.updateStatValue('[data-stat="revenue"] .stat-value', `$${revenue.toLocaleString()}`);
    
    // Update suspended users if available
    if (overview.suspendedUsers !== undefined) {
      this.updateStatValue('[data-stat="suspendedUsers"] .stat-value', overview.suspendedUsers);
    }
    
    // Update rejected users if available
    if (overview.rejectedUsers !== undefined) {
      this.updateStatValue('[data-stat="rejectedUsers"] .stat-value', overview.rejectedUsers);
    }
  }

  updateStatValue(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
      // Smooth value transition with scale animation
      element.style.transition = 'transform 0.2s ease-in-out';
      element.style.transform = 'scale(1.05)';
      
      setTimeout(() => {
        const displayValue = typeof value === 'number' ? value.toLocaleString() : value;
        element.textContent = displayValue;
        element.style.transform = 'scale(1)';
      }, 100);
    }
  }

  updateRecentActivity(stats) {
    if (!stats || !stats.recentActivity || !Array.isArray(stats.recentActivity)) return;
    
    
    const activityContainer = document.querySelector('.activity-list');
    if (!activityContainer) return;
    
    // Clear dynamic items only (keep static defaults if no real data)
    const dynamicItems = activityContainer.querySelectorAll('[data-dynamic="true"]');
    dynamicItems.forEach(item => item.remove());
    
    // Add new real activity items
    stats.recentActivity.slice(0, 4).forEach((activity, index) => {
      const item = this.createActivityItem(activity);
      item.setAttribute('data-dynamic', 'true');
      
      // Insert at the beginning
      activityContainer.insertBefore(item, activityContainer.firstElementChild);
    });
  }

  createActivityItem(activity) {
    const item = document.createElement('div');
    item.className = 'activity-item animate-fade-in';
    
    const initial = activity.companyName ? activity.companyName.charAt(0).toUpperCase() : 'U';
    const statusBadge = this.getStatusBadge(activity.status);
    const timeAgo = this.getTimeAgo(activity.createdAt);
    
    item.innerHTML = `
      <div class="activity-avatar">${initial}</div>
      <div class="activity-content">
        <div class="activity-text">
          <strong>${activity.companyName || 'New User'}</strong> 
          ${this.getActivityText(activity.status)}
        </div>
        <div class="activity-meta">
          <span class="activity-badge ${statusBadge.class}">
            ${activity.country || 'USER'}
          </span>
          <span data-timestamp="${activity.createdAt}">
            ${timeAgo}
          </span>
        </div>
      </div>
    `;
    
    return item;
  }

  getStatusBadge(status) {
    const badges = {
      'active': { class: 'badge-success', text: 'ACTIVE' },
      'blocked': { class: 'badge-warning', text: 'PENDING' },
      'suspended': { class: 'badge-danger', text: 'SUSPENDED' },
      'rejected': { class: 'badge-danger', text: 'REJECTED' }
    };
    
    return badges[status] || { class: 'badge-primary', text: 'USER' };
  }

  getActivityText(status) {
    const texts = {
      'active': 'registered and was approved',
      'blocked': 'registered and awaiting approval',
      'suspended': 'account was suspended',
      'rejected': 'registration was rejected'
    };
    
    return texts[status] || 'registered';
  }

  getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} kun oldin`;
    } else if (diffHours > 0) {
      return `${diffHours} soat oldin`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes > 0 ? `${diffMinutes} daqiqa oldin` : 'Hozir';
    }
  }

  updateSystemStatus(systemData) {
    Object.keys(systemData).forEach(metric => {
      const progressBar = document.querySelector(`[data-metric="${metric}"] .metric-progress-bar`);
      if (progressBar) {
        progressBar.style.width = systemData[metric] + '%';
      }
    });
  }

  updateTimestamps() {
    const timeElements = document.querySelectorAll('[data-timestamp]');
    timeElements.forEach(element => {
      const timestamp = element.getAttribute('data-timestamp');
      element.textContent = this.formatRelativeTime(new Date(timestamp));
    });
  }

  // ===============================================
  // 7. User Menu & Dropdowns
  // ===============================================
  initializeDropdowns() {
    // User menu dropdown
    const userMenu = document.getElementById('userMenu');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userMenu && userDropdown) {
      userMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('hidden');
      });
    }

    // Language selector
    const langSelector = document.getElementById('languageSelector');
    const langDropdown = document.getElementById('languageDropdown');
    
    if (langSelector && langDropdown) {
      langSelector.addEventListener('click', (e) => {
        e.stopPropagation();
        langDropdown.classList.toggle('hidden');
      });
    }

    // Close dropdowns on outside click
    document.addEventListener('click', () => {
      document.querySelectorAll('.dropdown-menu').forEach(dropdown => {
        dropdown.classList.add('hidden');
      });
    });
  }

  initializeTooltips() {
    // Simple tooltip implementation
    const tooltipTriggers = document.querySelectorAll('[data-tooltip]');
    tooltipTriggers.forEach(trigger => {
      trigger.addEventListener('mouseenter', this.showTooltip.bind(this));
      trigger.addEventListener('mouseleave', this.hideTooltip.bind(this));
    });
  }

  showTooltip(e) {
    const text = e.target.getAttribute('data-tooltip');
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    tooltip.style.cssText = `
      position: absolute;
      background: var(--bg-elevated);
      color: var(--text-primary);
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      z-index: 1000;
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--border-color);
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = e.target.getBoundingClientRect();
    tooltip.style.left = rect.left + 'px';
    tooltip.style.top = (rect.top - tooltip.offsetHeight - 8) + 'px';
    
    e.target.tooltip = tooltip;
  }

  hideTooltip(e) {
    if (e.target.tooltip) {
      e.target.tooltip.remove();
      delete e.target.tooltip;
    }
  }

  // ===============================================
  // 8. Event Listeners Setup
  // ===============================================
  setupEventListeners() {
    // Table action event delegation
    this.setupTableEventDelegation();
    
    // Theme toggle
    document.getElementById('themeToggle')?.addEventListener('click', () => {
      this.toggleTheme();
    });

    // Sidebar toggle
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
      this.toggleSidebar();
    });

    // Mobile menu toggle
    document.getElementById('mobileMenuToggle')?.addEventListener('click', () => {
      this.toggleSidebar();
    });

    // Window resize handler for responsive behavior
    window.addEventListener('resize', () => {
      this.applySidebarState();
    });

    // Click outside sidebar to close (mobile)
    document.addEventListener('click', (e) => {
      const sidebar = document.querySelector('.admin-sidebar');
      const sidebarToggle = document.getElementById('sidebarToggle');
      const mobileToggle = document.getElementById('mobileMenuToggle');
      const isMobile = window.innerWidth <= 1024;
      
      if (isMobile && sidebar?.classList.contains('open')) {
        if (!sidebar.contains(e.target) && 
            !sidebarToggle?.contains(e.target) && 
            !mobileToggle?.contains(e.target)) {
          this.sidebarCollapsed = true;
          this.applySidebarState();
        }
      }
    });

    // Header Dropdowns
    this.setupHeaderDropdowns();

    // Production Language Selector
    this.setupLanguageSelector();

    // Legacy language selector (dropdown links) - fallback
    document.querySelectorAll('[data-lang]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const langCode = e.target.closest('[data-lang]').getAttribute('data-lang');
        this.changeLanguage(langCode);
      });
    });

    // Quick actions
    document.querySelectorAll('.quick-action').forEach(action => {
      action.addEventListener('click', this.handleQuickAction.bind(this));
    });

    // Window resize handler
    window.addEventListener('resize', this.handleResize.bind(this));

    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    
    // Close dropdowns on outside click
    document.addEventListener('click', this.handleOutsideClick.bind(this));
  }

  // ===============================================
  // Table Event Delegation
  // ===============================================
  setupTableEventDelegation() {
    const self = this; // Capture context
    
    // Single event listener for all table actions using event delegation
    document.addEventListener('click', function(e) {
      const actionBtn = e.target.closest('[data-action]');
      if (!actionBtn) return;

      e.preventDefault();
      e.stopPropagation();

      const action = actionBtn.getAttribute('data-action');
      const userId = actionBtn.getAttribute('data-user-id');

       // Handle specific actions with proper context
      switch (action) {
        case 'view':
          if (userId) {
             self.viewUserDetails(userId);
          } else {
            console.error('❌ No userId provided for view action');
            self.showToast('Error: No user ID provided', 'error');
          }
          break;
        case 'approve':
          if (userId) {
            self.quickApproveUser(userId);
          } else {
            console.error('❌ No userId provided for approve action');
            self.showToast('Error: No user ID provided', 'error');
          }
          break;
        case 'reject':
          if (userId) {
           self.quickRejectUser(userId);
          } else {
            console.error('❌ No userId provided for reject action');
            self.showToast('Error: No user ID provided', 'error');
          }
          break;
        case 'delete':
          if (userId) {
            self.deleteUserRequest(userId);
          } else {
            console.error('❌ No userId provided for delete action');
            self.showToast('Error: No user ID provided', 'error');
          }
          break;
        case 'bulk-approve':
          self.bulkApproveSelected();
          break;
        case 'bulk-reject':
          self.bulkRejectSelected();
          break;
        default:
          console.warn(`⚠️ Unknown action: ${action}`);
      }
    });
  }

  // ===============================================
  // Header Dropdown Management
  // ===============================================
  setupHeaderDropdowns() {
    
    // Language dropdown
    const languageBtn = document.getElementById('languageSelector');
    const languageDropdown = document.getElementById('languageDropdown');
    
     if (languageBtn && languageDropdown) {
      languageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDropdown(languageDropdown);
      });
    }

    // Notification dropdown
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    
    if (notificationBtn && notificationDropdown) {
      notificationBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDropdown(notificationDropdown);
      });
    }

    // User dropdown
    const userBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
     
    if (userBtn && userDropdown) {
      userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDropdown(userDropdown);
      });
    }
  }

  toggleDropdown(dropdownId) {
    const dropdown = typeof dropdownId === 'string' ? document.getElementById(dropdownId) : dropdownId;
    
    if (!dropdown) {
      console.warn('Dropdown not found:', dropdownId);
      return;
    }
    
    
    // Close all other dropdowns first
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      if (menu !== dropdown) {
        menu.classList.add('hidden');
      }
    });
    
    // Toggle the target dropdown
    const wasHidden = dropdown.classList.contains('hidden');
    dropdown.classList.toggle('hidden');
    
    
    // Force style update
    if (!dropdown.classList.contains('hidden')) {
      dropdown.style.display = 'block';
      dropdown.style.opacity = '1';
      dropdown.style.visibility = 'visible';
    }
  }

  handleOutsideClick(e) {
    // Close all dropdowns if clicked outside
    if (!e.target.closest('.header-dropdown')) {
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.add('hidden');
      });
    }
  }

  // ===============================================
  // 9. Action Handlers
  // ===============================================
  handleQuickAction(actionType, element) {
    // Show loading state
    this.showActionLoading(element);

    try {
      switch (actionType) {
        case 'add-user':
          this.handleAddUser();
          break;
        case 'approve-pending':
          this.handleApprovePending();
          break;
        case 'export-data':
          this.handleExportData();
          break;
        case 'settings':
          this.handleSettings();
          break;
        default:
          console.warn('Unknown quick action:', actionType);
      }
    } catch (error) {
      console.error('Quick action error:', error);
      this.showActionError(element, 'Action failed');
    } finally {
      this.hideActionLoading(element);
    }
  }

  async approveAllPending() {
    try {
      this.showLoading();
      const response = await fetch('/admin/api/approve-all-pending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content
        }
      });
      
      if (response.ok) {
        this.showNotification('All pending approvals processed successfully', 'success');
        this.updateDashboardData();
      } else {
        throw new Error('Failed to process approvals');
      }
    } catch (error) {
      this.showNotification('Failed to process approvals', 'error');
    } finally {
      this.hideLoading();
    }
  }

  exportData() {
    const link = document.createElement('a');
    link.href = '/admin/api/export-data';
    link.download = `slex-dashboard-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  handleResize() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 768;
    
    if (wasMobile !== this.isMobile) {
      // Responsive behavior changes
      if (this.isMobile) {
        document.querySelector('.admin-sidebar')?.classList.remove('open');
      }
    }
  }

  handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('headerSearch')?.focus();
    }
    
    // Ctrl/Cmd + / for sidebar toggle
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      this.toggleSidebar();
    }
  }

  // ===============================================
  // 10. Utility Functions
  // ===============================================
  animateNumber(element, from, to, duration = 1000) {
    const start = performance.now();
    const update = (currentTime) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      
      const current = Math.floor(from + (to - from) * progress);
      element.textContent = current.toLocaleString();
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };
    
    requestAnimationFrame(update);
  }

  formatRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  }

  showLoading() {
    document.getElementById('loadingOverlay')?.classList.remove('hidden');
  }

  hideLoading() {
    document.getElementById('loadingOverlay')?.classList.add('hidden');
  }

  showModal(modalId) {
    document.getElementById(modalId)?.classList.remove('hidden');
  }

  hideModal(modalId) {
    document.getElementById(modalId)?.classList.add('hidden');
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${this.getNotificationIcon(type)}"></i>
        <span>${message}</span>
      </div>
      <button class="notification-close">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    // Add to container
    let container = document.getElementById('notificationContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notificationContainer';
      container.className = 'notification-container';
      document.body.appendChild(container);
    }
    
    container.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
    
    // Click to close
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.remove();
    });
  }

  getNotificationIcon(type) {
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    return icons[type] || 'info-circle';
  }

  // ===============================================
  // Enhanced Component Initialization
  // ===============================================
  
  initEnhancedComponents() {
    // Initialize tooltips for all elements with data-tooltip
    document.querySelectorAll('[data-tooltip]').forEach(element => {
      element.title = element.getAttribute('data-tooltip');
    });

    // Enhanced search functionality
    const searchInput = document.getElementById('headerSearch');
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.performAdvancedSearch(e.target.value);
        }
        if (e.key === 'Escape') {
          e.target.value = '';
          e.target.blur();
        }
      });
    }

  }

  performAdvancedSearch(query) {
    if (query.length < 2) return;
    
    
    const searchInput = document.getElementById('headerSearch');
    if (searchInput) {
      searchInput.style.opacity = '0.7';
      searchInput.disabled = true;
    }
    
    // Simulate search API call
    setTimeout(() => {
      if (searchInput) {
        searchInput.style.opacity = '1';
        searchInput.disabled = false;
      }
    }, 800);
  }

  // ===============================================
  // 10. Production Language Selector
  // ===============================================
  setupLanguageSelector() {
    const languageToggle = document.getElementById('languageToggle');
    const languageMenu = document.getElementById('languageMenu');
    
    if (!languageToggle || !languageMenu) return;

    // Toggle dropdown
    languageToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleLanguageDropdown();
    });

    // Language option clicks
    document.querySelectorAll('.language-option').forEach(option => {
      option.addEventListener('click', (e) => {
        e.preventDefault();
        const langCode = option.getAttribute('data-lang');
        const langName = option.getAttribute('data-name');
        
        if (langCode !== this.currentLanguage) {
          this.changeLanguage(langCode, langName);
        }
        
        this.closeLanguageDropdown();
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!languageToggle.contains(e.target) && !languageMenu.contains(e.target)) {
        this.closeLanguageDropdown();
      }
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeLanguageDropdown();
      }
    });
  }

  toggleLanguageDropdown() {
    const languageMenu = document.getElementById('languageMenu');
    const languageToggle = document.getElementById('languageToggle');
    
    if (!languageMenu || !languageToggle) return;

    const isHidden = languageMenu.classList.contains('hidden');
    
    // Close all other dropdowns first
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      if (menu !== languageMenu) {
        menu.classList.add('hidden');
      }
    });

    if (isHidden) {
      languageMenu.classList.remove('hidden');
      languageToggle.classList.add('active');
    } else {
      languageMenu.classList.add('hidden');
      languageToggle.classList.remove('active');
    }
  }

  closeLanguageDropdown() {
    const languageMenu = document.getElementById('languageMenu');
    const languageToggle = document.getElementById('languageToggle');
    
    if (languageMenu) {
      languageMenu.classList.add('hidden');
    }
    
    if (languageToggle) {
      languageToggle.classList.remove('active');
    }
  }

  updateLanguageButton(langCode, langName) {
    const langConfig = {
      'uz': { flag: '🇺🇿', name: 'O\'zbekcha', code: 'UZ' },
      'en': { flag: '🇺🇸', name: 'English', code: 'EN' },
      'ru': { flag: '🇷🇺', name: 'Русский', code: 'RU' },
      'tr': { flag: '🇹🇷', name: 'Türkçe', code: 'TR' },
      'fa': { flag: '🇮🇷', name: 'فارسی', code: 'FA' },
      'zh': { flag: '🇨🇳', name: '中文', code: 'ZH' }
    };

    const current = langConfig[langCode] || langConfig['uz'];
    
    // Update button display
    const flagElement = document.querySelector('.lang-flag');
    const codeElement = document.querySelector('.lang-code');
    
    if (flagElement) flagElement.textContent = current.flag;
    if (codeElement) codeElement.textContent = current.code;

    // Update active state in menu
    document.querySelectorAll('.language-option').forEach(option => {
      const optionLang = option.getAttribute('data-lang');
      const checkIcon = option.querySelector('.option-check');
      
      if (optionLang === langCode) {
        option.classList.add('active');
        if (!checkIcon) {
          option.insertAdjacentHTML('beforeend', '<i class="fas fa-check option-check"></i>');
        }
      } else {
        option.classList.remove('active');
        if (checkIcon) {
          checkIcon.remove();
        }
      }
    });
  }

  // Generate mock chart data if real data not available
  generateMockChartData() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = months.map(() => Math.floor(Math.random() * 100) + 50);
    
    return {
      categories: months,
      series: [{
        name: 'Users',
        data: data
      }]
    };
  }

  // ===============================================
  // 10. Quick Actions Functionality
  // ===============================================
  setupQuickActions() {
    const quickActions = document.querySelectorAll('.quick-action[data-action]');
    
    quickActions.forEach(action => {
      action.addEventListener('click', (e) => {
        e.preventDefault();
        const actionType = action.getAttribute('data-action');
        this.handleQuickAction(actionType, action);
      });
    });

  }

  async handleQuickAction(actionType, element) {
    // Show loading state
    this.showActionLoading(element);

    try {
      switch (actionType) {
        case 'add-user':
          await this.handleAddUser();
          break;
        case 'approve-pending':
          await this.handleApprovePending();
          break;
        case 'export-data':
          await this.handleExportData();
          break;
        case 'settings':
          this.handleSettings();
          break;
        default:
          console.warn('Unknown quick action:', actionType);
      }
    } catch (error) {
      console.error('Quick action error:', error);
      this.showActionError(element, 'Action failed');
    } finally {
      this.hideActionLoading(element);
    }
  }

  async handleAddUser() {
    // For now, redirect to add user page
    // In the future, this could open a modal
    window.location.href = '/admin/users/create';
  }

  async handleApprovePending() {
    try {
      // Get pending approvals count
      const response = await fetch('/admin/api/pending-approvals', {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          // Show approval modal or redirect to pending page
          this.showPendingApprovalsModal(result.data);
        } else {
          this.showToast('No pending approvals found', 'info');
        }
      } else {
        throw new Error('Failed to fetch pending approvals');
      }
    } catch (error) {
      this.showToast('Failed to load pending approvals', 'error');
      throw error;
    }
  }

  async handleExportData() {
    try {
      // Start export process
      const response = await fetch('/admin/api/export-dashboard-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          format: 'csv',
          dateRange: 'last-30-days'
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showToast('Dashboard data exported successfully', 'success');
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      this.showToast('Failed to export data', 'error');
      throw error;
    }
  }

  handleSettings() {
    window.location.href = '/admin/settings';
  }

  showPendingApprovalsModal(pendingUsers) {
    // Create and show modal with pending approvals
    const modalHtml = `
      <div class="modal-overlay" id="pendingApprovalsModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Pending Approvals (${pendingUsers.length})</h3>
            <button class="modal-close" onclick="closePendingModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="pending-list">
              ${pendingUsers.map(user => `
                <div class="pending-item" data-user-id="${user.id}">
                  <div class="pending-info">
                    <div class="pending-company">${user.companyName}</div>
                    <div class="pending-email">${user.email}</div>
                    <div class="pending-meta">
                      <span class="pending-country">${user.country}</span>
                      <span class="pending-days">${user.daysPending} days ago</span>
                    </div>
                  </div>
                  <div class="pending-actions">
                    <button class="btn-approve" onclick="approveUser('${user.id}')">
                      <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn-reject" onclick="rejectUser('${user.id}')">
                      <i class="fas fa-times"></i> Reject
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" onclick="closePendingModal()">Close</button>
            <a href="/admin/users?status=pending" class="btn-primary">View All</a>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Add global functions for modal interactions
    window.closePendingModal = () => {
      const modal = document.getElementById('pendingApprovalsModal');
      if (modal) modal.remove();
    };

    window.approveUser = async (userId) => {
      try {
        const response = await fetch(`/admin/api/users/${userId}/approve`, {
          method: 'POST',
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        if (response.ok) {
          this.showToast('User approved successfully', 'success');
          document.querySelector(`[data-user-id="${userId}"]`).remove();
          this.updateDashboardData(); // Refresh data
        } else {
          throw new Error('Approval failed');
        }
      } catch (error) {
        this.showToast('Failed to approve user', 'error');
      }
    };

    window.rejectUser = async (userId) => {
      try {
        const response = await fetch(`/admin/api/users/${userId}/reject`, {
          method: 'POST',
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        if (response.ok) {
          this.showToast('User rejected', 'info');
          document.querySelector(`[data-user-id="${userId}"]`).remove();
          this.updateDashboardData(); // Refresh data
        } else {
          throw new Error('Rejection failed');
        }
      } catch (error) {
        this.showToast('Failed to reject user', 'error');
      }
    };
  }

  showActionLoading(element) {
    element.style.opacity = '0.6';
    element.style.pointerEvents = 'none';
    
    const icon = element.querySelector('i');
    if (icon) {
      icon.className = 'fas fa-spinner fa-spin';
    }
  }

  hideActionLoading(element) {
    element.style.opacity = '1';
    element.style.pointerEvents = 'auto';
    
    // Restore original icon based on action type
    const actionType = element.getAttribute('data-action');
    const icon = element.querySelector('i');
    if (icon) {
      switch (actionType) {
        case 'add-user':
          icon.className = 'fas fa-user-plus';
          break;
        case 'approve-pending':
          icon.className = 'fas fa-check-circle';
          break;
        case 'export-data':
          icon.className = 'fas fa-download';
          break;
        case 'settings':
          icon.className = 'fas fa-cog';
          break;
      }
    }
  }

  showActionError(element, message) {
    const icon = element.querySelector('i');
    if (icon) {
      icon.className = 'fas fa-exclamation-triangle';
      setTimeout(() => this.hideActionLoading(element), 2000);
    }
    this.showToast(message, 'error');
  }

  // ===============================================
  // 11. Toast Notifications
  // ===============================================
  showToast(message, type = 'info', duration = 4000) {
    const toastContainer = this.getOrCreateToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas ${this.getToastIcon(type)}"></i>
        <span>${message}</span>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;

    toastContainer.appendChild(toast);

    // Auto remove after duration
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, duration);

    return toast;
  }

  getOrCreateToastContainer() {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  getToastIcon(type) {
    switch (type) {
      case 'success': return 'fa-check-circle';
      case 'error': return 'fa-exclamation-circle';
      case 'warning': return 'fa-exclamation-triangle';
      case 'info':
      default: return 'fa-info-circle';
    }
  }

  // ===============================================
  // 12. Messages & Notifications System
  // ===============================================
  setupMessagesAndNotifications() {
    this.setupMessagesDropdown();
    this.setupNotificationsDropdown();
    this.loadMessages();
    this.loadNotifications();
    this.startNotificationPolling();
    
  }

  setupMessagesDropdown() {
    const messagesBtn = document.getElementById('messagesBtn');
    const messagesDropdown = document.getElementById('messagesDropdown');

    if (messagesBtn && messagesDropdown) {
      messagesBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDropdown('messagesDropdown');
        this.loadMessages(); // Refresh on each open
      });
    }

    // Global message functions
    window.markAllMessagesRead = () => {
      this.markAllMessagesRead();
    };
  }

  setupNotificationsDropdown() {
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');

    if (notificationBtn && notificationDropdown) {
      notificationBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDropdown('notificationDropdown');
        this.loadNotifications(); // Refresh on each open
      });
    }
  }

  async loadMessages() {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;

    // Show loading
    messagesContainer.innerHTML = `
      <div class="messages-loading">
        <div class="loading-spinner"></div>
        <span>Loading messages...</span>
      </div>
    `;

    try {
      const response = await fetch('/admin/api/messages', {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          this.renderMessages(result.data);
          this.updateMessagesBadge(result.unreadCount || 0);
        } else {
          this.showEmptyMessages();
        }
      } else {
        throw new Error('Failed to load messages');
      }
    } catch (error) {
      console.error('Messages loading error:', error);
      this.showEmptyMessages();
    }
  }

  async loadNotifications() {
    try {
      const response = await fetch('/admin/api/notifications', {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          this.renderNotifications(result.data);
          this.updateNotificationsBadge(result.unreadCount || 0);
        }
      }
    } catch (error) {
      console.error('Notifications loading error:', error);
    }
  }

  renderMessages(messages) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;

    if (messages.length === 0) {
      this.showEmptyMessages();
      return;
    }

    const messagesHtml = messages.map(message => `
      <div class="message-item ${message.isRead ? '' : 'unread'}" onclick="openMessage('${message.id}')">
        <div class="message-avatar">
          ${message.senderName ? message.senderName.charAt(0).toUpperCase() : 'U'}
        </div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-sender">${message.senderName || 'Unknown'}</span>
            <span class="message-time">${this.getTimeAgo(message.createdAt)}</span>
          </div>
          <div class="message-subject">${message.subject || 'No Subject'}</div>
          <div class="message-preview">${message.preview || message.content || 'No content'}</div>
        </div>
        <div class="message-status"></div>
      </div>
    `).join('');

    messagesContainer.innerHTML = messagesHtml;

    // Add global message functions
    window.openMessage = (messageId) => {
      this.openMessage(messageId);
    };
  }

  renderNotifications(notifications) {
    const notificationContainer = document.querySelector('#notificationDropdown .dropdown-content');
    if (!notificationContainer) return;

    if (notifications.length === 0) {
      notificationContainer.innerHTML = `
        <div class="notification-empty">
          <i class="fas fa-bell-slash"></i>
          <span>No notifications</span>
        </div>
      `;
      return;
    }

    const notificationsHtml = notifications.map(notification => `
      <div class="notification-item ${notification.isRead ? '' : 'unread'}" onclick="markNotificationRead('${notification.id}')">
        <div class="notification-icon ${notification.type}">
          <i class="fas ${this.getNotificationIcon(notification.type)}"></i>
        </div>
        <div class="notification-content">
          <div class="notification-title">${notification.title}</div>
          <div class="notification-text">${notification.message}</div>
          <div class="notification-time">${this.getTimeAgo(notification.createdAt)}</div>
        </div>
      </div>
    `).join('');

    notificationContainer.innerHTML = notificationsHtml;

    // Add global notification functions
    window.markNotificationRead = (notificationId) => {
      this.markNotificationRead(notificationId);
    };
  }

  showEmptyMessages() {
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
      messagesContainer.innerHTML = `
        <div class="messages-empty">
          <i class="fas fa-inbox"></i>
          <span>No messages</span>
        </div>
      `;
    }
  }

  updateMessagesBadge(count) {
    const badge = document.getElementById('messagesBadge');
    if (badge) {
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count.toString();
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  updateNotificationsBadge(count) {
    const badge = document.querySelector('#notificationBtn .notification-badge');
    if (badge) {
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count.toString();
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  async markAllMessagesRead() {
    try {
      const response = await fetch('/admin/api/messages/mark-all-read', {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });

      if (response.ok) {
        this.loadMessages(); // Refresh
        this.showToast('All messages marked as read', 'success');
      }
    } catch (error) {
      console.error('Mark all messages read error:', error);
      this.showToast('Failed to mark messages as read', 'error');
    }
  }

  async markNotificationRead(notificationId) {
    try {
      const response = await fetch(`/admin/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });

      if (response.ok) {
        this.loadNotifications(); // Refresh
      }
    } catch (error) {
      console.error('Mark notification read error:', error);
    }
  }

  async openMessage(messageId) {
    try {
      // Mark as read
      await fetch(`/admin/api/messages/${messageId}/read`, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });

      // Redirect to message page or open modal
      window.location.href = `/admin/messages/${messageId}`;
    } catch (error) {
      console.error('Open message error:', error);
    }
  }

  getNotificationIcon(type) {
    switch (type) {
      case 'success': return 'fa-check-circle';
      case 'warning': return 'fa-exclamation-triangle';
      case 'info': return 'fa-info-circle';
      case 'pending': return 'fa-clock';
      case 'user': return 'fa-user';
      case 'system': return 'fa-cog';
      default: return 'fa-bell';
    }
  }

  getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  }

  startNotificationPolling() {
    // Poll for new notifications every 2 minutes
    setInterval(() => {
      this.checkForNewNotifications();
    }, 120000);

  }

  async checkForNewNotifications() {
    try {
      const response = await fetch('/admin/api/notifications/check', {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.hasNew) {
          // Update badges
          this.updateNotificationsBadge(result.notificationCount || 0);
          this.updateMessagesBadge(result.messageCount || 0);
          
          // Show new notification toast
          if (result.latestNotification) {
            this.showNotificationToast(result.latestNotification);
          }
        }
      }
    } catch (error) {
      console.error('Notification check error:', error);
    }
  }

  showNotificationToast(notification) {
    const toast = this.showToast(
      `${notification.title}: ${notification.message}`,
      notification.type || 'info',
      6000
    );

    // Make toast clickable to open notifications
    toast.style.cursor = 'pointer';
    toast.addEventListener('click', () => {
      document.getElementById('notificationBtn')?.click();
      toast.remove();
    });
  }

  // ===============================================
  // 13. Pending Approvals Table Management
  // ===============================================
  setupPendingApprovalsTable() {
    this.setupSelectAllCheckbox();
    this.setupBulkActions();
    this.setupTableActions();
    
  }

  setupSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', (e) => {
        const userCheckboxes = document.querySelectorAll('.user-checkbox');
        userCheckboxes.forEach(checkbox => {
          checkbox.checked = e.target.checked;
        });
        this.updateBulkActionsVisibility();
      });
    }

    // Individual checkbox listeners
    document.querySelectorAll('.user-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateSelectAllState();
        this.updateBulkActionsVisibility();
      });
    });
  }

  updateSelectAllState() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const userCheckboxes = document.querySelectorAll('.user-checkbox');
    const checkedBoxes = document.querySelectorAll('.user-checkbox:checked');
    
    if (selectAllCheckbox) {
      if (checkedBoxes.length === 0) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = false;
      } else if (checkedBoxes.length === userCheckboxes.length) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = true;
      } else {
        selectAllCheckbox.indeterminate = true;
        selectAllCheckbox.checked = false;
      }
    }
  }

  updateBulkActionsVisibility() {
    const checkedBoxes = document.querySelectorAll('.user-checkbox:checked');
    const bulkApproveBtn = document.querySelector('.btn-bulk-approve');
    const bulkRejectBtn = document.querySelector('.btn-bulk-reject');

    if (bulkApproveBtn && bulkRejectBtn) {
      if (checkedBoxes.length > 0) {
        bulkApproveBtn.style.opacity = '1';
        bulkApproveBtn.disabled = false;
        bulkRejectBtn.style.opacity = '1';
        bulkRejectBtn.disabled = false;
        
        // Update button text with count
        const approveIcon = bulkApproveBtn.querySelector('i');
        const rejectIcon = bulkRejectBtn.querySelector('i');
        bulkApproveBtn.innerHTML = `${approveIcon.outerHTML} Approve (${checkedBoxes.length})`;
        bulkRejectBtn.innerHTML = `${rejectIcon.outerHTML} Reject (${checkedBoxes.length})`;
      } else {
        bulkApproveBtn.style.opacity = '0.5';
        bulkApproveBtn.disabled = true;
        bulkRejectBtn.style.opacity = '0.5';
        bulkRejectBtn.disabled = true;
        
        // Reset button text
        bulkApproveBtn.innerHTML = '<i class="fas fa-check-double"></i> Bulk Approve';
        bulkRejectBtn.innerHTML = '<i class="fas fa-times-circle"></i> Bulk Reject';
      }
    }
  }

  setupBulkActions() {
    // Global functions for EJS onclick handlers
    window.bulkApproveSelected = () => {
      this.bulkApproveSelected();
    };

    window.bulkRejectSelected = () => {
      this.bulkRejectSelected();
    };

    window.toggleSelectAll = (checkbox) => {
      this.toggleSelectAll(checkbox);
    };

    window.viewUserDetails = (userId) => {
      this.viewUserDetails(userId);
    };

    window.quickApproveUser = (userId) => {
      this.quickApproveUser(userId);
    };

    window.quickRejectUser = (userId) => {
      this.quickRejectUser(userId);
    };

    window.deleteUserRequest = (userId) => {
      this.deleteUserRequest(userId);
    };
  }

  setupTableActions() {
    // Add row selection on click (excluding action buttons)
    document.querySelectorAll('.pending-row').forEach(row => {
      row.addEventListener('click', (e) => {
        // Don't trigger row selection if clicking on buttons or checkboxes
        if (e.target.closest('.action-buttons') || e.target.type === 'checkbox') {
          return;
        }
        
        const checkbox = row.querySelector('.user-checkbox');
        if (checkbox) {
          checkbox.checked = !checkbox.checked;
          this.updateSelectAllState();
          this.updateBulkActionsVisibility();
        }
      });
    });
  }

  toggleSelectAll(checkbox) {
    const userCheckboxes = document.querySelectorAll('.user-checkbox');
    userCheckboxes.forEach(cb => {
      cb.checked = checkbox.checked;
    });
    this.updateBulkActionsVisibility();
  }

  async bulkApproveSelected() {
    const selectedUsers = this.getSelectedUserIds();
    
    if (selectedUsers.length === 0) {
      this.showToast('No users selected', 'warning');
      return;
    }

    // Confirm action
    if (!confirm(`Are you sure you want to approve ${selectedUsers.length} users?`)) {
      return;
    }

    this.showBulkActionFeedback('Processing bulk approval...', 'info');

    try {
      const response = await fetch('/admin/api/users/bulk-approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ userIds: selectedUsers })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.showBulkActionFeedback(`${result.successful} users approved successfully`, 'success');
          this.removeBulkProcessedRows(selectedUsers);
          this.updateDashboardData(); // Refresh dashboard stats
        } else {
          throw new Error(result.message || 'Bulk approval failed');
        }
      } else {
        throw new Error('Network error during bulk approval');
      }
    } catch (error) {
      console.error('Bulk approve error:', error);
      this.showBulkActionFeedback('Failed to approve users', 'error');
    }
  }

  async bulkRejectSelected() {
    const selectedUsers = this.getSelectedUserIds();
    
    if (selectedUsers.length === 0) {
      this.showToast('No users selected', 'warning');
      return;
    }

    // Get rejection reason
    const reason = prompt(`Please provide a reason for rejecting ${selectedUsers.length} users:`);
    if (!reason || reason.trim().length < 10) {
      this.showToast('Rejection reason must be at least 10 characters', 'error');
      return;
    }

    this.showBulkActionFeedback('Processing bulk rejection...', 'info');

    try {
      const response = await fetch('/admin/api/users/bulk-reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ 
          userIds: selectedUsers,
          reason: reason.trim()
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.showBulkActionFeedback(`${result.successful} users rejected`, 'success');
          this.removeBulkProcessedRows(selectedUsers);
          this.updateDashboardData(); // Refresh dashboard stats
        } else {
          throw new Error(result.message || 'Bulk rejection failed');
        }
      } else {
        throw new Error('Network error during bulk rejection');
      }
    } catch (error) {
      console.error('Bulk reject error:', error);
      this.showBulkActionFeedback('Failed to reject users', 'error');
    }
  }

  async viewUserDetails(userId) {
    try {
      const response = await fetch(`/admin/api/users/${userId}/details`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.showUserDetailsModal(result.data);
        } else {
          throw new Error(result.message || 'Failed to load user details');
        }
      } else {
        throw new Error('Network error');
      }
    } catch (error) {
      console.error('View user details error:', error);
      this.showToast('Failed to load user details', 'error');
    }
  }

  async quickApproveUser(userId) {
    if (!confirm('Are you sure you want to approve this user?')) {
      return;
    }

    this.showActionLoading(document.querySelector(`[data-user-id="${userId}"] .btn-approve`));

    try {
      const response = await fetch(`/admin/api/users/${userId}/approve`, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.showToast('User approved successfully', 'success');
          this.removeTableRow(userId);
          this.updateDashboardData();
        } else {
          throw new Error(result.message || 'Approval failed');
        }
      } else {
        throw new Error('Network error');
      }
    } catch (error) {
      console.error('Quick approve error:', error);
      this.showToast('Failed to approve user', 'error');
    }
  }

  async quickRejectUser(userId) {
    const reason = prompt('Please provide a rejection reason:');
    if (!reason || reason.trim().length < 10) {
      this.showToast('Rejection reason must be at least 10 characters', 'error');
      return;
    }

    this.showActionLoading(document.querySelector(`[data-user-id="${userId}"] .btn-reject`));

    try {
      const response = await fetch(`/admin/api/users/${userId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ reason: reason.trim() })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.showToast('User rejected', 'success');
          this.removeTableRow(userId);
          this.updateDashboardData();
        } else {
          throw new Error(result.message || 'Rejection failed');
        }
      } else {
        throw new Error('Network error');
      }
    } catch (error) {
      console.error('Quick reject error:', error);
      this.showToast('Failed to reject user', 'error');
    }
  }

  async deleteUserRequest(userId) {
    if (!confirm('Are you sure you want to delete this user request? This action cannot be undone.')) {
      return;
    }

    this.showActionLoading(document.querySelector(`[data-user-id="${userId}"] .btn-delete`));

    try {
      const response = await fetch(`/admin/api/users/${userId}/delete`, {
        method: 'DELETE',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.showToast('User request deleted', 'success');
          this.removeTableRow(userId);
          this.updateDashboardData();
        } else {
          throw new Error(result.message || 'Deletion failed');
        }
      } else {
        throw new Error('Network error');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      this.showToast('Failed to delete user request', 'error');
    }
  }

  getSelectedUserIds() {
    const checkedBoxes = document.querySelectorAll('.user-checkbox:checked');
    return Array.from(checkedBoxes).map(checkbox => checkbox.value);
  }

  removeTableRow(userId) {
    const row = document.querySelector(`[data-user-id="${userId}"]`);
    if (row) {
      row.style.opacity = '0.5';
      row.style.transform = 'translateX(-100%)';
      setTimeout(() => {
        row.remove();
        this.updateSelectAllState();
        this.updateBulkActionsVisibility();
        this.checkTableEmpty();
      }, 300);
    }
  }

  removeBulkProcessedRows(userIds) {
    userIds.forEach(userId => {
      this.removeTableRow(userId);
    });
  }

  checkTableEmpty() {
    const tableBody = document.querySelector('.pending-approvals-table tbody');
    if (tableBody && tableBody.children.length === 0) {
      const section = document.querySelector('.pending-approvals-section');
      if (section) {
        section.innerHTML = `
          <div class="pending-approvals-empty">
            <i class="fas fa-check-circle"></i>
            <span>All pending approvals have been processed!</span>
          </div>
        `;
      }
    }
  }

  showBulkActionFeedback(message, type) {
    // Remove existing feedback
    const existing = document.querySelector('.bulk-actions-feedback');
    if (existing) existing.remove();

    // Create new feedback
    const feedback = document.createElement('div');
    feedback.className = `bulk-actions-feedback ${type}`;
    feedback.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-spinner fa-spin'}"></i>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(feedback);

    // Show feedback
    setTimeout(() => feedback.classList.add('show'), 100);

    // Auto hide after delay (except for loading state)
    if (type !== 'info') {
      setTimeout(() => {
        feedback.classList.remove('show');
        setTimeout(() => feedback.remove(), 300);
      }, 4000);
    }
  }

  showUserDetailsModal(userData) {
    const modalHtml = `
      <div class="modal-overlay" id="userDetailsModal">
        <div class="modal-content user-details-modal">
          <div class="modal-header">
            <h3>User Details</h3>
            <button class="modal-close" onclick="closeUserDetailsModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="user-details-grid">
              <div class="detail-section">
                <h4>Company Information</h4>
                <div class="detail-item">
                  <span class="detail-label">Company Name:</span>
                  <span class="detail-value">${userData.companyName || 'N/A'}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Business Type:</span>
                  <span class="detail-value">${userData.businessType || 'N/A'}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Country:</span>
                  <span class="detail-value">${userData.country || 'N/A'}</span>
                </div>
              </div>
              <div class="detail-section">
                <h4>Contact Information</h4>
                <div class="detail-item">
                  <span class="detail-label">Email:</span>
                  <span class="detail-value">${userData.email}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Registration Date:</span>
                  <span class="detail-value">${new Date(userData.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Days Pending:</span>
                  <span class="detail-value">${userData.daysPending || 0} days</span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" onclick="closeUserDetailsModal()">Close</button>
            <button class="btn-approve" onclick="quickApproveUserFromModal('${userData.id}')">
              <i class="fas fa-check"></i> Approve
            </button>
            <button class="btn-reject" onclick="quickRejectUserFromModal('${userData.id}')">
              <i class="fas fa-times"></i> Reject
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Add global functions
    window.closeUserDetailsModal = () => {
      const modal = document.getElementById('userDetailsModal');
      if (modal) modal.remove();
    };

    window.quickApproveUserFromModal = (userId) => {
      window.closeUserDetailsModal();
      this.quickApproveUser(userId);
    };

    window.quickRejectUserFromModal = (userId) => {
      window.closeUserDetailsModal();
      this.quickRejectUser(userId);
    };
  }
}

// ===============================================
// Initialize Dashboard
// ===============================================

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.slexDashboard = new SLEXDashboard();
  
  // Initialize enhanced components after dashboard loads
  setTimeout(() => {
    window.slexDashboard.initEnhancedComponents();
      }, 200);
}); 

// ===============================================
// Global Functions for Template Access
// ===============================================

// ===============================================
// Professional Global Functions - Senior Level
// ===============================================

/**
 * View user details with professional modal
 * @param {string} userId - User ID
 */
window.viewUserDetails = async function(userId) {
  try {
    
    // Show loading state
    if (window.SLEXDashboard) {
      window.SLEXDashboard.showToast('info', 'Loading user details...');
    }
    
    const response = await fetch(`/admin/api/users/${userId}/details`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        showUserDetailsModal(result.data);
      } else {
        throw new Error(result.message || 'Failed to load user details');
      }
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ View user details failed:', error);
    
    if (window.SLEXDashboard) {
      window.SLEXDashboard.showToast('error', 'Could not load user details: ' + error.message);
    } else {
      alert('Failed to load user details: ' + error.message);
    }
  }
};

/**
 * Show professional user details modal
 * @param {Object} data - User data object
 */
function showUserDetailsModal(data) {
  const user = data.user;
  const stats = data.statistics || {};
  
  const modalHTML = `
    <div id="userDetailsModal" class="modal-overlay" onclick="closeUserDetailsModal()">
      <div class="modal-content user-details-modal" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3>User Details</h3>
          <button class="modal-close" onclick="closeUserDetailsModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="user-details-grid">
            <div class="user-info-section">
              <h4>Company Information</h4>
              <div class="info-row">
                <span class="label">Company Name:</span>
                <span class="value">${user.companyName || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="label">Business Type:</span>
                <span class="value">${user.businessType || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="label">Country:</span>
                <span class="value">${user.country || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value">${user.email || 'N/A'}</span>
              </div>
            </div>
            <div class="user-stats-section">
              <h4>Statistics</h4>
              <div class="info-row">
                <span class="label">Registration Date:</span>
                <span class="value">${new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <div class="info-row">
                <span class="label">Status:</span>
                <span class="value status-${user.status}">${user.status}</span>
              </div>
              <div class="info-row">
                <span class="label">Days Pending:</span>
                <span class="value">${calculateDaysPending(user.createdAt)} days</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeUserDetailsModal()">Close</button>
          <button class="btn btn-success" onclick="quickApproveUser('${user._id}'); closeUserDetailsModal();">
            <i class="fas fa-check"></i> Approve
          </button>
          <button class="btn btn-danger" onclick="quickRejectUser('${user._id}'); closeUserDetailsModal();">
            <i class="fas fa-times"></i> Reject
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Remove existing modal if any
  const existingModal = document.getElementById('userDetailsModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Add modal to body
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Add CSS animation
  setTimeout(() => {
    const modal = document.getElementById('userDetailsModal');
    if (modal) {
      modal.classList.add('modal-show');
    }
  }, 10);
}

/**
 * Close user details modal
 */
window.closeUserDetailsModal = function() {
  const modal = document.getElementById('userDetailsModal');
  if (modal) {
    modal.classList.add('modal-hide');
    setTimeout(() => modal.remove(), 300);
  }
};

/**
 * Calculate days pending
 * @param {string} createdAt - Creation date
 * @returns {number} Days pending
 */
function calculateDaysPending(createdAt) {
  const now = new Date();
  const created = new Date(createdAt);
  const diffTime = Math.abs(now - created);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Quick approve user with professional feedback
 * @param {string} userId - User ID
 */
window.quickApproveUser = async function(userId) {
  // Professional confirmation dialog
  if (!showConfirmDialog('Approve User', 'Are you sure you want to approve this user?', 'success')) {
    return;
  }
  
  try {
    
    // Show loading state
    if (window.SLEXDashboard) {
      window.SLEXDashboard.showToast('info', 'Approving user...');
    }
    
    const response = await fetch(`/admin/api/users/${userId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({ 
        notes: 'Approved via dashboard quick action',
        timestamp: new Date().toISOString()
      })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        
        // Professional UI updates
        updateUserRowStatus(userId, 'approved');
        updateDashboardStats();
        
        if (window.SLEXDashboard) {
          window.SLEXDashboard.showToast('success', `User approved successfully! Company: ${result.data.companyName}`);
        } else {
          alert('User approved successfully!');
        }
        
        // Smooth reload after delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(result.message || 'Approval failed');
      }
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ User approval failed:', error);
    
    if (window.SLEXDashboard) {
      window.SLEXDashboard.showToast('error', 'Could not approve user: ' + error.message);
    } else {
      alert('Failed to approve user: ' + error.message);
    }
  }
  };

/**
 * Show professional confirmation dialog
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {string} type - Dialog type (success, danger, warning)
 * @returns {boolean} User confirmation
 */
function showConfirmDialog(title, message, type = 'warning') {
  // For now use native confirm, can be enhanced with custom modal later
  return confirm(`${title}\n\n${message}`);
}

/**
 * Update user row status in pending approvals table
 * @param {string} userId - User ID
 * @param {string} status - New status
 */
function updateUserRowStatus(userId, status) {
  const userRow = document.querySelector(`[data-user-id="${userId}"]`);
  if (!userRow) return;
  
  // Add visual feedback
  userRow.classList.add(`status-${status}`);
  
  // Update status badge
  const statusBadge = userRow.querySelector('.status-badge');
  if (statusBadge) {
    statusBadge.className = `status-badge ${status}`;
    statusBadge.innerHTML = `<i class="fas fa-${status === 'approved' ? 'check' : 'times'}"></i> ${status}`;
  }
  
  // Disable action buttons
  const actionButtons = userRow.querySelectorAll('.btn-action');
  actionButtons.forEach(btn => {
    btn.disabled = true;
    btn.style.opacity = '0.5';
  });
  
  // Fade out row after delay
  setTimeout(() => {
    userRow.style.opacity = '0.6';
    userRow.style.pointerEvents = 'none';
  }, 1000);
}

/**
 * Update dashboard statistics
 */
function updateDashboardStats() {
  // Get current pending count
  const pendingRows = document.querySelectorAll('.pending-row:not(.status-approved):not(.status-rejected)');
  const newCount = pendingRows.length;
  
  // Update pending approvals stat card
  const pendingStatCard = document.querySelector('[data-stat="pendingApprovals"] .stat-value');
  if (pendingStatCard) {
    pendingStatCard.textContent = newCount;
  }
  
  // Update notification badge
  const notificationBadge = document.querySelector('#notificationBtn .notification-badge');
  if (notificationBadge) {
    if (newCount > 0) {
      notificationBadge.textContent = newCount;
      notificationBadge.style.display = 'block';
    } else {
      notificationBadge.style.display = 'none';
    }
  }
}

/**
 * Quick reject user with professional feedback
 * @param {string} userId - User ID
 */
window.quickRejectUser = async function(userId) {
  const reason = prompt('Please provide a reason for rejection (minimum 10 characters):');
  if (!reason || reason.trim().length < 10) {
    alert('Rejection reason must be at least 10 characters long');
    return;
  }
  
  try {
    const response = await fetch(`/admin/api/users/${userId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({ reason: reason.trim() })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        alert('User rejected successfully!');
        // Reload page to update stats
        window.location.reload();
      } else {
        throw new Error(result.message);
      }
    } else {
      throw new Error('Failed to reject user');
    }
  } catch (error) {
    console.error('Reject user error:', error);
    alert('Failed to reject user: ' + error.message);
  }
};

window.deleteUserRequest = async function(userId) {
  if (!confirm('Are you sure you want to delete this user request? This action cannot be undone.')) return;
  
  try {
    const response = await fetch(`/admin/api/users/${userId}/delete`, {
      method: 'DELETE',
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        alert('User request deleted successfully!');
        // Reload page to update stats
        window.location.reload();
      } else {
        throw new Error(result.error);
      }
    } else {
      throw new Error('Failed to delete user request');
    }
  } catch (error) {
    console.error('Delete user error:', error);
    alert('Failed to delete user: ' + error.message);
  }
};

window.bulkApproveSelected = async function() {
  const selectedIds = Array.from(document.querySelectorAll('.user-checkbox:checked')).map(cb => cb.value);
  
  if (selectedIds.length === 0) {
    alert('Please select users to approve');
    return;
  }

  if (!confirm(`Are you sure you want to approve ${selectedIds.length} selected users?`)) return;
  
  try {
    const response = await fetch('/admin/api/users/bulk-approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({ userIds: selectedIds })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        alert(`${result.data.successful} users approved successfully!`);
        // Reload page to update stats
        window.location.reload();
      } else {
        throw new Error(result.error);
      }
    } else {
      throw new Error('Failed to bulk approve users');
    }
  } catch (error) {
    console.error('Bulk approve error:', error);
    alert('Failed to approve users: ' + error.message);
  }
};

window.bulkRejectSelected = async function() {
  const selectedIds = Array.from(document.querySelectorAll('.user-checkbox:checked')).map(cb => cb.value);
  
  if (selectedIds.length === 0) {
    alert('Please select users to reject');
    return;
  }

  const reason = prompt('Please provide a reason for rejection (minimum 10 characters):');
  if (!reason || reason.trim().length < 10) {
    alert('Rejection reason must be at least 10 characters long');
    return;
  }

  if (!confirm(`Are you sure you want to reject ${selectedIds.length} selected users?`)) return;
  
  try {
    const response = await fetch('/admin/api/users/bulk-reject', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({ userIds: selectedIds, reason: reason.trim() })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        alert(`${result.data.successful} users rejected successfully!`);
        // Reload page to update stats
        window.location.reload();
      } else {
        throw new Error(result.error);
      }
    } else {
      throw new Error('Failed to bulk reject users');
    }
  } catch (error) {
    console.error('Bulk reject error:', error);
    alert('Failed to reject users: ' + error.message);
  }
};

window.toggleSelectAll = function(selectAllCheckbox) {
  const userCheckboxes = document.querySelectorAll('.user-checkbox');
  userCheckboxes.forEach(checkbox => {
    checkbox.checked = selectAllCheckbox.checked;
  });
};

/**
 * Mark all messages as read with professional feedback
 */
window.markAllMessagesRead = async function() {
  try {
    
    if (window.SLEXDashboard) {
      window.SLEXDashboard.showToast('info', 'Marking all messages as read...');
    }
    
    const response = await fetch('/admin/api/messages/mark-all-read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        
        // Update UI immediately
        document.querySelectorAll('.message-item.unread').forEach(item => {
          item.classList.remove('unread');
          item.classList.add('read');
          const indicator = item.querySelector('.unread-indicator');
          if (indicator) indicator.remove();
        });
        
        // Update badge
        const messagesBadge = document.getElementById('messagesBadge');
        if (messagesBadge) {
          messagesBadge.style.display = 'none';
        }
        
        if (window.SLEXDashboard) {
          window.SLEXDashboard.showToast('success', 'All messages marked as read successfully');
        } else {
          alert('All messages marked as read');
        }
      } else {
        throw new Error(result.message || 'Failed to mark messages as read');
      }
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ Mark all messages read failed:', error);
    
    if (window.SLEXDashboard) {
      window.SLEXDashboard.showToast('error', 'Could not mark all messages as read: ' + error.message);
    } else {
      alert('Failed to mark all messages as read: ' + error.message);
    }
  }
};

/**
 * Mark all notifications as read with professional feedback
 */
window.markAllNotificationsRead = async function() {
  try {
    
    if (window.SLEXDashboard) {
      window.SLEXDashboard.showToast('info', 'Marking all notifications as read...');
    }
    
    const response = await fetch('/admin/api/notifications/mark-all-read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        
        // Update UI immediately
        document.querySelectorAll('.notification-item.unread').forEach(item => {
          item.classList.remove('unread');
          item.classList.add('read');
          const indicator = item.querySelector('.unread-indicator');
          if (indicator) indicator.remove();
        });
        
        // Update badge
        const notificationsBadge = document.querySelector('#notificationBtn .notification-badge');
        if (notificationsBadge) {
          notificationsBadge.style.display = 'none';
        }
        
        if (window.SLEXDashboard) {
          window.SLEXDashboard.showToast('success', 'All notifications marked as read successfully');
        }
      } else {
        throw new Error(result.message || 'Failed to mark notifications as read');
      }
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ Mark all notifications read failed:', error);
    
    if (window.SLEXDashboard) {
      window.SLEXDashboard.showToast('error', 'Could not mark all notifications as read: ' + error.message);
    }
  }
};

/**
 * Global function to mark individual message as read
 * @param {string} messageId - Message ID
 */
window.markMessageAsRead = async function(messageId) {
  if (window.SLEXDashboard && window.SLEXDashboard.markMessageRead) {
    await window.SLEXDashboard.markMessageRead(messageId);
  }
};

/**
 * Global function to mark individual notification as read
 * @param {string} notificationId - Notification ID
 */
window.markNotificationAsRead = async function(notificationId) {
  if (window.SLEXDashboard && window.SLEXDashboard.markNotificationRead) {
    await window.SLEXDashboard.markNotificationRead(notificationId);
  }
}; 

// ===============================================
// DASHBOARD INITIALIZATION - SENIOR LEVEL
// ===============================================

// Initialize Dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  
  try {
    // Create dashboard instance
    window.SLEXDashboard = new SLEXDashboard();
    
    // Initialize dashboard
    window.SLEXDashboard.init();
    
    
    // Show success notification after initialization
    setTimeout(() => {
      if (window.SLEXDashboard && window.SLEXDashboard.showToast) {
        window.SLEXDashboard.showToast('success', 'Dashboard loaded successfully!');
      }
    }, 1000);
    
  } catch (error) {
    console.error('❌ Dashboard initialization failed:', error);
    
    // Fallback alert if toast system fails
    setTimeout(() => {
      alert('Dashboard initialization failed. Please refresh the page.');
    }, 500);
  }
});

// Auto-refresh dashboard data every 30 seconds
setInterval(() => {
  if (window.SLEXDashboard && typeof window.SLEXDashboard.loadMessages === 'function') {

    window.SLEXDashboard.loadMessages();
    window.SLEXDashboard.loadNotifications();
  }
}, 30000);

// ===============================================
// ADMIN HEADER DROPDOWN FIX - INTEGRATED
// ===============================================

class AdminHeaderDropdownFix {
  constructor() {
    this.init();
    this.setupRealTimeBadges();
  }

  init() {
    
    // Wait for DOM elements to be available
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.waitForElements();
      });
    } else {
      this.waitForElements();
    }
  }

  waitForElements() {
    // Check if essential elements exist, retry if not
    const checkElements = () => {
      const languageToggle = document.getElementById('languageToggle');
      const messagesBtn = document.getElementById('messagesBtn');
      const notificationBtn = document.getElementById('notificationBtn');
      const userMenuBtn = document.getElementById('userMenuBtn');
      
      if (languageToggle && messagesBtn && notificationBtn && userMenuBtn) {
        this.setupDropdowns();
        return true;
      } else {
        return false;
      }
    };

    // Try immediate check
    if (!checkElements()) {
      // Retry with interval
      let attempts = 0;
      const maxAttempts = 20; // 10 seconds max wait
      
      const retryInterval = setInterval(() => {
        attempts++;
        if (checkElements() || attempts >= maxAttempts) {
          clearInterval(retryInterval);
          if (attempts >= maxAttempts) {
            console.error('❌ Failed to find header elements after maximum attempts');
          }
        }
      }, 500);
    }
  }

  setupDropdowns() {

    // Debug: Check if elements exist
    const languageToggle = document.getElementById('languageToggle');
    const messagesBtn = document.getElementById('messagesBtn');
    const notificationBtn = document.getElementById('notificationBtn');
    const userMenuBtn = document.getElementById('userMenuBtn');
    
   
    // Language Dropdown
    this.setupLanguageDropdown();
    
    // Messages Dropdown
    this.setupMessagesDropdown();
    
    // Notifications Dropdown
    this.setupNotificationsDropdown();
    
    // User Menu Dropdown
    this.setupUserMenuDropdown();
    
    // Global click outside handler
    this.setupGlobalHandlers();
    
  }

  setupLanguageDropdown() {
    const languageToggle = document.getElementById('languageToggle');
    const languageMenu = document.getElementById('languageMenu');
    
    if (!languageToggle || !languageMenu) {
      console.warn('⚠️ Language dropdown elements not found');
      return;
    }


    // Remove existing listeners by cloning node
    const newLanguageToggle = languageToggle.cloneNode(true);
    languageToggle.parentNode.replaceChild(newLanguageToggle, languageToggle);

    newLanguageToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      this.toggleDropdown(languageMenu);
      this.closeOtherDropdowns(languageMenu);
    });

    // Language option clicks
    const languageOptions = languageMenu.querySelectorAll('.language-option');
    languageOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const langCode = option.dataset.lang;
        const langName = option.dataset.name;
        
        
        if (langCode) {
          this.changeLanguage(langCode);
          this.closeDropdown(languageMenu);
        }
      });
    });
  }

  setupMessagesDropdown() {
    const messagesBtn = document.getElementById('messagesBtn');
    const messagesDropdown = document.getElementById('messagesDropdown');
    
    if (!messagesBtn || !messagesDropdown) {
      console.warn('⚠️ Messages dropdown elements not found');
      return;
    }


    // Remove existing listeners by cloning node
    const newMessagesBtn = messagesBtn.cloneNode(true);
    messagesBtn.parentNode.replaceChild(newMessagesBtn, messagesBtn);

    newMessagesBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      this.toggleDropdown(messagesDropdown);
      this.closeOtherDropdowns(messagesDropdown);
      this.loadMessages();
    });
  }

  setupNotificationsDropdown() {
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    
    if (!notificationBtn || !notificationDropdown) {
      console.warn('⚠️ Notifications dropdown elements not found');
      return;
    }


    // Remove existing listeners by cloning node
    const newNotificationBtn = notificationBtn.cloneNode(true);
    notificationBtn.parentNode.replaceChild(newNotificationBtn, notificationBtn);

    newNotificationBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      this.toggleDropdown(notificationDropdown);
      this.closeOtherDropdowns(notificationDropdown);
      this.loadNotifications();
    });
  }

  setupUserMenuDropdown() {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (!userMenuBtn || !userDropdown) {
      console.warn('⚠️ User menu dropdown elements not found');
      return;
    }


    // Remove existing listeners by cloning node
    const newUserMenuBtn = userMenuBtn.cloneNode(true);
    userMenuBtn.parentNode.replaceChild(newUserMenuBtn, userMenuBtn);

    newUserMenuBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      this.toggleDropdown(userDropdown);
      this.closeOtherDropdowns(userDropdown);
    });
  }

  setupGlobalHandlers() {
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.header-dropdown') && !e.target.closest('.language-dropdown')) {
        this.closeAllDropdowns();
      }
    });

    // Close dropdowns on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllDropdowns();
      }
    });
  }

  // ===============================================
  // DROPDOWN UTILITIES
  // ===============================================

  toggleDropdown(dropdown) {
    if (!dropdown) return;
    
    const isHidden = dropdown.classList.contains('hidden');
    
    if (isHidden) {
      this.openDropdown(dropdown);
    } else {
      this.closeDropdown(dropdown);
    }
  }

  openDropdown(dropdown) {
    if (!dropdown) return;
    
    dropdown.classList.remove('hidden');
    dropdown.style.cssText = `
      visibility: visible !important;
      opacity: 1 !important;
      transform: translateY(0) !important;
      pointer-events: auto !important;
      display: block !important;
      position: absolute !important;
      top: 100% !important;
      right: 0 !important;
      z-index: 1050 !important;
    `;
    
  }

  closeDropdown(dropdown) {
    if (!dropdown) return;
    
    dropdown.classList.add('hidden');
    dropdown.style.cssText = `
      visibility: hidden !important;
      opacity: 0 !important;
      transform: translateY(-10px) !important;
      pointer-events: none !important;
      display: none !important;
    `;
  }

  closeOtherDropdowns(keepOpen) {
    const allDropdowns = document.querySelectorAll('.dropdown-menu, .language-menu');
    allDropdowns.forEach(dropdown => {
      if (dropdown !== keepOpen) {
        this.closeDropdown(dropdown);
      }
    });
  }

  closeAllDropdowns() {
    const allDropdowns = document.querySelectorAll('.dropdown-menu, .language-menu');
    allDropdowns.forEach(dropdown => {
      this.closeDropdown(dropdown);
    });
  }

  // ===============================================
  // LANGUAGE SWITCHING
  // ===============================================

  async changeLanguage(langCode) {
    
    try {
      // Show loading state
      this.showLanguageLoading(true);
      
      // Make API request to change language
      const response = await fetch('/admin/api/language/change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ language: langCode }),
        credentials: 'same-origin'
      });

      if (response.ok) {
        
        // Reload page with new language
        setTimeout(() => {
          window.location.reload();
        }, 300);
      } else {
        throw new Error('Language change request failed');
      }

    } catch (error) {
      console.error('❌ Language change failed:', error);
      this.showToast('error', 'Failed to change language. Please try again.');
    } finally {
      this.showLanguageLoading(false);
    }
  }

  showLanguageLoading(show) {
    const languageToggle = document.getElementById('languageToggle');
    if (!languageToggle) return;

    const chevron = languageToggle.querySelector('.lang-chevron');
    if (chevron) {
      if (show) {
        chevron.className = 'fas fa-spinner fa-spin';
        languageToggle.disabled = true;
      } else {
        chevron.className = 'fas fa-chevron-down lang-chevron';
        languageToggle.disabled = false;
      }
    }
  }

  // ===============================================
  // MESSAGES & NOTIFICATIONS LOADING
  // ===============================================

  async loadMessages() {
    const messagesContainer = document.getElementById('messagesContainer');
    
    if (!messagesContainer) {
      console.warn('Messages container not found');
      return;
    }

    // Show loading state
    messagesContainer.innerHTML = `
      <div class="messages-loading">
        <div class="loading-spinner"></div>
        <span>Loading messages...</span>
      </div>
    `;

    try {
      const response = await fetch('/admin/api/messages');
      const data = await response.json();

      if (data.success) {
        this.renderMessages(data.data);
        this.updateMessagesBadge(data.data);
      } else {
        throw new Error(data.message || 'Failed to load messages');
      }

    } catch (error) {
      console.error('❌ Messages loading failed:', error);
      messagesContainer.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Failed to load messages</p>
          <button onclick="window.adminHeaderDropdownFix.loadMessages()" class="btn-retry">
            Try Again
          </button>
        </div>
      `;
    }
  }

  async loadNotifications() {
    const notificationsContainer = document.getElementById('notificationsContainer');
    
    if (!notificationsContainer) {
      console.warn('Notifications container not found');
      return;
    }

    // Show loading state
    notificationsContainer.innerHTML = `
      <div class="notifications-loading">
        <div class="loading-spinner"></div>
        <span>Loading notifications...</span>
      </div>
    `;

    try {
      const response = await fetch('/admin/api/notifications');
      const data = await response.json();

      if (data.success) {
        this.renderNotifications(data.data);
        this.updateNotificationsBadge(data.data);
      } else {
        throw new Error(data.message || 'Failed to load notifications');
      }

    } catch (error) {
      console.error('❌ Notifications loading failed:', error);
      notificationsContainer.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Failed to load notifications</p>
          <button onclick="window.adminHeaderDropdownFix.loadNotifications()" class="btn-retry">
            Try Again
          </button>
        </div>
      `;
    }
  }

  // ===============================================
  // RENDER MESSAGES & NOTIFICATIONS
  // ===============================================

  renderMessages(messages) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;

    if (!messages || messages.length === 0) {
      messagesContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>No messages found</p>
        </div>
      `;
      return;
    }

    const messagesHTML = messages.map(message => this.createMessageHTML(message)).join('');
    messagesContainer.innerHTML = messagesHTML;
  }

  renderNotifications(notifications) {
    const notificationsContainer = document.getElementById('notificationsContainer');
    if (!notificationsContainer) return;

    if (!notifications || notifications.length === 0) {
      notificationsContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-bell-slash"></i>
          <p>No notifications found</p>
        </div>
      `;
      return;
    }

    const notificationsHTML = notifications.map(notification => this.createNotificationHTML(notification)).join('');
    notificationsContainer.innerHTML = notificationsHTML;
  }

  createMessageHTML(message) {
    const isUnread = !message.readAt;
    const timeAgo = this.formatTimeAgo(message.createdAt);
    
    return `
      <div class="message-item ${isUnread ? 'unread' : ''}" 
           onclick="window.adminHeaderDropdownFix.handleMessageClick('${message._id}')">
        <div class="message-avatar">
          ${message.senderId?.name?.charAt(0) || 'U'}
        </div>
        <div class="message-content">
          <div class="message-from">
            ${message.senderId?.name || 'Unknown User'}
          </div>
          <div class="message-subject">
            ${message.subject || 'Support Message'}
          </div>
          <div class="message-preview">
            ${message.content?.substring(0, 50) || ''}...
          </div>
          <div class="message-time">${timeAgo}</div>
        </div>
        ${isUnread ? '<div class="unread-indicator"></div>' : ''}
      </div>
    `;
  }

  createNotificationHTML(notification) {
    const isUnread = !notification.readAt;
    const timeAgo = this.formatTimeAgo(notification.createdAt);
    
    return `
      <div class="notification-item ${isUnread ? 'unread' : ''}" 
           onclick="window.adminHeaderDropdownFix.handleNotificationClick('${notification._id}')">
        <div class="notification-icon ${notification.color || 'blue'}">
          <i class="fas ${this.getNotificationIcon(notification.type)}"></i>
        </div>
        <div class="notification-content">
          <div class="notification-title">
            ${notification.title}
          </div>
          <div class="notification-message">
            ${notification.message}
          </div>
          <div class="notification-time">${timeAgo}</div>
        </div>
        ${isUnread ? '<div class="unread-indicator"></div>' : ''}
      </div>
    `;
  }

  // ===============================================
  // BADGE UPDATES
  // ===============================================

  updateMessagesBadge(messages) {
    const messagesBadge = document.getElementById('messagesBadge');
    if (!messagesBadge) return;

    const unreadCount = messages.filter(msg => !msg.readAt).length;
    
    if (unreadCount > 0) {
      messagesBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      messagesBadge.style.display = 'block';
    } else {
      messagesBadge.style.display = 'none';
    }
  }

  updateNotificationsBadge(notifications) {
    const notificationBadge = document.querySelector('#notificationBtn .notification-badge');
    if (!notificationBadge) return;

    const unreadCount = notifications.filter(notif => !notif.readAt).length;
    
    if (unreadCount > 0) {
      notificationBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      notificationBadge.style.display = 'block';
    } else {
      notificationBadge.style.display = 'none';
    }
  }

  // ===============================================
  // REAL-TIME BADGE UPDATES
  // ===============================================

  setupRealTimeBadges() {
    
    // Update badges every 30 seconds
    this.badgeUpdateInterval = setInterval(() => {
      this.updateBadgesCount();
    }, 30000);

    // Initial badge update
    setTimeout(() => {
      this.updateBadgesCount();
    }, 2000);
  }

  async updateBadgesCount() {
    try {
      // Get unread messages count
      const messagesResponse = await fetch('/admin/api/messages?unreadOnly=true');
      const messagesData = await messagesResponse.json();
      
      if (messagesData.success) {
        this.updateMessagesBadge(messagesData.data);
      }

      // Get unread notifications count
      const notificationsResponse = await fetch('/admin/api/notifications?unreadOnly=true');
      const notificationsData = await notificationsResponse.json();
      
      if (notificationsData.success) {
        this.updateNotificationsBadge(notificationsData.data);
      }

    } catch (error) {
      console.error('❌ Badge update failed:', error);
    }
  }

  // ===============================================
  // EVENT HANDLERS
  // ===============================================

  async handleMessageClick(messageId) {
    
    try {
      // Mark as read
      await fetch(`/admin/api/messages/${messageId}/read`, {
        method: 'POST'
      });

      // Navigate to message page
      window.location.href = `/admin/messages/${messageId}`;

    } catch (error) {
      console.error('❌ Message click handling failed:', error);
    }
  }

  async handleNotificationClick(notificationId) {
    
    try {
      // Mark as read
      await fetch(`/admin/api/notifications/${notificationId}/read`, {
        method: 'POST'
      });

      // Navigate based on notification type
      window.location.href = `/admin/notifications/${notificationId}`;

    } catch (error) {
      console.error('❌ Notification click handling failed:', error);
    }
  }

  // ===============================================
  // UTILITY METHODS
  // ===============================================

  formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  }

  getNotificationIcon(type) {
    const icons = {
      'user_registration': 'fa-user-plus',
      'support_message': 'fa-envelope',
      'system': 'fa-cog',
      'warning': 'fa-exclamation-triangle',
      'success': 'fa-check-circle',
      'info': 'fa-info-circle'
    };
    return icons[type] || 'fa-bell';
  }

  showToast(type, message) {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 1060;
      padding: 12px 16px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      font-size: 14px;
      transform: translateX(100%);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      max-width: 350px;
      background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    }, 100);
    
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      toast.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  // Cleanup method
  destroy() {
    if (this.badgeUpdateInterval) {
      clearInterval(this.badgeUpdateInterval);
    }
  }
}

// Initialize Admin Header Dropdown Fix after window load
window.addEventListener('load', () => {
  // Ensure DOM is fully loaded and parsed
  setTimeout(() => {
    if (!window.adminHeaderDropdownFix) {
      try {
        window.adminHeaderDropdownFix = new AdminHeaderDropdownFix();
        } catch (error) {
        console.error('❌ Failed to initialize Admin Header Dropdown Fix:', error);
        
        // Retry after additional delay
        setTimeout(() => {
          try {
            window.adminHeaderDropdownFix = new AdminHeaderDropdownFix();
           } catch (retryError) {
            console.error('❌ Failed to initialize Admin Header Dropdown Fix on retry:', retryError);
          }
        }, 2000);
      }
    }
  }, 500);
});

// Also try immediate initialization for already loaded pages
if (document.readyState === 'complete') {
  setTimeout(() => {
    if (!window.adminHeaderDropdownFix) {
      try {
        window.adminHeaderDropdownFix = new AdminHeaderDropdownFix();
       } catch (error) {
        console.error('❌ Failed immediate initialization:', error);
      }
    }
  }, 100);
}

