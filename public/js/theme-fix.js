/**
 * Theme Fix for Login Pages
 * Handles theme switching based on localStorage
 */

class ThemeFix {
  constructor() {
    this.init();
  }

  init() {
    
    // Get current theme from localStorage
    const savedTheme = localStorage.getItem('dashboard-theme');
    
    // Set appropriate theme
    this.setTheme(savedTheme);
    
    // Listen for theme changes from other tabs
    window.addEventListener('storage', (e) => {
      if (e.key === 'dashboard-theme') {
        this.setTheme(e.newValue);
      }
    });
    
    // Listen for theme toggle if button exists
    this.setupThemeToggle();
  }

  setTheme(theme) {
    const body = document.body;
    const html = document.documentElement;
    
    // Remove existing theme classes
    body.classList.remove('theme-light', 'theme-dark');
    html.removeAttribute('data-theme');
    
    // Use consistent theme logic with public pages and dashboard
    const targetTheme = theme || 'light';
    
    
    // Apply theme exactly like public pages
    html.setAttribute('data-theme', targetTheme);
    
    // Fix input colors specifically for login/register forms
    this.fixInputColors(targetTheme);
    
  }

  fixInputColors(theme) {
    // Create or update theme-specific styles
    let themeStyle = document.getElementById('theme-fix-styles');
    
    if (!themeStyle) {
      themeStyle = document.createElement('style');
      themeStyle.id = 'theme-fix-styles';
      document.head.appendChild(themeStyle);
    }
    
    // Use same color system as public pages (CSS variables based)
    const themeStyles = `
      /* Login/Register input colors consistent with home page */
      .common-input {
        color: hsl(var(--black)) !important;
        background-color: transparent !important;
        border-color: hsl(var(--border-color)) !important;
      }
      
      .common-input::placeholder {
        color: hsl(var(--black-three)) !important;
      }
      
      .common-input:focus {
        color: hsl(var(--black)) !important;
        border-color: hsl(var(--primary)) !important;
      }
      
      /* Account form specific fixes */
      .account .common-input {
        color: hsl(var(--black)) !important;
        background-color: transparent !important;
        border-color: hsl(var(--border-color)) !important;
      }
      
      .account .common-input::placeholder {
        color: hsl(var(--black-three)) !important;
      }
      
      .account .common-input:focus {
        color: hsl(var(--black)) !important;
        border-color: hsl(var(--primary)) !important;
      }
    `;
    
    themeStyle.textContent = themeStyles;
    
   }

  setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const currentTheme = localStorage.getItem('dashboard-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        
        localStorage.setItem('dashboard-theme', newTheme);
        this.setTheme(newTheme);
      });
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ThemeFix();
  });
} else {
  new ThemeFix();
}

// Export for potential use
window.ThemeFix = ThemeFix; 
