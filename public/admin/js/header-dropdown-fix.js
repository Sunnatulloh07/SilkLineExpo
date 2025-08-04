/**
 * UNIFIED ADMIN HEADER DROPDOWN MANAGEMENT
 * Professional solution for all header dropdown functionality
 * Senior Software Engineer implementation
 */

class UnifiedHeaderDropdowns {
  constructor() {
    this.dropdowns = new Map();
    this.activeDropdown = null;
    this.isInitialized = false;
    
    this.init();
  }
  
  init() {
    if (this.isInitialized) {
      console.log('🔄 Header dropdowns already initialized');
      return;
    }
    
    console.log('🚀 Initializing unified header dropdowns...');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }
  
  setup() {
    this.registerDropdowns();
    this.setupEventListeners();
    this.setupGlobalClickHandler();
    this.isInitialized = true;
    
    console.log('✅ Unified header dropdowns initialized successfully');
  }
  
  registerDropdowns() {
    // Register all header dropdowns
    const dropdownConfigs = [
      {
        id: 'notifications',
        buttonId: 'notificationBtn',
        dropdownId: 'notificationDropdown',
        loadDataCallback: () => this.loadNotifications()
      },
      {
        id: 'messages',
        buttonId: 'messagesBtn', 
        dropdownId: 'messagesDropdown',
        loadDataCallback: () => this.loadMessages()
      },
      {
        id: 'user',
        buttonId: 'userMenuBtn',
        dropdownId: 'userDropdown',
        loadDataCallback: null // Static content
      },
      {
        id: 'language',
        buttonId: 'languageSelector',
        dropdownId: 'languageDropdown', 
        loadDataCallback: null // Static content
      }
    ];
    
    dropdownConfigs.forEach(config => {
      const button = document.getElementById(config.buttonId);
      const dropdown = document.getElementById(config.dropdownId);
      
      if (button && dropdown) {
        this.dropdowns.set(config.id, {
          ...config,
          button,
          dropdown,
          isOpen: false
        });
        console.log(`✅ Registered dropdown: ${config.id}`);
      } else {
        console.warn(`⚠️ Dropdown elements not found: ${config.id}`, {
          button: !!button,
          dropdown: !!dropdown
        });
      }
    });
  }
  
  setupEventListeners() {
    this.dropdowns.forEach((config, id) => {
      // Remove any existing listeners by cloning the button
      const newButton = config.button.cloneNode(true);
      config.button.parentNode.replaceChild(newButton, config.button);
      config.button = newButton; // Update reference
      
      // Add unified click handler
      config.button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log(`🔔 Dropdown clicked: ${id}`);
        this.toggleDropdown(id);
      });
    });
  }
  
  setupGlobalClickHandler() {
    // Close all dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (this.activeDropdown && !this.isClickInsideDropdown(e)) {
        this.closeAll();
      }
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeDropdown) {
        this.closeAll();
      }
    });
  }
  
  toggleDropdown(id) {
    const config = this.dropdowns.get(id);
    if (!config) {
      console.warn(`⚠️ Dropdown not found: ${id}`);
      return;
    }
    
    const wasOpen = config.isOpen;
    
    // Close all other dropdowns first
    this.closeAll();
    
    if (!wasOpen) {
      this.openDropdown(id);
    }
  }
  
  openDropdown(id) {
    const config = this.dropdowns.get(id);
    if (!config) return;
    
    console.log(`📖 Opening dropdown: ${id}`);
    
    // Update state
    config.isOpen = true;
    this.activeDropdown = id;
    
    // Apply visual changes
    config.dropdown.classList.remove('hidden');
    config.dropdown.style.cssText = `
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
    
    // Load data if callback exists
    if (config.loadDataCallback) {
      config.loadDataCallback();
    }
    
    // Add active state to button
    config.button.classList.add('active');
  }
  
  closeDropdown(id) {
    const config = this.dropdowns.get(id);
    if (!config) return;
    
    console.log(`📕 Closing dropdown: ${id}`);
    
    // Update state
    config.isOpen = false;
    if (this.activeDropdown === id) {
      this.activeDropdown = null;
    }
    
    // Apply visual changes
    config.dropdown.classList.add('hidden');
    config.dropdown.style.cssText = `
      visibility: hidden !important;
      opacity: 0 !important;
      transform: translateY(-10px) !important;
      pointer-events: none !important;
      display: none !important;
    `;
    
    // Remove active state from button
    config.button.classList.remove('active');
  }
  
  closeAll() {
    this.dropdowns.forEach((config, id) => {
      if (config.isOpen) {
        this.closeDropdown(id);
      }
    });
  }
  
  isClickInsideDropdown(event) {
    for (const [id, config] of this.dropdowns) {
      if (config.dropdown.contains(event.target) || config.button.contains(event.target)) {
        return true;
      }
    }
    return false;
  }
  
  // ===============================================
  // DATA LOADING METHODS
  // ===============================================
  
  async loadNotifications() {
    const container = document.getElementById('notificationsContainer');
    if (!container) {
      console.warn('⚠️ Notifications container not found');
      return;
    }
    
    try {
      console.log('🔔 Loading notifications...');
      
      // Show loading state
      container.innerHTML = `
        <div class="notifications-loading">
          <div class="loading-spinner"></div>
          <span>Bildirishnomalar yuklanmoqda...</span>
        </div>
      `;
      
      const response = await fetch('/admin/api/notifications?limit=10', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        console.log(`✅ Loaded ${result.data.length} notifications`);
        this.renderNotifications(result.data, container);
      } else {
        throw new Error(result.message || 'Failed to load notifications');
      }
      
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
      this.renderNotificationError(container, error.message);
    }
  }
  
  renderNotifications(notifications, container) {
    if (!notifications || notifications.length === 0) {
      container.innerHTML = `
        <div class="no-notifications">
          <i class="fas fa-bell-slash"></i>
          <p>Bildirishnomalar yo'q</p>
        </div>
      `;
      return;
    }
    
    const notificationHTML = notifications.map(notification => `
      <div class="notification-item ${!notification.readAt ? 'unread' : ''}" 
           data-notification-id="${notification._id}"
           data-notification-type="${notification.type || 'general'}">
        <div class="notification-icon">
          <i class="fas ${this.getNotificationIcon(notification.type)}"></i>
        </div>
        <div class="notification-content">
          <h4 class="notification-title">${this.escapeHtml(notification.title || 'Bildirishnoma')}</h4>
          <p class="notification-message">${this.escapeHtml(notification.message || '')}</p>
          <span class="notification-time">${this.formatRelativeTime(notification.createdAt)}</span>
        </div>
        ${!notification.readAt ? '<div class="unread-indicator"></div>' : ''}
      </div>
    `).join('');
    
    container.innerHTML = notificationHTML;
    
    // Attach click handlers to notifications
    container.querySelectorAll('.notification-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const notificationId = item.dataset.notificationId;
        const notificationType = item.dataset.notificationType;
        this.handleNotificationClick(notificationId, notificationType);
      });
    });
  }
  
  renderNotificationError(container, errorMessage) {
    container.innerHTML = `
      <div class="notification-error">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Xatolik yuz berdi: ${this.escapeHtml(errorMessage)}</p>
        <button class="btn-sm btn-outline" onclick="window.unifiedDropdowns?.loadNotifications()">
          Qayta yuklash
        </button>
      </div>
    `;
  }
  
  async loadMessages() {
    console.log('💬 Loading messages...');
    // Implement messages loading logic here
    // Similar to loadNotifications but for messages API
  }
  
  // ===============================================
  // UTILITY METHODS
  // ===============================================
  
  getNotificationIcon(type) {
    const iconMap = {
      'user_registration': 'fa-user-plus',
      'support_message': 'fa-envelope',
      'order_placed': 'fa-shopping-cart',
      'payment_received': 'fa-credit-card',
      'system_alert': 'fa-cog',
      'maintenance': 'fa-tools',
      'security': 'fa-shield-alt',
      'info': 'fa-info-circle',
      'warning': 'fa-exclamation-triangle',
      'success': 'fa-check-circle',
      'error': 'fa-times-circle'
    };
    return iconMap[type] || 'fa-bell';
  }
  
  formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} soniya oldin`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} daqiqa oldin`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} soat oldin`;
    return `${Math.floor(diffInSeconds / 86400)} kun oldin`;
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  handleNotificationClick(notificationId, notificationType) {
    console.log(`🔔 Notification clicked: ${notificationId}, type: ${notificationType}`);
    
    // Mark as read
    this.markNotificationAsRead(notificationId);
    
    // Handle different notification types
    switch (notificationType) {
      case 'user_registration':
        window.location.href = '/admin/users/pending-approvals';
        break;
      case 'order_placed':
        window.location.href = '/admin/orders';
        break;
      case 'payment_received':
        window.location.href = '/admin/orders';
        break;
      case 'support_message':
        window.location.href = '/admin/messages';
        break;
      case 'system_alert':
      case 'maintenance':
      case 'security':
        window.location.href = '/admin/system/logs';
        break;
      default:
        console.log('Unknown notification type:', notificationType);
    }
  }
  
  async markNotificationAsRead(notificationId) {
    try {
      await fetch(`/admin/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin'
      });
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  }
}

// Initialize when DOM is ready
let unifiedDropdowns;

function initializeUnifiedDropdowns() {
  if (typeof window !== 'undefined') {
    unifiedDropdowns = new UnifiedHeaderDropdowns();
    window.unifiedDropdowns = unifiedDropdowns; // Global access for debugging
  }
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeUnifiedDropdowns);
} else {
  initializeUnifiedDropdowns();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UnifiedHeaderDropdowns;
}