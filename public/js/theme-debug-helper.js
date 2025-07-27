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
            const themeKeys = ['theme', 'slex_theme'];
            const themes = {};
            
            themeKeys.forEach(key => {
                themes[key] = localStorage.getItem(key);
            });

            console.log('🎨 Theme Debug - Current localStorage:', themes);

            // Check for conflicts
            if (themes.theme && themes.slex_theme && themes.theme !== themes.slex_theme) {
                console.warn('⚠️ Theme Conflict Detected!', {
                    theme: themes.theme,
                    slex_theme: themes.slex_theme
                });

                // Fix: Use the most recent or preferred theme
                this.resolveThemeConflict(themes);
            }
        }

        resolveThemeConflict(themes) {
            // Priority: slex_theme > theme
            const preferredTheme = themes.slex_theme || themes.theme || 'light';
            
            console.log(`🔧 Fixing theme conflict, using: ${preferredTheme}`);
            
            // Sync both keys
            localStorage.setItem('theme', preferredTheme);
            localStorage.setItem('slex_theme', preferredTheme);
            
            // Apply immediately
            document.documentElement.setAttribute('data-theme', preferredTheme);
        }

        fixThemeLogic() {
            // Fix inverted theme logic if exists
            const currentTheme = this.getCurrentTheme();
            const htmlTheme = document.documentElement.getAttribute('data-theme');
            
            if (htmlTheme !== currentTheme) {
                console.log(`🔄 Syncing theme: ${currentTheme} -> ${htmlTheme}`);
                document.documentElement.setAttribute('data-theme', currentTheme);
            }

            // Listen for theme changes and keep in sync
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = function(key, value) {
                originalSetItem.call(this, key, value);
                
                if (key === 'theme' || key === 'slex_theme') {
                    // Sync both keys
                    originalSetItem.call(this, 'theme', value);
                    originalSetItem.call(this, 'slex_theme', value);
                    
                    // Apply to DOM
                    document.documentElement.setAttribute('data-theme', value);
                    
                    console.log(`🎨 Theme changed to: ${value}`);
                }
            };
        }

        getCurrentTheme() {
            return localStorage.getItem('slex_theme') || 
                   localStorage.getItem('theme') || 
                   'light';
        }

        addDebugMethods() {
            // Add global debug methods
            window.ThemeDebug = {
                // Clear all theme data
                clearThemes: () => {
                    localStorage.removeItem('theme');
                    localStorage.removeItem('slex_theme');
                    document.documentElement.removeAttribute('data-theme');
                    console.log('🧹 All theme data cleared');
                    window.location.reload();
                },

                // Set theme safely
                setTheme: (theme) => {
                    if (!['light', 'dark'].includes(theme)) {
                        console.error('❌ Invalid theme. Use "light" or "dark"');
                        return;
                    }
                    
                    localStorage.setItem('theme', theme);
                    localStorage.setItem('slex_theme', theme);
                    document.documentElement.setAttribute('data-theme', theme);
                    console.log(`✅ Theme set to: ${theme}`);
                },

                // Get current theme info
                getThemeInfo: () => {
                    const info = {
                        localStorage_theme: localStorage.getItem('theme'),
                        localStorage_slex_theme: localStorage.getItem('slex_theme'),
                        html_data_theme: document.documentElement.getAttribute('data-theme'),
                        body_classes: document.body.className,
                        current_theme: this.getCurrentTheme()
                    };
                    console.table(info);
                    return info;
                },

                // Fix theme conflicts
                fixConflicts: () => {
                    this.detectThemeConflicts();
                    console.log('🔧 Theme conflicts fixed');
                },

                // Test theme switching
                testThemes: () => {
                    console.log('🧪 Testing theme switching...');
                    
                    setTimeout(() => {
                        window.ThemeDebug.setTheme('dark');
                        console.log('🌙 Set to dark');
                    }, 1000);
                    
                    setTimeout(() => {
                        window.ThemeDebug.setTheme('light');
                        console.log('☀️ Set to light');
                    }, 3000);
                }
            };

            // Show help message
            console.log(`
🎨 Theme Debug Helper Loaded!

Available commands:
- ThemeDebug.clearThemes()     // Clear all theme data
- ThemeDebug.setTheme('dark')  // Set theme safely
- ThemeDebug.getThemeInfo()    // Get current theme info
- ThemeDebug.fixConflicts()    // Fix theme conflicts
- ThemeDebug.testThemes()      // Test theme switching
            `);
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