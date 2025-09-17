// Initialize i18next for client-side translations
window.i18next = window.i18next || {
  t: function(key, options = {}) {
    // Simple translation function - in real implementation this would use i18next library
    // For now, return the key as fallback
    return key;
  }
};

// Language switching functionality - Updated to use unified API
function changeLanguage(lng) {
  // Set cookie immediately for better UX
  document.cookie = `i18next=${lng}; path=/; max-age=${60 * 60 * 24 * 30}`;
  document.cookie = `selectedLanguage=${lng}; path=/; max-age=${60 * 60 * 24 * 30}`;
  
  // Use unified API route instead of old route
  window.location.href = `/api/language/${lng}`;
}

// Update current language display
function updateCurrentLanguage() {
  const cookies = document.cookie.split(';');
  let currentLang = 'uz'; // default
  
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'i18next') {
      currentLang = value;
      break;
    }
  }
  
  const langElements = document.querySelectorAll('#current-lang');
  langElements.forEach(el => {
    el.textContent = currentLang.toUpperCase();
  });
  
  // Update active language in dropdown
  const langItems = document.querySelectorAll('.language-select__options .list-group-item');
  langItems.forEach(item => {
    item.classList.remove('active');
    const href = item.getAttribute('href');
    if (href && href.includes(`/api/language/${currentLang}`)) {
      item.classList.add('active');
    }
  });
}

// Language selector click functionality
function initLanguageSelector() {
  const languageSelectors = document.querySelectorAll('.language-select');
  
  languageSelectors.forEach(selector => {
    // Click to toggle dropdown
    selector.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Close other dropdowns
      languageSelectors.forEach(otherSelector => {
        if (otherSelector !== selector) {
          otherSelector.classList.remove('active');
        }
      });
      
      // Toggle current dropdown
      selector.classList.toggle('active');
    });
    
    // Prevent dropdown from closing when clicking inside
    const dropdown = selector.querySelector('.language-select__options');
    if (dropdown) {
      dropdown.addEventListener('click', function(e) {
        e.stopPropagation();
      });
      
      // Remove any hover event listeners that might close the dropdown
      dropdown.addEventListener('mouseenter', function(e) {
        e.stopPropagation();
      });
      
      dropdown.addEventListener('mouseleave', function(e) {
        e.stopPropagation();
      });
    }
    
    // Remove any existing hover event listeners
    selector.removeEventListener('mouseenter', null);
    selector.removeEventListener('mouseleave', null);
    
    // Prevent hover events from affecting dropdown state
    selector.addEventListener('mouseenter', function(e) {
      e.stopPropagation();
    });
    
    selector.addEventListener('mouseleave', function(e) {
      e.stopPropagation();
      // Do NOT close dropdown on mouse leave
    });
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.language-select')) {
      languageSelectors.forEach(selector => {
        selector.classList.remove('active');
      });
    }
  });
  
  // Close dropdown on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      languageSelectors.forEach(selector => {
        selector.classList.remove('active');
      });
    }
  });
  
  // Prevent any global hover handlers from interfering
  document.addEventListener('mouseover', function(e) {
    if (e.target.closest('.language-select__options')) {
      e.stopPropagation();
    }
  });
}

// Remove any existing hover-based dropdown functionality
function removeHoverDropdowns() {
  // Remove any CSS hover rules that might interfere
  const style = document.createElement('style');
  style.textContent = `
    .language-select:hover .language-select__options,
    .language-select__options:hover {
      display: none !important;
      opacity: 0 !important;
    }
    .language-select.active .language-select__options {
      display: block !important;
      opacity: 1 !important;
    }
  `;
  document.head.appendChild(style);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  removeHoverDropdowns();
  updateCurrentLanguage();
  initLanguageSelector();
  applyDarkModeStyles();
  observeThemeChanges();
  
  // Additional protection against hover interference
  setTimeout(() => {
    const selectors = document.querySelectorAll('.language-select');
    selectors.forEach(selector => {
      // Force remove any hover event listeners
      const newSelector = selector.cloneNode(true);
      selector.parentNode.replaceChild(newSelector, selector);
    });
    // Re-initialize after cloning
    initLanguageSelector();
    applyDarkModeStyles();
  }, 100);
});

// Language display names
const languageNames = {
  'uz': 'O\'zbekcha',
  'en': 'English', 
  'ru': 'Русский',
  'tr': 'Türkçe',
  'fa': 'فارسی',
  'zh': '中文'
};

// Get language display name
function getLanguageDisplayName(lng) {
  return languageNames[lng] || lng.toUpperCase();
}

// Enhanced dark mode detection and styling
function applyDarkModeStyles() {
  const isDarkMode = document.body.classList.contains('dark-version') || 
                     document.documentElement.classList.contains('dark-version');
  
  const selectors = document.querySelectorAll('.language-select');
  selectors.forEach(selector => {
    const currentLangEl = selector.querySelector('#current-lang');
    
    if (isDarkMode) {
      selector.classList.add('dark-mode-selector');
      if (currentLangEl) {
        currentLangEl.style.color = '#e2e8f0';
      }
    } else {
      selector.classList.remove('dark-mode-selector');
      if (currentLangEl) {
        currentLangEl.style.color = '#1e293b';
      }
    }
  });
}

// Monitor theme changes
function observeThemeChanges() {
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'attributes' && 
          (mutation.attributeName === 'class' || mutation.attributeName === 'data-theme')) {
        applyDarkModeStyles();
      }
    });
  });
  
  observer.observe(document.body, { attributes: true });
  observer.observe(document.documentElement, { attributes: true });
}