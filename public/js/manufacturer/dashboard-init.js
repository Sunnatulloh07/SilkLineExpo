/**
 * Manufacturer Dashboard Initialization
 * Handles theme, language, and core functionality
 */

(function() {
    'use strict';
    
    // Theme Management
    function initTheme() {
        const savedTheme = localStorage.getItem('dashboard-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Update theme icon
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
            
            // Theme toggle handler
            themeToggle.addEventListener('click', function() {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('dashboard-theme', newTheme);
                
                // Update icon
                const icon = this.querySelector('i');
                if (icon) {
                    icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
                }
                
                // Dispatch event
                window.dispatchEvent(new CustomEvent('themeChanged', { detail: newTheme }));
            });
        }
    }
    
    // Language Management
    function initLanguage() {
        // Get current language from cookie
        const cookies = document.cookie.split(';');
        let currentLang = 'uz';
        
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'i18next') {
                currentLang = value;
                break;
            }
        }
        
        // Language toggle handler
        const languageToggle = document.getElementById('languageToggle');
        const languageMenu = document.getElementById('languageMenu');
        
        if (languageToggle && languageMenu) {
            languageToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                languageMenu.classList.toggle('hidden');
            });
            
            // Language option handlers
            const languageOptions = document.querySelectorAll('.language-option');
            languageOptions.forEach(option => {
                option.addEventListener('click', function() {
                    const lang = this.dataset.lang;
                    
                    // Set cookie
                    document.cookie = `i18next=${lang};path=/;max-age=31536000`;
                    
                    // Reload page to apply language
                    window.location.reload();
                });
            });
        }
    }
    
    // Dropdown Management
    function initDropdowns() {
        // Close dropdowns on outside click
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.header-dropdown') && 
                !e.target.closest('.header-user-dropdown') &&
                !e.target.closest('.language-selector-wrapper')) {
                
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.classList.add('hidden');
                });
            }
        });
        
        // User profile dropdown
        const userProfileToggle = document.getElementById('userProfileToggle');
        const profileDropdown = document.getElementById('profileDropdown');
        
        if (userProfileToggle && profileDropdown) {
            userProfileToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                profileDropdown.classList.toggle('hidden');
            });
        }
        
        // Alerts dropdown
        const alertsBtn = document.getElementById('alertsBtn');
        const alertsDropdown = document.getElementById('alertsDropdown');
        
        if (alertsBtn && alertsDropdown) {
            alertsBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                alertsDropdown.classList.toggle('hidden');
            });
        }
        
        // Notifications dropdown
        const notificationsBtn = document.getElementById('notificationsBtn');
        const notificationsDropdown = document.getElementById('notificationsDropdown');
        
        if (notificationsBtn && notificationsDropdown) {
            notificationsBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                notificationsDropdown.classList.toggle('hidden');
            });
        }
        
        // Messages dropdown (MISSING - FIXED!)
        const messagesBtn = document.getElementById('messagesBtn');
        const messagesDropdown = document.getElementById('messagesDropdown');
        
        if (messagesBtn && messagesDropdown) {
            messagesBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                messagesDropdown.classList.toggle('hidden');
            });
        }
    }
    
    // Sidebar Toggle
    function initSidebar() {
        const sidebar = document.querySelector('.admin-sidebar');
        const main = document.querySelector('.admin-main');
        const sidebarToggle = document.getElementById('sidebarToggle');
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        
        // Desktop sidebar toggle
        if (sidebarToggle && sidebar && main) {
            // Restore saved state
            const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
            if (isCollapsed) {
                sidebar.classList.add('collapsed');
                main.classList.add('sidebar-collapsed');
            }
            
            sidebarToggle.addEventListener('click', function() {
                sidebar.classList.toggle('collapsed');
                main.classList.toggle('sidebar-collapsed');
                
                // Save state
                const collapsed = sidebar.classList.contains('collapsed');
                localStorage.setItem('sidebarCollapsed', collapsed);
            });
        }
        
        // Mobile menu toggle
        if (mobileMenuToggle && sidebar) {
            mobileMenuToggle.addEventListener('click', function() {
                sidebar.classList.toggle('open');
                
                // Create overlay if not exists
                let overlay = document.querySelector('.sidebar-overlay');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.className = 'sidebar-overlay';
                    document.body.appendChild(overlay);
                }
                
                overlay.classList.toggle('active');
                
                // Close on overlay click
                overlay.addEventListener('click', function() {
                    sidebar.classList.remove('open');
                    overlay.classList.remove('active');
                });
            });
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        initTheme();
        initLanguage();
        initDropdowns();
        initSidebar();
    }
    
})();