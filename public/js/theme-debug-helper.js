/*
Theme Debug Helper
Fixes localStorage theme conflicts and provides debug tools
Senior Software Engineer Clean Code Implementation
*/

(function() {
    'use strict';

    class ThemeDebugHelper {
        constructor() {
            this.init();
        }

        init() {
            this.detectThemeConflicts();
            this.addDebugMethods();
            this.fixThemeLogic();
        }

        detectThemeConflicts() {
            const themeKeys = ['dashboard-theme', 'dashboard-theme'];
            const themes = {};
            
            themeKeys.forEach(key => {
                themes[key] = localStorage.getItem(key);
            });

            // Check for conflicts
            if (themes.theme && themes.slex_theme && themes.theme !== themes.slex_theme) {
                // Fix: Use the most recent or preferred theme
                this.resolveThemeConflict(themes);
            }
        }

        resolveThemeConflict(themes) {
            // Priority: slex_theme > theme
            const preferredTheme = themes.slex_theme || themes.theme || 'light';
            
            // Sync both keys
            localStorage.setItem('dashboard-theme', preferredTheme);
            localStorage.setItem('dashboard-theme', preferredTheme);
            
            // Apply immediately
            document.documentElement.setAttribute('data-theme', preferredTheme);
        }

        fixThemeLogic() {
            // Fix inverted theme logic if exists
            const currentTheme = this.getCurrentTheme();
            const htmlTheme = document.documentElement.getAttribute('data-theme');
            
            if (htmlTheme !== currentTheme) {
                document.documentElement.setAttribute('data-theme', currentTheme);
            }

            // Listen for theme changes and keep in sync
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = function(key, value) {
                originalSetItem.call(this, key, value);
                
                if (key === 'dashboard-theme' || key === 'dashboard-theme') {
                    // Sync both keys
                    originalSetItem.call(this, 'dashboard-theme', value);
                    originalSetItem.call(this, 'dashboard-theme', value);
                    
                    // Apply to DOM
                    document.documentElement.setAttribute('data-theme', value);
                    
                }
            };
        }

        getCurrentTheme() {
            return localStorage.getItem('dashboard-theme') || 
                   localStorage.getItem('dashboard-theme') || 
                   'light';
        }

        addDebugMethods() {
            // Add global debug methods
            window.ThemeDebug = {
                // Clear all theme data
                clearThemes: () => {
                    localStorage.removeItem('dashboard-theme');
                    localStorage.removeItem('dashboard-theme');
                    document.documentElement.removeAttribute('data-theme');
                    window.location.reload();
                },

                // Set theme safely
                setTheme: (theme) => {
                    if (!['light', 'dark'].includes(theme)) {
                        console.error('❌ Invalid theme. Use "light" or "dark"');
                        return;
                    }
                    
                    localStorage.setItem('dashboard-theme', theme);
                    localStorage.setItem('dashboard-theme', theme);
                    document.documentElement.setAttribute('data-theme', theme);
                },

                // Get current theme info
                getThemeInfo: () => {
                    const info = {
                        localStorage_theme: localStorage.getItem('dashboard-theme'),
                        localStorage_slex_theme: localStorage.getItem('dashboard-theme'),
                        html_data_theme: document.documentElement.getAttribute('data-theme'),
                        body_classes: document.body.className,
                        current_theme: this.getCurrentTheme()
                    };
                    return info;
                },

                // Fix theme conflicts
                fixConflicts: () => {
                    this.detectThemeConflicts();
                },

                // Test theme switching
                testThemes: () => {
                    
                    setTimeout(() => {
                        window.ThemeDebug.setTheme('dark');
                    }, 1000);
                    
                    setTimeout(() => {
                        window.ThemeDebug.setTheme('light');
                    }, 3000);
                }
            };
        }
    }

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        new ThemeDebugHelper();
    });

    // Initialize immediately if DOM is already ready
    if (document.readyState === 'loading') {
        // Wait for DOM
    } else {
        new ThemeDebugHelper();
    }

})(); 