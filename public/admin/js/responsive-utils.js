/**
 * Responsive Utilities JavaScript - Mobile and Responsive Behavior
 * Handles responsive interactions, touch events, and device-specific optimizations
 */

(function() {
    'use strict';

    const ResponsiveUtils = {
        // Breakpoints (should match CSS)
        breakpoints: {
            mobile: 480,
            tablet: 768,
            desktop: 1024,
            large: 1200
        },

        // Current device state
        state: {
            width: window.innerWidth,
            height: window.innerHeight,
            device: 'desktop',
            orientation: 'landscape',
            isTouch: false,
            pixelRatio: window.devicePixelRatio || 1
        },

        // Event listeners storage
        listeners: new Map(),

        init() {
            this.detectDevice();
            this.detectTouch();
            this.bindEvents();
            this.optimizeForDevice();
            this.handleInitialLoad();
        },

        detectDevice() {
            const width = window.innerWidth;
            
            if (width <= this.breakpoints.mobile) {
                this.state.device = 'mobile';
            } else if (width <= this.breakpoints.tablet) {
                this.state.device = 'tablet';
            } else if (width <= this.breakpoints.desktop) {
                this.state.device = 'desktop';
            } else {
                this.state.device = 'large';
            }

            this.state.orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
            
            // Update body classes
            document.body.className = document.body.className.replace(/device-\w+/g, '');
            document.body.classList.add(`device-${this.state.device}`);
            document.body.classList.add(`orientation-${this.state.orientation}`);
        },

        detectTouch() {
            this.state.isTouch = 'ontouchstart' in window || 
                                navigator.maxTouchPoints > 0 || 
                                navigator.msMaxTouchPoints > 0;
            
            if (this.state.isTouch) {
                document.body.classList.add('touch-device');
            } else {
                document.body.classList.add('no-touch');
            }
        },

        bindEvents() {
            // Debounced resize handler
            const debouncedResize = this.debounce(() => this.handleResize(), 250);
            window.addEventListener('resize', debouncedResize);

            // Orientation change handler
            window.addEventListener('orientationchange', () => {
                setTimeout(() => this.handleOrientationChange(), 100);
            });

            // Touch event handlers for mobile optimization
            if (this.state.isTouch) {
                this.bindTouchEvents();
            }

            // Keyboard navigation for accessibility
            this.bindKeyboardEvents();

            // Focus management
            this.bindFocusEvents();
        },

        bindTouchEvents() {
            // Prevent zoom on double tap for form inputs
            let lastTouchEnd = 0;
            document.addEventListener('touchend', (e) => {
                const now = (new Date()).getTime();
                if (now - lastTouchEnd <= 300) {
                    e.preventDefault();
                }
                lastTouchEnd = now;
            }, false);

            // Improve touch scrolling
            document.addEventListener('touchstart', (e) => {
                if (e.touches.length > 1) {
                    e.preventDefault(); // Prevent pinch zoom
                }
            }, { passive: false });

            // Handle swipe gestures for sidebar
            this.bindSwipeGestures();
        },

        bindSwipeGestures() {
            let startX = 0;
            let startY = 0;
            let endX = 0;
            let endY = 0;

            document.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            }, { passive: true });

            document.addEventListener('touchend', (e) => {
                endX = e.changedTouches[0].clientX;
                endY = e.changedTouches[0].clientY;
                this.handleSwipe(startX, startY, endX, endY);
            }, { passive: true });
        },

        handleSwipe(startX, startY, endX, endY) {
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const minSwipeDistance = 50;

            // Only handle horizontal swipes
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
                if (this.state.device === 'mobile') {
                    const sidebar = document.getElementById('adminSidebar');
                    const isOpen = sidebar?.classList.contains('show');

                    if (deltaX > 0 && startX < 50 && !isOpen) {
                        // Swipe right from left edge - open sidebar
                        window.AdminLayout?.LayoutManager.toggleSidebar();
                    } else if (deltaX < 0 && isOpen) {
                        // Swipe left - close sidebar
                        window.AdminLayout?.LayoutManager.closeSidebar();
                    }
                }
            }
        },

        bindKeyboardEvents() {
            document.addEventListener('keydown', (e) => {
                // Handle keyboard shortcuts
                if (e.ctrlKey || e.metaKey) {
                    switch (e.key) {
                        case 'k':
                            e.preventDefault();
                            this.focusSearch();
                            break;
                        case 'b':
                            e.preventDefault();
                            window.AdminLayout?.LayoutManager.toggleSidebar();
                            break;
                        case 'd':
                            e.preventDefault();
                            window.AdminTheme?.toggleTheme();
                            break;
                    }
                }

                // Handle escape key
                if (e.key === 'Escape') {
                    this.handleEscape();
                }

                // Handle tab navigation
                if (e.key === 'Tab') {
                    this.handleTabNavigation(e);
                }
            });
        },

        bindFocusEvents() {
            // Improve focus visibility
            document.addEventListener('focusin', (e) => {
                if (e.target.matches('input, textarea, select, button, [tabindex]')) {
                    e.target.classList.add('keyboard-focused');
                }
            });

            document.addEventListener('focusout', (e) => {
                e.target.classList.remove('keyboard-focused');
            });

            // Handle focus trapping in modals
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    const modal = document.querySelector('.modal.show');
                    if (modal) {
                        this.trapFocus(e, modal);
                    }
                }
            });
        },

        handleResize() {
            const oldDevice = this.state.device;
            const oldWidth = this.state.width;
            
            this.state.width = window.innerWidth;
            this.state.height = window.innerHeight;
            
            this.detectDevice();
            
            if (oldDevice !== this.state.device) {
                this.optimizeForDevice();
                this.dispatchEvent('deviceChange', {
                    oldDevice,
                    newDevice: this.state.device,
                    width: this.state.width,
                    height: this.state.height
                });
            }

            // Handle table responsiveness
            this.handleTableResponsiveness();
            
            // Handle chart responsiveness
            this.handleChartResponsiveness();

            this.dispatchEvent('resize', {
                width: this.state.width,
                height: this.state.height,
                device: this.state.device,
                oldWidth
            });
        },

        handleOrientationChange() {
            this.detectDevice();
            
            // Fix viewport height on mobile
            if (this.state.device === 'mobile') {
                this.fixMobileViewport();
            }

            this.dispatchEvent('orientationChange', {
                orientation: this.state.orientation,
                device: this.state.device
            });
        },

        optimizeForDevice() {
            switch (this.state.device) {
                case 'mobile':
                    this.optimizeForMobile();
                    break;
                case 'tablet':
                    this.optimizeForTablet();
                    break;
                default:
                    this.optimizeForDesktop();
            }
        },

        optimizeForMobile() {
            // Prevent zoom on input focus
            const inputs = document.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                if (!input.style.fontSize) {
                    input.style.fontSize = '16px'; // Prevents zoom on iOS
                }
            });

            // Optimize touch targets
            this.optimizeTouchTargets();

            // Handle virtual keyboard
            this.handleVirtualKeyboard();
        },

        optimizeForTablet() {
            // Tablet-specific optimizations
            this.optimizeTouchTargets();
        },

        optimizeForDesktop() {
            // Desktop-specific optimizations
            this.enableHoverEffects();
        },

        optimizeTouchTargets() {
            const buttons = document.querySelectorAll('button, .btn, a[role="button"]');
            buttons.forEach(button => {
                const rect = button.getBoundingClientRect();
                if (rect.height < 44) { // Apple's recommended minimum touch target
                    button.style.minHeight = '44px';
                }
            });
        },

        handleVirtualKeyboard() {
            // Handle viewport changes when virtual keyboard appears
            let initialViewportHeight = window.innerHeight;

            window.addEventListener('resize', () => {
                const currentHeight = window.innerHeight;
                const heightDifference = initialViewportHeight - currentHeight;
                
                if (heightDifference > 150) { // Keyboard is likely open
                    document.body.classList.add('keyboard-open');
                } else {
                    document.body.classList.remove('keyboard-open');
                }
            });
        },

        enableHoverEffects() {
            document.body.classList.add('hover-enabled');
        },

        fixMobileViewport() {
            // Fix 100vh issues on mobile
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        },

        handleTableResponsiveness() {
            const tables = document.querySelectorAll('table:not(.table-responsive table)');
            tables.forEach(table => {
                if (this.state.device === 'mobile' || this.state.device === 'tablet') {
                    if (!table.parentElement.classList.contains('table-responsive')) {
                        const wrapper = document.createElement('div');
                        wrapper.className = 'table-responsive';
                        table.parentNode.insertBefore(wrapper, table);
                        wrapper.appendChild(table);
                    }
                }
            });
        },

        handleChartResponsiveness() {
            // Trigger chart resize if charts are present
            if (typeof Chart !== 'undefined') {
                Chart.helpers.each(Chart.instances, (instance) => {
                    instance.resize();
                });
            }

            // Trigger ApexCharts resize
            if (typeof ApexCharts !== 'undefined') {
                this.dispatchEvent('chartResize', { device: this.state.device });
            }
        },

        focusSearch() {
            const searchInput = document.querySelector('input[type="search"], .search-input, #search');
            if (searchInput) {
                searchInput.focus();
            }
        },

        handleEscape() {
            // Close any open modals, dropdowns, etc.
            const openModals = document.querySelectorAll('.modal.show');
            openModals.forEach(modal => {
                const closeBtn = modal.querySelector('.btn-close, [data-bs-dismiss="modal"]');
                if (closeBtn) closeBtn.click();
            });
        },

        handleTabNavigation(e) {
            // Improve tab navigation visibility
            document.body.classList.add('keyboard-navigation');
            
            // Remove class after mouse interaction
            const removeKeyboardClass = () => {
                document.body.classList.remove('keyboard-navigation');
                document.removeEventListener('mousedown', removeKeyboardClass);
            };
            document.addEventListener('mousedown', removeKeyboardClass);
        },

        trapFocus(e, container) {
            const focusableElements = container.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        },

        handleInitialLoad() {
            // Fix initial viewport on mobile
            if (this.state.device === 'mobile') {
                this.fixMobileViewport();
            }

            // Preload critical resources for current device
            this.preloadCriticalResources();
        },

        preloadCriticalResources() {
            // Preload device-specific resources
            if (this.state.device === 'mobile') {
                // Preload mobile-specific resources
            }
        },

        // Utility functions
        debounce(func, wait, immediate) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    timeout = null;
                    if (!immediate) func(...args);
                };
                const callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func(...args);
            };
        },

        throttle(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        dispatchEvent(eventName, detail) {
            const event = new CustomEvent(`admin:responsive:${eventName}`, {
                detail: {
                    ...detail,
                    state: { ...this.state },
                    timestamp: Date.now()
                },
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(event);
        },

        // Public API
        getState() {
            return { ...this.state };
        },

        isMobile() {
            return this.state.device === 'mobile';
        },

        isTablet() {
            return this.state.device === 'tablet';
        },

        isDesktop() {
            return this.state.device === 'desktop' || this.state.device === 'large';
        },

        isTouch() {
            return this.state.isTouch;
        },

        getBreakpoint() {
            return this.state.device;
        }
    };

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        ResponsiveUtils.init();
    });

    // Export to global scope
    window.AdminResponsive = ResponsiveUtils;

})();