/**
 * Login Page Loader Fix
 * Ensures preloader is properly hidden on login page
 */

// Immediate execution to hide loader as fast as possible
(function() {
  'use strict';
  
  // Add login page class to body
  document.body.classList.add('login-page');
  
  // Function to hide loader with multiple fallbacks
  function hideLoaderImmediate() {
    const loaderMask = document.querySelector('.loader-mask');
    
    if (loaderMask) {
      // Method 1: Add CSS classes for smooth transition
      loaderMask.classList.add('loader-fadeout');
      
      // Method 2: Directly set styles
      loaderMask.style.opacity = '0';
      loaderMask.style.transition = 'opacity 0.3s ease';
      
      // Method 3: Remove after animation
      setTimeout(() => {
        loaderMask.classList.add('loader-hidden');
        loaderMask.style.visibility = 'hidden';
        loaderMask.style.pointerEvents = 'none';
      }, 100);
      
      // Method 4: Force remove after longer timeout
      setTimeout(() => {
        loaderMask.classList.add('loader-removed');
        loaderMask.style.display = 'none';
      }, 400);
      
    } else {
      console.warn('Loader mask not found');
    }
  }
  
  // Execute immediately if DOM is already loaded
  if (document.readyState === 'loading') {
    // If still loading, wait for DOM
    document.addEventListener('DOMContentLoaded', hideLoaderImmediate);
  } else {
    // DOM is already loaded, execute immediately
    hideLoaderImmediate();
  }
  
  // Backup execution after a short delay
  setTimeout(hideLoaderImmediate, 50);
  
  // Emergency fallback
  setTimeout(() => {
    const loaderMask = document.querySelector('.loader-mask');
    if (loaderMask && loaderMask.style.display !== 'none') {
      loaderMask.style.display = 'none !important';
    }
  }, 1000);
  
  // Also hide on window load (final fallback)
  window.addEventListener('load', () => {
    setTimeout(hideLoaderImmediate, 100);
  });
  
  // Override main.js preloader if it conflicts
  window.addEventListener('DOMContentLoaded', () => {
    // Disable any existing preloader timers
    const originalSetTimeout = window.setTimeout;
    let timeoutIds = [];
    
    // Track timeouts that might be related to preloader
    window.setTimeout = function(callback, delay) {
      const timeoutId = originalSetTimeout.call(this, function() {
        // Check if this timeout is trying to show loader
        const callbackString = callback.toString();
        if (callbackString.includes('loader') || callbackString.includes('preloader')) {
          return;
        }
        callback.apply(this, arguments);
      }, delay);
      
      timeoutIds.push(timeoutId);
      return timeoutId;
    };
    
    // Restore original setTimeout after a delay
    setTimeout(() => {
      window.setTimeout = originalSetTimeout;
    }, 2000);
  });
  
})();