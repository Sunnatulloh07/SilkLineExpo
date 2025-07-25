/**
 * Header functionality for SLEX Admin Dashboard
 * All header button functions with proper scope handling
 */

// Global header functions
window.initializeHeaderFunctions = function(dashboardInstance) {
    const self = dashboardInstance;
    
    // Theme Toggle
    window.toggleTheme = function() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update theme icon
        const themeIcons = document.querySelectorAll('.theme-toggle-icon');
        themeIcons.forEach(icon => {
            if (newTheme === 'light') {
                icon.className = 'las la-sun theme-toggle-icon';
            } else {
                icon.className = 'las la-moon theme-toggle-icon';
            }
        });
        
        const displayMode = newTheme === 'light' ? 'tungi' : 'kunduzgi';
        if (self && self.showToast) {
            self.showToast(`${displayMode} rejimga o'tkazildi`, 'success');
        }
    };
    
    // Language Menu
    window.toggleLanguageMenu = function() {
        if (self && self.closeAllDropdowns) {
            self.closeAllDropdowns('languageDropdown');
        }
        
        const dropdown = document.getElementById('languageDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    };
    
    // User Menu
    window.toggleUserMenu = function() {
        if (self && self.closeAllDropdowns) {
            self.closeAllDropdowns('userDropdown');
        }
        
        const dropdown = document.getElementById('userDropdown');
        const userMenu = document.querySelector('.user-menu');
        if (dropdown && userMenu) {
            dropdown.classList.toggle('show');
            userMenu.classList.toggle('active');
        }
    };
    
    // Notifications
    window.toggleNotifications = function() {
        if (self && self.closeAllDropdowns) {
            self.closeAllDropdowns('notificationDropdown');
        }
        
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
            if (dropdown.classList.contains('show') && !dropdown.hasAttribute('data-loaded')) {
                if (self && self.loadNotifications) {
                    self.loadNotifications();
                }
                dropdown.setAttribute('data-loaded', 'true');
            }
        }
    };
    
    // Messages
    window.toggleMessages = function() {
        if (self && self.closeAllDropdowns) {
            self.closeAllDropdowns('messagesDropdown');
        }
        
        const dropdown = document.getElementById('messagesDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
            if (dropdown.classList.contains('show') && !dropdown.hasAttribute('data-loaded')) {
                if (self && self.loadMessages) {
                    self.loadMessages();
                }
                dropdown.setAttribute('data-loaded', 'true');
            }
        }
    };
    
    // Mark all notifications as read
    window.markAllRead = function() {
        document.querySelectorAll('.notification-item.unread').forEach(item => {
            item.classList.remove('unread');
        });
        if (self && self.showToast) {
            self.showToast('Barcha bildirishnomalar o\'qilgan deb belgilandi', 'success');
        }
    };
    
    // Compose message
    window.composeMessage = function() {
        if (self && self.showToast) {
            self.showToast('Xabar yozish oynasi ochilmoqda...', 'info');
        }
    };
    
    // User dropdown actions
    window.viewProfile = function() {
        if (self && self.showToast) {
            self.showToast('Profil sahifasiga o\'tilmoqda...', 'info');
        }
        setTimeout(() => {
            window.location.href = '/admin/profile';
        }, 500);
    };
    
    window.accountSettings = function() {
        if (self && self.showToast) {
            self.showToast('Hisob sozlamalari ochilmoqda...', 'info');
        }
        setTimeout(() => {
            window.location.href = '/admin/settings';
        }, 500);
    };
    
    window.securitySettings = function() {
        if (self && self.showToast) {
            self.showToast('Xavfsizlik sozlamalari ochilmoqda...', 'info');
        }
        setTimeout(() => {
            window.location.href = '/admin/security';
        }, 500);
    };
    
    window.signOut = function() {
        if (confirm('Haqiqatan ham tizimdan chiqmoqchimisiz?')) {
            if (self && self.showToast) {
                self.showToast('Tizimdan chiqilmoqda...', 'info');
            }
            setTimeout(() => {
                window.location.href = '/auth/logout';
            }, 1000);
        }
    };
};