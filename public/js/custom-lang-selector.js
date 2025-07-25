/**
 * Clean Language Selector
 * Simple, reliable dropdown functionality
 */

class CustomLanguageSelector {
  constructor() {
    this.selectors = [];
    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupSelectors());
    } else {
      this.setupSelectors();
    }
  }

  setupSelectors() {
    const selectorElements = document.querySelectorAll('.custom-lang-selector');
    
    selectorElements.forEach(element => {
      this.setupSelector(element);
    });

    // Global click handler to close dropdowns
    document.addEventListener('click', (e) => this.handleGlobalClick(e));
    
    // Escape key handler
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));

    console.log(`Initialized ${selectorElements.length} language selectors`);
  }

  setupSelector(element) {
    const langBtn = element.querySelector('.lang-btn');
    const dropdown = element.querySelector('.lang-dropdown');
    const options = element.querySelectorAll('.lang-option');

    if (!langBtn || !dropdown) {
      console.warn('Language selector missing required elements');
      return;
    }

    // Store reference
    this.selectors.push({ element, langBtn, dropdown, options });

    // Button click handler
    langBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleDropdown(element);
    });

    // Option click handlers
    options.forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        // Allow normal navigation
      });
    });

    // Prevent dropdown clicks from bubbling
    dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  toggleDropdown(targetElement) {
    const isActive = targetElement.classList.contains('active');

    // Close all dropdowns first
    this.closeAllDropdowns();

    // If this one wasn't active, open it
    if (!isActive) {
      targetElement.classList.add('active');
    }
  }

  closeAllDropdowns() {
    this.selectors.forEach(selector => {
      selector.element.classList.remove('active');
    });
  }

  handleGlobalClick(e) {
    if (!e.target.closest('.custom-lang-selector')) {
      this.closeAllDropdowns();
    }
  }

  handleKeyDown(e) {
    if (e.key === 'Escape') {
      this.closeAllDropdowns();
    }
  }
}

// Initialize
const customLangSelector = new CustomLanguageSelector();

// Expose for debugging
window.CustomLanguageSelector = customLangSelector;