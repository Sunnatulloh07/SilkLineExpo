/**
 * Universal Theme Manager for SLEX Platform
 * Handles consistent theme switching across all pages
 * Prevents conflicts between different theme managers
 */

(function() {
    'use strict';

    class UniversalThemeManager {
        constructor() {
            this.themeKeys = ['dashboard-theme', 'dashboard-theme', 'dashboard-theme'];
            this.initialized = false;
            this.init();
        }

        init() {
            if (this.initialized) return;
            
            // Sync all themes on load
            this.syncAllThemes();
            
            // Setup theme toggle listeners
            this.setupThemeToggle();
            
            // Listen for storage changes from other tabs
            this.setupStorageListener();
            
            this.initialized = true;
        }

        getCurrentTheme() {
            // Priority: slex_theme > theme > manufacturer-theme > default
            return localStorage.getItem('dashboard-theme') || 
                   localStorage.getItem('dashboard-theme') || 
                   localStorage.getItem('dashboard-theme') || 
                   'light';
        }

        setTheme(theme) {
            if (!['light', 'dark'].includes(theme)) {
                return;
            }


            // Update all localStorage keys
            this.themeKeys.forEach(key => {
                localStorage.setItem(key, theme);
            });

            // Apply to DOM immediately
            this.applyThemeToDOM(theme);

            // Update UI elements
            this.updateThemeUI(theme);

            // Dispatch events for other components
            this.dispatchThemeEvents(theme);
        }

        applyThemeToDOM(theme) {
            // Set data-theme attribute
            document.documentElement.setAttribute('data-theme', theme);
            
            // Add/remove theme classes for backwards compatibility
            document.body.classList.remove('theme-light', 'theme-dark');
            document.body.classList.add(`theme-${theme}`);

            // Force CSS recomputation by triggering a reflow
            document.documentElement.offsetHeight;
            
            // Theme applied to DOM
        }

        updateThemeUI(theme) {
            // Update all theme toggle buttons
            const themeToggles = document.querySelectorAll('#themeToggle, [data-theme-toggle]');
            themeToggles.forEach(toggle => {
                const icon = toggle.querySelector('i, .theme-icon');
                if (icon) {
                    // Remove old classes
                    icon.classList.remove('fa-moon', 'fa-sun', 'fas', 'far', 'theme-icon');
                    
                    // Add new classes
                    icon.className = theme === 'light' ? 'fas fa-moon theme-icon' : 'fas fa-sun theme-icon';
                }

                // Update aria-label
                toggle.setAttribute('aria-label', 
                    theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
                );
            });

            // Update theme radio buttons in settings
            const themeRadios = document.querySelectorAll('input[name="dashboard-theme"]');
            themeRadios.forEach(radio => {
                radio.checked = radio.value === theme;
            });

            // UI updated for theme
        }

        toggleTheme() {
            const currentTheme = this.getCurrentTheme();
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            this.setTheme(newTheme);
        }

        syncAllThemes() {
            const currentTheme = this.getCurrentTheme();
         
            // Ensure all keys have the same value
            this.themeKeys.forEach(key => {
                localStorage.setItem(key, currentTheme);
            });

            // Apply to DOM
            this.applyThemeToDOM(currentTheme);
            this.updateThemeUI(currentTheme);
        }

        setupThemeToggle() {
            // Remove all existing theme toggle listeners to prevent conflicts
            const themeToggles = document.querySelectorAll('#themeToggle, [data-theme-toggle]');
            
            themeToggles.forEach(toggle => {
                // Clone node to remove all event listeners
                const newToggle = toggle.cloneNode(true);
                toggle.parentNode.replaceChild(newToggle, toggle);
                
                // Add our universal event listener
                newToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleTheme();
                });
            });
 }

        setupStorageListener() {
            window.addEventListener('storage', (e) => {
                if (this.themeKeys.includes(e.key)) {
                   this.syncAllThemes();
                }
            });
        }

        dispatchThemeEvents(theme) {
            // Dispatch multiple event types for compatibility
            const events = [
                new CustomEvent('themeChanged', { detail: { theme } }),
                new CustomEvent('themeChanged', { detail: theme }), // Legacy format
                new CustomEvent('universalThemeChanged', { detail: { theme, timestamp: Date.now() } })
            ];

            events.forEach(event => {
                window.dispatchEvent(event);
            });
        }

        // Public API methods
        getTheme() {
            return this.getCurrentTheme();
        }

        setLightTheme() {
            this.setTheme('light');
        }

        setDarkTheme() {
            this.setTheme('dark');
        }

        isLight() {
            return this.getCurrentTheme() === 'light';
        }

        isDark() {
            return this.getCurrentTheme() === 'dark';
        }
    }

    // Initialize immediately
    const manager = new UniversalThemeManager();

    // Make globally accessible
    window.UniversalTheme = manager;
    window.universalTheme = manager; // Alias

    // Override global toggleTheme function
    window.toggleTheme = () => manager.toggleTheme();

    // Debug methods
    window.ThemeDebug = window.ThemeDebug || {};
    window.ThemeDebug.universal = {
        getTheme: () => manager.getTheme(),
        setTheme: (theme) => manager.setTheme(theme),
        syncThemes: () => manager.syncAllThemes(),
        toggle: () => manager.toggleTheme(),
        status: () => ({
            current: manager.getCurrentTheme(),
            localStorage: {
                slex_theme: localStorage.getItem('dashboard-theme'),
                theme: localStorage.getItem('dashboard-theme'),
                manufacturer_theme: localStorage.getItem('dashboard-theme')
            },
            dom: document.documentElement.getAttribute('data-theme')
        })
    };

  

})();

