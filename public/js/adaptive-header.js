/**
 * Adaptive Header Manager
 * Professional solution for responsive navigation
 */

class AdaptiveHeaderManager {
  constructor() {
    this.header = null;
    this.navMenu = null;
    this.headerInner = null;
    this.menuItems = [];
    this.originalFontSizes = new Map();
    this.isOptimizing = false;
    this.resizeTimeout = null;
    
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupHeader());
    } else {
      this.setupHeader();
    }
  }

  setupHeader() {
    this.header = document.querySelector('.header');
    this.navMenu = document.querySelector('.nav-menu');
    this.headerInner = document.querySelector('.header-inner');
    this.menuItems = Array.from(document.querySelectorAll('.nav-menu__item'));

    if (!this.header || !this.navMenu || !this.headerInner) {
      console.warn('Adaptive header: Required elements not found');
      return;
    }

    // Store original font sizes
    this.storeOriginalStyles();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initial optimization
    this.optimizeHeader();

  }

  storeOriginalStyles() {
    const menuLinks = document.querySelectorAll('.nav-menu__link');
    menuLinks.forEach((link, index) => {
      const computedStyle = window.getComputedStyle(link);
      this.originalFontSizes.set(index, {
        fontSize: computedStyle.fontSize,
        padding: computedStyle.padding
      });
    });
  }

  setupEventListeners() {
    // Optimize on window resize
    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.optimizeHeader();
      }, 100);
    });

    // Optimize on language change
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => this.optimizeHeader(), 500);
    });

    // Monitor for dynamic content changes
    if (window.MutationObserver) {
      const observer = new MutationObserver((mutations) => {
        let shouldOptimize = false;
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' || 
              (mutation.type === 'attributes' && mutation.attributeName === 'class')) {
            shouldOptimize = true;
          }
        });
        
        if (shouldOptimize && !this.isOptimizing) {
          setTimeout(() => this.optimizeHeader(), 100);
        }
      });

      observer.observe(this.navMenu, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      });
    }
  }

  optimizeHeader() {
    if (this.isOptimizing || window.innerWidth < 992) {
      return; // Skip if already optimizing or on mobile
    }

    this.isOptimizing = true;

    try {
      // Reset to original state first
      this.resetToOriginal();

      // Check if header overflows
      if (this.checkHeaderOverflow()) {
        this.applyOptimizations();
      }
    } catch (error) {
      // console.error('Header optimization error:', error);
    } finally {
      this.isOptimizing = false;
    }
  }

  checkHeaderOverflow() {
    const headerRect = this.headerInner.getBoundingClientRect();
    const headerWidth = headerRect.width;
    
    // Calculate total width of all children
    let totalChildWidth = 0;
    const children = Array.from(this.headerInner.children);
    
    children.forEach(child => {
      const childRect = child.getBoundingClientRect();
      totalChildWidth += childRect.width;
    });

    // Add gaps and margins
    const gaps = children.length * 15; // Approximate gap between elements
    
    return (totalChildWidth + gaps) > headerWidth;
  }

  resetToOriginal() {
    const menuLinks = document.querySelectorAll('.nav-menu__link');
    menuLinks.forEach((link, index) => {
      const original = this.originalFontSizes.get(index);
      if (original) {
        // Remove any inline styles added by optimization
        link.style.fontSize = '';
        link.style.padding = '';
        link.classList.remove('adaptive-compact', 'adaptive-ultra-compact');
      }
    });
  }

  applyOptimizations() {
    const viewportWidth = window.innerWidth;
    const menuLinks = document.querySelectorAll('.nav-menu__link');

    // Determine optimization level based on viewport and overflow
    let optimizationLevel = this.getOptimizationLevel(viewportWidth);

    // Apply optimization styles
    menuLinks.forEach((link, index) => {
      switch (optimizationLevel) {
        case 'compact':
          link.classList.add('adaptive-compact');
          break;
        case 'ultra-compact':
          link.classList.add('adaptive-ultra-compact');
          break;
        case 'minimal':
          link.classList.add('adaptive-minimal');
          break;
      }
    });

    // If still overflowing, hide less important items
    if (this.checkHeaderOverflow() && viewportWidth < 1200) {
      this.hideNonEssentialItems();
    }
  }

  getOptimizationLevel(viewportWidth) {
    if (viewportWidth >= 1400) {
      return 'normal';
    } else if (viewportWidth >= 1200) {
      return 'compact';
    } else if (viewportWidth >= 1000) {
      return 'ultra-compact';
    } else {
      return 'minimal';
    }
  }

  hideNonEssentialItems() {
    // Priority order: Home, Products, Contact are most important
    const priorityOrder = ['/', '/all-product', '/contact', '/blog', '/partner-countries', '/partners-agents'];
    const menuItems = Array.from(document.querySelectorAll('.nav-menu__item'));
    
    // Hide items starting from least important
    for (let i = menuItems.length - 1; i >= 3; i--) {
      const item = menuItems[i];
      if (item) {
        item.style.display = 'none';
        
        // Check if this fixes overflow
        if (!this.checkHeaderOverflow()) {
          break;
        }
      }
    }
  }

  // Method to handle language changes that might affect text length
  handleLanguageChange(newLanguage) {
    setTimeout(() => {
      this.optimizeHeader();
    }, 100);
  }

  // Method to manually trigger optimization
  refresh() {
    this.optimizeHeader();
  }

  // Debug method
  getHeaderInfo() {
    const headerRect = this.headerInner.getBoundingClientRect();
    let totalChildWidth = 0;
    const children = Array.from(this.headerInner.children);
    
    children.forEach(child => {
      totalChildWidth += child.getBoundingClientRect().width;
    });

    return {
      headerWidth: headerRect.width,
      totalChildWidth: totalChildWidth,
      overflow: totalChildWidth > headerRect.width,
      viewportWidth: window.innerWidth
    };
  }
}

// Add CSS classes for optimization levels
const style = document.createElement('style');
style.textContent = `
  .nav-menu__link.adaptive-compact {
    font-size: 13px !important;
    padding: 10px 6px !important;
  }
  
  .nav-menu__link.adaptive-ultra-compact {
    font-size: 12px !important;
    padding: 8px 4px !important;
  }
  
  .nav-menu__link.adaptive-minimal {
    font-size: 11px !important;
    padding: 8px 2px !important;
  }
`;
document.head.appendChild(style);

// Initialize adaptive header
const adaptiveHeader = new AdaptiveHeaderManager();

// Expose to global scope for debugging and manual control
window.AdaptiveHeader = adaptiveHeader;

// Listen for language changes
document.addEventListener('languageChanged', (e) => {
  if (adaptiveHeader && e.detail && e.detail.language) {
    adaptiveHeader.handleLanguageChange(e.detail.language);
  }
});
