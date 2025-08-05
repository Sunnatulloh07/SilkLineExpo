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
    
    // Sidebar Toggle - UNIFIED SYSTEM
    function initSidebar() {
        const sidebar = document.querySelector('.admin-sidebar');
        const main = document.querySelector('.admin-main');
        const adminHeader = document.querySelector('.admin-header');
        const sidebarToggle = document.getElementById('sidebarToggle');
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        
        // Constants
        const SIDEBAR_WIDTH = '280px';
        const SIDEBAR_COLLAPSED_WIDTH = '64px';
        
        // Restore saved state on page load
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
        
        // Desktop sidebar toggle
        if (sidebarToggle && sidebar && main) {
            console.log('🔧 Setting up sidebar toggle button');
            
            sidebarToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('🖱️ Sidebar toggle clicked');
                
                const wasCollapsed = sidebar.classList.contains('collapsed');
                console.log('📊 Current state - wasCollapsed:', wasCollapsed);
                
                // Toggle classes
                sidebar.classList.toggle('collapsed');
                main.classList.toggle('sidebar-collapsed');
                
                console.log('📊 After toggle - sidebar.classList:', sidebar.classList.toString());
                console.log('📊 After toggle - main.classList:', main.classList.toString());
                
                // Update header position using classes (CSS has !important rules)
                if (adminHeader) {
                    if (wasCollapsed) {
                        // Expanding
                        adminHeader.classList.remove('sidebar-collapsed');
                        console.log('📊 Header expanded - removed sidebar-collapsed class');
                    } else {
                        // Collapsing
                        adminHeader.classList.add('sidebar-collapsed');
                        console.log('📊 Header collapsed - added sidebar-collapsed class');
                    }
                }
                
                // Save state
                const collapsed = sidebar.classList.contains('collapsed');
                localStorage.setItem('sidebarCollapsed', collapsed);
                
                // Dispatch custom event for other scripts
                window.dispatchEvent(new CustomEvent('sidebarToggled', { 
                    detail: { collapsed: collapsed } 
                }));
                
                console.log('✅ Sidebar toggled:', collapsed ? 'collapsed' : 'expanded');
            });
        } else {
            console.log('❌ Sidebar toggle setup failed:');
            console.log('  - sidebarToggle:', !!sidebarToggle);
            console.log('  - sidebar:', !!sidebar);
            console.log('  - main:', !!main);
        }
        
        // Mobile menu toggle
        if (mobileMenuToggle && sidebar) {
            mobileMenuToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                sidebar.classList.toggle('open');
                main.classList.toggle('sidebar-open');
                
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
                    main.classList.remove('sidebar-open');
                    overlay.classList.remove('active');
                });
            });
        }
        
        // Mark as initialized to prevent conflicts
        window.sidebarInitialized = true;
    }
    
    // Global function to sync sidebar state across pages
    window.syncSidebarState = function() {
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
    };
    
    function init() {
        initTheme();
        initLanguage();
        initDropdowns();
        initSidebar();
        
        // Mark sidebar as initialized to prevent conflicts
        window.sidebarInitialized = true;
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Sync state when page becomes visible (for navigation between pages)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            setTimeout(window.syncSidebarState, 100);
        }
    });
    
})();