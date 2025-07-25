/**
 * SLEX Global Theme & Language Handler
 * Universal theme and language management for all public pages
 * Works across login, dashboard, and all platform pages
 */

class GlobalThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('slex_theme') || this.getSystemTheme();
        this.currentLanguage = localStorage.getItem('slex_language') || this.getBrowserLanguage();
        this.supportedLanguages = this.getSupportedLanguages();
        
        this.init();
    }

    init() {
        this.applyTheme();
        this.applyLanguage();
        this.initializeThemeToggle();
        this.initializeLanguageSelector();
        this.bindGlobalEvents();
    }

    // Theme Management
    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    getBrowserLanguage() {
        const browserLang = navigator.language.split('-')[0];
        const supportedCodes = this.supportedLanguages.map(lang => lang.code);
        return supportedCodes.includes(browserLang) ? browserLang : 'uz';
    }

    getSupportedLanguages() {
        return [
            { code: 'uz', name: 'O\'zbekcha', nativeName: 'Uzbek', flag: '🇺🇿' },
            { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
            { code: 'ru', name: 'Русский', nativeName: 'Russian', flag: '🇷🇺' },
            { code: 'tr', name: 'Türkçe', nativeName: 'Turkish', flag: '🇹🇷' },
            { code: 'fa', name: 'فارسی', nativeName: 'Persian', flag: '🇮🇷' },
            { code: 'zh', name: '中文', nativeName: 'Chinese', flag: '🇨🇳' }
        ];
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        document.body.className = document.body.className.replace(/theme-\w+/g, '') + ` theme-${this.currentTheme}`;
        
        // Update all theme toggles on the page
        this.updateThemeToggles();
        
        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: this.currentTheme }
        }));
    }

    updateThemeToggles() {
        const toggles = document.querySelectorAll('[data-theme-toggle]');
        toggles.forEach(toggle => {
            const icon = toggle.querySelector('i');
            if (icon) {
                icon.className = this.currentTheme === 'light' ? 'las la-moon' : 'las la-sun';
            }
            
            // Update aria-label for accessibility
            toggle.setAttribute('aria-label', 
                this.currentTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
            );
        });
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('slex_theme', this.currentTheme);
        
        // Show feedback
        this.showToast(
            `Switched to ${this.currentTheme} mode`, 
            'success', 
            2000
        );
    }

    setTheme(theme) {
        if (['light', 'dark'].includes(theme)) {
            this.currentTheme = theme;
            this.applyTheme();
            localStorage.setItem('slex_theme', theme);
        }
    }

    // Language Management
    applyLanguage() {
        document.documentElement.setAttribute('lang', this.currentLanguage);
        document.body.setAttribute('data-language', this.currentLanguage);
        
        // Update all language selectors
        this.updateLanguageSelectors();
        
        // Set RTL for Persian
        if (this.currentLanguage === 'fa') {
            document.documentElement.setAttribute('dir', 'rtl');
        } else {
            document.documentElement.setAttribute('dir', 'ltr');
        }
        
        // Dispatch language change event
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: this.currentLanguage }
        }));
    }

    updateLanguageSelectors() {
        const selectors = document.querySelectorAll('[data-language-selector]');
        const currentLangData = this.supportedLanguages.find(lang => lang.code === this.currentLanguage);
        
        selectors.forEach(selector => {
            const trigger = selector.querySelector('[data-language-trigger]');
            if (trigger && currentLangData) {
                const flag = trigger.querySelector('.language-flag');
                const code = trigger.querySelector('.language-code');
                
                if (flag) flag.textContent = currentLangData.flag;
                if (code) code.textContent = currentLangData.code.toUpperCase();
            }
            
            // Update active states in dropdown
            const options = selector.querySelectorAll('[data-language-option]');
            options.forEach(option => {
                const langCode = option.getAttribute('data-language-option');
                option.classList.toggle('active', langCode === this.currentLanguage);
            });
        });
    }

    async changeLanguage(languageCode) {
        if (!this.supportedLanguages.find(lang => lang.code === languageCode)) {
            console.warn(`Unsupported language: ${languageCode}`);
            return false;
        }

        try {
            // Send language change request to server
            const response = await fetch('/api/language/change', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ language: languageCode }),
                credentials: 'same-origin'
            });

            if (response.ok) {
                this.currentLanguage = languageCode;
                this.applyLanguage();
                localStorage.setItem('slex_language', languageCode);
                
                // Show success message
                const langName = this.supportedLanguages.find(lang => lang.code === languageCode)?.name;
                this.showToast(`Language changed to ${langName}`, 'success', 2000);
                
                // Reload page to apply server-side translations
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
                
                return true;
            } else {
                throw new Error('Language change failed');
            }
        } catch (error) {
            console.error('Language change error:', error);
            this.showToast('Failed to change language. Please try again.', 'error');
            return false;
        }
    }

    // Theme Toggle Initialization
    initializeThemeToggle() {
        // Initialize all theme toggles
        const toggles = document.querySelectorAll('[data-theme-toggle]');
        toggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleTheme();
            });
        });

        // System theme change detection
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!localStorage.getItem('slex_theme')) {
                    this.currentTheme = e.matches ? 'dark' : 'light';
                    this.applyTheme();
                }
            });
        }
    }

    // Language Selector Initialization
    initializeLanguageSelector() {
        const selectors = document.querySelectorAll('[data-language-selector]');
        
        selectors.forEach(selector => {
            const trigger = selector.querySelector('[data-language-trigger]');
            const panel = selector.querySelector('[data-language-panel]');
            
            if (trigger && panel) {
                // Toggle dropdown
                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleLanguagePanel(panel);
                });
                
                // Handle option clicks
                const options = panel.querySelectorAll('[data-language-option]');
                options.forEach(option => {
                    option.addEventListener('click', (e) => {
                        e.preventDefault();
                        const languageCode = option.getAttribute('data-language-option');
                        this.changeLanguage(languageCode);
                        this.closeLanguagePanel(panel);
                    });
                });
            }
        });

        // Close panels when clicking outside
        document.addEventListener('click', () => {
            this.closeAllLanguagePanels();
        });
    }

    toggleLanguagePanel(panel) {
        const isOpen = panel.classList.contains('active');
        this.closeAllLanguagePanels();
        
        if (!isOpen) {
            panel.classList.add('active');
            panel.setAttribute('aria-expanded', 'true');
        }
    }

    closeLanguagePanel(panel) {
        panel.classList.remove('active');
        panel.setAttribute('aria-expanded', 'false');
    }

    closeAllLanguagePanels() {
        const panels = document.querySelectorAll('[data-language-panel]');
        panels.forEach(panel => this.closeLanguagePanel(panel));
    }

    // Global Event Bindings
    bindGlobalEvents() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + T for theme toggle
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggleTheme();
            }
            
            // Ctrl/Cmd + Shift + L for language panel
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
                e.preventDefault();
                const firstSelector = document.querySelector('[data-language-trigger]');
                if (firstSelector) {
                    firstSelector.click();
                }
            }
        });

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Reapply theme when page becomes visible (in case it changed in another tab)
                const savedTheme = localStorage.getItem('slex_theme');
                if (savedTheme && savedTheme !== this.currentTheme) {
                    this.currentTheme = savedTheme;
                    this.applyTheme();
                }
            }
        });

        // Custom event listeners for other scripts
        window.addEventListener('setTheme', (e) => {
            this.setTheme(e.detail.theme);
        });

        window.addEventListener('setLanguage', (e) => {
            this.changeLanguage(e.detail.language);
        });
    }

    // Toast Notification System
    showToast(message, type = 'info', duration = 3000) {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.global-toast');
        existingToasts.forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `global-toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="las ${this.getToastIcon(type)}"></i>
                <span class="toast-message">${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="las la-times"></i>
            </button>
        `;

        // Add styles if not already present
        this.ensureToastStyles();

        document.body.appendChild(toast);

        // Auto-remove after duration
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('toast-hiding');
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    }

    getToastIcon(type) {
        const icons = {
            success: 'la-check-circle',
            error: 'la-exclamation-triangle',
            warning: 'la-exclamation-triangle',
            info: 'la-info-circle'
        };
        return icons[type] || icons.info;
    }

    ensureToastStyles() {
        if (document.querySelector('#global-toast-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'global-toast-styles';
        styles.textContent = `
            .global-toast {
                position: fixed;
                top: 1rem;
                right: 1rem;
                background: var(--bg-secondary);
                border: 1px solid var(--border-primary);
                border-radius: var(--radius-lg);
                padding: 0.875rem 1rem;
                box-shadow: var(--shadow-lg);
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                max-width: 400px;
                min-width: 300px;
                font-family: var(--font-family);
                animation: toastSlideIn 0.3s ease-out;
            }
            
            .global-toast.toast-hiding {
                animation: toastSlideOut 0.3s ease-in;
            }
            
            .toast-success { border-left: 4px solid var(--success-500); }
            .toast-error { border-left: 4px solid var(--danger-500); }
            .toast-warning { border-left: 4px solid var(--warning-500); }
            .toast-info { border-left: 4px solid var(--info-500); }
            
            .toast-content {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                flex: 1;
                font-size: 0.875rem;
                font-weight: 500;
                color: var(--text-primary);
            }
            
            .toast-content i {
                font-size: 1rem;
                color: var(--text-secondary);
            }
            
            .toast-success .toast-content i { color: var(--success-600); }
            .toast-error .toast-content i { color: var(--danger-600); }
            .toast-warning .toast-content i { color: var(--warning-600); }
            .toast-info .toast-content i { color: var(--info-600); }
            
            .toast-close {
                background: none;
                border: none;
                color: var(--text-secondary);
                cursor: pointer;
                padding: 0.25rem;
                border-radius: var(--radius-sm);
                transition: var(--transition-fast);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .toast-close:hover {
                background: var(--bg-tertiary);
                color: var(--text-primary);
            }
            
            @keyframes toastSlideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes toastSlideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            @media (max-width: 640px) {
                .global-toast {
                    left: 1rem;
                    right: 1rem;
                    min-width: auto;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    // Public API
    getTheme() {
        return this.currentTheme;
    }

    getLanguage() {
        return this.currentLanguage;
    }

    getSupportedLanguagesList() {
        return this.supportedLanguages;
    }

    // Utility method to create theme/language controls HTML
    createThemeToggleHTML() {
        return `
            <button class="theme-toggle-btn" data-theme-toggle aria-label="Toggle theme">
                <i class="las ${this.currentTheme === 'light' ? 'la-moon' : 'la-sun'}"></i>
            </button>
        `;
    }

    createLanguageSelectorHTML() {
        const currentLangData = this.supportedLanguages.find(lang => lang.code === this.currentLanguage);
        
        return `
            <div class="language-selector" data-language-selector>
                <button class="language-trigger" data-language-trigger>
                    <span class="language-flag">${currentLangData?.flag || '🇺🇿'}</span>
                    <span class="language-code">${this.currentLanguage.toUpperCase()}</span>
                    <i class="las la-angle-down"></i>
                </button>
                <div class="language-panel" data-language-panel>
                    ${this.supportedLanguages.map(lang => `
                        <a href="#" class="language-option ${lang.code === this.currentLanguage ? 'active' : ''}" 
                           data-language-option="${lang.code}">
                            <span class="language-flag">${lang.flag}</span>
                            <div class="language-info">
                                <span class="language-name">${lang.name}</span>
                                <span class="language-native">${lang.nativeName}</span>
                            </div>
                            ${lang.code === this.currentLanguage ? '<i class="las la-check"></i>' : ''}
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

// Initialize global theme manager
document.addEventListener('DOMContentLoaded', () => {
    window.globalTheme = new GlobalThemeManager();
    
    // Make it globally accessible
    window.SLEX = window.SLEX || {};
    window.SLEX.theme = window.globalTheme;
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GlobalThemeManager };
}